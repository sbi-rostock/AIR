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
// let jspdf;
var project_hash;
let SBI_SERVER = "";

let sessionWarningTimeout;
const sessionWarningDuration = 16 * 60 * 1000;  // 15 minutes
const countdownDuration = 2 * 60 * 1000;  // 2 minutes

function resetSessionWarningTimer() {
    clearTimeout(sessionWarningTimeout);

    sessionWarningTimeout = setTimeout(() => {
        promptForExtension();
    }, sessionWarningDuration);
}

async function promptForExtension() {
    let expirationTimeout = setTimeout(() => {
        alert('Your session has ended.');
        location.reload();
    }, countdownDuration);

    let message = `Your session is about to expire in 2 Minutes. Do you want to extend the session?`;

    if (window.confirm(message)) {
        clearTimeout(expirationTimeout);

        data = JSON.parse(await getDataFromServer("extend_session", type = "GET"))
        
        if (data.status === 'extended') {
            resetSessionWarningTimer();
        } else {
            alert('Session already expired.');
            location.reload();
        }
    }
    else
    {
        alert('Your session has ended.');
        location.reload();
    }
}

Object.filter = (obj, predicate) =>
    Object.keys(obj)
        .filter(key => predicate(key))
        .reduce((res, key) => (res[key] = obj[key], res), {});


const globals = {

    container: undefined,

    defaultusers: ['anonymous', 'guest', 'guest user'],
    specialCharacters: ['+', '#', '*', '~', '%', '&', '$', '§', '"'],
    guestuser: ['airuser'],

    user: undefined,
};

let minervaProxy;
let pluginContainer;
let pluginContainerId;
let minervaVersion;

let components;
let minerva_elements;
let aliasCache

let nodes = {}
let minerva_id_mapping = {}
let hgnc_id_mapping = {}

let overlay_data = {}

let hipathia_sif_data = []

let component_table = undefined

let drug_targets = {}

let degs = new Set()
let expressed = new Set()

let highlighted_component;

function getDataFromServer(request, data = {}, type = "GET", datatype = "text", contentType = 'application/json') {
    return new Promise((resolve, reject) => {
      $.ajax({
        type: type,
        url: SBI_SERVER + project_hash + "/bhs_" + request,
        contentType: contentType,
        dataType: datatype,
        data: data,
        cors: true,
        secure: true,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        success: function (data) {
          resolve(data);
        },
        error: function (error) {
          reject(error);
        }
      });
    });
  }



async function fetchData(url) {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.text();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;  // or handle it in a way you find suitable
    }
}  

function getNameFromAlias(e) {
    let name = e.name;
    if (e._compartmentId) {
        name += " (" + AIR.Compartments[e._compartmentId] + ")";
    }
    else {
        name += " (Blood)";
    }

    return name;
}

function readDataFiles(_minerva, _filetesting, _project_hash, _chart, _ttest, _jszip, _filesaver, _vcf, _decimal, _cytoscape, _sbi_server) {

    return new Promise((resolve, reject) => {

        // socket.on('progress', (data) => {
        //     if (data.id === 'abm_progress') {
        //         updateProgress(data.percent, 1, "om_pheno_analyzebtn", text = " Estimating phenotype levels.");
        //     } else if (data.id === 'another_task') {
        //         console.log('Progress from another_task:', data.percent);
        //     }
        // });

        cytoscape = _cytoscape;
        Chart = _chart;
        VCF = _vcf;
        JSZip = _jszip;
        FileSaver = _filesaver;
        TESTING = _filetesting;
        minervaProxy = _minerva;
        project_hash = _project_hash;
        ttest = _ttest;
        Decimal = _decimal;
        // jspdf = _jspdf;
        SBI_SERVER = _sbi_server;
        pluginContainer = $(minervaProxy.element);
        pluginContainerId = pluginContainer.attr('id');

        minerva.ServerConnector.getModels().then(models => {
            let model_id_mapping = {}
            for(let model of Object.values(models))
            {
                model_id_mapping[model._name] = model.id
            }
            minerva.ServerConnector.getLoggedUser().then(function (user) {
                globals.user = user._login.toString().toLowerCase();

                $('#air_loading_text').html('Reading elements ...')
                minervaProxy.project.data.getAllBioEntities().then(async function (bioEntities) {

                    
                    $('#air_loading_text').html('Generating components ...')

                    minerva_elements = bioEntities
                    aliasCache = minerva_elements.map(e => {
                        if (e.constructor.name === 'Reaction') {
                            return {
                                reactants: new Set(e._reactants.map(r => r._alias)),
                                modifiers: new Set(e._modifiers.map(r => r._alias)),
                                products: new Set(e._products.map(r => r._alias)),
                                element: e
                            };
                        }
                        return null;
                    }).filter(e => e !== null);

                    nodes = JSON.parse(await getDataFromServer("nodes", data = {}, type = "GET", datatype = "text", contentType = 'application/json'))
                    for (let node of Object.values(nodes))
                    {
                        node["minerva"] = undefined;
                        node["references"] = {
                            "hgnc": [],
                            "entrez": [],
                        }
                        node["model"] = model_id_mapping.hasOwnProperty(node.file)? model_id_mapping[node.file] : undefined
                        node["deg"] = 0
                        node["expression"] = 0
                    }

                    let number_of_mapped = 0
                    let number_of_unmapped = 0
                    let number_of_minerva = 0

                    for (let e of bioEntities) {

                        if (e.constructor.name === 'Alias') {

                            number_of_minerva += 1

                            let found = false
                            for(let node of Object.values(nodes))
                            {
                                if (node.alias == e._elementId && node.model == e.getModelId())
                                {
                                    found = true
                                    node.minerva = e
                                    if (e.name)
                                    {
                                        node.name = e.name.replace(/\n/g, ' ');                             
                                    }
                                    if (e._type)
                                        node.type = e._type
                                    minerva_id_mapping[e.id] = node

                                    for (let reference of e.references)
                                    {
                                        switch (reference._type) {
                                            case "ENTREZ":
                                                node.references.entrez.push(reference._resource)
                                                break;
                                            case "HGNC_SYMBOL":
                                                node.references.hgnc.push(reference._resource)
                                                break;
                                            default:
                                                break;
                                        }
                                    }
                                    
                                    number_of_mapped += 1
                                    break;
                                }
                            }
                            if(found == false) {
                                number_of_unmapped += 1
                            }
                        }
                    }

                    for (let [node_alias,node] of Object.entries(nodes))
                    {                    
                        node.references.hgnc = node.references.hgnc.concat(node.subunits
                            .map(subunit => nodes[subunit].references.hgnc)
                            .reduce((acc, currList) => acc.concat(currList), []))

                        node.references.hgnc = [...new Set(node.references.hgnc)]

                        for (let hgnc of node.references.hgnc)
                        {
                            if (hgnc_id_mapping.hasOwnProperty(hgnc) == false)
                            {
                                hgnc_id_mapping[hgnc] = []
                            }
                            hgnc_id_mapping[hgnc].push(node)
                        }
                    }
 

                    console.log("Number of MINERVA elements: " + number_of_minerva)
                    console.log("Number of Server elements: " + Object.keys(nodes).length)
                    console.log("Number of mapped MINERVA elements: " + number_of_mapped)
                    console.log("Number of unmapped MINERVA elements: " + number_of_unmapped)

                    let overlays = await minervaProxy.project.data.getDataOverlays()
                    for(let [i,overlay_name] of Object.entries(["DISEASE_ASSOCIATED_GENES", "EXPRESSION_BACKGROUND_GENES"]))
                    {
                        for(let overlay of overlays)
                        {
                            if (overlay.name == overlay_name)
                            {                            
                                const overlay_data = await fetchData(window.location.origin + '/minerva/api/projects/' + minerva.ServerConnector._sessionData._project._projectId +'/overlays/' + overlay.id + ':downloadSource')

                                const lines = overlay_data.split('\n');
                                // Skip the first two lines, as they are headers
                                const entries = lines.slice(2);

                                entries.forEach(line => {
                                    // Split each line into identifier and value
                                    const [identifier, value] = line.split('\t').map(item => item.trim());
                                    // Output the identifier-value pair
                                    if (identifier && value) { // This check is to avoid any empty lines
                                        if(hgnc_id_mapping.hasOwnProperty(identifier))
                                        {
                                            if(i == 0)
                                                degs.add(identifier)
                                            else
                                                expressed.add(identifier)

                                            for (let node of hgnc_id_mapping[identifier])
                                            {
                                                node[i==0? "deg":"expression"] = parseFloat(value)                                                
                                            }
                                        }
                                    }
                                });
                            }
                        }
                    }

                    $('#air_loading_text').html('Identifying drug targets ...')


                    drug_targets = JSON.parse(await getDataFromServer("drugtargets", data = JSON.stringify(Object.keys(hgnc_id_mapping)), type = "POST", datatype = "text", contentType = 'application/json'))

                    
                    components = JSON.parse(await getDataFromServer("components", data = {}, type = "GET", datatype = "text", contentType = 'application/json'))


                    document.getElementById("stat_spinner").remove();


                    // Start the initial timer
                    resetSessionWarningTimer();   
                    
                    for(let config of ["expr", "deg", "drug", "len"])
                    {
                        let description = ""
                        switch (config) {
                            case "expr":
                                description = "[%] Expressed genes"
                                break;
                            case "deg":
                                description = "[%] Disease genes"
                                break;
                            case "drug":
                                description = "[%] Drug-targeted genes"
                                break;
                            case "len":
                                description = "Min. length of longest path"
                                break;
                        }
                        $(`
                            <div class="row mt-4 mb-4">
                                <div class="col" style="width: 45%; padding-right: 0; text-align:right">
                                    <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">${description}</span>
                                </div>
                                <div class="col-auto" style="width: 12%; padding: 0; text-align:center">
                                    <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;" class="bhs_slider_value" id="bhs_slidervalue_${config}">0${config == "len"? "":" %"}</span>
                                </div>
                                <div class="col-auto" style="width: 40%; padding-top: 5px; padding-right: 40px;">
                                    <input type="range" style="width: 100%;" value="0" min="0" max="100" step="1" class="slider air_slider bhs_slider" id="bhs_slider_${config}">
                                </div>
                            </div>
                        `).appendTo("#bhs_plugincontainer")
                    }                    
                    
                    $('<button type="button" id="bhs_reset_btn" class="air_btn_light btn btn-block mt-4 mb-6">Reset Filter</button>').appendTo("#bhs_plugincontainer")
                    $('<hr>').appendTo("#bhs_plugincontainer")

                    
                    $(`
                        <table id="bhs_tbl_components"  class="hover air_table mb-2 bhs-main-tbl" style="width:100%">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th></th>
                                    <th></th>
                                    <th>Export</th>
                                    <th># Nodes</th>
                                    <th># HGNC</th>
                                    <th># Edges</th>
                                    <th>max. length</th>
                                    <th># Disease genes</th>
                                    <th># Expressed Genes</th>
                                    <th># Drugs</th>
                                    <th># Targeted genes</th>
                                    <th># Targeted dis. genes</th>
                                    <th># Targeted expr. genes</th>
                                </tr>
                            </thead>
                        </table>
                    `).appendTo("#bhs_plugincontainer")
                    // $('<select id="bhs_component_select" class="browser-default xp_select custom-select mt-2 mb-2"></select>').appendTo("#bhs_plugincontainer");
                    $('<button type="button" id="bhs_hipathia" class="air_btn btn btn-block mt-4 mb-2">Export Hipathia</button>').appendTo("#bhs_plugincontainer")
                    $('<button type="button" id="bhs_casq" class="air_btn btn btn-block mt-4 mb-2">Export Casq</button>').appendTo("#bhs_plugincontainer")
                    $(`
                        <hr>
                        <div class="container">
                            <div class="row mt-4 mb-2 justify-content-center">
                                <div class="col-12 text-center mb-3">
                                    <label class="air_checkbox">Highlight</label>
                                </div>
                                <div class="col-md-4 text-center">
                                    <div class="form-check">
                                        <input type="checkbox" class="form-check-input bhs_highlight_checkbox" id="bhs_highlight_elements" checked>
                                        <label class="form-check-label" for="bhs_highlight_elements">Elements</label>
                                    </div>
                                </div>
                                <div class="col-md-4 text-center">
                                    <div class="form-check">
                                        <input type="checkbox" class="form-check-input bhs_highlight_checkbox" id="bhs_highlight_reactions" checked>
                                        <label class="form-check-label" for="bhs_highlight_reactions">Reactions</label>
                                    </div>
                                </div>
                                <div class="col-md-4 text-center">
                                    <div class="form-check">
                                        <input type="checkbox" class="form-check-input bhs_highlight_checkbox" id="bhs_highlight_targets" checked>
                                        <label class="form-check-label" for="bhs_highlight_targets">Drug Targets</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                    `).appendTo("#bhs_plugincontainer");
                    $('<div id="bhs_cytoscape" style="width: 100%; height: 350px"></div>').appendTo("#bhs_plugincontainer");

                    $(".bhs_highlight_checkbox").on("change", function() {
                        highlight_component(highlighted_component)
                    })

                    component_table = $('#bhs_tbl_components').DataTable({
                        "dom": '<"top"<"left-col"B><"right-col"f>>rtip',
                        "buttons": [
                            {
                                text: 'All',
                                className: 'air_dt_btn',
                                action: function () {
                                    $('#bhs_tbl_components tr').each(function() {
                                        $(this).find('td input[type="checkbox"]').prop('checked', true);
                                    });
                                }
                            },
                            {
                                text: 'None',
                                className: 'air_dt_btn',
                                action: function () {
                                    $('#bhs_tbl_components tr').each(function() {
                                        $(this).find('td input[type="checkbox"]').prop('checked', false);
                                    });
                                }
                            },
                        ],
                        pageLength: 5,  // set the default to 15 rows per page
                        lengthMenu: [[3, 5, 10, 15], [3, 5, 10, 15]],
                        // "dom": '<"top"<"left-col"B><"right-col"f>>rtip',
                        "order": [[2, "desc"]],
                        "scrollX": true,
                        "autoWidth": true,
                        "columnDefs": [
                            { className: "dt-center", targets: "_all" } // This adds the class "dt-center" to all columns. Adjust "targets" to specify which columns to center.
                        ]                    
                    }).columns.adjust();

                    let max_size = 0;
                    for (let [i,component] of Object.entries(components)) { 

                        const isEmptyOrWhitespace = (str) => {
                            return str === undefined || str === null || str.trim() === '';
                        };
                        
                        // Check if any string in the list is empty, undefined, or null after trimming
                        if (component.nodes.some(node => isEmptyOrWhitespace(nodes[node].name)))
                        {
                            continue
                        }

                        
                        component["degs"] = []
                        component["drug_target_nodes"] = new Set()
                        component["drug_target_hgnc"] = new Set()
                        component["hgnc"] = new Set()

                        let number_of_degs = 0
                        let number_of_targeted_degs = new Set()
                        let number_of_targeted_expressed = new Set()
                        let number_of_targeted_non_degs = new Set()
                        let total_number_nodes = 0
                        let expressed_hgnc = new Set();

                        let drugs = new Set()
                        for(node of component.nodes)
                        {
                            let drug_targeted = false
                            total_number_nodes += nodes[node].references.hgnc.length
                            for (let hgnc of nodes[node].references.hgnc)
                            {
                                component.hgnc = new Set([...component.hgnc, ...nodes[node].references.hgnc])
                                if(drug_targets.hasOwnProperty(hgnc))
                                {

                                    component.drug_target_nodes.add(node)
                                    for (let drug of drug_targets[hgnc])
                                    {
                                        component.drug_target_hgnc.add(hgnc)
                                        drugs.add(drug.drug_name)
                                    }
                                    drug_targeted = true
                                }
                                if(degs.has(hgnc))
                                {
                                    component.degs.push(node)
                                    number_of_degs += 1
                                    if (drug_targeted)
                                    {
                                        number_of_targeted_degs.add(hgnc)
                                    }
                                }
                                if(expressed.has(hgnc))
                                {
                                    expressed_hgnc.add(hgnc)
                                    if (drug_targeted)
                                    {
                                        number_of_targeted_expressed.add(hgnc)
                                    }
                                }
                            }

                        }
                        component["model"] = component.nodes.map(node => nodes[node].model).find(model => model !== "");
                        addRow(i, 
                            component.nodes.length, 
                            total_number_nodes, 
                            component.edges.length, 
                            component.length, 
                            number_of_degs, 
                            expressed_hgnc.size, 
                            drugs.size, 
                            component["drug_target_hgnc"].size, 
                            number_of_targeted_degs.size, 
                            number_of_targeted_expressed.size)                       
                        
                        if(component.length > max_size)
                            max_size = component.length
                    }
                    $("#bhs_slider_len").attr('max', max_size);

                    // New code to get all checked rows when the button is clicked
                    $('#bhs_casq').click(async function() {
                        
                        var text = await disablebutton("bhs_casq", progress = true)

                        await updateProgress(0, 1, "bhs_casq");

                        var casq_files = [];
                        $('#bhs_tbl_components tr').each(function() {
                            var $firstCheckbox = $(this).find('td input[type="checkbox"]');
                            if ($firstCheckbox.is(':checked')) {
                                casq_files.push($(this).data('id'))
                            }
                        });
                        
                        var zip = new JSZip();

                        if (casq_files.length == 0)
                        {
                            enablebtn("bhs_casq", text)
                            return
                        }

                        for (let [i, component_id] of Object.entries(casq_files))
                        {
                            let unprocessed_data = {
                                "model": components[component_id].model,
                                "elements": components[component_id].nodes.map(node => nodes[node].minerva.id),
                            }  
                            let qual_sbml_file = await getDataFromServer("casq", data = JSON.stringify(unprocessed_data), type = "POST", datatype = "text", contentType = 'application/json')

                            if(casq_files.length == 1)
                            {
                                var blob = new Blob([qual_sbml_file], { type: 'text/plain' });
                                var downloadLink = document.createElement("a");
                                downloadLink.download = `hsa${components[component_id].model}c${component_id}.sbml`;
                                downloadLink.href = window.URL.createObjectURL(blob);
                                document.body.appendChild(downloadLink);
                                downloadLink.click();
                                document.body.removeChild(downloadLink);
                            }
                            else
                            {
                                zip.file(`hsa${components[component_id].model}c${component_id}.sbml`, qual_sbml_file);                        
                            }

                            await updateProgress(i, casq_files.length, "bhs_casq");
                        }
                        if(casq_files.length > 1)
                        {
                            zip.generateAsync({ type: "blob" })
                                .then(function (content) {
                                    FileSaver.saveAs(content, "casq.zip");
                                });
                        }
                        enablebtn("bhs_casq", text)
                    })

                    // New code to get all checked rows when the button is clicked
                    $('#bhs_hipathia').click(async function() {
                        
                        var text = await disablebutton("bhs_hipathia", progress = true)

                        await updateProgress(0, 1, "bhs_hipathia");

                        var hipathia_files = [];
                        $('#bhs_tbl_components tr').each(function() {
                            var $firstCheckbox = $(this).find('td input[type="checkbox"]');
                            if ($firstCheckbox.is(':checked')) {
                                hipathia_files.push(export_hipathia($(this).data('id')))
                            }
                        });

                        var zip = new JSZip();

                        if (hipathia_files.length == 0)
                        {
                            enablebtn("bhs_hipathia", text)
                            return
                        }

                        for (let [i, component_data] of Object.entries(hipathia_files))
                        {
                            let unprocessed_data = {
                                "id": component_data[1],
                                "sif": component_data[2],
                                "att": component_data[3],
                            }  
                            let processed_data = JSON.parse(await getDataFromServer("hipathia", data = JSON.stringify(unprocessed_data), type = "POST", datatype = "text", contentType = 'application/json'))
                            zip.file(`hsa${component_data[1]}c${component_data[0]}.sif`, processed_data[0]);
                            zip.file(`hsa${component_data[1]}c${component_data[0]}.att`, processed_data[1]);

                            await updateProgress(i, hipathia_files.length, "bhs_hipathia");
                        }
                        zip.generateAsync({ type: "blob" })
                            .then(function (content) {
                                FileSaver.saveAs(content, "hipathia.zip");
                            });

                        enablebtn("bhs_hipathia", text)
                    });

                    $("#bhs_reset_btn").click(function() {
                        $(".bhs_slider").val(0)
                        $(".bhs_slider_value").html(0)
                        filterTable()
                    })

                    $('.bhs_slider').on('input', function() {
                        $(this).parents('.row').find('.bhs_slider_value').html($(this).val() + ($(this).is('#bhs_slider_len')? "":" %"));
                        
                        filterTable()
                    });

                    // $('.bhs_slider').on('change', filterTable);

                    resolve('')
                });
            });
        });
    });
}

function filterTable()
{
    // Remove all custom filtering functions
    $.fn.dataTable.ext.search = [];

    let len = parseFloat($("#bhs_slider_len").val())
    let deg = parseFloat($("#bhs_slider_deg").val())
    let expr = parseFloat($("#bhs_slider_expr").val())
    let drug = parseFloat($("#bhs_slider_drug").val())

    // Custom filtering function that applies to the first table only
    $.fn.dataTable.ext.search.push(
        function(settings, data, dataIndex) {
            // Check if this function should apply to the current table
            if (settings.nTable !== document.getElementById('bhs_tbl_components')) {
                // Not our table - don't filter
                return true;
            }

            var first_columns = 4
            var nodes_val = parseFloat(data[first_columns + 1]) / 100
            var degs_val = parseFloat(data[first_columns + 4])
            var expr_val = parseFloat(data[first_columns + 5])
            var drug_val = parseFloat(data[first_columns + 7])
            var len_val = parseFloat(data[first_columns + 3])

            return (len_val >= len && (degs_val/nodes_val) >= deg && (expr_val/nodes_val) >= expr && (drug_val/nodes_val) >= drug)
        }
    );
    component_table.draw();
  
}

function export_hipathia(id)
{
    component = components[id]           
    
    hipathia_sif_data = []
    hipathia_node_data = []
    
    for (let node_alias of component.nodes)
    {
        let node = nodes[node_alias]
        let subunits = new Set(
            node.subunits
                .map(subunit => nodes[subunit].references.entrez)
                .reduce((acc, currList) => acc.concat(currList), [])  // Flatten the list of lists
        );

        if(node.type.toLowerCase() == "complex")
        {
            node.references.entrez.forEach(item => subunits.add(item));
        }

        subunits = [...subunits]

        if (subunits.length == 0)
        {
            subunits = "NA"
        }
        else
        {
            subunits = subunits.join(";")
        }

        hipathia_node_data.push({ 
            name: node_alias,
            label: node.name,
            X: node.minerva.x,
            Y: node.minerva.y,
            color: "white",
            shape: "rectangle",
            type: get_hipahia_type(node),
            "label.cex": 0.5,
            "label.color": "black",
            width: 46,
            height: 17,
            genesList: subunits

        })
    }
    // Convert data to TSV string
    let attContent = "name\tlabel\tX\tY\tcolor\tshape\ttype\tlabel.cex\tlabel.color\twidth\theight\tgenesList"; // Headers
    hipathia_node_data.forEach(row => {
        attContent += '\n' + Object.values(row).join("\t");
    });


    for (let edge of component.edges) {
        hipathia_sif_data.push({ from: edge[0], sign: edge[1] == -1? "inhibition" : "activation", to: edge[2] })
    }
    
    // Convert data to TSV string
    let sifContent = "from\tsign\tto"; // Headers
    hipathia_sif_data.forEach(row => {
        sifContent += '\n' + Object.values(row).join("\t");
    });

    return(
        [id, component.model, sifContent, attContent]
    )
}

function updateCytoscape(id) {

    component = components[id]           
    network = []

    for (let [i,edge] of Object.entries(component.edges)) {

        hipathia_sif_data.push({ from: edge[0], sign: edge[1] == -1? "inhibition" : "activation", to: edge[2] })

        network.push({
            data: {
              id: i,
              source: edge[0],
              target: edge[2],
              inhibition: edge[1] == -1? "true" : "false"
            }
          })
    }
    for (let node of component.nodes)
    {
        network.push({
            data: { 
                id: node,
                name: nodes[node]["name"],
                color: [...component.drug_target_nodes].includes(node)? "#FF0000" : "#29C6FA" ,
                shape: nodes[node].expression? "circle": "triangle"
            }
        })
    }

    let cy = cytoscape({
        container: document.getElementById('bhs_cytoscape'),
        elements: network,
          style: [
              {
                  selector: 'node',
                  style: {
                      shape: 'data(shape)',
                      'background-color': 'data(color)',
                      'label': 'data(name)',
                    //   'shape': 'data(shape)'
                  }
              },
              {
                selector: 'edge[inhibition="true"]',
                style: {
                    'target-arrow-shape': 'tee',
                    // 'line-color': '#ff0000',
                    // 'target-arrow-color': '#ff0000'
                }
            },
            {
                selector: 'edge[inhibition="false"]',
                style: {
                    'target-arrow-shape': 'triangle',
                    // 'line-color': '#d8d8d8',
                    // 'target-arrow-color': '#d8d8d8'
                }
            }
            ]      
      });

      let options = {
        name: 'fcose',
        animate: false, // whether to animate changes to the layout
        animationDuration: 500, // duration of animation in ms, if enabled
        animationEasing: undefined, // easing of animation, if enabled
        animateFilter: function ( node, i ){ return true; }, // a function that determines whether the node should be animated.
          // All nodes animated by default for `animate:true`.  Non-animated nodes are positioned immediately when the layout starts.
        fit: true, // whether to fit the viewport to the graph
        padding: 30, // padding to leave between graph and viewport
        pan: undefined, // pan the graph to the provided position, given as { x, y }
        ready: undefined, // callback for the layoutready event
        stop: function(){
            // enablebtn("om_crn_analyzebtn", text)
        }, // callback for the layoutstop event
        spacingFactor: 1, // a positive value which adjusts spacing between nodes (>1 means greater than usual spacing)
        zoom: undefined // zoom level as a positive number to set after animation
      }

    var layout = cy.elements().layout(options);    

    layout.run();

    cy.on('tap', 'node', function(event){
        var node = event.target;
        var node_id = node.data('id');
    
        focus(nodes[node_id].minerva)
        // Add more conditions based on other values of customAttribute as needed
    }); 
    
    cy.on('tap', 'edge', function(event){
        var edge = event.target;
        var source = nodes[edge.data('source')].minerva
        var target = nodes[edge.data('target')].minerva

        focus(findreaction(source, target))
        // Add more conditions based on other values of customAttribute as needed
    });

    highlighted_component = component
    highlight_component(component)
}

function highlight_component(component) {

    if(!component)
        return

    let highlightDefs = []
    minervaProxy.project.map.getHighlightedBioEntities().then(highlighted => {

        minervaProxy.project.map.hideBioEntity(highlighted).then(r => {

            if ($("#bhs_highlight_reactions").prop("checked"))
            {
                for(let r of component.edges.map(edge => findreaction(nodes[edge[0]].minerva, nodes[edge[2]].minerva)).filter(r => r != null))
                    highlightDefs.push({
                        element: {
                            id: r.id,
                            modelId: r.getModelId(),
                            type: "REACTION"
                        },
                        type: "SURFACE",
                        options: {
                            lineColor: "#FF0000"
                        }
                    })
            }
            if ($("#bhs_highlight_elements").prop("checked"))
            {
                for(let e of [... component.nodes].map(node => nodes[node].minerva))
                    highlightDefs.push({
                        element: {
                            id: e.id,
                            modelId: e.getModelId(),
                            type: "ALIAS"
                        },
                        type: "SURFACE",
                        options: {
                            color: "#FF0000"
                        }
                    })
            }
            if ($("#bhs_highlight_targets").prop("checked"))
            {
                for(let e of [... component.drug_target_nodes].map(node => nodes[node].minerva))
                    highlightDefs.push({
                        element: {
                            id: e.id,
                            modelId: e.getModelId(),
                            type: "ALIAS"
                        },
                        type: "ICON"
                    });
            }

            minervaProxy.project.map.showBioEntity(highlightDefs);
        });
    });
}

function findreaction(source, target) {
    for (const e of aliasCache) {
        // Check if the element is a 'Reaction' and if the source or target match
        // Utilizing Set.has for faster lookup instead of Array.includes
        if ((e.reactants.has(source) && (e.modifiers.has(target) || e.products.has(target))) ||
            (e.modifiers.has(source) && e.products.has(target))) {
            return e.element;
        }
    }
    return null; // Return null if no reaction is found
}

// function addRow(id, ...params) {
//     // Begin with the static elements of your array
//     let rowData = [
//         '<input type="checkbox">',
//         '<a href="#"><span class="fas fa-eye"></span></a>',
//         // Spread the strings to append them into the rowData array
//         ...params
//     ];
    
//     component_table.row.add(rowData).node().setAttribute('data-id', id);
//     component_table.columns.adjust().draw();
// }

function createSubtableContent(dataId) {
    // Replace this with the actual content you want in your subtable
    component = components[dataId]
    let tablecontent = new Set()

    for (let hgnc of component.drug_target_hgnc)
    {
        for (let drug of drug_targets[hgnc])
        {
            
            tablecontent.add('<tr>'  
            + (drug.chembl_id? `<td><a href="https://www.ebi.ac.uk/chembl/compound_report_card/${drug.chembl_id}/" target="_blank">${drug.drug_name}</a></td>`: `<td>${drug.drug_name}</td>`)
            + `<td>${drug.relation}</td>`
            + `<td>${hgnc}</td>`    
            + `<td>${expressed.has(hgnc)? "TRUE" : "FALSE"}</td>`
            + `<td>${degs.has(hgnc)? "TRUE" : "FALSE"}</td>`      
            + '</tr>')
        }
    }
    return tablecontent.size >0 ? `<table id="component_${dataId}_subtbl" style="width=auto !important" class="bhs_subtable air_table table nowrap table-sm">
                <thead>
                    <tr>
                        <th>Drug</th>
                        <th>Relation</th>
                        <th>Target</th>                        
                        <th>Expressed</th>
                        <th>Disease</th>
                    </tr>
                </thead>
                ${[...tablecontent].join('')}
            </table>` : null;
}

function addRow(id, ...params) {
    // Add the caret icon to the beginning of the rowData array with a 'cursor-pointer' class

    let subtable = createSubtableContent(id)

    let rowData = [
        subtable? '<span class="fas fa-caret-right toggle-details cursor-pointer"></span>' : "",
        '<a href="#" class="bhs_locate_component"><span class="fas fa-map-marker"></span></a>',
        '<a href="#" class="bhs_view_component"><span class="fas fa-eye"></span></a>',
        '<input type="checkbox">',
        ...params
    ];
    
    let rowNode = component_table.row.add(rowData).node();
    $(rowNode).attr('data-id', id);
    component_table.columns.adjust().draw();

    // Attach click event handler to the caret icon within the row
    $(rowNode).on('click', '.toggle-details', function() {
        let tr = $(this).closest('tr');
        let row = component_table.row(tr);
        let icon = $(this);

        if (row.child.isShown()) {
            row.child.hide();
            // tr.removeClass('datatable-container')
            icon.removeClass('fa-caret-down').addClass('fa-caret-right');
            tr.removeClass('shown');
        } else {
            row.child(subtable).show();
            // tr.addClass('datatable-container')
            $(`#component_${id}_subtbl`).DataTable({
                // "dom": '<"top"<"left-col"B><"right-col"f>>rtip',
                "order": [[0, "asc"]],
                "autoWidth": true,
                "columnDefs": [
                    { className: "dt-left", targets: "_all" } // This adds the class "dt-center" to all columns. Adjust "targets" to specify which columns to center.
                ],
                "bLengthChange" : false, //thought this line could hide the LengthMenu
                "bInfo":false,   
                "bPaginate": false, 
                searching: false, 
                paging: false, 
                info: false                   
            }).columns.adjust().draw();
            // $('#component_${id}_subtbl').parent().addClass('datatable-container');
            $(`#component_${id}_subtbl_wrapper`).css('width', '0')
            icon.removeClass('fa-caret-right').addClass('fa-caret-down');
            tr.addClass('shown');
        }
    });
    
}


$(document).on('change', '#bhs_tbl_components input[type="checkbox"]', function() {
    var rowId = $(this).closest('tr').data('id');
    if ($(this).is(':checked')) {
        console.log(components[rowId].nodes.map(node => nodes[node].minerva.id))
        console.log('Row with ID ' + rowId + ' is checked.');
    } else {
        console.log('Row with ID ' + rowId + ' is unchecked.');
    }
});

$(document).on('click', '#bhs_tbl_components .bhs_view_component', function() {
    var rowId = $(this).closest('tr').data('id');
    updateCytoscape(rowId) 
});

$(document).on('click', '#bhs_tbl_components .bhs_locate_component', function() {
    var rowId = $(this).closest('tr').data('id');
    var component = components[rowId]
    
    let x1 = Infinity, x2 = 0, y1 = Infinity, y2 = 0;

    for (let node of component.nodes)
    {
        let e = nodes[node].minerva
        let x = e.getX()
        let y = e.getY()
        let w = e.getWidth()
        let h = e.getHeight()

        if(x < x1)
            x1 = x
        if(y < y1)
            y1 = y
        if((x+w) > x2)
            x2 = x+w
        if((y+h) > y2)
            y2 = (y+h)
    }

    minervaProxy.project.map.fitBounds({
        modelId: component.model,
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2
    });
});

function get_hipahia_type(node)
{
    type = node.type.toLowerCase()
    hypothetical = node.hypothetical

    switch (type) {
        case "complex":
            if (hypothetical == true)
                return "group";
            else
                return "complex"
        case "simple molecule":
            return "compound"
        case "drug":
            return "compound"
        case "ion":
            return "compound"
        case "gene":
            return "gene"
        case "rna":
            return "gene"
        case "protein":
            return "gene"
        case "phenotype":
            return "function"
        default:
            return "other";
    }
}

function highlightElements(minerva_elements, hideprevious = true) {

    let highlightDefs = []
    minervaProxy.project.map.getHighlightedBioEntities().then(highlighted => {

        minervaProxy.project.map.hideBioEntity(hideprevious ? highlighted : []).then(r => {

            minerva_elements.forEach(e => {
                    highlightDefs.push({
                        element: {
                            id: e.id,
                            modelId: e.getModelId(),
                            type: "ALIAS"
                        },
                        type: "ICON"
                    });
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
            $btn.empty()
            $btn.html(text);
            resolve('');
        }, 0);
    });
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

// function highlightPath(edges, color = "#0000ff", hideprevious = true) {

//     minervaProxy.project.map.getHighlightedBioEntities().then(highlighted => {

//         minervaProxy.project.map.hideBioEntity(hideprevious ? highlighted : []).then(r => {

//             highlightDefs = []
//             let modeids = {};

//             for (let edge of edges) {
//                 for (let path of elements) {
//                     if (r.products.includes(path.target) && (r.reactants.includes(path.source) || r.modifiers.includes(path.source))) {
//                         highlightDefs.push({
//                             element: {
//                                 id: r.id,
//                                 modelId: r.modelId,
//                                 type: "REACTION"
//                             },
//                             type: "SURFACE",
//                             options: {
//                                 lineColor: color
//                             }
//                         })

//                         if (modeids.hasOwnProperty(r.modelId)) {
//                             modeids[r.modelId] += 1;
//                         }
//                         else {
//                             modeids[r.modelId] = 1;
//                         }
//                     }
//                 }

//             };

//             if (Object.keys(modeids).length > 0) {
//                 minervaProxy.project.map.openMap({ "id": parseFloat(Object.keys(modeids).reduce((a, b) => modeids[a] > modeids[b] ? a : b)) });
//             }
//             for(let mapping_name in [elements[0].source, elements[elements.length - 1].target])
//             {
//                 if(AIR.MapElements.hasOwnProperty(mapping_name))
//                 {
//                     e = AIR.MapElements[mapping_name]
//                     highlightDefs.push({
//                         element: {
//                             id: e.id,
//                             modelId: e.getModelId(),
//                             type: "ALIAS"
//                         },
//                         type: "ICON"
//                     });
//                 }

//             }

//             minervaProxy.project.map.showBioEntity(highlightDefs);
//         });
//     });
// }
