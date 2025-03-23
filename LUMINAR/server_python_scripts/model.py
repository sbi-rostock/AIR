from PIL import Image, ImageDraw
import requests
import concurrent.futures
import io
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.colors as colors
import matplotlib.cm as cm
import seaborn as sns
import ipywidgets as wg
from collections import defaultdict
import scipy
from scipy.optimize import curve_fit
from scipy.stats import t, linregress, norm
from scipy.sparse import coo_matrix, vstack, csr_matrix
from collections import defaultdict, deque
import networkx as nx
from scipy.linalg import inv
import numbers
import json
import time
import math
import pandas as pd
import random
from statsmodels.stats.multitest import multipletests
from d3blocks import D3Blocks
from concurrent.futures import ThreadPoolExecutor


import_paths = [
    "app.network_data.",
    "network_data.",
    ".",
    ""
]

model_imported = False
for import_path in import_paths:
    try:
        exec(f"from {import_path}edge import *")
        exec(f"from {import_path}node import *")
        exec(f"from {import_path}basic_functions import *")
        model_imported = True
        break
    except ImportError as e:
        print(f"Failed to import from {import_path}: {e}")
        
    
class ModelDict(dict):
    def __init__(self, model, **kwargs):
        self.model = model
        super().__init__()
        
    def __iter__(self):
        return iter(self.values())
    
    def __hash__(self):
        return hash(tuple(sorted(self.items())))
    
class Model:

    def __init__(self, grid=(1,1), seed=0, alpha=0.1, precompute=True, disease_map = {}):
        self.nodes = ModelDict(self)
        self.edges = ModelDict(self)
        self.entities = ModelDict(self)
        self.grid = grid
        self.grid_size = self.grid[0] * self.grid[1]
        self.files = {}
        self.submap_images = {}
        self.nodes_with_changes = set()
        self.step = 0

        self.disease_map = disease_map
        
        # Initialize parameters for matrix-based network analysis
        self.alpha = alpha
        self.absorbing_modifiers = set()
        
        # These will be populated by precompute_global_static
        self.global_nodes = None
        self.global_node_to_idx = None
        self.global_idx_to_node = None
        self.global_A = None
        self.global_M = None
        self.global_G = None

        self.minerva_id_to_node = {}
        self.minerva_id_to_edge = {}
                    
        if not seed:
            seed = random.randint(0, 10000)
        self.seed = seed
        
        # Precompute global static data if requested
        if precompute:
            # We'll precompute after nodes and edges are loaded
            self._precompute_pending = True

    def __hash__(self):
        return hash((self.nodes, self.edges, self.grid))
    
    def get_node_from_name(self, name, compartment = None, nodetype = None, states = None):
        for node in self.nodes:
            if node.name.lower() == name.lower() and (compartment == None or node.compartment.lower() == compartment.lower()) and (states == None or sorted(node.states) == sorted(states)) and (nodetype == None or node.type == nodetype.lower()):
                return node
        return None
    
    def adjust_indices(self):
        for i,node in enumerate(self.nodes):
            node.index = i

    def get_nodes_from_name(self, name, exact = True):
        if exact:
            return [node for node in self.nodes if node.name.lower() == name.lower() if node]
        else:
            return [node for node in self.nodes if name.lower() in node.name.lower() if node]         
    
    def get_nodes_from_names(self, names, exact = True, return_unmapped = False):
        mapped_nodes = set()
        unmapped_names = []
        for name in names:
            nodes = [node for node in self.get_nodes_from_name(name, exact = exact) if node]
            if nodes:
                mapped_nodes.update(nodes)
            else:
                unmapped_names.append(name)
        if return_unmapped:
            return (mapped_nodes,unmapped_names)
        else:
            return mapped_nodes
    
    def print_edges(self):
        return [edge.as_string() for edge in self.edges]
    
    def print_nodes(self):
        return [node.as_string() for node in sorted(self.nodes)]

    def get_nodes_by_type(self, node_type):
        return [node for node in self.nodes if node.type.lower() == node_type.lower()]    
    
    @property
    def phenotypes(self):
        return [node for node in self.get_nodes_by_type("phenotype") if not node.hypothetical]
    
    @property
    def compartments(self):
        return list(set([node.compartment for node in self.nodes]))
    
    @property
    def origins(self):
        return set(sum([list(node.origins) for node in self.nodes],[]))
    
    def update_signaling(self):
        for node in self.nodes:
            node.boolean_targets = []
        for node in self.nodes:
            node.update_rule()
            
    def connect_rna_proteins(self):
        for node1 in self.nodes:
            if node1.type == "rna":
                for node2 in node1.siblings:
                    if node2.type == "protein" and node2.compartment == node1.compartment and len(node2.states) == 0:
                        Edge(
                            self,
                            [node1], 
                            [node2],
                            edgetype = "positive", 
                        )
    
    def write_json_files(self, path):
        elements_json = {}
        interaction_json = []

        print("Generate Elements")
        for node in self.nodes:
            elements_json[node.string_index] = {
                "fullname": node.fullname_printable,
                "minerva_name": node.minerva_name.lower(),
                "name": node.name,
                "type": "HYPOTH_PHENOTYPE" if node.type_class == "PHENOTYPE" and node.hypothetical else node.type_class,
                "subtype": node.type,
                "submap": node.submap,
                "hash": node.hash_string,
                "ids": {
                    "name": node.name.lower()
                }, 
                "family": [parent.string_index for parent in self.nodes if parent.family and node in parent.subunits],
                "parent": [parent.string_index for parent in self.nodes if not parent.family and node in parent.subunits],
                "subunits": [subunit.string_index for subunit in node.subunits]
            }
            
        print("Generate Interactions")
        for edge in self.edges:
            for edge_json in edge.as_simple_json():
                edge_json["source"] = edge_json["source"].string_index
                edge_json["target"] = edge_json["target"].string_index
                interaction_json.append(edge_json)

        print("Write Elements")
        json_object = json.dumps(elements_json)
        with open(path + "Elements.json", "w") as outfile:
            outfile.write(json_object)
            
        print("Write Interactions")
        json_object = json.dumps(interaction_json)
        with open(path + "Interactions.json", "w") as outfile:
            outfile.write(json_object)
            
            
        print("Write Phenotype Paths")
        phenotype_json = self.get_influence_scores()
        phenotype_json = {
            # "values": {phenotype.string_index: {node.string_index:value for node,value in node_scores.items() if value} for phenotype, node_scores in phenotype_json["values"].items()},
            # "paths": {phenotype.string_index: ["_".join([node.string_index for node in path]) for path in paths] for phenotype, paths in phenotype_json["paths"].items()},
            "SPs": {phenotype.string_index: {node.string_index:value for node,value in node_scores.items() if value} for phenotype, node_scores in phenotype_json.items()}
        }
        json_object = json.dumps(phenotype_json)
        with open(path + "PhenotypePaths.json", "w") as outfile:
            outfile.write(json_object)
            
    def perturb_edges(self, origin_filter=None, clear_bool_cache = True):
        """
        Mark edges/modifications as perturbed based on origin_filter,
        then update node in/out degrees in a single pass.

        This version does it all at once:
        1) Decide if edge is perturbed.
        2) Decide if each modification on that edge is perturbed.
        3) If edge is not perturbed, update:
        - out_degree for sources
        - in_degree for targets
        - in_degree for sources if there's catalysis
        - out_degree for any node that is a modifier of a non-perturbed modification
        """
        # Convert the filter into a set for O(1) membership tests
        if origin_filter:
            origin_set = set(origin_filter)
        else:
            origin_set = None

        # Pull out node/edge references once to avoid overhead
        nodes_values = list(self.nodes.values())
        edges_values = list(self.edges.values())
        n_nodes = len(nodes_values)

        # Pre-allocate in/out-degree arrays
        in_degrees = np.zeros(n_nodes, dtype=np.float32)
        out_degrees = np.zeros(n_nodes, dtype=np.float32)

        for edge in edges_values:
            # Determine if the edge "fits" the filter
            if origin_set is None:
                edge_fits = True
            else:
                # If any origin in edge.origins is in origin_set => fits
                edge_fits = bool(set(edge.origins).intersection(origin_set))

            edge.perturbed = not edge_fits

            # Mark modifications as perturbed/not
            modifications = edge.modifications.values()
            for mod in modifications:
                if origin_set is None:
                    mod_fits = True
                else:
                    mod_fits = bool(set(mod.origins).intersection(origin_set))
                mod.perturbed = not mod_fits

            # Skip degree updates if the edge itself is perturbed
            if edge.perturbed:
                continue

            # Edge is active => update out-degree for sources, in-degree for targets
            for source_node in edge.sources:
                out_degrees[source_node.index] += 1
            for target_node in edge.targets:
                in_degrees[target_node.index] += 1

            # If the edge has catalytic modifications, increment in_degree for its sources
            if hasattr(edge, '_is_catalyzed_cache'):
                cat_mods = edge._is_catalyzed_cache
            else:
                cat_mods = [m for m in modifications if m.is_catalysis]
                edge._is_catalyzed_cache = cat_mods

            if cat_mods:
                n_cat = len(cat_mods)
                for source_node in edge.sources:
                    in_degrees[source_node.index] += n_cat

            # Also account for node out-degree from non-perturbed modifications
            # e.g., if a node is the 'modifier' in a non-perturbed mod, increment out_degree
            for mod in modifications:
                if not mod.perturbed:
                    for modifier_node in mod.modifiers:
                        out_degrees[modifier_node.index] += 1

        # Now vectorize the sqrt and assign degrees back to node objects
        sqrt_in_deg = np.sqrt(in_degrees)
        sqrt_out_deg = np.sqrt(out_degrees)

        for i, node in enumerate(nodes_values):
            node.sqrt_in_degree = sqrt_in_deg[i]
            node.sqrt_out_degree = sqrt_out_deg[i]

            # Clear any cached logic if needed
            if clear_bool_cache:
                node.active.cache_clear()

        return nodes_values

# Network Analysis

    def bfs(self, starting_nodes, directed = True):
        
        visited = set(starting_nodes)
        visited_edges = set()
        queue = deque(starting_nodes)

        # BFS traversal
        while queue:
            node = queue.popleft()
            for edge in node.incoming if directed else node.all_edges:
                visited_edges.add(edge)
                for neighbor in (set(edge.sources) | edge.modifiers) if directed else edge.all_nodes:# node.all_connected_nodes:            
                    if neighbor not in visited:
                        visited.add(neighbor)
                        queue.append(neighbor)

        return (visited,visited_edges)
    
    def remove_disconnected_networks(self, node_filter = lambda node: node.submap, directed = True):
        
        start = time.process_time()

        visited,visited_edges = self.bfs([node for node in self.nodes if node_filter(node)], directed = directed)

        # print("perform bfs", time.process_time() - start)
        start = time.process_time()
        
        removed_edges = 0
        removed_nodes = 0

        for _hash,edge in [(k,v) for k,v in self.edges.items()]:
            if not edge.submap and edge not in visited_edges:
                for source in edge.sources:
                    source.outgoing.remove(edge)
                for target in edge.targets:
                    target.incoming.remove(edge)    
                for modification in edge.modifications:
                    for modifier in modification.modifiers:
                        modifier.modifications.remove(modification) 
                del self.edges[_hash]
                removed_edges += 1
            else:
                visited.update(edge.all_nodes)
                
        # print("remove edges", time.process_time() - start) 
        print("removed edges: ", removed_edges)
        start = time.process_time()

        for _hash,node in [(k,v) for k,v in self.nodes.items()]:
            if not node.submap and node not in visited:
                for parent in node.parents:
                    parent.subunits.remove(node)
                for subunit in node.subunits:
                    subunit.parents.remove(node)
                node.entity.nodes.discard(node)
                del self.nodes[_hash]
                removed_nodes += 1
        
        # print("remove nodes", time.process_time() - start)   
        print("removed nodes: ", removed_nodes)            
        
        for _hash,entity in [(k,v) for k,v in self.entities.items()]:
            if len(entity.nodes) == 0:
                del self.entities[_hash]  
                
        self.adjust_indices()
                
    def get_interaction_of_nodes(self, node1, node2, integrate_enzymes = True, enzyme_feedback = True, origin_filter = []):
        
        interaction_integers = []
        
        for edge in node1.outgoing:
            if not origin_filter or any([origin in origin_filter for origin in edge.origins]):
                catalyses = edge.is_catalyzed

                # add the source->target interaction only if there is no enzyme or enzyme is not integrated and node2 is a target of node1
                if (not integrate_enzymes or not catalyses) and node2 in edge.targets:
                    interaction_integers.append(edge.edge_type_int)

                # add the source->enzyme interaction if enzymes should be integrated and node2 is an enzyme with node1 as a substrate
                if integrate_enzymes and any([node2 in catalysis.modifiers for catalysis in edge.is_catalyzed if not origin_filter or any([origin in origin_filter for origin in catalysis.origins])]):
                    interaction_integers.append(1)            
            
        # add the negative enzyme->source feedback for catalyses if enzyme_feedback is true and node1 is an enzyme with node2 as substrate
        if enzyme_feedback:
            interaction_integers += [-1 for edge in node2.outgoing if any([node1 in catalysis.modifiers for catalysis in edge.is_catalyzed if not origin_filter or any([origin in origin_filter for origin in catalysis.origins])])]
            
        # add the modifier->target interaction if node1 is modifier of node2
        for edge in node2.incoming:
            if not origin_filter or any([origin in origin_filter for origin in edge.origins]):
                for modification in edge.modifications:
                    if node1 in modification.modifiers:
                        if modification.is_catalysis:
                            return 1
                        else:
                            interaction_integers.append(modification.modification_on_target_int)
        
        return np.sign(sum(interaction_integers, 0))
                
    def as_matrix(self, integrate_enzymes = True, enzyme_feedback = True, origin_filter = [], reverse = False, absolute = False):
        indices = list(enumerate(list(self.nodes)))
        matrix = np.zeros(shape=(len(indices), len(indices)))
        
        for i, source in indices:
            for j, target in indices:
                _type = self.get_interaction_of_nodes(source, target, integrate_enzymes = integrate_enzymes, enzyme_feedback = enzyme_feedback, origin_filter = origin_filter)
                matrix[j if reverse else i][i if reverse else j] = abs(_type) if absolute else _type
        return matrix

    def shortest_paths(self, origin_filter = []):        
        return scipy.sparse.csgraph.shortest_path(self.as_matrix(origin_filter = origin_filter, absolute = True), method='auto', directed=True, return_predecessors=False, unweighted=True, overwrite=False, indices=None)
    
    def as_networkx(self, origin_filter = [], absolute = False):
        return nx.from_numpy_array(self.as_matrix(origin_filter = origin_filter, absolute = absolute))

    def get_bipartite_graph(self):
        graph = defaultdict(dict)
        for edge in self.edges:
            has_modifiers = len(edge.modifications) > 0
            for source in edge.sources:
                for target in edge.targets:
                    if has_modifiers:
                        for modification in edge.modifications:
                            for modifier in modification.modifiers:
                                graph[source][modifier] = 1
                                graph[modifier][target] = modification.modification_on_target_int
                    else:
                        graph[source][target] = edge.edge_type_int
        return graph

    def find_connected_components_undirected(self):
        
        graph = self.get_bipartite_graph()
        visited = set()
        components = []

        def dfs(node, component, edges):
            if node not in visited:
                visited.add(node)
                component.append(node)
                for neighbor, interaction_type in graph.get(node, {}).items():
                    edge_representation = (node, interaction_type, neighbor)
                    edges.add(edge_representation)
                    dfs(neighbor, component, edges)
                # This additional loop handles the case where a node is a target but not a source
                for source, interactions in graph.items():
                    if node in interactions:
                        interaction_type = interactions[node]
                        edge_representation = (source, interaction_type, node)
                        edges.add(edge_representation)
                        dfs(source, component, edges)

        for node in graph:
            if node not in visited:
                component = []
                edges = set()
                dfs(node, component, edges)
                components.append((component, list(edges)))

        return components

    def get_influence_scores(self, nodes=None, submap_specific=True, global_scores=False, downstream=True, use_matrix=True):
        """
        Calculate influence scores for nodes in the network.
        
        Parameters:
        -----------
        nodes : list, optional
            List of nodes to calculate influence scores for. Defaults to phenotypes.
        submap_specific : bool, optional
            Whether to use submap-specific filtering. Defaults to True.
        global_scores : bool, optional
            Whether to use global scores. Defaults to False.
        downstream : bool, optional
            Whether to calculate downstream (True) or upstream (False) influence scores. Defaults to True.
        use_matrix : bool, optional
            Whether to use the matrix-based implementation. Defaults to True.
        
        Returns:
        --------
        dict
            Dictionary of influence scores.
        """
        # Trigger precomputation if pending
        if hasattr(self, '_precompute_pending') and self._precompute_pending:
            self.precompute_global_static()
        
        return self.get_influence_scores_matrix(nodes, downstream=downstream)

    def get_influence_scores_matrix(self, nodes=None, downstream=True):
        """
        A matrix-based implementation of get_influence_scores that uses the precomputed data.
        Optimized to reduce isinstance checks and take operations.
        
        Parameters:
        -----------
        nodes : list, optional
            List of nodes to calculate influence scores for. Defaults to phenotypes.
        alpha : float, optional
            Damping factor. Defaults to self.alpha.
        downstream : bool, optional
            Whether to calculate downstream (True) or upstream (False) influence scores. Defaults to True.
        
        Returns:
        --------
        dict
            Dictionary containing influence scores in the "values" key.
        """
        if nodes is None:
            nodes = self.phenotypes
        
        # Compute weightings for all target nodes
        results = self.compute_weightings_for_targets(nodes, downstream=downstream)
        
        # Return the results directly
        return results    

    def chord_plot(self, highlighted = [] ):
        interactions = {}
        for node in [node for node in self.nodes if node.compartment == ""]:
            for edge in node.incoming:
                for source in edge.sources: 
                    for source_compartment in [c.replace(" nucleus", "") for c in source.compartment.split(" / ")]:
                        if source_compartment == "":
                            continue
                        if source_compartment not in interactions:
                            interactions[source_compartment] = {}
                        for edge in node.outgoing:
                            for target in edge.targets: 
                                for target_compartment in [c.replace(" nucleus", "") for c in target.compartment.split(" / ")]:
                                    if target_compartment == "" or target_compartment == source_compartment:
                                        continue
                                    if target_compartment not in interactions[source_compartment]:
                                        interactions[source_compartment][target_compartment] = set()
                                    interactions[source_compartment][target_compartment].add(node)

        columns = ['source', 'target', 'weight']
        df = pd.DataFrame(columns=columns)

        # excluded because unspecific cells
        excluded = ["cell", "immune cell"]
        # Adding each row to the DataFrame
        for source,targets in interactions.items():
            for target, nodes in targets.items():
                if source in excluded or target in excluded:
                    continue
                row_df = pd.DataFrame([{'source': source.removesuffix("s"), 'target': target.removesuffix("s"), 'weight': len(nodes)}])  # Convert the single row to a DataFrame
                df = pd.concat([df, row_df], ignore_index=True)
                
        d3 = D3Blocks()#chart='Chord', frame=False)
        d3.chord(df, ordering='ascending', arrowhead=50)
        d3.set_node_properties(df, opacity=0.4, cmap='tab20')
        d3.set_edge_properties(df, color='source', opacity='source')

        for comp in highlighted:
            try:
                d3.node_properties.get(comp)['color']='#ff0000'
                d3.node_properties.get(comp)['opacity']=1
            except:
                pass

        d3.show(save_button=True, fontsize=12)
        
    def selected_betweenness(self, sources, targets, G=None, return_index = False):
        """
        Compute betweenness centrality based on specific sources and targets.
    
        Parameters:
        - sources: Iterable of source node identifiers.
        - targets: Iterable of target node identifiers.
        - G: NetworkX graph. If None, it should be provided externally.
    
        Returns:
        - Dictionary mapping nodes to their normalized betweenness scores.
        """
        node_indices = {node.index:node for node in self.nodes}
        G = G if G else self.as_networkx(origin_filter = [], absolute = False)
        
        node_count = defaultdict(int)
        source_set = set([node.index for node in sources])
        target_set = set([node.index for node in targets])
        total_pairs = len(source_set) * len(target_set)
        
        def process_source(s):
            paths = nx.single_source_shortest_path(G, s)
            relevant_targets = target_set.intersection(paths.keys())
            local_count = defaultdict(int)
            for t in relevant_targets:
                path = paths[t]
                for node in path:
                    local_count[node] += 1
            return local_count
        
        with ThreadPoolExecutor() as executor:
            results = executor.map(process_source, source_set)
            for local_count in results:
                for node, count in local_count.items():
                    node_count[node] += count
        
        # Normalize the counts
        normalized_betweenness = {(node if return_index else node_indices[node]): count / total_pairs for node, count in node_count.items() if count != 0}
        return normalized_betweenness
    
    def betweenness(self, G = None, normalized=True, weight=None, k=None, seed=42):
        
        G = G if G else self.as_networkx(origin_filter = [], absolute = False)
        
        return nx.betweenness_centrality(G, normalized=normalized, weight=weight, k=k, seed=seed)

    def compare_betweenness_ranks(self, sources, targets, G = None, betweenness = None):
        
        node_indices = {node.index:node for node in self.nodes}
        G = G if G else self.as_networkx(origin_filter = [], absolute = False)

        betweenness = betweenness if betweenness else self.betweenness(G = G)

        sorted_full = sorted(betweenness.items(), key=lambda item: item[1], reverse=True)

        selected_betweenness = self.selected_betweenness(sources, targets, G = G, return_index = True)

        sorted_selected = sorted(selected_betweenness.items(), key=lambda item: item[1], reverse=True)
        selected_rank = {node: rank for rank, (node, _) in enumerate(sorted_selected, start=1)}
    
        full_rank = {node: rank for rank, (node, _) in enumerate([node for node in sorted_full if node[0] in selected_rank], start=1)}
        
        rank_changes = {}
        for node, new_rank in selected_rank.items():
            original_rank = full_rank.get(node, None)
            if original_rank:
                rank_changes[node_indices[node]] = original_rank - new_rank

        return rank_changes
    
    def set_initial_state(self, grid = None):
        if grid:
            self.grid = grid
            self.grid_size = self.grid[0] * self.grid[1]
            
        # templates return by nodes with static activity or for perturbation purposes
        self.false_template = np.full(self.grid_size, False)
        self.true_template = np.full(self.grid_size, True)
        self.zero_template = np.zeros(self.grid_size)
        self.ones_template = np.ones(self.grid_size)

        # storing the activity of nodes at each step
        # both are necessary, because nodes are evaluated iteratively. If the activity of a node is updated, another node still needs to refer to its previous acitivty
        self.previous_activities = np.zeros((len(self.nodes), self.grid_size))        
        self.current_activities = np.zeros((len(self.nodes), self.grid_size))
        
        # list of sparse arrays to store the change in activity for each node at each step compared to the previous step
        self.store_activities = []
        
        # Preallocated arrays that store data for the sparse array (reset at each step)
        self.sparse_row_indices = np.zeros(len(self.nodes) * self.grid_size)
        self.sparse_col_indices = np.zeros(len(self.nodes) * self.grid_size)
        self.sparse_data = np.zeros(len(self.nodes) * self.grid_size)
        
        # list of sparse arrays to store the change in perturabtion for each node at each step compared to the previous step
        self.store_perturbations = []
        
        self.previous_perturbation = {node.index:0 for node in self.nodes}    
                
        # Preallocated arrays that store data for the sparse array
        self.perturb_sparse_row_indices = []
        self.perturb_sparse_col_indices = []
        self.perturb_sparse_data = []

        # reset all nodes
        for node in self.nodes:
            node.perturbation = 0
            node.active.cache_clear()
            
        self.step = 0
        # initialize the "zeroth" step in which all nodes are updated to get their initial state
        self.activity_step(first_step = True)        
        
    def activity_step(self, first_step = False):

        # To keep track of where we are in the preallocated arrays self.sparse_row_indices,self.sparse_col_indices,self.sparse_data
        current_idx = 0  

        # in the first step of a simulation all nodes need to be evaluated
        if first_step:
            nodes_to_eval = self.nodes
        # in following steps only updates nodes which with the possibility to change their state
        else:            
            # e.g. nodes whose activities are based on probabilities need to be updated every step
            nodes_to_eval = set(node for node in self.nodes if node.always_update)
            # otherwise update only targets of nodes whose activity has changed
            for node in self.nodes_with_changes | {node for node in self.nodes if node.delay or node.refill != None}:
                nodes_to_eval.update(node.boolean_targets)

        # node.active() results are cached by the @functools module
        # for nodes whose activity has changed in the previous step, it needs to be cleared
        nodes_to_clear_cache = self.nodes_with_changes | {node for node in self.nodes if node.always_update}
        for node in nodes_to_clear_cache:
            node.active.cache_clear()
            
        # keep track of nodes whose activity or perturbation changed
        self.nodes_with_changes = set()
        
        for node in nodes_to_eval:
            # previous_activity will be index in update_activity() anway so it gets returned to avoid another indexing
            previous_activity, new_activity = node.update_activity()
            
            # get all activity values that are different to the previous step
            diff = new_activity - previous_activity
            non_zero_positions = np.where(diff != 0)[0]
            
            # if there are changes add them to the np arrays that stored the data for the sparse arrays
            if len(non_zero_positions) > 0:
                self.nodes_with_changes.add(node)
                
                self.current_activities[node.index] = new_activity
                non_zero_values = diff[non_zero_positions]

                num_updates = len(non_zero_positions)

                self.sparse_row_indices[current_idx:current_idx + num_updates] = node.index
                self.sparse_col_indices[current_idx:current_idx + num_updates] = non_zero_positions
                self.sparse_data[current_idx:current_idx + num_updates] = non_zero_values

                current_idx += num_updates

        # Slice arrays up to current_idx
        row_indices = self.sparse_row_indices[:current_idx]
        col_indices = self.sparse_col_indices[:current_idx]
        data = self.sparse_data[:current_idx]  

        # Create coo_matrix from the activity array and indices        
        sparse_activity_matrix = coo_matrix((data, (row_indices, col_indices)), shape=(len(self.nodes), self.grid_size), dtype=np.int32)
        self.store_activities.append(sparse_activity_matrix)
        
        # go through each node and check whether the perturbation has changed compared to previous step
        for node in self.nodes:
            prev_perturbation = self.previous_perturbation[node.index]
            
            # simple comparisons to check whether there are differences, i.e. if both are 0 there is none, etc.
            if isinstance(node.perturbation, np.ndarray):
                if isinstance(prev_perturbation, np.ndarray):
                    diff = node.perturbation - prev_perturbation
                else:
                    diff = node.perturbation
            else:
                if isinstance(prev_perturbation, np.ndarray):
                    diff = -prev_perturbation
                else:
                    continue

            # get all values that are different to the previous step
            non_zero_positions = np.where(diff != 0)[0]
        
            # if there are changes add them to lists that stored the data for the sparse arrays
            if len(non_zero_positions) > 0:
                non_zero_values = diff[non_zero_positions]
                # Update the lists
                self.perturb_sparse_row_indices.extend([node.index] * len(non_zero_positions))
                self.perturb_sparse_col_indices.extend(non_zero_positions)
                self.perturb_sparse_data.extend(non_zero_values)

            self.previous_perturbation[node.index] = node.perturbation
            node.perturbation = 0
 
        # Create coo_matrix from the different perturbation data
        sparse_perturbation_matrix = coo_matrix((self.perturb_sparse_data, (self.perturb_sparse_row_indices, self.perturb_sparse_col_indices)), 
                                                shape=(len(self.nodes), self.grid_size), 
                                                dtype=np.int32
                                               )
        self.store_perturbations.append(sparse_perturbation_matrix)

        self.perturb_sparse_row_indices.clear()
        self.perturb_sparse_col_indices.clear()
        self.perturb_sparse_data.clear()
        
        # assign current step as the previous one for the next step 
        self.previous_activities[:, :] = self.current_activities
        self.step += 1

    # restore the list of coo sparse matrices for activities and perturbations of a specific node into a 2D (step * position) np array 
    def restore_matrix_at_node(self,node, control = False):

        def restore_matrix(sparse_matrices):
            # Initialize with a zero matrix
            restored_matrix = np.zeros((len(sparse_matrices)+1,self.grid_size))
            # Iteratively sum COO matrices
            for i,coo in enumerate(sparse_matrices):
                restored_matrix[i+1] += restored_matrix[i] 
                # Extract the columns and values of the specific node (i.e. row in the array)
                node_rows = coo.row == node.index
                # Sum the values for the specific node
                for j, v in zip(coo.col[node_rows], coo.data[node_rows]):
                    restored_matrix[i+1][j] += v
                    
            return restored_matrix

        if control:
            return (restore_matrix(self.ctrl_store_activities),restore_matrix(self.ctrl_store_perturbations))
        else:
            return (restore_matrix(self.store_activities),restore_matrix(self.store_perturbations))
    
    # restore the list of coo sparse matrices for activities and perturbations of a specific position into a 2D (step * nodes) np array     
    def restore_matrix_at_pos(self,pos):

        col_idx= np.ravel_multi_index(pos, self.grid)        

        def restore_matrix(sparse_matrices):
            # Initialize with a zero matrix
            restored_matrix = np.zeros((len(sparse_matrices)+1, len(self.nodes)))
            # Iteratively sum COO matrices
            for i,coo in enumerate(sparse_matrices):
                restored_matrix[i+1] += restored_matrix[i] 
                # Extract the columns and values of the specific position (i.e. column in the array)
                node_cols = coo.col == col_idx
                # Sum the values for the specific position
                for j, v in zip(coo.row[node_cols], coo.data[node_cols]):
                    restored_matrix[i+1][j] += v
                    
            return restored_matrix

        return (restore_matrix(self.store_activities),restore_matrix(self.store_perturbations))
         
    def run_boolean_simulation(self, steps = 10, conditions = {}, perturbations = {}, pos = (0,0)):
        
        self.set_initial_state()       

        perturbations = {node: param if isinstance(param, list) else evenDist(100, param) for node,param in perturbations.items() if node}   
        conditions = {node: param if isinstance(param, list) else evenDist(100, param) for node,param in conditions.items() if node}  

        for i in range (steps):
            
            for node,pert_list in conditions.items():
                node.perturb(pert_list[i%len(pert_list)])
                
            for node,pert_list in perturbations.items():
                perturbation = pert_list[i%len(pert_list)]
                if perturbation:
                    node.perturb(perturbation)
            
            self.activity_step()

    def correlation_analysis(self, conditions, perturbed_nodes, perturbation = -1, steps = 20, simulation_steps = 100, pos = (0,0)):
        
        results = {"nodes": perturbed_nodes, "perturbation": perturbation, "x values": [i for i in range(0,101,int(100/steps))], "correlations": {node:{"values":[]} for node in self.nodes}}

        print_progress_bar(0,1)


        for x_value in results["x values"]:
            perturbations = {}
            for perturbed_node in perturbed_nodes:
                perturbations[perturbed_node] = perturbation * x_value
                
            self.run_boolean_simulation(steps = simulation_steps, conditions = conditions, perturbations = perturbations, pos = pos)           

            node_activities = np.mean(self.restore_matrix_at_pos(pos)[0], axis=0)

            for node in self.nodes.values():
                
                node_activity = node_activities[node.index] / (node.storage if node.storage else 1)        
                results["correlations"][node]["values"].append(node_activity)        
            
            print_progress_bar(x_value,100) 

        for node, correlation in results["correlations"].items():
                    
            if len(results["x values"]) < 2:
                corr = (0,1)
            else:
                try:
                    corr = scipy.stats.pearsonr(np.array(results["x values"]), np.array(correlation["values"]))
                except:
                    corr = (0,1)
            correlation["pvalue"] = corr[1]
            correlation["correlation"] = corr[0]
        
        return results
    
    def display_correlation_results(self, correlation_results, x_label = None, y_nodes = [], plot_width = 10, n_columns = 2, file_name = ""):
        
        if len(y_nodes) == 1:
            n_columns = 1
        fig, axs = plt.subplots(1 + len(y_nodes) // n_columns, n_columns, figsize = (plot_width,4*(len(y_nodes) // n_columns + 1)))

        for i,node in enumerate(y_nodes):

            x=np.array(correlation_results["x values"])
            
            if n_columns == 1:
                ax = axs[i]
            else:
                ax = axs[i//n_columns,i%n_columns]
            
            correlation = correlation_results["correlations"][node]
            y=np.array(correlation["values"])

            coef = np.polyfit(x,y,1)
            poly1d_fn = np.poly1d(coef) 
            ax.plot(x, y, 'ko', x, poly1d_fn(x), '--k')

            pvaluetext = ""
            if correlation["pvalue"] < 0.001:
                pvaluetext = "<0.001"
            else:
                pvaluetext = str(round(correlation["pvalue"],3))
            
            y = (coef[1])
            x = 0
            ax.annotate("Δy = " + str(round(coef[0],3)) + "\nR = " + str(round(correlation["correlation"],2)) + "\np-value: " + pvaluetext, (x, y), color= 'k')


            ax.set_ylabel("Activity of " + node.fullname + " [%]",color='black' ,fontsize=10)

            if x_label == None:
                ax.set_xlabel(" & ".join([node.fullname for node in correlation_results["nodes"]]) + " " + ("Deficiency" if correlation_results["perturbation"] == -1 else "Activity") + " [%]", fontsize= 10)
            else:
                ax.set_xlabel(x_label, fontsize= 10)

            ax.set_xlim(0, 100)
            ax.set_ylim(0, 1)

        if file_name:
            plt.savefig(file_name + ".png", dpi=600, bbox_inches='tight', transparent=True)
    
    def __load_submap_image(self, files):

        for file in files:
            if file in self.files:
                with open(self.files[file]["path"], "rb") as f:                     
                    r = requests.post('https://minerva-service.lcsb.uni.lu/minerva/api/convert/image/CellDesigner_SBML:png', data=f.read() , headers={'Content-Type':'application/octet-stream'})
                    if r.status_code == 200:
                        img = Image.open(io.BytesIO(r.content)).convert("RGBA")#.resize(self.files[file]["size"])
                        self.submap_images[file] = img
                        return img
        return None
    
    def get_submap_image(self, file, max_width = 1000, scale = 1.0, zoom_on_node = None, zoom = 1.0, zoom_ratio = 0):
        
        if file in self.submap_images:                    
            img = self.submap_images[file]
        else:
            img = self.__load_submap_image([file])

        width_scale = max_width / ((img.width/(zoom*2)*2)*scale)
        scale *= width_scale if width_scale < 1 else 1
                       
        img = img.resize((int(img.size[0]*scale), int(img.size[1]*scale)), Image.Resampling.LANCZOS) 
             
        if zoom_on_node:
            position = list(zoom_on_node.positions[file])[0]
            img = self.__zoom_at(img, position[0]*scale, position[1]*scale, zoom, zoom_ratio)

        return (img, scale)
    
    def __zoom_at(self, img, x, y, zoom, ratio = 0.0):
        w, h = img.size
        if ratio:
            h = int(ratio * w)
        zoom2 = zoom * 2
        img = img.crop((x - w / zoom2, y - h / zoom2, 
                        x + w / zoom2, y + h / zoom2))
        return img # img.resize((w, h), Image.Resampling.LANCZOS)   
    
    def __get_submap_overlay(self, file, overlay_img, highlights = {}, cmap = cm.bwr, max_width = 1500, scale = 1.0, zoom_on_node = None, zoom = 1.0, zoom_ratio = 0, alpha = 0.6):

        overlay = overlay_img.copy() 
        draw = ImageDraw.Draw(overlay)  # Create a context for drawing things on it.
        norm = colors.Normalize(vmin=-1, vmax=1, clip = True)
        color_map = cm.ScalarMappable(norm=norm, cmap=cmap)

        for node, node_color in highlights.items():
            if file in node.positions and node_color:
                if isinstance(node_color, numbers.Number):
                    node_color = tuple([int(255*x) for x in color_map.to_rgba(float(node_color), alpha = alpha)])
                for position in node.positions[file]:
                    x,y,w,h = [point*scale for point in position]
                    draw.rectangle([x, y, x + w, y + h], fill=node_color)

        if zoom_on_node:
            position = list(zoom_on_node.positions[file])[0]
            overlay = self.__zoom_at(overlay, position[0]*scale, position[1]*scale, zoom, zoom_ratio)

        return overlay
    
    
    def highlight_on_map(self, file, overlay_img = None, highlights = {}, img = None, **kwargs):

        if not img:
            img, scale = self.get_submap_image(file, **kwargs)
            kwargs["scale"] = scale

        if not img:
            return None
        
        if not overlay_img:
            overlay_img = Image.new('RGBA', tuple([int(side*kwargs["scale"]) for side in self.submap_images[file].size]), (255,255,255,0))
        
        overlay = self.__get_submap_overlay(file, overlay_img, highlights, **kwargs)

        return Image.alpha_composite(img, overlay).convert("RGB")
        
        
    def show_boolean_simulation(self, file, min_steps = 0, max_steps = 100, slider_step = 1, pos = (0,0), conditions = {}, alpha = 0.6, prevent_run = False, **kwargs):
        
        img,scale = self.get_submap_image(file, **kwargs)        
        kwargs["scale"] = scale
        
        
        overlay_img = Image.new('RGBA', tuple([int(side*kwargs["scale"]) for side in self.submap_images[file].size]), (255,255,255,0))
        
        if not prevent_run:
            _ = self.run_boolean_simulation(steps = max_steps, conditions = conditions)
        
        node_activities, node_perturbations = self.restore_matrix_at_pos(pos)
        
        step_images = {step:
            self.highlight_on_map(file, overlay_img = overlay_img, highlights = {node:node.activity_color(node_activities[step], node_perturbations[step], alpha = alpha) for node in self.nodes if file in node.positions}, img = img, **kwargs)
         for step in range(min_steps, max_steps + 1, slider_step)}
        
        def f(step):            
            
            return step_images[step]
             
        wg.interact(f, step=wg.IntSlider(min=min_steps,max=max_steps-1,step=slider_step));

        
    # Signal Propangation   
    def relationship_matrix(self, origin_filter=None, reverse=False):
        """
        Build a sparse relationship matrix with optimized performance.
        """
        from scipy.sparse import coo_matrix
        
        # Cache the result based on origin_filter and reverse
        cache_key = (frozenset(origin_filter) if origin_filter else None, reverse)
        if not hasattr(self, '_relationship_matrix_cache'):
            self._relationship_matrix_cache = {}
        elif cache_key in self._relationship_matrix_cache:
            return self._relationship_matrix_cache[cache_key]
        
        # -----------------------
        # PASS 0: Setup
        # -----------------------
        nodes_list = list(self.nodes.values())
        edges_list = list(self.edges.values())
        n_nodes = len(nodes_list)

        # Convert origin_filter => set for O(1) membership checks
        if origin_filter:
            origin_set = set(origin_filter)
        else:
            origin_set = None

        # Precompute edge matrices if not already done
        if not hasattr(self, 'edge_type_matrix') or not hasattr(self, 'origin_edge_matrix'):
            self.precompute_edge_matrices()
        
        # Create a mask for active edges based on origin_filter
        if origin_set:
            # Create a mask for edges that match the origin filter
            active_edge_mask = np.zeros(len(edges_list), dtype=bool)
            for i, edge in enumerate(edges_list):
                if bool(origin_set.intersection(edge.origins)):
                    active_edge_mask[i] = True
        else:
            # All edges are active
            active_edge_mask = np.ones(len(edges_list), dtype=bool)
        
        # -----------------------
        # PASS 1: Calculate in/out degrees using the active edge mask
        # -----------------------
        in_deg = np.zeros(n_nodes, dtype=np.float32)
        out_deg = np.zeros(n_nodes, dtype=np.float32)
        
        # Use vectorized operations where possible
        for i, edge in enumerate(edges_list):
            if active_edge_mask[i]:
                # Edge-based in/out degrees
                for s in edge.sources:
                    out_deg[s.index] += 1
                for t in edge.targets:
                    in_deg[t.index] += 1
                
                # Catalysis => +in_deg for each source
                cat_mods = [m for m in edge.modifications.values() if m.is_catalysis and 
                            (not origin_set or bool(origin_set.intersection(m.origins)))]
                
                if cat_mods:
                    count_cats = len(cat_mods)
                    for s in edge.sources:
                        in_deg[s.index] += count_cats
                
                # Modifications => +out_deg for modifiers
                for mod in edge.modifications.values():
                    if not origin_set or bool(origin_set.intersection(mod.origins)):
                        for modifier_node in mod.modifiers:
                            out_deg[modifier_node.index] += 1
        
        # Compute sqrt_in_deg, sqrt_out_deg
        # Handle zero values to avoid division by zero
        sqrt_in_deg = np.sqrt(in_deg)
        sqrt_out_deg = np.sqrt(out_deg)
        
        # Replace zeros with ones to avoid division by zero
        sqrt_in_deg[sqrt_in_deg == 0] = 1
        sqrt_out_deg[sqrt_out_deg == 0] = 1
        
        # -----------------------
        # PASS 2: Build the relationship matrix using the precomputed matrices
        # -----------------------
        # Pre-allocate arrays for COO format
        # Estimate the number of non-zero entries
        nnz_estimate = sum(len(edge.sources) * len(edge.targets) for i, edge in enumerate(edges_list) if active_edge_mask[i])
        nnz_estimate += sum(len(mod.modifiers) * len(edge.targets) for i, edge in enumerate(edges_list) 
                            if active_edge_mask[i] for mod in edge.modifications.values() 
                            if not origin_set or bool(origin_set.intersection(mod.origins)))
        nnz_estimate += sum(len(mod.modifiers) * len(edge.sources) for i, edge in enumerate(edges_list) 
                            if active_edge_mask[i] for mod in edge.modifications.values() 
                            if mod.is_catalysis and (not origin_set or bool(origin_set.intersection(mod.origins))))
        
        row_list = []
        col_list = []
        val_list = []
        
        # Process edges in batches for better performance
        batch_size = 100
        for batch_start in range(0, len(edges_list), batch_size):
            batch_end = min(batch_start + batch_size, len(edges_list))
            batch_edges = [(i, edge) for i, edge in enumerate(edges_list[batch_start:batch_end]) if active_edge_mask[i + batch_start]]
            
            for i, edge in batch_edges:
                # Direct connections: sources -> targets
                for s in edge.sources:
                    s_out = sqrt_out_deg[s.index]
                    for t in edge.targets:
                        t_in = sqrt_in_deg[t.index]
                        val = edge.edge_type_int / (s_out * t_in)
                        row_list.append(s.index)
                        col_list.append(t.index)
                        val_list.append(val)
                
                # Active modifications
                for mod in edge.modifications.values():
                    if not origin_set or bool(origin_set.intersection(mod.origins)):
                        mod_val = mod.modification_on_target_int
                        for modifier_node in mod.modifiers:
                            mod_out = sqrt_out_deg[modifier_node.index]
                            for t in edge.targets:
                                t_in = sqrt_in_deg[t.index]
                                val = mod_val / (mod_out * t_in)
                                row_list.append(modifier_node.index)
                                col_list.append(t.index)
                                val_list.append(val)
                        
                        # Catalysis feedback
                        if mod.is_transition_catalysis:
                            for source_node in edge.sources:
                                s_out = sqrt_out_deg[source_node.index]
                                for modifier_node in mod.modifiers:
                                    mod_out = sqrt_out_deg[modifier_node.index]
                                    val = -1.0 / (mod_out * s_out)
                                    row_list.append(modifier_node.index)
                                    col_list.append(source_node.index)
                                    val_list.append(val)
        
        # Build the final COO matrix
        row_arr = np.array(row_list, dtype=np.int32)
        col_arr = np.array(col_list, dtype=np.int32)
        val_arr = np.array(val_list, dtype=np.float32)
        coo_mat = coo_matrix((val_arr, (row_arr, col_arr)), shape=(n_nodes, n_nodes))
        
        # Optional transpose if reverse
        if reverse:
            coo_mat = coo_mat.transpose()
        
        # Convert to CSR for efficient row-based operations, then transpose
        result = coo_mat.tocsr().transpose()
        
        # Cache the result
        self._relationship_matrix_cache[cache_key] = result
        
        return result

    def precompute_edge_matrices(self):
        """
        Precompute edge type and origin matrices for faster relationship matrix construction.
        """
        nodes_list = list(self.nodes.values())
        edges_list = list(self.edges.values())
        n_nodes = len(nodes_list)
        n_edges = len(edges_list)
        
        # Get all unique origins
        all_origins = set()
        for edge in edges_list:
            all_origins.update(edge.origins)
        all_origins = list(all_origins)
        n_origins = len(all_origins)
        
        # Create a mapping from origin to index
        origin_to_idx = {origin: i for i, origin in enumerate(all_origins)}
        
        # Create a 2D array for edge types
        # shape: (n_edges, 1)
        self.edge_type_matrix = np.zeros(n_edges, dtype=np.int8)
        for i, edge in enumerate(edges_list):
            self.edge_type_matrix[i] = edge.edge_type_int
        
        # Create a 3D boolean array for origin connectivity
        # shape: (n_origins, n_edges, 1)
        self.origin_edge_matrix = np.zeros((n_origins, n_edges), dtype=bool)
        for i, edge in enumerate(edges_list):
            for origin in edge.origins:
                origin_idx = origin_to_idx[origin]
                self.origin_edge_matrix[origin_idx, i] = True
        
        # Store the mappings
        self.edge_to_idx = {edge: i for i, edge in enumerate(edges_list)}
        self.origin_to_idx = origin_to_idx
        self.all_origins = all_origins

    def propangate_signal(self, n_steps=20, alpha=0.5, reverse=False, signal_duration=None,
                        conditions=[], node_weights={}, origin_filter=[], np_fnc=np.sum,
                        progress=False, precomputed_matrix=None):
        """
        Propagates signal using a relationship matrix. If precomputed_matrix is provided,
        it will be used to avoid rebuilding the matrix.
        Optimizations:
        - Uses local variables for repeated attributes.
        - Avoids repeated function calls such as isinstance.
        """
        if not isinstance(conditions, list):
            conditions = [conditions]
        # Wrap conditions if keys are Node objects.
        for i, cond in enumerate(conditions):
            if all(isinstance(k, Node) for k in cond.keys()):
                conditions[i] = {"starting_signals": cond}

        # Use precomputed matrix if available.
        if precomputed_matrix is not None:
            rules_sparse = precomputed_matrix
        else:
            rules_sparse = self.relationship_matrix(origin_filter=origin_filter, reverse=reverse)

        # Precompute node weighting array.
        num_nodes = len(self.nodes)
        node_weighting = np.zeros(num_nodes)
        for node, weight in node_weights.items():
            node_weighting[node.index] = weight
        weight_down = 2 ** (-np.abs(node_weighting))
        weight_up = 2 ** (np.abs(node_weighting))

        # Initialize activities array.
        num_conditions = len(conditions)
        activities = np.zeros((num_conditions, n_steps + 1, num_nodes))
        knockouts = np.ones((num_conditions, num_nodes))
        permutation = np.full(num_conditions, False)
        cutoffs = np.zeros(num_conditions)
        signal_duration = np.full(num_conditions, n_steps if signal_duration is None else signal_duration)

        # Set initial activities.
        for k, cond in enumerate(conditions):
            for node, score in cond["starting_signals"].items():
                activities[k, 0, node.index] = score
            if "ko_nodes" in cond:
                for node in cond["ko_nodes"]:
                    knockouts[k, node.index] = 0
            if "cutoff" in cond:
                cutoffs[k] = cond["cutoff"]
            if "signal_duration" in cond:
                signal_duration[k] = cond["signal_duration"]
            permutation[k] = cond.get("permutation", False)

        has_knockouts = not np.all(knockouts == 1)
        has_cutoff = not np.all(cutoffs == 0)
        has_weighting = not np.all(node_weighting == 0)
        cutoffs = cutoffs.reshape((-1, 1))
        processed_starting_activity = (1 - alpha) * activities[:, 0]

        # Propagation loop.
        for t in range(1, n_steps):
            previous_activity = activities[:, t - 1]
            if has_cutoff:
                previous_activity = np.where(np.abs(previous_activity) < cutoffs, 0, previous_activity)
            if has_weighting:
                sign_match = (np.sign(previous_activity) == np.sign(node_weighting))
                previous_activity = np.where(sign_match, previous_activity * weight_up, previous_activity * weight_down)
            if has_knockouts:
                previous_activity *= knockouts

            activities[:, t] = alpha * rules_sparse.dot(previous_activity.T).T
            samples_with_signal = signal_duration > t
            activities[samples_with_signal, t] += processed_starting_activity[samples_with_signal]
            if progress:
                print(f"Step {t}/{n_steps}")

        # Save propagated signals in each node.
        for node in self.nodes:
            node.signals = activities[:, :, node.index]

        return rules_sparse.toarray()

    def fdr_corrected_pvalues(self, index = 0, permutations = [], show_plot = False, node_filter = lambda node: True, hist_node = None):

        distances = np.array([])
        signals = np.array([])
        slopes = []
        intercepts = []
        shapiro_scores = []
        delta_signals = np.array([])
        
        filtered_nodes = set([node for node in self.nodes if node_filter(node) and node.signals is not None])
        nodes_with_signal = [node for node in self.nodes if node.signals is not None]
        
        def get_signal_distance(node_signals):
            if node_signals.ndim == 1:
                if np.all(node_signals == 0):
                    return None  
                return (
                    node_signals.sum(), 
                    (node_signals != 0).argmax()
                )
            else:
                mask = np.any(node_signals != 0, axis=1)
                node_signals = node_signals[mask]
                if node_signals.size == 0:
                    return None                
                return (
                    np.abs(node_signals.sum(axis=1)), 
                    (node_signals != 0).argmax(axis=1)
                )
        
        def get_delta_signals(raw_signals, raw_distances):
            # Take the logarithm of the summed_signal
            log_summed_signal = np.log(raw_signals)
            # Perform linear regression
            slope, intercept, _, _, _ = linregress(raw_distances, log_summed_signal)
            # Calculate the fitted values using the regression line
            fitted_values = slope * raw_distances + intercept
            # Calculate the differences between the original log signals and the fitted values
            return (log_summed_signal - fitted_values, slope, intercept)

        # Define the exponential decay function
        def exponential_decay(x, a, b):
            return a * np.exp(-b * x)
           
        node_pvalues = []
        node_distributions = {}
        for i,node in enumerate(filtered_nodes):
            sample_data = get_signal_distance(node.signals[index])
            permutation_data = get_signal_distance(node.signals[permutations])
            if sample_data and permutation_data:
                
                distr_signals, distr_distances = permutation_data
                ln_distr_signals = np.log(distr_signals)
                
                sample_signal, sample_distance = sample_data
                log_sample_signal = np.log(np.abs(sample_signal))
                
                # Normalize signals for each distance
                unique_distances = np.unique(distr_distances)
                normalized_signals = np.zeros_like(distr_signals)
                for d in unique_distances:
                    mask = distr_distances == d
                    normalized_signals[mask] = (ln_distr_signals[mask] - np.mean(ln_distr_signals[mask])) / np.std(ln_distr_signals[mask])

                # Normalize the input signal using the mean and standard deviation for its corresponding distance
                input_mask = distr_distances == sample_distance
                normalized_input_signal = (log_sample_signal - np.mean(ln_distr_signals[input_mask])) / np.std(ln_distr_signals[input_mask])

                # Calculate the Z-score for the normalized input signal against the combined normalized distribution
                z_score = (normalized_input_signal - np.mean(normalized_signals)) / np.std(normalized_signals)

                # Calculate the p-value for the given normalized signal
                p_value = 2 * (1 - norm.cdf(abs(z_score)))
               
                if not np.isnan(p_value):
                    node_pvalues.append((node, p_value, sample_signal, sample_distance))
                    
                # Perform the Shapiro-Wilk test
                _, p_value = scipy.stats.shapiro(normalized_signals)
                shapiro_scores.append(p_value)
                
                signals = np.append(signals, distr_signals)
                distances = np.append(distances, distr_distances)
                print_progress_bar(i+1,len(filtered_nodes))
                
                node_distributions[node] = normalized_signals
                   
        return node_distributions
    
        pvalues_corrected = multipletests([x[1] for x in node_pvalues], method='fdr_bh')[1]

        start = time.process_time()
        # Sort distances and signals based on distances
        sorted_indices = np.argsort(distances)
        distances = distances[sorted_indices]
        signals = signals[sorted_indices]

        # Fit the exponential decay model to the data
        params, covariance = curve_fit(exponential_decay, distances, signals)
        a_fit, b_fit = params

        # Calculate the fitted exponential decay
        fitted_signals = exponential_decay(distances, a_fit, b_fit)

        # Transform the data by taking the natural logarithm
        ln_signals = np.log(signals) #np.sign(signals) * np.abs(np.log(np.abs(signals)))

        
        sample_data_x = []
        sample_data_y = []
        sample_data_s = []
        
        results = {}    
        
        for (node,pvalue,signal,distance),adj_pvalue in sorted(zip(node_pvalues, pvalues_corrected), key = lambda x: x[1]):        
            results[node] = (signal, pvalue, adj_pvalue, distance)
            sample_data_x.append(distance)
            sample_data_y.append(np.log(abs(signal)))
            sample_data_s.append(100 if adj_pvalue < 0.1 else 20)
            
        if show_plot:
            # Set a seaborn style
            sns.set_theme(style="whitegrid")

            # Plot the original data and fitted exponential decay
            fig = plt.figure(figsize=[18, 6])
            plt1 = fig.add_subplot(1, 3, 1)
            plt2 = fig.add_subplot(1, 3, 2)
            plt3 = fig.add_subplot(1, 3, 3)
            
            plt1.plot(distances, signals, 'o', label='Permutation Data', c = "lightblue")
            plt1.plot(distances, fitted_signals, '--', label='Fitted Exponential Decay', c = "darkred")
            plt1.set_title('Node Signal vs. Distance')
            plt1.set_xlabel('Distance')
            plt1.set_ylabel('Signal')
            plt1.legend()
                
            plt3.hist(shapiro_scores, bins = 100, density = True)

            plt3.set_ylabel('Frequency')
            plt3.set_xlabel('Shapiro–Wilk p-value')
            # plt3.set_xticks([])
            plt3.set_yticks([])
            
            # Plot the individual transformed data points
            plt2.plot(distances, ln_signals, 'o', alpha = 0.1, label='Transformed Permutation Data', c="lightblue")

            x_values = np.unique(distances)
            slope, intercept, _, _, _ = linregress(distances, ln_signals)

            # Initialize arrays to hold the min and max Y values
            y_min = np.full_like(x_values, float('inf'))
            y_max = np.full_like(x_values, float('-inf'))

            # Calculate Y values for each line and update the min and max arrays
            for slope, intercept in zip(slopes, intercepts):
                y_values = slope * x_values + intercept
                y_min = np.minimum(y_min, y_values)
                y_max = np.maximum(y_max, y_values)

            # Plot the shaded area
            plt2.fill_between(x_values, y_min, y_max, color='grey', label='Linear Regressions of Permutations', alpha=0.5)

            plt2.set_title('log-transformed Signal with 95% Confidence Interval')
            plt2.set_xlabel('Distance')
            plt2.set_ylabel('ln(Signal)')
            plt2.plot(sample_data_x, sample_data_y, 'o', label='Sample Data', c = "darkred", markersize = 3)# , s = sample_data_s)

            plt2.legend()
            leg = plt2.legend()
            for lh in leg.legendHandles: 
                lh.set_alpha(1)

        # fig.savefig("plots/signal_transformation.png", dpi=600, bbox_inches="tight")
        return results

    #Data Mapping
    def map_dataframe(self, df, node_filter=lambda node: True, delete=True):
        """
        Optimized version of map_dataframe that reduces pandas indexing operations.
        """
        # Pre-filter nodes to avoid repeated filtering
        filtered_nodes = [node for node in self.nodes.values() if node_filter(node)]
        
        # Create a mapping dictionary with lowercase names for faster lookups
        node_mapping = {}
        for node in filtered_nodes:
            node_name_lower = node.name.lower()
            if node_name_lower not in node_mapping:
                node_mapping[node_name_lower] = []
            node_mapping[node_name_lower].append(node)
        
        # Convert DataFrame to dictionary for faster processing
        df_dict = df.to_dict('index')
        new_dict = {}
        
        # Process each row
        for index, row_data in df_dict.items():
            index_lwr = str(index).lower()
            nodes = node_mapping.get(index_lwr)
            
            if nodes:
                # Create new rows for each matching node
                for node in nodes:
                    new_dict[node] = row_data.copy()
            elif not delete:
                new_dict[index] = row_data
        
        # Convert back to DataFrame in one operation
        result_df = pd.DataFrame.from_dict(new_dict, orient='index')
        
        # Ensure column order matches original DataFrame
        if not result_df.empty:
            result_df = result_df.reindex(columns=df.columns)
        
        # Filter out null indices
        return result_df[~result_df.index.isnull()]

    def map_dataframe_minerva(self, df, node_filter=lambda node: True, node_index=False, return_mapped_nodes=False):
        """
        Map Minerva IDs to a dataframe. Can handle both string and Node object indices.
        
        Parameters:
        -----------
        df : pandas.DataFrame
            The dataframe to map
        node_filter : function, optional
            Filter function for nodes
        node_index : bool, optional
            If True, treats df index as Node objects. If False, treats as strings.
        """
        if df.index.empty:
            return df
            
        node_mapping = defaultdict(list)
        if node_index:
            # For Node object indices, directly use the nodes
            for node in df.index:
                if node_filter(node):
                    node_mapping[node].append(node)
        else:
            # For string indices, build mapping from node names
            for node in self.nodes:
                if node_filter(node):
                    node_mapping[node.name.lower()].append(node)
    
        id_value_map = {}
        for key, nodes in node_mapping.items():
            id_counts = defaultdict(int)
            id_mapping = {}
            for node in nodes:
                for minerva_id in node.minerva_ids:
                    num = minerva_id[0]
                    id_counts[num] += 1
                    id_mapping[num] = minerva_id  
            if id_counts:
                most_common_num = max(id_counts, key=id_counts.get)
                id_value_map[key] = str(list(id_mapping[most_common_num]))
            else:
                id_value_map[key] = 0
  
        if node_index:
            df['minerva_id'] = df.index.map(id_value_map).fillna(0)
            df['model_nodes'] = df.index.map(node_mapping).fillna(0)
        else:
            df_lower = df.index.astype(str).str.lower()
            df['minerva_id'] = df_lower.map(id_value_map).fillna(0)
            df['model_nodes'] = df_lower.map(node_mapping).fillna(0)
    
        df = df.fillna(value={col: 1 if str(col).endswith("_pvalue") else 0 for col in df.columns})
        
        result_df = df[~df.index.isnull()]

        # Filter mapped nodes to only those with non-zero minerva_id
        if return_mapped_nodes:
            # Get indices with non-zero minerva_id
            mapped_indices = set(result_df[result_df['minerva_id'] != 0].index)
            
            # Filter mapped_nodes to only include those with matching indices
            if node_index:
                final_mapped_nodes = mapped_indices
            else:
                # Create a mapping from lowercase name to node
                name_to_node = mapped_indices.intersection(set(node_mapping.keys()))
                # Get nodes whose names match the mapped indices
                final_mapped_nodes = set(node for name in name_to_node for node in node_mapping[name])
            
            return result_df, list(final_mapped_nodes)
        
        return result_df
    
    #variant mapping:                    
    def create_genome_file(self, genome):
        self.transcripts = []
        node_index = defaultdict(list)
        for node in self.nodes: 
            node_index[node.name.lower()].append(node)
        mapped_data = {}
        for index,row in pd.read_csv(genome, sep="\t", encoding="ISO-8859-1", index_col = 0, header=None).astype(str).iterrows():
            nodes = node_index.get(index.lower())
            if nodes:
                for transcript in json.loads(row[1].replace("'", "\"").replace("False", "false").replace("True", "true")):
                    transcript["node"] = nodes
                    self.transcripts.append(transcript)

    def create_transcript_dictionary():
        self.transcript_index = {}
        for _id, t in enumerate(self.transcripts):
            if t["c"] not in self.transcript_index:
                self.transcript_index[t["c"]]  = IntervalTree()
                if t["e"] - t["s"] > 0:
                    self.transcript_index[t["c"]][t["s"]:t["e"]] = t
                
    def get_transcripts(chrom, pos): 
        # Query the tree for all intervals that overlap with the point
        intervals = t_dict[chrom][pos]
        # Extract original range and position from each interval
        return [interval.data[2] for interval in intervals]

    def map_minerva_ids(self, url):
        
        session = requests.Session()
    
        try:
            project_info = requests.get(url).json()
            self.disease_map = {
                "disease map name": project_info["name"],
                "associated disease": {
                    "label":"",
                    "description":""
                },
                "url": url
            }
            disease_url = project_info['disease'].get('link', None)
            if disease_url:
                disease_info = requests.get(disease_url+ ".json").json()
                try:
                    self.disease_map['associated disease']['description'] = disease_info['annotation']['@value']
                except:
                    pass
                try:
                    self.disease_map['associated disease']['label'] = disease_info['label']['@value']
                except:
                    pass
        except:
            pass
        for node in self.nodes:
            node.minerva_ids.clear()
            node.references = []
        for edge in self.edges:
            edge.minerva_ids.clear()
    
        models_url = f"{url}/models/"
        try:
            response = session.get(models_url)
            response.raise_for_status()
        except requests.RequestException as e:
            print(f"Failed to fetch models data: {e}")
            return
        models_data = response.json()
    
        self.minerva_maps = {
            entry["name"] + ".xml": entry['idObject']
            for entry in models_data
            if entry["name"] not in ("basemap", "Phenotypes", "PhenotypeMap")
        }

        def fetch_data(submap_id, endpoint):
            try:
                url_ = f"{models_url}/{submap_id}/bioEntities/{endpoint}/"
                resp = session.get(url_)
                resp.raise_for_status()
                data = resp.json()

                if endpoint == "elements":
                    data = [entry for entry in data if entry.get("type") != "Compartment"]
                return data
            except requests.RequestException as e:
                return []

        node_map_ids = {
            (self.minerva_maps[map_name], map_id): node
            for node in self.nodes
            for map_name, aliases_ids in node.aliases_in_map.items() if map_name in self.minerva_maps
            for map_id in aliases_ids
        }
        edge_map_ids = {
            (self.minerva_maps[map_name], map_id): edge
            for edge in self.edges
            for map_name, aliases_ids in edge.aliases_in_map.items() if map_name in self.minerva_maps
            for map_id in aliases_ids
        }
    
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            future_to_request = {}
            for submap, submap_id in self.minerva_maps.items():
                future_reactions = executor.submit(fetch_data, submap_id, "reactions")
                future_elements  = executor.submit(fetch_data, submap_id, "elements")
                future_to_request[future_reactions] = (submap_id, "reactions")
                future_to_request[future_elements]  = (submap_id, "elements")
    
            for future in concurrent.futures.as_completed(future_to_request):
                submap_id, endpoint = future_to_request[future]
                data = future.result()
                if endpoint == "reactions":
                    for reaction in data:
                        edge = edge_map_ids.get((submap_id, reaction.get('reactionId')))
                        if edge:
                            minerva_tuple = (submap_id, reaction.get("id"), reaction.get("lines", []))
                            edge.minerva_ids.append(minerva_tuple)
                            self.minerva_id_to_edge[(reaction.get("id"), submap_id)] = edge
                            references = reaction.get("references", [])
                            for reference in references:
                                reference = (reference["link"], reference["type"], reference["resource"])
                                edge.minerva_references.add(reference)
                elif endpoint == "elements":
                    for element in data:
                        node = node_map_ids.get((submap_id, element.get('elementId')))
                        if node:
                            bounds = element.get("bounds")
                            minerva_tuple = (submap_id, element.get("id"), bounds["height"], bounds["width"], bounds["x"], bounds["y"], bounds["z"])
                            node.minerva_ids.append(minerva_tuple)
                            self.minerva_id_to_node[(element.get("id"), submap_id)] = node
                            references = element.get("references", [])
                            for reference in references:
                                reference = (reference["link"], reference["type"], reference["resource"])
                                node.minerva_references.add(reference)
   
    def precompute_global_static(self):
        """
        Precompute all global static data for network analysis.
        Also tracks sources for each absorbing modifier.
        """
        # Dictionary to track sources for each absorbing modifier
        absorbing_modifiers = set()
        modifier_to_sources = {}
        
        for edge in self.edges:
            if edge.modifications:
                for modification in edge.modifications:
                    if modification.is_transition_catalysis:
                        for modifier in modification.modifiers:
                            absorbing_modifiers.add(modifier)
                            # Track the sources for this modifier
                            if modifier not in modifier_to_sources:
                                modifier_to_sources[modifier] = set()
                            modifier_to_sources[modifier].update(edge.sources)
        
        self.absorbing_modifiers = absorbing_modifiers
        self.absorbing_modifier_sources = modifier_to_sources

    def compute_weightings_for_targets(self, target_list, downstream=True, cutoff=100):
        results = {}
        idx_to_node = {node.index: node for node in self.nodes.values()}
        
        for target in target_list:
            origin_filter = list(target.origins) if target.origins else None
            # Convert the CSR matrix to a boolean matrix
            rel_matrix = (self.relationship_matrix(origin_filter=origin_filter, reverse=downstream).transpose() != 0).astype(bool)  # Boolean conversion
            
            # Compute initial scores using DFS
            node_idx_scores = self._propagate_signals_from_target(rel_matrix, target.index, cutoff)

            # Run signal propagation to determine sign and influence
            self.propangate_signal(
                n_steps=20,
                alpha=0.5,
                reverse=downstream,
                conditions=[{target: 1}],
                origin_filter=origin_filter or []
            )

            node_scores = {}
            for node_idx, score in node_idx_scores.items():
                node = idx_to_node.get(node_idx)
                if node:
                    node_scores[node] = score
                
            # Handle absorbing modifiers if applicable
            if hasattr(self, 'absorbing_modifiers') and hasattr(self, 'absorbing_modifier_sources'):
                for modifier, sources in self.absorbing_modifier_sources.items():
                    if modifier in node_scores:
                        node_scores[modifier] += sum(node_scores[source] for source in sources if source in node_scores)
                     

            for node, score in node_scores.items():
                if node:
                    signal_sum = node.signals[0].sum() if hasattr(node, 'signals') and node.signals is not None else 0
                    node_scores[node] = score * np.sign(signal_sum)
               
            # Normalize scores and filter out zeros
            max_abs_score = max((abs(score) for score in node_scores.values()), default=1.0)
            results[target] = {
                node: score / max_abs_score
                for node, score in node_scores.items()
                if score != 0 and node != target
            } if max_abs_score > 0 else {}

        return results

    def _propagate_signals_from_target(self, rel_matrix, target_idx, cutoff):
        # Identify all nodes with at least one incoming or outgoing connection
        outgoing_nodes = np.unique(rel_matrix.indices)  # Nodes with outgoing edges
        incoming_nodes = np.unique(rel_matrix.nonzero()[0])  # Nodes with incoming edges
        active_nodes = np.union1d(outgoing_nodes, incoming_nodes)  # Keep all interacting nodes

        sub_idx_map = {node: i for i, node in enumerate(active_nodes)}  # Map full → reduced
        sub_idx_to_node = {i: node for node, i in sub_idx_map.items()}  # Map reduced → full

        # Create a compact adjacency matrix including all interacting nodes
        sub_rel_matrix = rel_matrix[active_nodes, :][:, active_nodes]
        num_active = sub_rel_matrix.shape[0]

        # If target isn't part of active nodes, return empty result
        if target_idx not in sub_idx_map:
            return {}

        sub_target_idx = sub_idx_map[target_idx]  # Get target index in compact space

        # Initialize reduced versions of scores & neighbor tracking
        scores = np.zeros(num_active)
        scores[sub_target_idx] = 1
        neighbor_unique_counts = np.zeros((num_active, num_active), dtype=bool)

        # Perform signal propagation
        for i in range(cutoff):
            active_indices = np.nonzero(scores > 0)[0]  # Only iterate over active nodes

            for node in active_indices:
                start_idx = sub_rel_matrix.indptr[node]
                end_idx = sub_rel_matrix.indptr[node + 1]
                neighbors = sub_rel_matrix.indices[start_idx:end_idx]
                num_neighbors = len(neighbors)

                scores[neighbors] += i
                neighbor_unique_counts[neighbors, node] = True
                neighbor_unique_counts[neighbors] |= neighbor_unique_counts[node]

                scores[node] += num_neighbors
                previous_nodes = np.where(neighbor_unique_counts[node])[0]
                scores[previous_nodes] += num_neighbors

        # Convert back to original indices and return results
        return {sub_idx_to_node[idx]: score + np.sum(neighbor_unique_counts[idx]) for idx, score in enumerate(scores) if score > 0}
