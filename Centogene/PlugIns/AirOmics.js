function AirOmics(){    

    globals.container = $('#airomics_tab_content');   

    minerva.ServerConnector.getLoggedUser().then(function (user) {
        globals.user = user._login.toString().toLowerCase();
        if (globals.defaultusers.includes(globals.user) === true) {
            alert('Waning: You can reate overlays only after sing-in');
        }
        if (globals.guestuser.includes(globals.user) === true) {
            alert("Warning: You're logged in through a public account. Overlays you create may be visible to other users if not removed.");
        }

        $(minervaProxy.element).parent().css('overflow-y', 'scroll');

        $(
            /*<div class="text-center">
                <img src="https://www.sbi.uni-rostock.de/files/Projects/AIR/AIR3D_croped.png" class="img-fluid" width="100%">
            </div>*/
            /*html*/`                              
            <div class="row mb-2">
                <div class="col-auto">
                    <div class="wrapper">
                        <button type="button" class="om_btn_info btn btn-secondary ml-1"
                                data-html="true" data-toggle="popover" data-placement="top" title="File Specifications"
                                data-content="A tab-seperated .txt file of log2 fold change values.<br/>First Row contains the sample names.<br/>First Column contains the official gene/molecule symbols/names">
                            ?
                        </button>
                    </div>
                </div>
                <div class="col">
                    <input id="om_inputId" type="file" accept=".txt" class="om_inputfile inputfile" />
                </div>
            </div>

            <div id="om_columnSelect-container" class="disabledbutton row mb-2 mt-4">
                <div class="col-auto" style="padding:0; width: 30%; text-align: right;">
                    <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Mapping column:</span>
                </div>
                <div class="col">
                    <select id="om_columnSelect" class="browser-default om_select custom-select">

                    </select>
                </div>
            </div>

            <div id="om_mappingselect-container" class="disabledbutton row mb-2">
                <div class="col-auto" style="padding:0; width: 30%; text-align: right; ">
                    <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Mapping by:</span>
                </div>
                <div class="col">
                    <select id="om_mappingSelect" class="browser-default om_select custom-select">
                        <option value="name" selected>Gene Symbol</option>
                        <option value="uniprot">Uniprot ID</option>
                        <option value="HGNC">HGNC ID</option>
                        <option value="entrez">Entrez ID</option>
                        <option value="ncbigene">NCBI gene ID</option>
                        <option value="chebi">ChEBI ID</option>
                        <option value="ensembl">Ensembl ID</option>
                        <option value="mirbasemature">MIRBase ID</option>
                    </select>
                </div>
            </div>
            
            <button type="button" id="om_initializebtn" class="om_btn-initialize om_btn_air btn btn-block disabledbutton mt-4 mb-4">Initialize</button>
            
            <div class="disabledbutton" id="om_maintab" >
                <ul class="nav nav-tabs" role="tablist">
                    <li class="nav-item">
                        <a class="nav-link active om_tab" id="om_regulation-tab" data-toggle="tab" href="#om_regulation" role="tab" aria-controls="om_regulation" aria-selected="true">Phenotype Estimation</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link om_tab" id="om_target-tab" data-toggle="tab" href="#om_target" role="tab" aria-controls="om_target" aria-selected="false">Target Prediction</a>
                    </li>
                </ul>
                <div class="disabledbutton tab-content" id="om_tab">

                </div>
            </div>
        `).appendTo('#airomics_tab_content');
        
        globals.phenotab = $('<div class="tab-pane show active mb-2" id="om_regulation" role="tabpanel" aria-labelledby="om_regulation-tab"></div>').appendTo('#om_tab');
        globals.targettab = $(`<div class="tab-pane mb-2" id="om_target" role="tabpanel" aria-labelledby="om_target-tab">
        
            <div class="row mt-4 mb-2">
                <div class="col-auto">
                    <div class="wrapper">
                        <button type="button" class="om_btn_info btn btn-secondary"
                                data-html="true" data-toggle="popover" data-placement="top" title="Overlays"
                                data-content="Transcriptomics data allows for more accurate results as shortest paths to elements pass through their transcriptional regulations.">
                            ?
                        </button>
                    </div>
                </div>
                <div class="col">
                    <div class="cbcontainer">
                        <input type="checkbox" class="om_checkbox" id="om_transcriptomics" checked>
                        <label class="om_checkbox" for="om_transcriptomics">Transcriptomics Data</label>
                    </div>
                </div>
            </div>    

            <select id="om_select_mapping" class="browser-default om_select custom-select mb-2 mt-2">
                <option value="0" selected>All Elements</option>
                <option value="1">Proteins</option>
                <option value="2">miRNAs</option>
                <option value="3">lncRNAs</option>
                <option value="4">Transcription Factors</option>
            </select>
            <select id="om_select_sample" class="browser-default om_select custom-select mb-2 mt-2">
            </select>
            <button type="button" id="om_btn_predicttarget" class="om_btn_air btn btn-block om_btn_predicttarget_class mt-4 mb-4">Start</button>
            <canvas id="om_chart_target"></canvas>
            <div class="d-flex justify-content-center mt-2">
                    <li class="legendli" style="color:#6d6d6d; font-size:90%;"><span class="legendspan" style="background-color:#00BFC4"></span>positive Target</li>
                    <li class="legendli" style="margin-left:20px; color:#6d6d6d; font-size:90%;"><span class="legendspan" style="background-color:#F9766E"></span>negative Target</li>
                    <li class="legendli" style="margin-left:16px; color:#6d6d6d; font-size:90%;"><span class="triangle"></span>External Link</li>
            </div>
        </div>`).appendTo('#om_tab');

        /*
        $('#om_select_mapping').change(function() {
            OM_PredictTargets();
        });
        $('#om_select_sample').change(function() {
            OM_PredictTargets();
        });*/


        $(".dropdown-toggle").dropdown();
        $('#om_inputId').on('change', function() {
            var fileToLoad = document.getElementById("om_inputId").files[0];
    
            globals.columnheaders = [];
            $("#om_columnSelect").empty();

            var fileReader = new FileReader();
            var success = false;
            fileReader.readAsText(fileToLoad, "UTF-8");

            fileReader.onload = function (fileLoadedEvent) {

                var textFromFileLoaded = fileLoadedEvent.target.result;

                if(textFromFileLoaded.trim() == "")
                {
                    return stopfile('The file appears to be empty.');
                }
                var line = textFromFileLoaded.split('\n')[0];
                var index = 0;
                line.split('\t').forEach(entry => {
                    let header = entry;
                    globals.specialCharacters.forEach(c => {
                        header = header.replace(c, "");
                    })
                    globals.columnheaders.push(header.trim());                 
                    index ++; 
                })
                globals.numberofSamples = globals.columnheaders.length - 1;
                let columnSelect = document.getElementById('om_columnSelect');

                for(let i = 0; i < globals.columnheaders.length; i++) {

                    if(globals.columnheaders.filter(item => item == globals.columnheaders[i]).length > 1)
                    {
                        return stopfile('Headers in first line need to be unique!<br>Column ' + globals.columnheaders[i] + ' occured multiple times.');
                    }

                    columnSelect.options[columnSelect.options.length] = new Option(globals.columnheaders[i], i); 
                };
                if(globals.columnheaders.length <= 1)
                {
                    return stopfile('Could not read Headers');                          
                }
                                            
                $("#om_mappingselect-container").removeClass("disabledbutton");
                $("#om_columnSelect-container").removeClass("disabledbutton");
                $("#om_initializebtn").removeClass("disabledbutton");
                success = true;

                function stopfile(alerttext)
                {
                    alert(alerttext);
                    $("#om_mappingselect-container").addClass("disabledbutton");
                    $("#om_columnSelect-container").addClass("disabledbutton");
                    $("#om_initializebtn").addClass("disabledbutton");
                    success = false;
                    return false;
                }
            };

            return success;
        });
        $('#om_mappingSelect').on('change', function() {
            globals.selectedmapping = this.value;
        });

        globals.container.find('.om_btn_predicttarget_class').on('click', () => OM_PredictTargets());
        globals.container.find('.om_btn-initialize').on('click', () => Start());

        var outputCanvas = document.getElementById('om_chart_target').getContext('2d');

        globals.om_targetchart = new Chart(outputCanvas, {
            type: 'bubble',        
            data: {
                datasets: []
            },
            options: {
                pan: {
                    enabled: true,
                    mode: 'x',
                    speed: 1
                },
                zoom: {
                    enabled: true,                      
                    mode: 'x',
                },
                /*                          
                plugins: {
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'xy',
                
                            rangeMin: {
                                x: null,
                                y: null
                            },
                            rangeMax: {
                                x: null,
                                y: null
                            },
                            speed: 20,
                            threshold: 10,
                        },
                        zoom: {
                            enabled: true,
                            drag: true,
                            mode: 'xy',
                
                            rangeMin: {
                                x: null,
                                y: null
                            },
                            rangeMax: {
                                x: null,
                                y: null
                            },
                            speed: 0.1,
                            threshold: 2,
                            sensitivity: 3,
                        }
                    }
                },*/
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
                            beginAtZero: true,
                        }
                    }],
                    xAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'Specificity'
                        },
                        ticks: {
                            //beginAtZero: false,
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

        document.getElementById('om_chart_target').onclick = function (evt) {

            // => activePoints is an array of points on the canvas that are at the same position as the click event.
            var activePoint = globals.om_targetchart.lastActive[0]; //.getElementsAtEvent(evt)[0];

            if (activePoint !== undefined) {
                let name = globals.om_targetchart.data.datasets[activePoint._datasetIndex].label;
                selectElementonMap(name, true);
                setSelectedElement(name);
            }

            // Calling update now animates element from oldValue to newValue.
        };
            

    });
}

function loggedin(){
    if (globals.defaultusers.includes(globals.user) === true) {
        return false;
    }
    else {
        return true;
    }

}

function compare(a, b) {
    // Use toUpperCase() to ignore character casing
    const bandA = a.getName().toUpperCase();
    const bandB = b.getName().toUpperCase();

    let comparison = 0;
    if (bandA > bandB) {
        comparison = 1;
    } else if (bandA < bandB) {
        comparison = -1;
    }
    return comparison;
}

function download(filename) {

    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(globals.downloadtext));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function Start() {
    
    globals.container.find('.om_btn-initialize')[0].innerHTML = '';
    globals.container.find('.om_btn-initialize')[0].insertAdjacentHTML('beforeend', '<span class="loadingspinner spinner-border spinner-border-sm"></span>');

    $("#om_plugincontainer").addClass("disabledbutton");

        loadfile().then(function (lf) {
            if (lf != "") {
              alert(lf);
            }   
            readExpressionValues().then(function (re) {
                normalizeExpressionValues().then(function (ne) {

                            alert(Object.keys(globals.ExpressionValues).length + " out of " + globals.numberofuserprobes + " probes could be mapped.");

                            if (globals.container.find('.resultscontainer').length > 0) {

                                var element = globals.container.find('.resultscontainer')[0];
                                element.parentElement.removeChild(element);

                            }

                            if (!(globals.container.find('.startcontainer').length > 0)) {

                                globals.phenotab.append(
                                    /*html*/`
                                    <div class="startcontainer">

                                        <hr>
                                        <div class="row mt-1 mb-1">
                                            <div class="col-auto">
                                                <div class="wrapper">
                                                    <button type="button" class="om_btn_info btn btn-secondary om_popover"
                                                            data-html="true" data-toggle="popover" data-placement="top" title="Normalization"
                                                            data-content="We recommend to normalize the results for each phenotype individually because different values between them cannot be directly associated to a different activity.<br/>However, If using absolute values, no normalization may be the best way to go.">
                                                        ?
                                                    </button>
                                                </div>
                                            </div>
                                            <div class="col">
                                                <select id="om_select_normalize" class="om_select browser-default om_select custom-select mb-1 mt-1">
                                                    <option value="0">No normalization</option>
                                                    <option value="1" selected>Normalize each phenotype (recommended)</option>
                                                    <option value="2">Normalize each sample</option>
                                                </select>
                                            </div>
                                        </div>

                                        <hr>

                                        <div class="row mt-1 mb-1">
                                            <div class="col-auto">
                                                <div class="wrapper">
                                                    <button type="button" class="om_btn_info btn btn-secondary"
                                                            data-html="true" data-toggle="popover" data-placement="top" title="Overlays"
                                                            data-content="If checked, the absolute value of fold change will be considered for the phenotype assessement.<br/>">
                                                        ?
                                                    </button>
                                                </div>
                                            </div>
                                            <div class="col">
                                                <div class="cbcontainer">
                                                    <input type="checkbox" class="om_checkbox" id="om_checkbox_absolute">
                                                    <label class="om_checkbox" for="om_checkbox_absolute">Absolute effect?</label>
                                                </div>
                                            </div>
                                        </div>

                                        <hr>  

                                        <button type="button" id="om_banalyzebtn" class="om_btn-file om_btn_air btn btn-block mt-2">Analyze</button>

                                    </div>                                   
                                `);

                                $('#example').tooltip();
                                $('[data-toggle="popover"]').popover()
                                $(".dropdown-toggle").dropdown();

                                globals.container.find('.om_btn-file').on('click', () => readUserFile());
                            }

                            let sampleSelect = document.getElementById('om_select_sample');

                            for (let i = sampleSelect.options.length-1; i >= 0; i--) {
                                sampleSelect.options[i] = null;
                            };

                            for(let i = 0; i < globals.samples.length; i++) {
                                sampleSelect.options[sampleSelect.options.length] = new Option(globals.samples[i], i); 
                            };

                            globals.Targets = {};
                            globals.targetsanalyzed = false;
                            enablebtn();

                }).catch(function (error) {
                    alert('Failed to normalize the expression values.');
                    enablebtn();
                });

            }).catch(function (error) {
                alert('Failed to calculate complex expression values.');
                enablebtn();
            });
            
        }).catch(function (error) {
            if (error != "") {
                alert(error);
            } else {
                alert('Could not read the file.');
            }
            enablebtn();
        });

    function enablebtn() {
        var btn = document.getElementById("om_initializebtn");
        if (btn.childNodes.length > 0)
            btn.removeChild(btn.childNodes[0]);
        btn.innerHTML = 'Initialize';

        $("#om_plugincontainer").removeClass("disabledbutton");
        $("#om_tab").removeClass("disabledbutton");
        $("#om_maintab").removeClass("disabledbutton");
    }
}

$(document).on('click', '.clickPhenotypeinTable', function () {
    var sid = $(this).attr('data');
    globals.selected = [];

    selectElementonMap(AIR.Phenotypes[sid].name, false);
});

$(document).on('change', '.clickCBinTable',function () {


    var id = $(this).attr('data');


    var chartresult = [];

    for (let value in AIR.Phenotypes[id].norm_results)
    {
        chartresult.push({
            y: AIR.Phenotypes[id].norm_results[value],
            //x: globals.samples[j - 1]
        });
    }


    if ($(this).prop('checked') === true) {
;
        if(globals.colors.length <= 0)
        {
            $(this).prop('checked', false);
            alert('Deselect an item before adding a new one');
            return;
        }
        var dataid = globals.plevelchart_config.data.datasets.length;
        var color = globals.colors[0];

        globals.colors.shift();
        globals.pickedcolors.push(color);

        globals.plevelchart_config.data.datasets.push({
            label: AIR.Phenotypes[id].name,
            fill: false,
            data: chartresult,
            backgroundColor: color,
            borderColor: color
        });
    }
    else {
        let datasettoRemove = undefined;
        globals.plevelchart_config.data.datasets.forEach(function (dataset) {
            if (dataset.label === AIR.Phenotypes[id].name) {
                datasettoRemove = dataset
            }
        });

        if (datasettoRemove) {
            var dataid = globals.plevelchart_config.data.datasets.indexOf(datasettoRemove);
            var color = globals.pickedcolors[dataid];
            globals.colors.unshift(color);
            globals.pickedcolors.splice(dataid, 1);
            globals.plevelchart_config.data.datasets.splice(dataid, 1);
        }

    }

    globals.plevelchart.update();
    var html = globals.plevelchart.generateLegend().replace(/\"1-legend"/g, 'legend');
    document.getElementById('om_legend').innerHTML = html;
});

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}


function createTable() {
    
    return new Promise((resolve, reject) => {


    if (document.getElementById('om_resultstable')) {

        $('#om_resultstable').DataTable().destroy();


        var table = document.getElementById('om_resultstable');

        table.parentElement.removeChild(table);
    }
    
    globals.pickedcolors = [];

    if (document.getElementById('om_plevelchart')) {

        var chrt = document.getElementById('om_plevelchart');

        chrt.parentElement.removeChild(chrt);

    }
    if (globals.container.find('.resultscontainer').length > 0) {

        var element = globals.container.find('.resultscontainer')[0];
        element.parentElement.removeChild(element);

    }

    if (pluginContainer.find('.panel-results .panel-body').length > 0)
        pluginContainer.find('.panel-results .panel-body').html('');

    var tbl = document.createElement("table")

    tbl.setAttribute('class', 'order-column hover');
    tbl.setAttribute('style', 'width:100%');
    tbl.setAttribute('id', 'om_resultstable');
    tbl.setAttribute('cellspacing', '0');


    for (let phenotype in AIR.Phenotypes)
    {
        var result_row = tbl.insertRow(tbl.rows.length);
        var pname = AIR.Phenotypes[phenotype].name;

        globals.downloadtext += `\n${pname}`;
        checkBoxCell(result_row, 'th', pname, phenotype, 'center');
        let phenocell = createButtonCell(result_row, 'th', pname, phenotype, 'center');

        for (let sample in globals.samples) {
            globals.downloadtext += `\t${AIR.Phenotypes[phenotype].norm_results[sample]}`;
            createCell(result_row, 'td', AIR.Phenotypes[phenotype].norm_results[sample], 'col-3', '', 'center');
        }

        createCell(result_row, 'td', Math.round((AIR.Phenotypes[phenotype].accuracy + Number.EPSILON) * 10000) / 100, 'col-3', '', 'center');
    }

    let header = tbl.createTHead();
    var headerrow = header.insertRow(0);

    createCell(headerrow, 'th', 'Graph', 'col-3', 'col', 'center');
    createCell(headerrow, 'th', 'Phenotype', 'col-3', 'col', 'center');


    for (let sample in globals.samples) {

        createCell(headerrow, 'th', globals.samples[sample], 'col-3', 'col', 'center');
    }

    var $acc_cell = $(createCell(headerrow, 'th', 'avg Accuracy (%)', 'col-3', 'col', 'center'));
    $acc_cell.attr("title", "Accuracy represents the percentage of regulating elements (in proportion to their influence), for which a value was supplied by the data.");
    $acc_cell.attr("data-toggle", "tooltip");
    $acc_cell.tooltip();


    if (!(globals.container.find('.resultscontainer').length > 0)) {


        globals.phenotab.append(
            /*html*/`
            <div class="resultscontainer">
                <hr>
                <div class="row mb-3">
                    <div class="col-auto">
                        <div class="wrapper">
                            <button type="button" class="om_btn_info btn btn-secondary mb-4 ml-1"
                                    data-html="true" data-toggle="popover" data-placement="top" title="Overlays"
                                    data-content="Include values of the user data file in the overlays and color mapped nodes in the network.<br/>This may decrease the performance significantly">
                                ?
                            </button>
                        </div>
                    </div>
                    <div class="col">
                        <div class="cbcontainer">
                            <input type="checkbox" class="om_checkbox" id="checkbox_submap">
                            <label class="om_checkbox" for="checkbox_submap">Include values from the datafile?</label>
                        </div>
                    </div>
                </div>

                <button type="button" id="om_addoverlaybtn"  class="om_btn-add om_btn_air btn btn-block mb-2 mt-2">Create Overlays</button>

                <button type="button" id="om_showonmapbtn"  class="om_btn-map om_btn_air btn btn-block mb-2">Show On Map</button>

                <div class="btn-group btn-group-justified">
                    <div class="btn-group">
                        <button type="button" id="om_showoverlaybtn" class="om_btn-showoverlay om_btn_air btn mr-1">Show Overlays</button>
                    </div>
                    <div class="btn-group">
                        <button type="button" id="om_hideoverlaybtn" class="om_btn-hideoverlay om_btn_air btn ml-1">Hide Overlays</button>
                    </div>
                </div>
                <button type="button" id="om_removeoverlaybtn"  class="om_btn-delete om_btn_air btn btn-block mb-2 mt-2">Remove Overlays</button>

                <hr>

                <button type="button" id="om_addimagebtn"  class="btn-image om_btn_air btn btn-block mb-2 mt-2">Generate Image</button>

                <div class="image-container mb-2" style="width: 100%; margin: 0 auto"></div>

                <hr>

                <button class="btn-download btn mt-2 mb-2" style="width:100%"> <i class="fa fa-download"></i> Download results as .txt</button>
            </div>
        `);

        globals.container.find('.om_btn-showoverlay').on('click', () => showOverlaysClick());
        globals.container.find('.om_btn-hideoverlay').on('click', () => hideOverlaysClick());
        globals.container.find('.om_btn-map').on('click', () => showResultsOnMap());
        globals.container.find('.btn-image').on('click', () => showpicture());
        globals.container.find('.om_btn-add').on('click', () => AddOverlays());
        globals.container.find('.om_btn-delete').on('click', () => removeOverlays());


        $('[data-toggle="popover"]').popover()
        globals.container.find('.btn-download').on('click', () => download('PhenotypeActivity.txt'));
    }
    globals.resultscontainer = globals.container.find('.resultscontainer')[0];

    globals.resultscontainer.appendChild(tbl);

    globals.resultscontainer.insertAdjacentHTML('beforeend', '<canvas class="mb-2 mt-4" id="om_plevelchart"></canvas>');

    //var colorschemes = require('chartjs-plugin-colorschemes');
    var outputCanvas = document.getElementById('om_plevelchart').getContext('2d');

    globals.plevelchart_config = {
        type: 'line',
        options: {
            legendCallback: function (chart) {
                var text = [];
                text.push(`<div class='phenotypelegend  d-flex justify-content-center mt-2'>
                        <div class='legend-scale'>
                    <ul class='legend-labels'>`);
                for (var i = 0; i < chart.data.datasets.length; i++) {
                    text.push('<li><span style="background-color:' + chart.data.datasets[i].backgroundColor + '; border-radius: 25px"></span>');
                    if (chart.data.datasets[i].label) {
                        text.push(chart.data.datasets[i].label);
                    }
                    text.push('</li>');
                }
                text.push(`</ul>
                            </div>
                            </div>`);
                return text.join("");
            },
            legend: {
                display: false,
            },
            title: {
                display: false,
                text: 'Phenotype Activity',
                fontFamily: 'Helvetica',
                fontColor: '#6E6EC8',
                fontStyle: 'bold'
            },
            scales: {
                yAxes: [{
                    scaleLabel: {
                        fontStyle: 'bold',
                        display: false,
                        labelString: 'Level',
                        fontStyle: "bold"
                    },
                    ticks: {
                        suggestedMin: -1,
                        suggestedMax: 1
                    },
                    gridLines: {
                        color: "transparent",
                        display: true,
                        drawBorder: false,
                        zeroLineColor: "#ccc",
                        zeroLineWidth: 1
                    }
                }],
                xAxes: [{
                    type: 'category',
                    scaleLabel: {
                        fontStyle: "bold"
                    },
                    labels: globals.samples,
                    ticks: {
                        min: globals.samples[0],
                        max: globals.samples[globals.samples.length - 1]
                    },
                    gridLines: {
                        drawOnChartArea: false
                    }
                }],
            },
            tooltips: {
                callbacks: {
                    title: function (tooltipItems, data) {
                        //Return value for title
                        return data.datasets[tooltipItems[0].datasetIndex].label || '';
                    },
                    label: function (tooltipItem, data) {
                        var label = tooltipItem.xLabel;
                        label += "; ";
                        label += tooltipItem.yLabel;

                        return label;
                    }
                }
            }
        }

    }

    globals.plevelchart = new Chart(outputCanvas, globals.plevelchart_config);
    globals.resultscontainer.insertAdjacentHTML('beforeend', '<div id="om_legend" class="chart-legend"></div>');

    /*
    $("#om_legend > ul > li").on("click", function (e) {
        var index = $(this).index();
        $(this).toggleClass("strike")
        var ci = e.view.globals.plevelchart;
        var curr = ci.data.datasets[0]._meta[0].data[index];
        curr.hidden = !curr.hidden
        ci.update();
    }) */

    $('#om_resultstable').DataTable({
        "order": [[ globals.numberofSamples + 2, "desc" ]],  
        "scrollX": true
    });


    resolve(' ');
});
}

function showpicture() {

    globals.container.find('.btn-image')[0].innerHTML = '';
    globals.container.find('.btn-image')[0].insertAdjacentHTML('beforeend', '<span class="loadingspinner spinner-border spinner-border-sm"></span>');
    $("#om_plugincontainer").addClass("disabledbutton");

    getImageSource().then(imglink => {
        globals.container.find('.image-container')[0].innerHTML = '';
        globals.container.find('.image-container')[0].insertAdjacentHTML('beforeend', `
        <!-- Trigger the Modal -->
        <img id="om_resultsimg" src="${imglink}" alt="Phenotype Results" style="width:100%">

        <!-- The Modal -->
        <div id="om_om_resultsimg-modal" class="modal">

        <!-- The Close Button -->
        <span class="close">&times;</span>

        <!-- Modal Content (The Image) -->
        <img class="modal-content" id="om_img">

        <!-- Modal Caption (Image Text) -->
        <div id="om_img-caption"></div>
        </div>`);
        
        
        // Get the modal
        var modal = document.getElementById("om_om_resultsimg-modal");

        // Get the image and insert it inside the modal - use its "alt" text as a caption
        var img = document.getElementById("om_resultsimg");
        var modalImg = document.getElementById("om_img");
        var captionText = document.getElementById("om_img-caption");
        img.onclick = function(){
            modal.style.display = "block";
            modalImg.src = this.src;
            captionText.innerHTML = this.alt;
        }

        // Get the <span> element that closes the modal
        var span = document.getElementsByClassName("close")[0];

        // When the user clicks on <span> (x), close the modal
        span.onclick = function() {
            modal.style.display = "none";
        }
        
    }).catch(error => alert(error)).finally(r => {
        var btn = document.getElementById("om_addimagebtn");
        if (btn.childNodes.length > 0)
            btn.removeChild(btn.childNodes[0]);
        btn.innerHTML = 'Generate Image';
        $("#om_plugincontainer").removeClass("disabledbutton");
    });
}

function getImageSource() {
    return new Promise((resolve, reject) => {
        var ids = getOverlaysStrings();

        var output = minerva.ServerConnector._serverBaseUrl + 'api/projects/' + minervaProxy.project.data.getProjectId() + '/models/' + globals.phenotypeMapID + ':downloadImage?handlerClass=lcsb.mapviewer.converter.graphics.PngImageGenerator';
        if(ids == "")
        {
            alert('Warning: No overlays available. Create Overlays to show them in the image.');
        }
        else
        {  
            output += '&overlayIds=' + getOverlaysStrings();
        }
        output += '&zoomLevel=5';    
        resolve (output);
    });
}

function PhenotypeSP() {
    return new Promise((resolve, reject) => {

        for (let phenotype in AIR.Phenotypes) {
            let accuracymax = 0;

            AIR.Phenotypes[phenotype].results = {};
            AIR.Phenotypes[phenotype].norm_results = {};
            AIR.Phenotypes[phenotype].accuracy = 0;

            for (let element in AIR.Phenotypes[phenotype].values) {
                let SP = AIR.Phenotypes[phenotype].values[element];

                if (isNaN(SP) || SP === 0)
                {
                    continue;
                }

                accuracymax += Math.abs(SP);
            }

            let max = 0;

            var accuracyvalues = [];
            var accuracyavg = 0;

            for (let sample in globals.samples) {
                let activity = 0.0;
                var accuracy = 0;

                for (let element in AIR.Phenotypes[phenotype].values) {

                    if(!globals.ExpressionValues.hasOwnProperty(element))
                    {
                        continue;
                    }

                    let SP = AIR.Phenotypes[phenotype].values[element];


                    if (isNaN(SP))
                    {
                        continue;
                    }

                    let FC = globals.ExpressionValues[element].nonnormalized[sample];

                    if(isNaN(FC) || FC === 0)
                    {
                        continue;
                    }

                    if (document.getElementById("om_checkbox_absolute").checked === true) {
                        FC = Math.abs(FC);
                        SP = Math.abs(SP);
                    }

                    if(AIR.Phenotypes[phenotype].name === "vasodilation" ||  AIR.Phenotypes[phenotype].name === "vasoconstriction")
                    {
                        let test =  0;
                    }

                    activity += FC * SP; 
                    
                    accuracy += Math.abs(SP);
                }


                if (Math.abs(activity) > max)
                    max = Math.abs(activity);

                AIR.Phenotypes[phenotype].results[sample] = activity;
                
                accuracyvalues.push(accuracy);
            }

            
            var sum = 0;
            for( var a = 0; a < accuracyvalues.length; a++ ){
                sum += accuracyvalues[a]; //don't forget to add the base
            }

            accuracyavg = sum/accuracyvalues.length;
            if(accuracymax === 0)
            {
                AIR.Phenotypes[phenotype].accuracy = 0;
            }
            else{
                AIR.Phenotypes[phenotype].accuracy = accuracyavg / accuracymax;
            }
        }

        resolve('');

    });
}

function AddOverlays() {
    if(loggedin() === false)
    {
        return;
    }

    globals.container.find('.om_btn-add')[0].innerHTML = '';
    globals.container.find('.om_btn-add')[0].insertAdjacentHTML('beforeend', '<span class="loadingspinner spinner-border spinner-border-sm"></span>');
    $("#om_plugincontainer").addClass("disabledbutton");


    AddOverlaysPromise().then(r => {
        $("[name='refreshOverlays']").click();
    }).finally(r => {
        var btn = document.getElementById("om_addoverlaybtn");
        if (btn.childNodes.length > 0)
            btn.removeChild(btn.childNodes[0]);
        btn.innerHTML = 'Create Overlays';
        $("#om_plugincontainer").removeClass("disabledbutton");
    });

}

function AddOverlaysPromise() {
    return new Promise((resolve, reject) => {
        function ajaxPostQuery(count) {
            return new Promise((resolve, reject) => {
                if (count < globals.numberofSamples) {
                    $.ajax({
                        method: 'POST',
                        url: minerva.ServerConnector._serverBaseUrl + 'api/projects/' + minervaProxy.project.data.getProjectId() + '/overlays/',

                        data: `content=name%09color${contentString(count)}&description=PhenotypeActivity&filename=${globals.samplesResults[count]}.txt&name=${globals.samplesResults[count]}&googleLicenseConsent=true`,
                        cookie: 'MINERVA_AUTH_TOKEN=xxxxxxxx',
                        success: (response) => {
                            ajaxPostQuery(count + 1).then(r =>
                                resolve(response)).catch(error => { reject(error);});;
                        },
                        error: (response) => {
                            reject(response);
                        }
                    })
                }
                else {
                    resolve('');
                }
            });
        }
        ajaxPostQuery(0).then(pr => {
            resolve('');
            $("[name='refreshOverlays']").click();

        }).catch(error => { reject(error);});
    });
}

function showResultsOnMap() {

    globals.container.find('.om_btn-map')[0].innerHTML = '';
    globals.container.find('.om_btn-map')[0].insertAdjacentHTML('beforeend', '<span class="loadingspinner spinner-border spinner-border-sm"></span>');
    $("#om_plugincontainer").addClass("disabledbutton");

    function enablebtn() {
        var btn = document.getElementById("om_showonmapbtn");
        if (btn.childNodes.length > 0)
            btn.removeChild(btn.childNodes[0]);
        btn.innerHTML = 'Show On Map';
        $("#om_plugincontainer").removeClass("disabledbutton");
    }

    hideOverlays(true).then(r => {
        showOverlays(false).then(s => {
            minervaProxy.project.map.openMap({ id: globals.phenotypeMapID });
            setTimeout(
                enablebtn()
                , 1000);
        }).catch(error => enablebtn());
    }).catch(error => enablebtn());
}

function readUserFile() {
    globals.container.find('.om_btn-file')[0].innerHTML = '';
    globals.container.find('.om_btn-file')[0].insertAdjacentHTML('beforeend', '<span class="loadingspinner spinner-border spinner-border-sm"></span>');
    $("#om_plugincontainer").addClass("disabledbutton");
    setTimeout(function () {
      analyze().catch(function (error) {
        alert(error);
      }).finally(function (r) {
        var btn = document.getElementById("om_banalyzebtn");
        if (btn.childNodes.length > 0) btn.removeChild(btn.childNodes[0]);
        btn.innerHTML = 'Analyze';
        $("#om_plugincontainer").removeClass("disabledbutton");
      });
    }, 200);
  }
  
function analyze() {
  return new Promise(function (resolve, reject) {    
          PhenotypeSP().then(function (pr) {
            normalizePhenotypeValues().then(function (pv) {
              createTable().then(function (ct) {
                resolve('');
              }).catch(function (error) {
                return reject('Failed to create the result table.');
              });
            });
          }).catch(function (error) {
            return reject('Failed to analyze the phenotype levels.');
          });
        
  });
}

function loadfile() {

    return new Promise((resolve, reject) => {

        var resolvemessage = "";
        var fileToLoad = document.getElementById("om_inputId").files[0];

        if(!fileToLoad)
        {
            reject('No file selected.');
        }
        globals.numberofuserprobes = 0;
        var fileReader = new FileReader();
        fileReader.onload = function (fileLoadedEvent) {

            globals.samples = [];
            globals.samplestring = "";
            globals.samplesResults = [];
            globals.ExpressionValues = {};
            globals.numberofuserprobes = 0;
            
            var datamapped = false;
            var textFromFileLoaded = fileLoadedEvent.target.result;
            if(textFromFileLoaded.trim() == "")
            {
                reject('The file appears to be empty.');
            }
            var firstline = true;

            let headerid = parseFloat($("#om_columnSelect").val());

            for(let i = 0; i < globals.columnheaders.length; i++)
            {
                if(i === headerid)
                {
                    continue;
                }

                var samplename = globals.columnheaders[i];

                globals.samples.push(samplename);
                globals.samplesResults.push(samplename + "_results");
            }

            textFromFileLoaded.split('\n').forEach(function(line) {
                if (firstline === true) {
                    globals.samplestring = line.substr(line.indexOf("\t") + 1);
                    firstline = false;
                }
                else {                   
                    var column = 0;
                    let exists = false;

                    if(line == ""){
                        return;
                    }
                    globals.numberofuserprobes ++;
                    if(line.split('\t').length != globals.samples.length + 1)
                    {
                        var linelengtherror = "Lines in the datafile may have been skipped because of structural issues.";
                        if(resolvemessage.includes(linelengtherror) === false)
                        {
                            resolvemessage += linelengtherror
                        }
                        return;
                    }

                    let entries = line.split('\t');
                    let probeid = entries[headerid].toLowerCase();

                    if(AIR.ElementNames[globals.selectedmapping].hasOwnProperty(probeid))
                    {
                        let molecule_id = AIR.ElementNames[globals.selectedmapping][probeid];

                        if (globals.ExpressionValues.hasOwnProperty(molecule_id))
                        {
                            exists = true;
                        }
                        else
                        {
                            globals.ExpressionValues[molecule_id] = {};
                            globals.ExpressionValues[molecule_id]["name"] = AIR.Molecules[molecule_id].name;
                            globals.ExpressionValues[molecule_id]["nonnormalized"] = {};
                            globals.ExpressionValues[molecule_id]["normalized"] = {};
                        }

                        for(let i = 0; i < entries.length; i++)
                        {
                            if(i === headerid)
                            {
                                continue;
                            }
                            var number = parseFloat(entries[i].replace(",", ".").trim());
                            let samplename = globals.columnheaders[i];

                            let sampleid = globals.samples.indexOf(samplename, 0);

                            if(isNaN(number))
                            {
                                var numbererror = "Some values could not be read as numbers."
                                if(resolvemessage.includes(numbererror) === false)
                                {
                                    if(resolvemessage != "")
                                    {
                                        resolvemessage += "\n";
                                    }
                                    resolvemessage += numbererror
                                }
                                if(!exists)
                                {
                                    globals.ExpressionValues[molecule_id]["nonnormalized"][sampleid] = NaN;
                                }
                            }
                            else
                            {
                                if(exists)
                                {
                                    let existingnum = globals.ExpressionValues[molecule_id]["nonnormalized"][sampleid];
                                    globals.ExpressionValues[molecule_id]["nonnormalized"][sampleid] = (isNaN(existingnum)? 0 : existingnum) + number;
                                }
                                else 
                                {
                                    globals.ExpressionValues[molecule_id]["nonnormalized"][sampleid] = number;
                                }
                            }
                        }  
                    } 
                }

            });

            if(globals.ExpressionValues.length === 0)
            {
                if(datamapped === false)
                {
                    reject('No data in the file could be found, read or mapped.');
                }
                else 
                {
                    reject('The data could not be read.');
                }
            }
            else{
                resolve(resolvemessage);
            }

        };

        fileReader.readAsText(fileToLoad, "UTF-8");
    });

}

function contentString(ID) {

    var rgbToHex = function (rgb) {
        var hex = Number(Math.round(rgb)).toString(16);
        if (hex.length < 2) {
            hex = "0" + hex;
        }
        return hex;
    };

    let addednames = [];
    let output = '';
    for (let p in AIR.Phenotypes)
    {
        let _name = encodeURIComponent(AIR.Phenotypes[p].name);

        if(addednames.includes(_name))
            continue;
        addednames.push(_name);
        let _value = AIR.Phenotypes[p].norm_results[ID];
        let hex = rgbToHex((1 - Math.abs(_value)) * 255);
        output += `%0A${_name}`;
        if (_value > 0)
            output += '%09%23ff' + hex + hex;
        else if (_value < 0)
            output += '%09%23' + hex + hex + 'ff';
        else output += '%09%23ffffff';

    };
    
    if (document.getElementById("checkbox_submap").checked === true) {
        for(let expression in globals.ExpressionValues)
        {
            let _name = encodeURIComponent(globals.ExpressionValues[expression].name);

            if(addednames.includes(_name))
                continue;
            addednames.push(_name);           
            
            let _value = globals.ExpressionValues[expression].normalized[ID];
            let hex = rgbToHex((1 - Math.abs(_value)) * 255);
            output += `%0A${encodeURIComponent(_name)}`;
            if (_value > 0)
                output += '%09%23ff' + hex + hex;
            else if (_value < 0)
                output += '%09%23' + hex + hex + 'ff';
            else output += '%09%23ffffff';
        };
    }
    console.log(output);
    return output;
}

function removeOverlays() {

    if(loggedin() === false)
    {
        return;
    }

    globals.container.find('.om_btn-delete')[0].innerHTML = '';
    globals.container.find('.om_btn-delete')[0].insertAdjacentHTML('beforeend', '<span class="loadingspinner spinner-border spinner-border-sm"></span>');

    $("#om_plugincontainer").addClass("disabledbutton");
       
    function enablebtn() {
        var btn = document.getElementById("om_removeoverlaybtn");
        if (btn.childNodes.length > 0)
            btn.removeChild(btn.childNodes[0]);
        btn.innerHTML = 'Remove Overlays';
        $("#om_plugincontainer").removeClass("disabledbutton");
    }

    removeOverlaysPromise().then(r => {
        $("[name='refreshOverlays']").click();
        enablebtn();
    }).catch(error => {
        alert('Failed to remove overlays')
        enablebtn();
    });

}

function getDataOverlays(overlays, legend) {
    return new Promise((resolve, reject) => {
        let olarray = [];
        for (let olCount = 0; olCount < overlays.length; olCount++) {
            if (globals.samplesResults.includes(overlays[olCount].name) === true || (legend === true && overlays[olCount].name == "OverlayLegend")) {
                olarray.push(overlays[olCount])
            }
        }
        resolve(olarray);
    });
}

function getOverlaysStrings() {
    var output = "";
    var overlays = minervaProxy.project.data.getDataOverlays();
    for (let olCount = 0; olCount < overlays.length; olCount++) {
        if (globals.samplesResults.includes(overlays[olCount].name) === true) {
            output += overlays[olCount].id + ",";
        }
    }
    output = output.substring(0, output.length - 1);
    return output;
}

function hideOverlaysClick() {

    globals.container.find('.om_btn-hideoverlay')[0].innerHTML = '';
    globals.container.find('.om_btn-hideoverlay')[0].insertAdjacentHTML('beforeend', '<span class="loadingspinner spinner-border spinner-border-sm"></span>');

    $("#om_plugincontainer").addClass("disabledbutton");
       
    function enablebtn() {
        var btn = document.getElementById("om_hideoverlaybtn");
        if (btn.childNodes.length > 0)
            btn.removeChild(btn.childNodes[0]);
        btn.innerHTML = 'Hide Overlays';
        $("#om_plugincontainer").removeClass("disabledbutton");
    }

    hideOverlays(false).then(rs => {
        enablebtn();
    }).catch(error => enablebtn());

}

function hideOverlays(all) {
    return new Promise((resolve, reject) => {
        var overlays = minervaProxy.project.data.getDataOverlays();
        function hideOverlay(ols) {
            return new Promise((resolve, reject) => {
                if (ols.length > 0) {
                    minervaProxy.project.map.hideDataOverlay(ols[0].id).then(r => {
                        ols.splice(0, 1);
                        hideOverlay(ols).then(s => {
                            resolve('');
                        });
                    });;
                }
                else {
                    resolve('');
                }
            });
        }
        getDataOverlays(overlays, false).then(ol => {
            hideOverlay(all ? overlays : ol).then(rs => {
                $("[name='refreshOverlays']").click();
                resolve('');
            });
        });
    });
}

function showOverlaysClick() {

    
    globals.container.find('.om_btn-showoverlay')[0].innerHTML = '';
    globals.container.find('.om_btn-showoverlay')[0].insertAdjacentHTML('beforeend', '<span class="loadingspinner spinner-border spinner-border-sm"></span>');

    $("#om_plugincontainer").addClass("disabledbutton");
    function enablebtn() {
        var btn = document.getElementById("om_showoverlaybtn");
        if (btn.childNodes.length > 0)
            btn.removeChild(btn.childNodes[0]);
        btn.innerHTML = 'Show Overlays';
        $("#om_plugincontainer").removeClass("disabledbutton");
    }
    showOverlays(false).finally(rs => {
        enablebtn();    
    })
}

function showOverlays(all) {
    return new Promise((resolve, reject) => {
       var overlays = minervaProxy.project.data.getDataOverlays();
        function showOverlay(ols) {
            return new Promise((resolve, reject) => {
                if (ols.length > 0) {
                    minervaProxy.project.map.showDataOverlay(ols[0]).then(r => {
                        ols.splice(0, 1);
                        showOverlay(ols).then(s => {
                            resolve('');
                        });
                    });;
                }
                else {
                    resolve('');
                }
            });
        }

        getDataOverlays(overlays, true).then(ol => {
            showOverlay(all ? overlays : ol).then(rs => {
                $("[name='refreshOverlays']").click();
                resolve('');
            });
        });
    });
}

function removeOverlaysPromise() {
    return new Promise((resolve, reject) => {
        var overlays = minervaProxy.project.data.getDataOverlays();
        function ajaxDeleteQuery(count) {
            return new Promise((resolve, reject) => {
                if (count.length > 0) {
                    $.ajax({
                        method: 'DELETE',
                        url: minerva.ServerConnector._serverBaseUrl + 'api/projects/' + minervaProxy.project.data.getProjectId() + '/overlays/' + count[0].id,
                        cookie: 'MINERVA_AUTH_TOKEN=xxxxxxxx',
                        success: (response) => {
                            count.splice(0, 1);
                            ajaxDeleteQuery(count).then(r =>
                                resolve(response));
                        }
                    })
                }
                else {
                    resolve('');
                }
            });
        }

        hideOverlays(false).then(rs => {
            setTimeout(
                getDataOverlays(overlays, false).then(ols => {
                    ajaxDeleteQuery(ols).then(dr => {
                        $("[name='refreshOverlays']").click();
                        resolve('');
                        //Overlay POST function
                    });
                }), 200);

        });
    });
}

function readExpressionValues() {

    return new Promise((resolve, reject) => {
        for (let item in AIR.Molecules) {

            if(!AIR.Molecules[item].complex)
            {
                continue;
            }

            if(!globals.ExpressionValues.hasOwnProperty(item))
            {
                globals.ExpressionValues[item] = {}
                globals.ExpressionValues[item]["name"] = AIR.Molecules[item].name;
                globals.ExpressionValues[item]["normalized"] = {};
                globals.ExpressionValues[item]["nonnormalized"] = {}
            }

            for (let sample in globals.samples) {
                globals.ExpressionValues[item].nonnormalized[sample] = itemExpreesion(item, sample);
            }
        }

        function itemExpreesion(item, sample)
        {
            if(AIR.Molecules[item].complex == false && globals.ExpressionValues.hasOwnProperty(item))
            {
                return globals.ExpressionValues[item]["nonnormalized"][sample];
            }
            else if(AIR.Molecules[item].subunits.length > 0) {
                let sum = 0;
                if(!AIR.Molecules[item].independent)
                {
                    sum = Number.MAX_SAFE_INTEGER;
                }
                for(let subunit in AIR.Molecules[item].subunits)
                {
                    let subunitvalue = itemExpreesion(AIR.Molecules[item].subunits[subunit], sample);
                    if(!isNaN(subunitvalue))
                    {
                        if(AIR.Molecules[item].independent)
                        {
                            sum += subunitvalue;
                        }
                        else if(subunitvalue < sum)
                        {
                            sum = subunitvalue;
                        }
                    }
                }

                return ( sum === Number.MAX_SAFE_INTEGER? 0 : sum);
            }
            else {
                return 0;
            }
        }

        resolve('');
    });
}

function normalizeExpressionValues() {
    return new Promise((resolve, reject) => {
        let typevalue = $('.om_select').val();

        let allmax = 0.0;
        let alreadyincluded = [];
        let samplemaxvalues = [];
        let probemaxvalues = [];

        for (let sample in globals.samples) {
            samplemaxvalues.push(0);
        }

        for (let expression in globals.ExpressionValues) {

            let probemax = 0;
            for (let sample in globals.samples) {
                let value = globals.ExpressionValues[expression]["nonnormalized"][sample];
                if (value > allmax)
                    allmax = value;
                if (value > probemax)
                    probemax = value;
                if (value > samplemaxvalues[sample]) {
                    samplemaxvalues[sample] = value;
                }
            }
            globals.ExpressionValues[expression].maxvalue = probemax;
        }

        for (let expression in globals.ExpressionValues) {


            if (alreadyincluded.includes(name) === true)
                continue;

            let max = allmax;
            if (typevalue == 1) {
                max = globals.ExpressionValues[expression].maxvalue;
            }

            for (let sample in globals.samples) {
                if (typevalue == 2) {
                    max = samplemaxvalues[sample]
                }
                if(max <= 1)
                {
                    continue;
                }
                if (max > 0) {
                    globals.ExpressionValues[expression]["normalized"][sample] = globals.ExpressionValues[expression]["nonnormalized"][sample] / max;
                }
                else {
                    globals.ExpressionValues[expression]["normalized"][sample] = globals.ExpressionValues[expression]["nonnormalized"][sample];
                }
            }
        }

        resolve('');
    });
}

function normalizePhenotypeValues() {
    return new Promise((resolve, reject) => {
        let typevalue = $('.om_select').val();

        let allmax = 0.0;
        let alreadyincluded = [];
        let samplemaxvalues = [];

        for (let sample in globals.samples) {
            samplemaxvalues.push(0);
        }

        for (let phenotype in AIR.Phenotypes) {

            let probemax = 0;
            for (let sample in globals.samples) {
                let value = Math.abs(AIR.Phenotypes[phenotype].results[sample]);
                if (value > allmax)
                    allmax = value;
                if (value > probemax)
                    probemax = value;
                if (value > samplemaxvalues[sample]) {
                    samplemaxvalues[sample] = value;
                }
            }
            AIR.Phenotypes[phenotype]["maxvalue"] = probemax;
        }

        for (let phenotype in AIR.Phenotypes) {


            if (alreadyincluded.includes(name) === true)
                continue;

            let max = allmax;
            if (typevalue == 1) {
                max = AIR.Phenotypes[phenotype].maxvalue;
            }

            for (let sample in globals.samples) {
                if (typevalue == 2) {
                    max = samplemaxvalues[sample]
                }
                if (max > 1 && allmax <= 1) {
                    AIR.Phenotypes[phenotype].norm_results[sample] = Math.round(((AIR.Phenotypes[phenotype].results[sample] / max) + Number.EPSILON) * 100) / 100;
                }
                else {
                    AIR.Phenotypes[phenotype].norm_results[sample] = Math.round(((AIR.Phenotypes[phenotype].results[sample]) + Number.EPSILON) * 100) / 100;
                }
            }
        }

        resolve('');
    });
}

function OM_PredictTargets() {

    globals.container.find('.om_btn_predicttarget_class')[0].innerHTML = '';
    globals.container.find('.om_btn_predicttarget_class')[0].insertAdjacentHTML('beforeend', '<span class="loadingspinner spinner-border spinner-border-sm"></span>');

    /*
    var btn = document.getElementById('om_btn_predicttarget');
    btn.innerHTML = '';
    btn.insertAdjacentHTML('beforeend', '<span class="loadingspinner spinner-border spinner-border-sm"></span>');
*/
    $("#om_plugincontainer").addClass("disabledbutton");
    
    setTimeout(function(){
        calculateTargets().finally(r => {       
            //btn.innerHTML = 'Start';
            globals.container.find('.om_btn_predicttarget_class')[0].innerHTML = 'Start';
            $("#om_plugincontainer").removeClass("disabledbutton");
        });
    }, 10);
}


function calculateTargets() {
    return new Promise(
        (resolve, reject) => {
        var targets = [];
        var promises = [];
        for (let e in AIR.Molecules) {

            let {name:_name, type:_type, phenotypes:_sp} = AIR.Molecules[e];

            if (_type.toLowerCase() === "phenotype") {
                continue;
            }

            let typevalue = $('#om_select_mapping').val();
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
                
            let sample = $('#om_select_sample').val();  

            if(globals.Targets.hasOwnProperty(e) && globals.Targets[e].hasOwnProperty(sample))
            {
                targets.push(globals.Targets[e][sample]);
            }
            else
            {
                promises.push(
                getMoleculeData(e).then(data => new function() {

                    let positiveSum = 0;
                    let positiveinhibitorySum = 0;
                    let positiveCount = 0;

                    let negativeSum = 0;
                    let negativeCount = 0;
         
                    for (let p in globals.ExpressionValues) 
                    {
                        let value = globals.ExpressionValues[p].nonnormalized[sample];
                        let SP = 0;

                        let transcriptomics = document.getElementById("om_transcriptomics").checked;

                        if(data.hasOwnProperty(p))
                        {
                            if (transcriptomics)
                            {
                                SP = data[p].tInfluence;
                            }
                            else
                            {
                                SP = 1 / (data[p].SP * data[p].Type);
                            }
                        }

                        let SP_abs = Math.abs(SP);

                        if (value != 0) {

                            if (SP != 0) {
                                positiveSum += value * SP;
                                positiveinhibitorySum -= value * SP;
                            }
                            positiveCount += Math.abs(value);
                        }
                        else {
                            if (SP === 0) {
                                negativeSum += 1;
                            }

                            else {
                                if(SP_abs < 1)
                                negativeSum += (1 - SP_abs);

                            }
                            negativeCount++;
                        }
                    }

                    let positiveSensitivity = 0;
                    let negativeSensitivity = 0;
                    if (positiveCount > 0) {
                        positiveSensitivity = Math.round(((positiveSum / positiveCount) + Number.EPSILON) * 100) / 100;
                        negativeSensitivity = Math.round(((positiveinhibitorySum / positiveCount) + Number.EPSILON) * 100) / 100;
                    }
                    if (positiveSensitivity <= 0 && negativeSensitivity <= 0)
                        return;

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
                    let result = {
                        label: _name,
                        data: [{
                            x: specificity,
                            y: sensitivity,
                            r: radius
                        }],
                        backgroundColor: hex,
                        hoverBackgroundColor: hex,
                        pointStyle: pstyle,
                    }
                    targets.push(result);
                    if(globals.Targets.hasOwnProperty(e) == false)
                    {
                        globals.Targets[e] = {};
                    }
                    globals.Targets[e][sample] = result;
                }));
            }
        }

        Promise.all(promises).catch(e => {
                console.log(e);
            }).finally(r => {
                globals.om_targetchart.data.datasets = targets;
                globals.om_targetchart.update(); 
                resolve('');
            });
    });
}
