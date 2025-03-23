import math
from collections import defaultdict
import numpy as np
import hashlib

edge_type_mapping = {
    "NEGATIVE_INFLUENCE": -1,
    "INHIBITION": -1,
    "UNKNOWN_INHIBITION": -1,
    "POSITIVE_INFLUENCE": 1,
    "STATE_TRANSITION": 1,
    "TRANSCRIPTION": 1,
    "TRANSLATION": 1,
    "TRANSPORT": 1,
    "UNKNOWN_NEGATIVE_INFLUENCE": -1,
    "UNKNOWN_POSITIVE_INFLUENCE": 1,
    "HETERODIMER_ASSOCIATION": 1,
    "BINDING": 0, 
    "CATALYSIS": 1,
    "UNKNOWN_TRANSITION": 0,
    "positive": 1,
    "binding": 0,
    "negative": -1,
    "PHYSICAL_STIMULATION": 1
}
    
class ModificationDict(dict):
    def __init__(self, edge, **kwargs):
        self.edge = edge
        super().__init__()
        
    def __iter__(self):
        return iter(self.values())
    
    def __hash__(self):
        return hash(tuple(sorted(self.items())))
    
class Modification:
    def __new__(cls, modifiers, modification, edge, origins = [], mod_dict = {}):
        _hash = hashlib.sha256(str((
            tuple([hash(modifier) for modifier in modifiers]),
            modification,
        )).encode()).hexdigest()
        
        modification = mod_dict.get(_hash)
                
        if modification:
            modification.origins.update(origins)
            return modification
        
        mod_dict[_hash] = super(Modification, cls).__new__(cls)
        
        mod_dict[_hash].hash = int(_hash, 16)
        mod_dict[_hash].hash_string = str(_hash)
        
        return mod_dict[_hash]
    
    def __init__(self, modifiers, modification, edge, origins = [], mod_dict = {}):    
        if hasattr(self, 'modifiers'):
            return
        self.modifiers = modifiers
        self.modification = modification
        self.origins = set(origins)

        self.perturbed = False
        self.edge = edge
        for modifier in self.modifiers:
            modifier.modifications.add(self)

    @property
    def boolean(self):
        if self.modification_int == -1:
            return lambda step,source: np.logical_not(np.logical_and.reduce([modifier.active(step,source=source) for modifier in self.modifiers]))
        else:
            return lambda step,node: np.full(self.edge.model.grid, True) 
    
    @property
    def modification_on_target_int(self):
        return self.modification_int * self.edge.edge_type_int
    
    @property
    def modification_on_target_string(self):
        return "negative" if self.modification_on_target_int == -1 else "positive"
    
    @property
    def modification_int(self):
        return -1 if self.modification.lower() == "inhibition" else 1

    @property
    def is_catalysis(self, only_simple_molecules = False):
        return self.modification.lower() == "catalysis" or self.modification.lower() == "unknown_catalysis"
    
    @property       
    def is_transition_catalysis(self):
        return self.is_catalysis and all([source.type.lower() == "simple_molecule" for source in self.edge.sources]) and all([target.type.lower() == "simple_molecule" for target in self.edge.targets])
    
    def fits_origins(self, origin_filter):
        return True if not origin_filter or any([origin in origin_filter for origin in self.origins]) else False

    def numexpr_string(self, probabilistic = False):        
        return "~(" + " & ".join([modifier.numexpr_index(probabilistic = probabilistic) for modifier in self.modifiers]) + ")" if self.modification_int == -1 else ""
        
    def boolean_string(self):        
        return "NOT (" + " AND ".join([modifier.fullname for modifier in self.modifiers]) + ")" if self.modification_int == -1 else ""
         
    def __hash__(self):
        return self.hash
    
class Edge:

    def __new__(cls, model, sources, targets, sourcelinks = [], targetlinks = [], edgetype = "positive", pubmeds = [], origins = [], submap = False, consumption = 0, probabilistic = False, refill = False, map_ids = []):
        
        _hash = hashlib.sha256(str((
            tuple([source.hash for source in sorted(sources + sourcelinks)]),
            tuple([target.hash for target in sorted(targets + targetlinks)]),
            edgetype,
            probabilistic
        )).encode()).hexdigest()
        
        edge = model.edges.get(_hash)
        if edge:
            if consumption > edge.consumption:
                edge.consumption = consumption
            if submap:                
                edge.submap = submap            
            edge.origins.update(origins) 
            for origin in origins:
                if origin in edge.aliases_in_map:
                    edge.aliases_in_map[origin].update(map_ids)
                else:
                    edge.aliases_in_map[origin] = set(map_ids)
            edge.pubmeds.update(pubmeds)
            return edge
        
        edge = super(Edge, cls).__new__(cls)
        
        model.edges[_hash] = edge
        edge.hash = int(_hash, 16)
        edge.hash_string = str(_hash)
        
        return edge
        
    def __init__(self, model, sources: list, targets: list, sourcelinks = [], targetlinks = [], edgetype = "positive", pubmeds = [], origins = [], submap = False, consumption = 0, probabilistic = False, refill = False, map_ids = []):
        if hasattr(self, 'sources'):
            return
        self.model = model
        self.modifications = ModificationDict(self)

        self.basesources = sources
        self.basetargets = targets

        self.sources = sources + [source for source in sourcelinks if not source.is_currency_node]
        self.targets = targets + [target for target in targetlinks if not target.is_currency_node]
        
        self.all_sources = sources + sourcelinks
        self.all_targets = targets + targetlinks        

        self.sourcelinks = sourcelinks
        self.targetlinks = targetlinks
        
        self.type = edgetype
        self.origins = set(origins)
        self.aliases_in_map = {origin:set(map_ids) for origin in origins}
        self.minerva_ids = []
        
        self.pubmeds = set(pubmeds)
        self.submap = submap
        self.perturbed = False
        
        self.minerva_references = set()

        self.probabilistic = probabilistic
        self.consumption = consumption
        self.refill = refill
        
        self.boolean_lamba = None
        
        for source in self.sources:
            source.outgoing.add(self)
        for target in self.targets:
            target.incoming.add(self)
            
        if self.type in edge_type_mapping:
            self.edge_type_int = edge_type_mapping[self.type]
        else:
            self.edge_type_int = 0
            
        self.true_template = np.ones((50, 50), dtype=bool)
        self.false_template = np.zeros((50, 50), dtype=bool)
    
    def add_modification(self, modifiers, modification_type, origins = []):
        Modification(modifiers, modification_type, self, origins = origins, mod_dict = self.modifications)

    def __eq__(self, other):
        if self.__class__ is not other.__class__:
            return False
        return self.hash == other.hash
    
    def __hash__(self):
        return self.hash
    
    @property
    def modifiers(self):
        return set().union(*[modification.modifiers for modification in self.modifications])
    
    @property
    def all_nodes(self):
        return set().union(self.sources, self.targets, self.modifiers)
    
    @property
    def is_catalyzed(self):
        # Cache the result if not already cached
        if not hasattr(self, '_is_catalyzed_cache'):
            self._is_catalyzed_cache = [modification for modification in self.modifications if modification.is_catalysis]
        return self._is_catalyzed_cache

    # Add a method to invalidate the cache
    def invalidate_catalyzed_cache(self):
        if hasattr(self, '_is_catalyzed_cache'):
            delattr(self, '_is_catalyzed_cache')
    
    @property
    def is_inhibited(self):
        return [modification for modification in self.modifications if modification.modification_int == -1]

    @property
    def is_transcription(self):
        return all([source.type.lower() == "tf" for source in self.sources])
    
    def fits_origins(self, origin_filter):
        # Use direct comparison and early return
        if not origin_filter:
            return True
        
        # Use any() with generator expression for better performance
        return any(origin in origin_filter for origin in self.origins)
        
    def as_string(self):
        return " ".join([
            '[' + ",".join([source.fullname_printable for source in self.sources]) + ']',
            self.type,
            '[' + ",".join(["(" + modification.modification + " by " + ",".join([modifier.fullname_printable for modifier in modification.modifiers]) + ")" for modification in self.modifications]) + ']',
            '[' + ",".join([source.fullname_printable for source in self.targets]) + ']',
        ])
    
    def as_edge_pairs(self):
        """
        Generate edge pairs with highly optimized performance.
        """
        # Pre-allocate output list
        output = []
        
        # Use a dictionary to collect edge pairs and their origins
        edge_pairs = {}
        
        # Cache frequently accessed properties
        sources = self.sources
        targets = self.targets
        edge_type_int = self.edge_type_int
        origins = self.origins
        
        # Cache is_catalyzed result
        catalyses = self.is_catalyzed
        
        # Process source-target pairs
        for target in targets:
            for source in sources:
                if catalyses:
                    for modification in catalyses:
                        modifiers = modification.modifiers
                        mod_origins = modification.origins
                        
                        for modifier in modifiers:
                            key = (source, target, modifier, edge_type_int)
                            
                            if key not in edge_pairs:
                                # Use set constructor for first assignment
                                edge_pairs[key] = set(mod_origins)
                            else:
                                # Use update for subsequent assignments
                                edge_pairs[key].update(mod_origins)
                else:
                    key = (source, target, None, edge_type_int)
                    
                    if key not in edge_pairs:
                        # Use set constructor for first assignment
                        edge_pairs[key] = set(origins)
                    else:
                        # Use update for subsequent assignments
                        edge_pairs[key].update(origins)
        
        # Process modifications
        for modification in self.modifications:
            modifiers = modification.modifiers
            mod_origins = modification.origins
            is_cat = modification.is_catalysis
            mod_target_int = modification.modification_on_target_int
            
            for modifier in modifiers:
                if is_cat:
                    for source in sources:
                        key = (modifier, source, None, -1)
                        
                        if key not in edge_pairs:
                            # Use set constructor for first assignment
                            edge_pairs[key] = set(mod_origins)
                        else:
                            # Use update for subsequent assignments
                            edge_pairs[key].update(mod_origins)
                
                for target in targets:
                    key = (modifier, target, None, mod_target_int)
                    
                    if key not in edge_pairs:
                        # Use set constructor for first assignment
                        edge_pairs[key] = set(mod_origins)
                    else:
                        # Use update for subsequent assignments
                        edge_pairs[key].update(mod_origins)
        
        # Convert to output format - use list comprehension for better performance
        output = [(k[0], k[1], k[2], k[3], v) for k, v in edge_pairs.items()]
        
        return output
    
    def as_simple_json(self):
        json_list = []
        for target in self.targets:
            for source in self.sources:
                json_list.append({
                    "source": source,
                    "target": target,
                    "subtype": "tf" if source.type.lower() == "tf" and source.type_class == "PROTEIN" else "",
                    "typeString": self.type,
                    "submap": self.submap,
                    "type": self.edge_type_int,
                    "pubmed": list(self.pubmeds)
                })
        for modification in self.modifications:
            for modifier in modification.modifiers:
                for target in self.targets:
                    json_list.append({
                        "source": modifier,
                        "target": target,
                        "subtype": "cat" if modification.is_catalysis else "mod",
                        "typeString": modification.modification_on_target_string,
                        "submap": self.submap,
                        "type": modification.modification_on_target_int,
                        "pubmed": list(self.pubmeds)
                    })
                if modification.is_catalysis:
                    for source in self.sources:
                        json_list.append({
                            "source": modifier,
                            "target": source,
                            "subtype": "cat",
                            "typeString": "negative",
                            "submap": self.submap,
                            "type": -1,
                            "pubmed": list(self.pubmeds)
                        })                        
        return json_list  
    
        
    def as_numexpr_string(self):
        catalyses_modifiers = [modification.modifiers for modification in self.modifications if modification.is_catalysis]
        modifier_strings = [modification.numexpr_string(probabilistic = self.probabilistic) for modification in self.modifications]
        modifier_strings = [modifier_string for modifier_string in modifier_strings if modifier_string != ""]
        evaluated_sources = self.basesources + [node for node in self.sourcelinks if not node.simple_molecule or not node.hypothetical]
        if self.type == "COMPLEX_FORMATION":
            return (self.edge_type_int, None)
        else:
            return (self.edge_type_int, "(" + "".join([
                " & ".join([node.numexpr_index(probabilistic = self.probabilistic) for node in evaluated_sources]),
                (" & " if len(modifier_strings) > 0 else ""),
                " & ".join(sorted(modifier_strings)),
                (" & (" if len(catalyses_modifiers) > 0 else ""),
                " | ".join([" & ".join(sorted([node.numexpr_index(probabilistic = self.probabilistic) for node in modifiers])) for modifiers in sorted(catalyses_modifiers)]),
                ")" if len(catalyses_modifiers) > 0 else "",
            ]) + ")")
        
#     def as_boolean_expression(self):
#         catalyses_modifiers = [modification.modifiers for modification in self.modifications if modification.is_catalysis]
#         modifier_lambdas = [modification.boolean for modification in self.modifications]
#         evaluated_sources = self.basesources + [node for node in self.sourcelinks if not node.simple_molecule or not node.hypothetical]
#         if self.type == "COMPLEX_FORMATION":
#             return (self.edge_type_int, None)
#         else:
#             return (self.edge_type_int, lambda step,source: np.logical_and.reduce([node.active(step,source=source,probabilistic = self.probabilistic) for node in evaluated_sources] + 
#                 [modifier_lambda(step,source) for modifier_lambda in modifier_lambdas] + 
#                 ([np.logical_or.reduce([np.logical_and.reduce([node.active(step,source=source) for node in modifiers]) for modifiers in catalyses_modifiers])] if len(catalyses_modifiers) > 0 else [])))
    
    def as_boolean_string(self):
        catalyses_modifiers = [modification.modifiers for modification in self.modifications if modification.is_catalysis]
        modifier_strings = [modification.boolean_string() for modification in self.modifications]
        modifier_strings = [modifier_string for modifier_string in modifier_strings if modifier_string != ""]
        evaluated_sources = self.basesources + [node for node in self.sourcelinks if not node.simple_molecule or not node.hypothetical]
        
        return (self.edge_type_int, "".join([
            " AND ".join([node.fullname for node in evaluated_sources]),
            (" AND " if len(modifier_strings) > 0 else ""),
            " AND ".join(sorted(modifier_strings)),
            (" AND (" if len(catalyses_modifiers) > 0 else ""),
            " OR ".join([" AND ".join(sorted([node.fullname for node in modifiers])) for modifiers in sorted(catalyses_modifiers)]),
            ")" if len(catalyses_modifiers) > 0 else "",
        ]))

    def as_signaling_formula(self):

        return (self.edge_type_int, lambda step,reverse=False,origin_filter=[]: 
                
                    0 if not self.fits_origins(origin_filter) else
                    sum(
                        [target.signal_at_step(step)/math.sqrt(target.in_degree) for source in self.targets] +
                        [modifier.signal_at_step(step)/math.sqrt(modifier.out_degree) for modifier in inhibition_modifiers]
                    ) if reverse else
                    sum(
                            [source.signal_at_step(step)/math.sqrt(source.out_degree) for source in self.sources] +
                            [modification.signals(step,origin_filter=origin_filter,reverse=reverse) for modification in self.modifications]
                    )
                    
               )