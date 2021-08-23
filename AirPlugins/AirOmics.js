async function AirOmics(){    
    globals.omics = {
        enrichrtab: undefined,
        phenotab: undefined,
        targettab: undefined,
        resultscontainer: undefined,
        downloadtext: '',
        om_phenotype_downloadtext: '',
        om_targetchart: null,
        om_targettable: null,
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
        om_container: undefined,
        numberofuserprobes: 0,
        numberOfRandomSamples: 0,
        selected: [],
        colors: ["#4E79A7","#F28E2B","#E15759","#76B7B2","#59A14F","#EDC948", "#B07AA1","#FF9DA7","#9C755F","#BAB0AC"],
        pickedcolors: [],
        resultsTable: undefined,
        pvalue_threshold: 1,
        import_table: undefined,
        import_variant_table: undefined,
        import_massspec_table: undefined,
        overlay_suffix: "",
        saved_importdata: [{}],
        current_import_index: 0,
        import_data: {},

        seperator: "\t", 

        SamplesWithCalculatedSP: [],
        sc_chart: undefined,

        abbreviations: {
            "b": "Betweenness",
            "c": "Closeness",
            "i": "Indegree",
            "o": "Outdegree",
            "d": "Degree",
            "e": "Expression"
        },

        selectedDataType: "",

        pvalue_labels: ["pvalue", "en_pvalue"]//, "abs_en_pvalue"],
    }
    var t0 = performance.now();
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

    $("#airomics_tab").on('shown.bs.tab', function () {

        if(globals.omics.import_table)
            globals.omics.import_table.columns.adjust();
        if(globals.omics.resultsTable)
            globals.omics.resultsTable.columns.adjust();
        if(globals.omics.import_variant_table)
            globals.omics.import_variant_table.columns.adjust();
        if(globals.omics.import_massspec_table)
            globals.omics.import_massspec_table.columns.adjust();
    });

    $(
        /*<div class="text-center">
            <img src="https://www.sbi.uni-rostock.de/files/Projects/AIR/AIR3D_croped.png" class="img-fluid" width="100%">
        </div>*/
    /*html*/`
    
        <h4 class="mt-4 mb-4">1. Select Data</h4> 

        <ul class="air_nav_tabs nav nav-tabs mt-4" role="tablist">
            <li class="air_nav_item nav-item" style="width: 50%;">
                <a class="air_tab air_tab_sub active nav-link" id="om_data_upload-tab" data-toggle="tab" href="#om_data_upload" role="tab" aria-controls="om_data_upload" aria-selected="true">Upload</a>
            </li>
            <li class="air_nav_item nav-item" style="width: 50%;">
                <a class="air_tab air_tab_sub nav-link" id="om_data_import-tab" data-toggle="tab" href="#om_data_import" role="tab" aria-controls="om_data_import" aria-selected="false">Import from plugin</a>
            </li>
        </ul>
        <div class="tab-content air_tab_content">
            <div class="tab-pane show active air_sub_tab_pane mb-2" id="om_data_upload" role="tabpanel" aria-labelledby="om_data_upload-tab">
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
                                    data-content="A tab- or comma-delimited .txt file with log2 fold change (differential analysis) or normalized read count (single smaple analysis) values.<br/>
                                    One column must contain the official probe names or IDs.">
                                ?
                            </button>
                        </div>
                    </div>
                    <div class="col">
                        <input id="om_inputId" type="file" accept=".txt" class="air_inputfile inputfile" />
                    </div>
                </div>

                <div id="ms_mzSelect-container" class="row mb-2 mt-4">
                    <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right;">
                        <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">File Type:</span>
                    </div>
                    <div class="col">
                        <select id="om_filetypeSelect" class="browser-default ms_select custom-select">
                            <option value="0" selected>TSV</option>
                            <option value="1">CSV</option>
                        </select>
                    </div>
                </div>

                <div id="om_columnSelect-container" class="air_disabledbutton row mb-2 mt-2">
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
                            <option value="ncbigene">NCBI gene ID</option>
                            <option value="chebi">ChEBI ID</option>
                            <option value="ensembl">Ensembl ID</option>
                            <option value="mirbase.mature">MIRBase ID</option>
                        </select>
                    </div>
                </div>
                
                <div class="row mt-4 mb-4">
                    <div class="col-auto">
                        <div class="wrapper">
                            <button type="button" class="air_btn_info btn btn-secondary"
                                    data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Integrating p-Values"
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

                <div id="om_transcriptSelect-container" class="row mb-4">
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

                <div class="row mb-4">
                    <div class="col-auto">
                        <div class="wrapper">
                            <button type="button" class="air_btn_info btn btn-secondary"
                                    data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Analysis Type"
                                    data-content="Decides on which analyses can be performed.<br/>Differential analysis predicts regulated processes and drug targets from datasets containing log2 fold change values of gene expression or molecule levels.<br/>Single sample analysis will compare altered network topology between samples from a dataset with normalized read counts.">
                                ?
                            </button>
                        </div>
                    </div>
                    <div class="col-auto air_select_label" style="padding:0; width: 20%; text-align: right; ">
                        <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Type of Data:</span>
                    </div>
                    <div class="col">
                        <select id="om_analysistypeSelect" class="browser-default om_select custom-select">
                            <option value="0" selected>Differential</option>
                            <option value="1">Non-differential (Beta)</option>
                        </select>
                    </div>
                </div>

                <button type="button" id="om_initializebtn" class="air_btn btn btn-block air_disabledbutton mt-4 mb-2">Read Data File</button>
                <p class="ml-2" id="elementsreadinfile"></p>

            </div>
            <div id="om_dialog_confirm" hidden title="Data Overlap">
                
            </div>
            <div class="tab-pane air_sub_tab_pane mb-2" id="om_data_import" role="tabpanel" aria-labelledby="om_data_import-tab">
                <div id="om_import_variant_container" class="air_box_white">
                    <h4>Variant</h4>
                    <table class="air_table order-column hover" style="width:100%" id="om_import_variant_table" cellspacing=0>
                        <thead>
                            <tr>
                                <th style="vertical-align: middle;">Samples</th>
                                <th style="vertical-align: middle;">Convert to</th>
                            </tr>
                            <tbody>
                            </tbody>
                        </thead>
                    </table>    
                    <span id="om_import_variant_span">No data available.</span>
                    <button type="button" id="om_import_variant" class="air_btn btn btn-block air_disabledbutton mt-4 mb-2"><i class="fas fa-file-import"></i> Import from AirVariant</button>                
                </div>
                <hr>
                <div id="om_import_massspec_container" class="air_box_white">
                    <h4>MassSpec</h4>
                    <table class="air_table order-column hover" style="width:100%" id="om_import_massspec_table" cellspacing=0>
                        <thead>
                            <tr>
                                <th style="vertical-align: middle;">Samples</th>
                                <th style="vertical-align: middle;">Convert to</th>
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                    <span id="om_import_massspec_span">No data available.</span>
                    <div id="om_import_massspec_pvaluethreshold-container" class="row mt-4 mb-2">
                        <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right; ">
                            <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">p-value Threshold:</span>
                        </div>
                        <div class="col">
                            <input type="text" class="textfield" value="0.01" id="om_import_massspec_pvaluethreshold" onkeypress="return isNumber(event)" />
                        </div>
                    </div>
                    <button type="button" id="om_import_massspec" class="air_btn btn btn-block air_disabledbutton mt-4 mb-2"><i class="fas fa-file-import"></i> Import from AirMassSpec</button>
                </div>
                <div class="btn-group btn-group-justified mt-4 mb-4">
                    <div class="btn-group">
                        <button type="button" id="om_import_undo" class="air_btn btn mr-1" style="font-size: 14px;" ><i class="fas fa-undo"></i> Undo</button>
                    </div>
                    <div class="btn-group">
                        <button type="button" id="om_import_redo" class="air_btn btn ml-1" style="font-size: 14px;" ><i class="fas fa-redo"></i> Redo</button>
                    </div>
                </div>
                
                <table class="air_table order-column hover" style="width:100%" id="om_import_table" cellspacing=0/>

                <button type="button" id="om_initialize_import_btn" class="air_btn btn btn-block air_disabledbutton mt-4 mb-2">Initialize Data</button>

            </div>
        </div>
        <hr>

        <h4 class="mt-4 mb-4">2. Analyze Data</h4> 

        <div class="air_disabledbutton" id="om_maintab">

        </div>
    `).appendTo('#airomics_tab_content');

    $('#om_filetypeSelect').on('change', function() {
        switch(parseFloat($("#om_filetypeSelect").val()))
        {
            case 1:
                globals.omics.seperator = ",";
                break;
            case 0:
                globals.omics.seperator = "\t";
                break;
        }

        om_detectfile(true);
    });

    $('.air_btn_info[data-toggle="popover"]').popover();

    $('#om_inputId').on('change', function() {
        om_detectfile(false);
    });

    $('#om_mappingSelect').on('change', function() {
        globals.omics.selectedmapping = this.value;
    });

    $('#om_initializebtn').on('click', function() {
        Start(false);
    });
    

    $('#om_initialize_import_btn').on('click', function() {
        Start(true);
    });


    $("#om_import_massspec").on('click', importMassSpec);
    $('#om_import_variant').on('click', importVariant);

    $("#om_stat_spinner").remove();
    

    let t1 = performance.now()
    console.log("Call to AirOmics took " + (t1 - t0) + " milliseconds.")
}



async function createDifferentialAnalysisPanel()
{
    $("#om_maintab").empty().append(`            
        <ul class="air_nav_tabs nav nav-tabs" role="tablist">
            <li class="air_nav_item nav-item" style="width: 40%;">
                <a class="air_tab air_tab_sub active nav-link" id="om_regulation-tab" data-toggle="tab" href="#om_regulation" role="tab" aria-controls="om_regulation" aria-selected="true">Phenotype Inference</a>
            </li>
            <li class="air_nav_item nav-item" style="width: 35%;">
                <a class="air_tab air_tab_sub nav-link" id="om_target-tab" data-toggle="tab" href="#om_target" role="tab" aria-controls="om_target" aria-selected="false">Target Inference</a>
            </li>
            <li class="air_nav_item nav-item" style="width: 25%;">
                <a class="air_tab air_tab_sub nav-link" id="om_enrichr-tab" data-toggle="tab" href="#om_enrichr" role="tab" aria-controls="om_enrichr" aria-selected="false">Enrichr</a>
            </li>
        </ul>
        <div class="tab-content air_tab_content" id="om_tab">

        </div>`
    );
    globals.omics.phenotab = $(`
    <div class="tab-pane air_sub_tab_pane show active mb-2" id="om_regulation" role="tabpanel" aria-labelledby="om_regulation-tab">
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
            
            <button type="button" class="air_collapsible_smallgrey collapsed" data-toggle="collapse" data-target="#om_advancedsettings_panel">Advanced Settings</button>
            <div id="om_advancedsettings_panel" class="collapse air_box_lightgray">
            
                <h5>Filter Elements</h5>

                <div class="row mb-3">
                    <div class="col-auto">
                        <div class="wrapper">
                            <button type="button" class="air_btn_info btn btn-secondary mb-4 ml-1"
                                    data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Include data in overlays"
                                    data-content="If check, elements from submaps will be considered only. This will increase accuracy if many DCEs are available.">
                                ?
                            </button>
                        </div>
                    </div>
                    <div class="col">
                        <div class="cbcontainer">
                            <input type="checkbox" class="air_checkbox" id="checkbox_submap" checked>
                            <label class="air_checkbox" for="checkbox_submap">Use submap elements only</label>
                        </div>
                    </div>
                </div>

                <div id="om_pheno_pvaluethreshold-container" class="row mb-3">
                    <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right; ">
                        <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">p-value Threshold:</span>
                    </div>
                    <div class="col">
                        <input type="text" class="textfield" value="0.05" id="om_pheno_pvaluethreshold"/>
                    </div>
                </div>
                
                <div id="om_pheno_fcthreshold-container" class="row mb-1">
                    <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right; ">
                        <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Abs logFC Threshold:</span>
                    </div>
                    <div class="col">
                        <input type="text" class="textfield" value="0" id="om_pheno_fcthreshold"/>
                    </div>
                </div>

                <div class="row mt-2 mb-1">
                    <div class="col-auto">
                        <div class="wrapper">
                            <button type="button" class="air_btn_info btn btn-secondary"
                                    data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Influence value filtering"
                                    data-content="Influence threshold (between 0 and 1) for regulators of phenotype to be considered for the analysis. Increasing the threshold may result in higher accuracy, if many significant probes are available.<br/>">
                                ?
                            </button>
                        </div>
                    </div>
                    <div class="col" style="width: 40%; padding-right: 0">
                        <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Influence Threshold:</span>
                    </div>
                    <div class="col-auto" style="width: 7%; padding: 0">
                        <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;" id="om_ithreshold_value">0</span>
                    </div>
                    <div class="col-auto" style="width: 50%; padding-top: 5px; padding-right: 40px;">
                        <input type="range" style="width: 100%;" value="0" min="0" max="1" step="0.01" class="slider air_slider" id="om_ithreshold_slider">
                    </div>
                </div>
                
                <hr>

                <h5>Additional Settings</h5>

                <div class="row mt-1 mb-1">
                    <div class="col-auto">
                        <div class="wrapper">
                            <button type="button" class="air_btn_info btn btn-secondary"
                                    data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Absolute values"
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

                <div class="row mt-1 mb-1">
                    <div class="col-auto">
                        <div class="wrapper">
                            <button type="button" class="air_btn_info btn btn-secondary"
                                    data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="p-value weighting"
                                    data-content="If checked, p-values are included as a weighting factor for phenotype regulators.<br/>">
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

                <h5>Statistics</h5>

                <div id="om_pheno_randomsampleNumber-container" class="row mb-4">
                    <div class="col-auto">
                        <div class="wrapper">
                            <button type="button" class="air_btn_info btn btn-secondary ml-1"
                                    data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Statistical evaluation."
                                    data-content="Number n of random samples to be generated for statistical evaluation. The p-values smaller than 1/n will be 0. The calculation time is proportional to n.">
                                ?
                            </button>
                        </div>
                    </div>
                    <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right; ">
                        <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;"># of random Samples:</span>
                    </div>
                    <div class="col">
                        <input type="text" class="textfield" value="1000" id="om_pheno_randomsampleNumber" onkeypress="" />
                    </div>
                </div>

                <hr>

                <h5>Output</h5>
                
                <div class="row mt-1 mb-1">
                    <div class="col-auto">
                        <div class="wrapper">
                            <button type="button" class="air_btn_info btn btn-secondary"
                                    data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Absolute values"
                                    data-content="If checked, results with a p-value < 0.05 will be set to 0 and excluded from the normalization.<br/>">
                                ?
                            </button>
                        </div>
                    </div>
                    <div class="col">
                        <div class="cbcontainer">
                            <input type="checkbox" class="air_checkbox" id="om_checkbox_exclude_ns">
                            <label class="air_checkbox" for="om_checkbox_exclude_ns">Set non-significant phenotypes to zero?</label>
                        </div>
                    </div>
                </div>

            </div>

            <button type="button" id="om_pheno_optimize" class="air_btn_light btn btn-block mt-2">Optimize Settings</button>
                
            <hr>

            <button type="button" id="om_pheno_analyzebtn" class="air_btn btn btn-block mt-2">Estimate Phenotype Levels</button>

        </div>

        <div id="om_pheno_resultscontainer"></div>
    </div>
    `
    ).appendTo('#om_tab');
    
    updateConsideredElements();

    $('#om_pheno_optimize').on('click', async function (e) {
        var text = await disablebutton("om_pheno_optimize");
        optimizePhenotypeSettings().then(success => {
            //updateConsideredElements();
            if(success)
                alert("Phenotype estimation settings have been optimize to fit your data. Please check manually before starting the analysis.");
            else
                alert("Settings could not be adjusted to achieve optimal results. Your data may have to few signifcant elements or the elements are not included in the AIR. However, you can still perform the analysis. Please check the settings manually beforehand.");
            enablebtn("om_pheno_optimize", text)
        });
    });

    $('#om_ithreshold_slider').on('input', function (e) {
        $("#om_ithreshold_value").html($(this).val());
    });
    $('#om_ithreshold_slider').on('change', function (e) {
        updateConsideredElements();
    });
    $('#om_pheno_fcthreshold').on('change keypress paste input', function (e) {
        if(isNumber(e))
        {
            updateConsideredElements();
        }
        else
        {
            false
        }
    });
    $('#om_pheno_pvaluethreshold').on('change keypress paste input', function (e) {        
        if(isNumber(e))
        {
            updateConsideredElements();
        }
        else
        {
            false
        }
    });
    $('#checkbox_submap').on('input', function (e) {
        updateConsideredElements();
    });
    globals.omics.targettab = $(`<div class="tab-pane air_sub_tab_pane mb-2" id="om_target" role="tabpanel" aria-labelledby="om_target-tab">
        <div class="air_alert alert alert-warning mb-4">
            <span>This requires much more computationally intensive calculations that need to fetch a larger amount of data. The calculation speed mainly depends on your internet bandwidth.<br/>We also recommend having at least 1 GB of RAM available.</span>
            <button type="button" class="air_close close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>  
        <label class="air_label mt-1" style="font-weight: bold;">Sample:</label>
        <select id="om_select_sample" class="browser-default om_select custom-select mb-1" style="border: solid 1px; font-weight: bold;">
        </select>
        <hr>
        <label class="air_label mt-1">Regulator Type Filter:</label>
        <select id="om_target_filter" class="browser-default om_select custom-select mb-1">
            <option value="0">All Elements</option>
            <option value="1">Proteins</option>
            <option value="5">Receptors</option>
            <option value="2">miRNAs</option>
            <option value="3">lncRNAs</option>
            <option value="4" selected>Transcription Factors</option>
        </select>
        <hr>
        <div class="row mt-2 mb-2">
            <div class="col-auto">
                <div class="wrapper">
                    <button type="button" class="air_btn_info btn btn-secondary"
                            data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Influence value filtering"
                            data-content="Number of targets combinations for which a combined score should be calculated. Increasing this value has drastic effect on calculation time and requires enabling memory storage.">
                        ?
                    </button>
                </div>
            </div>
            <div class="col" style="width: 40%; padding-right: 0">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">#Target Combinations:</span>
            </div>
            <div class="col-auto" style="width: 7%; padding: 0">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;" id="om_targetcomb_value">1</span>
            </div>
            <div class="col-auto" style="width: 50%; padding-top: 5px; padding-right: 40px;">
                <input type="range" style="width: 100%;" value="1" min="1" max="4" step="1" class="slider air_slider" id="om_targetcomb_slider">
            </div>
        </div>
        <div id="om_target_pvaluethreshold-container" class="row mb-2">
            <div class="col-auto air_select_label" style="padding:0; width: 50%; text-align: right; ">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Number of predicted targets:</span>
            </div>
            <div class="col">
                <input type="text" class="textfield" value="" id="om_target_targetnumber" onkeypress="return isNumber(event)" />
            </div>
        </div>
        
        <hr>
        <div class="row mt-2 mb-2">
            <div class="col-auto">
                <div class="wrapper">
                    <button type="button" class="air_btn_info btn btn-secondary"
                            data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Influence value filtering"
                            data-content="Predicted targets are ranked by their accuracy, i.e., the correspondece to induce upregulated elements or inhibit downregulated elements and vice versa. Eliminating background noise in the dataset increases the accuracy.">
                        ?
                    </button>
                </div>
            </div>
            <div class="col">
                <h3 class="mb-2">Filter dataset:</h3>  
            </div>
        </div>

        <div id="om_target_pvaluethreshold-container" class="row mb-2">
            <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right; ">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Abs logFC Threshold:</span>
            </div>
            <div class="col">
                <input type="text" class="textfield" value="1.0" id="om_target_fcthreshold" onkeypress="return isNumber(event)" />
            </div>
        </div>
        <div id="om_target_pvaluethreshold-container" class="row mb-2">
            <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right; ">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">p-value Threshold:</span>
            </div>
            <div class="col">
                <input type="text" class="textfield" value="0.05" id="om_target_pvaluethreshold" onkeypress="return isNumber(event)" />
            </div>
        </div>

        <hr>

        <div class="row mt-2 mb-2">
            <div class="col-auto">
                <div class="wrapper">
                    <button type="button" class="air_btn_info btn btn-secondary"
                            data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Filter"
                            data-content="If checked, targets with FCs contrary to their predicted regulation are filtered out.">
                        ?
                    </button>
                </div>
            </div>
            <div class="col">
                <div class="cbcontainer">
                    <input type="checkbox" class="air_checkbox" id="om_target_filtercontrary" checked>
                    <label class="air_checkbox" for="om_target_filtercontrary">Filter contrary results?</label>
                </div>
            </div>
        </div> 
        <div class="air_alert alert alert-info mt-2">
            <span>During the first run, large amounts of data must be retrieved. The calculation time depends on your Internet bandwidth.</span>
            <button type="button" class="air_close close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div> 
        <div class="row mt-2 mb-4">
            <div class="col-auto">
                <div class="wrapper">
                    <button type="button" class="air_btn_info btn btn-secondary"
                            data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Storing Data"
                            data-content="If checked, data required for the target prediction will be safed in memory after the first execution. Turn off if only low memory but a high bandwidth is available.">
                        ?
                    </button>
                </div>
            </div>
            <div class="col">
                <div class="cbcontainer">
                    <input type="checkbox" class="air_checkbox" id="om_target_usememory" checked>
                    <label class="air_checkbox" for="om_target_usememory">Store data in memory</label>
                </div>
            </div>
        </div>
        <button type="button" id="om_btn_predicttarget" class="air_btn btn btn-block mt-1 mb-1">Predict Targets</button>   
        <hr>
    </div>`).appendTo('#om_tab');

    $('#om_targetcomb_slider').on('input', function (e) {
        $("#om_targetcomb_value").html($(this).val());
        switch (parseFloat($(this).val())) {
            case 1:
                $("#om_target_targetnumber").val("")
                break;
            case 2:
                $("#om_target_targetnumber").val(50)
                break;
            case 3:
                $("#om_target_targetnumber").val(20)
                break;
            case 4:
                $("#om_target_targetnumber").val(10)
                break;
        }
    });

    
    let sampleSelect = document.getElementById('om_select_sample');

    for (let i = sampleSelect.options.length-1; i >= 0; i--) {
        sampleSelect.options[i] = null;
    };

    for(let i = 0; i < globals.omics.samples.length; i++) {
        sampleSelect.options[sampleSelect.options.length] = new Option(globals.omics.samples[i], i); 
    };


    globals.omics.enrichrtab = $(`
        <div class="tab-pane air_sub_tab_pane mb-2" id="om_enrichr" role="tabpanel" aria-labelledby="om_enrichr-tab">
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
    
    $('#om_pheno_analyzebtn').on('click',  om_PhenotypeSP);

    $("#om_enrichr_progress").attr("aria-valuemax", Object.keys(globals.omics.samples).length);

    $("#om_btn_predicttarget").on('click', function() { 
        if(parseFloat($('#om_targetcomb_slider').val()) > 1 && document.getElementById("om_target_usememory").checked == false)
        {
            alert("Storage in memory is required for calculation target combinations.")
            return;
        }           
        OM_PredictTargets();
    });
    $("#om_btn_enrichr").on('click', function() {            
        enrichr();
    });
    
    $('#om_import_undo').on('click', function() {
        if(globals.omics.current_import_index <= 0)
        {
            return;
        }
        $("#om_import_redo").removeClass("air_disabledbutton"); 
        globals.omics.current_import_index -= 1;
        globals.omics.import_data = JSON.parse(JSON.stringify(globals.omics.saved_importdata[globals.omics.current_import_index]));

        updateImportTable();

        if(globals.omics.current_import_index == 0)
        {
            $(this).addClass("air_disabledbutton");
        }
    });
    $('#om_import_redo').on('click', function() {
        if(globals.omics.current_import_index >= (globals.omics.saved_importdata.length))
        {
            return;
        }
        globals.omics.current_import_index += 1;
        globals.omics.import_data = JSON.parse(JSON.stringify(globals.omics.saved_importdata[globals.omics.current_import_index]));

        updateImportTable();

        if(globals.omics.current_import_index == (globals.omics.saved_importdata.length - 1))
        {
            $(this).addClass("air_disabledbutton");
        }
    });

    globals.omics.targettab.append($(`
        <ul class="air_nav_tabs nav nav-tabs" role="tablist">
            <li class="air_nav_item nav-item" style="width: 50%;">
                <a class="air_tab air_tab_sub active nav-link om_target_tabs" id="om_target_chart-tab" data-toggle="tab" href="#om_target_chart" role="tab" aria-controls="om_target_chart" aria-selected="true">Chart</a>
            </li>
            <li class="air_nav_item nav-item" style="width: 50%;">
                <a class="air_tab air_tab_sub nav-link om_target_tabs" id="om_target_table-tab" data-toggle="tab" href="#om_target_table" role="tab" aria-controls="om_target_table" aria-selected="false">Table</a>
            </li>
        </ul>
        <div class="tab-content air_tab_content">                    
            <div class="tab-pane show active air_sub_tab_pane mb-2" id="om_target_chart" role="tabpanel" aria-labelledby="om_target_chart-tab"> 
                <div style="position: relative; max-height: 400px;">
                    <canvas id="om_target_chart_canvas" style="height: 400px;"></canvas>
                </div>
                <div id="om_legend_target" class="d-flex justify-content-center mt-2">
                    <li class="legendli" style="color:#C00000; font-size:90%;"><span class="triangle" style="background-color:#FFFFFF"></span>positive Targets</li>
                    <li class="legendli" style="margin-left:20px; color:#0070C0; font-size:90%;"><span class="triangle_down" style="background-color:#FFFFFF"></span>negative Targets</li>
                    <li class="legendli" style="margin-left:20px; color:#a9a9a9; font-size:100%;"><span class="legendspan" style="background-color:#a9a9a9"></span>combined</li>
                </div>
            </div>
            <div class="tab-pane air_sub_tab_pane mb-2" id="om_target_table" role="tabpanel" aria-labelledby="om_target_table-tab"> 
                <table class="air_table order-column hover nowrap  mt-2" style="width:100%" id="om_target_chart_table" cellspacing=0>
                    <thead>
                        <tr>
                            <th style="vertical-align: middle;">Element</th>
                            <th style="vertical-align: middle;">Type</th>
                            <th style="vertical-align: middle;">Sensitivity</th>
                            <th style="vertical-align: middle;">Specificity</th>
                            <th style="vertical-align: middle;">FC</th>
                            <th style="vertical-align: middle;">Regulators</th>
                        </tr>
                    </thead>
                </table>  
            </div>
        </div>
        <button id="om_btn_download_target" class="om_btn_download btn mt-4" style="width:100%"> <i class="fa fa-download"></i> Download results as .txt</button>
        `));

    $('.om_target_tabs[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        if(globals.omics.om_targettable)
            globals.omics.om_targettable.columns.adjust();
    });

    $('#om_btn_download_target').on('click', function() {
        air_download("TargetPrediction.txt", getDTExportString(globals.omics.om_targettable))
    });

    var outputCanvas = document.getElementById('om_target_chart_canvas');

    var chartOptions = {
        type: 'bubble',        
        data: {
            datasets: [],
        },
        options: {
            plugins: {
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
                        // Boolean to enable zooming
                        enabled: true,
                        // Zooming directions. Remove the appropriate direction to disable 
                        // Eg. 'y' would only allow zooming in the y direction
                        mode: 'xy',
                    }
                }
            },
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
                        var label = data.datasets[tooltipItem.datasetIndex].label.split(";");

                        if(label.length < 3)
                            return "";

                        return [
                            "Name: " + label[0],
                            ... label[1] ? ["FC: " + label[1]] : [], 
                            "p-value: " + + label[2], 
                            "Effect: " + label[3], 
                            "Sensitivity: " + expo(tooltipItem.yLabel, 3, 3),
                            "Specificity: " + expo(tooltipItem.xLabel, 3, 3),
                        ];
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
                if(name)
                {
                    name = name.split(";")[0];
                }
                else
                {
                    return;
                }
                selectElementonMap(name, true);
                xp_setSelectedElement(name);
            }
        }
        // Calling update now animates element from oldValue to newValue.
    };       

    $("#om_target_chart_canvas").height(400);

    globals.omics.om_targettable = $('#om_target_chart_table').DataTable({
        "dom": '<"top"<"left-col"B><"right-col"f>>rtip',
        "buttons": [
            {
                text: 'Copy',
                className: 'air_dt_btn',
                action: function () {
                    copyContent(getDTExportString(globals.omics.om_targettable));
                }
            },
            {
                text: 'CSV',
                className: 'air_dt_btn',
                action: function () {
                    air_download("Predicted_targets.csv", getDTExportString(globals.omics.om_targettable, seperator = ","))
                }
            },
            {
                text: 'TSV',
                className: 'air_dt_btn',
                action: function () {
                    air_download("Predicted_targets.txt", getDTExportString(globals.omics.om_targettable))
                }
            }
        ],   
        "order": [[ 0, "asc" ]], 
        "scrollX": true,
        "table-layout": "fixed",
        "autoWidth": true,
        columnDefs: [
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
    }).columns.adjust().draw();

    
    $('.air_btn_info[data-toggle="popover"]').popover();

            
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
}

function createScAnalysisPanel()
{
    $("#om_maintab").empty().append(`            
        <div class="mb-2 mt-4" style="overflow: hidden;">
            <div class="air_checkboxlist_container">
                <label>Control Samples</label>
                <div class="air_checkboxlist_scroll_container">
                    <ul class="air_checkboxlist" id="om_sc_control_sample_list">
                    </ul>
                </div>
            </div>
            <div class="air_checkboxlist_container">
                <label>Case Samples</label>
                <div class="air_checkboxlist_scroll_container">
                    <ul  class="air_checkboxlist" id="om_sc_case_sample_list">
                    </ul>
                </div>
            </div>
        </div>

        <div class="row mt-2 mb-2">
            <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right; ">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Read count threshold:</span>
            </div>
            <div class="col">
                <input type="text" class="textfield" value="5" id="om_sc_threshold" onkeypress="return isNumber(event)" />
            </div>
        </div>

        <button type="button" class="air_btn btn btn-block air_disabledbutton mt-4 mb-2" id="om_sc_calculateSP">Compare Samples</button>

        <hr>

        <div class="row mt-2 mb-2">
            <div class="col-2 air_select_label">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Type Filter:</span>
            </div>
            <div class="col" style="width: 80%; padding-left: 8px">
                <select id="om_sc_selecttype" class="browser-default ms_axis_select custom-select">
                    <option value="0" selected>All Elements</option>
                    <option value="1">Proteins</option>
                    <option value="5">Receptors</option>
                    <option value="2">miRNAs</option>
                    <option value="3">lncRNAs</option>
                    <option value="4">Transcription Factors</option>
                </select>
            </div>
        </div>

        <hr>

        <div class="row mt-2 mb-2">
            <div class="col-2 air_select_label">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">X-Axis:</span>
            </div>
            <div class="col" style="width: 80%; padding-left: 8px">
                <select id="om_sc_selectxaxis" class="browser-default ms_axis_select custom-select">
                    <option value="e">Expression</option>
                    <option value="b">Betweenness</option>
                    <option value="c">Closeness</option>
                    <option value="i">Indegree</option>
                    <option value="o">Outdegree</option>
                    <option selected value="d">Degree</option>
                </select>
            </div>
        </div>
        <div class="row mt-2 mb-2">
            <div class="col-2 air_select_label">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Y-Axis:</span>
            </div>
            <div class="col" style="width: 80%; padding-left: 8px">
                <select id="om_sc_selectyaxis" class="browser-default ms_axis_select custom-select">
                    <option value="e">Expression</option>
                    <option selected value="b">Betweenness</option>
                    <option value="c">Closeness</option>
                    <option value="i">Indegree</option>
                    <option value="o">Outdegree</option>
                    <option value="d">Degree</option>
                </select>
            </div>
        </div>
        <div class="row mt-2 mb-2">
            <div class="col-2 air_select_label">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Color:</span>
            </div>
            <div class="col" style="width: 80%; padding-left: 8px">
                <select id="om_sc_selectcolor" class="browser-default ms_axis_select custom-select">
                    <option value="n">None</option>
                    <option selected value="e">Expression</option>
                    <option value="b">Betweenness</option>
                    <option value="c">Closeness</option>
                    <option value="i">Indegree</option>
                    <option value="o">Outdegree</option>
                    <option value="d">Degree</option>
                </select>
            </div>
        </div>
        <hr>

        <div class="cbcontainer">
            <input type="checkbox" class="air_checkbox" id="sc_checkbox_zerovalues" checked>
            <label class="air_checkbox air_checkbox_label" for="sc_checkbox_zerovalues">Hide zero values?</label>
        </div>

        <hr>

        <div id="om_sc_chartpanel">
    `
    );

    for(let i in globals.omics.samples)
    {
        $("#om_sc_control_sample_list").append(`<li>
            <input class="ms_sample_item" id="om_sc_sampleitem_control_${i}" data="${i}" type="checkbox">
            <label class="air_checkbox" for="om_sc_sampleitem_control_${i}">${globals.omics.samples[i]}</label>
        </li>`)
        $("#om_sc_case_sample_list").append(`<li>
            <input class="ms_sample_item" id="om_sc_sampleitem_case_${i}" data="${i}" type="checkbox">
            <label class="air_checkbox" for="om_sc_sampleitem_case_${i}">${globals.omics.samples[i]}</label>
        </li>`)  
    }

    $('#sc_checkbox_zerovalues').on('change', function() {
        if(!globals.omics.sc_chart)
            return;
        analyzeSCData();
    });
    $('#om_sc_calculateSP').on('click', function() {
        analyzeSCData();
    });
    $('#om_sc_selecttype').on('change', function() {
        if(!globals.omics.sc_chart)
            return;
        analyzeSCData();
    });
    $('#om_sc_selectxaxis').on('change', function() {
        if(!globals.omics.sc_chart)
            return;
        analyzeSCData();
    });
    $('#om_sc_selectyaxis').on('change', function() {
        if(!globals.omics.sc_chart)
            return;
        analyzeSCData();
    });
    $('#om_sc_selectcolor').on('change', function() {
        if(!globals.omics.sc_chart)
            return;
        analyzeSCData();
    });
    
    
    $('.air_btn_info[data-toggle="popover"]').popover();

    async function analyzeSCData() {
        disablediv("airomics_tab_content");

        let control_samples = []
        let case_samples = []

        $("#om_sc_control_sample_list input:checked").each(function () {
            control_samples.push($(this).attr("data"))
        }) 
        $("#om_sc_case_sample_list input:checked").each(function () {
            case_samples.push($(this).attr("data"))
        }) 

        $("#om_sc_calculateSP").empty().append($(`
            <div class="air_progress position-relative">
                <div id="om_sc_calculateSP_progress" class="air_progress_value"></div>
                <span id="om_sc_calculateSP_progress_label" class="air_progress_label justify-content-center d-flex position-absolute w-100">0 %</span>
            </div>  
        `));

        let uniquesamples = Array.from(new Set([control_samples, case_samples]));
        let iterations = Object.keys(AIR.Molecules).length;
        let totalIterations = 0;
        let count = 0;
        let elementlists = {}
        
        _threshold = parseFloat($("#om_sc_threshold").val().replace(',', '.')) || 5

        for(var s of uniquesamples)
        {           
            if(globals.omics.SamplesWithCalculatedSP.hasOwnProperty(s) && globals.omics.SamplesWithCalculatedSP[s] == _threshold)
            {
                continue;
            }

            let elementids = Object.keys(AIR.Molecules).filter(m => (AIR.Molecules[m].type != "PROTEIN" && AIR.Molecules[m].type != "RNA") || (globals.omics.ExpressionValues.hasOwnProperty(m) && globals.omics.ExpressionValues[m].nonnormalized[s] > _threshold))
            elementlists[s] = elementids;
            totalIterations += elementids.length
        }
        for(let s in elementlists)
        {
            count += await calculateshortestPath(s, elementlists[s], count, totalIterations, "om_sc_calculateSP", "  Recalculate network topology for " + Object.keys(elementlists).length + " samples.");            
            globals.omics.SamplesWithCalculatedSP[s] = _threshold;
        }

        $("#om_sc_calculateSP").html('Compare Samples');

        if(globals.omics.sc_chart)
            globals.omics.sc_chart.destroy();
        $("#om_sc_chartpanel").empty().append(`
            <div style="position: relative; max-height: 400px;">
                <canvas id="om_sc_results_canvas" style="height: 400px;"></canvas>
            </div>
            <div id="om_legend_target" class="d-flex justify-content-center mt-2">
                <li class="legendli" style="margin-left:20px; color:#6d6d6d; font-size:90%;"><span class="legendspan" style="background-color:#808080"></span>in Submap</li>
                <li class="legendli" style="margin-left:16px; color:#6d6d6d; font-size:90%;"><span class="triangle"></span>External Link</li>
            </div>
        `)

        let xvalue = $("#om_sc_selectxaxis").val();
        let yvalue = $("#om_sc_selectyaxis").val();
        let cvalue = $("#om_sc_selectcolor").val();

        var outputCanvas = document.getElementById('om_sc_results_canvas');
        var chartOptions = {
            type: 'scatter',        
            data: {
                datasets: [],
            },
            options: { 
                plugins: {
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
                            // Boolean to enable zooming
                            enabled: true,
                            // Zooming directions. Remove the appropriate direction to disable 
                            // Eg. 'y' would only allow zooming in the y direction
                            mode: 'xy',
                        }
                    }
                },
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
                    text: '',
                    fontFamily: 'Helvetica',
                    fontColor: '#6E6EC8',
                    fontStyle: 'bold'
                },
                scales: {
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: "log2 FC " + globals.omics.abbreviations[yvalue]
                        },
                    }],
                    xAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: "log2 FC " + globals.omics.abbreviations[xvalue]
                        },
                    }]
                },
                tooltips: {
                    callbacks: {
                        label: function (tooltipItem, data) {
                            var label = data.datasets[tooltipItem.datasetIndex].label.split(";");

                            if(label.length < 5)
                                return "";  

                            return ([
                                "Name: " + label[0],
                                "Type: " + label[1],
                                globals.omics.abbreviations[xvalue] + ": " + label[2], 
                                globals.omics.abbreviations[yvalue] + ": " + label[3], 
                            ]).concat(cvalue != "n"? [
                                globals.omics.abbreviations[cvalue] + ": " + label[4],
                            ] : []);             
                        }
                    }
                }
            }
        }; 

        globals.omics.sc_chart = new Chart(outputCanvas, chartOptions); 

        outputCanvas.onclick = function (evt) {

            if(globals.omics.sc_chart)
            {
                // => activePoints is an array of points on the canvas that are at the same position as the click event.
                var activePoint = globals.omics.sc_chart.lastActive[0]; //.getElementsAtEvent(evt)[0];
    
                if (activePoint !== undefined) {
                    let name = globals.omics.sc_chart.data.datasets[activePoint._datasetIndex].label.split(";")[0];

                    if(name)
                    {
                        selectElementonMap(name, true);
                        xp_setSelectedElement(name);
                    }

                }
            }
            // Calling update now animates element from oldValue to newValue.
        };       
    
        let typevalue = $('#om_sc_selecttype').val();
        
        for(let e in AIR.Molecules)
        {
            let {type:_type, subtype:_subtype} = AIR.Molecules[e];

            if (typevalue == 1) {
                if (_type != "PROTEIN") {
                    continue;
                }
            }
            if (typevalue == 2) {
                if (_subtype != "miRNA") {
                    continue;
                }
            }
            if (typevalue == 3) {
                if (_subtype != "lncRNA") {
                    continue;
                }
            }
            if (typevalue == 4) {
                if (_subtype != "TF") {
                    continue;
                }
            } 
            if (typevalue == 5) {
                if (_subtype != "RECEPTOR") {
                    continue;
                }
            } 
            
            let element = AIR.Molecules[e];

            let control_x_values = [];
            let case_x_values = [];
            let control_y_values = [];
            let case_y_values = [];
            let control_c_values = [];
            let case_c_values = [];

            for(let s of control_samples)
            {
                control_x_values.push(_getScValue(xvalue, e, s))
                control_y_values.push(_getScValue(yvalue, e, s))
                if(cvalue != "n")
                    control_c_values.push(_getScValue(cvalue, e, s))
            }
            for(let s of case_samples)
            {
                case_x_values.push(_getScValue(xvalue, e, s))
                case_y_values.push(_getScValue(yvalue, e, s))

                if(cvalue != "n")
                    case_c_values.push(_getScValue(cvalue, e, s))
            }

            
            let logx = Math.log2((mean(case_x_values) + 1)/(mean(control_x_values) + 1)) || 0;
            let logy = Math.log2((mean(case_y_values) + 1)/(mean(control_y_values) + 1)) || 0;

            if(document.getElementById("sc_checkbox_zerovalues").checked === true && (logy == 0 || logx == 0))
                continue;
            else if(logy == 0 && logx == 0)
            {
                continue;
            }
            
            let logc = Math.log2((mean(case_c_values) + 1)/(mean(control_c_values) + 1)) || 0;
            let hex = (cvalue != "n"? valueToHex(logc/2) : "#808080");

            var pstyle = 'circle';
            if(AIR.MapSpeciesLowerCase.includes(element.name.toLowerCase()) === false)
            {
                pstyle = 'triangle'
            }

            globals.omics.sc_chart.data.datasets.push({
                label: [element.name, _subtype, expo(logx), expo(logy), expo(logc)].join(";"),
                data: [{
                    x: logx,
                    y: logy,
                    r: 7,
                }],
                backgroundColor: hex,
                hoverBackgroundColor: hex,
                pointStyle: pstyle,
            });

        }

        globals.omics.sc_chart.update();
        enablediv("airomics_tab_content");
        var objDiv = document.getElementById("airomics_tab_content");
        objDiv.scrollTop = objDiv.scrollHeight;
    }

    function _getScValue(abbr, element, sample)
    {
        if(abbr == "e")
        {            
            var fcValue = globals.omics.ExpressionValues[element].nonnormalized[sample];
            if(fcValue && fcValue > _threshold)
                return fcValue;
            else
                return 0;
        }
        else
        {
            return AIR.Molecules[element].Centrality[globals.omics.abbreviations[abbr]][sample];
        }
    }

}

function om_detectfile(force_seperator) {

    if(document.getElementById("om_inputId").files.length == 0)
    {
        $("#om_mappingselect-container").addClass("air_disabledbutton");
        $("#om_columnSelect-container").addClass("air_disabledbutton");
        $("#om_initializebtn").addClass("air_disabledbutton");
        return false;
    }
    var fileToLoad = document.getElementById("om_inputId").files[0];
    var fileReader = new FileReader();
    fileReader.readAsText(fileToLoad, "UTF-8");

    fileReader.onload = function (fileLoadedEvent) {
        var success = false;
        globals.omics.columnheaders = [];
        $("#om_columnSelect").empty();

        var textFromFileLoaded = fileLoadedEvent.target.result;

        if(textFromFileLoaded.trim() == "")
        {
            return stopfile('The file appears to be empty.');
        }

        var stop_break = false;
        for(let line of textFromFileLoaded.split('\n'))
        {
            for(var _entry of line.split("\t"))
            {
                var _value = Number(_entry)

                if(!isNaN(_value))
                {
                    if(_value < 0)
                    {
                        $("#om_analysistypeSelect").val(0);
                        stop_break = true;
                        break;
                    }
                    if(Math.abs(_value) > 100)
                    {
                        $("#om_analysistypeSelect").val(1);
                        stop_break = true;
                        break;
                    }
                }
            }
            if(stop_break)
            {
                break;
            }
        }
        var firstline = textFromFileLoaded.split('\n')[0];

        if(!force_seperator)
        {
            if((firstline.match(new RegExp(",", "g")) || []).length > (firstline.match(new RegExp("\t", "g")) || []).length )
            {
                globals.omics.seperator = ",";
                $("#om_filetypeSelect").val(1);
            }
            else
            {
                globals.omics.seperator = "\t";
                $("#om_filetypeSelect").val(0);
            }
        }

        var index = 0;
        firstline.split(globals.omics.seperator).forEach(entry => {
            let header = entry;
            globals.specialCharacters.forEach(c => {
                header = header.replace(c, "");
            })
            globals.omics.columnheaders.push(header.trim());                 
            index ++; 
        })

        $('#om_checkbox_pvalue').prop('checked', false);
        
        if ((globals.omics.columnheaders.length - 1)%2 == 0)
        {
            for(let _header of globals.omics.columnheaders)
            {
                if(["pval", "p.val", "p-val"].some(x => _header.toLowerCase().includes(x)))
                {
                    $('#om_checkbox_pvalue').prop('checked', true);
                    break;
                }
            }

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
            if(alerttext != "")
                alert(alerttext);
            $("#om_mappingselect-container").addClass("air_disabledbutton");
            $("#om_columnSelect-container").addClass("air_disabledbutton");
            $("#om_initializebtn").addClass("air_disabledbutton");
            success = false;
            return false;
        }

        return success;
    };
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

async function Start(imported) {
    
    var text = await disablebutton("om_initializebtn");

    om_loadfile(imported).then(function (lf) {
        if (lf != "") {
            alert(lf);
        }
        
        $("#om_pheno_resultscontainer").replaceWith('<div id="om_pheno_resultscontainer"></div>');
        $("#om_enrichr_resultscontainer").replaceWith(
            /*html*/`
            <div id="om_enrichr_resultscontainer"></div>
        `);
        $('#elementsreadinfile').html(numberOfUserProbes() + " probes were mapped.");

        adjustdata(imported).then(function (ad) {
            readExpressionValues().then(function (re) {
                normalizeExpressionValues().then(function (ne) {
                    $('.air_btn_info[data-toggle="popover"]').popover();

                    globals.omics.Targets = {};
                    globals.omics.targetsanalyzed = false;
                    globals.omics.SamplesWithCalculatedSP = [];

                    if($("#om_analysistypeSelect").val() == 0)
                    {
                        createDifferentialAnalysisPanel();
                    }
                    else
                    {
                        createScAnalysisPanel();
                    }

                    $("#om_maintab").removeClass("air_disabledbutton");

                }).catch(function (error) {
                    console.log(error)
                    alert('Failed to normalize the expression values.');
                });

            }).catch(function (error) {
                console.log(error)
                alert('Failed to calculate complex expression values.');
            });
        }).catch(function (error) {
            console.log(error)
            alert('Failed to Merge the new data.');
        });
        
    }).catch(function (error) {
        if (error != "") {
            console.log(error)
            alert(error);
        } else {
            alert('Could not read the file.');
        }

    }).finally(r => {
        enablebtn("om_initializebtn", text);
    });
}   

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}


async function om_createTable(param) {
    
    return new Promise((resolve, reject) => {
    if(globals.omics.resultsTable)
        globals.omics.resultsTable.destroy();
        
    $("#om_pheno_resultscontainer").replaceWith(
        /*html*/`
        <div id="om_pheno_resultscontainer">

            <hr>

            <h4 class="mt-4 mb-4">Results</h4> 

            <hr>

            <h5 class="mt-4 mb-4" style="font-weight: bold;">Overview</h5> 
            
            <div id="om_select_pvalue-container" class="row mb-2">
                <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right; ">
                    <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Statistical method:</span>
                </div>
                <div class="col">
                    <select id="om_select_pvalue" class="browser-default om_select custom-select">                        
                        <option value="2">Level-based</option>
                        <option value="1">Distribution-based</option>
                        <option value="3"  selected>Lowest p-value of both</option>
                        <option value="0">Highest p-value of both</option>
                    </select>
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-auto">
                    <div class="wrapper">
                        <button type="button" class="air_btn_info btn btn-secondary mb-4 ml-1"
                                data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Include data in overlays"
                                data-content="If checked, FDR correction using Benjamini-Hochberg will be performed on the p-values.">
                            ?
                        </button>
                    </div>
                </div>
                <div class="col">
                    <div class="cbcontainer">
                        <input type="checkbox" class="air_checkbox" id="om_cb_fdr" checked>
                        <label class="air_checkbox" for="om_cb_fdr">FDR Correction?</label>
                    </div>
                </div>
            </div>
            <button id="om_btn_download_pheno" class="om_btn_download btn mb-4" style="width:100%"> <i class="fa fa-download"></i> Download results as .txt</button>
            <div id="om_tablemodal_container" class="mb-2" style="width: 100%; margin: 0 auto"></div>
            <div id="om_resultstable_container" class="mb-2">
                <table class="hover air_table" id="om_resultstable" cellspacing=0></table>
            </div>

            <button type="button" class="air_collapsible_smallgrey collapsed" data-toggle="collapse" data-target="#om_resultsgraph_panel">Results Graph:</button>
            <div id="om_resultsgraph_panel" class="collapse air_box_lightgray">
                <canvas class="mb-2 mt-4" id="om_plevelchart"></canvas>
                <div id="om_legend" class="chart-legend"></div>
            </div>
            
            <hr>

            <h5 class="mt-4 mb-4" style="font-weight: bold;">Show on Map</h4> 
            
            <div class="row mb-3">
                <div class="col-auto">
                    <div class="wrapper">
                        <button type="button" class="air_btn_info btn btn-secondary mb-4 ml-1"
                                data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Include data in overlays"
                                data-content="Include values of the user data file in the overlays and color mapped nodes in the network.<br/>This may decrease the performance significantly">
                            ?
                        </button>
                    </div>
                </div>
                <div class="col">
                    <div class="cbcontainer">
                        <input type="checkbox" class="air_checkbox" id="checkbox_datavalues_overlay">
                        <label class="air_checkbox" for="checkbox_datavalues_overlay">Include values from the datafile in visualization?</label>
                    </div>
                </div>
            </div>
            <div id="om_overlay_pvalue_threshold-container" class="row mb-2">
                <div class="col-auto air_select_label" style="padding:0; width: 50%; text-align: right; ">
                    <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Phenotype p-value threshold:</span>
                </div>
                <div class="col">
                    <input type="text" class="textfield" value="0.05" id="om_overlay_pvalue_threshold" onkeypress="return isNumber(event)" />
                </div>
            </div>

            <div id="om_overlay_suffix-container" class="row mb-4">
                <div class="col-auto air_select_label" style="padding:0; width: 50%; text-align: right; ">
                    <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Overlay suffix:</span>
                </div>
                <div class="col">
                    <input type="text" class="textfield" value="" id="om_overlay_suffix"/>
                </div>
            </div>

            <button type="button" id="om_addoverlaybtn"  class="air_btn_light btn btn-block mb-2 mt-2">Create Overlays</button>

            <button type="button" id="om_showonmapbtn"  class="air_disabledbutton air_btn_light btn btn-block mb-2">Show On Phenotype Submap</button>

            <div class="btn-group btn-group-justified">
                <div class="btn-group">
                    <button type="button" id="om_showoverlaybtn" class="air_disabledbutton air_btn_light btn mr-1">Show Overlays</button>
                </div>
                <div class="btn-group">
                    <button type="button" id="om_hideoverlaybtn" class="air_disabledbutton air_btn_light btn ml-1">Hide Overlays</button>
                </div>
            </div>
            <button type="button" id="om_removeoverlaybtn"  class="air_btn_light btn btn-block mb-2 mt-2">Remove Overlays</button>

            <hr>

            <button type="button" id="om_addimagebtn"  class="air_disabledbutton btn-image air_btn_light btn btn-block mb-2 mt-2">Generate Image</button>

            <div id="om_img_container" class="mb-2" style="width: 100%; margin: 0 auto"></div>
            
        </div>
    `);

    function updatepvalues() {
        if(!globals.omics.resultsTable)
            return;

        let onlysignificant = document.getElementById("om_checkbox_exclude_ns").checked === true? true : false;
        globals.omics.resultsTable.rows().every( function ( rowIdx, tableLoop, rowLoop ) {
            
            var rowNode = this.node();
            let phenotype = $(rowNode).attr("data");
            if(!phenotype)
            {
                return;
            }
            let numberofsignsamples = 0
            $(rowNode).find("td").each(function (){
                    if($(this).hasClass("om_resultvalue"))
                    {
                        let sample = $(this).attr("data");
                        let pvalue = getPvalue(phenotype, sample);

                        let level = onlysignificant && pvalue > 0.05? 0 : AIR.Phenotypes[phenotype].norm_results[sample];

                        $('b:first', this).html(level);
                        $('span:first', this).html(`(${expo(pvalue)})`);
                        $(this).attr("data-order", pvalue);
                        if(pvalue < 0.05)
                        {
                            $(this).css('background-color', '#ffcccb');
                            numberofsignsamples++;
                        }
                        else
                        {
                            $(this).css('background-color', 'transparent');
                        }

                        
                    }    
                    else if($(this).hasClass("om_signsamples"))
                    {
                        $(this).html(numberofsignsamples)
                    }                           
            });
            $(rowNode).find("td").each(function (){
                           
            });
            this.invalidate();
        } ); 
        
        globals.omics.resultsTable.draw(false);
    }

    $("#om_cb_fdr").on('click', updatepvalues);
    $("#om_checkbox_exclude_ns").on('click', updatepvalues);
    $("#om_select_pvalue").on('change', updatepvalues);
    $("#om_select_normalize").on('change', function () {
        om_normalizePhenotypeValues().then(async function (pv) {
            updatepvalues();
        });
    });

    globals.omics.pickedcolors = [];

    var tbl = document.getElementById('om_resultstable');

    for (let phenotype in AIR.Phenotypes)
    {
        let result_row = tbl.insertRow(tbl.rows.length);
        result_row.setAttribute('data', phenotype);
        let pname = AIR.Phenotypes[phenotype].name;

        let cbcell = checkBoxCell(result_row, 'th', pname, phenotype, 'center', "om_");
        cbcell.onclick = function () {


            var id = $(this).attr('data');
        
        
            var chartresult = [];
        
            for (let value in AIR.Phenotypes[id].norm_results)
            {
                chartresult.push({
                    y: AIR.Phenotypes[id].norm_results[value],
                    //x: globals.omics.samples[j - 1]
                });
            }
        
        
            if ($(this).prop('checked') == true) {
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
        };

        let phenocell = createButtonCell(result_row, 'th', "<b>" +  pname + "</b>", 'center');
        phenocell.onclick = function () {
            globals.omics.selected = [];
            selectElementonMap(pname, false);
        };

        let genenumber = [];
        let pvalues = 0;
        
        for (let sample in globals.omics.samples) {

            let pvalue = getPvalue(phenotype, sample);
            let samplecell = createPopupCell(result_row, 'td', "<b>" +  AIR.Phenotypes[phenotype].norm_results[sample] + '</b><br><span style="white-space:nowrap">(' + expo(pvalue, 2, 2) + ")", 'col-auto om_resultvalue', 'center', om_createpopup, {"sample": sample, "phenotype": phenotype, "FilteredElements": param.FilteredElements, "FilteredRegulators": param.correctSPs}, order = pvalue);
            samplecell.setAttribute('data', sample);
            genenumber.push(AIR.Phenotypes[phenotype].genenumbers[sample]);
            if(pvalue < 0.05)
            {
                pvalues++;
            }
        }


        createCell(result_row, 'td', pvalues, 'om_signsamples col-auto', 'col', 'center', true);
        
        createCell(result_row, 'td', expo(AIR.Phenotypes[phenotype].accuracy*100), 'col-auto', 'col', 'center');

        let meannumberofgenes = mean(genenumber);
        createCell(result_row, 'td', expo(meannumberofgenes) + " [" + (Math.round((standarddeviation(genenumber) + Number.EPSILON) * 100) / 100) + "] out of " + Object.keys(param.correctSPs[phenotype]).length, 'col-auto', 'col', 'center', true, order= meannumberofgenes);


        let topgenes = [];

        var items = Object.keys(AIR.Phenotypes[phenotype].MainRegulators).map(function(key) {
            return [key, AIR.Phenotypes[phenotype].MainRegulators[key]];
          });

        items.sort(function(first, second) {
            return second[1] - first[1];
        });

        for (i = 0; i < (items.length > 5? 5: items.length); i++) 
        {
            topgenes.push(getLinkIconHTML(items[i][0]));
        }

        createCell(result_row, 'td', `<div style="white-space: nowrap; overflow-x: auto;">
                                        ${topgenes.join(", ")}
    </div>`, 'col-auto', 'col', 'left', true);

    }

    let header = tbl.createTHead();
    var headerrow = header.insertRow(0);

    createCell(headerrow, 'th', 'Graph', 'col', 'col', 'center');
    createCell(headerrow, 'th', 'Phenotype', 'col', 'col', 'center');

    let columnsdefs = [{
        targets: 0,
        className: 'dt-center',
    },
    {
        targets: 1,
        className: 'dt-center',
    }]
    let columns = [
        { "width": "8px" },
        { "width": "300px" }];


    for (let sample in globals.omics.samples) 
    {

        let headercell = createCustomLinkCell(headerrow, 'th', globals.omics.samples[sample], 'col-auto', 'col', 'center').parentElement;
        headercell.innerHTML += "<br>(p-value)"
        
        $(headercell.getElementsByTagName('a')[0]).click("click", function(event){ 
            event.stopPropagation();
            var highlightelements = {}
            for (let phenotype in AIR.Phenotypes)
            {
                highlightelements[AIR.Phenotypes[phenotype].name] =  valueToHex(AIR.Phenotypes[phenotype].norm_results[sample])
            }
            ColorElements(highlightelements)
        });
        
        columns.push({ "width": "30px" });
        columnsdefs.push({
            targets: parseFloat(sample) + 2,
            className: 'dt-center',
        })
    }
    columns.push({ "width": "12px" });
    columns.push({ "width": "10px" });
    columns.push({ "width": "40px" });
    columns.push(null);
    
    var $pvalue_cell = $(createCell(headerrow, 'th', '# sign. samples', 'col-auto', 'col', 'center'));
    $pvalue_cell.attr("title", "Number of samples with a p-value < 0.05");
    $pvalue_cell.attr("data-toggle", "tooltip");
    $pvalue_cell.tooltip();

    columnsdefs.push({
        targets: globals.omics.samples.length + 2,
        className: 'dt-center',
    })

    var $acc_cell = $(createCell(headerrow, 'th', 'Saturation (%)', 'col-auto', 'col', 'center'));
    $acc_cell.attr("title", "Saturation represents the percentage of regulating elements (in proportion to their influence), for which a value was supplied by the data.");
    $acc_cell.attr("data-toggle", "tooltip");
    $acc_cell.tooltip();

    columnsdefs.push({
        targets: globals.omics.samples.length + 3,
        className: 'dt-center',
    })

    var $reg_cell = $(createCell(headerrow, 'th', '#Regulators', 'col-auto', 'col', 'center'));
    $reg_cell.attr("title", "Average number of regulators with fold change value in the data [+ std. dev.] compared to the total number of the phenotype's regulators.");
    $reg_cell.attr("data-toggle", "tooltip");
    $reg_cell.tooltip();

    columnsdefs.push({
        targets: globals.omics.samples.length + 4,
        className: 'dt-center',
    })

    createCell(headerrow, 'th', 'Top 5 Regulators', 'col-auto', 'col', 'left')

    $("#om_tablemodal_container").html(`
        <!-- The Modal -->
        <div id="om_table_modal" class="air_modal">

            <!-- The Close Button -->
            <span id="om_img_close" class="air_close_white">&times;</span>
            <!-- Modal Content (The Image) -->
            <div class="air_modal_content" id="om_table_modal_content"></div>

        </div>`);

    // Get the modal

    let modal = document.getElementById("om_table_modal");
    $('#om_table_modal').on('shown.bs.modal', function (e) {
        $.fn.dataTable.tables({ visible: true, api: true }).columns.adjust();
    });
    // Get the <span> element that closes the modal
    let span = document.getElementById("om_img_close");
    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
        $('#om_resultstable_container').prepend($('#om_resultstable_wrapper'))
        $('#om_resultstable_wrapper').css("background-color", "transparent");
        modal.style.display = "none";
        $.fn.dataTable.tables({ visible: true, api: true }).columns.adjust().draw();
    }

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
            <img class="air_modal_content" id="om_img" style="width:100%">
    
            <!-- Modal Caption (Image Text) -->
            <div id="om_img-caption" class="air_img_caption"></div>
            </div>`);

            // Get the modal
            var image_modal = document.getElementById("om_om_resultsimg-modal");
    
            // Get the image and insert it inside the modal - use its "alt" text as a caption
            var img = document.getElementById("om_resultsimg");
            var modalImg = document.getElementById("om_img");
            var captionText = document.getElementById("om_img-caption");
            img.onclick = function(){
                image_modal.style.display = "block";
                modalImg.src = this.src;
                captionText.innerHTML = this.alt;
            }
    
            // Get the <span> element that closes the modal
            var span = document.getElementById("om_img_close");
    
            // When the user clicks on <span> (x), close the modal
            span.onclick = function() {
                image_modal.style.display = "none";
            }
            
        }).catch(error => alert(error)).finally(r => {
            enablebtn('om_addimagebtn',text);
        });
    });
    $('#om_addoverlaybtn').on('click', async function() {
        let text = await disablebutton('om_addoverlaybtn');
        globals.omics.overlay_suffix = $("#om_overlay_suffix").val();

        removeOverlays(globals.omics.samplesResults).finally(r => {
            AddOverlaysPromise(globals.omics.samplesResults).finally(ao => {
                $('.minerva-overlay-tab-link').click();
                enablebtn('om_addoverlaybtn',text);

                $("#om_showonmapbtn").removeClass("air_disabledbutton");
                $("#om_addimagebtn").removeClass("air_disabledbutton");
                $("#om_showoverlaybtn").removeClass("air_disabledbutton");
                $("#om_hideoverlaybtn").removeClass("air_disabledbutton");
            });
        });
    });
    $('#om_removeoverlaybtn').on('click', async function() {
        let text = await disablebutton('om_removeoverlaybtn');
        removeOverlays(globals.omics.samplesResults).finally(r => {
            enablebtn('om_removeoverlaybtn',text); 
            
            $("#om_showonmapbtn").addClass("air_disabledbutton");
            $("#om_addimagebtn").addClass("air_disabledbutton");
            $("#om_showoverlaybtn").addClass("air_disabledbutton");
            $("#om_hideoverlaybtn").addClass("air_disabledbutton");
        });
    });


    $('.air_btn_info[data-toggle="popover"]').popover()
    $('#om_btn_download_pheno').on('click', function() {

        let om_phenotype_downloadtext = "Phenotype";
        for (let sample of globals.omics.samples) {
            om_phenotype_downloadtext += "\t" + sample + "\t" + sample + "_pvalue";
        }
        let onlysignificant = document.getElementById("om_checkbox_exclude_ns").checked === true? true : false;

        for (let phenotype in AIR.Phenotypes)
        {
            let pname = AIR.Phenotypes[phenotype].name;

            om_phenotype_downloadtext += `\n${pname}`;

            for (let sample in globals.omics.samples) {

                let pvalue = getPvalue(phenotype, sample);
                let level = onlysignificant && pvalue > 0.05? 0 : AIR.Phenotypes[phenotype].norm_results[sample];

                om_phenotype_downloadtext += `\t${level}`;
                om_phenotype_downloadtext += `\t${pvalue}`;
            }
        }

        air_download('PhenotypeActivity.txt', om_phenotype_downloadtext)
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

    var popupheight = $("#om_chart_popover").height() + 50;
    $("#om_resultstable").parents(".dataTables_scrollBody").css({
        minHeight: (popupheight > 400? 400 : popupheight) + "px",
    });
   
    globals.omics.resultsTable = $('#om_resultstable').DataTable({
        "lengthMenu": [5, 6, 7, 8, 9, 10],
        rowCallback: function(row, data, index){
            $(row).find('td').each (function() {
                if($(this).hasClass("om_resultvalue") && (parseFloat($(this).attr("data-order")) < 0.05))
                {
                    $(this).css('background-color', '#ffcccb');
                }                     
            });
        },
        "autoWidth": true,
        "order": [globals.omics.samples.length == 1? [2, "asc" ] : [globals.omics.samples.length + 2, "desc" ]],  
        "scrollX": true,
        "columns": columns,
        "columnDefs": columnsdefs,
        "initComplete": function( settings, json ) {  
            
            $('#om_popup_table').remove();          
            $('#om_resultstable_length').find("label").first().prepend(`<button type="button" id="om_popup_table" class="btn-image" style="background-color: transparent; border: none;">
                                                        <i class="fas fa-expand">
                                                        </i>
                                                    </button>`)

            $('#om_popup_table').on('click', function() {
                
                if(modal.style.display == "block")
                {
                    $('#om_resultstable_container').prepend($('#om_resultstable_wrapper'))
                    $('#om_resultstable_wrapper').css("background-color", "transparent");
                    modal.style.display = "none";
                    
                }
                else{
                    $('#om_table_modal_content').prepend($('#om_resultstable_wrapper'))
                    $('#om_resultstable_wrapper').css("background-color", "white");
                    let width = 30 + 8 * globals.omics.samples.length
                    if(width > 90)
                    {
                        width = 90;
                    }
                    $('#om_table_modal_content').css("width", width + "%");
                    modal.style.display = "block";
                }
                setTimeout(() => {
                    globals.omics.resultsTable.columns.adjust();
                    //$.fn.dataTable.tables({ visible: true, api: true }).columns.adjust(); 
                }, 500);
            });        
        }
    }).columns.adjust().draw();

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

async function om_PhenotypeSP() {

    var _text = await disablebutton("om_pheno_analyzebtn" ,progress = true);

    let considered_elements = new Set()
    globals.omics.pvalue_threshold = 1;
    let numberofregulators = {}

    if(globals.omics.pvalue)
    {
        globals.omics.pvalue_threshold = parseFloat($("#om_pheno_pvaluethreshold").val().replace(',', '.'))
        if(isNaN(globals.omics.pvalue_threshold) || globals.omics.pvalue_threshold < 0)
        {
            alert("Only positive (decimal) values are allowed as an p-value threshold. Threshold was set to 0.05.")
            globals.omics.pvalue_threshold = 0.05;
            $("#om_pheno_pvaluethreshold").val("0.05")
        }
    }

    let i_threshold = parseFloat($('#om_ithreshold_slider').val());

    let fc_threshold = parseFloat($("#om_pheno_fcthreshold").val().replace(',', '.'))
    if(isNaN(fc_threshold) || fc_threshold < 0)
    {
        alert("Only positive (decimal) values are allowed as FC threshold. Value was set to 1.")
        fc_threshold = 1;
        $("#om_pheno_fcthreshold").val("1")
    }
    fc_threshold = Math.abs(fc_threshold)
     
    globals.omics.numberOfRandomSamples = parseFloat($("#om_pheno_randomsampleNumber").val().replace(',', '.'))
    if(isNaN(globals.omics.numberOfRandomSamples) || globals.omics.numberOfRandomSamples < 0)
    {
        alert("Only positive integer values numbers are allowed. n was set to 1000.")
        globals.omics.numberOfRandomSamples = 1000;
        $('#om_pheno_randomsampleNumber').val("1000")
    }


    let count = 0;

    typeNumbersinSamples = {};

    let elements_with_FC = {};
    for (let sample in globals.omics.samples) {
        typeNumbersinSamples[sample] = {
            "protein": 0,
            "metabolite": 0
        }
        elements_with_FC[sample] = getFilteredExpression(sample, fc_threshold, globals.omics.pvalue_threshold);
        for (let element in globals.omics.ExpressionValues)
        {
            switch (AIR.Molecules[element].type) {
                case "PROTEIN":
                case "RNA": 
                    typeNumbersinSamples[sample].protein += 1;
                    break;
                case "SIMPLE_MOLECULE": 
                    typeNumbersinSamples[sample].metabolite += 1;
                    break;
                default:
                    break;
            }
        }
    }
    let correct_SPs = {}
    for (let phenotype in AIR.Phenotypes) {

        numberofregulators[phenotype] = 0;


        await updateProgress(count++, (Object.keys(AIR.Phenotypes)).length, "om_pheno_analyzebtn", text=" Estimating phenotype levels.");

        AIR.Phenotypes[phenotype].results = {};
        AIR.Phenotypes[phenotype]["pvalue"] = {}
        AIR.Phenotypes[phenotype]["en_pvalue"] = {}
        AIR.Phenotypes[phenotype]["abs_en_pvalue"] = {}
        AIR.Phenotypes[phenotype]["adj_pvalue"] = {}
        AIR.Phenotypes[phenotype]["adj_en_pvalue"] = {}
        AIR.Phenotypes[phenotype]["adj_abs_en_pvalue"] = {}
        AIR.Phenotypes[phenotype]["abs_level"] = {}
        AIR.Phenotypes[phenotype]["regression"] = {}
        AIR.Phenotypes[phenotype].accuracy = 0;
        AIR.Phenotypes[phenotype].MainRegulators = {};
        AIR.Phenotypes[phenotype]["includedelements"] = {};
        AIR.Phenotypes[phenotype]["genenumbers"] = {};
        AIR.Phenotypes[phenotype]["slope"] = {};

        correct_SPs[phenotype] = getFilteredRegulators(phenotype, i_threshold, document.getElementById("checkbox_submap").checked)

        var accuracyvalues = [];

        for (let sample in globals.omics.samples) {

            let activity = 0.0;
            let abs_activity = 0.0;
            var accuracy = 0; 

            AIR.Phenotypes[phenotype].includedelements[sample] = [];
            AIR.Phenotypes[phenotype].genenumbers[sample] = 0;                        

            var regr_data = [];

            for (let element in correct_SPs[phenotype]) {

                if(!elements_with_FC[sample].hasOwnProperty(element))
                {
                    continue;
                }

                AIR.Phenotypes[phenotype].includedelements[sample].push(element);

                let SP = correct_SPs[phenotype][element];

                let FC = globals.omics.ExpressionValues[element].nonnormalized[sample];                        
                let pvalue = globals.omics.ExpressionValues[element].pvalues[sample];              
                if(isNaN(pvalue) || !pvalue)
                {
                    pvalue = 1;
                }


                AIR.Phenotypes[phenotype].genenumbers[sample] += 1;
                considered_elements.add(element); 

                regr_data.push([FC,Math.abs(FC)*SP])

                var weightedInfluence;
                if (document.getElementById("om_checkbox_pheno_pvalue").checked === true)
                {
                    weightedInfluence = FC * SP * (1 - (pvalue/globals.omics.pvalue_threshold))
                }
                else
                {
                    weightedInfluence = FC * SP; 
                }
                activity += weightedInfluence;
                abs_activity += Math.abs(weightedInfluence);
                accuracy += Math.abs(SP);

                
                if(AIR.Molecules.hasOwnProperty(element))
                {
                    if(AIR.Phenotypes[phenotype].MainRegulators.hasOwnProperty(AIR.Molecules[element].name))
                    {
                        AIR.Phenotypes[phenotype].MainRegulators[AIR.Molecules[element].name] += Math.abs(weightedInfluence);
                    }
                    else
                    {
                        AIR.Phenotypes[phenotype].MainRegulators[AIR.Molecules[element].name] = Math.abs(weightedInfluence);
                    }
                }
            }

            var score = leastSquaresRegression(regr_data)

            AIR.Phenotypes[phenotype].results[sample] = activity;
            AIR.Phenotypes[phenotype]["slope"][sample] = score;
            AIR.Phenotypes[phenotype]["abs_level"][sample] = abs_activity;

            accuracyvalues.push(accuracy);
        }

        AIR.Phenotypes[phenotype].accuracy = (mean(accuracyvalues) / Object.values(correct_SPs[phenotype]).reduce((a, b) => Math.abs(a) + Math.abs(b), 0));
    }
    
    count = 0;
    let total_iterations = globals.omics.samples.length * Object.keys(AIR.Phenotypes).length;
    
    let elementarray_proteins = Object.keys(AIR.Molecules).filter(m => ["PROTEIN", "RNA"].includes(AIR.Molecules[m].type))
    let elementarray_metabolite = Object.keys(AIR.Molecules).filter(m => AIR.Molecules[m].type == "SIMPLE_MOLECULE")
    
    for (let sample in globals.omics.samples) {        

        let FC_values = Object.values(elements_with_FC[sample]);
        let shuffled_arrays = [];

        for(let i = 0; i < globals.omics.numberOfRandomSamples; i++)
        {
            let shuffled_array = pickRandomElements(elementarray_proteins, typeNumbersinSamples[sample].protein);
            shuffled_array.push(...pickRandomElements(elementarray_metabolite, typeNumbersinSamples[sample].metabolite))
            shuffled_arrays.push(shuffled_array)
        }

        for(let phenotype in AIR.Phenotypes)
        {
            let score = AIR.Phenotypes[phenotype]["slope"][sample]
            score = Math.abs(score) > 1 ? 1/score : score

            let en_score = AIR.Phenotypes[phenotype].results[sample]
            let abs_en_score = AIR.Phenotypes[phenotype]["abs_level"][sample];


            await updateProgress(count++, total_iterations, "om_pheno_analyzebtn", text=" Calculate p-values..");

            let random_scores = [];            
            let random_en_scores = [];  
            let random_abs_en_scores = [];
            
            let unequal_signs = Math.sign(en_score) != Math.sign(score);


            for(let shuffled_elements of shuffled_arrays)
            {           
                var _regr_data = [];
                var _en_score = 0;
                var _abs_en_score = 0;
                for(let i in FC_values)
                {              
                    let element = shuffled_elements[i];     
                    if(correct_SPs[phenotype].hasOwnProperty(element))
                    {
                        let SP = correct_SPs[phenotype][element];
                        
                        _en_score += FC_values[i] *SP;
                        _abs_en_score += Math.abs(FC_values[i] *SP);
                        _regr_data.push([FC_values[i], Math.abs(FC_values[i]) * SP])
                    }
                }

                if(!unequal_signs)
                {
                    var _score = leastSquaresRegression(_regr_data);
                    _score = Math.abs(_score) > 1 ? 1/_score : _score
                }

                random_scores.push(_score)
                random_en_scores.push(_en_score)
                random_abs_en_scores.push(_abs_en_score)
                
            }

            if(!unequal_signs)
            {
                let std = standarddeviation(random_scores)            
                let z_score = std != 0? (score - mean(random_scores))/std : 0;
                let pvalue = GetpValueFromZ(z_score);
                if(isNaN(pvalue))
                    pvalue = 1;
                AIR.Phenotypes[phenotype].pvalue[sample] = pvalue;
            }
            else
            {
                AIR.Phenotypes[phenotype].pvalue[sample] = 0.99
            }

            std = standarddeviation(random_en_scores)            
            z_score = std != 0? (en_score - mean(random_en_scores))/std : 0;
            pvalue = GetpValueFromZ(z_score);
            if(isNaN(pvalue))
                pvalue = 1;

            AIR.Phenotypes[phenotype].en_pvalue[sample] = pvalue;

            std = standarddeviation(random_abs_en_scores)            
            z_score = std != 0? (abs_en_score - mean(random_abs_en_scores))/std : 0;
            pvalue = GetpValueFromZ(z_score, "right");
            if(isNaN(pvalue))
                pvalue = 1;

            AIR.Phenotypes[phenotype].abs_en_pvalue[sample] = pvalue;
            

        }
    }

    
    for (let sample in globals.omics.samples)
    {
        var m_pvalues = []
        var en_pvalues = []
        var abs_en_pvalues = []

        var m_phenotypevalues = {}
        var en_phenotypevalues = {}
        var abs_en_phenotypevalues = {}

        for (let phenotype in AIR.Phenotypes) {
            m_pvalues.push(AIR.Phenotypes[phenotype].pvalue[sample])
            en_pvalues.push(AIR.Phenotypes[phenotype].en_pvalue[sample])
            abs_en_pvalues.push(AIR.Phenotypes[phenotype].abs_en_pvalue[sample])
        }

        m_pvalues = m_pvalues.sort((a, b) => a - b);
        en_pvalues = en_pvalues.sort((a, b) => a - b);
        abs_en_pvalues = abs_en_pvalues.sort((a, b) => a - b);

        for (let phenotype in AIR.Phenotypes) {
            m_phenotypevalues[phenotype] = m_pvalues.indexOf(AIR.Phenotypes[phenotype].pvalue[sample])
            en_phenotypevalues[phenotype] = en_pvalues.indexOf(AIR.Phenotypes[phenotype].en_pvalue[sample])
            abs_en_phenotypevalues[phenotype] = abs_en_pvalues.indexOf(AIR.Phenotypes[phenotype].abs_en_pvalue[sample])
        }

        m_pvalues = getAdjPvalues(m_pvalues);
        en_pvalues = getAdjPvalues(en_pvalues);
        abs_en_pvalues = getAdjPvalues(abs_en_pvalues);

        for (let phenotype in AIR.Phenotypes) {
            AIR.Phenotypes[phenotype].adj_pvalue[sample] = m_pvalues[m_phenotypevalues[phenotype]];
            AIR.Phenotypes[phenotype].adj_en_pvalue[sample] = en_pvalues[en_phenotypevalues[phenotype]];
            AIR.Phenotypes[phenotype].adj_abs_en_pvalue[sample] = abs_en_pvalues[abs_en_phenotypevalues[phenotype]];
        }

    }

    
    if ( !$( "#om_pheno_mapped_elements" ).length ) {
    
        $( `<p id="om_pheno_mapped_elements">${considered_elements.size} elements were considered.<p>`).insertAfter($( "#om_pheno_analyzebtn" ));
    
    }
    else
    {
        $( "#om_pheno_mapped_elements" ).replaceWith(`<p id="om_pheno_mapped_elements">${considered_elements.size} elements were considered.<p>`);
    }

    await om_normalizePhenotypeValues().then(async function (pv) {
             
        await om_createTable({
            correctSPs: correct_SPs,
            FilteredElements: elements_with_FC,
        })
        await enablebtn("om_pheno_analyzebtn", _text);
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

                        data: `content=name%09color${contentString(count-1)}&description=PhenotypeActivity&filename=${samples[count - 1]+globals.omics.overlay_suffix}.txt&name=${samples[count - 1]+globals.omics.overlay_suffix}&googleLicenseConsent=true`,
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

function adjustdata(imported) {

    return new Promise((resolve, reject) => {
        for(let e in globals.omics.ExpressionValues)
        {
            let _data = globals.omics.ExpressionValues[e];
            for(let sample in globals.omics.samples)
            {
                if(!_data.nonnormalized.hasOwnProperty(sample))
                {
                    _data.nonnormalized[sample] = 0;

                    if(imported)
                        _data.pvalues[sample] = 0;
                    else
                        _data.pvalues[sample] = 1;
                }
            }
        }
        resolve();
    });
}

async function om_datamerge_dialog(imported) {

    return new Promise((resolve, reject) => {
        $( function() {
            $("#om_dialog_confirm").show();
            $( "#om_dialog_confirm" ).dialog({
              resizable: false,
              height: "auto",
              width: 400,
              modal: true,
              buttons: {
                "Merge": function() {
                    $(this).dialog("close");
                    resolve([false, false]);
                },
                "Overwrite": function() {
                    $(this).dialog("close");
                    resolve([true, false]);
                  },
                "Cancel": function() {
                    $(this).dialog("close");
                    resolve([true, true]);
                }
              }
            });

            $("#om_dialog_confirm_text").remove();
            $("#om_dialog_confirm").before('<p id="om_dialog_confirm_text"><span class="ui-icon ui-icon-alert" style="float:left; margin:12px 12px 20px 0;"></span>Some data has already been loaded. Do you want to overwrite or merge with the new data?</p>')
          } );
          
    });

};

async function om_loadfile(imported) {

    let delete_data = false;
    let break_flag = false;
    let selectedDataType = $("#om_analysistypeSelect").val();


    if(globals.omics.ExpressionValues && Object.keys(globals.omics.ExpressionValues).length > 0)
    {
        var _return = (globals.omics.selectedDataType != selectedDataType? [true, false] : await om_datamerge_dialog());

        delete_data = _return[0];
        break_flag = _return[1];
    }

    return new Promise((resolve, reject) => {

        let resolvemessage = "";

        if (break_flag)
        {
            resolve(resolvemessage)
            return;
        }

        globals.omics.selectedDataType = selectedDataType;

        if(imported)
        {     
            if(delete_data)
            {
                globals.omics.samples = [];
                globals.omics.samplestring = "";
                globals.omics.samplesResults = [];
                globals.omics.ExpressionValues = {};
                globals.omics.numberofuserprobes = 0;
        
                for(let element in AIR.Molecules)
                {
                    AIR.Molecules[element].Centrality = {
                        Betweenness: {},
                        Closeness: {},
                        Degree: {},
                        Indegree: {},
                        Outdegree: {},
                    }
                }
            }

            for(let sample in globals.omics.import_data)
            {
                if(!globals.omics.samples.includes(sample))
                {
                    globals.omics.samples.push(sample);
                    globals.omics.samplesResults.push(sample + "_results");
                }
                    

                var sampleid = globals.omics.samples.indexOf(sample);

                for(let molecule_id in globals.omics.import_data[sample])
                {
                    if(!globals.omics.ExpressionValues.hasOwnProperty(molecule_id))
                    {
                        globals.omics.ExpressionValues[molecule_id] = {};
                        globals.omics.ExpressionValues[molecule_id]["name"] = AIR.Molecules[molecule_id].name;
                        globals.omics.ExpressionValues[molecule_id]["nonnormalized"] = {};
                        globals.omics.ExpressionValues[molecule_id]["normalized"] = {};
                        globals.omics.ExpressionValues[molecule_id]["pvalues"] = {};
                        globals.omics.ExpressionValues[molecule_id]["custom"] = false;
                    }

                    globals.omics.ExpressionValues[molecule_id]["nonnormalized"][sampleid] = globals.omics.import_data[sample][molecule_id];
                    globals.omics.ExpressionValues[molecule_id]["pvalues"][sampleid] = 0;
                }
            }

            globals.omics.pvalue = false;
            globals.omics.numberofuserprobes = Object.keys(globals.omics.ExpressionValues).length;

            resolve(resolvemessage)
            return;
        }

        var fileToLoad = document.getElementById("om_inputId").files[0];

        if(!fileToLoad)
        {
            reject('No file selected.');
            return;
        }

        globals.omics.pvalue = document.getElementById("om_checkbox_pvalue").checked;

        if(globals.omics.pValue && (globals.omics.columnheaders.length - 1)%2 != 0)
        {
            reject('Number of p-value columns is different from the sumber of sample columns!');
            return;             
        }
        var _transcript = parseFloat($("#om_transcriptSelect").val());   

        if(!globals.omics.pvalue && _transcript == 5)
        {
            reject('Transcripts can not be mapped by their p-values if the file does not contain any p-values.');
            return;
        }

        globals.omics.numberofuserprobes = 0;

        var fileReader = new FileReader();
        fileReader.onload = function (fileLoadedEvent) {

            if(delete_data)
            {
                globals.omics.samples = [];
                globals.omics.samplestring = "";
                globals.omics.samplesResults = [];
                globals.omics.ExpressionValues = {};
                globals.omics.numberofuserprobes = 0;
        
                for(let element in AIR.Molecules)
                {
                    AIR.Molecules[element].Centrality = {
                        Betweenness: {},
                        Closeness: {},
                        Degree: {},
                        Indegree: {},
                        Outdegree: {},
                    }
                }
            }
            
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

                    if(!globals.omics.samples.includes(samplename))
                    {
                        globals.omics.samples.push(samplename);
                        globals.omics.samplesResults.push(samplename + "_results");
                    }
                    
                }
                even_count ++;
            }

            textFromFileLoaded.split('\n').forEach(function(line) {
                if (firstline === true) {
                    globals.omics.samplestring = line.substr(line.indexOf(globals.omics.seperator) + 1);
                    firstline = false;
                }
                else {                   
                    if(line == ""){
                        return;
                    }
                    globals.omics.numberofuserprobes ++;
                    if(globals.omics.pvalue && line.split(globals.omics.seperator).length != globals.omics.samples.length * 2 + 1 || globals.omics.pvalue == false && line.split(globals.omics.seperator).length > globals.omics.samples.length + 1)
                    {
                        var linelengtherror = "Lines in the datafile may have been skipped because of structural issues.";
                        if(resolvemessage.includes(linelengtherror) === false)
                        {
                            resolvemessage += linelengtherror
                        }
                        return;
                    }

                    let entries = line.split(globals.omics.seperator);
                    let probeid = entries[headerid].toLowerCase();

                    if(probeid.toLowerCase().includes("glucosylsphingosine"))
                    {
                        console.log(probeid)
                        console.log(Object.keys(AIR.ElementNames[globals.omics.selectedmapping]).filter(m => m.toLowerCase().includes("glucosylsphingosine")))
                    }
                    if(AIR.ElementNames[globals.omics.selectedmapping].hasOwnProperty(probeid))
                    {
                        let molecule_id = AIR.ElementNames[globals.omics.selectedmapping][probeid];

                        if(AIR.Molecules[molecule_id].type == "FAMILY" || AIR.Molecules[molecule_id].type == "COMPLEX")
                            return;
                        

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
                                if(isNaN(number))
                                {
                                    number = 0;
                                    var numbererror = "Some values could not be read as numbers and were set to 0."
                                    if(resolvemessage.includes(numbererror) === false)
                                    {
                                        if(resolvemessage != "")
                                        {
                                            resolvemessage += "\n";
                                        }
                                        resolvemessage += numbererror
                                    }
                                }

                                samplename = globals.omics.columnheaders[i];
                                sampleid = globals.omics.samples.indexOf(samplename, 0);

                                if(!_tempdata[molecule_id].hasOwnProperty(sampleid))
                                {
                                    _tempdata[molecule_id][sampleid] = {}
                                    _tempdata[molecule_id][sampleid]["values"] = []
                                    _tempdata[molecule_id][sampleid]["pvalues"] = []
                                }
                                _tempdata[molecule_id][sampleid]["values"].push(number?? 0)
                            }
                            if(even_count%2 == 0 && globals.omics.pvalue == true)
                            {
                                if(isNaN(number))
                                {
                                    number = 1;
                                    var numbererror = "Some p-values could not be read as numbers and were set to 1."
                                    if(resolvemessage.includes(numbererror) === false)
                                    {
                                        if(resolvemessage != "")
                                        {
                                            resolvemessage += "\n";
                                        }
                                        resolvemessage += numbererror
                                    }
                                }

                                _tempdata[molecule_id][sampleid]["pvalues"].push(number)
                            }

                            even_count++;
                        }  
                    } 
                }

            });
                   
            for(let molecule_id in _tempdata)
            {
                if(!globals.omics.ExpressionValues.hasOwnProperty(molecule_id))
                {
                    globals.omics.ExpressionValues[molecule_id] = {};
                    globals.omics.ExpressionValues[molecule_id]["name"] = AIR.Molecules[molecule_id].name;
                    globals.omics.ExpressionValues[molecule_id]["nonnormalized"] = {};
                    globals.omics.ExpressionValues[molecule_id]["normalized"] = {};
                    globals.omics.ExpressionValues[molecule_id]["pvalues"] = {};
                    globals.omics.ExpressionValues[molecule_id]["custom"] = false;
                }

                for(let sampleid in globals.omics.samples)
                {          
                    if(!_tempdata[molecule_id].hasOwnProperty(sampleid))                   
                        continue;
                    
                    let pvalue = globals.omics.pValue? 1 : 0;
                    let fc = 0;

                    switch(_transcript) {
                        case 0:
                            fc = mean(_tempdata[molecule_id][sampleid]["values"])
                            pvalue = mean(_tempdata[molecule_id][sampleid]["pvalues"])
                          break;
                        case 1:
                            {
                                let _id = indexOfLargest(_tempdata[molecule_id][sampleid]["values"])
                                fc = _tempdata[molecule_id][sampleid]["values"][_id]
                                pvalue = _tempdata[molecule_id][sampleid]["pvalues"][_id]
                            }
                          break;
                        case 2:
                            {
                                let _id = indexOfSmallest(_tempdata[molecule_id][sampleid]["values"])
                                fc = _tempdata[molecule_id][sampleid]["values"][_id]
                                pvalue = _tempdata[molecule_id][sampleid]["pvalues"][_id]
                            }
                          break;
                        case 3:
                            {
                                let _id = indexOfLargest(_tempdata[molecule_id][sampleid]["values"], absolute = true)
                                fc = _tempdata[molecule_id][sampleid]["values"][_id]
                                pvalue = _tempdata[molecule_id][sampleid]["pvalues"][_id]
                            }
                          break;
                        case 4:
                            {
                                let _id = indexOfSmallest(_tempdata[molecule_id][sampleid]["values"], absolute = true)
                                fc = _tempdata[molecule_id][sampleid]["values"][_id]
                                pvalue = _tempdata[molecule_id][sampleid]["pvalues"][_id]
                            }
                          break;
                        case 5:
                            {
                                let _id = indexOfSmallest(_tempdata[molecule_id][sampleid]["pvalues"])
                                fc = _tempdata[molecule_id][sampleid]["values"][_id]
                                pvalue = _tempdata[molecule_id][sampleid]["pvalues"][_id]
                            }
                          break;
                      }
                    
                    globals.omics.ExpressionValues[molecule_id]["nonnormalized"][sampleid] = fc;
                    globals.omics.ExpressionValues[molecule_id]["pvalues"][sampleid] = pvalue;
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

        fileReader.readAsText(fileToLoad, 'ISO-8859-1');
    });

}

function contentString(ID) {

    let addednames = [];
    let output = '';

    let pvalue_threshold = parseFloat($("#om_overlay_pvalue_threshold").val().replace(',', '.'))
    if(isNaN(pvalue_threshold))
    {
        alert("Only (decimal) numbers are allowed as an p-value threshold. p-value threshold was set to 0.05.")
        pvalue_threshold = 0.05;
    }

    for (let p in AIR.Phenotypes)
    {
        let _name = encodeURIComponent(AIR.Phenotypes[p].name);
        let pvalue = getPvalue(p, ID);

        if(pvalue > pvalue_threshold)
        {   
            continue;
        }

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
    
    if (document.getElementById("checkbox_datavalues_overlay").checked === true) {
        for(let expression in globals.omics.ExpressionValues)
        {
            let _name = globals.omics.ExpressionValues[expression].name;

            if(addednames.includes(_name))
                continue;
            addednames.push(_name);           
            
            let _value = globals.omics.ExpressionValues[expression].normalized[ID];
            let hex = rgbToHex((1 - Math.abs(_value)) * 255);
            output += `%0A${_name}`;
            if (_value > 0)
                output += '%09%23ff' + hex + hex;
            else if (_value < 0)
                output += '%09%23' + hex + hex + 'ff';
            else output += '%09%23ffffff';
        };
    }
    return output;
}

function getDataOverlays(_samples, all = false) {
    return new Promise((resolve, reject) => {
        var overlays = minervaProxy.project.data.getDataOverlays();
        let samples = _samples.map(s => s + globals.omics.overlay_suffix)
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

            if(!AIR.Molecules[item].type == "COMPLEX")
            {
                continue;
            }

            for (let sample in globals.omics.samples) {
                let _values = itemExpression(item, sample)
                if(_values)
                {                    
                    if(!globals.omics.ExpressionValues.hasOwnProperty(item))
                    {
                        globals.omics.ExpressionValues[item] = {}
                        globals.omics.ExpressionValues[item]["name"] = AIR.Molecules[item].name;
                        globals.omics.ExpressionValues[item]["normalized"] = {};
                        globals.omics.ExpressionValues[item]["nonnormalized"] = {}
                        globals.omics.ExpressionValues[item]["pvalues"] = {}
                        globals.omics.ExpressionValues[item]["custom"] = true;
                    }

                    globals.omics.ExpressionValues[item].nonnormalized[sample] = _values[0];
                    globals.omics.ExpressionValues[item].pvalues[sample] = _values[1];
                }
            }
        }

        function itemExpression(item, sample)
        {          
            if(AIR.Molecules[item].subtype == "COMPLEX") {
                let sum = Number.MAX_SAFE_INTEGER;
                sumpvalue = -1;
                for(let subunit in AIR.Molecules[item].subunits)
                {
                    let subunitvalues = itemExpression(AIR.Molecules[item].subunits[subunit], sample)
                    if(!subunitvalues)
                        continue;

                    let subunitvalue = subunitvalues[0];
                    let subunitpvalue = subunitvalues[1];

                    if(!isNaN(subunitvalue) && subunitvalue < sum)
                    {
                        sum = subunitvalue;
                    }
                    if(!isNaN(subunitpvalue) && (subunitpvalue > sumpvalue))
                    {
                        sumpvalue = subunitpvalue;
                    }
                }
                if(sum === Number.MAX_SAFE_INTEGER)
                    return false;
                return [sum, (sumpvalue == -1? 1: sumpvalue)] ;
            }
            else if(globals.omics.ExpressionValues.hasOwnProperty(item))
            {
                return [globals.omics.ExpressionValues[item]["nonnormalized"][sample], globals.omics.ExpressionValues[item]["pvalues"][sample]];
            }
            else {
                return false;
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

function om_normalizePhenotypeValues() {
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
async function calculateTargets() {

    let fc_threshold = 0;
    let pvalue_threshold = 1;

    var sample = $('#om_select_sample').val(); 
    let n = parseFloat($('#om_targetcomb_slider').val());
    let usememory = (document.getElementById("om_target_usememory").checked == true? true : false);
    let numberOfTargets = $("#om_target_targetnumber").val();

    let negativeCount = 0;
    let positiveCount = 0;

    activaTab("om_target_chart");

    if(globals.omics.om_targettable)
        globals.omics.om_targettable.destroy();
    $("#om_target_chart_table").replaceWith(`
        <table class="air_table order-column hover nowrap  mt-2" style="width:100%" id="om_target_chart_table" cellspacing=0>
        </table>
    `);

    if(globals.omics.pvalue)
    {
        pvalue_threshold = parseFloat($("#om_target_pvaluethreshold").val().replace(',', '.'))
        if(isNaN(pvalue_threshold) || pvalue_threshold < 0)
        {
            alert("Only positive (decimal) values are allowed as p-value threshold. Value was set to 1.")
            pvalue_threshold = 0.05;
            $("#om_target_pvaluethreshold").val("0.05")
        }
    }
    fc_threshold = parseFloat($("#om_target_fcthreshold").val().replace(',', '.'))
    if(isNaN(fc_threshold) || fc_threshold < 0)
    {
        alert("Only positive (decimal) values are allowed as FC threshold. Value was set to 1.")
        fc_threshold = 1;
        $("#om_target_fcthreshold").val("1")
    }
    fc_threshold = Math.abs(fc_threshold)

    let elements_with_FC = getFilteredExpression(sample, fc_threshold, pvalue_threshold)
    let FC_values = Object.values(elements_with_FC)
    let possible_targets = []
    let elementarray_proteins = Object.keys(AIR.Molecules).filter(m => AIR.Molecules[m].type == "PROTEIN")
    let elementarray_rnas = Object.keys(AIR.Molecules).filter(m => AIR.Molecules[m].type == "RNA")
    let elementarray_metabolite = Object.keys(AIR.Molecules).filter(m => AIR.Molecules[m].type == "SIMPLE_MOLECULE")
    let shuffled_arrays = []
    let typeNumbersinSamples = {
        "protein": 0,
        "metabolite": 0,
        "rna": 0
    }

    for(let e in AIR.Molecules)
    {
        if(elements_with_FC.hasOwnProperty(e))
        {
            positiveCount += Math.abs(elements_with_FC[e]);
            switch (AIR.Molecules[e].type) {
                case "SIMPLE_MOLECULE":
                    typeNumbersinSamples.metabolite += 1;
                    break;
            
                case "RNA":
                    typeNumbersinSamples.rna += 1;
                case "PROTEIN": 
                    typeNumbersinSamples.protein += 1; 
                    break;
            }
        }
        else {
            negativeCount += 1;
        }

        if(AIR.Molecules[e].emptySP == true)
        {
            continue;
        }

        let {name:_name, type:_type, subtype:_subtype, phenotypes:_sp} = AIR.Molecules[e];
        
        if (_type.toLowerCase() === "phenotype") {
            continue;
        }

        switch (parseFloat($('#om_target_filter').val())) 
        {
            case 1:
                if (_type != "PROTEIN") {
                    continue;
                }
                break;
            case 2:
                if (_subtype != "miRNA") {
                    continue;
                }
                break;
            case 3:
                if (_subtype != "lncRNA") {
                    continue;
                }
                break;
            case 4:
                if (_subtype != "TF") {
                    continue;
                }
                break;
            case 5:
                if (_subtype != "RECEPTOR") {
                    continue;
                }
                break;
            default:
                break;
        } 
        
        possible_targets.push(e)
    }

    for(let i = 0; i < 1000; i++)
    {
        let shuffled_array = pickRandomElements(elementarray_proteins, typeNumbersinSamples.protein);
        shuffled_array.push(...pickRandomElements(elementarray_metabolite, typeNumbersinSamples.metabolite))
        shuffled_array.push(...pickRandomElements(elementarray_rnas, typeNumbersinSamples.rna))
        shuffled_arrays.push(shuffle(shuffled_array))
    }

    if(numberOfTargets == "")
    {
        numberOfTargets = Object.keys(AIR.Molecules).length;
    }
    else
    {
        numberOfTargets = parseFloat(numberOfTargets.replace(',', '.'))
        if(isNaN(numberOfTargets) || numberOfTargets < 0)
        {
            alert("Only positive integer numbers are allowed as a number. Number of targets was set to 100.")
            numberOfTargets = Object.keys(AIR.Molecules).length;
            switch (parseFloat($('#om_targetcomb_slider').val())) {
                case 2:
                    numberOfTargets = 30;
                    break;
                case 3:
                    numberOfTargets = 15;
                    break;
                case 4:
                    numberOfTargets = 5;
                    break;
            }
        }
    }
    $("#om_target_targetnumber").val(numberOfTargets)

    let molLength = possible_targets.length ;
    await updateProgress(0, molLength, "om_regulator");
            
    globals.omics.om_targetchart.data.datasets = [];

    setTimeout(function(){                                
        globals.omics.om_targetchart.update();
        
    }, 0);

    if(possible_targets.length == 0)
    {
        $("#om_target_chart_canvas").height(400);
        $("#om_regulator_progress").hide();
        $("#om_btn_predicttarget").html('Predict Targets');
        $("#airomics_tab_content").removeClass("air_disabledbutton");
    }
    else
    {
        let _identifiedTargets = {}
        let count = 0
        for (let e of possible_targets) {  
            if((count++) % 20 == 0)                                          
                await updateProgress(count, molLength, "om_regulator", `  Analyzing Element ${count}/${molLength}`);
            let _results = await analyzetargets([e]);
            if(_results)
            {
                _identifiedTargets[e] = _results
            }
        }
        await updateProgress(0, molLength, "om_regulator", `  Ranking and filtering targets ...`);
        await getadjPvaluesForObject(_identifiedTargets, "pvalue")

        _identifiedTargets = Object.filter(_identifiedTargets, t => _identifiedTargets[t].adj_pvalue < 0.001) 

        if(n > 1)
        {                                                
            _identifiedTargets = pickHighest(_identifiedTargets, _num = numberOfTargets, ascendend = false, key = "sensitivity");
            let identifiedTargets = Object.keys(_identifiedTargets);

            for (var i = 0; i < identifiedTargets.length - 1; i++)
            {

                await updateProgress(i, identifiedTargets.length, "om_regulator", `  Iterating target combinations  ${i}/${identifiedTargets.length}`); 

                for (var j = i + 1; j < identifiedTargets.length; j++) {
                    if(n > 2)
                    {
                        for (var k = j + 1; k < identifiedTargets.length; k++) {
                            if(n > 3)
                                for (var m = k + 1; m < identifiedTargets.length; m++) {
                                    let result = await analyzetargets([identifiedTargets[i], identifiedTargets[j], identifiedTargets[k], identifiedTargets[m]])
                                    if(result)
                                    {
                                        _identifiedTargets[[i,j,k,m].join("_")] = result;
                                    }
                                }
                            else
                            {
                                let result = await analyzetargets([identifiedTargets[i], identifiedTargets[j], identifiedTargets[k]])
                                if(result)
                                {
                                    _identifiedTargets[[i,j,k].join("_")] = result;
                                }
                            }                                            
                        }
                    }
                    else
                    {
                        let result = await analyzetargets([identifiedTargets[i], identifiedTargets[j]])
                        if(result)
                        {
                            _identifiedTargets[[i,j].join("_")] = result;
                        }
                    }
                }                                
            }
        }

        await getadjPvaluesForObject(_identifiedTargets, "pvalue")

        for(let target in _identifiedTargets)
        {
            adddatatochart(_identifiedTargets[target]);     
        }
        
        $("#om_target_chart_canvas").height(400);
        $("#om_regulator_progress").hide();
        $("#om_btn_predicttarget").html('Predict Targets');
        $("#airomics_tab_content").removeClass("air_disabledbutton");
                
        globals.omics.om_targetchart.update();
                              
    }     

    var tbl = document.getElementById('om_target_chart_table');
    var header = tbl.createTHead();
    var headerrow = header.insertRow(0);

    createCell(headerrow, 'th', 'Element', 'col', 'col', 'center');
    createCell(headerrow, 'th', 'Type', 'col', 'col', 'center');
    createCell(headerrow, 'th', 'adj p-value', 'col', 'col', 'center');
    //createCell(headerrow, 'th', 'p-value', 'col', 'col', 'center');
    createCell(headerrow, 'th', 'Sensitivity', 'col', 'col', 'center');
    createCell(headerrow, 'th', 'Specificity', 'col', 'col', 'center');
    createCell(headerrow, 'th', 'FC', 'col', 'col', 'center');
    //createCell(headerrow, 'th', 'Effect', 'col', 'col', 'left');

    
    globals.omics.om_targettable = $('#om_target_chart_table').DataTable({
        "dom": '<"top"<"left-col"B><"right-col"f>>rtip',
        "buttons": [
            {
                text: 'Copy',
                className: 'air_dt_btn',
                action: function () {
                    copyContent(getDTExportString(globals.omics.om_targettable));
                }
            },
            {
                text: 'CSV',
                className: 'air_dt_btn',
                action: function () {
                    air_download("Predicted_targets.csv", getDTExportString(globals.omics.om_targettable, seperator = ","))
                }
            },
            {
                text: 'TSV',
                className: 'air_dt_btn',
                action: function () {
                    air_download("Predicted_targets.txt", getDTExportString(globals.omics.om_targettable))
                }
            }
        ],   
        "order": [[ 3, "desc" ], [ 2, "asc" ]], 
        "scrollX": true,
        "autoWidth": true,
        columns: [
            null,
            { "width": "15%" },
            { "width": "15%" },
            { "width": "15%" },
            //{ "width": "15%" },
            { "width": "10%" },
            { "width": "10%" },
            ],
        columnDefs: [
            {
                targets: 0,
                className: 'dt-right',
                'max-width': '25%',
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
                className: 'dt-center'
            },
            {
                targets: 4,
                className: 'dt-center'
            },
            {
                targets: 5,
                className: 'dt-center'
            },
            // {
            //     targets: 6,
            //     className: 'dt-center'
            // },
        ]
    }).columns.adjust();

    async function analyzetargets(targets)
    {
        let maxScore = 0;
        let maxregulators = null;
        let results = null;

        for (let index of targetCombinations(targets.length))
        {          
            let regulators = await getRegulatorsForTarget(targets, index, usememory)
            let positiveSum = 0;
            let negativeSum = 0;
            
            for (let p in AIR.Molecules) 
            {                
                let SP = regulators.hasOwnProperty(p)? regulators[p] : 0;
                if (elements_with_FC.hasOwnProperty(p))
                {
                    positiveSum += elements_with_FC[p] * SP;
                }
                else
                {
                    negativeSum += (1 - Math.abs(SP));
                }           
            } 

            let sensitivity = positiveSum / positiveCount;
            let specificity = negativeSum / negativeCount;

            if(sensitivity > 1)
            {
                sensitivity = 1;
            }
            else if(sensitivity < -1)
            {
                sensitivity = -1;
            }

            if(specificity > 0 && sensitivity != 0)
            {
                let positive = sensitivity > 0? true : false;
                let positiveValue = sensitivity > 0? 1 : -1;
                sensitivity = Math.abs(sensitivity);

                if(sensitivity <= maxScore)
                    continue;                                            
                
 
                // let pvalue = await fishers(_TargetsInDeGs, _TargetsNotInDEGs, _nonTargetsInDEGs, _nonTargetsNotInDEGs)
                maxregulators = regulators;
                maxScore = sensitivity;               

                results = 
                {
                    "id": targets,
                    "fc": 0,
                    "index": index,
                    "sensitivity": sensitivity,
                    "name": targets.map(t => AIR.Molecules[t].name + (index[targets.indexOf(t)]*positiveValue == -1? "\u2193" : "\u2191")).join(' & '),
                    "linkname": targets.map(t => getLinkIconHTML(AIR.Molecules[t].name) + (index[targets.indexOf(t)]*positiveValue == -1? "\u2193" : "\u2191")).join(' & '),
                    "specificity": specificity,
                    "positive": index.every( v => v === index[0])? positive : null
                };
            } 
        }

        if(results == null)
        {
            return false;
        }
        else
        {
            let _sensitivity_scors = [];
            for(let shuffled_elements of shuffled_arrays)
            {           
                let _sensitivity = 0.0;
                for(let i in FC_values)
                {              
                    let element = shuffled_elements[i];     
                    if(maxregulators.hasOwnProperty(element))
                    {
                        _sensitivity += FC_values[i] * maxregulators[element];
                    }
                }

                _sensitivity_scors.push(_sensitivity / positiveCount);
            }

            let std = standarddeviation(_sensitivity_scors)  
            
            let pvalue = 1
            if(std && std != 0)
            {
                let z_score =  (results["sensitivity"] - mean(_sensitivity_scors))/std;                
                pvalue = GetpValueFromZ(z_score);
            }      
            
            results["pvalue"] =  isNaN(pvalue)? 1 : pvalue;
            return results;
        }                   
    }

    async function adddatatochart(targtetdata, colored = true)
    {
        return new Promise( 
            async function(resolve, reject) {
                
                var radius = 2 + (6 * (1 - targtetdata.pvalue));
                        
                var pstyle = targtetdata.positive == null? 'circle' : 'triangle';

                let hex = '#d3d3d3';
                
                if(colored)
                    hex = targtetdata.positive == null? '#a9a9a9' : (targtetdata.positive? (targtetdata.fc >= 0? '#C00000' : '#d3d3d3') : (targtetdata.fc <= 0? '#0070C0' : '#d3d3d3'));

                let result = {
                    label: [targtetdata.name, targtetdata.fc != 0 ? expo(targtetdata.fc, 3, 3) : false, expo(targtetdata.adj_pvalue, 2, 2)].join(";"),
                    data: [{
                        x: expo(targtetdata.specificity, 3, 3),
                        y: expo(targtetdata.sensitivity, 3, 3),
                        r: radius
                    }],
                    backgroundColor:  hex ,
                    hoverBackgroundColor: hex,
                    pointStyle: pstyle,
                    rotation: targtetdata.positive? 0 : 60,
                }
                
                var tbl = document.getElementById('om_target_chart_table');
                let result_row = tbl.insertRow(tbl.rows.length);

                createCell(result_row, 'td', targtetdata.linkname, 'col-auto', 'col', 'center', true);                
                createPopupCell(result_row, 'td', targtetdata.positive == null? "mixed" : (targtetdata.positive? "positive" : "negative"), 'col-auto', 'center', om_createtargetpopup, {"sample": sample, "id": targtetdata.id, "index": targtetdata.index, "pvalue_threshold": pvalue_threshold, "fcthreshold": fc_threshold}),
                createCell(result_row, 'td', expo(targtetdata.adj_pvalue, 2, 2), 'col-auto', 'col', 'center', true);
                //createCell(result_row, 'td', expo(targtetdata.pvalue, 2, 2), 'col-auto', 'col', 'center', true);
                createCell(result_row, 'td', expo(targtetdata.sensitivity, 3, 3), 'col-auto', 'col', 'center', true);
                createCell(result_row, 'td', expo(targtetdata.specificity, 3, 3), 'col-auto', 'col', 'center', true);
                createCell(result_row, 'td', expo(targtetdata.fc, 3, 3), 'col-auto', 'col', 'center', true);
                //createCell(result_row, 'td', targtetdata.regulators.map(r => getLinkIconHTML(r)).join(", "), 'col-auto', 'col', 'left', true);               

                globals.omics.om_targetchart.data.datasets.push(result); 
                resolve();
        });
    }

    function targetCombinations(n)
    {
        if (n == 1)
        {
            return [[1]];
        }
        let df = Array.from(Array(Math.pow(2, n)), () => []);

        for (let i = 1; i <= n; i++) 
        {
            var j = 0
            for (let _e = 1; _e <=  Math.pow(2, i - 1); _e++)
                {
                for (let k = 1; k <=  Math.pow(2, n - i); k++)
                {
                    df[j++].push(1)
                }
                
                for (let k = 1; k <=  Math.pow(2, n - i); k++)
                {
                    df[j++].push(-1)
                }
            }
        }

        return df
    }
}

async function getRegulatorsForTarget(targets, index, usememory = true)
{
    let regulators = {};

    for(let t in targets)
    {
        let _data = (await getMoleculeData(targets[t], "molecule", true, usememory)).value;
        
        for (let p in _data) 
        {
            if(_data[p]["i"] != 0)
                if(!regulators.hasOwnProperty(p))
                {
                    regulators[p] = _data[p]["i"] * index[t];
                }
                else
                {
                    regulators[p] += _data[p]["i"]  * index[t];
                }
        }
    }  

    return regulators;
}

// async function old_calculateTargets() {

//     let e_ids = [];

//     let fc_threshold = 0;
//     let pvalue_threshold = 1;

//     var sample = $('#om_select_sample').val(); 

//     let filter = $('#om_target_filter option:selected').text();

//     let n = parseFloat($('#om_targetcomb_slider').val());
//     let usememory = (document.getElementById("om_target_usememory").checked == true? true : false);
//     let numberOfTargets = $("#om_target_targetnumber").val();

//     let negativeCount = 0;
//     let positiveCount = 0;
//     let finishedelements_count = 0;                              

//     let _identifiedTargets = {};
    
//     let max_fc = 0;

//     activaTab("om_target_chart");


//     if(globals.omics.om_targettable)
//         globals.omics.om_targettable.destroy();

//     $("#om_target_chart_table").replaceWith(`
//         <table class="air_table order-column hover nowrap  mt-2" style="width:100%" id="om_target_chart_table" cellspacing=0>
//         </table>
//     `);

//     let elements_with_FC = {};

//     let shuffled_arrays = [];

//     let elementarray_proteins = Object.keys(AIR.Molecules).filter(m => ["PROTEIN", "RNA"].includes(AIR.Molecules[m].type))
//     let elementarray_metabolite = Object.keys(AIR.Molecules).filter(m => AIR.Molecules[m].type == "SIMPLE_MOLECULE")

//     let typeNumbersinSamples = {
//         "protein": 0,
//         "metabolite": 0
//     }

//     let FC_values = [];

//     try 
//     {
//         var promises = [];

//         if(globals.omics.pvalue)
//         {
//             pvalue_threshold = parseFloat($("#om_target_pvaluethreshold").val().replace(',', '.'))
//             if(isNaN(pvalue_threshold) || pvalue_threshold < 0)
//             {
//                 alert("Only positive (decimal) values are allowed as p-value threshold. Value was set to 1.")
//                 pvalue_threshold = 0.05;
//                 $("#om_target_pvaluethreshold").val("0.05")
//             }
//         }
//         fc_threshold = parseFloat($("#om_target_fcthreshold").val().replace(',', '.'))
//         if(isNaN(fc_threshold) || fc_threshold < 0)
//         {
//             alert("Only positive (decimal) values are allowed as FC threshold. Value was set to 1.")
//             fc_threshold = 1;
//             $("#om_target_fcthreshold").val("1")
//         }
//         fc_threshold = Math.abs(fc_threshold)

//         for(let e in AIR.Molecules)
//         {
//             let fc = 0
//             if(globals.omics.ExpressionValues.hasOwnProperty(e))
//             {
//                 if (!globals.omics.pvalue || globals.omics.ExpressionValues[e].pvalues[sample] <= pvalue_threshold)
//                 {
//                     fc = globals.omics.ExpressionValues[e].nonnormalized[sample]
//                 }
//             } 

//             if(Math.abs(fc) > Math.abs(fc_threshold))
//             {
//                 positiveCount += Math.abs(fc);
//                 elements_with_FC[e] = fc;

//                 switch (AIR.Molecules[e].type) {
//                     case "PROTEIN":
//                     case "RNA": 
//                         typeNumbersinSamples.protein += 1;
//                         break;
//                     case "SIMPLE_MOLECULE": 
//                         typeNumbersinSamples.metabolite += 1;
//                         break;
//                     default:
//                         break;
//                 }
//             }
//             else {
//                 negativeCount += 1;
//             }

//             if(AIR.Molecules[e].emptySP == true)
//             {
//                 continue;
//             }

//             let {name:_name, type:_type, subtype:_subtype, phenotypes:_sp} = AIR.Molecules[e];

//             if (_type.toLowerCase() === "phenotype") {
//                 continue;
//             }

//             let typevalue = $('#om_target_filter').val();
//             if (typevalue == 1) {
//                 if (_type != "PROTEIN") {
//                     continue;
//                 }
//             }
//             if (typevalue == 2) {
//                 if (_subtype != "miRNA") {
//                     continue;
//                 }
//             }
//             if (typevalue == 3) {
//                 if (_subtype != "lncRNA") {
//                     continue;
//                 }
//             }
//             if (typevalue == 4) {
//                 if (_subtype != "TF") {
//                     continue;
//                 }
//             } 
//             if (typevalue == 5) {
//                 if (_subtype != "RECEPTOR") {
//                     continue;
//                 }
//             }    

//             if(Math.abs(fc) > max_fc)
//             {
//                 max_fc = Math.abs(fc);
//             }
//             e_ids.push(e);
//         }

//         if(numberOfTargets == "")
//         {
//             numberOfTargets = Object.keys(AIR.Molecules).length;
//         }
//         else
//         {
//             numberOfTargets = parseFloat(numberOfTargets.replace(',', '.'))
//             if(isNaN(numberOfTargets) || numberOfTargets < 0)
//             {
//                 alert("Only positive integer numbers are allowed as a number. Number of targets was set to 100.")
//                 numberOfTargets = Object.keys(AIR.Molecules).length;
//                 switch (parseFloat($('#om_targetcomb_slider').val())) {
//                     case 2:
//                         numberOfTargets = 30;
//                         break;
//                     case 3:
//                         numberOfTargets = 15;
//                         break;
//                     case 4:
//                         numberOfTargets = 5;
//                         break;
//                 }
//             }
//         }
//         $("#om_target_targetnumber").val(numberOfTargets)

//         let molLength = e_ids.length ;
//         await updateProgress(0, molLength, "om_regulator");
             
//         globals.omics.om_targetchart.data.datasets = [];

//         setTimeout(function(){                                
//             globals.omics.om_targetchart.update();
           
//         }, 0);

//         FC_values = Object.values(elements_with_FC)
//         for(let i = 0; i < 1000; i++)
//         {
//             let shuffled_array = pickRandomElements(elementarray_proteins, typeNumbersinSamples.protein);
//             shuffled_array.push(...pickRandomElements(elementarray_metabolite, typeNumbersinSamples.metabolite))
//             shuffled_arrays.push(shuffled_array)
//         }
//         if(e_ids.length == 0)
//         {
//             $("#om_target_chart_canvas").height(400);
//             $("#om_regulator_progress").hide();
//             $("#om_btn_predicttarget").html('Predict Targets');
//             $("#airomics_tab_content").removeClass("air_disabledbutton");
//         }
//         else
//         {
//             for (let e of e_ids) {

//                 let last = (e == e_ids[e_ids.length - 1])
//                 promises.push(analyzeElement(e, last))
//                 if(promises.length >= 100 || last)
//                 {
//                     await Promise.allSettled(promises).then(async function(targets) {
//                         for(let _data of targets)
//                         {     
//                             finishedelements_count++;                              
//                             let targtetdata = _data.value.data;

//                             if(targtetdata != null)
//                             {
//                                 _identifiedTargets[targtetdata.id[0]] = targtetdata;
                                
//                                 //updateProgress(finishedelements_count, molLength, "om_regulator", `  Analyzing Element ${finishedelements_count}/${molLength}`);
//                             }

//                         }
                                                
//                         await updateProgress(finishedelements_count, molLength, "om_regulator", `  Analyzing Element ${finishedelements_count}/${molLength}`);

//                         if(last)
//                         {
//                             await updateProgress(0, 1, "om_regulator", `  Ranking and filtering Targets...`);

//                             await getadjPvaluesForObject(_identifiedTargets, "pvalue")

//                             _identifiedTargets = Object.filter(_identifiedTargets, t => _identifiedTargets[t].adj_pvalue < 0.001) 


//                             if(n > 1)
//                             {
                                                                                    
//                                 _identifiedTargets = pickHighest(_identifiedTargets, _num = numberOfTargets, ascendend = false, key = "sensitivity");
//                                 let identifiedTargets = Object.keys(_identifiedTargets);

//                                 for (var i = 0; i < identifiedTargets.length - 1; i++)
//                                 {

//                                     await updateProgress(i, identifiedTargets.length, "om_regulator", `  Iterating target combinations  ${i}/${identifiedTargets.length}`); 

//                                     for (var j = i + 1; j < identifiedTargets.length; j++) {
//                                         if(n > 2)
//                                         {
//                                             for (var k = j + 1; k < identifiedTargets.length; k++) {
//                                                 if(n > 3)
//                                                     for (var m = k + 1; m < identifiedTargets.length; m++) {
//                                                         let result = await analyzemultipletargets([identifiedTargets[i], identifiedTargets[j], identifiedTargets[k], identifiedTargets[m]])
//                                                         if(result)
//                                                         {
//                                                             _identifiedTargets[[i,j,k,m].join("_")] = result;
//                                                         }
//                                                     }
//                                                 else
//                                                 {
//                                                     let result = await analyzemultipletargets([identifiedTargets[i], identifiedTargets[j], identifiedTargets[k]])
//                                                     if(result)
//                                                     {
//                                                         _identifiedTargets[[i,j,k].join("_")] = result;
//                                                     }
//                                                 }                                            
//                                             }
//                                         }
//                                         else
//                                         {
//                                             let result = await analyzemultipletargets([identifiedTargets[i], identifiedTargets[j]])
//                                             if(result)
//                                             {
//                                                 _identifiedTargets[[i,j].join("_")] = result;
//                                             }
//                                         }
//                                     }                                
//                                 }
//                             }

//                             await getadjPvaluesForObject(_identifiedTargets, "pvalue")

//                             for(let target in _identifiedTargets)
//                             {
//                                 adddatatochart(_identifiedTargets[target]);     
//                             }
                            
//                             $("#om_target_chart_canvas").height(400);
//                             $("#om_regulator_progress").hide();
//                             $("#om_btn_predicttarget").html('Predict Targets');
//                             $("#airomics_tab_content").removeClass("air_disabledbutton");
                                    
//                             globals.omics.om_targetchart.update();
//                         }                    
//                     })

//                     promises = [];
//                 }

//             }   
//         }     
//     }
//     catch (error) 
//     {    
//         alert("Failed to analyze targets. Please try again, reload the page or contact the developers.")    
//         console.log(error)
//         $("#om_target_chart_canvas").height(400);
//         $("#om_regulator_progress").hide();
//         $("#om_btn_predicttarget").html('Predict Targets');
//         $("#airomics_tab_content").removeClass("air_disabledbutton");
//         globals.omics.om_targetchart.update();
//     }

//     var tbl = document.getElementById('om_target_chart_table');
//     var header = tbl.createTHead();
//     var headerrow = header.insertRow(0);

//     createCell(headerrow, 'th', 'Element', 'col', 'col', 'center');
//     createCell(headerrow, 'th', 'Type', 'col', 'col', 'center');
//     createCell(headerrow, 'th', 'adj p-value', 'col', 'col', 'center');
//     //createCell(headerrow, 'th', 'p-value', 'col', 'col', 'center');
//     createCell(headerrow, 'th', 'Sensitivity', 'col', 'col', 'center');
//     createCell(headerrow, 'th', 'Specificity', 'col', 'col', 'center');
//     createCell(headerrow, 'th', 'FC', 'col', 'col', 'center');
//     //createCell(headerrow, 'th', 'Effect', 'col', 'col', 'left');

    
//     globals.omics.om_targettable = $('#om_target_chart_table').DataTable({
//         "dom": '<"top"<"left-col"B><"right-col"f>>rtip',
//         "buttons": [
//             {
//                 text: 'Copy',
//                 className: 'air_dt_btn',
//                 action: function () {
//                     copyContent(getDTExportString(globals.omics.om_targettable));
//                 }
//             },
//             {
//                 text: 'CSV',
//                 className: 'air_dt_btn',
//                 action: function () {
//                     air_download("Predicted_targets.csv", getDTExportString(globals.omics.om_targettable, seperator = ","))
//                 }
//             },
//             {
//                 text: 'TSV',
//                 className: 'air_dt_btn',
//                 action: function () {
//                     air_download("Predicted_targets.txt", getDTExportString(globals.omics.om_targettable))
//                 }
//             }
//         ],   
//         "order": [[ 3, "desc" ], [ 2, "asc" ]], 
//         "scrollX": true,
//         "autoWidth": true,
//         columns: [
//             null,
//             { "width": "15%" },
//             { "width": "15%" },
//             { "width": "15%" },
//             //{ "width": "15%" },
//             { "width": "10%" },
//             { "width": "10%" },
//             ],
//         columnDefs: [
//             {
//                 targets: 0,
//                 className: 'dt-right',
//                 'max-width': '25%',
//             },
//             {
//                 targets: 1,
//                 className: 'dt-center'
//             },
//             {
//                 targets: 2,
//                 className: 'dt-center'
//             },
//             {
//                 targets: 3,
//                 className: 'dt-center'
//             },
//             {
//                 targets: 4,
//                 className: 'dt-center'
//             },
//             {
//                 targets: 5,
//                 className: 'dt-center'
//             },
//             // {
//             //     targets: 6,
//             //     className: 'dt-center'
//             // },
//         ]
//     }).columns.adjust();

//     async function getTargetpValue(targets, index, sensitivity, _regulators = null)
//     {      
//         let regulators = _regulators == null? await getRegulatorsForTarget(targets, index) : _regulators;

//         let _sensitivity_scors = [];
//         for(let shuffled_elements of shuffled_arrays)
//         {           
//             let _sensitivity = 0.0;
//             for(let i in FC_values)
//             {              
//                 let element = shuffled_elements[i];     
//                 if(regulators.hasOwnProperty(element))
//                 {
//                     _sensitivity += FC_values[i] * regulators[element];
//                 }
//             }

//             _sensitivity_scors.push(_sensitivity / positiveCount);
//         }

//         let std = standarddeviation(_sensitivity_scors)  
//         if(!std || std == 0)
//             return 1;          
//         let z_score =  (sensitivity - mean(_sensitivity_scors))/std;
//         let pvalue = GetpValueFromZ(z_score);

//         return isNaN(pvalue)? 1 : pvalue;
        
//     }

//     async function analyzemultipletargets(targets)
//     {
//         let maxScore = 0;
//         let results = null;

//         for (let index of targetCombinations(targets.length))
//         {          
//             let regulators = await getRegulatorsForTarget(targets, index)
//             let regr_data = [];
//             let positiveSum = 0;
//             let negativeSum = 0;

//             let target_values = {};
//             for (let p in AIR.Molecules) 
//             {                
//                 let SP = regulators.hasOwnProperty(p)? regulators[p] : 0;
//                 let value = elements_with_FC.hasOwnProperty(p)? elements_with_FC[p] : 0;

//                 if(SP * value != 0)
//                 {
//                     target_values[p] = value * SP; 
//                 }  

//                 positiveSum += value * SP;

//                 if(value == 0)
//                 {
//                     negativeSum += (1 - Math.abs(SP));
//                 }             
//             }

//             let sensitivity = positiveSum / positiveCount;
//             let specificity = negativeSum / negativeCount;

//             if(sensitivity > 1)
//             {
//                 sensitivity = 1;
//             }
//             else if(sensitivity < -1)
//             {
//                 sensitivity = -1;
//             }


//             if(specificity > 0 && sensitivity != 0)
//             {
//                 let positive = sensitivity > 0? true : false;
//                 let positiveValue = sensitivity > 0? 1 : -1;
//                 sensitivity = Math.abs(sensitivity);

//                 if(sensitivity <= maxScore)
//                     continue;
                
//                 maxScore = sensitivity;               
                
//                 let regulatorValues = Object.keys(pickHighest(Object.filter(target_values, t => (positive? target_values[t] > 0 : target_values[t] < 0)), _num = 10, ascendend = positive? true : false));
                


//                 results = 
//                 {
//                     "id": targets,
//                     "fc": 0,
//                     "index": index,
//                     "sensitivity": sensitivity,
//                     "name": targets.map(t => AIR.Molecules[t].name + (index[targets.indexOf(t)]*positiveValue == -1? "\u2193" : "\u2191")).join(' & '),
//                     "linkname": targets.map(t => getLinkIconHTML(AIR.Molecules[t].name) + (index[targets.indexOf(t)]*positiveValue == -1? "\u2193" : "\u2191")).join(' & '),
//                     "specificity": specificity,
//                     "regulators": regulatorValues.map(r => AIR.Molecules[r].name + (globals.omics.ExpressionValues[r].nonnormalized[sample] < 0? "\u2193" : "\u2191")),
//                     "positive": index.every( v => v === index[0])? positive : null
//                 };
//             } 
//         }

//         if(results != null)
//         {          
//             results["pvalue"] = await getTargetpValue(results.id, results.index, results.sensitivity)
            
//             return results;
//             //adddatatochart(results);
//         }
//         else
//         {
//             return false;
//         }
//             //_identifiedTargets[targets.join(";")] = results;
//     }

//     async function adddatatochart(targtetdata, colored = true)
//     {
//         return new Promise( 
//             async function(resolve, reject) {
                
//                 var radius = 2 + (6 * (1 - targtetdata.pvalue));
                        
//                 var pstyle = targtetdata.positive == null? 'circle' : 'triangle';

//                 let hex = '#d3d3d3';
                
//                 if(colored)
//                     hex = targtetdata.positive == null? '#a9a9a9' : (targtetdata.positive? (targtetdata.fc >= 0? '#C00000' : '#d3d3d3') : (targtetdata.fc <= 0? '#0070C0' : '#d3d3d3'));

//                 let result = {
//                     label: [targtetdata.name, targtetdata.fc != 0 ? expo(targtetdata.fc, 3, 3) : false, expo(targtetdata.adj_pvalue, 2, 2), targtetdata.regulators.slice(0, 5).join(", ")].join(";"),
//                     data: [{
//                         x: expo(targtetdata.specificity, 3, 3),
//                         y: expo(targtetdata.sensitivity, 3, 3),
//                         r: radius
//                     }],
//                     backgroundColor:  hex ,
//                     hoverBackgroundColor: hex,
//                     pointStyle: pstyle,
//                     rotation: targtetdata.positive? 0 : 60,
//                 }
                
//                 var tbl = document.getElementById('om_target_chart_table');
//                 let result_row = tbl.insertRow(tbl.rows.length);

//                 createCell(result_row, 'td', targtetdata.linkname, 'col-auto', 'col', 'center', true);                
//                 createPopupCell(result_row, 'td', targtetdata.positive == null? "mixed" : (targtetdata.positive? "positive" : "negative"), 'col-auto', 'center', om_createtargetpopup, {"sample": sample, "id": targtetdata.id, "index": targtetdata.index, "pvalue_threshold": pvalue_threshold, "fcthreshold": fc_threshold}),
//                 createCell(result_row, 'td', expo(targtetdata.adj_pvalue, 2, 2), 'col-auto', 'col', 'center', true);
//                 //createCell(result_row, 'td', expo(targtetdata.pvalue, 2, 2), 'col-auto', 'col', 'center', true);
//                 createCell(result_row, 'td', expo(targtetdata.sensitivity, 3, 3), 'col-auto', 'col', 'center', true);
//                 createCell(result_row, 'td', expo(targtetdata.specificity, 3, 3), 'col-auto', 'col', 'center', true);
//                 createCell(result_row, 'td', expo(targtetdata.fc, 3, 3), 'col-auto', 'col', 'center', true);
//                 //createCell(result_row, 'td', targtetdata.regulators.map(r => getLinkIconHTML(r)).join(", "), 'col-auto', 'col', 'left', true);               

//                 globals.omics.om_targetchart.data.datasets.push(result); 
//                 resolve();
//         });
//     }

//     async function analyzeElement(e, last)
//     {        

//         return new Promise(
//             async function(resolve, reject) {
                
//             let count = e_ids.indexOf(e);    
//             let fc = globals.omics.ExpressionValues.hasOwnProperty(e)? globals.omics.ExpressionValues[e].nonnormalized[sample] : 0;

//             if(isNaN(fc) || !fc)
//             {
//                 fc = 0;
//             }

//             let {name:_name, type:_type, subtype:_subtype, phenotypes:_sp} = AIR.Molecules[e];
            
//             let data = (await getMoleculeData(e, type = "molecule", true, usememory)).value
//             if(!data)
//             {
//                 resolve({
//                     index: count,
//                     data : null,
//                     last: last
//                 });
//                 return;
//             }

//             let positiveSum = 0;
//             let negativeSum = 0;

//             let target_values = {};
//             let regulators = {};

//             let _TargetsInDeGs = 0
//             let _TargetsNotInDEGs = 0
//             let _nonTargetsInDEGs = 0
//             let _nonTargetsNotInDEGs = 0

//             for (let p in AIR.Molecules) 
//             {                
//                 let spType = getSPtype(p);

//                 let SP = data.hasOwnProperty(p)? data[p][spType] : 0;
//                 let value = elements_with_FC.hasOwnProperty(p)? elements_with_FC[p] : 0;

//                 if(SP != 0)
//                 {
//                     regulators[p] = SP;
//                 }
//                 else
//                 {

//                 }
//                 if(SP * value != 0)
//                 { 
//                     target_values[p] = value * SP; 
//                     positiveSum += value * SP;
//                 }  

//                 if(value == 0)
//                 {
//                     negativeSum += (1 - Math.abs(SP));
//                 }  
//             }


//             let sensitivity = positiveSum / positiveCount;
//             let specificity = negativeSum / negativeCount
//             if(specificity > 0 && sensitivity != 0)
//             {
//                 let positive = sensitivity > 0? true : false;
//                 sensitivity = Math.abs(sensitivity);
                
//                 if (fc != 0 && document.getElementById("om_target_filtercontrary").checked === true && Math.sign(fc) != Math.sign(sensitivity)) {
//                     resolve({
//                         index: count,
//                         data : null,
//                         last: last
//                     });
//                     return;
//                 }

//                 let Ranked_DCEs = Object.keys(pickHighest(Object.filter(target_values, t => (positive? target_values[t] > 0 : target_values[t] < 0)), _num = 10, ascendend = positive? true : false));
//                 let pvalue = fishers()  //await getTargetpValue([e], [1], sensitivity, regulators);
//                 resolve({
//                     data : {
//                         "pvalue": pvalue,
//                         "id": [e],
//                         "fc": fc,
//                         "index": [1],
//                         "sensitivity": sensitivity,
//                         "name": _name,
//                         "linkname": getLinkIconHTML(_name),
//                         "specificity": specificity,
//                         "regulators": Ranked_DCEs.map(r => AIR.Molecules[r].name + (globals.omics.ExpressionValues[r].nonnormalized[sample] < 0?  "\u2193" : "\u2191")),
//                         "positive": positive
//                     },
//                 });
//                 return;
                
//             }   
        
//             resolve({
//                 index: count,
//                 data : null,
//                 last: last
//             });
            
//         })  
//     }

//     function targetCombinations(n)
//     {
//         let df = Array.from(Array(Math.pow(2, n)), () => []);

//         for (let i = 1; i <= n; i++) 
//         {
//             var j = 0
//             for (let _e = 1; _e <=  Math.pow(2, i - 1); _e++)
//                 {
//                 for (let k = 1; k <=  Math.pow(2, n - i); k++)
//                 {
//                     df[j++].push(1)
//                 }
                
//                 for (let k = 1; k <=  Math.pow(2, n - i); k++)
//                 {
//                     df[j++].push(-1)
//                 }
//             }
//         }

//         return df
//     }
// }


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


        await updateProgress(_count++, globals.omics.samples.length, "om_enrichr");
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

        if(elements.length == 0 || ENABLE_API_CALLS == false)
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
            $("#om_resultstable").parents(".dataTables_scrollBody").css({
                minHeight: "0px",
            });
            return;
        }   
        $target.remove();

    }

    $(button).attr('id', 'om_clickedpopupcell');
    $(button).css('background-color', 'lightgray');

    $target = $(`<div id="om_chart_popover" class="popover bottom in" style="max-width: none; top: 55px; z-index: 2;">
                    <div class="arrow" style="left: 9.375%;"></div>
                    <div id="om_chart_popover_content" class="popover-content">
                        <div class="cbcontainer mt-1 mb-2 ml-2">
                            <input type="checkbox" class="air_checkbox" id="om_popup_showregression">
                            <label class="air_checkbox" for="om_popup_showregression">Show Regression Line</label>
                        </div>
                        <canvas class="popup_chart" id="om_popup_chart"></canvas>
                        <div id="om_legend_target" class="d-flex justify-content-center ml-2 mr-2 mt-2 mb-2">
                            <li class="legendli" style="color:#6d6d6d; font-size:100%; white-space: nowrap;">
                                <span class="legendspan_small" style="background-color:#C00000"></span>
                                Activates Phenotype</li>
                            <li class="legendli" style="margin-left:5px; color:#6d6d6d; font-size:100%; white-space: nowrap;">
                                <span class="legendspan_small" style="background-color:#0070C0"></span>
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
    let ymin = 0, ymax = 0, xmin = 0, xmax = 0;
    for (let element in parameter.FilteredRegulators[phenotype]) {

        let SP = parameter.FilteredRegulators[phenotype][element];
        let hex = "#cccccc";
        let rad = 2;
        let FC = 0

        if(parameter.FilteredElements[sample].hasOwnProperty(element))
        {
            FC = parameter.FilteredElements[sample][element];

            rad = 4

            if((SP * FC) < 0)
            {
                hex = "#0070C0";
            }
            else if((SP * FC) > 0)
            {
                hex = "#C00000"
            }
        }

        var pstyle = 'circle';
        if(AIR.MapSpeciesLowerCase.includes(AIR.Molecules[element].name.toLowerCase()) === false)
        {
            pstyle = 'triangle'
        }

        if(FC < xmin)
            xmin = FC;
        if(FC > xmax)
            xmax = FC;
        if(SP < ymin)
            ymin = SP;
        if(SP > ymax)
            ymax = SP;
            
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

    let m = AIR.Phenotypes[phenotype]["slope"][sample];
    let y1 = null, y2 = 0, x1 = null, x2 = 0;
    for (let _x = xmin; _x <= xmax; _x += 0.01) {
        let _y = _x * m;

        if(_y > ymin && _x > xmin && y1 == null)
        {
            y1 = _y;
            x1 = _x;
        }
        if(_y < ymax && _x < xmax)
        {
            y2 = _y;
            x2 = _x;
        }
    }

    var outputCanvas = document.getElementById('om_popup_chart');

    var chartOptions = {
        type: 'bubble',        
        data: {
            datasets: targets,
        },
        options: {
            plugins: {
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
                        // Boolean to enable zooming
                        enabled: true,
                        // Zooming directions. Remove the appropriate direction to disable 
                        // Eg. 'y' would only allow zooming in the y direction
                        mode: 'xy',
                    }
                }
            },
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
                        suggestedMin:-1,    
                        suggestedMax:1,
                    }
                }],
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Fold Change in Data'
                    },
                    ticks: {
                        suggestedMin:-1,    
                        suggestedMax:1,
                    }
                }]
            },
            tooltips: {
                callbacks: {
                    label: function (tooltipItem, data) {
                        var element = data.datasets[tooltipItem.datasetIndex].label || '';

                        if(element && globals.omics.ExpressionValues.hasOwnProperty(element))
                        {                          
                            return [
                                'Name: ' + AIR.Molecules[element].name,
                                'Influence: ' + expo(AIR.Phenotypes[phenotype].values[element],4,3),
                                'FC: ' + expo(globals.omics.ExpressionValues[element].nonnormalized[sample],4,3),
                                'p-value: ' + (globals.omics.pvalue? expo(globals.omics.ExpressionValues[element].pvalues[sample], 4, 3) : "N/A")
                            ];                     
                        }
                        else
                            return "";
                        
                    }
                }
            }
        }
        
    }; 

    let popupchart = new Chart(outputCanvas, chartOptions);
    document.getElementById('om_popup_chart').onclick = function (evt) {
            var activePoint = popupchart.lastActive[0];
            if (activePoint !== undefined) {
                let _id = popupchart.data.datasets[activePoint._datasetIndex].label;
                if(_id && AIR.Molecules.hasOwnProperty(_id))
                {
                    let name = AIR.Molecules[_id].name;
                    selectElementonMap(name, true);
                    xp_setSelectedElement(name);
                }
            }
    };
    $target.show();

    var popupheight = $("#om_chart_popover").height() + 50;
    $("#om_resultstable").parents(".dataTables_scrollBody").css({
        minHeight: (popupheight > 400? 400 : popupheight) + "px",
    });

    
    $('#om_popup_showregression').on('click', function() {

        if(document.getElementById("om_popup_showregression").checked === true)
        {
            popupchart.data.datasets.push(
                {
                    data: [{
                        x: x1,
                        y: y1,
                        r: 0,
                    },
                    {
                        x: x2,
                        y: y2,
                        r: 0,
                    }],
                    type: 'line',
                    fill: false,
                    pointRadius: 0,
                    backgroundColor: m < 0? "#0070C0" : "#C00000",
                    borderColor: m < 0? "#0070C0" : "#C00000",
                    borderWidth: 2,
                }
            );
        }
        else
        {
            popupchart.data.datasets.splice(-2)
        }

        popupchart.update();
    })
};

async function om_createtargetpopup(button, parameter) {
    
    var $target = $('#om_target_chart_popover');
    var $btn = $(button);

    let sample = parameter.sample
    let phenotype = parameter.phenotype

    if($target)
    {
        
        
        $('#om_target_clickedpopupcell').css('background-color', 'transparent');
        $('#om_target_clickedpopupcell').removeAttr('id');

        if($target.siblings().is($btn))
        {
            $target.remove();
            $("#om_target_table").parents(".dataTables_scrollBody").css({
                minHeight: "0px",
            });
            return;
        }   
        $target.remove();

    }

    $(button).attr('id', 'om_target_clickedpopupcell');
    $(button).css('background-color', 'lightgray');

    $target = $(`<div id="om_target_chart_popover" class="popover bottom in" style="max-width: none; top: 55px; z-index: 2;">
                    <div class="arrow" style="left: 9.375%;"></div>
                    <div id="om_target_chart_popover_content" class="popover-content">
                        <canvas class="popup_chart" id="om_target_popup_chart"></canvas>
                        <div id="om_legend_target" class="d-flex justify-content-center ml-2 mr-2 mt-2 mb-2">
                            <li class="legendli" style="color:#6d6d6d; font-size:100%; white-space: nowrap;">
                                <span class="legendspan_small" style="background-color:#0070C0"></span>
                                Congruent Relation</li>
                            <li class="legendli" style="margin-left:5px; color:#6d6d6d; font-size:100%; white-space: nowrap;">
                                <span class="legendspan_small" style="background-color:#C00000"></span>
                                Opposite Relation</li>
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

    let regulators = await getRegulatorsForTarget(parameter.id, parameter.index)

    for (let element in globals.omics.ExpressionValues) {

        let FC = globals.omics.ExpressionValues[element].nonnormalized[sample]
        let pValue = 1;

        if(isNaN(FC) || FC == 0 || Math.abs(FC) < parameter.fcthreshold)
        {
            continue;
        }
        if(globals.omics.pvalue)
        {
            pValue = globals.omics.ExpressionValues[element].pvalues[sample];   
            if(isNaN(pValue))
                pValue = 1;

            if(pValue > parameter.pvalue_threshold)
            {
                continue;
            }
        }

        let SP = regulators.hasOwnProperty(element)? regulators[element] : 0;

        let hex = "#cccccc";
        let rad = 4;

        if(globals.omics.pvalue)
        {
            rad = 1 + (4 * (1 - pValue));
        }

        if((SP * FC) < 0)
        {
            hex = "#0070C0";
        }
        else if((SP * FC) > 0)
        {
            hex = "#C00000"
        }


        var pstyle = 'circle';
        if(AIR.MapSpeciesLowerCase.includes(AIR.Molecules[element].name.toLowerCase()) === false)
        {
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

    var outputCanvas = document.getElementById('om_target_popup_chart');

    var chartOptions = {
        type: 'bubble',        
        data: {
            datasets: targets,
        },
        options: {
            plugins: {
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
                        // Boolean to enable zooming
                        enabled: true,
                        // Zooming directions. Remove the appropriate direction to disable 
                        // Eg. 'y' would only allow zooming in the y direction
                        mode: 'xy',
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0
            },
            responsiveAnimationDuration: 0,
            hover: {
                animationDuration: 0,
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
                text: "DCEs influenced by '" + parameter.id.map(t => AIR.Molecules[t].name).join(" & ") + "' in '" + globals.omics.samples[sample] + "'",
                fontFamily: 'Helvetica',
            },
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Influence from Target'
                    },
                    ticks: {
                        //beginAtZero: true,
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
                        var element = data.datasets[tooltipItem.datasetIndex].label || '';

                        if(element && globals.omics.ExpressionValues.hasOwnProperty(element))
                        {                          
                            return [
                                'Name: ' + AIR.Molecules[element].name,
                                'Influence: ' + expo(regulators[element],4,3),
                                'FC: ' + expo(globals.omics.ExpressionValues[element].nonnormalized[sample],4,3),
                                'p-value: ' + (globals.omics.pvalue? expo(globals.omics.ExpressionValues[element].pvalues[sample], 4, 3) : "N/A")
                            ];                     
                        }
                        else
                            return "";
                        
                    }
                }
            }
        }
        
    }; 

    let popupchart = new Chart(outputCanvas, chartOptions);
    document.getElementById('om_target_popup_chart').onclick = function (evt) {
            var activePoint = popupchart.lastActive[0];
            if (activePoint !== undefined) {
                let _id = popupchart.data.datasets[activePoint._datasetIndex].label;
                if(_id && AIR.Molecules.hasOwnProperty(_id))
                {
                    let name = AIR.Molecules[_id].name;
                    selectElementonMap(name, true);
                    xp_setSelectedElement(name);
                }
            }
    };
    $target.show();

    var popupheight = $("#om_target_chart_popover").height() + 50;
    $("#om_target_table").parents(".dataTables_scrollBody").css({
        minHeight: (popupheight > 400? 400 : popupheight) + "px",
    });
    popupchart.update();
};

function randomIDs(size, max, n){
    let output = []
    let numbers = Array.from(Array(max).keys());

    for(let i = 0; i < n; i++)
    {
        output.push(shuffle(numbers).slice(0, size));
    }
    return output;
}   

function update_importVariantTable() {
    $('#om_import_variant').removeClass("air_disabledbutton")
    var tbody = $("#om_import_variant_table").children("tbody").first();
    tbody.empty();

    if(globals.variant.mutation_results && Object.keys(globals.variant.mutation_results).length > 0)
    {
        $("#om_import_variant_span").remove();
        for(let _id in globals.variant.samples)
        {
            var sample = globals.variant.samples[_id];
            tbody.append(`
                <tr>
                    <td>${sample}</td>
                    <td><input type="text"  style="text-align: center; width: 90%" class="textfield om_import_variant_samples" data="${_id}" value="${sample}"/></td>
                </tr>
            `) 
        }
    }
}

function update_importMassSpecTable() {
    $('#om_import_massspec').removeClass("air_disabledbutton")
    var tbody = $("#om_import_massspec_table").children("tbody").first();
    tbody.empty();

    if(globals.massspec.results && Object.keys(globals.massspec.results).length > 0)
    {
        $("#om_import_massspec_span").remove();
        tbody.append(`
            <tr>
                <td>AirMassSpec</td>
                <td><input type="text"  style="text-align: center; width: 90%" class="textfield om_import_massspec_samples" value="AirMassSpec_Results"/></td>
            </tr>
        `)
    }
}

function importVariant() {    
    $('.om_import_variant_samples').each(
        function (){
            for(let _sample of $(this).val().split(','))
            {
                var orig_sample = $(this).attr("data");
                var sample = _sample.trim()
                if(!globals.omics.import_data.hasOwnProperty(sample))
                {
                    globals.omics.import_data[sample] = {};
                }

                for(var m in globals.variant.mutation_results)
                {
                    switch(globals.variant.mutation_results[m][orig_sample].impact_value)
                    {
                        case 3:
                            globals.omics.import_data[sample][m] = -1;
                            break;
                        case 4:
                            globals.omics.import_data[sample][m] = -2;
                            break;
                        default:
                            globals.omics.import_data[sample][m] = 0;
                            break;
                    }
                }
            }
        }
    );
    updateImportTable(new_data = true);
};

function importMassSpec() {

    let pvalue_threshold = parseFloat($("#om_import_massspec_pvaluethreshold").val().replace(',', '.'))
    if(isNaN(pvalue_threshold))
    {
        alert("Only (decimal) numbers are allowed as an p-value threshold. p-value was set to 0.05")
        pvalue_threshold = 1;
    }

    $('.om_import_massspec_samples').each(
        
        function (){
            for(let _sample of $(this).val().split(','))
            {
                var sample = _sample.trim()
                if(!globals.omics.import_data.hasOwnProperty(sample))
                {
                    globals.omics.import_data[sample] = {};
                }
                for(var m in globals.massspec.results)
                {
                    if(AIR.ElementNames["name"].hasOwnProperty(m.toLocaleLowerCase()) && (!globals.massspec.results[m].pvalue || globals.massspec.results[m].pvalue < pvalue_threshold))
                    {
                        let molecule_id = AIR.ElementNames["name"][m.toLocaleLowerCase()];
                        globals.omics.import_data[sample][molecule_id] = globals.massspec.results[m].fc;
                    }
                }
            }
        }
    );
    updateImportTable(new_data = true);
}

function updateImportTable(new_data = false) {
    if(globals.omics.import_table)
        globals.omics.import_table.destroy();


    $( "#om_import_table" ).replaceWith('<table class="air_table order-column hover" style="width:100%" id="om_import_table" cellspacing=0/>');
    

    var tbl = document.getElementById('om_import_table');
    let header = tbl.createTHead();
    var headerrow = header.insertRow(0);

    createCell(headerrow, 'th', 'Element', 'col-3', 'col', 'center');

    let elements = new Set();

    let columnsdefs = [{
        targets: 0,
        className: 'dt-center',
    }]
    let samples = Object.keys(globals.omics.import_data)
    for(let sampleid in samples)
    {
        let sample = samples[sampleid];

        createCell(headerrow, 'th', sample, 'col-3', 'col', 'center');
        elements = union(elements, new Set(Object.keys(globals.omics.import_data[sample])))

        columnsdefs.push({
            targets: parseFloat(sampleid) + 1,
            className: 'dt-center',
        })
    }


    globals.omics.import_table = $('#om_import_table').DataTable({
        "order": [[ 0, "asc" ]],  
        "scrollX": true,
        "autoWidth": true,
        "columnDefs": columnsdefs
    }).columns.adjust();
    
    for(let element of Array.from(elements))
    {
        var result_row = [getLinkIconHTML(AIR.Molecules[element].name)];
        for(let sample in globals.omics.import_data)
        {
            if(globals.omics.import_data[sample].hasOwnProperty(element))
                result_row.push(expo(globals.omics.import_data[sample][element]))
            else
            {
                result_row.push(0)
            }
        }

        globals.omics.import_table.row.add(result_row) 

    }

    globals.omics.import_table.columns.adjust().draw();

    
    if(new_data)
    {
        globals.omics.saved_importdata = globals.omics.saved_importdata.slice(0, globals.omics.current_import_index + 1);

        if(JSON.stringify(globals.omics.import_data) != JSON.stringify(globals.omics.saved_importdata[globals.omics.current_import_index]))
        {
            globals.omics.current_import_index += 1;
            globals.omics.saved_importdata.push(JSON.parse(JSON.stringify(globals.omics.import_data))) 
            
            $("#om_import_undo").removeClass("air_disabledbutton"); 
        }

        $("#om_import_redo").addClass("air_disabledbutton"); 
    }
    else {
        
        $("#om_import_undo").removeClass("air_disabledbutton"); 
    }
    
    $("#om_initialize_import_btn").removeClass("air_disabledbutton");  
}

function numberOfUserProbes() {
    let count = 0;

    for(let e in globals.omics.ExpressionValues)
    {
        if(globals.omics.ExpressionValues[e]["custom"] == false)
        {
            count += 1;
        }
    }
    return count;
}  

async function calculateshortestPath(sample, elementids,  _count, _totalIterations, _progressbutton, _progressText)
{
    let count = _count;
    await updateProgress(count, _totalIterations, _progressbutton, text=_progressText);


    let elements = {};

    for(let e of elementids)
    {
        elements[e] = [];
    }

    for(var s of elementids)
    {
        ElementCentrality = AIR.Molecules[s].Centrality;
        ElementCentrality.Betweenness[sample] = 0;
        ElementCentrality.Closeness[sample] = 0; 
        ElementCentrality.Indegree[sample] = 0;
        ElementCentrality.Outdegree[sample] = 0;   
        ElementCentrality.Degree[sample] = 0; 
    }

    for(let inter of AIR.Interactions)
    {
        if(!elementids.includes(inter.source) || !elementids.includes(inter.target))            
        {
            continue;
        }
        
        elements[inter.source].push(inter.target);
     
        ElementCentrality = AIR.Molecules[inter.source].Centrality;
        ElementCentrality.Outdegree[sample] += 1; 
        ElementCentrality.Degree[sample] += 1;

        ElementCentrality = AIR.Molecules[inter.target].Centrality;
        ElementCentrality.Indegree[sample] += 1; 
        ElementCentrality.Degree[sample] += 1;
    }

    elements = Object.fromEntries(Object.entries(elements).filter(([_, v]) => v.length > 0));

    var neighbour, e, visited, queue, dist, spcount;
    var localBetweenness = {};


    for(var s of elementids)
    {
        visited = [s] 
        queue = [s] 
        dist = {};
        spcount = {};
        localBetweenness = {}

        dist[s] = 0;
        spcount[s] = 0;

        while(queue.length > 0)
        {
            e = queue.shift();
            
            localBetweenness[e] = []
            for(var _neighbour in elements[e])
            {
                neighbour = elements[e][_neighbour]
            
                if(!visited.includes(neighbour))
                {
                    visited.push(neighbour);
                    dist[neighbour] = dist[e] + 1;
                    spcount[neighbour] = 1;
                    queue.push(neighbour);

                    localBetweenness[e].push(neighbour);
                }
                else if(dist[neighbour] == dist[e] + 1)
                {
                    spcount[neighbour] += 1;
                    localBetweenness[e].push(neighbour);
                }
            }
        }
        for(var t in dist)
        {
            if(dist[t] > 0)
            {
                AIR.Molecules[s].Centrality.Closeness[sample] += 1/dist[t]
            }
        }
        for(var k in localBetweenness)
        {        
            if(k != s)
            {
                for(var t of getSPNodes(k))
                {
                    AIR.Molecules[k].Centrality.Betweenness[sample] += 1/spcount[t]
                }
            }
        }
        await updateProgress(count++, _totalIterations, _progressbutton, text=_progressText);
    }

    function getSPNodes(node)
    {
        let _array = [];
        if(localBetweenness.hasOwnProperty(node))
        {          
            _array = localBetweenness[node]
            for(var t of localBetweenness[node])
            {
                _array = _array.concat(getSPNodes(t));
            }
        }
        return _array;
    }

    return count;
}

function getPvalue(phenotype, sample)
{
    let prefix = document.getElementById("om_cb_fdr").checked == true? "adj_" : "";

    let _id = parseFloat($("#om_select_pvalue").val());
    let pvalue_array = globals.omics.pvalue_labels.map(p => AIR.Phenotypes[phenotype][prefix+p][sample])

    switch (_id) {
        case 1:
        case 2:   
            return pvalue_array[_id-1];
        case 0:
            return Math.max(...pvalue_array);
        case 3:
            return Math.min(...pvalue_array);
        default:
            return 1;
    }
}

function getSPtype(element)
{
    switch (AIR.Molecules[element].type) {
        case "PROTEIN":
        case "RNA": 
            return "t";
        case "SIMPLE_MOLECULE": 
            return "c";
        default:
            return "i";
    }
}

function getFilteredRegulators(phenotype, i_threshold, submapsonly)
{
    let output = {}
    for (let element in AIR.Phenotypes[phenotype].values) {
        let SP = AIR.Phenotypes[phenotype].values[element];

        if (isNaN(SP) || SP === 0 || Math.abs(SP) < i_threshold)
        {
            continue;
        }

        if (submapsonly && AIR.Phenotypes[phenotype].SubmapElements.includes(element) == false)
        {
            continue;
        }
        output[element] = SP;
    }

    return output;
}

function getFilteredExpression(sample, fc_threshold, pvalue_threshold)
{
    let output = {}
    for (let element in globals.omics.ExpressionValues)
    {
        let FC = globals.omics.ExpressionValues[element].nonnormalized[sample];
        if(!FC)
        {
            continue;
        }

        let pvalue = globals.omics.ExpressionValues[element].pvalues[sample];
        if(isNaN(pvalue) || !pvalue)
        {
            pvalue = 1;
        }
        if(pvalue > pvalue_threshold)
        {
            continue;
        }

        if (Math.abs(FC) <= fc_threshold)
        {
            continue;
        }

        output[element] = FC;
    }
    return output;
}

function getConsideredElements(pvalue_threshold = null, i_threshold = null, fc_threshold = null, submapsonly = null)
{
    if(submapsonly == null)
    {
        submapsonly = document.getElementById("checkbox_submap").checked
    }
    if(pvalue_threshold == null)
    {
        if(globals.omics.pvalue)
        {
            pvalue_threshold = parseFloat($("#om_pheno_pvaluethreshold").val().replace(',', '.'))
            if(isNaN(pvalue_threshold) || pvalue_threshold < 0)
            {
                pvalue_threshold = 0.05;
            }
        }
        else
        {
            pvalue_threshold = 1;
        }
    }

    if(i_threshold == null)
    {
        i_threshold = parseFloat($('#om_ithreshold_slider').val());
    }
    
    if(fc_threshold == null)
    {
        fc_threshold = parseFloat($("#om_pheno_fcthreshold").val().replace(',', '.'))
        if(isNaN(fc_threshold) || fc_threshold < 0)
        {
            fc_threshold = 1;
        }
        fc_threshold = Math.abs(fc_threshold)
    }

    let DCEs = {}
    for(let sample in globals.omics.samples)
    {
        DCEs[sample] = Object.keys(getFilteredExpression(sample, fc_threshold, pvalue_threshold))
    }

    let numberofregulators = new Set()
    let numberperphenotype = {}
    let percentageperphenotype = {}

    for(let phenotype in AIR.Phenotypes)
    {
        numberperphenotype[phenotype] = {};
        percentageperphenotype[phenotype] = {};
        
        for(let sample in globals.omics.samples)
        {
            numberperphenotype[phenotype][sample] = 0
        }
        for(let item of Object.keys(getFilteredRegulators(phenotype, i_threshold, submapsonly)))
        {
            for(let sample in globals.omics.samples)
            {
                if(DCEs[sample].includes(item))
                {
                    numberofregulators.add(item);
                    numberperphenotype[phenotype][sample] += 1;
                }
            }
        }
        for(let sample in globals.omics.samples)
        {
            percentageperphenotype[phenotype][sample] = numberperphenotype[phenotype][sample] * 100 / (Object.keys(AIR.Phenotypes[phenotype].values)).length;
        }
        
    }


    return {
        total: numberofregulators.size,
        avrg: mean(Object.keys(numberperphenotype).map(p => mean(Object.values(numberperphenotype[p])))),
        avrg_percent: mean(Object.keys(percentageperphenotype).map(p => mean(Object.values(percentageperphenotype[p])))),
    }
}

async function updateConsideredElements(pvalue_threshold = null, i_threshold = null, fc_threshold = null, submapsonly = null)
{
    let numberofregulators = getConsideredElements(pvalue_threshold, i_threshold, fc_threshold, submapsonly);

    let text = `${numberofregulators.total} elements will be considered (${expo(numberofregulators.avrg)} (${expo(numberofregulators.avrg_percent)}%) per phenotype per sample on average).`
    if ( !$( "#om_pheno_predicted_mapped_elements" ).length ) {
    
        $( `<p id="om_pheno_predicted_mapped_elements">${text}<p>`).insertBefore($( "#om_pheno_analyzebtn" ));
    
    }
    else
    {
        $( "#om_pheno_predicted_mapped_elements" ).replaceWith(`<p id="om_pheno_predicted_mapped_elements">${text}<p>`);
    }
}

async function optimizePhenotypeSettings()
{
    return new Promise((resolve, reject) =>
    {
        setTimeout(() => {
            let submaps = [true, false]
            let pvalue_thresholds =  globals.omics.pvalue? [0.0001, 0.001, 0.01, 0.05] : [1];
            let fc_thresholds = [1.5, 1, 0.5, 0]
            let i_thresholds = [0.2, 0.15, 0.1, 0.05, 0]
            
            for(let submap of submaps)
            {
                for(let pvalue_threshold of pvalue_thresholds)
                {
                    for(let fc_threshold of fc_thresholds)
                    {
                        for(let i_threshold of i_thresholds)
                        {
                            let considerd_elements = getConsideredElements(pvalue_threshold, i_threshold, fc_threshold, submap);

                            let lastitem = (submap == [ ...submaps ].pop() && pvalue_threshold == [ ...pvalue_thresholds ].pop() && fc_threshold == [ ...fc_thresholds ].pop() && i_threshold == [ ...i_thresholds ].pop())

                            if((submap && considerd_elements.avrg > 10) || (!submap && considerd_elements.avrg > 30) || considerd_elements.avrg_percent > 5 || lastitem)
                            {
                                $("#om_pheno_fcthreshold").val(fc_threshold);
                                $('#om_ithreshold_slider').val(i_threshold)
                                $('#om_ithreshold_value').html(i_threshold)                        
                                $("#om_pheno_pvaluethreshold").val(pvalue_threshold)
                                document.getElementById("checkbox_submap").checked = submap;

                                let text = `${considerd_elements.total} elements will be considered (${expo(considerd_elements.avrg)} (${expo(considerd_elements.avrg_percent)}%) per phenotype per sample on average).`
                                if ( !$( "#om_pheno_predicted_mapped_elements" ).length ) {
                                
                                    $( `<p id="om_pheno_predicted_mapped_elements">${text}<p>`).insertBefore($( "#om_pheno_analyzebtn" ));
                                
                                }
                                else
                                {
                                    $( "#om_pheno_predicted_mapped_elements" ).replaceWith(`<p id="om_pheno_predicted_mapped_elements">${text}<p>`);
                                }

                                if(lastitem)
                                    resolve(false);
                                else
                                {
                                    resolve(true);
                                }
                                return;
                            }
                        }
                    }
                }
            }

            resolve('');
            return;
        }, 0);
    });
}