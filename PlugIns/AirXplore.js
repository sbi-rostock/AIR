
function AirXplore(){
    let t0 = performance.now();
    minervaProxy.project.map.addListener({
        dbOverlayName: "search",
        type: "onSearch",
        callback: xp_searchListener
    });    

    $(`<div id="xp_stat_spinner" class="mt-5">
        <div class="d-flex justify-content-center">
                    <div class="spinner-border" role="status">
                        <span class="sr-only"></span>
                    </div>
        </div>
        <div class="d-flex justify-content-center mt-2">
            <span id="xp_loading_text">LOADING...</span>
        </div>
    </div>`).appendTo($('#airxplore_tab_content'));
    setTimeout(() => {
        Initiate().then(r => {
            $('#xp_stat_spinner').hide();
            $('#xp_hide_container').show();
            var coll = document.getElementsByClassName("xp_collapsible")[0];
            coll.classList.toggle("active");
            var content = coll.nextElementSibling;
            content.style.maxHeight = content.scrollHeight + 1 + "px";    
            globals.regulationtable.columns.adjust();
        }).catch(e => {
            alert('Could not initialize Data');
            console.log(e);
        }).finally(r => {
            document.getElementById("xp_stat_spinner").remove();
            let t1 = performance.now();
            console.log("Call to AirXplore took " + (t1 - t0) + " milliseconds.")
        })
    }, 0);
}
function adjustPanels() {
    
    var coll = document.getElementsByClassName("xp_collapsible");
    for (var i = 0; i < coll.length; i++) {
        var content = coll[i].nextElementSibling;
        if (content.style.maxHeight){
            content.style.maxHeight = content.scrollHeight + 1 + "px";
        } 
    }
}
function Initiate() {
    return new Promise((resolve, reject) => {
        $(`
        <div id="xp_hide_container" style="display: none;">
        <button class="xp_collapsible mt-4">Interactions</button>
            <div id="xp_panel_interaction" class="xp_content">

            </div>
        <button class="xp_collapsible mt-2">Export Data</button>
            <div id="xp_panel_export" class="xp_content">

            </div>
        <button class="xp_collapsible mt-2">Regulator Prediction</button>
            <div id="xp_panel_targets" class="xp_content">

            </div>
        <button class="xp_collapsible mt-2 mb-4">Centrality</button>
            <div id="xp_panel_centrality" class="xp_content">

            </div>
        </div>`).appendTo('#airxplore_tab_content');

        $('.collapse').collapse();  

        var coll = document.getElementsByClassName("xp_collapsible");
        var i;

        for (i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.maxHeight){
            content.style.maxHeight = null;
            } else {
            content.style.maxHeight = content.scrollHeight + 1 + "px";
            } 
        });
        }

        globals.interactionpanel = $("#xp_panel_interaction");
        globals.targetpanel = $("#xp_panel_targets");
        globals.centralitypanel = $("#xp_panel_centrality");
        globals.exportpanel = $("#xp_panel_export");

        $('#xp_loading_text').html('Generating interaction panel ...')
        setTimeout(() => {
            getInteractionPanel().then(r => {
                $('#xp_loading_text').html('Generating export panel ...')
                setTimeout(() => {
                    getExportPanel().then(r => {
                        $('#xp_loading_text').html('Generating target panel ...')
                        setTimeout(() => {
                            getTargetPanel().then(s => {
                                $('#xp_loading_text').html('Generating centrality panel ...')
                                setTimeout(() => {
                                    getCentralityPanel().then(t => {
                                        resolve('');
                                    }).catch(error => {            
                                        reject(error);
                                    })
                                }, 0);
                            }).catch(error => {            
                                reject(error);;
                            });
                        },0);
                    }).catch(error => {            
                        reject(error);
                    })
                }, 0);
            }).catch(error => {            
                reject(error);
            })
        }, 0);
    });
}

function getExportPanel()
{
    return new Promise((resolve, reject) => {
        globals.exportpanel.append(`       
            <h4 class="mt-4">Full Data:<h4>
            <div class="btn-group mt-2 mb-2" role="group">
                <button id="xp_btn_download_datazip_csv" type="button" class="xp_btn_air btn mr-2"><i class="fa fa-download"></i> CSV</button>
                <button id="xp_btn_download_datazip_txt" type="button" class="xp_btn_air btn mr-2"><i class="fa fa-download"></i> TSV</button>
                <button id="xp_btn_download_datazip_json" type="button" class="xp_btn_air btn"><i class="fa fa-download"></i> JSON (raw data)</button>
            </div>
            <button id="xp_btn_download_gmt" class="xp_btn_air btn mb-4" style="width:100%"> <i class="fa fa-download"></i> Download phenotype gene sets as GMT</button>
            <h4>Phenotype specific subnetworks:<h4>
            <select id="xp_select_export_phenotype" class="browser-default xp_select custom-select mt-2"></select>
            <div class="btn-group mt-2" role="group">
                <button id="xp_btn_download_phenotypesubnetwork_csv" class="xp_btn_air btn mr-2" style="width:100%"> <i class="fa fa-download"></i> CSV</button>
                <button id="xp_btn_download_phenotypesubnetwork_tsv" class="xp_btn_air btn" style="width:100%"> <i class="fa fa-download"></i> TSV</button>
            </div>
            
            </select>
        `);
            
        var phenotypeSelect = document.getElementById('xp_select_export_phenotype');

        i = 0;
        AIR.centralityheader.forEach(p => {
            phenotypeSelect.options[phenotypeSelect.options.length] = new Option(p, i); 
            i++;
        });


        $('#xp_btn_download_gmt').on('click', function() {

            let downloadtext = '';
            for (let p in AIR.Phenotypes)
            {
                downloadtext += AIR.Molecules[p].name + "\t" ;
                if(AIR.Molecules[p].ids.hasOwnProperty("go"))
                {
                    downloadtext += AIR.Molecules[p].ids["go"];
                }
                
                let includedids = [];
                for(let e in AIR.Phenotypes[p].values)
                {
                    if(AIR.Phenotypes[p].values[e] == 0)
                    {
                        continue
                    }
                    else if (AIR.Molecules[e].subunits.length > 0) {
                        AIR.Molecules[e].subunits.forEach(function (s, index) {
                                if(AIR.Molecules[s].type == "PROTEIN" && includedids.includes(s) == false)
                                {
                                    downloadtext += "\t" + AIR.Molecules[s].name;
                                    includedids.push(s);
                                }
                          });
                    }
                    else if(AIR.Molecules[e].type == "PROTEIN" && includedids.includes(e) == false)
                    {
                        downloadtext += "\t" + AIR.Molecules[e].name;
                        includedids.push(e);
                    }
                }
                downloadtext += "\n";
            }
            if(downloadtext != "")
            {
                downloadtext = downloadtext.substring(0, downloadtext.length - 2);
            }
            om_download('AIR_PhenotypeGeneSets.gmt', downloadtext)
        });
        $('#xp_btn_download_datazip_json').on('click', function() {

            var zip = new JSZip();
            zip.file("Elements.json", JSON.stringify(AIR.Molecules));
            zip.file("Interactions.json", JSON.stringify(AIR.Interactions));
            zip.generateAsync({type:"blob"})
                .then(function(content) {
                    FileSaver.saveAs(content, "hello.zip");
                });
        });

        $('#xp_btn_download_datazip_csv').on('click', function() {

            var zip = new JSZip();
            zip.file("Elements.csv", getElementContent(AIR.Molecules, ","));
            zip.file("Interactions.csv", getInterContent(AIR.Interactions, ","));
            zip.generateAsync({type:"blob"})
                .then(function(content) {
                    FileSaver.saveAs(content, "AIR_Data.zip");
                });
        });
        $('#xp_btn_download_datazip_txt').on('click', function() {

            var zip = new JSZip();
            zip.file("Elements.tsv", getElementContent(AIR.Molecules, "\t"));
            zip.file("Interactions.tsv", getInterContent(AIR.Interactions, "\t"));
            zip.generateAsync({type:"blob"})
                .then(function(content) {
                    FileSaver.saveAs(content, "AIR_Data.zip");
                });
        });
 
        $('#xp_btn_download_phenotypesubnetwork_csv').on('click', function() {
            phenotypeSubnetwork(",", "csv");
        });
        $('#xp_btn_download_phenotypesubnetwork_tsv').on('click', function() {
            phenotypeSubnetwork("\t", "tsv");
        });

        function phenotypeSubnetwork(seperator, ending)
        {
            
            let phenotypename = phenotypeSelect.options[phenotypeSelect.selectedIndex].text;
            let phenotype = "";
            for(let p in AIR.Phenotypes)
            {
                if(AIR.Phenotypes[p].name == phenotypename)
                {
                    phenotype = p;
                    break;
                }
            }

            if (phenotype == "")
            {
                return;
            }

            let elementids = Object.keys(AIR.Phenotypes[phenotype].values)
            elementids.push(phenotype);
            let elements = {};
            let interactions = {};
            
            for(let i in AIR.Interactions)
            {
                if(elementids.includes(AIR.Interactions[i].source) && elementids.includes(AIR.Interactions[i].target))
                {
                    interactions[i] = AIR.Interactions[i];
                }
            }

            elementids.forEach(function (e, index) {
                elements[e] = AIR.Molecules[e];
            });

            var zip = new JSZip();
            zip.file("Elements." + ending, getElementContent(elements, seperator));
            zip.file("Interactions." + ending, getInterContent(interactions, seperator));
            zip.file("Info.txt", "Selected phenotype: " + phenotypename + "\nNumber of elements: " + Object.keys(elements).length + "\nNumber of interactions: " + Object.keys(interactions).length);
            zip.generateAsync({type:"blob"})
                .then(function(content) {
                    FileSaver.saveAs(content, "AIR_Subnetwork.zip");
                });
        }
        resolve('')
    });

}


function getInteractionPanel()
{
    return new Promise((resolve, reject) => {
        globals.interactionpanel.append(`
        <div class="panel panel-default card xp_panel mt-4">
            <div class="xp_panel_heading card-header">Selected Element</div>
                <input id="xp_elementinput" class="form-control mb-2" type="text" placeholder="Select or type in an element">           
                <div>
                    <dl id="xp_dl" class="air_dl">
                        <dt class="air_key">Type: </dt>
                        <dd class="air_value" id="xp_value_type"></dd>
                    </dl>
                </div>
            </div>
        </div>
        <div id="xp_molartimg_modal"></div>
        `);

        $("#xp_elementinput").on('input',function(e){

            getData();
        });

        globals.interactionpanel.append(/*html*/`

        <ul class="air_nav_tabs nav nav-tabs mt-4" id="xp_interaction_tab" role="tablist">
            <li class="air_nav_item nav-item" style="width: 25%;">
                <a class="air_tab air_tab_sub xp_inter_tabs active nav-link" id="xp_tab_inter_regulation" data-toggle="tab" href="#xp_tabcontent_inter_regulation" role="tab" aria-controls="xp_tabcontent_inter_regulation" aria-selected="true">Regulators</a>
            </li>
            <li class="air_nav_item nav-item" style="width: 25%;">
                <a class="air_tab air_tab_sub xp_inter_tabs nav-link" id="xp_tab_inter_target" data-toggle="tab" href="#xp_tabcontent_inter_target" role="tab" aria-controls="xp_tabcontent_inter_target" aria-selected="false">Targets</a>
            </li>
            <li class="air_nav_item nav-item" style="width: 25%;">
                <a class="air_tab air_tab_sub xp_inter_tabs nav-link" id="xp_tab_inter_phenotype" data-toggle="tab" href="#xp_tabcontent_inter_phenotype" role="tab" aria-controls="xp_tabcontent_inter_phenotype" aria-selected="false">Phenotypes</a>
            </li>
            <li class="air_nav_item nav-item" style="width: 25%;">
                <a class="air_tab air_tab_sub xp_inter_tabs nav-link" id="xp_tab_inter_sequence" data-toggle="tab" href="#xp_tabcontent_inter_sequence" role="tab" aria-controls="xp_tabcontent_inter_sequence" aria-selected="false">Sequence</a>
            </li>
        </ul>
        <div class="tab-content air_tab_content" id="xp_tab">
            <div class="tab-pane air_tab_pane show active" id="xp_tabcontent_inter_regulation" role="tabpanel" aria-labelledby="xp_tab_inter_regulation">
                <select id="xp_select_interaction_type" class="browser-default xp_select custom-select mb-4">
                    <option value="0" selected>All Elements</option>
                    <option value="1">miRNAs</option>
                    <option value="2">lncRNAs</option>
                    <option value="3">Transcription Factors</option>
                </select>
                <table style="width:100%" class="air_table table nowrap table-sm" id="xp_table_inter_regulation" cellspacing="0">
                    <thead>
                        <tr>
                            <th style="vertical-align: middle;">Regulator</th>
                            <th style="vertical-align: middle;">Regulation</th>
                            <th style="vertical-align: middle;">Type</th>
                            <th style="vertical-align: middle;">Reference</th>
                        </tr>
                    </thead>
                </table>
            </div>
            <div class="tab-pane air_tab_pane" id="xp_tabcontent_inter_target" role="tabpanel" aria-labelledby="xp_tab_inter_target">
                <table style="width:100%" class="air_table table nowrap table-sm" id="xp_table_inter_target" cellspacing="0">
                    <thead>
                        <tr>
                            <th style="vertical-align: middle;">Target</th>
                            <th style="vertical-align: middle;">Target Type</th>
                            <th style="vertical-align: middle;">Regulation</th>
                            <th style="vertical-align: middle;">Reference</th>
                        </tr>
                    </thead>
                </table>
            </div>
            <div class="tab-pane air_tab_pane" id="xp_tabcontent_inter_phenotype" role="tabpanel" aria-labelledby="xp_tab_inter_phenotype">
                <table style="width:100%" class="air_table table nowrap table-sm" id="xp_table_inter_phenotype" cellspacing="0">
                    <thead>
                        <tr>
                            <th style="vertical-align: middle;">Regulation</th>
                            <th style="vertical-align: middle;">Distance</th>
                            <th style="vertical-align: middle;">Phenotype</th>
                        </tr>
                    </thead>
                </table>
            </div>
            <div class="tab-pane air_tab_pane" id="xp_tabcontent_inter_sequence" role="tabpanel" aria-labelledby="xp_tab_inter_sequence">
                <div id="xp_molart">No information available.</div>
            </div>
        </div>

        `);

        globals.regulationtable = $('#xp_table_inter_regulation').DataTable({
            scrollX: true,
            autoWidth: true,
            columns: [
                { "width": "22%" },
                { "width": "22%" },
                { "width": "22%" },
                null,
                ],
            columnDefs: [
                {
                    targets: 0,
                    className: 'dt-right',
                },
                {
                    targets: 1,
                    className: 'dt-center'
                },
                {
                    targets: 2,
                    className: 'dt-center'
                }
            ]
        }).columns.adjust();;

        globals.targettable = $('#xp_table_inter_target').DataTable({
            scrollX: true,
            autoWidth: true,
            columns: [
                { "width": "22%" },
                { "width": "22%" },
                { "width": "22%" },
                null,
                ],
            columnDefs: [
                {
                    targets: 0,
                    className: 'dt-right',
                    'max-width': '20%',
                },
                {
                    targets: 1,
                    className: 'dt-center'
                },
                {
                    targets: 2,
                    className: 'dt-center'
                }
            ]
        }).columns.adjust();;

        globals.phenotypetable = $('#xp_table_inter_phenotype').DataTable({
            scrollX: true,
            autoWidth: true,
            columns: [
                { "width": "22%" },
                { "width": "22%" },
                null,
                ],
            "order": [[ 2, "asc" ]],                
            columnDefs: [
                {
                    targets: 0,
                    className: 'dt-center'
                },
                {
                    targets: 1,
                    className: 'dt-center'
                }
            ]
        }).columns.adjust();;

        $('.xp_inter_tabs[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            var target = $(e.target).attr("href") // activated tab
            switch(target) {
                case "#xp_tabcontent_inter_regulation":
                    globals.regulationtable.columns.adjust().draw(); 
                    break;
                case "#xp_tabcontent_inter_target":
                    globals.targettable.columns.adjust().draw();
                    break;
                case "#xp_tabcontent_inter_phenotype":
                    globals.phenotypetable.columns.adjust().draw(); 
                    break;
            }
            $($.fn.dataTable.tables(true)).DataTable().columns.adjust();
            adjustPanels();
        });


        $("#xp_select_interaction_type").change(function(){
            getData(onlyRegulators = true);
        });

        globals.regulationtable.columns.adjust().draw(); 
        globals.targettable.columns.adjust().draw();
        globals.phenotypetable.columns.adjust().draw(); 

        resolve('')
    });

}

function getTargetPanel() {
    return new Promise((resolve, reject) => {

        globals.targetpanel.append('<div class="mt-4"></div>');

        var tbl = undefined;

        if (document.getElementById('xp_table_target_phenotype')) {

            $('#xp_table_target_phenotype').DataTable().destroy();
            tbl = document.getElementById('xp_table_target_phenotype');

            tbl.parentElement.removeChild(tbl);

        }

        tbl = document.createElement("table")

        tbl.setAttribute('class', 'air_table table table-sm mt-4 mb-4');
        tbl.setAttribute('style', 'width:100%');
        tbl.setAttribute('id', 'xp_table_target_phenotype');
        tbl.setAttribute('cellspacing', '0');

        for (let p in AIR.Phenotypes) {
            var row = tbl.insertRow(tbl.rows.length);

            let pname = AIR.Phenotypes[p].name;

            createCell(row, 'td', getLinkIconHTML(pname), 'col', '', 'right');
            createCell(row, 'td', `<font data-order="1"><b>0<b></font>`, 'col slidervalue', '', 'center').setAttribute('id', 'PSliderValue' + p);
            var slider = createSliderCell(row, 'td', p);
            slider.setAttribute('id', 'PSlider' + p);
            slider.oninput = function () {
                let value = this.value;
                $("#PSliderValue" + p).each(function () {

                    var invalue = parseFloat(value);
                    var output = `<font data-order="1"><b>${invalue}<b></font>`;
                            if(invalue < 0)
                            {
                                output = `<font color="blue" data-order="2"><b>${invalue}<b></font>`;
                            }
                            if(invalue > 0)
                            {
                                output = `<font color="red" data-order="0"><b>${invalue}<b></font>`;
                            }

                    jQuery(this)[0].innerHTML = output;
                    AIR.Phenotypes[p].value = invalue;
                });
            }
            slider.onchange = function () {
                XP_PredictTargets();
            }
        }

        let header = tbl.createTHead();
        var headerrow = header.insertRow(0);

        createCell(headerrow, 'th', 'Phenotype', 'col', '', 'right');
        createCell(headerrow, 'th', 'logFC', 'col', '', 'center');
        createCell(headerrow, 'th', 'Select FC', 'col-2', '', 'center');

        globals.targetpanel.append(tbl);

        globals.targetphenotypetable = $('#xp_table_target_phenotype').DataTable({
            //"scrollX": true,
            //"autoWidth": true,
            "table-layout": "fixed", // ***********add this
            "word-wrap": "break-word", 
            "columns": [
                { "width": "40%" },
                { "width": "10%" },
                { "width": "50%" }
            ]
        } );

        globals.targetphenotypetable.on('click', 'a', function () {
            selectElementonMap(this.innerHTML, false);
        } );

        globals.targetpanel.append(
        /*html*/`
            <button type="button" class="btn-reset xp_btn_air btn btn-block mb-2 mt-4">Reset</button>
            
            <hr>

            <select id="xp_select_target_type" class="browser-default xp_select custom-select mb-2 mt-2">
                <option value="0" selected>All Elements</option>
                <option value="1">Proteins</option>
                <option value="2">miRNAs</option>
                <option value="3">lncRNAs</option>
                <option value="4">Transcription Factors</option>
            </select>

        `);
        $(".dropdown-toggle").dropdown();

        $('#xp_select_target_type').change(function() {
            XP_PredictTargets();
        });

        globals.targetpanel.find('.btn-reset').on('click', () => {

            globals.targetphenotypetable.rows().every( function () {
                var row = this.nodes().to$()
                row.find('.xp_slider').val(0);
                row.find('.slidervalue')[0].innerHTML = `<font data-order="1"><b>0<b></font>`;
            } );

            globals.targetphenotypetable.draw(false);

            for(let p in AIR.Phenotypes)
            {
                AIR.Phenotypes[p].value = 0;
            }      
            
            globals.xp_targetchart.data.datasets = [];
            globals.xp_targetchart.update();
        });

        globals.targetpanel.append('<canvas id="xp_chart_target"></canvas>');
        globals.targetpanel.append(/*html*/`
            <div class="d-flex justify-content-center mt-2">
                    <li class="legendli" style="color:#6d6d6d; font-size:90%;"><span class="legendspan" style="background-color:#00BFC4"></span>positive Regulator</li>
                    <li class="legendli" style="margin-left:20px; color:#6d6d6d; font-size:90%;"><span class="legendspan" style="background-color:#F9766E"></span>negative Regulator</li>
                    <li class="legendli" style="margin-left:16px; color:#6d6d6d; font-size:90%;"><span class="triangle"></span>External Link</li>
            </div>
            <button id="xp_btn_download_target" class="om_btn_download btn mt-4" style="width:100%"> <i class="fa fa-download"></i> Download results as .txt</button>`);

        $('#xp_btn_download_target').on('click', function() {
            om_download('PredictedPhenotypeRegulators.txt', globals.xp_target_downloadtext)
        });

        var outputCanvas = document.getElementById('xp_chart_target').getContext('2d');
        globals.xp_targetchart = new Chart(outputCanvas, {
            type: 'bubble',        
            data: {
                datasets: []
            },
            options: {
                hover: {
                    onHover: function(e) {
                    var point = this.getElementAtEvent(e);
                    if (point.length) e.target.style.cursor = 'pointer';
                    else e.target.style.cursor = 'default';
                    }
                },
                legend: {
                    display: false
                },
                layout: {
                    padding: {
                    top: 15
                    }
                },
                title: {
                    display: false,
                    text: 'Predicted Targets',
                    fontFamily: 'Helvetica',
                    fontColor: '#6E6EC8',
                    fontStyle: 'bold'
                },
                scales: {
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'Sensitivity'
                        },
                        ticks: {
                            beginAtZero: false,
                            //suggestedMax: 1
                        }
                    }],
                    xAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'Specificity'
                        },
                        ticks: {
                            beginAtZero: false,
                            //suggestedMax: 1
                        }
                    }]
                },
                tooltips: {
                    callbacks: {
                        label: function (tooltipItem, data) {
                            var label = data.datasets[tooltipItem.datasetIndex].label || '';

                            if (label) {
                                label += ': ';
                            }
                            label += tooltipItem.xLabel;
                            label += "; ";
                            label += tooltipItem.yLabel;
                            return label;
                        }
                    }
                }
            }
            
        });


        document.getElementById('xp_chart_target').onclick = function (evt) {

            // => activePoints is an array of points on the canvas that are at the same position as the click event.
            var activePoint = globals.xp_targetchart.lastActive[0]; //.getElementsAtEvent(evt)[0];

            if (activePoint !== undefined) {
                let name = globals.xp_targetchart.data.datasets[activePoint._datasetIndex].label;
                selectElementonMap(name, true);  
                xp_setSelectedElement(name);          
            }

            // Calling update now animates element from oldValue to newValue.
        };

        globals.targetpanel.append('<div class="mb-4"></div>');

        resolve('');
    });
}

function getCentralityPanel() {
    return new Promise((resolve, reject) => {

        globals.centralitypanel.append(`
        <div id="xp_select_centrality_phenotype_container" class="row mb-2 mt-2">
            <div class="col-auto">
                <div class="wrapper">
                    <button type="button" class="air_btn_info btn btn-secondary ml-1"
                            data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="File Specifications"
                            data-content="Select the Pehnotype for whose subnetwork the centrality will be calculated.">
                        ?
                    </button>
                </div>
            </div>
            <div class="col-auto mb-4 air_select_label" style="width: 17%">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Phenotype:</span>
            </div>
            <div class="col" style="padding-left: 10px;">
                <select id="xp_select_centrality_phenotype" class="browser-default xp_select custom-select">

                </select>
            </div>
        </div>`);


        let html =
        `<table style="width:100%" class="air_table table nowrap table-sm" id="xp_table_centrality" cellspacing="0">
            <thead>
                <tr>
                    <th style="vertical-align: middle;">Element</th>`;
                    centralities.forEach(headerText => {
                        let tooltip=""; 
                        if ( headerText == "Betweenness" )
                            tooltip =  "Betweenness was calculated using all paths from every element to the sleected phenotype.";
                        else if (headerText == "Closeness" )
                            tooltip = "Closeness was calculated for each phenotype-specific subnetwork individually.";
                        else if ( headerText == "Degree")
                            tooltip = "Degree was calculated for all the data available in the MIM.";
                        else if ( headerText == "Indegree" )
                            tooltip =  "Indegree was calculated for all the data available in the MIM.";
                        else if ( headerText == "Outdegree" )
                            tooltip =  "Outdegree was calculated for all dathe data availableta in the MIM.";

                            if(tooltip != "")
                                html += '<th style="vertical-align: middle;" data-toggle="tooltip" title="' + tooltip + '">' + headerText + '</th>';
                            else
                                html += '<th style="vertical-align: middle;">' + headerText + '</th>';
                    });
        html +=
    `           </tr>
            </thead>
        </table>

        <hr>`;

        let columns = [{
            targets: 0,
            className: 'dt-right'
        }];

        let i = 0;
        centralities.forEach(c => {
                columns.push({
                    targets: ++i,
                    className: 'dt-center'
                })
        });

        globals.centralitypanel.append(html);

        globals.centraliytable = $('#xp_table_centrality').DataTable({
            scrollX: true,
            autoWidth: true,
            columnDefs: columns,
            initComplete: function(settings){
                $('#xp_table_centrality thead th').each(function () {
                   $(this).tooltip();  
                });
    
                /* Apply the tooltips */
                        
            }  
        });

        $(".dropdown-toggle").dropdown();


        globals.centralitypanel.append(`
        <div class="panel panel-default card xp_panel mt-4 mb-2">
            <div class="xp_panel_heading card-header">X-Axis</div>
            <div class="row mt-2 mb-2">
                <div class="col-2 air_select_label">
                    <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Phenotype:</span>
                </div>
                <div class="col" style="width: 80%; padding-left: 8px">
                    <select id="xp_select_centrality_x_phenotype" class="browser-default xp_select custom-select">
                    </select>
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-2 air_select_label">
                    <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Centrality:</span>
                </div>
                <div class="col" style="width: 80%; padding-left: 8px">
                    <select id="xp_select_centrality_x_centrality" class="browser-default xp_select custom-select">
                    </select>
                </div>
            </div>      
        </div>
        <div class="panel panel-default card xp_panel mt-2 mb-2">
            <div class="xp_panel_heading card-header">Y-Axis</div>
            <div class="row mt-2 mb-2">
                <div class="col-2 air_select_label">
                    <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Phenotype:</span>
                </div>
                <div class="col" style="width: 80%; padding-left: 8px">
                    <select id="xp_select_centrality_y_phenotype" class="browser-default xp_select custom-select">
                    </select>
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-2 air_select_label">
                    <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Centrality:</span>
                </div>
                <div class="col" style="width: 80%; padding-left: 8px">
                    <select id="xp_select_centrality_y_centrality" class="browser-default xp_select custom-select">
                    </select>
                </div>
            </div>              
        </div>
        <select id="xp_select_centrality_type" class="browser-default xp_select custom-select mb-2">
            <option value="0" selected>All Elements</option>
            <option value="1">Proteins</option>
            <option value="2">miRNAs</option>
            <option value="3">lncRNAs</option>
            <option value="4">Transcription Factors</option>
        </select>
        <canvas id="xp_chart_centrality"></canvas>`);

        globals.centralitypanel.append(/*html*/`
            <div class="d-flex justify-content-center mt-2">
                    <li class="legendli" style="margin-left:18px; color:#6d6d6d; font-size:90%;"><span class="legendspan" style="background-color:#6d6d6d"></span>AIR Elements</li>
                    <li class="legendli" style="margin-left:16px; color:#6d6d6d; font-size:90%;"><span class="triangle"></span>External Link</li>
            </div>`);

        
        var phenotypeSelect = document.getElementById('xp_select_centrality_phenotype');
        var xcentralitySelect = document.getElementById('xp_select_centrality_x_centrality');
        var xphenotypeSelect = document.getElementById('xp_select_centrality_x_phenotype');
        var ycentralitySelect = document.getElementById('xp_select_centrality_y_centrality');
        var yphenotypeSelect = document.getElementById('xp_select_centrality_y_phenotype');


        i = 0;
        AIR.centralityheader.forEach(p => {

            phenotypeSelect.options[phenotypeSelect.options.length] = new Option(p, i); 
            xphenotypeSelect.options[xphenotypeSelect.options.length] = new Option(p, i); 
            yphenotypeSelect.options[yphenotypeSelect.options.length] = new Option(p, i); 
            i++;
        });

        i = 0;
        centralities.forEach(p => {

            xcentralitySelect.options[xcentralitySelect.options.length] = new Option(p, i); 
            ycentralitySelect.options[ycentralitySelect.options.length] = new Option(p, i); 
            i++;
        });
        
        createCentralityTable(phenotypeSelect.options[0].text);

        $('#xp_select_centrality_phenotype').on('change', function() {
            createCentralityTable(phenotypeSelect.options[phenotypeSelect.selectedIndex].text);
        });
        
        var outputCanvas = document.getElementById('xp_chart_centrality').getContext('2d');
        globals.centralitychart = new Chart(outputCanvas, {
            type: 'bubble',        
            data: {
                datasets: []
            },
            options: {
                hover: {
                    onHover: function(e) {
                    var point = this.getElementAtEvent(e);
                    if (point.length) e.target.style.cursor = 'pointer';
                    else e.target.style.cursor = 'default';
                    }
                },
                legend: {
                    display: false
                },
                layout: {
                    padding: {
                    top: 15
                    }
                },
                title: {
                    display: false,
                    text: 'Predicted Targets',
                    fontFamily: 'Helvetica',
                    fontColor: '#6E6EC8',
                    fontStyle: 'bold'
                },
                scales: {
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'Y-Axis'
                        },
                        ticks: {
                            beginAtZero: true,
                            min: 0,
                            //suggestedMax: 1
                        }
                    }],
                    xAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'X-Axis'
                        },
                        ticks: {
                            beginAtZero: true,
                            min: 0,
                            //suggestedMax: 1
                        }
                    }]
                },
                tooltips: {
                    callbacks: {
                        label: function (tooltipItem, data) {
                            var label = data.datasets[tooltipItem.datasetIndex].label || '';

                            if (label) {
                                label += ': ';
                            }
                            label += tooltipItem.xLabel;
                            label += "; ";
                            label += tooltipItem.yLabel;
                            return label;
                        }
                    }
                }
            }
            
        });

        document.getElementById('xp_chart_centrality').onclick = function (evt) {

            // => activePoints is an array of points on the canvas that are at the same position as the click event.
            var activePoint = globals.centralitychart.lastActive[0]; //.getElementsAtEvent(evt)[0];

            if (activePoint !== undefined) {

                let name = globals.centralitychart.data.datasets[activePoint._datasetIndex].label;
                selectElementonMap(name, true);  
                xp_setSelectedElement(name);               
            }

            // Calling update now animates element from oldValue to newValue.
        };

        globals.centralitypanel.append('<div class="mb-4"></div>');

        

        $('#xp_select_centrality_x_centrality').on('change', function() {
            createCentralityGraph();
        });
        $('#xp_select_centrality_x_phenotype').on('change', function() {
            createCentralityGraph();
        });
        $('#xp_select_centrality_y_centrality').on('change', function() {
            createCentralityGraph();
        });
        $('#xp_select_centrality_y_phenotype').on('change', function() {
            createCentralityGraph();
        });
        $('#xp_select_centrality_type').on('change', function() {
            createCentralityGraph();
        });

        createCentralityGraph();


        function createCentralityGraph() {
            let t0 = performance.now();
            let xphenotype = xphenotypeSelect.options[xphenotypeSelect.selectedIndex].text;
            let yphenotype = yphenotypeSelect.options[yphenotypeSelect.selectedIndex].text;

            let ycentrality = ycentralitySelect.options[ycentralitySelect.selectedIndex].text;
            let xcentrality = xcentralitySelect.options[xcentralitySelect.selectedIndex].text;

            let targets = [];

            globals.centralitychart.options.scales.xAxes[0].scaleLabel.labelString = "'" + xphenotype + "' " + xcentrality;
            globals.centralitychart.options.scales.yAxes[0].scaleLabel.labelString = "'" + yphenotype + "' " + ycentrality;

            for(let e in AIR.Molecules)
            {
                let {name:_name, type:_type} = AIR.Molecules[e];

                if (_type.toLowerCase() === "phenotype") {
                    continue;
                }
        
                let typevalue = $('#xp_select_centrality_type').val();
                if (typevalue == 1) {
                    if (_type != "PROTEIN" && _type != "TF") {
                        continue;
                    }
                }
                if (typevalue == 2) {
                    if (_type != "miRNA") {
                        continue;
                    }
                }
                if (typevalue == 3) {
                    if (_type != "lncRNA") {
                        continue;
                    }
                }
                if (typevalue == 4) {
                    if (_type != "TF") {
                        continue;
                    }
                }

                let x = 0;
                let y = 0;

                if(AIR.Centrality.hasOwnProperty(xcentrality) && AIR.Centrality[xcentrality].hasOwnProperty(e) && AIR.Centrality[xcentrality][e].hasOwnProperty(xphenotype))
                {
                    x = AIR.Centrality[xcentrality][e][xphenotype];
                }
                if(AIR.Centrality.hasOwnProperty(ycentrality) && AIR.Centrality[ycentrality].hasOwnProperty(e) && AIR.Centrality[ycentrality][e].hasOwnProperty(yphenotype))
                {
                    y = AIR.Centrality[ycentrality][e][yphenotype];
                }


                if(y != 0 || x != 0)
                {
                    
                    var pstyle = 'circle';
                    if(AIR.MIMSpeciesLowerCase.includes(_name.toLowerCase()) === false)
                    {
                        pstyle = 'triangle'
                    }

                    targets.push({
                        label: _name,
                        data: [{
                            x: x,
                            y: y,
                            r: 4
                        }],
                        backgroundColor: "#6E6EC8",
                        hoverBackgroundColor: "#6E6EC8",
                        pointStyle: pstyle,
                    });
                }
            }

            globals.centralitychart.data.datasets = targets;
            globals.centralitychart.update();
            let t1 = performance.now();
            console.log("Centrality Graph took " + (t1 - t0) + " milliseconds.")
        }

        resolve('');
    });
}

function xp_searchListener(entites) {
    globals.selected = entites[0];
    if (globals.selected.length > 0) { 
        if(globals.selected[0].constructor.name === 'Alias')
        {
            xp_setSelectedElement(globals.selected[0].name);
        }
    }
}

function xp_setSelectedElement(name)
{
    $("#xp_elementinput").val(name);
    getData(false);
}

async function getUniprotID(element, pdb = false) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: 'https://www.uniprot.org/uniprot/?query=' + element.toLowerCase() + '+AND+organism%3A"Homo+sapiens+%28Human%29+%5B9606%5D"&sort=score&format=tab&columns=id,reviewed,genes,database(PDB)',
            success: function (content) {
                content.toString().split('\n').forEach(line => {
                    entry = line.split('\t');
                    if(entry[1] == "reviewed" && (entry[2].toLowerCase() == element.toLowerCase() || entry[2].substr(0,entry[2].indexOf(' ')).toLowerCase() == element.toLowerCase()))
                    {
                        if(pdb)
                        {
                            if(entry[3].includes(';'))
                            {
                                resolve(entry[3].substr(0,entry[3].indexOf(';')).toLowerCase());
                            }
                            else
                            {
                                resolve(entry[3]);
                            }
                            
                        }
                        else
                            resolve(entry[0]);
                    }
                });
                resolve('');
            },
            error: function (content) {
                resolve('');
            }
        });
    });
}

async function getPubChemID(element, chebiid) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/substance/name/' + element.replace('/', '.') + '/JSON',
            success: function (content) {
                var response = content;

                if(response.hasOwnProperty("PC_Substances"))
                {
                    for(let c in response.PC_Substances)
                    {
                        if(chebiid != "" && checkNested(response.PC_Substances[c], "source", "db" ))
                        {
                            if(response.PC_Substances[c].source.db.hasOwnProperty("name") && response.PC_Substances[c].source.db.name == "ChEBI")
                            {
                                if(chebiid != "" && checkNested(response.PC_Substances[c].source.db, "source_id", "str"))
                                {
                                    if(chebiid == response.PC_Substances[c].source.db.source_id.str)
                                    {
                                        resolve(getCID(c));
                                    }
                                }
                            }

                        }
                        else if(chebiid == "")
                        {
                            resolve(getCID(c));
                        }
                    }
                }

                async function getCID(c) {
                    if(response.PC_Substances[c].hasOwnProperty("compound"))
                    {
                        for(let i in response.PC_Substances[c].compound)
                        {
                            if(checkNested(response.PC_Substances[c].compound[i], "id", "id", "cid"))
                            {
                                let id = response.PC_Substances[c].compound[i].id.id.cid;

                                return await requestPubChem(id)
                            }
                        }
                    }
                    return '';
                }

                async function requestPubChem(id)
                {
                    return new Promise((resolve) => {
                        $.ajax({
                            url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/" + id + "/SDF?record_type=3d", 
                            error: function(XMLHttpRequest, textStatus, errorThrown){
                                resolve('');
                            },
                            success: function(data){
                                resolve(id);
                            }
                        });
                    })

                }

                resolve('');
            },
            error: function (content) {
                resolve('');
            }
        });
    });
}

async function getData(onlyRegulators = false) {

    let elementname = $("#xp_elementinput").val().toLowerCase();

    if(elementname.trim() == "")
    {
        $('#xp_dl').hide();
        $('#xp_value_type').html("");
        $("#xp_molart").replaceWith('<div id="xp_molart" class="xp_molartContainer">No information available.</div>');
        $("#xp_molartimg_modal").replaceWith('<div id="xp_molartimg_modal"></div>');
        globals.regulationtable.clear();
        globals.targettable.clear();
        globals.phenotypetable.clear();
    }
    else
    {
        let elementid = null;

        for(let element in AIR.Molecules)
        {
            if(AIR.Molecules[element].name.toLowerCase() === elementname)
            {
                elementid = element;
                break;
            }
        }
        let elementtype = getElementType(elementname)
        if(elementtype)
        {
            switch(elementtype)
            {
                case "TF":
                    elementtype = "Transcription Factor";
                    break;
                case "miRNA":
                case "lncRNA":
                    break;
                default:
                    elementtype = elementtype.toLowerCase().replace(/[^a-zA-Z ]/g, " ")
                    .split(' ')
                    .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
                    .join(' ');
                    break;
            }
            $('#xp_dl').show();
            $('#xp_value_type').html(elementtype);
        }
        else
        {
            $('#xp_dl').hide();
            $('#xp_value_type').html("");
        }

        $("#xp_molart").replaceWith('<div id="xp_molart" class="xp_molartContainer">No information available.</div>');
        $("#xp_molartimg_modal").replaceWith('<div id="xp_molartimg_modal"></div>');
        
        let resizeObserver = new ResizeObserver(() => { 
            adjustPanels();
        });           
        resizeObserver.observe($("#xp_molart")[0]); 
        resizeObserver.observe($("#xp_molartimg_modal")[0]); 

        if(elementid == null)
        {

            globals.regulationtable.clear();
            globals.targettable.clear();
            globals.phenotypetable.clear();
        }
        else
        {
            globals.regulationtable.clear();

            if(onlyRegulators === false)
            {
                globals.phenotypetable.clear();                    
                globals.targettable.clear();
                
                for(let p in AIR.Phenotypes)
                {       
                    if(AIR.Phenotypes[p].SPs.hasOwnProperty(elementid) == false)
                    {
                        continue;        
                    }
                    var result_row =  [];
                    var pname = AIR.Molecules[p].name;
    
                    var SP = AIR.Phenotypes[p].SPs[elementid];
    
                    if(SP === 0)
                    {
                        continue;
                    }
    
                    var type = "";
                    if(SP < 0)
                    {
                        type = '<font color="red">inhibition</font>';
                    }
                    if(SP > 0)
                    {
                        type = '<font color="green">activation</font>';
                    }    
    
                    result_row.push(type);               
    
                    result_row.push(Math.abs(SP));

                    result_row.push(getLinkIconHTML(pname));
                    globals.phenotypetable.row.add(result_row)            
                }
    
            }

            for(let inter in AIR.Interactions)
            {
                let {source:_source, target:_target, type:_type, pubmed:_pubmed} = AIR.Interactions[inter];

                if(AIR.Molecules.hasOwnProperty(_source) == false || AIR.Molecules.hasOwnProperty(_target) == false)
                {
                    continue;
                }
                if(_target == elementid)
                {
                    let {type: _sourcetype, name:_sourcename, ids:_sourceids} = AIR.Molecules[_source];
                    let typevalue = $("#xp_select_interaction_type").val();
                    switch(typevalue){
                        case "1":
                            if (_sourcetype != "miRNA") {
                                continue;
                            }
                            break;
                        case "2":
                            if (_sourcetype != "lncRNA") {
                                continue;
                            }
                            break;
                        case "3":
                            if (_sourcetype != "TF") {
                                continue;
                            }
                            break;
                    }

                    globals.downloadtext = "";

                    var result_row =  [];

                    result_row.push(getLinkIconHTML(_sourcename));

                    var typehtml = '<font color="green">activation</font>';
                    if(_type == -1)
                    {
                        typehtml = '<font color="red">inhibition</font>';
                    }
                    else if(_type == 0)
                    {
                        typehtml = "unknown";
                    }
                    

                    result_row.push(typehtml);
                    
                    result_row.push(_sourcetype);

                    var pubmedstring = "";
                    _pubmed.forEach(p =>
                    {
                        p = p.trim();
                        var ptext = p.replace('pubmed:','');

                        if(isNaN(ptext))
                        {
                            return;
                        }

                        if(p.includes(":") === false)
                        {
                            p = "pubmed:" + p;
                        }
                        var ptext = p.replace('pubmed:','');
                        pubmedstring += `<a target="_blank" href="https://identifiers.org/${p}">${ptext}</a>, `;
                    });

                    result_row.push(pubmedstring.substr(0, pubmedstring.length-2));
                    globals.regulationtable.row.add(result_row)
                }

                if(_source == elementid && onlyRegulators === false)
                {

                    let {type: _targettype, name:_targetname, ids:_targetids} = AIR.Molecules[_target];

                    var result_row =  [];

                    result_row.push(getLinkIconHTML(_targetname));

                    var typehtml = '<font color="green">activation</font>';
                    if(_type == -1)
                    {
                        typehtml = '<font color="red">inhibition</font>';
                    }
                    else if(_type == 0)
                    {
                        typehtml = "unknown";
                    }                                 
                    
                    result_row.push(_targettype);

                    result_row.push(typehtml);

                    var pubmedstring = "";
                    _pubmed.forEach(p =>
                        {
                            p = p.trim();
                            var ptext = p.replace('pubmed:','');

                            if(isNaN(ptext))
                            {
                                return;
                            }
                            if(p.includes(":") === false)
                            {
                                p = "pubmed:" + p;
                            }

                            pubmedstring += `<a target="_blank" href="https://identifiers.org/${p}">${ptext}</a>, `;
                        });

                    result_row.push(pubmedstring.substr(0, pubmedstring.length-2));
                    globals.targettable.row.add(result_row)
                }


            }
        }

            
        if(onlyRegulators === false)
        {
            setTimeout(async function() {

                if(elementid == null || isProtein(elementid))
                {

                    let uniportID = await getUniprotID(elementname);

                    if(uniportID != "")
                    {
                        try {
                            
                            var ProtVista = require('ProtVista');
                            var instance = new ProtVista({
                                el: document.getElementById('xp_molart'),
                                uniprotacc: uniportID   
                            });
                            /*
                            let molart = new MolArt({
                                uniprotId: uniportID,
                                containerId: 'xp_molart'
                            });
                            */
                        }
                        catch(err)
                        {
                            console.log(err.message);
                        }

                    }
                }
    
            }, 0);

            setTimeout(async function() {
                
                let idstring = '';
                if(elementid != null)
                {
                    if(isProtein(elementid))
                    {
                        let id = await getUniprotID(elementname, true);
                        if(id != '')
                            idstring = "pdb='" + id + "'";
                    }
                    else if(AIR.Molecules[elementid].ids.hasOwnProperty("chebi"))
                    {
                        let id = await getPubChemID(elementname, AIR.Molecules[elementid].ids.chebi)
                        if(id != '')
                            idstring = "cid='" + id + "'";
                    }
                }

                if(idstring != "")
                {
                    $('#xp_value_type').html(elementtype + ' (<a href="#" id="xp_img_link">view structure</a>)');
                    
                    document.getElementById("xp_img_link").onclick = async function(){

                        var $temp = $; 
                        var jQuerytemp = jQuery;
                        var tag = document.createElement('script');
                        tag.src = "https://3Dmol.csb.pitt.edu/build/3Dmol-min.js";
                        tag.setAttribute('asnyc','');
                        
                        document.getElementsByTagName('head')[0].appendChild(tag);

                        $("#xp_molartimg_modal").replaceWith(`                        
                            <div id="xp_molartimg_modal" class="air_modal">
                                <span id="xp_img_close" class="air_close_white">&times;</span>
                                <div style="height: 500px; width: 500px; position: relative;" id="xp_molartimg_full" class='mol_modal_content viewer_3Dmoljs' data-${idstring} data-backgroundcolor='0xffffff' data-style='stick'></div>
                                <div id="xp_molartimg_caption" class="air_img_caption"></div>
                            </div>`);
            
                        // Get the modal
                        var modal = document.getElementById("xp_molartimg_modal");
                
                        // Get the image and insert it inside the modal - use its "alt" text as a caption
                        var img = document.getElementById("xp_molartimg");
                        var modalImg = document.getElementById("xp_molartimg_full");
                        var captionText = document.getElementById("xp_molartimg_caption");

                        modal.style.display = "block";
                        captionText.innerHTML = AIR.Molecules[elementid].name;

                                    // Get the <span> element that closes the modal
                        var span = document.getElementById("xp_img_close");
                
                        // When the user clicks on <span> (x), close the modal
                        span.onclick = function() {
                            modal.style.display = "none";
                            $(document).find('script[src="https://3Dmol.csb.pitt.edu/build/3Dmol-min.js"]').remove();
                            $ = $temp; jQuery = jQuerytemp;
                        }
                        //});
                        
                    }
                }
            }, 0);
        }
    }
    // Add new data
    globals.regulationtable.columns.adjust().draw(); 
    globals.targettable.columns.adjust().draw();
    globals.phenotypetable.columns.adjust().draw(); 

    adjustPanels();

}

$(document).on('click', '.air_elementlink', function () {
    selectElementonMap($(this).html(), false);
});


function isProtein(elementid)
{
    if(elementid == null)
    {
        return false;
    }
    else if(AIR.Molecules[elementid].type == "PROTEIN" || AIR.Molecules[elementid].type == "TF" || AIR.Molecules[elementid].type == "miRNA" || AIR.Molecules[elementid].type == "lncRNA")
    {
        return true
    }
    else {
        return false;
    }
}

function XP_PredictTargets() {
    var targets = [];
    let promises = [];

    let filter = $('#xp_select_target_type option:selected').text();
    globals.xp_target_downloadtext = `Filter: ${filter}\n\nSelected phenotype values:`;
    
    for (let p in AIR.Phenotypes) {

        globals.xp_target_downloadtext += `\n${AIR.Phenotypes[p].name}\t${AIR.Phenotypes[p].value}`;
    }
    globals.xp_target_downloadtext += '\n\nElement\tSpecificity\tSensitivit';

    for (let e in AIR.Molecules) {
 
        let {name:_name, type:_type} = AIR.Molecules[e];

        if (_type.toLowerCase() === "phenotype") {
            continue;
        }

        let typevalue = $('#xp_select_target_type').val();
        if (typevalue == 1) {
            if (_type != "PROTEIN" && _type != "TF") {
                continue;
            }
        }
        if (typevalue == 2) {
            if (_type != "miRNA") {
                continue;
            }
        }
        if (typevalue == 3) {
            if (_type != "lncRNA") {
                continue;
            }
        }
        if (typevalue == 4) {
            if (_type != "TF") {
                continue;
            }
        }
        let positiveSum = 0;
        let positiveinhibitorySum = 0;
        let positiveCount = 0;

        let negativeSum = 0;
        let negativeCount = 0;

        for (let p in AIR.Phenotypes) {

            let value = AIR.Phenotypes[p].value;

            let SP = 0;
            if(AIR.Phenotypes[p].values.hasOwnProperty(e) == true)
            {
                SP = AIR.Phenotypes[p].SPs[e];
            }

            if (value != 0) {

                if (SP != 0) {
                    positiveSum += value / SP;
                    positiveinhibitorySum -= value / SP;
                }

                positiveCount += Math.abs(value);              
            }
            else {
                if(SP != 0)
                {
                    negativeSum += (1 - (1 / Math.abs(SP)));
                }
                else 
                {
                    negativeSum ++;
                }

                negativeCount ++; 
            }

        }


        let positiveSensitivity = 0;
        let negativeSensitivity = 0;
        if (positiveCount > 0) {
            positiveSensitivity = Math.round(((positiveSum / positiveCount) + Number.EPSILON) * 100) / 100;
            negativeSensitivity = Math.round(((positiveinhibitorySum / positiveCount) + Number.EPSILON) * 100) / 100;
        }

        if (positiveSensitivity <= 0 && negativeSensitivity <= 0)
            continue;

        let sensitivity = positiveSensitivity;
        let specificity = 0

        if (negativeCount > 0) {
            specificity = Math.round(((negativeSum / negativeCount) + Number.EPSILON) * 100) / 100;
        }

        //var hex = pickHex([255, 140, 140], [110, 110, 200], (positiveresult + negativeresult) / 2);
        var hex = '#00BFC4';
        if(negativeSensitivity > positiveSensitivity)
        {
            hex = '#F9766E';
            sensitivity = negativeSensitivity;
        }
        var radius = ((sensitivity + specificity) / 2) * 8   ;

        
        var pstyle = 'circle';
        if(AIR.MIMSpeciesLowerCase.includes(_name.toLowerCase()) === false)
        {
            pstyle = 'triangle'
        }

        if(radius < 3)
        {
            radius = 4;
        }
        targets.push({
            label: _name,
            data: [{
                x: specificity,
                y: sensitivity,
                r: radius
            }],
            backgroundColor: hex,
            hoverBackgroundColor: hex,
            pointStyle: pstyle,
        });  
        globals.xp_target_downloadtext += `\n${_name}\t${specificity}\t${sensitivity}`;          
    }
    
    Promise.all(promises).finally(r => {
        globals.xp_targetchart.data.datasets = targets;
        globals.xp_targetchart.update();
    });

}


function createCentralityTable(phenotype) {
    let t0 = performance.now();
    globals.centraliytable.clear();

    for(let e in AIR.Molecules)
    {
        let result_row = [];

        //result_row.push(AIR.Molecules[e].name);
        let hasvalue = false;
        for(let c in AIR.Centrality) {

            if(AIR.Centrality[c].hasOwnProperty(e) && AIR.Centrality[c][e].hasOwnProperty(phenotype))
            {
                let value = AIR.Centrality[c][e][phenotype];

                if(value != 0)
                {
                    hasvalue = true;
                }
                result_row.push(value);
            }
            else
            {
                result_row.push(0);
            }

        }
        if(hasvalue)
        {                
           result_row.unshift(getLinkIconHTML(AIR.Molecules[e].name));
           globals.centraliytable.row.add(result_row); 
        }
        
    }

    globals.centraliytable.columns.adjust().draw(); 

    let t1 = performance.now();
    console.log("Centrality Table took " + (t1 - t0) + " milliseconds.")
}
