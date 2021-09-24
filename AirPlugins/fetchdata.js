let ENABLE_API_CALLS = true;
let TESTING;

//npm modules
let Chart;
let JSZip;
let FileSaver;
let VCF;
let ttest;
let Decimal;
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


function readDataFiles(_minerva, _filetesting, getfiles, _chart, _ttest, _jszip, _filesaver, _vcf, _decimal) {

    return new Promise((resolve, reject) => {


        minerva.ServerConnector.getLoggedUser().then(function (user) {
            globals.user = user._login.toString().toLowerCase();

            var t0 = 0;
            var t1 = 0;

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
                                                                $(".air_tab_pane").css("height", "calc(100vh - 160px)");
                                                            else
                                                                $(".air_tab_pane").css("height", "calc(100vh - 80px)");
                                                        });
                                                        height = 240;
                                                    }
                                                    else
                                                    {
                                                        $(".air_tab_pane").css("height", "calc(100vh - 160px)");
                                                    }

                                                    $("#stat_spinner").before(`
                                                        <div class="air_alert alert alert-info mt-2" id="air_welcome_alert">
                                                            <span>The plugin mansucript has been published as a <a href="PrePrint" target="_blank">PrePrint</a>. For any further questions, please contact the <a href="https://air.bio.informatik.uni-rostock.de/team" target="_blank">AIR team</a>.</span>
                                                            <button type="button" class="air_close close" data-dismiss="alert" aria-label="Close">
                                                                <span aria-hidden="true">&times;</span>
                                                            </button>
                                                        </div>      
                                                    `)
                                                    $('#air_welcome_alert .close').on('click', function () {
                                                        if($('#air_warning_user_alert').length)
                                                            $(".air_tab_pane").css("height", "calc(100vh - 160px)");
                                                        else
                                                            $(".air_tab_pane").css("height", "calc(100vh - 80px)");
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
    
    i = a.length;
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

function findPhenotypePath(element, phenotype, perturbedElements = [], visualize = true) {

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
        highlightPath(shortestpath.split("_"), pathdata[shortestpath] == -1 ? "#ff0000" : "#0000ff", _additionalelements);
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

            var type = Math.min(...Object.values(Object.filter(paths, p => p.startsWith(e + "_") && p.split("_").length == minlength)));
            var elementsonpaths = (new Set([].concat.apply([], patharray.filter(p => p.startsWith(e + "_")).map(m => m.split("_"))))).size;
            
            var includedpaths = patharray.filter(p => p.includes("_" + e + "_") || AIR.Molecules[e].parent.some(pe => p.includes("_" + pe + "_"))).length;

            if(AIR.Modifiers.hasOwnProperty(e))
            {
                var mod_paths = patharray.filter(p => AIR.Modifiers[e].some(m => p.includes(m + "_"))).length;
                includedpaths += mod_paths;
            }

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
    var sum = [0, 0], n = 0;

    for (; n < data.length; n++) {
        if (data[n][1] != null) {
            sum[0] += data[n][0] * data[n][0]; //sumSqX
            sum[1] += data[n][0] * data[n][1]; //sumXY
        }
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
