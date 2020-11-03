async function AirOmics(){    
    globals.omics = {
        enrichrtab: undefined,
        phenotab: undefined,
        targettab: undefined,
        resultscontainer: undefined,
        downloadtext: '',
        om_phenotype_downloadtext: '',
        om_target_downloadtext: '',
        om_targetchart: null,
        pvalue: false,
        samples: [],
        samplesResults: [],
        samplestring: '',
        columnheaders: [],
        numberofSamples: 0,
        ExpressionValues: {},
        Targets: {},
        alreadycalculated: false,
        targetsanalyzed: true,
        selectedmapping: "name",
        spsliderchart: undefined,
        plevelchart_config: undefined,
        plevelchart: undefined,
        numberofuserprobes: 0,
        selected: [],
        colors: ["#4E79A7","#F28E2B","#E15759","#76B7B2","#59A14F","#EDC948", "#B07AA1","#FF9DA7","#9C755F","#BAB0AC"],
        pickedcolors: [],
    }
    let t0 = performance.now();
    globals.omics.om_container = $('#airomics_tab_content');   
    $(`<div id="om_stat_spinner" class="mt-5">
        <div class="d-flex justify-content-center">
            <div class="spinner-border" role="status">
                <span class="sr-only"></span>
            </div>
        </div>
        <div class="d-flex justify-content-center">
            <span id="om_loading_text">LOADING...</span>
        </div>
    </div>`).appendTo(globals.omics.om_container);

    $(minervaProxy.element).parent().css('overflow-y', 'scroll');

    $(
        /*<div class="text-center">
            <img src="https://www.sbi.uni-rostock.de/files/Projects/AIR/AIR3D_croped.png" class="img-fluid" width="100%">
        </div>*/
        /*html*/`
        <div class="air_alert alert alert-info mt-2">
            <span>Plugins are executed on the client side. None of your data is uploaded or stored.</span>
            <button type="button" class="air_close close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>                                
        <div class="row mb-2 mt-4">
            <div class="col-auto">
                <div class="wrapper">
                    <button type="button" class="air_btn_info btn btn-secondary ml-1"
                            data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="File Specifications"
                            data-content="A tab-delimited .txt file with log2 fold change values.<br/>
                            One column must contain the official probe names or IDs.">
                        ?
                    </button>
                </div>
            </div>
            <div class="col">
                <input id="om_inputId" type="file" accept=".txt" class="om_inputfile inputfile" />
            </div>
        </div>

        <div id="om_columnSelect-container" class="air_disabledbutton row mb-2 mt-4">
            <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right;">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Mapping column:</span>
            </div>
            <div class="col">
                <select id="om_columnSelect" class="browser-default om_select custom-select">

                </select>
            </div>
        </div>

        <div id="om_mappingselect-container" class="air_disabledbutton row mb-2">
            <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right; ">
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
        
        <div class="row mt-4 mb-4">
            <div class="col-auto">
                <div class="wrapper">
                    <button type="button" class="air_btn_info btn btn-secondary"
                            data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Overlays"
                            data-content="If checked, every second column will be mapped as a p-value for the previous sample column.<br/>">
                        ?
                    </button>
                </div>
            </div>
            <div class="col">
                <div class="cbcontainer">
                    <input type="checkbox" class="air_checkbox" id="om_checkbox_pvalue">
                    <label class="air_checkbox air_checkbox_label" for="om_checkbox_pvalue">Data has p-values?</label>
                </div>
            </div>
        </div>

        <div id="om_transcriptSelect-container" class="row mb-2">
            <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right; ">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Multiple transcripts by:</span>
            </div>
            <div class="col">
                <select id="om_transcriptSelect" class="browser-default om_select custom-select">
                    <option value="0" selected>Mean</option>
                    <option value="1">Highest FC</option>
                    <option value="2">Lowest FC</option>
                    <option value="3">Highest absolute FC</option>
                    <option value="4">Lowest absolute FC</option>
                    <option value="5">Lowest p-value</option>
                </select>
            </div>
        </div>

        <button type="button" id="om_initializebtn" class="air_btn btn btn-block air_disabledbutton mt-4 mb-2">Read Data File</button>
        <p class="ml-2" id="elementsreadinfile"></p>
        <div class="air_disabledbutton" id="om_maintab" >
            <ul class="air_nav_tabs nav nav-tabs" role="tablist">
                <li class="air_nav_item nav-item" style="width: 40%;">
                    <a class="air_tab air_tab_sub active nav-link" id="om_regulation-tab" data-toggle="tab" href="#om_regulation" role="tab" aria-controls="om_regulation" aria-selected="true">Phenotype Estimation</a>
                </li>
                <li class="air_nav_item nav-item" style="width: 35%;">
                    <a class="air_tab air_tab_sub nav-link" id="om_target-tab" data-toggle="tab" href="#om_target" role="tab" aria-controls="om_target" aria-selected="false">Regulator Prediction</a>
                </li>
                <li class="air_nav_item nav-item" style="width: 25%;">
                    <a class="air_tab air_tab_sub nav-link" id="om_enrichr-tab" data-toggle="tab" href="#om_enrichr" role="tab" aria-controls="om_enrichr" aria-selected="false">Enrichr</a>
                </li>
            </ul>
            <div class="tab-content air_tab_content" id="om_tab">

            </div>
        </div>
    `).appendTo('#airomics_tab_content');

    globals.omics.phenotab = $(`
    <div class="tab-pane air_tab_pane show active mb-2" id="om_regulation" role="tabpanel" aria-labelledby="om_regulation-tab">
        <div id="om_pheno_startcontainer">
            <div class="row mb-1">
                <div class="col-auto">
                    <div class="wrapper">
                        <button type="button" class="air_btn_info btn btn-secondary om_popover"
                                data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Normalization"
                                data-content="We recommend to normalize the results for each phenotype individually because different values between them cannot be directly associated to a different activity.<br/>However, If using absolute values, no normalization may be the best way to go.">
                            ?
                        </button>
                    </div>
                </div>
                <div class="col">
                    <select id="om_select_normalize" class="om_select browser-default custom-select mb-1 mt-1">
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
                        <button type="button" class="air_btn_info btn btn-secondary"
                                data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Overlays"
                                data-content="If checked, the absolute value of fold change will be considered for the phenotype assessement.<br/>">
                            ?
                        </button>
                    </div>
                </div>
                <div class="col">
                    <div class="cbcontainer">
                        <input type="checkbox" class="air_checkbox" id="om_checkbox_absolute">
                        <label class="air_checkbox" for="om_checkbox_absolute">Absolute effect?</label>
                    </div>
                </div>
            </div>
            
            <hr>

            <div id="om_pheno_pvaluethreshold-container" class="row mb-2">
                <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right; ">
                    <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">p-value Threshold:</span>
                </div>
                <div class="col">
                    <input type="text" class="textfield" value="0.05" id="om_pheno_pvaluethreshold" onkeypress="return isNumber(event)" />
                </div>
            </div>

            <hr>  

            <div class="row mt-1 mb-1">
                <div class="col-auto">
                    <div class="wrapper">
                        <button type="button" class="air_btn_info btn btn-secondary"
                                data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Overlays"
                                data-content="If checked, p-value are included as a weighting factor for phenotype regulators.<br/>">
                            ?
                        </button>
                    </div>
                </div>
                <div class="col">
                    <div class="cbcontainer">
                        <input type="checkbox" class="air_checkbox" id="om_checkbox_pheno_pvalue">
                        <label class="air_checkbox" for="om_checkbox_pheno_pvalue">Weight elements by their p-value?</label>
                    </div>
                </div>
            </div>

            <hr>

            <button type="button" id="om_pheno_analyzebtn" class="air_btn btn btn-block mt-2">Estimate Phenotype Levels</button>

        </div>

        <div id="om_pheno_resultscontainer"></div>
    </div>
    `
    ).appendTo('#om_tab');
    globals.omics.targettab = $(`<div class="tab-pane air_tab_pane mb-2" id="om_target" role="tabpanel" aria-labelledby="om_target-tab">
        <div class="air_alert alert alert-warning mb-4">
            <span>This requires much more computationally intensive calculations that need to fetch a larger amount of data. The calculation speed mainly depends on your internet bandwidth.<br/>We also recommend having at least 1 GB of RAM available.</span>
            <button type="button" class="air_close close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>  
        <div class="row mt-1 mb-1">
            <div class="col-auto">
                <div class="wrapper">
                    <button type="button" class="air_btn_info btn btn-secondary"
                            data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Data Type"
                            data-content="Transcriptomics data allow more accurate results by including information on transcription factor interactions.<br/>For other data types this should definitely be deactivated.">
                        ?
                    </button>
                </div>
            </div>
            <div class="col">
                <div class="cbcontainer">
                    <input type="checkbox" class="air_checkbox" id="om_transcriptomics">
                    <label class="air_checkbox" for="om_transcriptomics">Transcriptomics Data</label>
                </div>
            </div>
        </div>    
        <hr>
        <label class="air_label mt-1">Sample:</label>
        <select id="om_select_sample" class="browser-default om_select custom-select mb-1">
        </select>
        <hr>
        <label class="air_label mt-1">Regulator Type Filter:</label>
        <select id="om_target_filter" class="browser-default om_select custom-select mb-1">
            <option value="0" selected>All Elements</option>
            <option value="1">Proteins</option>
            <option value="2">miRNAs</option>
            <option value="3">lncRNAs</option>
            <option value="4">Transcription Factors</option>
        </select>
        <hr>
        <button type="button" id="om_btn_predicttarget" class="air_btn btn btn-block mt-1 mb-1">Predict Regulators</button>
        <hr>
    </div>`).appendTo('#om_tab');

    globals.omics.enrichrtab = $(`
        <div class="tab-pane air_tab_pane mb-2" id="om_enrichr" role="tabpanel" aria-labelledby="om_enrichr-tab">
            <p>Define thresholds to create gene sets from the data:</p>
            <div id="om_fcthreshold-container" class="row mb-2">
                <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right; ">
                    <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">FC Threshold (abs):</span>
                </div>
                <div class="col">
                    <input type="text" class="textfield" value="1.00" id="om_fcthreshold" onkeypress="return isNumber(event)" />
                </div>
            </div>
            <div id="om_pvaluethreshold-container" class="row mb-4">
                <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right; ">
                    <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">p-value Threshold:</span>
                </div>
                <div class="col">
                    <input type="text" class="textfield" value="0.05" id="om_pvaluethreshold" onkeypress="return isNumber(event)" />
                </div>
            </div>
            <p>Select an Enrichr Library:</p>
            <select id="om_enrichrselect" class="browser-default om_select custom-select">
                <option selected>KEGG_2019_Human</option>
                <option >DisGeNET</option>
                <option >WikiPathways_2019_Human</option>
                <option >Reactome_2016</option>
                <option >miRTarBase_2017</option>
                <option >DSigDB</option>
            </select>
            <button type="button" id="om_btn_enrichr" class="air_btn btn btn-block mt-4 mb-1">Fetch Enrichr Results</button>

            <div id="om_enrichr_resultscontainer"></div>
        </div>
    `
    ).appendTo('#om_tab');
    
    $("#om_enrichr_progress").attr("aria-valuemax", Object.keys(globals.omics.samples).length);

    $('.air_btn_info[data-toggle="popover"]').popover()
    $('#om_inputId').on('change', function() {
        var fileToLoad = document.getElementById("om_inputId").files[0];

        globals.omics.columnheaders = [];
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
                globals.omics.columnheaders.push(header.trim());                 
                index ++; 
            })

            if(globals.omics.pvalue)
            {
                if ((globals.omics.columnheaders.length - 1)%2 != 0)
                    return stopfile('Number of p-value columns is different from the sumber of sample columns!'); 
            }
            let columnSelect = document.getElementById('om_columnSelect');

            for(let i = 0; i < globals.omics.columnheaders.length;i++) {

                if(globals.omics.columnheaders.filter(item => item == globals.omics.columnheaders[i]).length > 1)
                {
                    return stopfile('Headers in first line need to be unique!<br>Column ' + globals.omics.columnheaders[i] + ' occured multiple times.');
                }

                columnSelect.options[columnSelect.options.length] = new Option(globals.omics.columnheaders[i], i); 
            };
            if(globals.omics.columnheaders.length <= 1)
            {
                return stopfile('Could not read Headers');                          
            }
                                        
            $("#om_mappingselect-container").removeClass("air_disabledbutton");
            $("#om_columnSelect-container").removeClass("air_disabledbutton");
            $("#om_initializebtn").removeClass("air_disabledbutton");
            success = true;

            function stopfile(alerttext)
            {
                alert(alerttext);
                $("#om_mappingselect-container").addClass("air_disabledbutton");
                $("#om_columnSelect-container").addClass("air_disabledbutton");
                $("#om_initializebtn").addClass("air_disabledbutton");
                success = false;
                return false;
            }
        };

        return success;
    });
    $('#om_mappingSelect').on('change', function() {
        globals.omics.selectedmapping = this.value;
    });

    $("#om_btn_predicttarget").on('click', function() {            
        OM_PredictTargets();
    });
    $("#om_btn_enrichr").on('click', function() {            
        enrichr();
    });
    $('#om_initializebtn').on('click', function() {
        Start();
    });

    $("#om_stat_spinner").remove();
    
    globals.omics.targettab.append($(`
        <div style="position: relative; max-height: 400px;">
            <canvas id="om_chart_target" style="height: 400px;"></canvas>
        </div>
        <div id="om_legend_target" class="d-flex justify-content-center mt-2">
            <li class="legendli" style="color:#6d6d6d; font-size:90%;"><span class="legendspan" style="background-color:#00BFC4"></span>positive Regulator</li>
            <li class="legendli" style="margin-left:20px; color:#6d6d6d; font-size:90%;"><span class="legendspan" style="background-color:#F9766E"></span>negative Regulator</li>
            <li class="legendli" style="margin-left:16px; color:#6d6d6d; font-size:90%;"><span class="triangle"></span>External Link</li>
        </div>
        <button id="om_btn_download_target" class="om_btn_download btn mt-4" style="width:100%"> <i class="fa fa-download"></i> Download results as .txt</button>
        `));

    $('#om_btn_download_target').on('click', function() {
        air_download('PredictedKeyRegulators.txt', globals.omics.om_target_downloadtext)
    });

    var outputCanvas = document.getElementById('om_chart_target');

    var chartOptions = {
        type: 'bubble',        
        data: {
            datasets: [],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,                    
            animation: {
                duration: 0
            },
            hover: {
                animationDuration: 0
            },
            responsiveAnimationDuration: 0,
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
        
    }; 

    globals.omics.om_targetchart = new Chart(outputCanvas, chartOptions);            

    outputCanvas.onclick = function (evt) {

        if(globals.omics.om_targetchart)
        {
            // => activePoints is an array of points on the canvas that are at the same position as the click event.
            var activePoint = globals.omics.om_targetchart.lastActive[0]; //.getElementsAtEvent(evt)[0];

            if (activePoint !== undefined) {
                let name = globals.omics.om_targetchart.data.datasets[activePoint._datasetIndex].label;
                selectElementonMap(name, true);
                xp_setSelectedElement(name);
            }
        }
        // Calling update now animates element from oldValue to newValue.
    };       

    $("#om_chart_target").height(400);

    let t1 = performance.now()
    console.log("Call to AirOmics took " + (t1 - t0) + " milliseconds.")
}

function loggedin(){
    if (globals.omics.defaultusers.includes(globals.omics.user) === true) {
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

async function Start() {
    
    var text = await disablebutton("om_initializebtn");

    loadfile().then(function (lf) {
        if (lf != "") {
            alert(lf);
        }
        
        if(globals.omics.pvalue)
        {
            $("#om_pheno_pvaluethreshold-container").removeClass("air_disabledbutton");
            $("#om_pvaluethreshold-container").removeClass("air_disabledbutton");
        }
        else
        {
            $("#om_pheno_pvaluethreshold-container").addClass("air_disabledbutton");
            $("#om_pvaluethreshold-container").addClass("air_disabledbutton");
        }
        
        $("#om_pheno_resultscontainer").replaceWith('<div id="om_pheno_resultscontainer"></div>');
        $("#om_enrichr_resultscontainer").replaceWith(
            /*html*/`
            <div id="om_enrichr_resultscontainer"></div>
        `);
        $('#elementsreadinfile').html(Object.keys(globals.omics.ExpressionValues).length + " probes were mapped.");
        readExpressionValues().then(function (re) {
            normalizeExpressionValues().then(function (ne) {
                $('.air_btn_info[data-toggle="popover"]').popover();
                $('#om_pheno_analyzebtn').on('click', async function() {
                    var _text = await disablebutton("om_pheno_analyzebtn");
                    analyze().catch(function (error) {
                        alert(error);
                    }).finally(function (r) {
                        enablebtn("om_pheno_analyzebtn", _text);
                    });
                });

                let sampleSelect = document.getElementById('om_select_sample');

                for (let i = sampleSelect.options.length-1; i >= 0; i--) {
                    sampleSelect.options[i] = null;
                };

                for(let i = 0; i < globals.omics.samples.length; i++) {
                    sampleSelect.options[sampleSelect.options.length] = new Option(globals.omics.samples[i], i); 
                };

                globals.omics.Targets = {};
                globals.omics.targetsanalyzed = false;
                $("#om_maintab").removeClass("air_disabledbutton");

            }).catch(function (error) {
                alert('Failed to normalize the expression values.');
            });

        }).catch(function (error) {
            alert('Failed to calculate complex expression values.');
        });
        
    }).catch(function (error) {
        if (error != "") {
            alert(error);
        } else {
            alert('Could not read the file.');
        }

    }).finally(r => {
        enablebtn("om_initializebtn", text);
    });
}

$(document).on('click', '.clickPhenotypeinTable', function () {
    var sid = $(this).attr('data');
    globals.omics.selected = [];

    selectElementonMap(AIR.Phenotypes[sid].name, false);
});

$(document).on('change', '.om_clickCBinTable',function () {


    var id = $(this).attr('data');


    var chartresult = [];

    for (let value in AIR.Phenotypes[id].norm_results)
    {
        chartresult.push({
            y: AIR.Phenotypes[id].norm_results[value],
            //x: globals.omics.samples[j - 1]
        });
    }


    if ($(this).prop('checked') === true) {
;
        if(globals.omics.colors.length <= 0)
        {
            $(this).prop('checked', false);
            alert('Deselect an item before adding a new one');
            return;
        }
        var dataid = globals.omics.plevelchart_config.data.datasets.length;
        var color = globals.omics.colors[0];

        globals.omics.colors.shift();
        globals.omics.pickedcolors.push(color);

        globals.omics.plevelchart_config.data.datasets.push({
            label: AIR.Phenotypes[id].name,
            fill: false,
            data: chartresult,
            backgroundColor: color,
            borderColor: color
        });
    }
    else {
        let datasettoRemove = undefined;
        globals.omics.plevelchart_config.data.datasets.forEach(function (dataset) {
            if (dataset.label === AIR.Phenotypes[id].name) {
                datasettoRemove = dataset
            }
        });

        if (datasettoRemove) {
            var dataid = globals.omics.plevelchart_config.data.datasets.indexOf(datasettoRemove);
            var color = globals.omics.pickedcolors[dataid];
            globals.omics.colors.unshift(color);
            globals.omics.pickedcolors.splice(dataid, 1);
            globals.omics.plevelchart_config.data.datasets.splice(dataid, 1);
        }

    }

    globals.omics.plevelchart.update();
    var html = globals.omics.plevelchart.generateLegend().replace(/\"1-legend"/g, 'legend');
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

        
    $("#om_pheno_resultscontainer").replaceWith(
        /*html*/`
        <div id="om_pheno_resultscontainer">
            <hr>
            <div class="row mb-3">
                <div class="col-auto">
                    <div class="wrapper">
                        <button type="button" class="air_btn_info btn btn-secondary mb-4 ml-1"
                                data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Overlays"
                                data-content="Include values of the user data file in the overlays and color mapped nodes in the network.<br/>This may decrease the performance significantly">
                            ?
                        </button>
                    </div>
                </div>
                <div class="col">
                    <div class="cbcontainer">
                        <input type="checkbox" class="air_checkbox" id="checkbox_submap">
                        <label class="air_checkbox" for="checkbox_submap">Include values from the datafile?</label>
                    </div>
                </div>
            </div>

            <button type="button" id="om_addoverlaybtn"  class="air_btn btn btn-block mb-2 mt-2">Create Overlays</button>

            <button type="button" id="om_showonmapbtn"  class="air_btn btn btn-block mb-2">Show On Phenotype Submap</button>

            <div class="btn-group btn-group-justified">
                <div class="btn-group">
                    <button type="button" id="om_showoverlaybtn" class="air_btn btn mr-1">Show Overlays</button>
                </div>
                <div class="btn-group">
                    <button type="button" id="om_hideoverlaybtn" class="air_btn btn ml-1">Hide Overlays</button>
                </div>
            </div>
            <button type="button" id="om_removeoverlaybtn"  class="air_btn btn btn-block mb-2 mt-2">Remove Overlays</button>

            <hr>

            <button type="button" id="om_addimagebtn"  class="btn-image air_btn btn btn-block mb-2 mt-2">Generate Image</button>

            <div id="om_img_container" class="mb-2" style="width: 100%; margin: 0 auto"></div>

            <hr>

            <button id="om_btn_download_pheno" class="om_btn_download btn mb-4" style="width:100%"> <i class="fa fa-download"></i> Download results as .txt</button>

            <table class="air_table order-column hover" style="width:100%" id="om_resultstable" cellspacing=0></table>
            <canvas class="mb-2 mt-4" id="om_plevelchart"></canvas>
            <div id="om_legend" class="chart-legend"></div>
        </div>
    `);


    globals.omics.pickedcolors = [];

    var tbl = document.getElementById('om_resultstable');

    for (let phenotype in AIR.Phenotypes)
    {
        var result_row = tbl.insertRow(tbl.rows.length);
        var pname = AIR.Phenotypes[phenotype].name;

        globals.omics.om_phenotype_downloadtext += `\n${pname}`;
        checkBoxCell(result_row, 'th', pname, phenotype, 'center', "om_");
        let phenocell = createButtonCell(result_row, 'th', pname, phenotype, 'center');

        for (let sample in globals.omics.samples) {
            globals.omics.om_phenotype_downloadtext += `\t${AIR.Phenotypes[phenotype].norm_results[sample]}`;
            createPopupCell(result_row, 'td', AIR.Phenotypes[phenotype].norm_results[sample], 'col-3', 'center', om_createpopup, {"sample": sample, "phenotype": phenotype});
        }

        createCell(result_row, 'td', Math.round((AIR.Phenotypes[phenotype].accuracy + Number.EPSILON) * 10000) / 100, 'col-3', '', 'center');

        let genenumber = [];
        for(let sample in  AIR.Phenotypes[phenotype].GeneNumber)
        {
            genenumber.push(AIR.Phenotypes[phenotype].GeneNumber[sample]);
        }

        let numberofgenes = Object.keys(AIR.Phenotypes[phenotype].values).length;
        createCell(result_row, 'td', mean(genenumber) + " [" + (Math.round((standarddeviation(genenumber) + Number.EPSILON) * 100) / 100) + "] out of " + numberofgenes, 'col-3', '', 'center', true);

        let topgenes = "";

        var items = Object.keys(AIR.Phenotypes[phenotype].MainRegulators).map(function(key) {
            return [key, AIR.Phenotypes[phenotype].MainRegulators[key]];
          });

        items.sort(function(first, second) {
            return second[1] - first[1];
        });

        let c = items.length;
        if(c > 5)
            c = 5;

        for (i = 0; i < c; i++) 
        {
            topgenes += items[i][0];
            if(i < c-1)
            {
                topgenes += ", ";
            }
        }

        createCell(result_row, 'td', topgenes, 'col-3', '', 'center', true);

    }

    let header = tbl.createTHead();
    var headerrow = header.insertRow(0);

    createCell(headerrow, 'th', 'Graph', 'col-3', 'col', 'center');
    createCell(headerrow, 'th', 'Phenotype', 'col-3', 'col', 'center');


    for (let sample in globals.omics.samples) 
    {

        createCell(headerrow, 'th', globals.omics.samples[sample], 'col-3', 'col', 'center');
    }

    var $acc_cell = $(createCell(headerrow, 'th', 'Accuracy (%)', 'col-3', 'col', 'center'));
    $acc_cell.attr("title", "Accuracy represents the percentage of regulating elements (in proportion to their influence), for which a value was supplied by the data.");
    $acc_cell.attr("data-toggle", "tooltip");
    $acc_cell.tooltip();

    var $reg_cell = $(createCell(headerrow, 'th', '#Regulators', 'col-3', 'col', 'center'));
    $reg_cell.attr("title", "Average number of regulators with fold change value in the data [+ std. dev.] compared to the total number of the phenotype's regulators.");
    $reg_cell.attr("data-toggle", "tooltip");
    $reg_cell.tooltip();

    createCell(headerrow, 'th', 'Top 5 Regulators', 'col-3', 'col', 'center')



    $('#om_showoverlaybtn').on('click', async function() {
        let text = await disablebutton('om_showoverlaybtn');
        showOverlays(globals.omics.samplesResults).finally(rs => {
            enablebtn('om_showoverlaybtn',text);    
        })
    });
    $('#om_hideoverlaybtn').on('click', async function() {
        let text = await disablebutton('om_hideoverlaybtn');
        hideOverlays(globals.omics.samplesResults).finally(rs => {
            enablebtn('om_hideoverlaybtn',text); 
        }) 
    });
    $('#om_showonmapbtn').on('click', async function() {
        let text = await disablebutton('om_showonmapbtn');
        hideOverlays([], true).then(r => {
            showOverlays(globals.omics.samplesResults).then(s => {
                minervaProxy.project.map.openMap({ id: globals.phenotypeMapID });
                setTimeout(
                    enablebtn('om_showonmapbtn',text)
                    , 1000);
            }).catch(error => enablebtn('om_showonmapbtn',text));
        }).catch(error => enablebtn('om_showonmapbtn',text));
    });
    $('#om_addimagebtn').on('click', async  function() {
        let text = await disablebutton('om_addimagebtn');
        getImageSource().then(imglink => {

            $("#om_img_container").html(`
            <!-- Trigger the Modal -->
            <img id="om_resultsimg" class="air_image" src="${imglink}" alt="Phenotype Results" style="width:100%">
    
            <!-- The Modal -->
            <div id="om_om_resultsimg-modal" class="air_modal">
    
            <!-- The Close Button -->
            <span id="om_img_close" class="air_close_white">&times;</span>
    
            <!-- Modal Content (The Image) -->
            <img class="air_modal_content" id="om_img">
    
            <!-- Modal Caption (Image Text) -->
            <div id="om_img-caption" class="air_img_caption"></div>
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
            var span = document.getElementById("om_img_close");
    
            // When the user clicks on <span> (x), close the modal
            span.onclick = function() {
                modal.style.display = "none";
            }
            
        }).catch(error => alert(error)).finally(r => {
            enablebtn('om_addimagebtn',text);
        });
    });
    $('#om_addoverlaybtn').on('click', async function() {
        let text = await disablebutton('om_addoverlaybtn');
        AddOverlaysPromise(globals.omics.samplesResults).finally(ao => {
            $('.minerva-overlay-tab-link').click();
            enablebtn('om_addoverlaybtn',text);
        });
    });
    $('#om_removeoverlaybtn').on('click', async function() {
        let text = await disablebutton('om_removeoverlaybtn');
        removeOverlays(globals.omics.samplesResults).finally(r => {
            enablebtn('om_removeoverlaybtn',text); 
        });
    });


    $('.air_btn_info[data-toggle="popover"]').popover()
    $('#om_btn_download_phenot').on('click', function() {
        air_download('PhenotypeActivity.txt', globals.omics.om_phenotype_downloadtext)
    });


    //var colorschemes = require('chartjs-plugin-colorschemes');
    var outputCanvas = document.getElementById('om_plevelchart').getContext('2d');

    globals.omics.plevelchart_config = {
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
                    labels: globals.omics.samples,
                    ticks: {
                        min: globals.omics.samples[0],
                        max: globals.omics.samples[globals.omics.samples.length - 1]
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

    globals.omics.plevelchart = new Chart(outputCanvas, globals.omics.plevelchart_config);

    /*
    $("#om_legend > ul > li").on("click", function (e) {
        var index = $(this).index();
        $(this).toggleClass("strike")
        var ci = e.view.globals.omics.plevelchart;
        var curr = ci.data.datasets[0]._meta[0].data[index];
        curr.hidden = !curr.hidden
        ci.update();
    }) */

    $('#om_resultstable').DataTable({
        "order": [[ globals.omics.samples.length + 2, "desc" ]],  
        "scrollX": true
    });


    resolve(' ');
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
        output += '&zoomLevel=6';    
        resolve (output);
    });
}

function PhenotypeSP() {
    return new Promise((resolve, reject) => {

        let pvalue_threshold = 1;


        if(globals.omics.pvalue)
        {
            pvalue_threshold = parseFloat($("#om_pheno_pvaluethreshold").val().replace(',', '.'))
            if(isNaN(pvalue_threshold))
            {
                alert("Only (decimal) numbers are allowed as an p-value threshold. p-value was set to 1.")
                pvalue_threshold = 1;
            }
        }

        for (let phenotype in AIR.Phenotypes) {
            let accuracymax = 0;

            AIR.Phenotypes[phenotype].results = {};
            AIR.Phenotypes[phenotype].norm_results = {};
            AIR.Phenotypes[phenotype].accuracy = 0;
            AIR.Phenotypes[phenotype].MainRegulators = {};
            AIR.Phenotypes[phenotype].GeneNumber = {};
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

            for (let sample in globals.omics.samples) {
                let activity = 0.0;
                var accuracy = 0;
                AIR.Phenotypes[phenotype].GeneNumber[sample] = 0;
                for (let element in AIR.Phenotypes[phenotype].values) {

                    if(!globals.omics.ExpressionValues.hasOwnProperty(element))
                    {
                        continue;
                    }

                    let SP = AIR.Phenotypes[phenotype].values[element];


                    if (isNaN(SP))
                    {
                        continue;
                    }

                    let pvalue = globals.omics.ExpressionValues[element].pvalues[sample];

                    if(isNaN(pvalue))
                    {
                        pvalue = 1;
                    }

                    if(globals.omics.pvalue && pvalue >= pvalue_threshold)
                    {
                        continue;
                    }

                    let FC = globals.omics.ExpressionValues[element].nonnormalized[sample];

                    if(isNaN(FC) || FC === 0)
                    {
                        continue;
                    }

                    if (document.getElementById("om_checkbox_absolute").checked === true) {
                        FC = Math.abs(FC);
                        SP = Math.abs(SP);
                    }

                    if (document.getElementById("om_checkbox_pheno_pvalue").checked === true)
                    {
                        activity += FC * SP * (1 - pvalue)
                    }
                    else
                    {
                        activity += FC * SP; 
                    }

                    
                    accuracy += Math.abs(SP);
                    AIR.Phenotypes[phenotype].GeneNumber[sample] += 1;
                    
                    if(AIR.Molecules.hasOwnProperty(element))
                    {
                        if(AIR.Phenotypes[phenotype].MainRegulators.hasOwnProperty(AIR.Molecules[element].name))
                        {
                            AIR.Phenotypes[phenotype].MainRegulators[AIR.Molecules[element].name] += Math.abs(activity);
                        }
                        else
                        {
                            AIR.Phenotypes[phenotype].MainRegulators[AIR.Molecules[element].name] = Math.abs(activity);
                        }
                    }
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

function AddOverlaysPromise(samples = globals.omics.samples) {
    return new Promise((resolve, reject) => {
        function ajaxPostQuery(count) {
            return new Promise((resolve, reject) => {
                if (count <= samples.length) {
                    $.ajax({
                        method: 'POST',
                        url: minerva.ServerConnector._serverBaseUrl + 'api/projects/' + minervaProxy.project.data.getProjectId() + '/overlays/',

                        data: `content=name%09color${contentString(count-1)}&description=PhenotypeActivity&filename=${samples[count - 1]}.txt&name=${samples[count - 1]}&googleLicenseConsent=true`,
                        cookie: 'MINERVA_AUTH_TOKEN=xxxxxxxx',
                        success: (response) => {
                            ajaxPostQuery(count + 1).then(r =>
                                resolve(response));
                        },
                        error: (response) => {
                            reject();
                        }
                    })
                }
                else {
                    resolve('');
                }
            });
        }
        ajaxPostQuery(1).then(pr => {
            $("[name='refreshOverlays']").click();
            setTimeout(() => {
                resolve('');
            }, 400);
        }).catch(error => {
            reject('');
        })
    });
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

        globals.omics.pvalue = document.getElementById("om_checkbox_pvalue").checked;
        var _transcript = parseFloat($("#om_transcriptSelect").val());   

        if(!globals.omics.pvalue && _transcript == 5)
        {
            reject('Transcripts can not be mapped by their p-values if the file does not contain any p-values.');
        }

        globals.omics.numberofuserprobes = 0;

        var fileReader = new FileReader();
        fileReader.onload = function (fileLoadedEvent) {

            globals.omics.samples = [];
            globals.omics.samplestring = "";
            globals.omics.samplesResults = [];
            globals.omics.ExpressionValues = {};
            globals.omics.numberofuserprobes = 0;
            
            var datamapped = false;
            var textFromFileLoaded = fileLoadedEvent.target.result;
            if(textFromFileLoaded.trim() == "")
            {
                reject('The file appears to be empty.');
            }
            var firstline = true;

            let headerid = parseFloat($("#om_columnSelect").val());

            let _tempdata = {}

            even_count = 1;
            for(let i = 0; i < globals.omics.columnheaders.length; i++)
            {
                if(i === headerid)
                {
                    continue;
                }
                if(even_count%2 != 0 || globals.omics.pvalue == false)
                {
                    let samplename = globals.omics.columnheaders[i];
                    globals.omics.samples.push(samplename);
                    globals.omics.samplesResults.push(samplename + "_results");
                }
                even_count ++;
            }

            textFromFileLoaded.split('\n').forEach(function(line) {
                if (firstline === true) {
                    globals.omics.samplestring = line.substr(line.indexOf("\t") + 1);
                    firstline = false;
                }
                else {                   
                    if(line == ""){
                        return;
                    }
                    globals.omics.numberofuserprobes ++;
                    if(globals.omics.pvalue && line.split('\t').length != globals.omics.samples.length * 2 + 1 || globals.omics.pvalue == false && line.split('\t').length != globals.omics.samples.length + 1)
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

                    if(AIR.ElementNames[globals.omics.selectedmapping].hasOwnProperty(probeid))
                    {
                        let molecule_id = AIR.ElementNames[globals.omics.selectedmapping][probeid];

                        

                        if (!_tempdata.hasOwnProperty(molecule_id))
                        {
                            _tempdata[molecule_id] = {}
                        }
                        let even_count = 1;
                        let samplename = "";
                        let sampleid = 0;
                        for(let i = 0; i < entries.length; i++)
                        {
                            if(i === headerid)
                            {
                                continue;
                            }

                            var number = parseFloat(entries[i].replace(",", ".").trim());

                            if(even_count%2 != 0 || globals.omics.pvalue == false)
                            {
                                samplename = globals.omics.columnheaders[i];
                                sampleid = globals.omics.samples.indexOf(samplename, 0);

                                if(!_tempdata[molecule_id].hasOwnProperty(sampleid))
                                {
                                    _tempdata[molecule_id][sampleid] = {}
                                    _tempdata[molecule_id][sampleid]["values"] = []
                                    _tempdata[molecule_id][sampleid]["pvalues"] = []
                                }
                                _tempdata[molecule_id][sampleid]["values"].push(number)
                            }
                            if(even_count%2 == 0 && globals.omics.pvalue == true)
                            {
                                _tempdata[molecule_id][sampleid]["pvalues"].push(number)
                            }
                            
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
                            }

                            even_count++;
                        }  
                    } 
                }

            });
                   
            for(let molecule_id in _tempdata)
            {
                globals.omics.ExpressionValues[molecule_id] = {};
                globals.omics.ExpressionValues[molecule_id]["name"] = AIR.Molecules[molecule_id].name;
                globals.omics.ExpressionValues[molecule_id]["nonnormalized"] = {};
                globals.omics.ExpressionValues[molecule_id]["normalized"] = {};
                globals.omics.ExpressionValues[molecule_id]["pvalues"] = {};
                globals.omics.ExpressionValues[molecule_id]["custom"] = false;

                for(let sampleid in globals.omics.samples)
                {                             
                    switch(_transcript) {
                        case 0:
                            globals.omics.ExpressionValues[molecule_id]["nonnormalized"][sampleid] = mean(_tempdata[molecule_id][sampleid]["values"])
                            globals.omics.ExpressionValues[molecule_id]["pvalues"][sampleid] = mean(_tempdata[molecule_id][sampleid]["pvalues"])
                          break;
                        case 1:
                            {
                                let _id = indexOfLargest(_tempdata[molecule_id][sampleid]["values"])
                                globals.omics.ExpressionValues[molecule_id]["nonnormalized"][sampleid] = _tempdata[molecule_id][sampleid]["values"][_id]
                                globals.omics.ExpressionValues[molecule_id]["pvalues"][sampleid] = _tempdata[molecule_id][sampleid]["pvalues"][_id]
                            }
                          break;
                        case 2:
                            {
                                let _id = indexOfSmallest(_tempdata[molecule_id][sampleid]["values"])
                                globals.omics.ExpressionValues[molecule_id]["nonnormalized"][sampleid] = _tempdata[molecule_id][sampleid]["values"][_id]
                                globals.omics.ExpressionValues[molecule_id]["pvalues"][sampleid] = _tempdata[molecule_id][sampleid]["pvalues"][_id]
                            }
                          break;
                        case 3:
                            {
                                let _id = indexOfLargest(_tempdata[molecule_id][sampleid]["values"], absolute = true)
                                globals.omics.ExpressionValues[molecule_id]["nonnormalized"][sampleid] = _tempdata[molecule_id][sampleid]["values"][_id]
                                globals.omics.ExpressionValues[molecule_id]["pvalues"][sampleid] = _tempdata[molecule_id][sampleid]["pvalues"][_id]
                            }
                          break;
                        case 4:
                            {
                                let _id = indexOfSmallest(_tempdata[molecule_id][sampleid]["values"], absolute = true)
                                globals.omics.ExpressionValues[molecule_id]["nonnormalized"][sampleid] = _tempdata[molecule_id][sampleid]["values"][_id]
                                globals.omics.ExpressionValues[molecule_id]["pvalues"][sampleid] = _tempdata[molecule_id][sampleid]["pvalues"][_id]
                            }
                          break;
                        case 5:
                            {
                                let _id = indexOfSmallest(_tempdata[molecule_id][sampleid]["pvalues"])
                                globals.omics.ExpressionValues[molecule_id]["nonnormalized"][sampleid] = _tempdata[molecule_id][sampleid]["values"][_id]
                                globals.omics.ExpressionValues[molecule_id]["pvalues"][sampleid] = _tempdata[molecule_id][sampleid]["pvalues"][_id]
                            }
                          break;
                      }
                }
            }
            

            if(globals.omics.ExpressionValues.length === 0)
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
        for(let expression in globals.omics.ExpressionValues)
        {
            let _name = encodeURIComponent(globals.omics.ExpressionValues[expression].name);

            if(addednames.includes(_name))
                continue;
            addednames.push(_name);           
            
            let _value = globals.omics.ExpressionValues[expression].normalized[ID];
            let hex = rgbToHex((1 - Math.abs(_value)) * 255);
            output += `%0A${encodeURIComponent(_name)}`;
            if (_value > 0)
                output += '%09%23ff' + hex + hex;
            else if (_value < 0)
                output += '%09%23' + hex + hex + 'ff';
            else output += '%09%23ffffff';
        };
    }
    return output;
}

function getDataOverlays(samples, all = false) {
    return new Promise((resolve, reject) => {
        var overlays = minervaProxy.project.data.getDataOverlays();

        if(all)
        {
            resolve(overlays);
        }
        else
        {
            let olarray = [];
            for (let olCount = 0; olCount < overlays.length; olCount++) {
                if (samples.includes(overlays[olCount].name) === true) {
                    olarray.push(overlays[olCount])
                }
            }
            resolve(olarray);
        }
    });
}

function getOverlaysStrings() {
    var output = "";
    var overlays = minervaProxy.project.data.getDataOverlays();
    for (let olCount = 0; olCount < overlays.length; olCount++) {
        if (globals.omics.samplesResults.includes(overlays[olCount].name) === true) {
            output += overlays[olCount].id + ",";
        }
    }
    output = output.substring(0, output.length - 1);
    return output;
}

function hideOverlays(samples = [], all = false) {
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
        getDataOverlays(samples, all).then(ol => {
            hideOverlay(ol).then(rs => {
                $("[name='refreshOverlays']").click();
                setTimeout(() => {
                    resolve('');
                }, 400);
            });
        });
    });
}

function showOverlaysClick() {

    
    globals.omics.om_container.find('.om_btn-showoverlay')[0].innerHTML = '';
    globals.omics.om_container.find('.om_btn-showoverlay')[0].insertAdjacentHTML('beforeend', '<span class="loadingspinner spinner-border spinner-border-sm"></span>');

    $("#airomics_tab_content").addClass("air_disabledbutton");
    function enablebtn() {
        var btn = document.getElementById("om_showoverlaybtn");
        if (btn.childNodes.length > 0)
            btn.removeChild(btn.childNodes[0]);
        btn.innerHTML = 'Show Overlays';
        $("#airomics_tab_content").removeClass("air_disabledbutton");
    }
    showOverlays(false).finally(rs => {
        enablebtn();    
    })
}

function showOverlays(samples) {
    return new Promise((resolve, reject) => {
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

        getDataOverlays(samples).then(ol => {
            showOverlay(ol).then(rs => {
                $("[name='refreshOverlays']").click();
                setTimeout(() => {
                    resolve('');
                }, 400);
            });
        });
    });
}

function removeOverlays(samples) {
    return new Promise((resolve, reject) => {
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

        hideOverlays(samples = samples).then(rs => {
            setTimeout(
                getDataOverlays(samples).then(ols => {
                    ajaxDeleteQuery(ols).then(dr => {
                        $("[name='refreshOverlays']").click();            
                        setTimeout(() => {
                            resolve('');
                        }, 400);
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

            if(!globals.omics.ExpressionValues.hasOwnProperty(item))
            {
                globals.omics.ExpressionValues[item] = {}
                globals.omics.ExpressionValues[item]["name"] = AIR.Molecules[item].name;
                globals.omics.ExpressionValues[item]["normalized"] = {};
                globals.omics.ExpressionValues[item]["nonnormalized"] = {}
                globals.omics.ExpressionValues[item]["pvalues"] = {}
                globals.omics.ExpressionValues[item]["custom"] = true;
            }

            for (let sample in globals.omics.samples) {
                let _values = itemExpression(item, sample)
                globals.omics.ExpressionValues[item].nonnormalized[sample] = _values[0];
                globals.omics.ExpressionValues[item].pvalues[sample] = _values[1];
            }
        }

        function itemExpression(item, sample)
        {
            if(AIR.Molecules[item].complex == false && globals.omics.ExpressionValues.hasOwnProperty(item))
            {
                return [globals.omics.ExpressionValues[item]["nonnormalized"][sample], globals.omics.ExpressionValues[item]["pvalues"][sample]];
            }
            else if(AIR.Molecules[item].subunits.length > 0) {
                let sum = 0;
                let sumpvalue = 0;
                if(!AIR.Molecules[item].independent)
                {
                    sum = Number.MAX_SAFE_INTEGER;
                    sumpvalue = 1;
                }
                for(let subunit in AIR.Molecules[item].subunits)
                {
                    let subunitvalues = itemExpression(AIR.Molecules[item].subunits[subunit], sample)
                    let subunitvalue = subunitvalues[0];
                    let subunitpvalue = subunitvalues[1];

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
                    if(!isNaN(subunitpvalue))
                    {
                        if(AIR.Molecules[item].independent)
                        {
                            if(subunitpvalue < sumpvalue)
                                sumpvalue = subunitpvalue;
                        }
                        else if(subunitpvalue > sumpvalue)
                        {
                            sumpvalue = subunitpvalue;
                        }
                    }
                }

                return [( sum === Number.MAX_SAFE_INTEGER? 0 : sum), sumpvalue] ;
            }
            else {
                return [0,1];
            }
        }

        resolve('');
    });
}

function normalizeExpressionValues() {
    return new Promise((resolve, reject) => {
        let typevalue = $('#om_select_normalize').val();

        let allmax = 0.0;
        let alreadyincluded = [];
        let samplemaxvalues = [];
        let probemaxvalues = [];

        for (let sample in globals.omics.samples) {
            samplemaxvalues.push(0);
        }

        for (let expression in globals.omics.ExpressionValues) {

            let probemax = 0;
            for (let sample in globals.omics.samples) {
                let value = globals.omics.ExpressionValues[expression]["nonnormalized"][sample];
                if (value > allmax)
                    allmax = value;
                if (value > probemax)
                    probemax = value;
                if (value > samplemaxvalues[sample]) {
                    samplemaxvalues[sample] = value;
                }
            }
            globals.omics.ExpressionValues[expression].maxvalue = probemax;
        }

        for (let expression in globals.omics.ExpressionValues) {


            if (alreadyincluded.includes(name) === true)
                continue;

            let max = allmax;
            if (typevalue == 1) {
                max = globals.omics.ExpressionValues[expression].maxvalue;
            }

            for (let sample in globals.omics.samples) {
                if (typevalue == 2) {
                    max = samplemaxvalues[sample]
                }
                if(max <= 1)
                {
                    continue;
                }
                if (max > 0) {
                    globals.omics.ExpressionValues[expression]["normalized"][sample] = globals.omics.ExpressionValues[expression]["nonnormalized"][sample] / max;
                }
                else {
                    globals.omics.ExpressionValues[expression]["normalized"][sample] = globals.omics.ExpressionValues[expression]["nonnormalized"][sample];
                }
            }
        }

        resolve('');
    });
}

function normalizePhenotypeValues() {
    return new Promise((resolve, reject) => {
        let typevalue = $('#om_select_normalize').val();

        let allmax = 0.0;
        let alreadyincluded = [];
        let samplemaxvalues = [];

        for (let sample in globals.omics.samples) {
            samplemaxvalues.push(0);
        }

        for (let phenotype in AIR.Phenotypes) {

            let probemax = 0;
            for (let sample in globals.omics.samples) {
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

            for (let sample in globals.omics.samples) {
                if (allmax <= 1)
                {
                    AIR.Phenotypes[phenotype].norm_results[sample] = Math.round(((AIR.Phenotypes[phenotype].results[sample] / allmax) + Number.EPSILON) * 100) / 100;
                }
                if (typevalue == 2) {
                    max = samplemaxvalues[sample]
                }
                if (max > 1) {
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

async function OM_PredictTargets() {


    /*
    var btn = document.getElementById('om_btn_predicttarget');
    btn.innerHTML = '';
    btn.insertAdjacentHTML('beforeend', '<span class="loadingspinner spinner-border spinner-border-sm"></span>');
*/
    $("#om_btn_predicttarget").empty().append($(`
        <div class="air_progress position-relative">
            <div id="om_regulator_progress" class="air_progress_value"></div>
            <span id="om_regulator_progress_label" class="air_progress_label justify-content-center d-flex position-absolute w-100">0 %</span>
        </div>  
    `));
    
    $("#airomics_tab_content").addClass("air_disabledbutton");
    $("#om_regulator_progress").attr("aria-valuemax", Object.keys(AIR.Molecules).length);

    await calculateTargets();
}

async function setupTargetChart() {
    return new Promise(resolve => {
        setTimeout(function(){


            globals.omics.targettab.append($(`
            <div style="position: relative; max-height: 400px;">
                <canvas id="om_chart_target"></canvas>
            </div>
            <div id="om_legend_target" class="d-flex justify-content-center mt-2">
                <li class="legendli" style="color:#6d6d6d; font-size:90%;"><span class="legendspan" style="background-color:#00BFC4"></span>positive Regulator</li>
                <li class="legendli" style="margin-left:20px; color:#6d6d6d; font-size:90%;"><span class="legendspan" style="background-color:#F9766E"></span>negative Regulator</li>
                <li class="legendli" style="margin-left:16px; color:#6d6d6d; font-size:90%;"><span class="triangle"></span>External Link</li>
            </div>`));

            var outputCanvas = document.getElementById('om_chart_target');

            var chartOptions = {
                onAnimationComplete: function() {
                    globals.omics.om_targetchart.update();
                },
                type: 'bubble',        
                data: {
                    datasets: [],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,                    
                    animation: {
                        duration: 0
                    },
                    /*
                    hover: {
                        animationDuration: 0
                    },*/
                    responsiveAnimationDuration: 0,
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
                
            }; 
        
            globals.omics.om_targetchart = new Chart(outputCanvas, chartOptions);            
    
            outputCanvas.onclick = function (evt) {
    
                if(globals.omics.om_targetchart)
                {
                    // => activePoints is an array of points on the canvas that are at the same position as the click event.
                    var activePoint = globals.omics.om_targetchart.lastActive[0]; //.getElementsAtEvent(evt)[0];
    
                    if (activePoint !== undefined) {
                        let name = globals.omics.om_targetchart.data.datasets[activePoint._datasetIndex].label;
                        selectElementonMap(name, true);
                        xp_setSelectedElement(name);
                    }
                }
                // Calling update now animates element from oldValue to newValue.
            };        

            resolve('');
        }, 0);
    });
}

async function calculateTargets() {

    var sample = $('#om_select_sample').val(); 

    globals.omics.om_targetchart.data.datasets = [];
    let filter = $('#om_target_filter option:selected').text();
    globals.omics.om_target_downloadtext = `Sample: ${globals.omics.samples[sample]}\nFilter: ${filter}\n\nElement\tSpecificity\tSensitivity`;
    try 
    {
        await dataset();
        globals.omics.om_targetchart.update();
    }
    finally 
    {        
        $("#om_chart_target").height(400);
        $("#om_regulator_progress").hide();
        $("#om_btn_predicttarget").html('Predict Regulators');
        $("#airomics_tab_content").removeClass("air_disabledbutton");
    }
    async function dataset()
    {                
        targets = [];

        var promises = [];
        let transcriptomics = document.getElementById("om_transcriptomics").checked;
        let molLength = Object.keys(AIR.Molecules).length;
        let iterations = molLength;
        let count = 0;
        
        for (let e in AIR.Molecules) {

            if((++count) % 70 == 0)
            {
                await updateProgress(count, molLength, "om_regulator_progress");
            }

            if(AIR.Molecules[e].emptySP == true)
            {
                continue;
            }

            let last = !--iterations;
            let {name:_name, type:_type, phenotypes:_sp} = AIR.Molecules[e];

            if (_type.toLowerCase() === "phenotype") {
                continue;
            }

            let typevalue = $('#om_target_filter').val();
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

            promises.push(
                getMoleculeData(e).then(async (data) => {

                    let positiveSum = 0;
                    let positiveinhibitorySum = 0;
                    let positiveCount = 0;

                    let negativeSum = 0;
                    let negativeCount = 0;
            
                    for (let p in globals.omics.ExpressionValues) 
                    {
                        let value = globals.omics.ExpressionValues[p].nonnormalized[sample];
                        let SP = 0;

                        if(data.hasOwnProperty(p))
                        {
                            if (transcriptomics)
                            {
                                SP = data[p].i;
                            }
                            else
                            {
                                SP = 1 / (data[p].s * data[p].t);
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
                                {
                                    negativeSum += (1 - SP_abs);
                                }

                            }
                            negativeCount++;
                        }
                    }

                    let positiveSensitivity = 0;
                    let negativeSensitivity = 0;
                    if (positiveCount > 0) {
                        positiveSensitivity = positiveSum / positiveCount; //Math.round(((positiveSum / positiveCount) + Number.EPSILON) * 100) / 100;
                        negativeSensitivity = positiveinhibitorySum / positiveCount; // Math.round(((positiveinhibitorySum / positiveCount) + Number.EPSILON) * 100) / 100;
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

                    if(sensitivity > 0 && specificity >= 0)
                    {
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
                        globals.omics.om_target_downloadtext += `\n${_name}\t${specificity}\t${sensitivity}`;
                        await addValuetoChart(result);
                    }                    
                })
            );

        }

        return targets;
    }
}

async function addValuetoChart(value) {
    return new Promise(resolve => {
        setTimeout(function(){
            globals.omics.om_targetchart.data.datasets.push(value);
            globals.omics.om_targetchart.update();
            resolve('');
        }, 0);
    });
  }

async function enrichr() {

    $("#om_btn_enrichr").empty().append($(`
        <div class="air_progress position-relative">
            <div id="om_enrichr_progress" class="air_progress_value"></div>
            <span id="om_enrichr_progress_label" class="air_progress_label justify-content-center d-flex position-absolute w-100">0 %</span>
        </div>  
    `));

    let fc_threshold = parseFloat($("#om_fcthreshold").val().replace(',', '.'))
    if(isNaN(fc_threshold))
    {
        alert("Only (decimal) numbers are allowed as an FC threshold.")
        return;
    }
    let pvalue_threshold = 0;


    if(globals.omics.pvalue)
    {
        pvalue_threshold = parseFloat($("#om_pvaluethreshold").val().replace(',', '.'))
        if(isNaN(fc_threshold))
        {
            alert("Only (decimal) numbers are allowed as an p-value threshold.")
            return;
        }
    }
        
    $("#om_enrichr_resultscontainer").replaceWith(
        /*html*/`
        <div id="om_enrichr_resultscontainer" class="mt-4">
            <select id="om_select_enrichr_sample" class="browser-default xp_select custom-select mb-4">
                <option disabled selected value> -- select a sample -- </option>
            </select>
            <table class="air_table order-column hover nowrap" style="width:100%" id="om_enrichr_table" cellspacing=0>
                <thead>
                    <tr>
                        <th style="vertical-align: middle;">Rank</th>
                        <th style="vertical-align: middle;">Term</th>
                        <th style="vertical-align: middle;">adj. p-value</th>
                        <th style="vertical-align: middle;">Combined score</th>
                        <th style="vertical-align: middle;">Z-score</th>
                        <th style="vertical-align: middle;">Overlapping genes</th>
                    </tr>
                </thead>
            </table>
        </div>
    `);
    
    $("#om_enrichr").addClass("air_disabledbutton")
    
    var enrichrresults_table = $('#om_enrichr_table').DataTable({
        "order": [[ 0, "asc" ]],  
        "scrollX": true,
        "autoWidth": true,
        "columnDefs": [
            {
                targets: 0,
                className: 'dt-center',
            },
            {
                targets: 1,
                className: 'dt-center'
            },
            {
                targets: 2,
                className: 'dt-center'
            },
            {
                targets: 3,
                className: 'dt-center',
            },
            {
                targets: 4,
                className: 'dt-center'
            },
            {
                targets: 5,
                className: 'dt-left'
            }
        ]
    }).columns.adjust();;
    var enrichrsampleselect = document.getElementById('om_select_enrichr_sample');
    let i = 0;
    for(let sample in globals.omics.samples)
    {        
        enrichrsampleselect.options[enrichrsampleselect.options.length] = new Option(globals.omics.samples[sample], i); 
        i++;
    }

    let enrichresults = {}

    var s = document.getElementById("om_enrichrselect");
    var selectedenrichr = s.options[s.selectedIndex].text;

    let _count = 1;
    for(let sample in globals.omics.samples)
    {
        list_elements = []
        for(let e in globals.omics.ExpressionValues)
        {
            if(globals.omics.ExpressionValues[e]["custom"] == false && Math.abs(globals.omics.ExpressionValues[e]["nonnormalized"][sample]) >= fc_threshold && (globals.omics.pvalue == false || globals.omics.ExpressionValues[e]["pvalues"][sample] <= pvalue_threshold))
            {
                list_elements.push(globals.omics.ExpressionValues[e].name)
            }
        }
        let _results = await getEnrichr(list_elements, selectedenrichr);
        _results = _results[selectedenrichr];

        for(let p in _results)
        {
            let _name = _results[p][1]
            if(enrichresults.hasOwnProperty(_name) == false)
            {
                enrichresults[_name] = {}
            }
            enrichresults[_name][sample] = _results[p]
        }


        await updateProgress(_count++, globals.omics.samples.length, "om_enrichr_progress");
    }


    $('#om_select_enrichr_sample').on('change', function() {

        enrichrresults_table.clear();

        let _sample = enrichrsampleselect.selectedIndex - 1;

        for(let r in enrichresults)
        {
            if(enrichresults[r].hasOwnProperty(_sample))
            {
                var result_row =  [];
                result_row.push(enrichresults[r][_sample][0]);
                result_row.push(enrichresults[r][_sample][1]);
                if(enrichresults[r][_sample][6].toFixed(4) == 0 &&  enrichresults[r][_sample][6] != 0)
                    result_row.push(enrichresults[r][_sample][6].toExponential(4));
                else
                    result_row.push(enrichresults[r][_sample][6].toFixed(4));
                result_row.push(enrichresults[r][_sample][4].toFixed(4));
                result_row.push(enrichresults[r][_sample][3].toFixed(4));
                result_row.push(enrichresults[r][_sample][5]);

                enrichrresults_table.row.add(result_row)  
            }
        }

        enrichrresults_table.columns.adjust().draw();
    });
    
    
    $("#om_enrichr").removeClass("air_disabledbutton")
    $("#om_btn_enrichr").html('Fetch Enrichr Results');
}
async function getEnrichr(elements, selectedenrichr) {
    return new Promise((resolve, reject) => {

        let empty_results = {
                                selectedenrichr: {}
                            }

        if(elements.length == 0)
        {
            resolve(empty_results)
            return;
        }
        var formData = new FormData();
        formData.append('list', elements.join("\n"));

        var xhr = new XMLHttpRequest();
        // Add any event handlers here...
        xhr.open('POST', 'https://maayanlab.cloud/Enrichr/addList', true);
        xhr.onreadystatechange = function() {
            if (this.readyState == 4)
            {
                if(this.status == 200) {
                    $.ajax({
                        url: "https://maayanlab.cloud/Enrichr/enrich?userListId="+ JSON.parse(xhr.responseText)["userListId"] + "&backgroundType=" + selectedenrichr,
                        success: function (content) {
                            resolve(JSON.parse(content))
                        },
                        error: function () {
                            alert("Failed to fetch results from Enrichr.")
                            resolve(empty_results)
                        }
                    });
                }
                else {
                    alert("Failed to upload the following gene set to Enrichr:\n" + elements.join(", "))
                    resolve(empty_results)
                }
            }
        }
        xhr.send(formData);

    });
}

function om_createpopup(button, parameter) {
    var $target = $('#om_chart_popover');
    var $btn = $(button);

    let sample = parameter.sample
    let phenotype = parameter.phenotype
    if($target)
    {
        
        
        $('#om_clickedpopupcell').css('background-color', 'transparent');
        $('#om_clickedpopupcell').removeAttr('id');

        if($target.siblings().is($btn))
        {
            $target.remove();
            return;
        }   
        $target.remove();

    }

    $(button).attr('id', 'om_clickedpopupcell');
    $(button).css('background-color', 'lightgray');

    $target = $(`<div id="om_chart_popover" class="popover bottom in" style="max-width: none; top: 40px; z-index: 2;">
                    <div class="arrow" style="left: 9.375%;"></div>
                    <div id="om_chart_popover_content" class="popover-content">
                        <canvas class="popup_chart" id="om_popup_chart"></canvas>
                        <div id="om_legend_target" class="d-flex justify-content-center ml-2 mr-2 mt-2 mb-2">
                            <li class="legendli" style="color:#6d6d6d; font-size:100%; white-space: nowrap;">
                                <span class="legendspan_small" style="background-color:#009933"></span>
                                Activates Phenotype</li>
                            <li class="legendli" style="margin-left:5px; color:#6d6d6d; font-size:100%; white-space: nowrap;">
                                <span class="legendspan_small" style="background-color:#ffcccc"></span>
                                Represses Phenotype</li>
                            <li class="legendli" style="margin-left:5px; color:#6d6d6d; font-size:100%; white-space: nowrap;">
                                <span class="legendspan_small" style="background-color:#cccccc"></span>
                                Not diff. expressed</li>
                            <li class="legendli" style="margin-left:5px; color:#6d6d6d; font-size:100%; white-space: nowrap;">
                                <span class="triangle_small"></span>
                                External Link</li>
                        </div>
                    </div>
                </div>`);

    $btn.after($target);
    
    let targets = []
        
    for (let element in AIR.Phenotypes[phenotype].values) {


        let SP = AIR.Phenotypes[phenotype].values[element];
        if (isNaN(SP))
        {
            continue;
        }

        let hex = "#009933";
        let rad = 4;
        let FC = 0
        let pValue = 1
        if(globals.omics.ExpressionValues.hasOwnProperty(element))
        {
            FC = globals.omics.ExpressionValues[element].nonnormalized[sample];
            if(globals.omics.pvalue)
            {
                pValue = globals.omics.ExpressionValues[element].pvalues[sample];                    
                if(isNaN(pValue))
                    pValue = 1;
            }

            rad = 2

            if(globals.omics.pvalue)
            {
                rad = 1 + (5 * (1 - pValue));
            }

            if(isNaN(FC))
            {
                FC = 0;
                hex = "#cccccc"
            }               
            else if((SP * FC) < 0)
            {
                hex = "#ffcccc";
            }
            else if((SP * FC) === 0)
            {
                FC = 0;
                hex = "#cccccc"
            }
        }
        else
        {
            FC = 0;
            hex = "#cccccc"
            rad = 2
        }

        var pstyle = 'circle';
        if(AIR.MIMSpeciesLowerCase.includes(AIR.Molecules[element].name.toLowerCase()) === false)
        {
            pstyle = 'triangle'
        }


        targets.push(
            {
                label: AIR.Molecules[element].name,
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


    var outputCanvas = document.getElementById('om_popup_chart');

    var chartOptions = {
        type: 'bubble',        
        data: {
            datasets: targets,
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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
                top: 0
                }
            },
            title: {
                display: true,
                text: "Regulators for '" +AIR.Phenotypes[phenotype].name + "' in '" + globals.omics.samples[sample] + "'",
                fontFamily: 'Helvetica',
            },
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Influence on Phenotype'
                    },
                    ticks: {
                        beginAtZero: true,
                    }
                }],
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Fold Change in Data'
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
        
    }; 

    let popupchart = new Chart(outputCanvas, chartOptions);
    document.getElementById('om_popup_chart').onclick = function (evt) {
            var activePoint = popupchart.lastActive[0];
            if (activePoint !== undefined) {
                let name = popupchart.data.datasets[activePoint._datasetIndex].label;
                selectElementonMap(name, true);
                xp_setSelectedElement(name);
            }
    };
    $target.show();
};