let fileURL = '';
let filetesting;
let Chart;
let JSZip;
let FileSaver;
let VCF;
let ttest;

const AIR = {
    HGNCElements: [],
    MoleculeData: {},
    Phenotypes: {},
    Hypoth_Phenotypes: {},
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
    MapSpecies: [],
    MapSpeciesLowerCase: [],
    allBioEntities: [],
    MapElements: {},
}

const globals = {

    variant: {},
    omics: {},
    xplore: {},
    masspec: {},

    container: undefined,

    defaultusers: ['anonymous', 'guest', 'guest user'],
    specialCharacters: ['+', '#', '*',  '~', '%', '&', '$', '§', '"'],
    guestuser: ['airuser'],

    user: undefined,

    pickedRandomly: undefined,

    //colors: ['#ED8893','#716DC5','#AA7AAE','#E0D2E5','#DFA6BA','#9491D3','#F2EAF2','#B8B5E1'],

    complexMapID: undefined,
    fullMapID: undefined,
    phenotypeMapID: undefined,
    phenotypeImageMapID: undefined,

    container: undefined,
    om_container: undefined,
    gv_container: undefined,
};

const centralities = ["Betweenness", "Closeness", "Degree", "Indegree", "Outdegree"];

let minervaProxy;
let pluginContainer;
let pluginContainerId;
let minervaVersion;

function readDataFiles(_minerva, _filetesting, _filepath, _chart,  _ttest, _jszip, _filesaver, _vcf) {

    return new Promise((resolve, reject) => {

            
        minerva.ServerConnector.getLoggedUser().then(function (user) {
            globals.user = user._login.toString().toLowerCase();
            if (globals.defaultusers.includes(globals.user) === true) {
                alert('Warning: you can create overlays only after logging into your account.');
            }
            if (globals.guestuser.includes(globals.user) === true) {
                alert("Warning: You're logged in through a public account. Overlays you create may be visible to other users if not removed.");
            }
            var t0 =  0;
            var t1 =  0;
            Chart = _chart;
            VCF = _vcf;
            JSZip = _jszip;
            FileSaver = _filesaver;
            filetesting = _filetesting;
            minervaProxy = _minerva;
            fileURL = _filepath;
            ttest = _ttest;
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
                t0 = performance.now();
                $('#air_loading_text').html('Reading elements ...')
                setTimeout(() => {
                    minervaProxy.project.data.getAllBioEntities().then(function (bioEntities) {

                        t1 = performance.now()
                        console.log("Call to getAllBioEntities took " + (t1 - t0) + " milliseconds.")

                        AIR.allBioEntities = bioEntities;
                        bioEntities.forEach(e => {
                            if (e.constructor.name === 'Alias') {
                                let namelower = e.getName().toLowerCase();
                                AIR.MapSpeciesLowerCase.push(namelower);
                                AIR.MapSpecies.push(e.getName());
                                AIR.MapElements[namelower] = e;
                            }
                        });

                        let typevalue = $('.selectdata').val();
                        //let urlstring = 'https://raw.githubusercontent.com/sbi-rostock/SBIMinervaPlugins/master/datafiles/Regulations.txt';
                        t0 = performance.now();
                        $.ajax({
                            url: fileURL + 'Interactions.json',
                            success: function (content) {
                                readInteractions(content).then(r => {
                                    t1 = performance.now()
                                    console.log("Call to get Interactions took " + (t1 - t0) + " milliseconds.")
                                    t0 = performance.now();
                                    $('#air_loading_text').html('Fetching data ...')
                                    setTimeout(() => {
                                        $.ajax({
                                            //url: 'https://raw.githubusercontent.com/sbi-rostock/SBIMinervaPlugins/master/datafiles/Molecules.txt',
                                            url: fileURL + 'Elements.json', 
                                            success: function (moleculecontent) {
                                                t1 = performance.now()
                                                console.log("Call to get Molecules took " + (t1 - t0) + " milliseconds.")
                                                readMolecules(moleculecontent).then(s => { 
                                                    t1 = performance.now()
                                                    console.log("Call to read Molecules took " + (t1 - t0) + " milliseconds.")
                                                    t0 = performance.now();
                                                    readServerValues().then(r => {
                                                        t1 = performance.now();
                                                        console.log("Reading Server values took " + (t1 - t0) + " milliseconds.");
                                                        t0 = performance.now();
                                                        readCentralityValues().then(r => {
                                                            t1 = performance.now()
                                                            console.log("Call to centralities took " + (t1 - t0) + " milliseconds.")
                                                            resolve(AIR);
                                                        });
                                                    });
                                                });
                                            },
                                            error: function () {
                                                reject(AIR);
                                            }
                                        });
                                    }, 0);
                                });;
                            },
                            error: function (content) {
                                alert(content);
                                reject(AIR);
                            }
                        });
                        function readCentralityValues(centrality)
                        {
                            return new Promise((resolve, reject) => {
                                $.ajax({
                                    //url: 'https://raw.githubusercontent.com/sbi-rostock/SBIMinervaPlugins/master/datafiles/Molecules.txt',
                                    url: fileURL + "Centrality.json", 
                                    success: function (content) {
                                        
                                        if(filetesting)
                                        {
                                            AIR.Centrality = content;
                                        }
                                        else
                                        {
                                            AIR.Centrality = JSON.parse(content);
                                        }
                                        resolve('');
                                    },
                                    error: function () {
                                        reject(e);
                                    }
                                });
                            });
                        }
                        function readServerValues() {
                            return new Promise((resolve, reject) => {
                                let promises = [];
                                for (let p in AIR.Phenotypes) 
                                {
                                    promises.push(
                                        getMoleculeData(p, phenotype=true).then(
                                            data => {
                                                let sum = 0;
                                                if(data.hasOwnProperty("i"))
                                                {
                                                    for (let m in data.i)
                                                    {
                                                        let value = data.i[m];
                                                        if(value != 0 && AIR.Molecules.hasOwnProperty(m))
                                                        {
                                                            AIR.Phenotypes[p].values[m] = value;
                                                            sum += Math.abs(value);
                                                        }
                                                        
                                                    }
                                                }
                                                if(data.hasOwnProperty("s"))
                                                {
                                                    for (let m in data.s)
                                                    {
                                                        let value = data.s[m];
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
                                else
                                {
                                    AIR.Molecules = JSON.parse(content);
                                }

                                for(let element in AIR.Molecules)
                                {
                                    if(AIR.Molecules[element].complex === false)
                                    {
                                        for(let id in AIR.Molecules[element].ids)
                                        {                                            
                                            let db_key = id.replace('.','');
                                            if(AIR.ElementNames.hasOwnProperty(db_key))
                                            {
                                                AIR.ElementNames[db_key][AIR.Molecules[element].ids[id]] = element
                                            }
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
                                        AIR.Phenotypes[element]["MainRegulators"] = {};
                                        AIR.Phenotypes[element]["GeneNumber"] = {};
                                    }
                                    if(AIR.Molecules[element].type === "HYPOTH_PHENOTYPE")
                                    {
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
                                else
                                {
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
                }, 0);
            })
        });
    });
}

function getValue(key)
{
    return new Promise(
       (resolve, reject) => {
            minervaProxy.pluginData.getGlobalParam(key).then(
                response => {
                    let output = JSON.parse(response).value;
                    output = replaceAll(output, ",", ".");
                    output = replaceAll(output, "y", '"},"');
                    output = replaceAll(output, "x", '":{"');
                    output = replaceAll(output, "z", '":"');
                    output = replaceAll(output, "q", '","');
                    output = replaceAll(output, '"-.', '"-0.');
                    resolve(output);
            }).catch(e => {
                reject(e)
            });
        });

}

function getMoleculeData(key, phenotype = false)
{
    return new Promise(
       (resolve, reject) => {
            if(AIR.MoleculeData.hasOwnProperty(key))
            {
                let data = AIR.MoleculeData[key];
                resolve(data);
            }
            else {
                if(AIR.Molecules.hasOwnProperty(key) && AIR.Molecules[key].emptySP == true)
                {
                    resolve({});
                }
                else
                {
                    getValue(key).then(response => {
                        let data = {};
                        if(phenotype == false)
                        {
                            data = fillData(JSON.parse(response));
                        }
                        else 
                        {
                            data = JSON.parse(response)
                        }
                        AIR.MoleculeData[key] = data;
                        resolve(data);
                    }).catch(e => {
                        resolve({});
                    });
                }
            }

            function fillData(data)
            {
                for(let e in data)
                {
                    if(data[e].hasOwnProperty("s") == false)
                    {
                        data[e]["s"] = 0;
                    }
                    if(data[e].hasOwnProperty("t") == false)
                    {
                        data[e]["t"] = 1;
                    }
                    if(data[e].hasOwnProperty("c") == false)
                    {
                        if(data[e].S == 0)
                            data[e]["c"] = 0;
                        else
                            data[e]["ic"] = 1;
                    }
                    if(data[e].hasOwnProperty("i") == false)
                    {
                        data[e]["i"] = 0;
                    }
                }

                return data;
            }
        });

}

function highlightSelected(elements, hideprevious = true) {

    minervaProxy.project.map.getHighlightedBioEntities().then(highlighted => {

        minervaProxy.project.map.hideBioEntity(hideprevious? highlighted : []).then(r => {

            highlightDefs =[]
            
            AIR.allBioEntities.forEach(e => {
                if (e.constructor.name === 'Alias' && elements.includes(e.getName())) {
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
            type = AIR.Molecules[element].realtype;
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
        output += '<a href="#" class="air_elementlink">' + element + '</a>';
    }
    else
    {
        output += '<span>' + element + '</span>';
    }

    let link = getLink(element);

    if(link)
    {
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
    row.appendChild(cell);

    return cell;
}


function createCell(row, type, text, style, scope, align, nowrap = false, order = "") {
    var cell = document.createElement(type); // create text node
    cell.innerHTML = text;                    // append text node to the DIV
    cell.setAttribute('class', style);
    if(order)
    {
        cell.setAttribute("data-order", order);
    }
    if(scope != '')
        cell.setAttribute('scope', scope);  // set DIV class attribute // set DIV class attribute for IE (?!)
    if(nowrap)
        cell.setAttribute('style', 'text-align: ' + align + '; white-space: nowrap; vertical-align: middle;'); 
    else
        cell.setAttribute('style', 'text-align: ' + align + '; vertical-align: middle;');               // append DIV to the table cell
    row.appendChild(cell);

    return cell;
}

function createPopupCell(row, type, text, style, align, callback, callbackParameters, order = "") {
    var cell = document.createElement(type); // create text node                  // append text node to the DIV
    cell.setAttribute('class', style);
    cell.setAttribute('style', 'text-align: ' + align + '; vertical-align: middle;');               // append DIV to the table cell
    if(order)
    {
        cell.setAttribute("data-order", order);
    }

    var button = document.createElement('button'); // create text node
    button.innerHTML = text;
    button.setAttribute('type', 'button');
    button.setAttribute('class', 'air_invisiblebtn');
    button.setAttribute('style', 'cursor: pointer;');
    button.onclick = function(){
        callback(button, callbackParameters)
    }

    cell.appendChild(button);

    $(cell).append();


    row.appendChild(cell);

    return cell;
}
function createButtonCell(row, type, text, data, align) {
    var button = document.createElement('button'); // create text node
    button.innerHTML = text;
    button.setAttribute('type', 'button');
    button.setAttribute('class', 'clickPhenotypeinTable air_invisiblebtn');
    button.setAttribute('data', data);

    var cell = document.createElement(type); // create text node
    cell.appendChild(button);
    cell.setAttribute('style', 'text-align: ' + align + '; vertical-align: middle;');// append DIV to the table cell
    row.appendChild(cell);

    return button; // append DIV to the table cell
}
function checkBoxCell(row, type, text, data, align, prefix) {
    var button = document.createElement('input'); // create text node
    button.innerHTML = text;
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
    button.setAttribute('min', '-2');
    button.setAttribute('max', '2');
    button.setAttribute('step', '0.1');
    button.setAttribute('class', 'slider air_slider');

    var cell = document.createElement(type);
    cell.setAttribute('style', 'text-align: center; vertical-align: middle;');     // create text node
    cell.appendChild(button);     // append DIV to the table cell
    row.appendChild(cell);



    return button;
}

async function disablebutton(id, progress = false) {
    var promise = new Promise(function(resolve, reject) {
        setTimeout(() => {
            var $btn = $('#'+id);
            let text = $btn.html();
            if(progress == false)
            {
                $btn.html('<span class="loadingspinner spinner-border spinner-border-sm"></span>');
            }      
            else
            {
                $btn.empty().append(`<div class="air_progress position-relative mb-4">
                    <div id= "${id}_progress" class="air_progress_value"></div>
                    <span id="${id}_progress_label" class="air_progress_label justify-content-center d-flex position-absolute w-100">0 %</span>
                </div>`);
            }
            $(".air_btn").each(function( pindex ) {
                var airbtn = $(this)
                airbtn.addClass("air_disabledbutton");
            });
            resolve(text)
        }, 0);
    });
    return promise;
}

async function enablebtn(id, text) {
    return new Promise(resolve => {
        setTimeout(() => {
            $(".air_btn").each(function( pindex ) {
                $(this).removeClass("air_disabledbutton");
            });
            var $btn = $('#'+id);
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
        if(!isNaN(_e))
        {
            array.push(_e)
        }
    });
    
    const n = array.length
    const mean = array.reduce((a, b) => a + b) / n
    return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
}

function mean(_temparray) {

    let numbers = []

    _temparray.forEach(_e => {
        if(!isNaN(_e))
        {
            numbers.push(_e)
        }
    });
    
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

function getElementContent(elements, seperator)
{
    let element_content = "Name" + seperator + "Type" + seperator + "Subunits" + seperator + "IDs";            

    for (let e in elements)
    {
        element_content += "\n";
        element_content += AIR.Molecules[e].name.replace(seperator, "");
        element_content += seperator + AIR.Molecules[e].type.replace(seperator, "");

        let subunits = [];
        for(let s in AIR.Molecules[e].subunits)
        {
            subunits.push(AIR.Molecules[AIR.Molecules[e].subunits[s]].name)
        }
        element_content += seperator + subunits.join(" | ").replace(seperator, "");

        let ids = [];
        for(let s in AIR.Molecules[e].ids)
        {
            if(s != "name")
            {
                ids.push(s + ":" + AIR.Molecules[e].ids[s])
            }
        }
        element_content += seperator + ids.join(" | ").replace(seperator, "");
    }

    return element_content;
}

function getInterContent(interactions, seperator, extended = false)
{   
    let inter_content; 
    if(extended)
    {
        inter_content = "Source" + seperator + "Type" + seperator + "Interaction" + seperator + "Target" + seperator + "Type" + seperator + "Pubmed";
    }
    else
    {
        inter_content = "Source" + seperator + "Interaction" + seperator + "Target" + seperator + "Pubmed";
    } 

    for (let e in interactions)
    {
        inter_content += "\n";
        inter_content += AIR.Molecules[AIR.Interactions[e].source].name.replace(seperator, "");
        if(extended)
        {
            inter_content += AIR.Molecules[AIR.Interactions[e].source].type.replace(seperator, "");
        }
        inter_content += seperator + AIR.Interactions[e].typeString.replace(seperator, "");
        inter_content += seperator + AIR.Molecules[AIR.Interactions[e].target].name.replace(seperator, "");
        if(extended)
        {
            inter_content += AIR.Molecules[AIR.Interactions[e].target].type.replace(seperator, "");
        }

        let pubmed = [];
        for(let s in AIR.Interactions[e].pubmed)
        {
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
        if(!isNaN(_e))
        {
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
        if(!isNaN(_e))
        {
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
        let percentage = Math.ceil(value * 100 / max);
        setTimeout(setProgress, 0);
        function setProgress() {
            $("#" + progressbar+"_progress").width(percentage + "%");
            $("#"+progressbar+"_progress_label").html(percentage + " %" + text);
            resolve('');
        }
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

function valueToHex(_value) {
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
        if (content.style.maxHeight){
            content.style.maxHeight = content.scrollHeight + 1 + "px";
        } 
    }
}
function expo(x, f=2, e=1) {
    if(x == 0)
        return 0;
    let _round = Math.floor(x*Math.pow(10,f))/Math.pow(10,f)
    if(_round == 0)
        return x.toExponential(e);
    else
      return Math.round(x*Math.pow(10,f))/Math.pow(10,f)
  }


async function air_addoverlay(olname, callback, cb_param = null)
{
    return new Promise((resolve, reject) =>  
    { 
        var _content = callback(cb_param) 
        if(_content != "")
        {
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

function shuffle(array) {
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

function union(setA, setB) {
    let _union = new Set(setA)
    for (let elem of setB) {
        _union.add(elem)
    }
    return _union
}