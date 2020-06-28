
function AirXplore(){
    minervaProxy.project.map.addListener({
        dbOverlayName: "search",
        type: "onSearch",
        callback: xp_searchListener
    });    

    globals.container = $('#airxplore_tab_content');    

    Initiate().then(r => {
        var coll = document.getElementsByClassName("xp_collapsible")[0];
        coll.classList.toggle("active");
        var content = coll.nextElementSibling;
        content.style.maxHeight = content.scrollHeight + "px";    
    }).catch(e => {
        alert('Could not initialize Data');
        console.log(e);
    })
}
function adjustPanels() {
    
    var coll = document.getElementsByClassName("xp_collapsible");
    for (var i = 0; i < coll.length; i++) {
        var content = coll[i].nextElementSibling;
        if (content.style.maxHeight){
            content.style.maxHeight = content.scrollHeight + "px";
        } 
    }
}
function Initiate() {
    return new Promise((resolve, reject) => {
        $(`
        <button class="xp_collapsible mt-2">Interactions</button>
            <div id="xp_panel_interaction" class="xp_content">

            </div>
        <button class="xp_collapsible mt-2">Target Prediction</button>
            <div id="xp_panel_targets" class="xp_content">

            </div>
        <button class="xp_collapsible mt-2 mb-4">Centrality</button>
            <div id="xp_panel_centrality" class="xp_content">

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
            content.style.maxHeight = content.scrollHeight + "px";
            } 
        });
        }

        globals.interactionpanel = $("#xp_panel_interaction");
        globals.targetpanel = $("#xp_panel_targets");
        globals.centralitypanel = $("#xp_panel_centrality");

        
        getInteractionPanel().then(r => {
            getTargetPanel().then(s => {
                getCentralityPanel().then(r => {
                    resolve('');
                });
            });
        });   


    }).catch(error => {            
        reject(error);
    });
}

function getInteractionPanel()
{
    return new Promise((resolve, reject) => {
        globals.interactionpanel.append(`
        <div class="panel panel-default card xp_panel mt-4 mb-4">
            <div class="xp_panel_heading card-header">Selected Element</div>
                <input class="xp_elementinput form-control mb-2" type="text" placeholder="Select or type-in an element">           
                <div>
                    <dl id="xp_dl" class="air_dl">
                        <dt class="air_key">Type: </dt>
                        <dd class="air_value" id="xp__value_type"></dd>
                    </dl>
                </div>
            </div>
        </div>
        `);

        $(".xp_elementinput").on('input',function(e){

            getData().catch(error => {
                alert(error);
            });
        });

        globals.interactionpanel.append(/*html*/`

        <ul class="nav nav-tabs mb-4" id="myTab" role="tablist">
            <li class="nav-item">
                <a class="nav-link active xp_tab" id="xp_tab_inter_regulation" data-toggle="tab" href="#xp_tabcontent_inter_regulation" role="tab" aria-controls="xp_tabcontent_inter_regulation" aria-selected="true">Regulators</a>
            </li>
            <li class="nav-item">
                <a class="nav-link xp_tab" id="xp_tab_inter_target" data-toggle="tab" href="#xp_tabcontent_inter_target" role="tab" aria-controls="xp_tabcontent_inter_target" aria-selected="false">Targets</a>
            </li>
            <li class="nav-item">
                <a class="nav-link xp_tab" id="xp_tab_inter_phenotype" data-toggle="tab" href="#xp_tabcontent_inter_phenotype" role="tab" aria-controls="xp_tabcontent_inter_phenotype" aria-selected="false">Phenotypes</a>
            </li>
        </ul>
        <div class="tab-content" id="xp_tab">
            <div class="tab-pane show active mb-2" id="xp_tabcontent_inter_regulation" role="tabpanel" aria-labelledby="xp_tab_inter_regulation">
                <select id="xp_select_interaction_type" class="browser-default xp_select custom-select mb-4 mt-2">
                    <option value="0" selected>All Elements</option>
                    <option value="1">miRNAs</option>
                    <option value="2">lncRNAs</option>
                    <option value="3">Transcription Factors</option>
                </select>
                <table style="width:100%" class="table nowrap table-sm" id="xp_table_inter_regulation" cellspacing="0">
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
            <div class="tab-pane mb-2" id="xp_tabcontent_inter_target" role="tabpanel" aria-labelledby="xp_tab_inter_target">
                <table style="width:100%" class="table nowrap table-sm" id="xp_table_inter_target" cellspacing="0">
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
            <div class="tab-pane mb-2" id="xp_tabcontent_inter_phenotype" role="tabpanel" aria-labelledby="xp_tab_inter_phenotype" >
                <table style="width:100%" class="table nowrap table-sm" id="xp_table_inter_phenotype" cellspacing="0">
                    <thead>
                        <tr>
                            <th style="vertical-align: middle;">Regulation</th>
                            <th style="vertical-align: middle;">Distance</th>
                            <th style="vertical-align: middle;">Phenotype</th>
                        </tr>
                    </thead>
                </table>
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
                    className: 'dt-right'
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
        });

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
                    className: 'dt-right'
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
        });

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
        });

        $('#xp_table_inter_target_wrapper').addClass( "mt-4");
        $('#xp_table_inter_phenotype_wrapper').addClass( "mt-4");

        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
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
            getData(onlyRegulators = true).catch(error => {
                alert(error);
            });
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

        tbl.setAttribute('class', 'table table-sm mt-4 mb-4');
        tbl.setAttribute('style', 'width:100%');
        tbl.setAttribute('id', 'xp_table_target_phenotype');
        tbl.setAttribute('cellspacing', '0');

        for (let p in AIR.Phenotypes) {
            var row = tbl.insertRow(tbl.rows.length);

            let pname = AIR.Phenotypes[p].name;

            createLinkCell(row, 'td', pname, 'col', 'right');
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
                    <li class="legendli" style="color:#6d6d6d; font-size:90%;"><span class="legendspan" style="background-color:#00BFC4"></span>positive Target</li>
                    <li class="legendli" style="margin-left:20px; color:#6d6d6d; font-size:90%;"><span class="legendspan" style="background-color:#F9766E"></span>negative Target</li>
                    <li class="legendli" style="margin-left:16px; color:#6d6d6d; font-size:90%;"><span class="triangle"></span>External Link</li>
            </div>`);

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
                setSelectedElement(name);          
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
                    <button type="button" class="xp_btn_info btn btn-secondary ml-1"
                            data-html="true" data-toggle="popover" data-placement="top" title="File Specifications"
                            data-content="Select the Pehnotype for whose subnetwork the centrality will be calculated.">
                        ?
                    </button>
                </div>
            </div>
            <div class="col-auto mb-4">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Phenotype:</span>
            </div>
            <div class="col">
                <select id="xp_select_centrality_phenotype" class="browser-default xp_select custom-select">

                </select>
            </div>
        </div>`);


        let html =
        `<table style="width:100%" class="table nowrap table-sm" id="xp_table_centrality" cellspacing="0">
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
                <div class="col-2">
                    <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Phenotype:</span>
                </div>
                <div class="col" style="width: 80%;">
                    <select id="xp_select_centrality_x_phenotype" class="browser-default xp_select custom-select">
                    </select>
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-2">
                    <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Centrality:</span>
                </div>
                <div class="col">
                    <select id="xp_select_centrality_x_centrality" class="browser-default xp_select custom-select">
                    </select>
                </div>
            </div>      
        </div>
        <div class="panel panel-default card xp_panel mt-2 mb-2">
            <div class="xp_panel_heading card-header">Y-Axis</div>
            <div class="row mt-2 mb-2">
                <div class="col-2">
                    <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Phenotype:</span>
                </div>
                <div class="col">
                    <select id="xp_select_centrality_y_phenotype" class="browser-default xp_select custom-select">
                    </select>
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-2">
                    <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Centrality:</span>
                </div>
                <div class="col">
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
                setSelectedElement(name);               
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
        }

        resolve('');
    });
}

function xp_searchListener(entites) {
    globals.selected = entites[0];
    if (globals.selected.length > 0) { 
        if(globals.selected[0].constructor.name === 'Alias')
        {
            setSelectedElement(globals.selected[0].getName());
        }
    }
}

function setSelectedElement(name)
{
    $(".xp_elementinput").val(name).trigger('input');;
}

function getData(onlyRegulators = false) {

    return new Promise((resolve, reject) => {

        let elementname = $(".xp_elementinput").val().toLowerCase();
        let elementid = null;

        let elementtype = getElementType(elementname)
        if(elementtype)
        {
            $('#xp_dl').show();
            $('#xp__value_type').html(elementtype.replace(/[^a-zA-Z ]/g, " ").toLowerCase());
        }
        else
        {
            $('#xp_dl').hide();
            $('#xp__value_type').html("");
        }
        for(let element in AIR.Molecules)
        {
            if(AIR.Molecules[element].name.toLowerCase() === elementname)
            {
                elementid = element;
                break;
            }
        }
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
                globals.targettable.clear();
                globals.phenotypetable.clear();

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
                            if(p.includes(":") === false)
                            {
                                p = "pubmed:" + p;
                            }
                            var ptext = p.replace('pubmed:','');
                            pubmedstring += `<a target="_blank" href="https://identifiers.org/${p}">${ptext}</a>, `;
                        });

                    result_row.push(pubmedstring.substr(0, pubmedstring.length-2));
                    globals.targettable.row.add(result_row)
                }


            }
        }

        // Add new data
        globals.regulationtable.columns.adjust().draw(); 
        globals.targettable.columns.adjust().draw();
        globals.phenotypetable.columns.adjust().draw(); 

        $('a.elementlink').click(function() {
            selectElementonMap(this.innerHTML, false);
        });

        /*
        globals.regulationtable.on('click', 'a', function () {
            selectElement(this.innerHTML, false);
        } );
        globals.targettable.on('click', 'a', function () {
            selectElement(this.innerHTML, false);
        } );
        globals.phenotypetable.on('click', 'a', function () {
            selectElement(this.innerHTML, false);
        } ); */

        var coll = document.getElementsByClassName("xp_collapsible");
        var i;

        adjustPanels()
        resolve(' ');
    });
}

function XP_PredictTargets() {
    var targets = [];
    let promises = [];

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
    }
    
    Promise.all(promises).finally(r => {
        globals.xp_targetchart.data.datasets = targets;
        globals.xp_targetchart.update();
    });

}


function createCentralityTable(phenotype) {
    globals.centraliytable.clear();

    for(let e in AIR.Molecules)
    {
        let result_row = [];
        

        result_row.push(getLinkIconHTML(AIR.Molecules[e].name));
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
           globals.centraliytable.row.add(result_row); 
        }
        
    }

    globals.centraliytable.columns.adjust().draw(); 

    $('a.elementlink').click(function() {
            selectElementonMap(this.innerHTML, false);
        });
    
        /*
    globals.centraliytable.on('click', 'a', function () {
        selectElement(this.innerHTML, false);
    } );*/
}
