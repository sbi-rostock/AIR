let fileURL = '';
let testing;
let filetesting;
let Chart;

const localURL = 'http://localhost:3000/SBI_Minerva_Release/Centogene/DataFiles';
const githubURL = 'https://raw.githubusercontent.com/sbi-rostock/AIR/master/DataFiles';

const AIR = {
    MoleculeData: {},
    Phenotypes: {},
    Molecules: {},
    MoleculeNames: {},
    Interactions: {},
    ElementNames: {

        name:{},
        uniprot: {},
        mirbasemature: {},
        HGNC: {},
        entrez: {},
        ncbigene: {},
        chebi:{},
        ensembl: {},
    },
    Centrality: {
        Betweenness: {},
        Closeness: {},
        Degree: {},
        Indegree: {},
        Outdegree: {},
    },
    centralityheader: new Set(),
    MIMSpecies: [],
    MIMSpeciesLowerCase: [],
    allBioEntities: [],
    MapElements: {},
}

const globals = {
    targetchart: undefined,
    centralitychart: undefined,

    selected: [],
    pickedRandomly: undefined,

    data: [],
    
    info: [],
    infonames: [],

    container: undefined,
    interactionpanel: undefined,
    targetpanel: undefined,
    centralitypanel: undefined,
    downloadtext: '',

    regulationtable: undefined,
    targettable: undefined,
    phenotypetable: undefined,
    centraliytable: undefined,

    targetphenotypetable: undefined,

    defaultusers: ['anonymous', 'guest', 'guest user'],
    specialCharacters: ['+', '#', '*',  '~', '%', '&', '$', '§', '"'],
    guestuser: ['airuser'],

    user: undefined,

    numberofuserprobes: 0,
    selected: [],

    pickedRandomly: undefined,
    numberofuserprobes: 0,

    //colors: ['#ED8893','#716DC5','#AA7AAE','#E0D2E5','#DFA6BA','#9491D3','#F2EAF2','#B8B5E1'],
    colors: ["#4E79A7","#F28E2B","#E15759","#76B7B2","#59A14F","#EDC948", "#B07AA1","#FF9DA7","#9C755F","#BAB0AC"],
    //'#b15928', '#cab2d6', '#a6cee3', '#ff7f00', '#fdbf6f', '#e31a1c', '#fb9a99', '#6a3d9a', '#1f78b4', '#33a02c', '#ffff99', '#b2df8a'],
    pickedcolors: [],

    plevelchart_config: undefined,
    plevelchart: undefined,

    om_targetchart: undefined,
    xp_targetchart: undefined,

    spsliderchartconfig: undefined,
    idcolumn: 0,

    selectedmapping: "name",
    spsliderchart: undefined,

    url: '',

    complexMapID: undefined,
    fullMapID: undefined,
    phenotypeMapID: undefined,
    phenotypeImageMapID: undefined,

    calculated: false,
    ExpressionValues: {},

    Targets: {},

    alreadycalculated: false,
    targetsanalyzed: true,

    samples: [],
    samplesResults: [],
    samplestring: '',

    columnheaders: [],

    numberofSamples: 0,

    container: undefined,
    phenotab: undefined,
    targettab: undefined,
    resultscontainer: undefined,
    downloadtext: '',
};

const centralities = ["Betweenness", "Closeness", "Degree", "Indegree", "Outdegree"];

let minervaProxy;
let pluginContainer;
let pluginContainerId;
let minervaVersion;

function readDataFiles(_minerva, _chart, _testing, _filetesting) {

    return new Promise((resolve, reject) => {

        Chart = _chart;
        minervaProxy = _minerva;
        pluginContainer = $(minervaProxy.element);
        pluginContainerId = pluginContainer.attr('id');

        minerva.ServerConnector.getModels().then(models => {
            models.forEach((model, ix) => {

                var modelname = model.getName();
                if(modelname)
                {
                    switch(modelname.toString()) {
                        case "_MIM":
                            globals.fullMapID = model.getId();
                            break;
                        case "_Complexes":
                            globals.complexMapID = model.getId();
                            break;
                        case "Phenotypes":
                            globals.phenotypeMapID = model.getId();
                            break;
                        case "PhenotypeMap":
                            globals.phenotypeImageMapID = model.getId();
                            break;
                    }
                }    
            });
            minervaProxy.project.data.getAllBioEntities().then(function (bioEntities) {

                AIR.allBioEntities = bioEntities;
                bioEntities.forEach(e => {
                    if (e.constructor.name === 'Alias') {
                        let namelower = e.getName().toLowerCase();
                        AIR.MIMSpeciesLowerCase.push(namelower);
                        AIR.MIMSpecies.push(e.getName());
                        AIR.MapElements[namelower] = e;
                    }
                });
                testing = _testing;
                filetesting = _filetesting;
            
                
                if(filetesting){
                    fileURL = localURL;
                }
                else {
                    fileURL = githubURL;
                }

                let typevalue = $('.selectdata').val();
                //let urlstring = 'https://raw.githubusercontent.com/sbi-rostock/SBIMinervaPlugins/master/datafiles/Regulations.txt';
                $.ajax({
                    url: fileURL + '/Interactions.json',
                    success: function (content) {
                        readInteractions(content).then(r => {
                            $.ajax({
                                //url: 'https://raw.githubusercontent.com/sbi-rostock/SBIMinervaPlugins/master/datafiles/Molecules.txt',
                                url: fileURL + '/Molecules.json', 
                                success: function (moleculecontent) {
                                    readMolecules(moleculecontent).then(s => { 
                                        readServerValues().then(r => {
                                            let promises = [];
                                            centralities.forEach(c => {
                                                promises.push(openCentrality(c));
                                            });
                                            Promise.all(promises).then(r => {
                                                resolve(AIR);
                                            });
                                        });
                                    });
                                },
                                error: function () {
                                    reject(AIR);
                                }
                            });
                        });;
                    },
                    error: function (content) {
                        alert(content);
                        reject(AIR);
                    }
                });
                function openCentrality(centrality)
                {
                    return new Promise((resolve, reject) => {
                        $.ajax({
                            //url: 'https://raw.githubusercontent.com/sbi-rostock/SBIMinervaPlugins/master/datafiles/Molecules.txt',
                            url: fileURL + '/' + centrality.toLowerCase() + ".txt", 
                            success: function (info) {
                                readCentrality(info, centrality).then(s => resolve('')).catch(e => {
                                    console.log(e);
                                    reject(e);
                                })
                            },
                        });
                    });
                }
                function readServerValues() {
                    return new Promise((resolve, reject) => {
                        let promises = [];
                        for (let p in AIR.Phenotypes) 
                        {
                            promises.push(
                                getMoleculeData(p).then(
                                    data => {
                                        let sum = 0;
                                        if(data.hasOwnProperty("Influences"))
                                        {
                                            for (let m in data.Influences)
                                            {
                                                let value = data.Influences[m];
                                                if(value != 0 && AIR.Molecules.hasOwnProperty(m))
                                                {
                                                    AIR.Phenotypes[p].values[m] = value;
                                                    sum += Math.abs(value);
                                                }
                                                
                                            }
                                        }
                                        if(data.hasOwnProperty("SPs"))
                                        {
                                            for (let m in data.SPs)
                                            {
                                                let value = data.SPs[m];
                                                if(value != 0 && AIR.Molecules.hasOwnProperty(m))
                                                {
                                                    AIR.Phenotypes[p].SPs[m] = value;
                                                }
                                                
                                            }
                                        }
                                        AIR.Phenotypes[p]["sumSP"] = sum;
                                }).catch(e => {
                                    console.log("Could not read phenotype " + p + " from server.");
                                })
                            )
                        };
                        Promise.all(promises).then(r =>    
                        {
                            resolve('');       
                        }).catch(e => {
                            console.log(error + " errors in fetching data.");
                            reject(error);
                        });
                    });
                }
                function readMolecules(content) {
                    return new Promise((resolve, reject) => {

                        if(filetesting)
                        {
                            AIR.Molecules = content;
                        }
                        else{
                            AIR.Molecules = JSON.parse(content);
                        }

                        for(let element in AIR.Molecules)
                        {
                            if(AIR.Molecules[element].complex === false)
                            {
                                for(let id in AIR.Molecules[element].ids)
                                {
                                    AIR.ElementNames[id.replace('.','')][AIR.Molecules[element].ids[id]] = element
                                }
                            }
                            if(AIR.Molecules[element].type === "PHENOTYPE")
                            {
                                AIR.Phenotypes[element] = {};
                                AIR.Phenotypes[element]["name"] = AIR.Molecules[element].name;
                                AIR.Phenotypes[element]["accuracy"] = 0;
                                AIR.Phenotypes[element]["results"] = {};
                                AIR.Phenotypes[element]["norm_results"] = {};
                                AIR.Phenotypes[element]["values"] = {};
                                AIR.Phenotypes[element]["value"] = 0;
                                AIR.Phenotypes[element]["SPs"] = {};
                            }
                        }

                        if(testing)
                        {
                            $.ajax({
                                url: localURL + "/SP.txt",
                                success: function (content) {
                                    readFile(content).then(r => {
                                        resolve('');
                                    });
                                },
                                error: function () {
                                }
                            });
                        }
                        else
                            resolve('');
                    });
                }
                function readCentrality(content, centrality) {
                    return new Promise((resolve, reject) => {
                        let firstline = true;
                        let header = [];
                        content.toString().split('\n').forEach(line => {
                                if (firstline === true) {

                                    firstline = false;

                                    var column = 0;

                                    line.split('\t').forEach(s => {
                                        header.push(s);
                                        if (column > 0) {
                                            AIR.centralityheader.add(s);
                                        }
                                        else
                                        {
                                            column++;
                                        }
                                    });
                                }
                                else {
                                    let id = "";
                                    let column = 0;
                                    let breakflag = false;

                                    line.split('\t').forEach(element => {

                                        if (column === 0) {
                                            if (element === "")
                                                breakflag = true;
                                            else {
                                                id = element;
                                                if(AIR.Centrality[centrality].hasOwnProperty(id) == false) {
                                                    AIR.Centrality[centrality][id] = {};
                                                }
                                            }
                                        }
                                        else if (breakflag === false) {
                                            let pname = header[column];
                                            let value = parseFloat(element)

                                            if(isNaN(value) == false){

                                                AIR.Centrality[centrality][id][pname] = Math.round((value + Number.EPSILON) * 100) / 100 ;
                                            }
                                        }

                                        column++;
                                    });
                                }
                        });
                        resolve('');
                    });
                }
                function readInteractions(content) {
                    return new Promise((resolve, reject) => {
                        if(filetesting)
                        {
                            AIR.Interactions = content;
                        }
                        else{
                            AIR.Interactions = JSON.parse(content);
                        }
                        resolve('');
                    });
                }
                function readFile(content) {
                    return new Promise((resolve, reject) => {
                        content.toString().split('\n').forEach(line => {
                            let first = true;
                            let id = "";
                            line.split('\t').forEach(element => {
                                if(first)
                                {
                                    id = element;
                                    first = false;
                                }
                                else {
                                    if(element != "")
                                    {
                                        AIR.MoleculeData[id] = JSON.parse(element)
                                    }
                                }
                            });
                        });
                        resolve('');
                    });
                }
            });
        })
    });
}

function getValue(key)
{
    return new Promise(
       (resolve, reject) => {
            if(testing)
            {
                $.ajax({
                    url: "http://localhost:8080/minerva/api/plugins/6f8b4f372b3ecaca43031b747162aa82/data/global/" + key,
                    success: (response) => {
                        resolve(response["value"]);
                    },
                    error: (e) => {
                        reject(e);
                    }
                })
            }
            else {
                minervaProxy.pluginData.getGlobalParam(key).then(
                    response => {
                        resolve(JSON.parse(response).value);
                }).catch(e => {
                    reject(e)
                });
            }
        });

}

function getMoleculeData(key)
{
    return new Promise(
       (resolve, reject) => {
            if(AIR.MoleculeData.hasOwnProperty(key))
            {
                let data = AIR.MoleculeData[key];
                resolve(data);
            }
            else {
                getValue(key).then(response => {
                    let data = JSON.parse(response);
                    AIR.MoleculeData[key] = data;
                    resolve(data);
                }).catch(e => {
                    resolve({});
                });
            }
        });

}

function highlightSelected(pickedRandomly = false) {

    minervaProxy.project.map.getHighlightedBioEntities().then(highlighted => {

        minervaProxy.project.map.hideBioEntity(highlighted).then(r => {

            const highlightDefs = [];

            if (pickedRandomly) {
                if (globals.pickedRandomly) {
                    highlightDefs.push({
                        element: {
                            id: globals.pickedRandomly.id,
                            modelId: globals.pickedRandomly.getModelId(),
                            type: globals.pickedRandomly.constructor.name.toUpperCase()
                        },
                        type: "SURFACE",
                        options: {
                            color: '#00FF00',
                            opacity: 0.2
                        }
                    });
                }
            } else {
                globals.selected.forEach(e => {
                    if (e.constructor.name === 'Alias') {
                        highlightDefs.push({
                            element: {
                                id: e.id,
                                modelId: e.getModelId(),
                                type: "ALIAS"
                            },
                            type: "ICON"
                        });
                    }
                });
            }

            minervaProxy.project.map.showBioEntity(highlightDefs);
        });
    });
}

function focusOnSelected() {

    function focus(entity) {
        if (entity.constructor.name === 'Alias') {
            minervaProxy.project.map.fitBounds({
                modelId: entity.getModelId(),
                x1: entity.getX(),
                y1: entity.getY(),
                x2: entity.getX() + entity.getWidth(),
                y2: entity.getY() + entity.getHeight()
            });
        } else {
            minervaProxy.project.map.fitBounds({
                modelId: entity.getModelId(),
                x1: entity.getCenter().x,
                y1: entity.getCenter().y,
                x2: entity.getCenter().x,
                y2: entity.getCenter().y
            });
        }
    }

    if (globals.selected.length > 0) {
        minervaProxy.project.map.openMap({ id: globals.selected[0].getModelId() });
        focus(globals.selected[0]);
    }
}

function getElementType(name)
{
    var type = null;

    for(let element in AIR.Molecules)
    {
        if(AIR.Molecules[element].name.toLowerCase() === name.toLowerCase())
        {
            type = AIR.Molecules[element].type;
            break;
        }
    }

    if(!type)
    {
        AIR.allBioEntities.forEach(e => {
            if (e.constructor.name === 'Alias') {
                if (name.toLowerCase() === e.getName().toLowerCase()) {
                    type = e._type;
                }
            };
        });
    }
    
    return type;
}

function selectElementonMap(element, external)
{
    let namelower = element.toLowerCase();
    globals.selected = [];

    if(AIR.MapElements.hasOwnProperty(namelower))
    {
        globals.selected.push(AIR.MapElements[namelower]);
        focusOnSelected();   
    }
    else if(external)
    {
        let link = getLink(element);

        if(link)
        {
            window.open(link, "_blank");
        }     
    }
}

function getLink(name) {

    let link = null;
    for(let e in AIR.Molecules)
    {
        let {name:_name, ids:_ids} = AIR.Molecules[e];
        
        if(_name.toLowerCase() === name.toLowerCase())
        {
            for(let id in _ids)
            {
                if(id != "name")
                {
                    link = 'http://identifiers.org/' + id + "/" + _ids[id] ,'_blank';
                    break;
                }
            }

        }
    }

    return link;
}

function getLinkIconHTML(element) {

    let namelower = element.toLowerCase();
    let output = "";
    if(AIR.MapElements.hasOwnProperty(namelower))
    {
        output += '<a href="#" class="elementlink">' + element + '</a>';
    }
    else
    {
        output += '<span>' + element + '</span>';
    }

    let link = getLink(element);

    if(link)
    {
        output += '<a target="_blank" href="' + link + '"><span class="fa fa-external-link ml-2"></span></a>';
    }

    return output;
}

function createLinkCell(row, type, text, style, align) {
    var link = document.createElement('a');
    link.href = '#'; // create text node
    link.innerHTML = text;                    // append text node to the DIV

    var cell = document.createElement(type);
    cell.setAttribute('class', style);
    cell.setAttribute('style', 'text-align: ' + align + '; vertical-align: middle;');      // create text node
    cell.appendChild(link);     // append DIV to the table cell

    row.appendChild(cell);
    
    return link;
}


function createCell(row, type, text, style, scope, align) {
    var cell = document.createElement(type); // create text node
    cell.innerHTML = text;                    // append text node to the DIV
    cell.setAttribute('class', style);
    if (scope != '')
        cell.setAttribute('scope', scope);  // set DIV class attribute // set DIV class attribute for IE (?!)
    cell.setAttribute('style', 'text-align: ' + align + '; vertical-align: middle;');               // append DIV to the table cell
    row.appendChild(cell);

    return cell;
}
function createButtonCell(row, type, text, data, align) {
    var button = document.createElement('button'); // create text node
    button.innerHTML = text;
    button.setAttribute('type', 'button');
    button.setAttribute('class', 'clickPhenotypeinTable');
    button.setAttribute('data', data);

    var cell = document.createElement(type); // create text node
    cell.appendChild(button);
    cell.setAttribute('style', 'text-align: ' + align + '; vertical-align: middle;');// append DIV to the table cell
    row.appendChild(cell);

    return button; // append DIV to the table cell
}
function checkBoxCell(row, type, text, data, align) {
    var button = document.createElement('input'); // create text node
    button.innerHTML = text;
    button.setAttribute('type', 'checkbox');
    button.setAttribute('class', 'clickCBinTable');
    button.setAttribute('data', data);

    var cell = document.createElement(type); // create text node
    cell.appendChild(button);
    cell.setAttribute('style', 'text-align: ' + align + '; vertical-align: middle;');// append DIV to the table cell
    row.appendChild(cell);// append DIV to the table cell
}

function createSliderCell(row, type, data) {
    var button = document.createElement('input'); // create text node
    button.setAttribute('type', 'range');
    button.setAttribute('value', '0');
    button.setAttribute('min', '-2');
    button.setAttribute('max', '2');
    button.setAttribute('step', '0.1');
    button.setAttribute('class', 'slider xp_slider');

    var cell = document.createElement(type);
    cell.setAttribute('style', 'text-align: center; vertical-align: middle;');     // create text node
    cell.appendChild(button);     // append DIV to the table cell
    row.appendChild(cell);



    return button;
}