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

let minervaProxy;
let pluginContainer;
let pluginContainerId;
let minervaVersion;

var AIR = {
    HGNCElements: [],
    MoleculeData: {},
    Phenotypes: {},
    Hypoth_Phenotypes: {},
    Molecules: {},
    MoleculeIDs: [],
    MoleculeNames: {},
    Interactions: {},
    Boolean: {},
    Modifiers: {},
    ElementNames: {
        fullname: {},
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
    Compartments: {},
    MapReactions: [],
    Fullnames: {},
    Aliases: {},
}

var globals = {
    defaultusers: ['anonymous', 'guest', 'guest user'],
    specialCharacters: ['+', '#', '*', '~', '%', '&', '$', '§', '"'],
    guestuser: ['airuser'],
    lockedcolors: {
        0: '#99c140',
        1: '#e7b416',
        2: '#cc3232',
    },
    xp_ss_table: undefined,
    air_bool_table: undefined,
    booleanState: {},
    corrResults: {},
    intitalElements: new Set(), //['s37', 's34', 's35', 's57', 's58', 's157', 's158', 's159', 's48', 's10', 's33', 's27', 's29', 's28', 's167', 's168', 's52', 's40', 's61', 's334', 's374', 's289', 's386'],

    pe_element_table: undefined,
    pe_reults_table: undefined,
    pe_results: {},
    pe_data: [{}],
    pe_data_index: 0,
    pe_influenceScores: {},
    xp_path_table: undefined,
    user: undefined,
    pathchart: undefined,
    pathChartData: {
        source: "",
        through: "",
        target: "",
        data: [],
    },
    centralityChart: undefined,
    centralitychartData: [],
    centralitypathchart: undefined,
    ko_elements: [],

    optimizetotalchart: undefined,
    optimizechart: undefined,

    xp_targetchart: undefined,
    targetphenotypetable: undefined,
    targetpanel: undefined,
    xp_target_downloadtext: "",

    phenopaths: {},
};

const fixedelementNames = {
    "anabolism (muscle)": "anabolism",
    "catabolism (muscle)": "catabolism",
    "Anabolic Processes (muscle)": "anabolicprocesses",
    "Catabolic Processes (muscle)" : "catabolicprocesses",
    "sarcopenia (muscle)": "sarcopenia",
    "intestinal dysfunction (enterocyte)": "sbs",
    "cirrhosis (liver)": "cirrhosis",
    "TMPRSS15 (enterocyte)": "protease",
    "food intake (intestinallumen)": "food",
    "endothelial integrity (enterocyte)": "endothelia",
    "portal hypertension (secreted)": "hypertension",
    "sibo (intestinallumen)": "sibo",
    "bacteria (intestinallumen)": "bacteria",
    "probiotics (intestinallumen)": "probiotics",
    "alcohol consumption (intestinallumen)": "alcohol",
    "LEP (secreted)": "leptin"
}

function _evenDist(total, x, reverse = false)
{
    let output = []
    if (x == 0)
    {
        if (reverse)
            return Array(total).fill(true)
        else
            return Array(total).fill(false)
    }
    let spaceblocks = (total - x)/x
    let t = []
    
    for (let i = 0; i < x; i++) {
        t.push(i%2 == 0? Math.ceil(spaceblocks) : Math.floor(spaceblocks))
    }

    for (let i = t.length-1; i >= 0; i--) {
        if (t.reduce((a, b) => a + b, 0) < (total-x) && i%2 == 1)
            t[i] += 1
        if (t.reduce((a, b) => a + b, 0) > (total-x) && i%2 == 0)
            t[i] -= 1
    }

    for (let i = 0; i < x; i++) {
        output.push(reverse? false : true)
        for (let j = 0; j < t[i]; j++) {
            output.push(reverse? true : false)
        }
    }

    while (output.length < total)
        output.push(reverse? true : false)
    return output.slice(0, total)
}
function evenDist(total, x)
{
    if (x <= (total/2))
        return _evenDist(total, x, false)
    else
    {
        let output = _evenDist(total, total - x, true)
        output = output.reverse()
        return output
    }
}


Object.filter = (obj, predicate) =>
    Object.keys(obj)
        .filter(key => predicate(key))
        .reduce((res, key) => (res[key] = obj[key], res), {});

$(document).on('click', '.air_elementlink', function () {
    selectElementonMap(AIR.Molecules[$(this).attr("data")].name, false);
});

function getLinkIconHTML(element, id = true) {

    let name = id ? AIR.Molecules[element].name : element;
    let namelower = name.toLowerCase()

    let output = "";
    if (AIR.MapElements.hasOwnProperty(namelower)) {
        output += '<a href="#" data="' + element + '" class="air_elementlink">' + AIR.Molecules[element].ids.name + '</a>';
    }
    else {
        output += '<span>' + AIR.Molecules[element].ids.name + '</span>';
    }

    // let link = getLink(name);

    // if (link) {
    //     output += '<a target="_blank" href="' + link + '"><span class="fa fa-external-link-alt ml-2"></span></a>';
    // }

    return output;
}

const pcorr = (x, y) => {
    let sumX = 0,
        sumY = 0,
        sumXY = 0,
        sumX2 = 0,
        sumY2 = 0;
    const minLength = x.length = y.length = Math.min(x.length, y.length),
        reduce = (xi, idx) => {
        const yi = y[idx];
        sumX += xi;
        sumY += yi;
        sumXY += xi * yi;
        sumX2 += xi * xi;
        sumY2 += yi * yi;
        }
    x.forEach(reduce);

    let corr = (minLength * sumXY - sumX * sumY) / Math.sqrt((minLength * sumX2 - sumX * sumX) * (minLength * sumY2 - sumY * sumY))
    
    switch (corr) {
        case NaN:
            return 0;
        case Infinity:
            return 0;
        default:
            return corr;
    }
};

const centralities = ["Betweenness", "Closeness", "Degree", "Indegree", "Outdegree"];

function readDataFiles(_minerva, _filetesting, getfiles, _chart, _jszip, _filesaver, _decimal) {

    return new Promise((resolve, reject) => {
        
        Chart = _chart;
        JSZip = _jszip;
        FileSaver = _filesaver;
        TESTING = _filetesting;
        minervaProxy = _minerva;
        getFiles = getfiles;
        Decimal = _decimal;
        pluginContainer = $(minervaProxy.element);
        pluginContainerId = pluginContainer.attr('id');

        minervaProxy.project.map.addListener({
            dbOverlayName: "search",
            type: "onSearch",
            callback: xp_path_searchListener
        });  
        minervaProxy.project.map.addListener({
            dbOverlayName: "search",
            type: "onSearch",
            callback: xp_bool_searchListener
        });  

        minervaProxy.project.data.getAllBioEntities().then(function (bioEntities) {

            function getNameFromAlias(e) {
                let name = e.name;
                if (e._compartmentId) {
                    name += " (" + AIR.Compartments[e._compartmentId] + ")";
                }
                else {
                    name += " (secreted)";
                }

                return name;
            }
            AIR.allBioEntities = bioEntities;

            for (let e of bioEntities) {
                if (e._type == "Compartment") {
                    AIR.Compartments[e.id] = e.name.trim().toLowerCase().replace(" ", "");
                }
                if (e.constructor.name === 'Alias') {
                    let name = getNameFromAlias(e);
                    let namelower = name.toLowerCase();
                    AIR.MapSpeciesLowerCase.push(namelower);
                    AIR.MapSpecies.push(name);
                    AIR.MapElements[namelower] = e;

                    AIR.Fullnames[e.name.toLowerCase()] = (e.fullName? e.fullName : "")
                    AIR.Aliases[e.name.toLowerCase()] = e._synonyms.join(", ")
                }
                if (e.constructor.name === 'Reaction') {
                    AIR.MapReactions.push({
                        "reactants": e._reactants.map(r => getNameFromAlias(r._alias).toLowerCase()),
                        "products": e._products.map(r => getNameFromAlias(r._alias).toLowerCase()),
                        "modifiers": e._modifiers.map(r => getNameFromAlias(r._alias).toLowerCase()),
                        "id": e.id,
                        "modelId": e.getModelId()
                    })

                }
            };

            getFiles('Interactions.json').then(content => {
                readInteractions(content).then(r => {
                    getFiles('Elements.json').then(moleculecontent => {
                            readMolecules(moleculecontent).then(s => {
                                getFiles('boolean.json').then(booleancontent => {
                                            readBoolean(booleancontent).then(s => {
                                                getFiles('PhenotypePaths.json').then(pathcontent => {
                                                    readPhenotypePaths(pathcontent).then(s => {
                                                        resolve();
                                                    });

                                                });
                                            });

                                        })
                                });
                        });
                });;
            });

            function readPhenotypePaths(content) {
                return new Promise(async function (resolve, reject) {

                    AIR.Modifiers = JSON.parse(content).modifiers

                    resolve('');
                });
            }
            function readBoolean(content) {
                return new Promise((resolve, reject) => {

                    AIR["ElementsWithRules"] = []
                    AIR.Boolean = JSON.parse(content);

                    for(let e in AIR.Molecules)
                    {
                        if(AIR.Boolean.hasOwnProperty(e))
                        {
                            AIR["ElementsWithRules"].push(e)
                        }
                        else
                        {
                            AIR.Boolean[e] = {
                                "NOT": [],
                                "DO": [],
                            }
                        }
                        AIR.Boolean[e]["state"] = false
                        AIR.Boolean[e]["initial"] = false
                        AIR.Boolean[e]["locked"] = 0
                        AIR.Boolean[e]["keepstate"] = false
                        AIR.Boolean[e]["storage"] = 0
                        AIR.Boolean[e]["sources"] = []
                        AIR.Boolean[e]["perturbed"] = 0
                        AIR.Boolean[e]["dNOT"] = []
                        AIR.Boolean[e]["dDO"] = []
                        
                        if(AIR.Molecules[e].ids.name == "glycogen" || AIR.Molecules[e].name.toLowerCase() == "tag (liver)")
                        {
                            AIR.Boolean[e]["keepstate"] = true
                        }

                        if((AIR.Boolean[e]["DO"].length == 0 || AIR.Boolean[e]["DO"].every(s => s.length == 1 && (s[0]== AIR.sbs || s[0] == AIR.cirrhosis))) && AIR.Boolean[e]["NOT"].length > 0 && AIR.Molecules[e].type != "FAMILY" && e != AIR.sbs && e != AIR.cirrhosis)
                        {
                            globals.intitalElements.add(e)
                        }
                    }
                    console.log("initialelements: " + globals.intitalElements.size)

                    // remove all intially active elements that have a positive impact
                    // howerer, not if they are enzymes, etc..
                    for(let Booleanrule of Object.values(AIR.Boolean))
                    {
                        for(let rule of Booleanrule["DO"])
                        {
                            if(rule.length > 1)
                            {
                                for(let source of rule)
                                {
                                    if(AIR.Boolean[source]["DO"].length == 0 && AIR.Molecules[source].type != "FAMILY" && source != AIR.sbs && source != AIR.cirrhosis)
                                    {
                                        globals.intitalElements.add(source)
                                    }
                                }
                            }
                        }
                    }
                    console.log("initialelements: " + globals.intitalElements.size)
                    for(let [element,Booleanrule] of Object.entries(AIR.Boolean))
                    {
                        for(let rule of Booleanrule["DO"])
                        {
                            // if(rule.length == 1)
                            // {
                            //     globals.intitalElements.delete(rule[0])
                            // }
                            // else
                            // {
                            if(rule.length > 1)
                            {
                                for(let source of rule)
                                {
                                    if(AIR.Molecules[element].subunits.includes(source))
                                        globals.intitalElements.delete(source)
                                }
                            }
                            // }
                        }
                        for(let d of AIR.diseases)
                        {
                            for(let r of Booleanrule["NOT"].filter(r => r.includes(d)))
                            {
                                Booleanrule["NOT"].splice(Booleanrule["NOT"].indexOf(r), 1)
                                Booleanrule["dNOT"].push(r)
                            }
                            for(let r of Booleanrule["DO"].filter(r => r.includes(d)))
                            {
                                Booleanrule["DO"].splice(Booleanrule["DO"].indexOf(r), 1)
                                Booleanrule["dDO"].push(r)
                            }
                        }
                    }


                    globals.intitalElements.add(AIR.protease)
                    globals.intitalElements.add(AIR.endothelia)
                    globals.intitalElements.delete(AIR.probiotics)
                    globals.intitalElements.delete(AIR.hypertension)
                    //globals.intitalElements.delete(AIR.bacteria)
                    globals.intitalElements.delete(AIR.sibo)
                    globals.intitalElements.delete(AIR.alcohol)
                    globals.intitalElements.delete(AIR.leptin)
                    globals.intitalElements.delete(AIR.food)
                    console.log("initialelements: " + globals.intitalElements.size)
                    resolve('');
                });
            }
            function readMolecules(content) {
                return new Promise((resolve, reject) => {

                    AIR.Molecules = JSON.parse(content);

                    for (let element in AIR.Molecules) {

                        AIR.MoleculeIDs.push(element)
                        let name = AIR.Molecules[element].name
                        // if (!AIR.ElementNames.fullname.hasOwnProperty(AIR.Molecules[element].name.toLowerCase()))
                        //     AIR.ElementNames.fullname[AIR.Molecules[element].name.toLowerCase()] = [];
                        AIR.ElementNames.fullname[name.toLowerCase()] = element;

                        if (AIR.Molecules[element].complex === false) {
                            for (let id in AIR.Molecules[element].ids) {
                                let db_key = id.replace('.', '');
                                if (AIR.ElementNames.hasOwnProperty(db_key)) {
                                    // if (!AIR.ElementNames[db_key].hasOwnProperty(AIR.Molecules[element].ids[id]))
                                    //     AIR.ElementNames[db_key][AIR.Molecules[element].ids[id]] = [];
                                    AIR.ElementNames[db_key][AIR.Molecules[element].ids[id]] = element;
                                }
                            }
                        }

                        AIR.Molecules[element]["Centrality"] = {}

                        if(fixedelementNames.hasOwnProperty(name))
                        {
                            if(fixedelementNames[name] == "anabolicprocesses" || fixedelementNames[name] == "catabolicprocesses")
                            {
                                AIR[fixedelementNames[name]] = AIR.Molecules[element].subunits
                            }
                            else
                                AIR[fixedelementNames[name]] = element;
                        }
                    }
                    
                    for(let element of [AIR.sarcopenia, AIR.anabolism, AIR.catabolism, ...AIR.anabolicprocesses, ...AIR.catabolicprocesses])
                    {
                            AIR.Phenotypes[element] = {};
                            AIR.Phenotypes[element]["name"] = AIR.Molecules[element].name;
                            AIR.Phenotypes[element]["values"] = {};
                            AIR.Phenotypes[element]["SPs"] = {};
                            AIR.Phenotypes[element]["Paths"] = {};
                    }

                    AIR["diseases"] = [AIR.cirrhosis, AIR.sbs]

                    resolve('');
                });
            }
            function readInteractions(content) {
                return new Promise((resolve, reject) => {

                    AIR.Interactions = JSON.parse(content);

                    resolve('');
                });
            }
        });

    })

}


function getLinkIconHTML(element, id = true) {

    let name = id ? AIR.Molecules[element].name : element;
    let namelower = name.toLowerCase()

    let output = "";
    if (AIR.MapElements.hasOwnProperty(namelower)) {
        output += '<a href="#" data="' + element + '" class="air_elementlink">' + AIR.Molecules[element].ids.name + '</a>';
    }
    else {
        output += '<span>' + AIR.Molecules[element].ids.name + '</span>';
    }

    // let link = getLink(name);

    // if (link) {
    //     output += '<a target="_blank" href="' + link + '"><span class="fa fa-external-link-alt ml-2"></span></a>';
    // }

    return output;
}

$(document).on('click', '.air_elementlink', function () {
    selectElementonMap($(this).html(), false);
});

$(document).on('click', '.air_reactionlink', function () {
    highlightPath($(this).attr("data").split("_"))
});


function ColorElements(_elements, hideprevious = true) {

    let elements = Object.fromEntries(
        Object.entries(_elements).map(([k, v]) => [k.toLowerCase(), v])
    );

    minervaProxy.project.map.getHighlightedBioEntities().then(highlighted => {

        minervaProxy.project.map.hideBioEntity(hideprevious ? highlighted : []).then(r => {

            let highlightDefs = []

            AIR.allBioEntities.forEach(e => {
                if (e.constructor.name === 'Alias') {
                    let e_name = e.name + " (" + (e._compartmentId != null ? AIR.Compartments[e._compartmentId] : "secreted") + ")";
                    if (elements.hasOwnProperty(e_name.toLowerCase())) {
                        highlightDefs.push({
                            element: {
                                id: e.id,
                                modelId: e.getModelId(),
                                type: "ALIAS"
                            },
                            type: "SURFACE",
                            options: {
                                color: elements[e_name.toLowerCase()]
                            }

                        });
                    }
                }
            });

            minervaProxy.project.map.showBioEntity(highlightDefs);
        });
    });
}

function selectElementonMap(element, external) {
    let namelower = element.toLowerCase();
    globals.selected = [];

    if (AIR.MapElements.hasOwnProperty(namelower)) {
        globals.selected.push(AIR.MapElements[namelower]);
        focusOnSelected();
    }
    else if (external) {
        let link = getLink(element);

        if (link) {
            window.open(link, "_blank");
        }
    }
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


function xp_path_searchListener(entites) {
    globals.selected = entites[0];
    if (globals.selected.length > 0) {
        if (globals.selected[0].constructor.name === 'Alias') {
            if (globals.selected[0]._compartmentId) {
                getData(globals.selected[0].name + "_" + AIR.Compartments[globals.selected[0]._compartmentId]);
            }
            else {
                getData(globals.selected[0].name + "_secreted");
            }
        }
    }
}

function xp_bool_searchListener(entites) {
    globals.selected = entites[0];
    if (globals.selected.length > 0) {
        if (globals.selected[0].constructor.name === 'Alias') {            
            globals.air_bool_table.search(globals.selected[0].name).draw();
        }
    }
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

function getFontfromValue(invalue) {
    if (invalue < 0) {
        return `<font color="blue" data-order="2"><b>${invalue}<b></font>`;
    }
    else if (invalue > 0) {
        return `<font color="red" data-order="0"><b>${invalue}<b></font>`;
    }
    else {
        return `<font data-order="1"><b>${invalue}<b></font>`
    }
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

function createCell(row, type, text, style, scope, align, nowrap = false, order = "") {
    var cell = document.createElement(type); // create text node
    cell.innerHTML = text;                    // append text node to the DIV
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

    return cell;
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

function expo(x, f = 2, e = 1) {
    if (x == 0)
        return 0;
    let _round = Math.floor(x * Math.pow(10, f)) / Math.pow(10, f)
    if (_round == 0)
        return x.toExponential(e);
    else
        return Math.round(x * Math.pow(10, f)) / Math.pow(10, f)
}


function highlightPath(_elements, color = "#0000ff", additionalelements = {}, hideprevious = true) {

    let _additionalelements = Object.fromEntries(
        Object.entries(additionalelements).map(([k, v]) => [AIR.Molecules[k].name.toLowerCase(), v])
    );
    let elements = [];

    if (_elements instanceof Array) {
        for (let i = 0; i < _elements.length - 1; i++) {
            let source = _elements[i];
            let target = _elements[i + 1];
            elements.push({
                "source": AIR.Molecules[source].name.toLowerCase(),
                "target": AIR.Molecules[target].name.toLowerCase(),
                "color": color
            })
            for (let parent of AIR.Molecules[source].family) {
                elements.push({
                    "source": AIR.Molecules[parent].name.toLowerCase(),
                    "target": AIR.Molecules[target].name.toLowerCase(),
                    "color": color
                })
            }
            for (let parent of AIR.Molecules[target].family) {
                elements.push({
                    "source": AIR.Molecules[source].name.toLowerCase(),
                    "target": AIR.Molecules[parent].name.toLowerCase(),
                    "color": color
                })
            }
        }
    }
    else {
        for (let _epair in _elements) {
            var epair = _epair.split("_")

            elements.push({
                "source": AIR.Molecules[epair[0]].name.toLowerCase(),
                "target": AIR.Molecules[epair[1]].name.toLowerCase(),
                "color": _elements[_epair]
            })
        }
    }

    minervaProxy.project.map.getHighlightedBioEntities().then(highlighted => {

        minervaProxy.project.map.hideBioEntity(hideprevious ? highlighted : []).then(r => {

            let highlightDefs = []
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
                                lineColor: path.color,
                                color: path.color
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

            minervaProxy.project.map.showBioEntity([highlightDefs[0]]);
        });
    });
}


function rgbToHex(rgb) {
    var hex = Number(Math.round(rgb)).toString(16);
    if (hex.length < 2) {
        hex = "0" + hex;
    }
    return hex;
};

function valueToHex(_value) {
    var hex = rgbToHex((1 - Math.abs(_value)) * 255);
    if (_value > 0)
        return '#ff' + hex + hex;
    else if (_value < 0)
        return '#' + hex + hex + 'ff';
    else return '#ffffff';
}

function adjustPanels() {

    var coll = document.getElementById("sarco_plugincontainer").getElementsByClassName("air_collapsible");
    for (var i = 0; i < coll.length; i++) {
        var content = coll[i].nextElementSibling;
        if (content.style.maxHeight) {
            content.style.maxHeight = content.scrollHeight + 1 + "px";
        }
    }
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

function strikeThrough(text) {
    return text
        .split('')
        .map(char => char + '\u0336')
        .join('')
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

function getInteractionLinkIconHTML(type, source, target)
{
    return '<span style="color:' + (type == 1? "red": "blue") + ';font-weight:bold"> <a href="#" data="' + source + "_" + target + '" class="air_reactionlink">' + (type == 1? " → ": " ⊣ ") + '</a></span>'
}