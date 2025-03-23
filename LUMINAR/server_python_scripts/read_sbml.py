from xml.dom import minidom
import os
import io
import itertools
import csv
import pandas as pd
import hashlib
from urllib.parse import unquote
import zipfile
import io
import requests
from collections import defaultdict

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
        exec(f"from {import_path}model import *")
        exec(f"from {import_path}basic_functions import *")
        model_imported = True
        break
    except ImportError as e:
        print(f"Failed to import from {import_path}: {e}")

if not model_imported:
    raise ImportError("Failed to import model from any of the specified paths.")
    
def get_tag(tag_list, na_value = 0, defaultvalue = 10):
    return (float(tag_list[0].split("=")[1].strip()) if "=" in tag_list[0] else defaultvalue) if tag_list else na_value
    
def read_species(xmldoc, id_as_name = False):
    """Reads all Species information from subunit and "normal" species list."""
    species = dict()
    for s in xmldoc.getElementsByTagName('species') + xmldoc.getElementsByTagName('celldesigner:species'):        
        complex_tag = s.getElementsByTagName('celldesigner:structuralState')
        hypothetical = s.getElementsByTagName('celldesigner:hypothetical')
        
        notes = s.getElementsByTagName('notes')
        if notes:
            tags = notes[0].getElementsByTagName('body')
            tags = tags[0].firstChild.toxml().split("\n") if tags else []       
            tags = sum([list(tag.lower().replace("tags:", "").split(",")) for tag in tags if tag.lower().startswith("tags:")], [])
        else:
            tags = []
            
        tags = [tag.strip() for tag in tags]
        
        notes = s.getElementsByTagName('celldesigner:notes')
        if notes:
            references = notes[0].getElementsByTagName('rdf:li')
            references = [reference.attributes['rdf:resource'].value.replace("urn:miriam:", "") for reference in references]
        else:
            references = []
            
        storage_tags = [tag for tag in tags if tag.startswith("storage")]  
        delay_tags = [tag for tag in tags if tag.startswith("delay")]  
        decay_tags = [tag for tag in tags if tag.startswith("decay")]  
        lower_limit_tags = [tag for tag in tags if tag.startswith("lower_limit")]  
        upper_limit_tags = [tag for tag in tags if tag.startswith("upper_limit")] 
        species[s.attributes['id'].value] = {
            "compartment": s.attributes['compartment'].value if s.hasAttribute('compartment') else "",
            "name": s.attributes['id'].value if id_as_name else s.attributes['name'].value.strip().replace("_space_", " "),
            "type": s.getElementsByTagName('celldesigner:class')[0].firstChild.toxml(),
            "initial": int(float(s.attributes['initialAmount'].value)) if "initialAmount" in s.attributes else 0,
            "delay": get_tag(delay_tags),
            "decay": get_tag(decay_tags, na_value = 1, defaultvalue = 1),
            "storage": get_tag(storage_tags),
            "upper_limit": get_tag(upper_limit_tags, na_value = None, defaultvalue = None),
            "lower_limit": get_tag(lower_limit_tags, na_value = None, defaultvalue = None),
            "family": True if complex_tag and complex_tag[0].attributes['structuralState'].value.lower() == "family" else False,
            "complex": s.getElementsByTagName('celldesigner:complexSpecies')[0].firstChild.toxml() if s.getElementsByTagName('celldesigner:complexSpecies') else "",
            "states": tuple([modifier.attributes['state'].value.strip() for modifier in s.getElementsByTagName('celldesigner:modification')])  if s.getElementsByTagName('celldesigner:modification') else (),
            'hypothetical': True if hypothetical and hypothetical[0].firstChild.toxml() == "true" else False,
            'references': references
        }
    return species

def read_species_alias(xmldoc):
    """Reads all Species information from subunit and "normal" species list."""
    species_alias_data = dict()
    for s in xmldoc.getElementsByTagName('celldesigner:complexSpeciesAlias') + xmldoc.getElementsByTagName('celldesigner:speciesAlias'):        
        species_id = s.attributes['species'].value
        if species_id not in species_alias_data:
            species_alias_data[species_id] = {
                "positions": set(),
                "activity": False,
                "map_ids": [],
            }
            
        bounds = s.getElementsByTagName('celldesigner:bounds')[0]
        species_alias_data[species_id]["positions"].update(set([(
            int(float(bounds.attributes['x'].value)),
            int(float(bounds.attributes['y'].value)),
            int(float(bounds.attributes['w'].value)),
            int(float(bounds.attributes['h'].value))
        )]))

        active = s.getElementsByTagName('celldesigner:activity')
        if active and active[0].firstChild.toxml() == "active":
            species_alias_data[species_id]["activity"] = True
            
        species_alias_data[species_id]["map_ids"].append(s.attributes['id'].value)
        
    return species_alias_data

def read_compartments(xmldoc):
    return {c.attributes['id'].value: (c.attributes['name'].value.lower().replace("_space_", " ").replace("_minus_", "-") if c.hasAttribute("name") else "") for c in xmldoc.getElementsByTagName('compartment') }

def read_size(xmldoc):
    sizes = xmldoc.getElementsByTagName('celldesigner:modelDisplay')[0]
    return (int(float(sizes.attributes['sizeX'].value)), int(float(sizes.attributes['sizeY'].value)))

def read_reactions(xmldoc):
    reactions = []
    for r in xmldoc.getElementsByTagName('reaction'):
        modifiers = dict()
        pubmeds = []

        modification_list =  r.getElementsByTagName('celldesigner:listOfModification')
        reaction_type = r.getElementsByTagName('celldesigner:reactionType')[0].firstChild.toxml()
        
        sources = [source.attributes['species'].value for source in r.getElementsByTagName('celldesigner:baseReactant')]
        sourcelinks = [source.attributes['reactant'].value for source in r.getElementsByTagName('celldesigner:reactantLink')]

        targets = [source.attributes['species'].value for source in r.getElementsByTagName('celldesigner:baseProduct')]
        targetlinks = [source.attributes['product'].value for source in r.getElementsByTagName('celldesigner:productLink')]
        
        tags = r.getElementsByTagName('notes')
        if tags:
            tags = tags[0].getElementsByTagName('body')
            tags = tags[0].firstChild.toxml().split("\n") if tags else []       
            tags = sum([list(tag.lower().replace("tags:", "").split(",")) for tag in tags if tag.lower().startswith("tags:")], [])
        else:
            tags = []
        probabilistic_tags = [tag for tag in tags if tag.startswith("probabilistic")]  
        refill_tags = [tag for tag in tags if tag.startswith("refill")]  
        consumption_tags = [tag for tag in tags if tag.startswith("consumption")]  
        
        # FALSE if OR boolean gate --> then a new reaction is created for each source/substrate
        all_sources_required = True
        
        if reaction_type == "BOOLEAN_LOGIC_GATE":
            gate_member = r.getElementsByTagName('celldesigner:GateMember')[0]
            reaction_type = gate_member.attributes['modificationType'].value
            
            if gate_member.attributes['type'].value == "BOOLEAN_LOGIC_GATE_OR":
                all_sources_required = False

        modifications = []
        if modification_list:
            
            # BOOLEAN_LOGIC_GATE modifications are repeated in the xml file for each involved modifier individually and thus need to be skipped
            skip = 0
            for modification in modification_list[0].getElementsByTagName('celldesigner:modification'):
                if skip:
                    skip -= 1
                    continue
                modifier_nodes = tuple(modification.attributes['modifiers'].value.split(","))
                if "modificationType" in modification.attributes:
                    mod_type = modification.attributes['modificationType'].value
                    skip = len(modifier_nodes)
                    logic_gate = modification.attributes['type'].value
                    if logic_gate == "BOOLEAN_LOGIC_GATE_OR":
                        for modifier in modifier_nodes:
                            modifications.append(((modifier,), mod_type))
                    else:
                        modifications.append((modifier_nodes, ("INHIBITION" if mod_type == "INHIBITION" else "INHIBITION") if logic_gate == "BOOLEAN_LOGIC_GATE_NOT" else mod_type))
                else:
                    modifications.append((modifier_nodes, modification.attributes['type'].value))
   
        for reference in r.getElementsByTagName('rdf:li'):
            ref_id = reference.attributes["rdf:resource"].value        
            if "pubmed" in ref_id:
                pubmeds.append(ref_id[ref_id.rindex(':')+1:])

        for source_list in ([sources] if all_sources_required else [[source] for source in sources + sourcelinks]):
            reactions.append({
                "sources" : source_list,
                "sourcelinks": sourcelinks if all_sources_required else [],
                "targets" : targets,
                "targetlinks": targetlinks,
                "modifiers" : modifications,
                "type" : reaction_type,
                "pubmeds" : pubmeds,
                "consumption": get_tag(consumption_tags),
                "probabilistic": True if probabilistic_tags else False,                
                "refill": True if refill_tags else False,
                "reversible": False if 'reversible' in r.attributes and r.attributes['reversible'].value == "false" else True,
                "id": r.attributes['id'].value
            })
    return reactions

def get_compartment(sid, spec_dict, compartment_dict):
    if spec_dict[sid]["complex"]:
        return get_compartment(spec_dict[sid]["complex"], spec_dict, compartment_dict)
    else:
        return compartment_dict[spec_dict[sid]["compartment"]] 
    
def create_model(folder, files = [], grid = (1,1), compartment_specific = False, id_as_name = False, seed = 0):

    model = Model(grid = grid, seed = seed)
    model.project = folder
    file_list = files if files else [file for file in os.listdir(folder) if file.endswith(".xml")]
 
    for i,file in enumerate(file_list):
        
        try:
            xmldoc = minidom.parseString(open(folder + r'/' + file, mode="r", encoding="utf-8").read())
        except:
            xmldoc = minidom.parseString(open(folder + r'/' + file, mode="r", encoding="ISO-8859-1").read())
        
        model.files[file] = {
            "path": folder + r'/' + file,
            "size": read_size(xmldoc)
        }
        
        compartments = read_compartments(xmldoc)
        compartments[""] = ""
    
        sbml_species = read_species(xmldoc, id_as_name = id_as_name)
        species_alias_data = read_species_alias(xmldoc)
        
        sbml_id_node_mapping = {}
        def add_spec_to_model(species):
            if species[0] not in sbml_id_node_mapping:
                sbml_id_node_mapping[species[0]] = Node(model,
                                                        species[1]["name"],
                                                        nodetype = species[1]["type"],
                                                        states = species[1]["states"] + (("active",) if species[0] in species_alias_data and species_alias_data[species[0]]["activity"] else ()),
                                                        subunits = tuple([add_spec_to_model(subspec) for subspec in sbml_species.items() if subspec[1]["complex"] == species[0]]),
                                                        compartment = get_compartment(species[0], sbml_species, compartments) if compartment_specific else "",
                                                        family = species[1]["family"],
                                                        initial = sbml_species[species[1]["complex"]]["initial"] if species[1]["complex"] else species[1]["initial"],
                                                        storage = species[1]["storage"], 
                                                        delay = species[1]["delay"], 
                                                        decay = species[1]["decay"], 
                                                        lower_limit = species[1]["lower_limit"], 
                                                        upper_limit = species[1]["upper_limit"],
                                                        hypothetical = species[1]["hypothetical"],
                                                        origins = [file],
                                                        map_ids = species_alias_data[species[0]]["map_ids"] if species[0] in species_alias_data else set(),
                                                        positions = {file: (species_alias_data[species[0]]["positions"] if species[0] in species_alias_data else set())},
                                                        submap = True,
                                                        references = species[1]["references"]
                                                       )                  
            return sbml_id_node_mapping[species[0]]
        
        for species in sbml_species.items():
            add_spec_to_model(species)

        for reaction in read_reactions(xmldoc):
            forward_reactants = (reaction["sources"], reaction["sourcelinks"], reaction["targets"], reaction["targetlinks"])
            reverse_reactants = (reaction["targets"], reaction["targetlinks"], reaction["sources"], reaction["sourcelinks"])
            
            for sources, sourcelinks, targets, targetlinks in [forward_reactants,reverse_reactants] if reaction["reversible"] else [forward_reactants]:
                
                sources = [sbml_id_node_mapping[spec] for spec in sources]
                targets = [sbml_id_node_mapping[spec] for spec in targets]
                
                sourcelinks = [sbml_id_node_mapping[spec] for spec in sourcelinks]
                targetlinks = [sbml_id_node_mapping[spec] for spec in targetlinks]
                
                # This allows to summarize transport oder modifcation processes in family elements without mixing up
                # Edges will only be generated between elements of the same name                                 
                same_nodes = True if len(sources) == 1 and sources[0].family and len(targets) == 1 and targets[0].family and (reaction["type"] == "STATE_TRANSITION" or reaction["type"] == "TRANSPORT") else False

                sources = [spec.extended_subunit_list() for spec in sources]
                targets = [spec.extended_subunit_list() for spec in targets]
                
                sourcelinks = [spec.extended_subunit_list() for spec in sourcelinks]
                targetlinks = [spec.extended_subunit_list() for spec in targetlinks]
                
                # same_nodes = True if tuple(sorted([node.name for node in sum(sources, [])])) == tuple(sorted([node.name for node in sum(targets, [])])) else False
                
                sources = list(itertools.product(*sources))
                targets = list(itertools.product(*targets))
                
                sourcelinks = list(itertools.product(*sourcelinks))
                targetlinks = list(itertools.product(*targetlinks))
                
                for source_combination in sources:
                    for target_combination in targets:
                        for sourcelink_combination in sourcelinks:
                            for targetlink_combination in targetlinks:
                                if same_nodes and tuple(sorted([node.name for node in source_combination])) != tuple(sorted([node.name for node in target_combination])):
                                    continue
                                edge = Edge(
                                    model,
                                    list(source_combination), 
                                    list(target_combination),
                                    sourcelinks = list(sourcelink_combination),
                                    targetlinks = list(targetlink_combination),
                                    edgetype = reaction["type"], 
                                    pubmeds = reaction["pubmeds"], 
                                    probabilistic = reaction["probabilistic"],
                                    consumption = reaction["consumption"],
                                    refill = reaction["refill"],
                                    origins = [file], 
                                    map_ids = [reaction["id"]],
                                    submap = True
                                )
                                for sbml_modifiers,modification in reaction["modifiers"]:
                                    mod_specs = [sbml_id_node_mapping[spec].extended_subunit_list() for spec in sbml_modifiers]
                                    for modifier_combination in itertools.product(*mod_specs):
                                        edge.add_modification(modifier_combination, modification, origins = [file])   

    for node in model.nodes:
        if node.subunits and not node.family:
            Edge(
                    model,
                    list(node.subunits), 
                    [node], 
                    edgetype = "COMPLEX_FORMATION",
                )        
    
    model.update_signaling()
    #model.set_initial_state()
    
    return model

def read_interaction_tables(folder, model, files = [], remove_disconnected = True, group_delimiter = ',', complex_delimiter = None, **kwargs):
    
    if complex_delimiter == group_delimiter:
        return "ERROR group and complex delimiters cannot be the same."
    
    def get_delimiter(file_path, _bytes = 4096):
        with io.open(file_path, "r") as data:
            delimiter = str(csv.Sniffer().sniff(data.read(_bytes)).delimiter)
            print("del:" + delimiter)
            print(ord(delimiter))
            return delimiter
    
    file_list = files if files else os.listdir(folder)
    
    for i,file in enumerate(file_list):
        
        file_path = folder + r'/' + file

        # data = pd.read_csv(file_path, sep=get_delimiter(file_path), encoding = "ISO-8859-1")
        
        try:
            data = pd.read_csv(file_path, sep="\t", encoding="ISO-8859-1")
        except:
            data = pd.read_csv(file_path, sep=",", encoding="ISO-8859-1")

        data = data.astype(str)
        data.rename(columns=lambda x: x.lower().replace(" ", ""), inplace=True)

        column_exists = {"".join(header): ("".join(header) in data.columns.values) for header in list(itertools.product(["source", "target", "modifier"],["","type","state"])) + ["compartment", "interaction", "modification", "pubmed"]}

        for index, row in data.iterrows():
            nodes = {
                "source": set(),
                "target": set(),
                "modifier": set(),
            }  

            compartment = row["compartment"] if column_exists["compartment"] else ""            
            for interaction_partner in ["source", "target", "modifier"]:
                if not column_exists[interaction_partner]:
                    continue
                node_type = str(row[interaction_partner + "type"]) if column_exists[interaction_partner + "type"] else "PROTEIN"
                node_states = tuple(row[interaction_partner + "state"].split(",")) if column_exists[interaction_partner + "state"] else ()
                
                for node_name in row[interaction_partner].split(group_delimiter):

                    if complex_delimiter and complex_delimiter in node_name:
                        subunit_nodes = [
                            Node(
                                model,
                                subunit_name.strip(), 
                                nodetype = node_type, 
                                compartment = compartment, 
                                origins = [file],
                            ) for subunit_name in node_name.split(complex_delimiter)
                        ]
                        nodes[interaction_partner].add(
                            Node(
                                model,
                                ":".join([subunit.name for subunit in subunit_nodes]), 
                                nodetype = node_type,
                                states = node_states, 
                                subunits = tuple(subunit_nodes),
                                compartment = compartment, 
                                origins = [file],
                            )
                        )
                    else:
                        nodes[interaction_partner].add(
                            Node(
                                model,
                                node_name.strip(), 
                                nodetype = node_type,
                                states = node_states, 
                                compartment = compartment, 
                                origins = [file],
                            )
                        )
            interaction_types = {t: "positive" for t in ["interaction", "modification"]}
            for interaction_type in interaction_types:
                if column_exists[interaction_type]:   
                    try:
                        tmp = float(row[interaction_type])
                        interaction_types[interaction_type] = "positive" if tmp > 0 else "negative" if tmp < 0 else "binding"
                    except:
                        if any([(_type in row[interaction_type].lower()) for _type in ["negative", "inhibition", "repression"]]):
                            interaction_types[interaction_type] = "negative"
                        elif any([(_type in row[interaction_type].lower()) for _type in ["positive", "activation"]]):
                            interaction_types[interaction_type] = "positive"
                        else:
                            interaction_types[interaction_type] = row[interaction_type]
                        
            if nodes["source"] and nodes["target"]:                
                edge = Edge(
                    model,
                    list(nodes["source"]), 
                    list(nodes["target"]),
                    edgetype = interaction_types["interaction"], 
                    pubmeds = str(row["pubmed"]).split(',') if column_exists["pubmed"] else [], 
                    origins = [file], 
                )
                if nodes["modifier"]:                    
                    edge.add_modification(tuple(nodes["modifier"]), interaction_types["modification"], origins = [file])
        
    model.connect_rna_proteins()
        
    if remove_disconnected:
        model.remove_disconnected_networks(**kwargs)
        
    model.update_signaling()
    model.set_initial_state()

def download_minerva(project_url, project_id, project_date):

    hasher = hashlib.md5()
    for hash_id in [project_url, project_id, project_date]:
        hasher.update(hash_id.encode())

    project_hash = hasher.hexdigest()
    session_token = uuid4().hex


    dir_path = NETWORK_FOLDER + r"/" + str(project_hash) + "/"
    submap_path = dir_path + "submaps"
    image_path = dir_path + "images"

    if not os.path.exists(dir_path):

        url = project_url + '/minerva/api/projects/' + project_id + ':downloadSource'
        r = requests.get(url)

        if not r.ok:
            if r.status_code == 403:
                return "Project access denied.", 403
            else:
                return "Could not download disease map files.", r.status_code

        os.makedirs(submap_path)
        os.makedirs(image_path)

        # Try to get the filename from the 'Content-Disposition' header
        content_disposition = r.headers['content-disposition']
        filename = re.findall('filename=(.+)', content_disposition)[0]
        filename = unquote(filename)

        _, file_extension = os.path.splitext(filename)

        # If the file is a zip file
        if file_extension == '.zip':
            # Create a zipfile object from the content of the response
            zip_file = zipfile.ZipFile(io.BytesIO(r.content))
            # Iterate over each file in the zip file
            for file in zip_file.namelist():
                print(file)
                # If the file is an xml file
                if file.endswith('.xml'):
                    # Extract the file to the destination folder
                    with zip_file.open(file) as xml_file:
                        # Create a new file in the destination folder with the same name
                        with open(os.path.join(submap_path, os.path.basename(file)), 'wb') as output_file:
                            # Write the content of the xml file to the new file
                            output_file.write(xml_file.read())
                elif file.endswith('.png') or file.endswith('.jpg'):
                    # Extract the file to the destination folder
                    with zip_file.open(file) as image_file:
                        # Create a new file in the destination folder with the same name
                        with open(os.path.join(image_path, os.path.basename(file)), 'wb') as output_file:
                            # Write the content of the xml file to the new file
                            output_file.write(image_file.read())
        # If the file is an xml file
        elif file_extension == '.xml':
            # Save the file to the destination folder
            with open(os.path.join(submap_path, "map"), 'wb') as output_file:
                output_file.write(r.content)

    model = get_model(project_hash)

    SESSION_DATA[session_token] = {
        "directory": dir_path,
        "submap_folder": submap_path,
        "image_folder": image_path,
        "model": model,
        "project_hash": project_hash,
        'timestamp': datetime.now(),
        "project_id": project_id,
        "project_url": project_url
    }
    # response = flask.jsonify()
    # response.headers.add('Access-Control-Allow-Origin', '*')
    return {"hash": str(session_token)},201