let ENABLE_API_CALLS = true;
let TESTING;

//npm modules
let Chart;
let JSZip;
let FileSaver;
let VCF;
let ttest;
let Decimal;
let cytoscape;
var getFiles;

Object.filter = (obj, predicate) =>
    Object.keys(obj)
        .filter(key => predicate(key))
        .reduce((res, key) => (res[key] = obj[key], res), {});

const AIR = {
    HGNCElements: [],
    MoleculeData: {},
    Phenotypes: {},
    Hypoth_Phenotypes: {},
    Molecules: {},
    MoleculeNames: {},
    Interactions: {},
    ElementNames: {

        name: {},
        uniprot: {},
        mirbasemature: {},
        HGNC: {},
        entrez: {},
        ncbigene: {},
        chebi: {},
        ensembl: {},
    },
    centralityheader: new Set(),
    MapSpecies: [],
    MapSpeciesLowerCase: [],
    allBioEntities: [],
    MapElements: {},
    MapReactions: [],
    Paths: {},
    InfluenceData: {},
    Modifiers: {},
}

const globals = {

    variant: {},
    omics: {},
    xplore: {},
    masspec: {},

    container: undefined,

    defaultusers: ['anonymous', 'guest', 'guest user'],
    specialCharacters: ['+', '#', '*', '~', '%', '&', '$', '§', '"'],
    guestuser: ['airuser'],

    user: undefined,

    pickedRandomly: undefined,

    //colors: ['#ED8893','#716DC5','#AA7AAE','#E0D2E5','#DFA6BA','#9491D3','#F2EAF2','#B8B5E1'],

    complexMapID: undefined,
    fullMapID: undefined,
    phenotypeMapID: undefined,
    phenotypeImageMapID: undefined,

    submaps: {},

    container: undefined,
    om_container: undefined,
    gv_container: undefined,
};

const centralities = ["Betweenness", "Closeness", "Degree", "Indegree", "Outdegree"];

let minervaProxy;
let pluginContainer;
let pluginContainerId;
let minervaVersion;


function readDataFiles(_minerva, _filetesting, getfiles, _chart, _ttest, _jszip, _filesaver, _vcf, _decimal, _cytoscape) {

    return new Promise((resolve, reject) => {

    
        minerva.ServerConnector.getLoggedUser().then(function (user) {
            globals.user = user._login.toString().toLowerCase();

            var t0 = 0;
            var t1 = 0;

            cytoscape = _cytoscape;
            Chart = _chart;
            VCF = _vcf;
            JSZip = _jszip;
            FileSaver = _filesaver;
            TESTING = _filetesting;
            minervaProxy = _minerva;
            getFiles = getfiles;
            ttest = _ttest;
            Decimal = _decimal;
            pluginContainer = $(minervaProxy.element);
            pluginContainerId = pluginContainer.attr('id');

            
            minervaProxy.project.map.addListener({
                dbOverlayName: "search",
                type: "onSearch",
                callback: xp_searchListener
            });        

            minerva.ServerConnector.getModels().then(models => {
                models.forEach((model, ix) => {

                    var modelname = model.getName();
                    if (modelname) {
                        switch (modelname.toString()) {
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
                            case "Map":
                                break;
                            default:
                                globals.submaps[model.getId()] = modelname;
                        }
                    }
                });
                t0 = performance.now();
                $('#air_loading_text').html('Reading elements ...')
                setTimeout(() => {
                    minervaProxy.project.data.getAllBioEntities().then(function (bioEntities) {

                        t1 = performance.now()
                        console.log("Call to getAllBioEntities took " + (t1 - t0) + " milliseconds.")

                        AIR.allBioEntities = bioEntities;
                        for (let e of bioEntities) {
                            if (e.constructor.name === 'Alias') {
                                let name = e.getName();
                                let namelower = name.toLowerCase();
                                AIR.MapSpeciesLowerCase.push(namelower);
                                AIR.MapSpecies.push(name);

                                if (!AIR.MapElements.hasOwnProperty(namelower))
                                    AIR.MapElements[namelower] = []

                                AIR.MapElements[namelower].push(e);
                            }
                            if (e.constructor.name === 'Reaction') {
                                AIR.MapReactions.push({
                                    "reactants": e._reactants.map(r => r._alias.name.toLowerCase()),
                                    "products": e._products.map(r => r._alias.name.toLowerCase()),
                                    "modifiers": e._modifiers.map(r => r._alias.name.toLowerCase()),
                                    "id": e.id,
                                    "modelId": e.getModelId()
                                })

                            }

                        };
                        function readMolecules(content) {
                            return new Promise((resolve, reject) => {

                                AIR.Molecules = JSON.parse(content);

                                for (let element in AIR.Molecules) {
                                    AIR.Molecules[element]["Centrality"] = {
                                        Betweenness: {},
                                        Closeness: {},
                                        Degree: {},
                                        Indegree: {},
                                        Outdegree: {},
                                    }
                                    AIR.Molecules[element]["Targets"] = {}
                                    AIR.Molecules[element]["Sources"] = {}
                                    AIR.Molecules[element]["InfluencedTargets"] = {}

                                    for (let id in AIR.Molecules[element].ids) {
                                        let db_key = id.replace('.', '');
                                        if (AIR.ElementNames.hasOwnProperty(db_key)) {
                                            if (!AIR.ElementNames[db_key].hasOwnProperty(AIR.Molecules[element].ids[id]))
                                                AIR.ElementNames[db_key][AIR.Molecules[element].ids[id]] = [];
                                            AIR.ElementNames[db_key][AIR.Molecules[element].ids[id]].push(element)
                                        }
                                    }
                                    if (AIR.Molecules[element].type === "PHENOTYPE") {
                                        AIR.Phenotypes[element] = {};
                                        AIR.Phenotypes[element]["name"] = AIR.Molecules[element].name;
                                        AIR.Phenotypes[element]["accuracy"] = 0;
                                        AIR.Phenotypes[element]["results"] = {};
                                        AIR.Phenotypes[element]["norm_results"] = {};
                                        AIR.Phenotypes[element]["values"] = {};
                                        AIR.Phenotypes[element]["value"] = 0;
                                        AIR.Phenotypes[element]["SPs"] = {};
                                        AIR.Phenotypes[element]["Paths"] = {};
                                        AIR.Phenotypes[element]["MainRegulators"] = {};
                                        AIR.Phenotypes[element]["SubmapElements"] = [];
                                    }
                                    if (AIR.Molecules[element].type === "HYPOTH_PHENOTYPE") {
                                        AIR.Hypoth_Phenotypes[element] = {};
                                        AIR.Hypoth_Phenotypes[element]["name"] = AIR.Molecules[element].name;
                                        AIR.Hypoth_Phenotypes[element]["accuracy"] = 0;
                                        AIR.Hypoth_Phenotypes[element]["results"] = {};
                                        AIR.Hypoth_Phenotypes[element]["norm_results"] = {};
                                        AIR.Hypoth_Phenotypes[element]["values"] = {};
                                        AIR.Hypoth_Phenotypes[element]["value"] = 0;
                                        AIR.Hypoth_Phenotypes[element]["SPs"] = {};
                                    }
                                }

                                for (let inter of AIR.Interactions) {
                                    if(inter.type == 0)
                                        continue;
                                    AIR.Molecules[inter.source].Targets[inter.target] = inter.type;
                                    AIR.Molecules[inter.target].Sources[inter.source] = inter.type;

                                    if (inter.subtype == "cat" || inter.subtype == "tf") {
                                        AIR.Molecules[inter.source].InfluencedTargets[inter.target] = inter.type;
                                    }
                                }

                                resolve('');
                            });
                        }
                        function readInteractions(content) {
                            return new Promise((resolve, reject) => {

                                AIR.Interactions = JSON.parse(content);

                                resolve('');
                            });
                        }
                        function readPhenotypePaths(content) {
                            return new Promise(async function (resolve, reject) {

                                await disablebutton("air_init_btn", progress = true);
                                let count = 0
                                let maxlength = Object.keys(AIR.Phenotypes).length
                                await updateProgress(count++, maxlength, "air_init_btn", text = " Calculating Shortest Paths");

                                let phenotypepaths;
                                
                                phenotypepaths = JSON.parse(content);

                                let paths = phenotypepaths.paths;
                                AIR.Modifiers = phenotypepaths.modifiers

                                for (let p in AIR.Phenotypes) {
                                    if (paths.hasOwnProperty(p))
                                        AIR.Phenotypes[p].paths = paths[p]

                                    let influence = await getPerturbedInfluences(p, [], true)
                                    AIR.Phenotypes[p].values = influence.values;
                                    AIR.Phenotypes[p].SPs = influence.SPs;
                                    AIR.Phenotypes[p].SubmapElements = influence.SubmapElements;
                                    await updateProgress(count++, maxlength, "air_init_btn", text = " Calculating Shortest Paths");
                                }

                                resolve('');
                            });
                        }
                        let typevalue = $('.selectdata').val();
                        //let urlstring = 'https://raw.githubusercontent.com/sbi-rostock/SBIMinervaPlugins/master/datafiles/Regulations.txt';
                        t0 = performance.now();
                        getFiles('Interactions.json').then(content => {
                            readInteractions(content).then(r => {
                                t1 = performance.now()
                                console.log("Call to get Interactions took " + (t1 - t0) + " milliseconds.")
                                t0 = performance.now();
                                $('#air_loading_text').html('Fetching data ...')
                                getFiles('Elements.json').then(moleculecontent => {
                                    t1 = performance.now()
                                    console.log("Call to get Molecules took " + (t1 - t0) + " milliseconds.")
                                    readMolecules(moleculecontent).then(s => {
                                        t0 = performance.now();

                                        calculateShortestPaths([], false, true, "air_init_btn").then(r => {
                                            t1 = performance.now()
                                            console.log("Call to calculate SPs took " + (t1 - t0) + " milliseconds.");
                                            getFiles('PhenotypePaths.json').then(pathcontent => {
                                                t1 = performance.now()
                                                console.log("Call to read Moleculestook " + (t1 - t0) + " milliseconds.")
                                                $("#air_loading_text").parent().after('<button type="button" id="air_init_btn" class="air_btn btn btn-block mt-2"></button>');
                                                readPhenotypePaths(pathcontent).then(s => {
                                                    $("#air_init_btn").remove()
                                                    t1 = performance.now()
                                                    console.log("Call to get Paths took " + (t1 - t0) + " milliseconds.")                                                    
                                                    t0 = performance.now();

                                                    var height = 160;
                                                    if (globals.defaultusers.includes(globals.user) === true) {

                                                        $("#stat_spinner").before(`
                                                        <div class="air_alert alert alert-danger mt-2" id="air_warning_user_alert">
                                                            <span>You are not logged in with an account. You can still use the plugins, but will not be able to create and store overlays.</span>
                                                            <button type="button" class="air_close close" data-dismiss="alert" aria-label="Close">
                                                                <span aria-hidden="true">&times;</span>
                                                            </button>
                                                        </div>      
                                                        `)
                                                        $('#air_warning_user_alert .close').on('click', function () {
                                                            if($('#air_welcome_alert').length)
                                                                $(".air_tab_pane").css("height", "calc(100vh - 165px)");
                                                            else
                                                                $(".air_tab_pane").css("height", "calc(100vh - 85px)");
                                                        });
                                                        height = 240;
                                                    }
                                                    else
                                                    {
                                                        $(".air_tab_pane").css("height", "calc(100vh - 160px)");
                                                    }

                                                    $("#stat_spinner").before(`
                                                        <div class="air_alert alert alert-info mt-2" id="air_welcome_alert">
                                                            <span>For questions about the methodology of the tools, please refer to our paper in <a href="https://www.nature.com/articles/s41540-022-00222-z" target="_blank">npj Systems Biology and Applications</a> or contact the <a href="https://air.bio.informatik.uni-rostock.de/team" target="_blank">AIR team</a>.</span>
                                                            <button type="button" class="air_close close" data-dismiss="alert" aria-label="Close">
                                                                <span aria-hidden="true">&times;</span>
                                                            </button>
                                                        </div>      
                                                    `)
                                                    $('#air_welcome_alert .close').on('click', function () {
                                                        if($('#air_warning_user_alert').length)
                                                            $(".air_tab_pane").css("height", "calc(100vh - 165px)");
                                                        else
                                                            $(".air_tab_pane").css("height", "calc(100vh - 85px)");
                                                    });

                                                    resolve(height);
                                                });
                                            })
                                        })
                                    });
                                });
                            });
                        })
                    });
                }, 0);
            })
        });
    });
}


// async function getValue(key, replacecomma = true) {
//     return new Promise(
//         (resolve, reject) => {
//             minervaProxy.pluginData.getGlobalParam(key).then(

//                 response => {
//                     let output = JSON.parse(response).value;
//                     if (replacecomma == true) {
//                         //output = replaceAll(output, ",", ".");
//                     }
//                     output = replaceAll(output, "y", '"},"');
//                     output = replaceAll(output, "x", '":{"');
//                     output = replaceAll(output, "z", '":"');
//                     output = replaceAll(output, "q", '","');
//                     output = replaceAll(output, '"-.', '"-0.');
//                     resolve({
//                         key: key,
//                         value: output
//                     });
//                 }).catch(e => {
//                     console.log(key + " not found.")
//                     reject()
//                 });
//         });

// }

// async function getMoleculeData(_key, type = "molecule", returndata = true, saveinmemory = true) {
//     let phenotype = (type == "molecule" ? false : true);
//     let key = _key + (type == "path" ? "_paths" : "");

//     return new Promise(
//         (resolve, reject) => {
//             if (_key == "m304") {
//                 console.log("test")
//             }
//             if (AIR.MoleculeData.hasOwnProperty(key)) {
//                 let data = AIR.MoleculeData[key];
//                 resolve(returndata ? {
//                     key: key,
//                     value: data
//                 } : true);
//             }
//             else {
//                 if (AIR.Molecules.hasOwnProperty(key) && AIR.Molecules[key].emptySP == true) {
//                     resolve(returndata ? {} : true);
//                 }
//                 else {
//                     getValue(key, replacecomma = (type == "path" ? false : true)).then(response => {
//                         let data = {};
//                         if (phenotype == false) {
//                             data = fillData(JSON.parse(response.value));
//                         }
//                         else {
//                             data = JSON.parse(response.value)
//                         }

//                         if (saveinmemory) {
//                             AIR.MoleculeData[response.key] = data;
//                         }

//                         resolve(returndata ? {
//                             key: response.key,
//                             value: data
//                         } : true);
//                     }).catch(e => {
//                         console.log("Error on key '" + key + "': " + e)
//                         resolve(returndata ? {
//                             key: key,
//                             value: {}
//                         } : false);
//                     });
//                 }
//             }

//             function fillData(data) {
//                 for (let e in data) {
//                     if (data[e].hasOwnProperty("s") == false) {
//                         data[e]["s"] = 0;
//                     }
//                     if (data[e].hasOwnProperty("i") == false) {
//                         data[e]["i"] = 0;
//                     }
//                 }

//                 return data;
//             }
//         });

// }


function highlightSelected(_elements, hideprevious = true) {

    let elements = _elements.map(v => v.toLowerCase());
    minervaProxy.project.map.getHighlightedBioEntities().then(highlighted => {

        minervaProxy.project.map.hideBioEntity(hideprevious ? highlighted : []).then(r => {

            highlightDefs = []

            AIR.allBioEntities.forEach(e => {
                if (e.constructor.name === 'Alias' && elements.includes(e.getName().toLowerCase())) {
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

            minervaProxy.project.map.showBioEntity(highlightDefs);
        });
    });
}
function ColorElements(_elements, hideprevious = true) {

    let elements = Object.fromEntries(
        Object.entries(_elements).map(([k, v]) => [k.toLowerCase(), v])
    );

    minervaProxy.project.map.getHighlightedBioEntities().then(highlighted => {

        minervaProxy.project.map.hideBioEntity(hideprevious ? highlighted : []).then(r => {

            highlightDefs = []

            AIR.allBioEntities.forEach(e => {
                if (e.constructor.name === 'Alias' && elements.hasOwnProperty(e.getName().toLowerCase())) {
                    highlightDefs.push({
                        element: {
                            id: e.id,
                            modelId: e.getModelId(),
                            type: "ALIAS"
                        },
                        type: "SURFACE",
                        options: {
                            color: elements[e.getName().toLowerCase()]
                        }

                    });
                }
            });

            minervaProxy.project.map.showBioEntity(highlightDefs);
        });
    });
}
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

function focusOnSelected() {
    if (globals.selected.length > 0) {
        minervaProxy.project.map.openMap({ id: globals.selected[0].getModelId() });
        focus(globals.selected[0]);
    }
}

function getElementType(name) {
    var type = null;

    for (let element in AIR.Molecules) {
        if (AIR.Molecules[element].name.toLowerCase() === name.toLowerCase()) {
            type = AIR.Molecules[element].realtype;
            break;
        }
    }

    if (!type) {
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

function selectElementonMap(element, external) {
    let namelower = element.toLowerCase();
    globals.selected = [];

    if (AIR.MapElements.hasOwnProperty(namelower)) {

        var submapid = (new URLSearchParams(window.location.search)).get('submap')

        for(let e of AIR.MapElements[namelower])
        {
            if(e.getModelId() == submapid)
            {

                globals.selected.push(e);
                focusOnSelected();
                return
            }
        }

        globals.selected.push(AIR.MapElements[namelower][0]);
        focusOnSelected();

    }
    else if (external) {
        let link = getLink(element);

        if (link) {
            window.open(link, "_blank");
        }
    }
}

function getLink(name) {

    let link = null;
    for (let e in AIR.Molecules) {
        let { name: _name, ids: _ids } = AIR.Molecules[e];

        if (_name.toLowerCase() === name.toLowerCase()) {
            for (let id in _ids) {
                if (id != "name") {
                    link = 'http://identifiers.org/' + id + "/" + _ids[id], '_blank';
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
    if (AIR.MapElements.hasOwnProperty(namelower)) {
        output += '<a href="#" class="air_elementlink">' + element + '</a>';
    }
    else {
        output += '<span>' + element + '</span>';
    }

    let link = getLink(element);

    if (link) {
        output += '<a target="_blank" href="' + link + '"><span class="fa fa-external-link-alt ml-2"></span></a>';
    }

    return output;
}

function createLinkCell(row, type, text, style, align) {
    // append text node to the DIV
    var cell = document.createElement(type); // create text node
    cell.innerHTML = getLinkIconHTML(text);                    // append text node to the DIV
    cell.setAttribute('class', style);
    cell.setAttribute('style', 'text-align: ' + align + '; white-space: nowrap; vertical-align: middle;');             // append DIV to the table cell

    if (row != null)
        row.appendChild(cell);

    return cell;
}

function createCustomLinkCell(row, type, text, style, scope, align, nowrap = false, order = "") {
    var cell = document.createElement(type);
    var _a = document.createElement("a");
    _a.href = "#"
    cell.appendChild(_a);
    _a.innerHTML = text;                    // append text node to the DIV
    cell.setAttribute('class', style);
    if (order) {
        cell.setAttribute("data-order", order);
    }
    if (scope != '')
        cell.setAttribute('scope', scope);  // set DIV class attribute // set DIV class attribute for IE (?!)
    if (nowrap)
        cell.setAttribute('style', 'text-align: ' + align + '; white-space: nowrap; vertical-align: middle;');
    else
        cell.setAttribute('style', 'text-align: ' + align + '; vertical-align: middle;');               // append DIV to the table cell

    if (row != null)
        row.appendChild(cell);

    return _a;
}

function createCell(row, type, text, classes, scope, align, nowrap = false, order = "") {
    var cell = document.createElement(type); // create text node
    cell.innerHTML = text;                    // append text node to the DIV
    cell.setAttribute('class', classes);
    if (order) {
        cell.setAttribute("data-order", order);
    }
    if (scope != '')
        cell.setAttribute('scope', scope);  // set DIV class attribute // set DIV class attribute for IE (?!)
    if (nowrap)
        cell.setAttribute('style', 'text-align: ' + align + '; white-space: nowrap; vertical-align: middle;');
    else
        cell.setAttribute('style', 'text-align: ' + align + '; vertical-align: middle;');               // append DIV to the table cell

    if (row != null)
        row.appendChild(cell);

    return cell;
}

function createPopupCell(row, type, text, style, align, callback, callbackParameters, order = "") {
    var cell = document.createElement(type); // create text node                  // append text node to the DIV
    cell.setAttribute('class', style);
    cell.setAttribute('style', 'text-align: ' + align + '; vertical-align: middle;');               // append DIV to the table cell
    if (order) {
        cell.setAttribute("data-order", order);
    }

    var button = document.createElement('button'); // create text node
    button.innerHTML = text;
    button.setAttribute('type', 'button');
    button.setAttribute('class', 'air_invisiblebtn');
    button.setAttribute('style', 'cursor: pointer;');
    button.onclick = function () {
        callback(button, callbackParameters)
    }

    cell.appendChild(button);

    $(cell).append();

    if (row != null)
        row.appendChild(cell);

    return cell;
}
function createButtonCell(row, type, text, align) {
    var button = document.createElement('button'); // create text node
    button.innerHTML = text;
    button.setAttribute('type', 'button');
    button.setAttribute('class', 'air_invisiblebtn');

    var cell = document.createElement(type); // create text node
    cell.appendChild(button);
    cell.setAttribute('style', 'text-align: ' + align + '; vertical-align: middle;');// append DIV to the table cell
    row.appendChild(cell);

    return button; // append DIV to the table cell
}
function checkBoxCell(row, type, text, data, align, prefix, _checked = false) {
    var button = document.createElement('input'); // create text node
    button.innerHTML = text;
    button.checked = _checked;
    button.setAttribute('type', 'checkbox');
    button.setAttribute('class', prefix + 'clickCBinTable');
    button.setAttribute('data', data);

    var cell = document.createElement(type); // create text node
    cell.appendChild(button);
    cell.setAttribute('style', 'text-align: ' + align + '; vertical-align: middle;');// append DIV to the table cell
    row.appendChild(cell);// append DIV to the table cell

    return button
}

function createSliderCell(row, type, data) {
    var button = document.createElement('input'); // create text node
    button.setAttribute('type', 'range');
    button.setAttribute('value', '0');
    button.setAttribute('min', '-1');
    button.setAttribute('max', '1');
    button.setAttribute('step', '0.05');
    button.setAttribute('class', 'slider air_slider');

    var cell = document.createElement(type);
    cell.setAttribute('style', 'text-align: center; vertical-align: middle;');     // create text node
    cell.appendChild(button);     // append DIV to the table cell
    row.appendChild(cell);



    return button;
}
async function disablediv(id, progress = false) {
    var promise = new Promise(function (resolve, reject) {
        setTimeout(() => {
            var $btn = $('#' + id);
            $btn.addClass("air_spinner")
            $btn.addClass("air_disabledbutton")
            resolve()
        }, 0);
    });
    return promise;
}

async function enablediv(id) {
    return new Promise(resolve => {
        setTimeout(() => {
            var $btn = $('#' + id);
            $btn.removeClass("air_spinner")
            $btn.removeClass("air_disabledbutton")
            resolve()
        }, 0);
    });
}
async function disablebutton(id, progress = false) {
    var promise = new Promise(function (resolve, reject) {
        setTimeout(() => {
            var $btn = $('#' + id);
            let text = $btn.html();
            if (progress == false) {
                $btn.html('<span class="loadingspinner spinner-border spinner-border-sm"></span>');
            }
            else {
                $btn.empty().append(`<div class="air_progress position-relative mb-4">
                    <div id= "${id}_progress" class="air_progress_value"></div>
                    <span id="${id}_progress_label" class="air_progress_label justify-content-center d-flex position-absolute w-100">0 %</span>
                </div>`);
            }

            $(".air_btn").each(function (pindex) {
                var airbtn = $(this)
                airbtn.addClass("air_temp_disabledbutton");
            });
            resolve(text)
        }, 0);
    });
    return promise;
}

async function enablebtn(id, text) {
    return new Promise(resolve => {
        setTimeout(() => {

            $(".air_btn").each(function (pindex) {
                $(this).removeClass("air_temp_disabledbutton");
            });
            var $btn = $('#' + id);
            $btn.html(text);
            resolve('');
        }, 0);
    });
}

async function startloading()
{
    return new Promise(resolve => {
        setTimeout(() => {

            $("#air_plugincontainer").addClass("waiting")
            $("body").css("cursor", "progress");
            resolve('');
        }, 0);
    });
}

async function stoploading()
{
    return new Promise(resolve => {
        setTimeout(() => {

            $("#air_plugincontainer").removeClass("waiting")
            $("body").css("cursor", "default");
            resolve('');
        }, 0);
    });
}

function checkNested(obj /*, level1, level2, ... levelN*/) {
    var args = Array.prototype.slice.call(arguments, 1);

    for (var i = 0; i < args.length; i++) {
        if (!obj || !obj.hasOwnProperty(args[i])) {
            return false;
        }
        obj = obj[args[i]];
    }
    return true;
}

function standarddeviation(_temparray) {

    let array = []

    _temparray.forEach(_e => {
        if (!isNaN(_e)) {
            array.push(_e)
        }
    });

    const n = array.length

    if (n == 0)
        return 0;

    const mean = array.reduce((a, b) => a + b) / n

    return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
}

function mean(_temparray) {

    let numbers = []

    _temparray.forEach(_e => {
        if (!isNaN(_e)) {
            numbers.push(_e)
        }
    });

    if (numbers.length == 0)
        return 0;

    var total = 0, i;
    for (i = 0; i < numbers.length; i += 1) {
        total += numbers[i];
    }
    return total / numbers.length;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function air_download(filename, data) {

    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function getElementContent(elements, seperator) {
    let element_content = "Name" + seperator + "Type";

    let idset = new Set();
    output = {}

    for (let e in elements) {
        var lowername = AIR.Molecules[e].name.toLowerCase();
        output[e] = {
            name: AIR.Molecules[e].name.replace(seperator, ""),
            type: AIR.Molecules[e].type.replace(seperator, ""),
            subunits: AIR.Molecules[e].subunits.map(s => AIR.Molecules[s].name.replace(seperator, "")).join(seperator.includes(",") ? "; " : ", "),
            submaps: (AIR.MapElements.hasOwnProperty(lowername) ? AIR.MapElements[lowername].map(m => globals.submaps[m._modelId]).join(seperator.includes(",") ? "; " : ", ") : "")
        }

        for (let s in AIR.Molecules[e].ids) {
            if (s != "name") {
                idset.add(s)
                output[e][s] = (AIR.Molecules[e].ids[s] ? AIR.Molecules[e].ids[s].replace(seperator, "") : "");
            }
        }
    }
    idset = Array.from(idset)
    for (var id of idset) {
        element_content += seperator + id;
    }
    element_content += seperator + "Subunits" + seperator.submaps

    for (var e in output) {
        element_content += "\n" + output[e].name + seperator + output[e].type;
        for (var id of idset) {
            element_content += seperator + (output[e].hasOwnProperty(id) ? output[e][id] : "");
        }
        element_content += seperator + output[e].subunits + seperator + output[e].submaps
    }

    return element_content;
}

function getInterContent(interactions, seperator, extended = false) {
    let inter_content;
    if (extended) {
        inter_content = "Source" + seperator + "Type" + seperator + "Interaction" + seperator + "Target" + seperator + "Type" + seperator + "Pubmed";
    }
    else {
        inter_content = "Source" + seperator + "Interaction" + seperator + "Target" + seperator + "Pubmed";
    }

    for (let e in interactions) {
        inter_content += "\n";
        inter_content += AIR.Molecules[AIR.Interactions[e].source].name.replace(seperator, "");
        if (extended) {
            inter_content += AIR.Molecules[AIR.Interactions[e].source].type.replace(seperator, "");
        }
        inter_content += seperator + AIR.Interactions[e].typeString.replace(seperator, "");
        inter_content += seperator + AIR.Molecules[AIR.Interactions[e].target].name.replace(seperator, "");
        if (extended) {
            inter_content += AIR.Molecules[AIR.Interactions[e].target].type.replace(seperator, "");
        }

        let pubmed = [];
        for (let s in AIR.Interactions[e].pubmed) {
            pubmed.push(AIR.Interactions[e].pubmed[s].replace("pubmed:", ""))
        }

        inter_content += seperator + pubmed.join(" | ").replace(seperator, "");
    }

    return inter_content;
}

function isNumber(evt) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57) && charCode != 44 && charCode != 46) {
        return false;
    }
    return true;
}

function indexOfSmallest(_temparray, absolute = false) {
    let a = []

    _temparray.forEach(_e => {
        if (!isNaN(_e)) {
            a.push(_e)
        }
    });

    var lowest = 0;
    for (var i = 1; i < a.length; i++) {
        if ((absolute && Math.abs(a[i]) < Math.abs(a[lowest])) || (!absolute && a[i] < a[lowest]))
            lowest = i;
    }
    return _temparray.indexOf(a[lowest]);
}

function indexOfLargest(_temparray, absolute = false) {

    let a = []

    _temparray.forEach(_e => {
        if (!isNaN(_e)) {
            a.push(_e)
        }
    });

    var largest = 0;
    for (var i = 1; i < a.length; i++) {
        if ((absolute && Math.abs(a[i]) < Math.abs(a[largest])) || (!absolute && a[i] < a[largest]))
            largest = i;
    }
    return _temparray.indexOf(a[largest]);
}


async function updateProgress(value, max, progressbar, text = "") {
    return new Promise(resolve => {
        let percentage = (max == 0 ? 0 : Math.ceil(value * 100 / max));
        setTimeout(function () {
            $("#" + progressbar + "_progress").width(percentage + "%");
            $("#" + progressbar + "_progress_label").html(percentage + " %" + text);
            resolve('');
        }, 0);
    });
}


function replaceAll(string, search, replace) {
    return string.split(search).join(replace);
}


function rgbToHex(rgb) {
    var hex = Number(Math.round(rgb)).toString(16);
    if (hex.length < 2) {
        hex = "0" + hex;
    }
    return hex;
};

function valueToHex(_param) {
    let _value = _param;
    if (_value > 1) {
        _value = 1;
    }
    else if (_value < -1) {
        _value = -1
    }
    var hex = rgbToHex((1 - Math.abs(_value)) * 255);
    if (_value > 0)
        return '#ff' + hex + hex;
    else if (_value < 0)
        return '#' + hex + hex + 'ff';
    else return '#ffffff';
}

function valueToRGB(_value) {
    var rgb = (1 - Math.abs(_value)) * 255;
    if (_value > 0)
        return [255, rgb, rgb]
    else if (_value < 0)
        return [rgb, rgb, 255]
    else return [255, 255, 255];
}

function adjustPanels(container) {

    var coll = container.getElementsByClassName("air_collapsible");
    for (var i = 0; i < coll.length; i++) {
        var content = coll[i].nextElementSibling;
        if (content.style.maxHeight) {
            content.style.maxHeight = content.scrollHeight + 1 + "px";
        }
    }
}
function expo(x, f = 2, e = 1) {
    if (x == 0)
        return 0;
    let _round = Math.floor(x * Math.pow(10, f)) / Math.pow(10, f)
    if (_round == 0)
        return x.toExponential(e);
    else
        return Math.round(x * Math.pow(10, f)) / Math.pow(10, f)
}


async function air_addoverlay(olname, callback, cb_param = null) {
    return new Promise((resolve, reject) => {
        var _content = callback(cb_param)
        if (_content != "") {
            $.ajax({
                method: 'POST',
                url: minerva.ServerConnector._serverBaseUrl + 'api/projects/' + minervaProxy.project.data.getProjectId() + '/overlays/',

                data: `content=name%09color${_content}&description=PhenotypeActivity&filename=${olname}.txt&name=${olname}&googleLicenseConsent=true`,
                cookie: 'MINERVA_AUTH_TOKEN=xxxxxxxx',
                success: (response) => {
                    resolve("")
                    $("[name='refreshOverlays']").click();
                },
                error: (response) => {
                    resolve("")
                }
            })
        }
        else {
            resolve("")
        }

    });
}

function shuffle(a) {
    
    let i = a.length;
    let array = Array(i);
    while(i--) array[i] = a[i];

    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}
function pickRandomElements(arr, n) {

    if (arr.length <= n) {
        return shuffle(arr);
    }

    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

function union(setA, setB) {
    let _union = new Set(setA)
    for (let elem of setB) {
        _union.add(elem)
    }
    return _union
}

function findPhenotypePath(element, phenotype, perturbedElements = [], hideprevious = true) {

    let pathdata = AIR.Phenotypes[phenotype].paths;
    let newpaths = Object.keys(pathdata).filter(path => perturbedElements.every(e => path.split("_").includes(e) == false));

    var pathsfromelement = newpaths.filter(p => p.startsWith(element + "_"));
    var re = new RegExp("_", "g")

    if (pathsfromelement.length > 0) {
        let _additionalelements = perturbedElements.reduce((accumulator, currentValue) => {
            accumulator[currentValue] = "#a9a9a9";
            return accumulator;
        }, {});

        let shortestpath = pathsfromelement.reduce((a, b) => (a.match(re) || []).length <= (b.match(re) || []).length ? a : b);
        highlightPath(shortestpath.split("_"), pathdata[shortestpath] == -1 ? "#ff0000" : "#0000ff", _additionalelements, hideprevious);
    }
}

function highlightPath(_elements, color = "#0000ff", additionalelements = {}, hideprevious = true) {

    let _additionalelements = Object.fromEntries(
        Object.entries(additionalelements).map(([k, v]) => [AIR.Molecules[k].name.toLowerCase(), v])
    );
    let elements = [];
    for (let i = 0; i < _elements.length - 1; i++) {
        let source = _elements[i];
        let target = _elements[i + 1];
        elements.push({
            "source": AIR.Molecules[source].name.toLowerCase(),
            "target": AIR.Molecules[target].name.toLowerCase()
        })
        for (let parent of AIR.Molecules[source].family) {
            elements.push({
                "source": AIR.Molecules[parent].name.toLowerCase(),
                "target": AIR.Molecules[target].name.toLowerCase()
            })
        }
        for (let parent of AIR.Molecules[target].family) {
            elements.push({
                "source": AIR.Molecules[source].name.toLowerCase(),
                "target": AIR.Molecules[parent].name.toLowerCase()
            })
        }
    }

    minervaProxy.project.map.getHighlightedBioEntities().then(highlighted => {

        minervaProxy.project.map.hideBioEntity(hideprevious ? highlighted : []).then(r => {

            highlightDefs = []
            let modeids = {};

            for (let r of AIR.MapReactions) {
                for (let path of elements) {
                    if (r.products.includes(path.target) && (r.reactants.includes(path.source) || r.modifiers.includes(path.source))) {
                        highlightDefs.push({
                            element: {
                                id: r.id,
                                modelId: r.modelId,
                                type: "REACTION"
                            },
                            type: "SURFACE",
                            options: {
                                lineColor: color
                            }
                        })

                        if (modeids.hasOwnProperty(r.modelId)) {
                            modeids[r.modelId] += 1;
                        }
                        else {
                            modeids[r.modelId] = 1;
                        }
                    }
                }

            };

            if (Object.keys(modeids).length > 0) {
                minervaProxy.project.map.openMap({ "id": parseFloat(Object.keys(modeids).reduce((a, b) => modeids[a] > modeids[b] ? a : b)) });
            }
            AIR.allBioEntities.forEach(e => {
                if (e.constructor.name === 'Alias') {

                    if (e.getName().toLowerCase() == elements[0].source || e.getName().toLowerCase() == elements[elements.length - 1].target) {
                        highlightDefs.push({
                            element: {
                                id: e.id,
                                modelId: e.getModelId(),
                                type: "ALIAS"
                            },
                            type: "ICON"
                        });
                    }
                    else if (_additionalelements.hasOwnProperty(e.getName().toLowerCase())) {
                        highlightDefs.push({
                            element: {
                                id: e.id,
                                modelId: e.getModelId(),
                                type: "ALIAS"
                            },
                            type: "SURFACE",
                            options: {
                                color: _additionalelements[e.getName().toLowerCase()]
                            }

                        });
                    }
                }
            });

            minervaProxy.project.map.showBioEntity(highlightDefs);
        });
    });
}

async function getPerturbedInfluences(phenotype, perturbedElements, force = false) {

    return new Promise((resolve, reject) => {


        var re = new RegExp("_", "g")


        var paths = {}
        var regulators = new Set()

        for (let p in AIR.Phenotypes[phenotype].paths) {
            let splitpath = p.split("_");
            if (perturbedElements.some(e => splitpath.includes(e)))
                continue;
            paths[p] = AIR.Phenotypes[phenotype].paths[p];
            for (let e of splitpath) {
                if(e != phenotype)
                    regulators.add(e)
            }
        }
        regulators.delete(phenotype)
        regulators = Array.from(regulators);

        var influencevalues = {
            values: {},
            SPs: {},
            SubmapElements: regulators
        }
        var patharray = Object.keys(paths);
        for (let e of regulators) {
            if (AIR.Molecules[e].subtype == "COMPLEX" || e == phenotype)
                continue

            var minlength = Math.min(...patharray.filter(p => p.startsWith(e + "_")).map(p => p.split("_").length));
            if (!minlength) {
                continue;
            }

            var includedpaths = patharray.filter(p => p.includes("_" + e + "_") || AIR.Molecules[e].parent.some(pe => p.includes("_" + pe + "_"))).length;
            
            var type = Math.min(...Object.values(Object.filter(paths, p => p.startsWith(e + "_") && p.split("_").length == minlength)))
            
            if(AIR.Modifiers.hasOwnProperty(e))
            {
                var catalyzedpaths = Object.filter(paths, p => AIR.Modifiers[e].some(m => p.includes(m + "_")))
                var mod_path_length = Object.keys(catalyzedpaths).length;
                
                if (mod_path_length > 0)
                {
                    catalyzedpaths = Object.filter(catalyzedpaths, p => AIR.Modifiers[e].some(m => p.startsWith(m + "_")))
                    type = Math.min(...Object.values(catalyzedpaths))
                }

                includedpaths += mod_path_length;
            }

            var elementsonpaths = (new Set([].concat.apply([], patharray.filter(p => p.startsWith(e + "_")).map(m => m.split("_"))))).size;        

            influencevalues.SPs[e] = minlength * type;
            influencevalues.values[e] = type * (includedpaths / patharray.length + elementsonpaths / regulators.length)
        };

        let maxvalue = Math.max.apply(null, Object.values(influencevalues.values).map(Math.abs));
        Object.keys(influencevalues.values).map(function (key, index) {
            influencevalues.values[key] /= maxvalue;
        });

        var sorted_values = [];
        for (var e in influencevalues.values) {
            sorted_values.push([e, influencevalues.values[e]]);
        }
        sorted_values = sorted_values.sort(function (a, b) {
            return Math.abs(b[1]) - Math.abs(a[1]);
        });

        for (let e of sorted_values.map(_a => _a[0])) {
            for (let t1 in AIR.Molecules[e].Sources) {
                if (perturbedElements.includes(t1))
                    continue;
                if (!influencevalues.values.hasOwnProperty(t1)) {
                    influencevalues.values[t1] = influencevalues.values[e] * AIR.Molecules[e].Sources[t1] / 2
                    influencevalues.SPs[t1] = influencevalues.SPs[e] + 1
                }
            }
            for (let t1 in AIR.Molecules[e].Sources) {
                if (perturbedElements.includes(t1))
                    continue;
                for (let t2 in AIR.Molecules[t1].Sources) {
                    if (perturbedElements.includes(t2))
                        continue;
                    if (!influencevalues.values.hasOwnProperty(t2)) {
                        influencevalues.values[t2] = influencevalues.values[t1] * AIR.Molecules[t1].Sources[t2] / 2
                        influencevalues.SPs[t1] = influencevalues.SPs[e] + 2
                    }
                }
            }
        }

        resolve(influencevalues);
    });
}

function pickHighest(obj, _num = 0, ascendend = true, key = null) {

    let num = _num;
    let requiredObj = {};

    if (!num || num > Object.keys(obj).length) {
        num = Object.keys(obj).length;
    };

    if (!ascendend) {
        Object.keys(obj).sort((a, b) => (key == null ? (obj[b] - obj[a]) : (obj[b][key] - obj[a][key]))).forEach((key, ind) => {
            if (ind < num) {
                requiredObj[key] = obj[key];
            }
        });
    }
    else {
        Object.keys(obj).sort((a, b) => (key == null ? (obj[a] - obj[b]) : (obj[a][key] - obj[b][key]))).forEach((key, ind) => {
            if (ind < num) {
                requiredObj[key] = obj[key];
            }
        });
    }
    return requiredObj;
};

function getDTExportString(dt, seperator = "\t") {
    let output = [];


    dt.rows().every(function (rowIdx, tableLoop, rowLoop) {
        output.push(this.data().map(function (cell) {
            return extractContent(cell);
        }));
    });

    let columnstodelete = [];

    if (output.length > 1) {
        let index_hasValue = {}
        for (let i in output[0]) {
            index_hasValue[i] = false;
        }
        for (let row of output) {
            for (let i in row) {
                if (row[i] != "") {
                    index_hasValue[i] = true;
                }
            }
        }

        columnstodelete = Object.keys(index_hasValue).filter(key => index_hasValue[key] === false)
    }


    output.unshift([]);
    dt.columns().every(function () {
        output[0].push(this.header().textContent)
    })

    output = output.map(row => {

        let newarray = []
        for (let i in row) {
            if (!columnstodelete.includes(i)) {
                newarray.push(row[i]);
            }
        }
        return newarray
    });

    return output.map(e => e.join(seperator)).join("\n");
}

function extractContent(s) {
    var span = document.createElement('span');
    span.innerHTML = s;
    if (span.textContent == "" && span.innerText == "") {
        var htmlObject = $(s);
        if (htmlObject && htmlObject.is(":checkbox")) {
            return htmlObject.is(':checked') ? "true" : "false";
        }
    }
    return span.textContent || span.innerText;
}

function copyContent(str) {
    const el = document.createElement('textarea');  // Create a <textarea> element
    el.value = str;                                 // Set its value to the string that you want copied
    el.setAttribute('readonly', '');                // Make it readonly to be tamper-proof
    el.style.position = 'absolute';
    el.style.left = '-9999px';                      // Move outside the screen to make it invisible
    document.body.appendChild(el);                  // Append the <textarea> element to the HTML document
    const selected =
        document.getSelection().rangeCount > 0        // Check if there is any content selected previously
            ? document.getSelection().getRangeAt(0)     // Store selection if found
            : false;                                    // Mark as false to know no selection existed before
    el.select();                                    // Select the <textarea> content
    document.execCommand('copy');                   // Copy - only works as a result of a user action (e.g. click events)
    document.body.removeChild(el);                  // Remove the <textarea> element
    if (selected) {                                 // If a selection existed before copying
        document.getSelection().removeAllRanges();    // Unselect everything on the HTML document
        document.getSelection().addRange(selected);   // Restore the original selection
    }
};

function createdtButtons(dt, download_string) {
    return [
        {
            text: 'Copy',
            action: function () {
                copyContent(getDTExportString(dt));
            }
        },
        {
            text: 'CSV',
            action: function () {
                air_download(download_string + "_csv.txt", etDTExportString(dt, seperator = ","))
            }
        },
        {
            text: 'TSV',
            action: function () {
                air_download(download_string + "_csv.txt", etDTExportString(dt))
            }
        }
    ]
}

function leastSquaresRegression(data) {
    var sum = [0, 0], _d = 0;

    for (_d of data)
    {
        sum[0] += _d[0] * _d[0]; //sumSqX
        sum[1] += _d[0] * _d[1]; //sumXY
    }

    var gradient = sum[1] / sum[0];

    return gradient;
}

function activaTab(tab) {
    $('.nav-tabs a[href="#' + tab + '"]').tab('show');
};



async function fishers(a, b, c, d) {
    function factorialize(num) {
        var factorial = new Decimal(1);
        for (var i = 2; i <= num; i++) {
            factorial = factorial.times(i);
        }

        return factorial;
    }

    return parseFloat(factorialize(a + b).times(factorialize(c + d)).times(factorialize(a + c)).times(factorialize(b + d)).dividedBy(factorialize(a).times(factorialize(b)).times(factorialize(c)).times(factorialize(d)).times(factorialize(a + b + c + d))).toExponential(40))
}

function GetpValueFromValues(value, rndvalues, normalizeBins = false)
{
    var pos_random_scores = rndvalues.filter(x => x > 0)
    pos_random_scores = pos_random_scores.concat(pos_random_scores.map(x => -x))

    var neg_random_scores = rndvalues.filter(x => x < 0)
    neg_random_scores = neg_random_scores.concat(neg_random_scores.map(x => -x))

    var pos_std = standarddeviation(pos_random_scores)
    var pos_mean = mean(pos_random_scores);

    var neg_std = standarddeviation(neg_random_scores)
    var neg_mean = mean(neg_random_scores);

    var z_score = 0;
    if(value > 0)
    {
        if(pos_std != 0)
        {
            z_score = (value - pos_mean) / pos_std
        }
        else
        {
            z_score = 14;
        }
    }
    else if(value < 0)
    {
        if(neg_std != 0)
        {
            z_score = (value - neg_mean) / neg_std
        }
        else
        {
            z_score = 14;
        }
    }

    let pvalue = (Math.abs(z_score) >= 14? parseFloat("1.5586968528014629e-44") : GetpValueFromZ(z_score))
    if (isNaN(pvalue))
        pvalue = 1;

    bins = new Array(21).fill(0)
    var rndmax = Math.max.apply(null, rndvalues.map(Math.abs))
    for(let v of (normalizeBins? rndvalues.map(i => i/rndmax) : rndvalues))
    {
        bins[10+Math.round(v*10)] += 1
    }
    bins = bins.map(i => i/Math.max.apply(null, bins.map(Math.abs)))

    return {
        "pvalue": pvalue,
        "posStd": (normalizeBins? pos_std/rndmax : pos_std),
        "negStd": (normalizeBins? neg_std/rndmax : neg_std),
        "negMean": (normalizeBins? neg_mean/rndmax : neg_mean),
        "posMean": (normalizeBins? pos_mean/rndmax : pos_mean),
        "bins": bins,
    }
}
function GetpValueFromZ(_z, type = "twosided") {
    if (_z < -14) {
        _z = -14
    }
    else if (_z > 14) {
        _z = 14
    }

    Decimal.set({ precision: 100 });

    let z = new Decimal(_z);
    var sum = new Decimal(0);

    var term = new Decimal(1);
    var k = new Decimal(0);

    var loopstop = new Decimal("10E-50");
    var minusone = new Decimal(-1);
    var two = new Decimal(2);

    let pi = new Decimal("3.141592653589793238462643383279502884197169399375105820974944592307816406286208998628034825342117067982148086513282306647")

    while (term.abs().greaterThan(loopstop)) {
        term = new Decimal(1)

        for (let i = 1; i <= k; i++) {
            term = term.times(z).times(z.dividedBy(two.times(i)))
        }

        term = term.times(minusone.toPower(k)).dividedBy(k.times(2).plus(1))
        sum = sum.plus(term);
        k = k.plus(1);
    }


    sum = sum.times(z).dividedBy(two.times(pi).sqrt()).plus(0.5);

    if (sum.lessThan(0))
        sum = sum.abs();
    else if (sum.greaterThan(1))
        sum = two.minus(sum);

    switch (type) {
        case "left":
            return parseFloat(sum.toExponential(40));
        case "right":
            return parseFloat((new Decimal(1).minus(sum)).toExponential(40));
        case "twosided":
            return sum.lessThan(0.5) ? parseFloat(sum.times(two).toExponential(40)) : parseFloat((new Decimal(1).minus(sum).times(two)).toExponential(40))

    }

}

function getAdjPvalues(_pvalues) {
    let pvalues = _pvalues.sort((a, b) => b - a);
    let n = pvalues.length
    let values = pvalues.map((element, index) => [element, n - index - 1]);
    let new_values = []
    let new_pvalues = new Array(n);
    for (let i in values) {
        let rank = n - i
        let pvalue = values[i][0]
        new_values.push((n / rank) * pvalue)
    }
    for (let i = 1; i < n; i++) {
        if (new_values[i] < new_values[i + 1])
            new_values[i + 1] = new_values[i]
    }
    for (let i in values) {
        let index = values[i][1]
        new_pvalues[index] = (new_values[i] > 1 ? 1 : new_values[i])
    }

    return new_pvalues;
}

async function getadjPvaluesForObject(_object, key, newkey = "adj_pvalue") {
    let targetpvalues = Object.keys(_object).map(t => _object[t][key]);
    targetpvalues = targetpvalues.sort((a, b) => a - b);
    let targetpvalues_index = {}
    for (let tid in _object) {
        targetpvalues_index[tid] = targetpvalues.indexOf(_object[tid][key]);
    }
    targetpvalues = getAdjPvalues(targetpvalues);
    for (let tid in _object) {
        _object[tid][newkey] = targetpvalues[targetpvalues_index[tid]];
    }
}

function sort_object(obj, absolute = false, reverse = false) {
    items = Object.keys(obj).map(function (key) {
        return [key, obj[key]];
    });
    items.sort(function (first, second) {
        return absolute ? (Math.abs(first[1]) - Math.abs(second[1])) : (first[1] - second[1]);
    });
    return (items.reverse())
}

async function getPathsConnectedToPhenotype(phenotype, ko_elements = [], allpaths = false, interactiontype = false, sorted = false) {
    let paths = AIR.Phenotypes[phenotype].paths;

    let re = new RegExp("_")

    let visited = []
    let queue = []

}
async function getPathsConnectedToElement(element, ko_elements = [], allpaths = false, interactiontype = false, sorted = false) {
    let paths = {};

    let elements = {};
    let elementids = Object.keys(AIR.Molecules)

    for (let e of elementids) {
        elements[e] = {};
        paths[e] = {}
    }

    for (let inter of AIR.Interactions) {
        if (ko_elements.includes(inter.source) || ko_elements.includes(inter.target) || inter.type == 0) {
            continue;
        }
        elements[inter.target][inter.source] = inter.type;
    }

    elements = Object.fromEntries(Object.entries(elements).filter(([_, v]) => Object.keys(v).length > 0));

    var neighbour, e, visited, queue, dist, spcount;
    var localBetweenness = {};

    var visited = [element]
    var queue = [element]
    var dist = {};

    dist[element] = 0;

    paths[element][element] = 1;

    while (queue.length > 0) {
        e = queue.shift();
        for (var neighbour in elements[e]) {

            if (!visited.includes(neighbour)) {
                visited.push(neighbour);
                dist[neighbour] = dist[e] + 1;
                queue.push(neighbour);
                for (let p in paths[e]) {
                    paths[neighbour][neighbour + (interactiontype ? (elements[e][neighbour] == -1 ? "-" : "+") : "_") + p] = paths[e][p] * elements[e][neighbour]
                }
            }
            else {
                if (dist[neighbour] == dist[e] + 1) {
                    for (let p in paths[e]) {
                        paths[neighbour][neighbour + (interactiontype ? (elements[e][neighbour] == -1 ? "-" : "+") : "_") + p] = paths[e][p] * elements[e][neighbour]
                    }
                }
                if (allpaths && !visited.includes(e + "_" + neighbour)) {
                    visited.push(e + "_" + neighbour);
                    queue.push(neighbour);

                    for (let p in paths[e]) {
                        paths[neighbour][neighbour + (interactiontype ? (elements[e][neighbour] == -1 ? "-" : "+") : "_") + p] = paths[e][p] * elements[e][neighbour]
                    }
                }
            }
        }
    }

    let output = {};

    if (sorted) {
        return paths;
    }
    else {
        for (let e in paths) {
            for (let p in paths[e]) {
                output[p] = paths[e][p]
            }
        }
        return output
    }
}


async function calculateShortestPaths(_elementids = [], centrality = false, reset = true, btn = "") {

    return;

    let elementids = _elementids.length == 0 ? Object.keys(AIR.Molecules) : _elementids;
    let elements = {};
    await disablebutton("air_init_btn", progress = true);
    await updateProgress(0, elementids.length, btn, text = " Calculating Shortest Paths");
    let t0 = performance.now()
    let count = 1;

    if (reset) {
        AIR.Paths = {}
        for (var m in AIR.Molecules) {
            AIR.Paths[m] =
            {
                SP: {},
                Consist: {},
                SPtype: {},
                SPcount: {},
            }
        }
    }

    for (var s of elementids) {
        elements[s] = {};
        if (centrality) {
            ElementCentrality = AIR.Molecules[s].Centrality;
            ElementCentrality.Betweenness[sample] = 0;
            ElementCentrality.Closeness[sample] = 0;
            ElementCentrality.Indegree[sample] = 0;
            ElementCentrality.Outdegree[sample] = 0;
            ElementCentrality.Degree[sample] = 0;
        }
    }

    for (let inter of AIR.Interactions) {
        if (!elementids.includes(inter.source) || !elementids.includes(inter.target) || inter.type == 0) {
            continue;
        }

        elements[inter.source][inter.target] = inter.type;

        if (centrality) {
            ElementCentrality = AIR.Molecules[inter.source].Centrality;
            ElementCentrality.Outdegree[sample] += 1;
            ElementCentrality.Degree[sample] += 1;

            ElementCentrality = AIR.Molecules[inter.target].Centrality;
            ElementCentrality.Indegree[sample] += 1;
            ElementCentrality.Degree[sample] += 1;
        }
    }

    //elements = Object.fromEntries(Object.entries(elements).filter(([_, v]) => v.length > 0));

    var localBetweenness = {};


    for (let s of elementids) {
        let visited = new Set();
        let queue = [s]
        let dist = {};
        let spcount = {};
        let sptype = {};
        let consistent = {}
        //localBetweenness = {}

        dist[s] = 0;
        spcount[s] = 0;
        sptype[s] = 1;
        consistent[s] = true;

        while (queue.length > 0) {
            let e = queue.shift();

            //localBetweenness[e] = []
            for (let neighbour in elements[e]) {

                if (!visited.has(neighbour)) {
                    visited.add(neighbour);
                    dist[neighbour] = dist[e] + 1;
                    sptype[neighbour] = sptype[e] * elements[e][neighbour];
                    spcount[neighbour] = 1;

                    consistent[neighbour] = consistent[e];
                    queue.push(neighbour);

                    //localBetweenness[e].push(neighbour);
                }
                else if (dist[neighbour] == dist[e] + 1) {

                    if (sptype[e] * elements[e][neighbour] != sptype[neighbour])
                        consistent[neighbour] = false;

                    spcount[neighbour] += 1;
                    //localBetweenness[e].push(neighbour);
                }
            }
        }
        if (centrality) {
            for (var t in dist) {
                if (dist[t] > 0) {
                    AIR.Molecules[s].Centrality.Closeness[sample] += 1 / dist[t]
                }
            }
            for (var k in localBetweenness) {
                if (k != s) {
                    for (var t of getSPNodes(k)) {
                        AIR.Molecules[k].Centrality.Betweenness[sample] += 1 / spcount[t]
                    }
                }
            }
        }
        if (reset) {
            AIR.Paths[s] = {
                SP: dist,
                Consistent: consistent,
                SPtype: sptype,
                SPcount: spcount,
            }
        }
        count++
        if (btn && count % 200 == 0)
            await updateProgress(count, elementids.length, btn, text = " Calculating Shortest Paths");
    }

    let t1 = performance.now()
    console.log("Call to get calculate SPs took " + (t1 - t0) + " milliseconds.")

    function getSPNodes(node) {
        let _array = [];
        if (localBetweenness.hasOwnProperty(node)) {
            _array = localBetweenness[node]
            for (var t of localBetweenness[node]) {
                _array = _array.concat(getSPNodes(t));
            }
        }
        return _array;
    }
}

async function getInfluencesForElement(element) {
    if (AIR.InfluenceData.hasOwnProperty(element)) {
        return AIR.InfluenceData[element];
    }
    var output = {}

    for (let r in AIR.Molecules[element].InfluencedTargets) {
        output[r] = AIR.Molecules[element].InfluencedTargets[r]
    }

    let includedelemnts = Object.keys(output)
    for (var t1 in AIR.Molecules[element].Targets) {
        let t1_type = AIR.Molecules[element].Targets[t1];
        for (let r in AIR.Molecules[t1].InfluencedTargets) {
            if (includedelemnts.includes(r)) {
                continue;
            }
            if (!output.hasOwnProperty(r))
                output[r] = AIR.Molecules[t1].InfluencedTargets[r] * t1_type / 2
            else {
                output[r] += AIR.Molecules[t1].InfluencedTargets[r] * t1_type / 2
            }
        }
    }

    includedelemnts = Object.keys(output)
    for (var t1 in AIR.Molecules[element].Targets) {
        let t1_type = AIR.Molecules[element].Targets[t1];
        for (var t2 in AIR.Molecules[t1].Targets) {
            let t2_type = AIR.Molecules[t1].Targets[t2];

            for (let r in AIR.Molecules[t2].InfluencedTargets) {
                if (includedelemnts.includes(r)) {
                    continue;
                }
                if (!output.hasOwnProperty(r))
                    output[r] = AIR.Molecules[t2].InfluencedTargets[r] * t1_type * t2_type / 4
                else {
                    output[r] += AIR.Molecules[t2].InfluencedTargets[r] * t1_type * t2_type / 4
                }
            }
        }
    }

    for (let t of Object.keys(output)) {
        if (Math.abs(output[t]) > 1) {
            output[t] = Math.sign(output[t])
        }
    }
    output = Object.fromEntries(Object.entries(output).filter(([_, v]) => v != 0));
    AIR.InfluenceData[element] = output;

    return output;
}


function xp_searchListener(entites) {
    globals.xplore.selected = entites[0];
    if (globals.xplore.selected.length > 0) {
        if (globals.xplore.selected[0].constructor.name === 'Alias') {
            var tag = globals.xplore.selected[0]._other.structuralState;
            if(tag && tag.toLowerCase() == "family")
            {
                tag = "";
            }
            xp_setSelectedElement(globals.xplore.selected[0].name+ (tag? ("_" + tag) : ""));
        }
    }
}


async function air_createpopup(button, parameter, ylabel = "Influence Score (I)", xlabel = "Fold Change in Data (FC)") {

    var $target = $('#om_chart_popover');
    var $btn = $(button);

    let DCE_values = await parameter.function(parameter.functionparam)
    let title = parameter.title

    if ($target) {


        $('#om_clickedpopupcell').css('background-color', 'transparent');
        $('#om_clickedpopupcell').removeAttr('id');

        if ($target.siblings().is($btn)) {
            $target.remove();
            $target.parents(".dataTables_scrollBody").css({
                minHeight: "0px",
            });
            return;
        }
        $target.remove();

    }

    $(button).attr('id', 'om_clickedpopupcell');
    $(button).css('background-color', 'lightgray');

    $target = $(`<div id="om_chart_popover" class="popover bottom in" style="max-width: none; top: 55px; z-index: 2; border: none;">
                    <div class="arrow" style="left: 9.375%;"></div>
                    <div id="om_chart_popover_content" class="popover-content">
                        <button type="button" id="om_popup_close" class="air_close_tight close" data-dismiss="alert" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <ul class="air_nav_tabs nav nav-tabs" id="xp_interaction_tab" role="tablist">
                            <li class="air_nav_item nav-item" style="width: 33.3333%;">
                                <a class="air_tab air_tab_sub air_popup_tabs active nav-link" id="air_popup_tab_dceplot" data-toggle="tab" href="#air_popup_tabcontent_dceplot" role="tab" aria-controls="air_popup_tabcontent_dceplot" aria-selected="true">DCE Plot</a>
                            </li>
                            <li class="air_nav_item nav-item" style="width: 33.3333%;">
                                <a class="air_tab air_tab_sub air_popup_tabs nav-link" id="air_popup_tab_regression" data-toggle="tab" href="#air_popup_tabcontent_regression" role="tab" aria-controls="air_popup_tabcontent_regression" aria-selected="false">Regression Plot</a>
                            </li>
                            <li class="air_nav_item nav-item" style="width: 33.3333%;">
                                <a class="air_tab air_tab_sub air_popup_tabs nav-link" id="air_popup_tab_histo" data-toggle="tab" href="#air_popup_tabcontent_histo" role="tab" aria-controls="air_popup_tabcontent_histo" aria-selected="false">Histogram</a>
                            </li>
                        </ul>
                        <div class="tab-content air_tab_content" style="height: 87%">
                            <div class="tab-pane air_sub_tab_pane show active" style="height: 100%" id="air_popup_tabcontent_dceplot" role="tabpanel" aria-labelledby="air_popup_tab_dceplot">                        
                                <div style="height: 80%">
                                    <canvas class="popup_chart" id="air_popup_dceplot"></canvas>
                                </div>
                                <div class="d-flex justify-content-center ml-2 mr-2">
                                    <li class="legendli" style="color:#6d6d6d; font-size:100%; white-space: nowrap;">
                                        <span class="legendspan_small" style="background-color:#C00000"></span>
                                        Activates Phenotype</li>
                                    <li class="legendli" style="margin-left:5px; color:#6d6d6d; font-size:100%; white-space: nowrap;">
                                        <span class="legendspan_small" style="background-color:#0070C0"></span>
                                        Represses Phenotype</li>
                                </div>
                                <div class="d-flex justify-content-center ml-2 mr-2">
                                    <li class="legendli" style="margin-left:5px; color:#6d6d6d; font-size:100%; white-space: nowrap;">
                                        <span class="legendspan_small" style="background-color:#cccccc"></span>
                                        Not diff. expressed</li>
                                    <li class="legendli" style="margin-left:5px; color:#6d6d6d; font-size:100%; white-space: nowrap;">
                                        <span class="triangle_small"></span>
                                        External Link</li>
                                </div>
                            </div>  
                            <div class="tab-pane air_sub_tab_pane" id="air_popup_tabcontent_regression" style="height: 100%" role="tabpanel" aria-labelledby="air_popup_tab_regression">                        
                                <div style="height: 80%">
                                    <canvas class="popup_chart" id="air_popup_regression"></canvas>
                                </div>
                                <div id="air_popoup_legen_regression" class="d-flex justify-content-center ml-2 mr-2">
                                    <li class="legendli" style="color:#6d6d6d; font-size:100%; white-space: nowrap;">
                                        <span style="font-weight:bold; font-size: 50; color:#C00000">—</span>
                                        Norm. Regression Line
                                    </li>
                                    <li class="legendli" style="margin-left:5px; color:#6d6d6d; font-size:100%; white-space: nowrap;">
                                        <span class="legendspan_small" style="background-color:#cccccc"></span>
                                        Regression Confidence Intervall (95%; unadj.)
                                    </li>
                                </div>
                            </div>
                            <div class="tab-pane air_sub_tab_pane" style="height: 100%" id="air_popup_tabcontent_histo" role="tabpanel" aria-labelledby="air_popup_tab_histo">                        
                                <select id="air_popup_histo_select" class="browser-default om_select custom-select mb-2">

                                </select>
                                <div style="height: 80%">
                                    <canvas class="popup_chart" id="air_popup_histo"></canvas>
                                </div>
                            </div>
                        <div>
                    </div>
                </div>`);

    $btn.after($target);

    select = document.getElementById('air_popup_histo_select');

    for (let histodata in parameter.histo){
        var opt = document.createElement('option');
        opt.value = histodata;
        opt.innerHTML = parameter.histo[histodata].title;
        select.appendChild(opt);
    }
    $('#air_popup_histo_select').on('change', setHistoData);

    $target.show();
    var popupheight = $("#om_chart_popover").height() + 50;
    $target.parents("table").parents(".dataTables_scrollBody").css({
        minHeight: (popupheight > 400 ? 400 : popupheight) + "px",
    });

    $('.air_popup_tabs[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        var popupheight = $("#om_chart_popover").height() + 50;
        $target.parents("table").parents(".dataTables_scrollBody").css({
            minHeight: (popupheight > 400 ? 400 : popupheight) + "px",
        });
    });

    let close_btn = document.getElementById("om_popup_close");
    // When the user clicks on <span> (x), close the modal
    close_btn.onclick = function () {
        $target.parents(".dataTables_scrollBody").css({
            minHeight: "0px",
        });
        $target.remove();
        $('#om_clickedpopupcell').css('background-color', 'transparent');
        $('#om_clickedpopupcell').removeAttr('id');

    }
    let targets = []
    var dist_targets = []
    for(let point of DCE_values.Baseline)
    {
        dist_targets.push({
            label: "",
            data: [{
                x: point[0],
                y: point[1],
                r: 4
            }],
        })
    }

    var maxx_dist = 0;
    for (let [element,values] of Object.entries(DCE_values.DCEs)) {

        let hex = "#cccccc";
        let rad = 3;
        let FC = values.FC
        let SP = values.SP

        var aggr = SP * FC
        rad = 6

        if (aggr < 0) {
            hex = "#0070C0";
        }
        else if (aggr > 0) {
            hex = "#C00000"
        }
        if (Math.abs(aggr) > maxx_dist) { maxx_dist = Math.abs(aggr) }
        
        if(aggr != 0)
            dist_targets.push(
                {
                    label: element,
                    data: [{
                        x: Math.abs(aggr) * Math.sign(FC),
                        y: Math.abs(aggr) * Math.sign(SP),
                        r: rad
                    }],
                    pointStyle: pstyle,
                    backgroundColor: hex,
                    hoverBackgroundColor: hex,
                })
        

        var pstyle = 'circle';
        if (AIR.MapSpeciesLowerCase.includes(AIR.Molecules[element].name.toLowerCase()) === false) {
            pstyle = 'triangle'
        }


        targets.push(
            {
                label: element,
                data: [{
                    x: FC,
                    y: SP,
                    r: rad
                }],
                pointStyle: pstyle,
                backgroundColor: hex,
                hoverBackgroundColor: hex,
            }
        );
    }

    maxx_dist = maxx_dist < 1? 1 : maxx_dist;
    
    var m = parameter.slope;
    var std1 = 1.96 * parameter.std[0]
    var std2 = -1.96 * parameter.std[1];
    dist_targets.push(
        {
            data: [{
                x: -maxx_dist,
                y: -maxx_dist * m,
                r: 0,
            },
            {
                x: maxx_dist,
                y: maxx_dist * m,
                r: 0,
            }],
            type: 'line',
            fill: false,
            pointRadius: 0,
            backgroundColor: m < 0 ? "#0070C0" : "#C00000",
            borderColor: m < 0 ? "#0070C0" : "#C00000",
            borderWidth: 2,
        }
    );
    dist_targets.push(
        {
            data: [{
                x: -maxx_dist,
                y: -maxx_dist * std2,
                r: 0,
            },
            {
                x: maxx_dist,
                y: maxx_dist * std2,
                r: 0,
            }],
            type: 'line',
            fill: "+1",
            pointRadius: 0,
        }
    );
    dist_targets.push(
        {
            data: [{
                x: -maxx_dist,
                y: -maxx_dist * std1,
                r: 0,
            },
            {
                x: maxx_dist,
                y: maxx_dist * std1,
                r: 0,
            }],
            type: 'line',
            fill: "+1",
            pointRadius: 0,
        }
    );


    outputCanvas = document.getElementById('air_popup_regression');
    chartOptions = {
        type: 'bubble',
        data: {
            datasets: dist_targets,
        },
        options: {
            plugins: {
                plugins: {
                    filler: {
                        propagate: false
                    }
                },
                legend: {
                    display: false
                },
                zoom: {
                    // Container for pan options
                    pan: {
                        // Boolean to enable panning
                        enabled: true,

                        // Panning directions. Remove the appropriate direction to disable 
                        // Eg. 'y' would only allow panning in the y direction
                        mode: 'xy',
                        rangeMin: {
                            // Format of min pan range depends on scale type
                            x: null,
                            y: null
                        },
                        rangeMax: {
                            // Format of max pan range depends on scale type
                            x: null,
                            y: null
                        },

                        // On category scale, factor of pan velocity
                        speed: 20,

                        // Minimal pan distance required before actually applying pan
                        threshold: 10,

                    },

                    // Container for zoom options
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'xy',
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            var element = context.label || '';

                            if (element) {
                                return [
                                    'Name: ' + AIR.Molecules[element].name,
                                    'Influence: ' + expo(DCE_values.DCEs[element].SP, 4, 3),
                                    'FC: ' + expo(DCE_values.DCEs[element].FC, 4, 3),
                                    'p-value: ' + (expo(DCE_values.DCEs[element].pvalue,4,3)),
                                ];
                            }
                            else
                                return "";

                        }
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            onHover: (event, chartElement) => {
                event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
            },
            onClick: (event, chartElement) => {
                if (chartElement[0]) {
                    let name = AIR.Molecules[regression_popupchart.data.datasets[chartElement[0].datasetIndex].label].name;
                    selectElementonMap(name, true);
                    xp_setSelectedElement(name);
                }
            },
            layout: {
                padding: {
                    top: 0
                }
            },
            title: {
                display: true,
                text: title,
                fontFamily: 'Helvetica',
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: "I·|FC|",
                    },
                    ticks: {
                        //beginAtZero: true,
                        max: 1,
                        min: -1
                    },
                    grid: {
                        drawBorder: false,
                        color: function (context) {
                            if (context.tick.value == 0)
                                return '#000000';
                            else
                                return "#D3D3D3";
                        },
                    }
                },
                x:
                {
                    title: {
                        display: true,
                        text: "FC·|I|",
                    },
                    ticks: {
                        //beginAtZero: false,
                    },
                    grid: {
                        drawBorder: false,
                        color: function (context) {
                            if (context.tick.value == 0)
                                return '#000000';
                            else
                                return "#D3D3D3";
                        },
                    },
                },
            }
        }

    };
    let regression_popupchart = new Chart(outputCanvas, chartOptions);

    outputCanvas = document.getElementById('air_popup_histo');
    chartOptions = {
        type: 'bar',
        data: {},
        options: {
            plugins: {
                plugins: {
                    filler: {
                        propagate: false
                    }
                },
                legend: {
                    display: false
                },
                zoom: {
                    // Container for pan options
                    pan: {
                        // Boolean to enable panning
                        enabled: true,

                        // Panning directions. Remove the appropriate direction to disable 
                        // Eg. 'y' would only allow panning in the y direction
                        mode: 'xy',
                        rangeMin: {
                            // Format of min pan range depends on scale type
                            x: null,
                            y: null
                        },
                        rangeMax: {
                            // Format of max pan range depends on scale type
                            x: null,
                            y: null
                        },

                        // On category scale, factor of pan velocity
                        speed: 20,

                        // Minimal pan distance required before actually applying pan
                        threshold: 10,

                    },

                    // Container for zoom options
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'xy',
                    }
                },
                // tooltip: {
                //     callbacks: {
                //         label: function (context) {
                //             var element = context.label || '';

                //             if (element) {
                //                 return [
                //                     'Name: ' + AIR.Molecules[element].name,
                //                     'Influence: ' + expo(DCE_values.DCEs[element].SP, 4, 3),
                //                     'FC: ' + expo(DCE_values.DCEs[element].FC, 4, 3),
                //                     'p-value: ' + (expo(DCE_values.DCEs[element].pvalue,4,3)),
                //                 ];
                //             }
                //             else
                //                 return "";

                //         }
                //     }
                // }
            },
            responsive: true,
            maintainAspectRatio: false,
            onHover: (event, chartElement) => {
                event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
            },
            // onClick: (event, chartElement) => {
            //     if (chartElement[0]) {
            //         let name = AIR.Molecules[histo_popupchart.data.datasets[chartElement[0].datasetIndex].label].name;
            //         selectElementonMap(name, true);
            //         xp_setSelectedElement(name);
            //     }
            // },
            layout: {
                padding: {
                    top: 0
                }
            },
            title: {
                display: true,
                text: title,
                fontFamily: 'Helvetica',
            },
            scales: {
                y: {
                    stacked: false,
                    title: {
                        display: true,
                        text: "Frequency",
                    },
                    ticks: {
                        //beginAtZero: true,
                        max: 1,
                        min: 0
                    },
                    grid: {
                        drawBorder: false,
                        color: function (context) {
                            if (context.tick.value == 0)
                                return '#000000';
                            else
                                return "#D3D3D3";
                        },
                    }
                },
                x:
                {
                    stacked: true,
                    title: {
                        display: true,
                        text: "Score",
                    },
                    ticks: {
                        //beginAtZero: false,
                    },
                    // grid: {
                    //     drawBorder: false,
                    //     color: function (context) {
                    //         if (context.tick.value == 0)
                    //             return '#000000';
                    //         else
                    //             return "#D3D3D3";
                    //     },
                    // },
                },
            }
        }

    };
    let histo_popupchart = new Chart(outputCanvas, chartOptions);
    setHistoData()

    function setHistoData()
    {    
        let histodata = parameter.histo[$('#air_popup_histo_select').val()]
        let mf = Math.floor(m*10)
        let updateddata = {
            datasets: [ 
                {
                    label: 'Enrichment Score',
                    data: new Array(10+mf).fill(null).concat([1]).concat(new Array(10-mf).fill(null)),
                    order: 0,
                    backgroundColor: '#000000FF',
                    barPercentage: 0.1
                },
                {
                    label: 'ES Histogram',
                    data: histodata.bins,
                    order: 1,
                    backgroundColor: '#c8c8c8',
                    barPercentage: 1,
                },
                {
                    label: 'Pos. Distribution',
                    data: new Array(10).fill(null).concat(getNormalDistribution(0,1,10, histodata.mean[0], histodata.std[0])),
                    type: 'line',
                    order: 1,
                    borderColor: "#FF0000"
                }, {
                    label: 'Neg. Distribution',
                    data: getNormalDistribution(-1,0,10, histodata.mean[1], histodata.std[1]).concat(new Array(10).fill(null)),
                    type: 'line',
                    order: 1,
                    borderColor: "#0000FF"
                }
            ],
            labels: [...Array(21).keys()].map(v => Math.round((v)-10)/10)        
        }
        histo_popupchart.data = updateddata;
        histo_popupchart.update();
    }

    var outputCanvas = document.getElementById('air_popup_dceplot');
    var chartOptions = {
        type: 'bubble',
        data: {
            datasets: targets,
        },
        options: {
            plugins: {
                plugins: {
                    filler: {
                        propagate: false
                    }
                },
                legend: {
                    display: false
                },
                zoom: {
                    // Container for pan options
                    pan: {
                        // Boolean to enable panning
                        enabled: true,

                        // Panning directions. Remove the appropriate direction to disable 
                        // Eg. 'y' would only allow panning in the y direction
                        mode: 'xy',
                        rangeMin: {
                            // Format of min pan range depends on scale type
                            x: null,
                            y: null
                        },
                        rangeMax: {
                            // Format of max pan range depends on scale type
                            x: null,
                            y: null
                        },

                        // On category scale, factor of pan velocity
                        speed: 20,

                        // Minimal pan distance required before actually applying pan
                        threshold: 10,

                    },

                    // Container for zoom options
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'xy',
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            var element = context.label || '';

                            if (element) {
                                return [
                                    'Name: ' + AIR.Molecules[element].name,
                                    'Influence: ' + expo(DCE_values.DCEs[element].SP, 4, 3),
                                    'FC: ' + expo(DCE_values.DCEs[element].FC, 4, 3),
                                    'p-value: ' + (expo(DCE_values.DCEs[element].pvalue,4,3)),
                                ];
                            }
                            else
                                return "";

                        }
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            onHover: (event, chartElement) => {
                event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
            },
            onClick: (event, chartElement) => {
                if (chartElement[0]) {
                    let name = AIR.Molecules[dce_popupchart.data.datasets[chartElement[0].datasetIndex].label].name;
                    selectElementonMap(name, true);
                    xp_setSelectedElement(name);
                }
            },
            layout: {
                padding: {
                    top: 0
                }
            },
            title: {
                display: true,
                text: title,
                fontFamily: 'Helvetica',
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: ylabel,
                    },
                    ticks: {
                        //beginAtZero: true,
                        max: 1,
                        min: -1
                    },
                    grid: {
                        drawBorder: false,
                        color: function (context) {
                            if (context.tick.value == 0)
                                return '#000000';
                            else
                                return "#D3D3D3";
                        },
                    }
                },
                x:
                {
                    title: {
                        display: true,
                        text: xlabel,
                    },
                    ticks: {
                        //beginAtZero: false,
                    },
                    grid: {
                        drawBorder: false,
                        color: function (context) {
                            if (context.tick.value == 0)
                                return '#000000';
                            else
                                return "#D3D3D3";
                        },
                    },
                },
            }
        }

    };
    let dce_popupchart = new Chart(outputCanvas, chartOptions);

};

function getNormalDistribution(start, end, bins, _mean, _std)
{
	let output = [];
	let mean = new Decimal(_mean);
  let std = new Decimal(_std);
  let two = new Decimal(2)
  let pi = new Decimal("3.141592653589793238462643383279502884197169399375105820974944592307816406286208998628034825342117067982148086513282306647")
  for(let i = start; i <= end; i += (end-start)/bins)
  {
  	output.push(parseFloat((new Decimal(-0.5)).times(new Decimal(i).minus(mean).dividedBy(std).pow(2)).exp().dividedBy(std.times(two.times(pi).sqrt()))))
  }
  return output.map(i => i/Math.max.apply(null, output.map(Math.abs)))
}

function getTriplets(length = [3], onlygenes = false)
{
    let loops = []
    
    for(let l of length)
    {
        if(globals.omics.loops.hasOwnProperty(l))
        {
            loops = loops.concat(globals.omics.loops[l])
        }
        else
        {

            loops = loops.concat.apply([], Object.values(getFeedbackLoop(length)))
        }

    }

    for (let loop of loops)
    {
        loop.pop()
        i = Array.from(loop.entries()).sort((a, b) => a[1][0].localeCompare(b[1][0]))[0][0]

        for (let j = 0; j < i; j++) {
            loop.push(loop.shift())
        }
    }
    
    loops = new Set(loops.map(l => l.map(x => x[0] + "_" + x[1]).join("$")))
    loops = Array.from(loops).map(l => l.split("$").map(x => x.split("_")))
    
    if (onlygenes)
    {
        loops = loops.filter(l => l.every(x => ["HGNC" in AIR.Molecules[x[0]]["ids"]]))
    }
    
    return loops

    function getFeedbackLoopsFromElement(e, targets, l)
    {
        let elementpaths = []
        if (l > 0 && targets.hasOwnProperty(e))
        {
            for (let [t,v] of Object.entries(targets[e]))
            {
                for (let path of getFeedbackLoopsFromElement(t, targets, l-1))
                    if (path.slice(-1,1).every(x => e != x[0]))
                    {
                        elementpaths.push([[e,v], ...path]) 
                    }
            }

            return elementpaths
        }
        else
            return [[[e,1]]]
    }

    
    function getFeedbackLoop(length = [2])
    {
        let _elements = Object.assign(...Object.keys(AIR.Molecules).map(e => ({[e]: {}}))) 
        for (let inter of AIR.Interactions)
            if (inter["type"] != 0)
            {
                _elements[inter["source"]][inter["target"]] = inter["type"]
            }

        _elements= Object.filter(_elements, e => Object.keys(_elements[e]).length > 0)
        
        let loopdict = {}
        
        for (let e in _elements) 
        {
            loopdict[e] = []
            for (let l of length)
            {
                for (let p of getFeedbackLoopsFromElement(e, _elements, l))
                {
                    if (p.at(-1)[0] == e)
                    {
                        loopdict[e].push(p) 
                    }
                }
            }              
        }
        return Object.filter(loopdict, e => loopdict[e].length > 0)
    }


}


async function BFSfromTarget(element, interactiontype = false, sorted = false, btn = "") {


    let paths = {};
    let elements = {};
    let elementids = Object.keys(AIR.Molecules)

    await updateProgress(0, 1, btn, " Finding Paths ...");

    var elementres = {}
    var visitedpaths = {}

    for (let e of elementids) {
        elements[e] = {};
        paths[e] = {}
        elementres[e] = new RegExp(e + "([" + (interactiontype ? "+-" : "_") + "]|$)")
    }

    for (var inter of AIR.Interactions) {
        if (inter.type == 0) {
            continue;
        }
        elements[inter.target][inter.source] = {
            type: inter.type,
            sign: (interactiontype ? (inter.type == -1 ? "-" : "+") : "_")
        }
    }

    var re = new RegExp(e + "([" + (interactiontype ? "+-" : "_") + "]|$)")

    elements = Object.filter(elements, e => Object.keys(elements[e]).length > 0);

    var neighbour, l, e, visited, queue, dist, spcount;

    var queue = [element]
    var dist = {};
    var spcount = {};
    var visited = [element]
    visitedpaths[element] = []
    dist[element] = 0;
    spcount[element] = 0;

    paths[element][element] = 1

    var splitsign, type, neighbourpaths, neighbour_re, newpath;

    while (queue.length > 0) {
        e = queue.shift();
        for (var neighbour in elements[e]) {            
            if (!visited.includes(neighbour)) {

                    visited.push(neighbour)

                    neighbourpaths = paths[neighbour]
                    splitsign = neighbour + elements[e][neighbour].sign
                    type = elements[e][neighbour].type
                    neighbour_re = elementres[neighbour];
                    dist[neighbour] = dist[e] + 1;

                    for (var [path, ptype] of Object.entries(paths[e])) {
                        if (!neighbour_re.test(path)) {
                            neighbourpaths[splitsign + path] = ptype * type
                        }
                    }    

                    queue.push(neighbour);

                }
                else if (dist[neighbour] == dist[e] + 1) {

                    neighbourpaths = paths[neighbour]
                    splitsign = neighbour + elements[e][neighbour].sign
                    type = elements[e][neighbour].type
                    neighbour_re = elementres[neighbour];
        
                    for (var [path, ptype] of Object.entries(paths[e])) {
                        if (!neighbour_re.test(path)) {
                            neighbourpaths[splitsign + path] = ptype * type
                        }
                    }    
            }
            
        }
        
    //  }
    }

    if (sorted) {
        return {
            "Paths": paths,
            "SPs": dist
        }
    }
    else {

        var output = {};

        for (const e of Object.values(paths)) {
            for (const [path, ptype] of Object.entries(e)) {
                output[path] = ptype
            }
        }
        return  {
            "Paths": output,
            "SPs": dist
        }
    }
}

async function normalizeDictionary(dict)
{    
    if (Object.values(dict).length <= 1)
        return dict

    max_val = Math.max(...Object.values(dict))
    new_dict = {}
    for (let [key,val] in Object.entries(dict))
    {
        new_dict[key] = val/max_val
    }

    return new_dict
}