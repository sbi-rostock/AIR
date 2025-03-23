import time
import re
from collections import defaultdict, deque
import numpy as np
from scipy import stats
import hashlib
import functools
import requests
from scipy import sparse

def trim_node_name(name):
    return name.lower().replace("hsa-", "").replace("-5p", "").replace("-3p", "").replace("mir-", "mir")
        
class Entity:
    def __new__(cls, model, node):
        _hash = hashlib.sha256(trim_node_name(node.name).encode()).hexdigest()

        entity = model.entities.get(_hash)
        if entity:
            entity.origins.update(node.origins)
            entity.nodes.add(node)
            return entity
        entity = super(Entity, cls).__new__(cls)
        model.entities[_hash] = entity
        entity.hash = int(_hash, 16)
        entity.hash_string = str(_hash)
        return entity
    
    def __init__(self, model, node):       
        if hasattr(self, 'name'):
            return
        self.nodes = set([node])
        self.name = node.name
        self.model = model
        self.origins = set(node.origins)
        
    @property
    def fullname(self):
        return self.name


class Node:

    def __new__(cls, model, name, nodetype = "Protein", states: tuple = (), subunits = (), family = False, compartment = "", initial = False, hypothetical = False, storage = 0, delay = 0, decay = 1, lower_limit = None, upper_limit = None, origins = [], map_ids = [], positions = {}, submap = False, references = []):
        if nodetype.lower() == "mirna":
            nodetype = "RNA"
        if nodetype.lower() == "phenotype":
            compartment = ""
 
        _hash = hashlib.sha256(str((
            trim_node_name(name) if len(subunits) == 0 else tuple(sorted(subunits)),
            nodetype.lower(), 
            compartment, 
            states, 
            hypothetical
        )).encode()).hexdigest()
    
        node = model.nodes.get(_hash)

        if node:
            node.origins.update(origins)
            for origin in origins:
                if origin in node.aliases_in_map:
                    node.aliases_in_map[origin].update(map_ids)
                else:
                    node.aliases_in_map[origin] = set(map_ids)
            node.references.update(references)
            if storage > node.storage:
                node.storage = storage
            if upper_limit:
                if not node._upper_limit or (node._upper_limit and upper_limit > node._upper_limit):
                    node._upper_limit = upper_limit
            if lower_limit:
                if not node._lower_limit or (node._lower_limit and lower_limit > node._lower_limit):
                    node._lower_limit = lower_limit
            if delay > node.delay:
                node.delay = int(delay)
            if decay != node.decay and decay != 1:
                node.decay = int(decay)
            if submap:                
                node.submap = submap
            for file, pos in positions.items():
                if file not in node.positions:
                    node.positions[file] = set(pos)
                else:
                    node.positions[file].update(pos)
            return node
        
        node = super(Node, cls).__new__(cls)
        
        model.nodes[_hash] = node
        node.hash = int(_hash, 16)
        node.hash_string = str(_hash)
        return node
        
    def __init__(self, model, name, nodetype = "Protein", states: tuple = (), subunits = (), family = False, compartment = "", initial = False, hypothetical = False, storage = 0, delay = 0, decay = 1, lower_limit = None, upper_limit = None, origins = [], map_ids = [], positions = {}, submap = False, references = []):   
        
        if hasattr(self, 'name'):
            return
        
        self.model = model
        self.name = name
        self.type = nodetype.lower()
        self.compartment = compartment.lower()
        self.incoming = set()
        self.outgoing = set()
        self.modifications = set()
        self.states = tuple(sorted(states))
        self.subunits = subunits
        self.parents = set()
        for subunit in subunits:
            subunit.parents.add(self)
        self.origins = set(origins)
        self.aliases_in_map = {origin:set(map_ids) for origin in origins}
        self.minerva_ids = []

        self.family =  family  
        self.positions = positions
        self.submap = submap
        self.hypothetical = hypothetical
        self.references = set(references)
        self.minerva_references = set()
        self.signals = []
        self.starting_signal = 0

        self.initial_activity = 0
        self.storage = storage
        self._lower_limit = lower_limit
        self._upper_limit = upper_limit
        self.delay = int(delay)
        self.decay = int(decay)
        self.rule = None
        self.consumption = None
        self.refill = None
        self.refill_sources = set()
        self.boolean_targets = []
        self.default_state = True

        self.is_currency_node = self.type.lower() == "simple_molecule" and (self.hypothetical or self.name.lower() in ["atp", "adp", "amp", "nadh", "nad+", "nad", "nadph", "nadp+", "nadp", "fad", "fadh", "fadh2", "fad+", "camp", "phosphate", "h2o", "udp", "utp", "co2", "coa", "o2"])
        
        self.perturbation = 0
        
        self.index = len(model.nodes) - 1
        
        self.active.cache_clear()
        self.entity = Entity(model, self)
        
    def __eq__(self, other):
        if self.__class__ is not other.__class__:
            return False
        return self.hash == other.hash

    def __hash__(self):
        return self.hash
       
    def __getstate__(self):
        state = self.__dict__.copy()
        del state['rule']  # Don't serialize the rule attribute
        return state

    def __setstate__(self, state):
        self.__dict__.update(state)
        self.update_rule()  
        
    def __gt__(self, node2):
        if len(self.subunits) == 0 and len(node2.subunits) == 0:
            return (self.name > node2.name) if self.name != node2.name else (self.compartment.lower() > node2.compartment.lower()) if self.compartment.lower() != node2.compartment.lower() else  (",".join(self.states) > ",".join(node2.states))
            
        elif self.subunits == node2.subunits:
            return (self.compartment.lower() > node2.compartment.lower()) if self.compartment.lower() != node2.compartment.lower() else (",".join(self.states) > ",".join(node2.states))
        else:
            return self.subunits > node2.subunits
    
    @property
    def type_class(self):
        if self.type.lower() in ["protein", "receptor", "tf"]:
            return "PROTEIN"
        if "phenotype" in self.type.lower():
            return "PHENOTYPE"
        else:
            return self.type
    

    @property
    def lower_limit(self): 
        return self._lower_limit if self._lower_limit else 0
    @property
    def upper_limit(self): 
        return self._upper_limit if self._upper_limit else self.storage
        
    @property
    def string_index(self):
        return "m" + str(self.index)
    
    def numexpr_index(self, probabilistic = False):
        # return self.string_index + "_" + ("true" if probabilistic else "false")
        return "(" + "node" + str(self.index) + ".active(probabilistic=" + ("True" if probabilistic else "False") + ", source=source_node))"

    @property
    def fullname(self):
        return self.name + "(" + self.type + (", " + self.compartment if self.compartment else "") + ")" + "".join(["_" + state for state in self.states]) + ("(hypothetical)" if self.hypothetical else "") 
    @property
    def fullname_printable(self):
        return self.name + " (" + self.type.replace("_", " ").capitalize() + (", " + (self.compartment.capitalize() if self.compartment else "Blood")) + ")" + ((" (" + "".join([", " + state.capitalize() for state in self.states]) + ")") if self.states else "") + (" (currency)" if self.hypothetical else "")
    
    @property
    def minerva_name(self):
        return self.name + " (" + (self.compartment if self.compartment else "Blood") + ")"
       
    @property
    def in_degree(self):
        return len([edge for edge in self.incoming if not edge.perturbed]) + len(sum([edge.is_catalyzed for edge in self.outgoing if not edge.perturbed], []))
    @property
    def out_degree(self):
        return len([edge for edge in self.outgoing if not edge.perturbed]) + len([modification for modification in self.modifications if not modification.perturbed])
    
    @property
    def incoming_nodes(self):
        return set().union(*[edge.all_nodes for edge in self.incoming]) if self.incoming else set()
    
    @property
    def outgoing_nodes(self):
        return set().union(*[edge.all_nodes for edge in [self.outgoing] + [modification.edge for modification in self.modifications]]) if (self.outgoing or self.modifications) else set()
        
    @property
    def all_connected_nodes(self):
        return set().union({node for edge in self.all_edges for node in edge.all_nodes}, self.subunits, self.parents)
    
    @property
    def all_edges(self):
        return set().union(self.incoming, self.outgoing, [modification.edge for modification in self.modifications])
    
    @property
    def siblings(self):
        return list(self.entity.nodes)
    
    def extended_subunit_list(self):
        if self.family:
            return sum([subunit.extended_subunit_list() for subunit in self.subunits], [])
        else:
            return [self]
        
    def as_string(self, delimiter = " - "):
        return delimiter.join([
            self.name if len(self.subunits) == 0 else "[" + ",".join([subunit.name for subunit in self.subunits]) + "]",
            self.type,
            self.compartment,
            "[" + ",".join(self.states) + "]",
        ])

    def fits_origins(self, origin_filter):
        return True if not origin_filter or any([origin in origin_filter for origin in self.origins]) else False
    
    @property
    def simple_molecule(self):
        return self.type.lower() == "simple_molecule"
    
    #From Biohackathon2023
    def addReactomeSubunits(self, recursive = False):
        hsa_reactome_ids = [reference.replace("reactome:", "") for reference in self.references if reference.startswith("reactome:R-HSA")]
        if hsa_reactome_ids:
            res = requests.get('https://reactome.org/ContentService/data/complex/' + hsa_reactome_ids[0] + '/subunits?excludeStructures=false')
            if res.status_code == 200:
                subunits = res.json()
                for subunit in subunits:
                    name = subunit["name"][0]
                    node = Node(self.model, name, nodetype = self.type, compartment = self.compartment, origins = list(self.origins), submap = self.submap, references = [subunit["stId"]])
                    self.subunits += (node,)
                    if recursive:
                        node.addReactomeSubunits(recursive = recursive)

    
    
# Topology
         
    def shortest_path_length(self, adjacency_list):
        """
        Calculate shortest path lengths with highly optimized performance.
        """
        # Pre-allocate result dictionary
        SPs = {}
        
        # Use a set for visited nodes (faster lookups)
        visited = {self}  # Use set literal for faster initialization
        
        # Use a more efficient queue implementation
        queue = deque([(self, 1, 1)])

        while queue:
            node, sp_len, sp_type = queue.popleft()
            SPs[node] = sp_len * sp_type
            
            # Skip if node not in adjacency list
            if node not in adjacency_list:
                continue
            
            # Get neighbors once
            neighbors = adjacency_list[node]
            if not neighbors:
                continue
            
            # Process all neighbors in a batch
            # Use a list comprehension for better performance
            new_items = [(neighbor, sp_len + 1, neighbor_type * sp_type) 
                        for neighbor, neighbor_type in neighbors.items() 
                        if neighbor not in visited and neighbor_type != 0]
            
            # Add all new items to visited set at once
            visited.update(item[0] for item in new_items)
            
            # Add all new items to queue at once
            queue.extend(new_items)
        
        return SPs
    
    def shortest_paths(self, adjacency_list):
        
        paths = []
        visited = set([self])
        queue = deque([(self, [self])])

        while queue:
            node, path = queue.popleft()
            if len(path) > 1: 
                paths.append(reversed(path))
            if node not in adjacency_list or not adjacency_list[node]:
                continue
            for neighbor,skipped_nodes in adjacency_list[node].items():
                if neighbor not in visited:
                    visited.add(neighbor)
                    if skipped_nodes:
                        for skipped_node in skipped_nodes:
                            queue.append((neighbor, path + [skipped_node, neighbor]))
                            queue.append((skipped_node, path + [skipped_node]))
                    else:
                        queue.append((neighbor, path + [neighbor]))

        return paths


    def all_paths(self, reverse = False, submap_specific = True, shortest_paths = False):
               
        origin_filter = self.origins if submap_specific else []
        self.model.perturb_edges(origin_filter = origin_filter)
        
        visited = set()
        
        def recursive_paths(start, path=(), pathtype = 1):
            if start in path:
                return {}
            path = path  + (start,)
            paths = {path: pathtype}
            for edge in (start.incoming if reverse else start.outgoing):
                if not edge.perturbed:
                    for node in (edge.sources if reverse else edge.targets):
                        if node not in path:
                            if edge.modifications:
                                for modification in edge.modifications:
                                    if not modification.perturbed and modification.is_catalysis:
                                        paths = {**paths, **recursive_paths(node, path = path + tuple(modification.modifiers), pathtype = pathtype * modification.modification_on_target_int)}
                                    else:
                                        for modifier in modification.modifiers:
                                            paths = {**paths, **recursive_paths(modifier, path = path, pathtype = pathtype * modification.modification_on_target_int)}
                            else:
                                paths = {**paths, **recursive_paths(node, path = path, pathtype = pathtype * edge.edge_type_int)}
            if reverse:
                for edge in [edge for edge in start.outgoing if not origin_filter or any([origin in origin_filter for origin in edge.origins])]:
                    for modification in edge.modifications: 
                        if not modification.perturbed and modification.is_catalysis:
                            for modifier in modification.modifiers:
                                paths = {**paths, **recursive_paths(modifier, path = path, pathtype = pathtype * -1)}
            else:
                for modification in self.modifications:
                    if not modification.perturbed and modification.modification.is_catalysis:
                        for source in modification.edge.sources:
                            paths = {**paths, **recursive_paths(source, path = path, pathtype = pathtype * modification.modification_int)}
            return paths
        
        if reverse:
            return {tuple(reversed(path)):_type for path,_type in recursive_paths(self).items()}
        else:
            return recursive_paths(self)
        
        self.model.perturb_edges()

# 2DEA
    def get_influence_scores(self, adjacency_list, node_weights={}):
        """
        Calculate influence scores using matrix operations for better performance.
        
        This implementation uses sparse matrices to represent the network and computes
        influence scores through efficient matrix operations rather than explicit path
        exploration.
        """
        # Get all nodes in the adjacency list
        all_nodes = set(adjacency_list.keys())
        for node, neighbors in adjacency_list.items():
            all_nodes.update(neighbors.keys())
            for _, skipped_nodes in neighbors.items():
                if skipped_nodes:
                    all_nodes.update(skipped_nodes)
        
        # Create a mapping from nodes to indices
        node_to_idx = {node: i for i, node in enumerate(all_nodes)}
        idx_to_node = {i: node for node, i in node_to_idx.items()}
        n = len(all_nodes)
        
        # Create the self index
        self_idx = node_to_idx[self]
        
        # Create a sparse adjacency matrix
        # Regular edges
        rows, cols, data = [], [], []
        
        # Add regular edges
        for source, targets in adjacency_list.items():
            source_idx = node_to_idx[source]
            for target, skipped in targets.items():
                target_idx = node_to_idx[target]
                rows.append(source_idx)
                cols.append(target_idx)
                data.append(1.0)  # Weight for direct edge
                
                # Add edges for skipped nodes
                if skipped:
                    for skipped_node in skipped:
                        skipped_idx = node_to_idx[skipped_node]
                        # Add edge from source to skipped node
                        rows.append(source_idx)
                        cols.append(skipped_idx)
                        data.append(0.5)  # Lower weight for skipped node
                        
                        # Add edge from skipped node to target
                        rows.append(skipped_idx)
                        cols.append(target_idx)
                        data.append(0.5)  # Lower weight for skipped node
        
        # Create the sparse adjacency matrix
        adj_matrix = sparse.csr_matrix((data, (rows, cols)), shape=(n, n))
        
        # Compute influence scores using personalized PageRank
        # This is much more efficient than explicit path exploration
        alpha = 0.85  # Damping factor
        max_iter = 100
        tol = 1e-6
        
        # Initialize personalized vector (focused on self node)
        personalization = np.zeros(n)
        personalization[self_idx] = 1.0
        
        # Initialize the PageRank vector
        pr = np.ones(n) / n
        
        # Normalize the adjacency matrix by row
        rowsum = np.array(adj_matrix.sum(axis=1)).flatten()
        rowsum[rowsum == 0] = 1  # Avoid division by zero
        D_inv = sparse.diags(1.0 / rowsum)
        M = D_inv.dot(adj_matrix)
        
        # Power iteration method for PageRank
        for _ in range(max_iter):
            pr_prev = pr.copy()
            pr = alpha * M.dot(pr) + (1 - alpha) * personalization
            
            # Check convergence
            err = np.abs(pr - pr_prev).sum()
            if err < tol:
                break
        
        # Create influence scores dictionary
        influence_scores = {}
        for i in range(n):
            if i != self_idx:  # Skip self node
                node = idx_to_node[i]
                influence_scores[node] = pr[i]
        
        # Apply node weights
        if not node_weights:
            node_weights = self.signal_effects(reverse=True)
        
        # Normalize scores
        max_score = max(influence_scores.values()) if influence_scores else 1
        
        # Create the final result
        result = {}
        if max_score > 0:
            for node, score in influence_scores.items():
                weight = node_weights.get(node, 1)
                result[node] = score * weight / max_score
        
        return result

    def old_get_influence_scores(self, adjacency_list, node_weights={}):
        """
        Calculate influence scores for this node in the network with optimized performance.
        """
        # Initialize data structures
        influence_scores = {}
        paths_with_node = {}
        nodes_on_paths = {}
        
        # Use a more efficient exploration strategy
        def explore_paths(max_paths=1000):
            import random
            
            # Use a list instead of a set for visited_nodes in small paths
            # This avoids expensive hash operations for small collections
            paths_to_explore = [(self, [self])]
            total_paths = 0
            paths_found = 0
            
            # Pre-allocate arrays for better performance
            # This avoids repeated memory allocations
            path_nodes = []  # Reuse this list for path nodes
            
            while paths_to_explore and paths_found < max_paths:
                # Pop from the end instead of using random selection
                # This is much faster and still provides good diversity
                current_node, current_path = paths_to_explore.pop()
                
                # If no outgoing edges or we've reached a leaf, count this as a complete path
                if current_node not in adjacency_list or not adjacency_list[current_node]:
                    paths_found += 1
                    total_paths += 1
                    
                    # Update path counts for each node in the path
                    # Use a set to track nodes we've already processed in this path
                    # to avoid duplicate updates
                    processed_nodes = set()
                    
                    for node in current_path:
                        if node in processed_nodes:
                            continue
                        processed_nodes.add(node)
                        
                        paths_with_node[node] = paths_with_node.get(node, 0) + 1
                        
                        # Each node on this path is connected to all other nodes on the path
                        if node not in nodes_on_paths:
                            nodes_on_paths[node] = set()
                        
                        # Add all other nodes in the path to this node's connections
                        # But avoid adding duplicates by using a set operation
                        node_connections = nodes_on_paths[node]
                        for other_node in current_path:
                            if other_node is not node:  # Use 'is' for identity check (faster)
                                node_connections.add(other_node)
                    continue
                
                # Get outgoing edges - convert to list once to avoid repeated dict.items() calls
                neighbors = list(adjacency_list[current_node].items())
                
                # If too many neighbors, sample a subset to avoid explosion
                # But use a fixed limit to avoid random sampling overhead
                if len(neighbors) > 5:
                    neighbors = neighbors[:5]  # Take first 5 instead of random sample
                
                # Add new paths to explore
                for neighbor, skipped_nodes in neighbors:
                    # Avoid cycles - use linear search for small paths
                    if neighbor in current_path:
                        continue
                        
                    if skipped_nodes:
                        for skipped_node in skipped_nodes:
                            if skipped_node not in current_path:
                                # Add path with skipped node
                                # Use list extension instead of concatenation to avoid creating new lists
                                new_path = current_path.copy()
                                new_path.append(skipped_node)
                                new_path.append(neighbor)
                                paths_to_explore.append((neighbor, new_path))
                    else:
                        # Direct path to neighbor
                        # Use list extension instead of concatenation to avoid creating new lists
                        new_path = current_path.copy()
                        new_path.append(neighbor)
                        paths_to_explore.append((neighbor, new_path))
            
            return total_paths
        
        # Run the exploration
        total_paths = explore_paths()
        
        if not total_paths:
            return {}
        
        # Calculate influence scores
        for node, count in paths_with_node.items():
            if node is not self:  # Use 'is' for identity check (faster)
                # Combine both metrics:
                # 1. How many paths from self this node appears on
                # 2. How many other nodes are on paths with this node
                path_ratio = count / total_paths
                node_connections = nodes_on_paths.get(node, set())
                connection_ratio = len(node_connections) / (len(paths_with_node) - 1) if len(paths_with_node) > 1 else 0
                influence_scores[node] = path_ratio + connection_ratio
        
        # Use node weights if provided, otherwise default to signal effects
        if not node_weights:
            node_weights = self.signal_effects(reverse=True)
        
        # Normalize scores
        max_score = max(influence_scores.values()) if influence_scores else 1
        if max_score:
            # Create the result dictionary in one go to avoid repeated __hash__ calls
            result = {}
            for node, score in influence_scores.items():
                weight = node_weights.get(node, 1)
                result[node] = score * weight / max_score
            return result
        else:
            return {}

# Boolean

    # creating a lambda function for self.rule 
    # self.refill and self.consumption are very special cases and not important for the base principle
    def update_rule(self):
        self.boolean_expr = ""
        self.always_update = False
        
        if self.subunits and self.family:
            self.rule = lambda: self.model.false_template
            self.consumption = lambda: self.model.false_template
        else:
            
            nodes = list(self.model.nodes.values())                
            def map_numexpr_nodes(expr_string):
                pattern = r"node(\d+)."
                matches = re.findall(pattern, expr_string)
                # Create a dictionary to store node-boolean associations
                mapping = {"node"+match: nodes[int(match)] for match in matches}  
                return mapping

            edge_lambdas = {1:[], -1:[]}
            refills = []            
            self.refill_sources = set()
            for edge in self.incoming:
                edge_type,edge_lambda = edge.as_numexpr_string()
                if edge_lambda and edge_type != 0:
                    if edge.refill:
                        self.refill_sources.update(edge.basesources)
                        refills.append(edge_lambda)
                    else:
                        edge_lambdas[edge_type].append(edge_lambda)
            if len(refills) > 0:
                expr_string = " | ".join(refills)
                node_mapping = map_numexpr_nodes(expr_string)
                node_mapping["source_node"] = self
                self.refill = eval("lambda: " + expr_string, node_mapping)
            else:
                self.refill = None
            # edges that reduce the sotrage of a source element
            if self.storage:
                consumptions = []
                for edge in [edge for edge in self.outgoing if edge.consumption]:
                    edge_type,edge_lambda = edge.as_numexpr_string()
                    if edge_lambda and edge_type != 0:
                        consumptions.append((edge_lambda, edge.consumption)) 
                if len(consumptions) > 0:
                    expr_string = "sum([" + " , ".join([str(consumption) + " * " + edge_lambda for edge_lambda, consumption in consumptions]) + "])"
                    node_mapping = map_numexpr_nodes(expr_string)
                    node_mapping["source_node"] = self
                    self.consumption = eval("lambda: " + expr_string, node_mapping)
                else:
                    self.consumption = None
                    
            # create a string that performs logical operations on the node.active() (returns a  1D (reshaped from a 2D grid) boolean np array) for incoming nodes
            # sample string: "~ (node206.active() | node187.active()) & ((node167.active() & node167.active()) |  node207.active())"
            # nodes in the string are then mapped to node objects by the node.index
            numexpr_string = ""
            if len(edge_lambdas[-1]) > 0:
                numexpr_string += "~(" + " | ".join([expr for expr in edge_lambdas[-1]]) + ")"
            if len(edge_lambdas[1]) > 0:
                if numexpr_string:
                    numexpr_string += " & "
                numexpr_string += "(" + " | ".join(edge_lambdas[1]) + ")"
            self.boolean_expr = numexpr_string
            if numexpr_string:
                node_mapping = map_numexpr_nodes(numexpr_string)
                node_mapping["source_node"] = self
                for node in node_mapping.values():
                    node.boolean_targets.append(self)
                # converting the string into a lambda function
                self.rule = eval("lambda: " + numexpr_string, node_mapping)
            else:
                self.rule = lambda: (self.model.true_template if self.refill == None and self.default_state else self.model.false_template)
                
            if self.delay or self.storage or self.refill or self.consumption or ("probabilistic=True" in numexpr_string):
                self.always_update = True
        
    
    def perturb(self, perturbation):        

        # track nodes with changes in their activities
        # a comparison of whether there has been an actual change in self.perturbation is currently omitted as it is probably more extensive
        self.active.cache_clear()
        self.model.nodes_with_changes.add(self)  
        
        # self.perturbation is 0 by default (meaning no peturbation in all positions) to save storage
        # only converted to a 1D (reshaped from a 2D grid) np array when there is a perturbation
        if not isinstance(self.perturbation, np.ndarray):
            if not isinstance(perturbation, np.ndarray):
                if perturbation == 0:
                    self.perturbation = 0
                    return
            self.perturbation = self.model.zero_template.copy()  

        self.perturbation[:] = perturbation
        
    def perturb_at(self, perturbation, pos = (0,0)):
        
        self.active.cache_clear()
        self.model.nodes_with_changes.add(self)  
        
        if not isinstance(self.perturbation, np.ndarray):
            self.perturbation = self.model.zero_template.copy()  

        self.perturbation[pos] = perturbation
        
    def get_activity(self, pos = (0,0)):
        pos_idx= np.ravel_multi_index(pos, self.model.grid)        
        activity, perturbation = self.model.restore_matrix_at_node(self)
        if self.storage:
            activity /= self.storage
        activity = np.where(perturbation == 1, 1, activity)
        if len(self.refill_sources) > 0:
            for refill_node in self.refill_sources:
                refill_activity, refill_perturbation = self.model.restore_matrix_at_node(refill_node, control = control)
                activity = np.where((refill_activity > 0 & refill_perturbation != -1) | (refill_perturbation == 1), 1, activity)   
        activity = np.where(perturbation == -1, 0, activity)
        return activity[:,pos_idx]
        
    # evaluating self.rule() and rerturn the old and new activities as 1D (reshaped from a 2D grid) integer np arrays
    def update_activity(self):
        previous_activity = self.model.previous_activities[self.index]
        if self.storage:
            # # times 2 so that 0 becomes -1 and 1 stays 1
            delta_activity = 1*self.rule()
            delta_activity -= (~delta_activity.astype(bool))*self.decay
            new_activity = previous_activity + delta_activity
            if self.consumption:
                new_activity -= self.consumption()#.reshape(self.model.grid_size)
            new_activity = np.maximum(new_activity, self.lower_limit)
            new_activity = np.minimum(new_activity, self.upper_limit)
        else:
            new_activity = self.rule().astype(int)

        return (previous_activity, new_activity)

    # this is relevant only for nodes that have delay in propagating their signal
    # this function assess a nodes activity for any previous step by restoring the activity matrix from the sparse coo matrices stored in the self.model.store_activities list
    def active_at_step(self, at_step, delta = False):

        if delta:
            at_step = len(self.model.store_activities) - at_step
            
        if at_step < 0:
            return self.model.false_template, 0

        # return all stored sparse data for the current node
        def get_coo_row(coo):
            selector = coo.row == self.index
            data = coo.data[selector]
            col = coo.col[selector]
            return data,col
        
        def restore_matrix(restoring_matrix):
            # Initialize with a zero matrix
            restored_matrix = np.zeros(self.model.grid_size)
            
            # Add the differences up to the desired step
            # as most coo array will be very sparse, manually iterating through data and adding values is much more computational efficient than converting into a dense array
            for coo in restoring_matrix[:at_step]:
                data, cols = get_coo_row(coo)
                # Sum the desired row from each CSR matrix
                for col,val in zip(cols,data):
                    restored_matrix[col] += val

            return restored_matrix

        return (restore_matrix(self.model.store_activities), restore_matrix(self.model.store_perturbations))


    # returns node activity as a 1D (reshaped from a 2D grid) Boolean np array from self.model.previous_activities masked by self.perturbation
    # the result is cached to prevent multiple executions in a single step and also prevent reevaluation in subsequent steps if activity didn't change
    # Cache will be reset when incoming nodes change their state (happens in the Model.activtiy_step() function)
    @functools.lru_cache(maxsize=None)
    def active(self, source = None, probabilistic = False):

        if self.delay:
            if self.delay > len(self.model.store_activities):
                return self.model.false_template                    
            activity, perturbation = self.active_at_step(self.delay, delta = True)
        else:
            activity = self.model.previous_activities[self.index]
            perturbation = self.perturbation

        if probabilistic and self.storage:
            np.random.seed(self.model.seed + self.model.step + self.index)
            activity = np.random.rand(self.model.grid_size) <= (activity / (self.storage))
        else:
            activity = activity.astype(bool)
        
        if self.refill and (not source or source not in self.refill_sources):  
            activity = (activity | self.refill()).astype(bool)
        
                    
        if isinstance(perturbation, np.ndarray):
            activity = np.where(perturbation == 1, True, np.where(perturbation == -1, False, activity))

        
        return activity

    # simply convert a node's activity from a given acitvity and perturbation array to a hex color
    # required for visualizations
    # normalized between -1 and 1: -1 = Blue, 0 = White, 1 = Red 
    def activity_color(self, activities, perturbations, alpha = 0.5, rgba = True, return_zero = None):
        alpha =  int(255*alpha)
        activity = activities[self.index]
        perturbation = perturbations[self.index]

        if perturbation == -1:
            return (40, 40, 40, 180)
        elif perturbation == 1:
            return (255, 0, 0, alpha)
        activity = activity / (self.storage if self.storage else 1)
        if len(self.refill_sources) > 0 and not activity:
            if any((activities[node.index] or perturbations[node.index] == 1) and perturbations[node.index] != -1 for node in self.refill_sources):
                activity = 1
        activity_color = int(255 * (1-(activity)))
        activity_color = (255, activity_color, activity_color, alpha)

        return (activity_color if rgba else '#{:02x}{:02x}{:02x}{:02x}'.format(*activity_color)) if activity else (return_zero + (alpha,) if return_zero else return_zero) 

    def current_activity_color(self, alpha = 0.5, pos = (0,0), rgba = True, return_zero = None):
        alpha =  int(255*alpha)
        if isinstance(self.perturbation, np.ndarray):
            if self.perturbation[pos] == -1:
                return (40, 40, 40, 180)
            elif self.perturbation[pos] == 1:
                (255, 0, 0, alpha)
        activity = self.model.current_activities[pos] / (self.storage if self.storage else 1)
        if self.refill and not activity and self.refill(step_number)[pos]:
            activity = 1
        activity_color = int(255 * (1-(activity)))
        activity_color = (255, activity_color, activity_color, alpha)

        return (activity_color if rgba else '#{:02x}{:02x}{:02x}{:02x}'.format(*activity_color)) if activity else (return_zero + (alpha,) if return_zero else return_zero) 
    
    def activity_colors(self, step_number = -1, alpha = 0.5):
        perturbations = np.array(self.perturbations[step_number])
        activities = np.array(self.activities[step_number]) / (self.storage if self.storage else 1)

        # Initialize the color array as a 4D array (rgba)
        color = np.zeros(perturbations.shape + (4,), dtype=int)

        # mask for perturbations
        mask = perturbations != 0

        # set color for perturbations
        color[mask, :] = np.where(perturbations[mask, np.newaxis] == -1, [40, 40, 40, 180], [255, 0, 0, int(255*alpha)])

        # set color for activities
        mask = ~mask
        activity_color = 255 * (1 - activities[mask])

        # Note that np.newaxis is used to match the dimensions for broadcasting
        color[mask, :] = np.array([255, activity_color, activity_color, int(255*alpha)])[:, np.newaxis]

        # convert rgba to hexadecimal (for entire array)
        hex_colors = np.apply_along_axis(lambda rgb: '#%02x%02x%02x%02x' % (rgb[0],rgb[1],rgb[2],rgb[3]), axis=-1, arr=color)

        return hex_colors
        
    def print_boolean_rule(self):
        edge_boolean_strings = {1:[], -1:[]}
        for edge in self.incoming:
            edge_type,edge_lambda = edge.as_boolean_string()
            if edge_type != 0:
                edge_boolean_strings[edge_type].append(edge_lambda)
        
        boolean_string = ""
        if len(edge_boolean_strings[1]) > 0:
            if len(edge_boolean_strings[1]) == 1:
                boolean_string += edge_boolean_strings[1][0]
            else:
                boolean_string += "(" + " OR ".join("(" + edge_string + ")" for edge_string in edge_boolean_strings[1]) + ")"
        if len(edge_boolean_strings[-1]) > 0:
            if boolean_string:
                boolean_string += " AND "
            boolean_string += " AND ".join(["NOT (" + edge_string + ")" for edge_string in edge_boolean_strings[-1]])
        
        return boolean_string
        
# Signal Transduction

    def signal_at_step(self, step):

        return self.signals[step]
    
    def get_reverse_static_signals(self):

        reverse_signals = np.zeros(len(self.model.nodes))
             
        for edge in self.outgoing:       
            for modification in edge.modifications:
                if not modification.perturbed and modification.is_catalysis:
                    for modifier in modification.modifiers:
                        reverse_signals[modifier.index] += -1 / (self.sqrt_out_degree*modifier.sqrt_out_degree)
                         
        for edge in self.incoming:
            if not edge.perturbed:
                for source in edge.sources:
                    reverse_signals[source.index] += edge.edge_type_int / (self.sqrt_in_degree*source.sqrt_out_degree)
            for modification in edge.modifications:
                if not modification.perturbed:
                    for modifier in modification.modifiers:
                        reverse_signals[modifier.index] += modification.modification_on_target_int/ (self.sqrt_in_degree*modifier.sqrt_out_degree)
        
        return reverse_signals


    def get_forward_static_signals(self):

        start = time.process_time()
        
        forward_signals = np.zeros(len(self.model.nodes))
        
        for edge in [edge for edge in self.outgoing if not edge.perturbed]:
            for target in edge.targets:
                forward_signals[target.index] += edge.edge_type_int / (self.sqrt_out_degree*target.sqrt_in_degree)

                        
        for modification in [modification for modification in self.modifications if not modification.perturbed]:
            for target in modification.edge.targets:
                forward_signals[target.index] += modification.modification_on_target_int / (self.sqrt_out_degree*target.sqrt_in_degree)
            if modification.is_catalysis:
                for source in modification.edge.sources:
                    forward_signals[source.index] += -1/(self.sqrt_out_degree*source.sqrt_out_degree)

        return forward_signals
    
    
    def update_signal(self, alpha = 0.5, **kwargs):
                
        current_step = len(self.signals) - 1

        self.signals.append(self.signal_rule(current_step, **kwargs) * (1-alpha) + self.starting_signal * alpha)

    # @property
    # def signal_auc(self, signal_number = 0):
    #     signal = self.signals[signal_number]
    #     return metrics.auc(range(len(signal)),signal)
    
    def signal_effects(self, submap_specific = True, reverse = False):
        
        self.model.propangate_signal(n_steps = 20, alpha = 0.5, reverse = reverse, conditions = [{self:1}], origin_filter = self.origins if submap_specific else [])
        
        final_scores = {}
        
        for node in self.model.nodes:
            final_scores[node] = node.signals[0]
        
        max_score = max(final_scores.values(), default = 1)
        
        return {node:score/max_score for node,score in final_scores.items()}
    
    def p_value(self, value_index = 0):
    
        observed_value = self.signals[value_index]
        permuted_values = np.delete(self.signals, value_index)
        
        # mirror the permuted values
        permuted_values = np.concatenate([permuted_values, -permuted_values])

        # fit a normal distribution to the permuted values
        mu, std = stats.norm.fit(permuted_values)

        # calculate the cumulative density function (CDF) value for the observed value
        cdf_value = stats.norm.cdf(observed_value, mu, std)

        # for a one-tailed test (greater):
        p_value = 2 * min(cdf_value, 1 - cdf_value)
        
        return p_value if not np.isnan(p_value) else 1
    
    def get_minerva_box(self):
        minerva_boxes = []
        for minerva_id in self.minerva_ids:            
            minerva_boxes.append({
                "id": minerva_id[1],
                "x": minerva_id[4],
                "y": minerva_id[5],
                "width": minerva_id[3],
                "height": minerva_id[2],
                "modelId": minerva_id[0],
            })    
        return minerva_boxes