async function AirMassSpec() {

    globals.massspec = {
        max_fc: 0,
        mz_column: 0,
        r_column: 1,
        c_column: 2,
        fc_column: null,

        polarity: true,
        thresholds: {
            "m": 0.5,
            "r": 5,
            "c": 5
        },
        abbreviations: {
            "m": "m/z",
            "r": "Retention Time",
            "c": "CCS"
        },

        raw_values: [],
        metadata: null,
        metabolite_values: null,

        ms_container: undefined,
        data_chart: undefined,
        samples: [],
        columnheaders: [],
        seperator: "\t",

        adduct_table: undefined,
        metabolite_table: undefined,

        colors: ["#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F", "#EDC948", "#B07AA1", "#FF9DA7", "#9C755F", "#BAB0AC"],
        pickedcolors: [],

        numberofcontrols: 0,
        numberofcases: 0,

        results: {}
    }

    globals.massspec.ms_container = $('#airmassspec_tab_content');

    $("#airmassspec_tab").on('shown.bs.tab', function () {
        globals.massspec.metabolite_table.columns.adjust();
        globals.massspec.adduct_table.columns.adjust();
    });

    $(
        /*<div class="text-center">
            <img src="https://www.sbi.uni-rostock.de/files/Projects/AIR/AIR3D_croped.png" class="img-fluid" width="100%">
        </div>*/
        /*html*/`                            



        <h5 class="mt-4">Reference File:</h5>
        <div class="row mb-4 mt-1">
            <div class="col-auto">
                <div class="wrapper">
                    <button type="button" id="air_btn_info_html" class="air_btn_info btn btn-secondary ml-1"
                            data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Reference Peak File"
                            data-content="File containing reference peak data in a tab-separated tabular format. An example file can be found <a href='https://github.com/sbi-rostock/AIR/blob/master/AirPlugins/Metabolite_meta.txt' target='_blank'>here</a>">
                        ?
                    </button>
                </div>
            </div>
            <div class="col">
                <input id="ms_input_meta" type="file" class="ms_inputfile inputfile" />
            </div>
        </div>

        <h5 class="mt-4">Data File:</h5>
        <div class="row mb-4 mt-1">
            <div class="col-auto">
                <div class="wrapper">
                    <button type="button" class="air_btn_info btn btn-secondary ml-1"
                            data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="File Specifications"
                            data-content="CSV mass spec data file.">
                        ?
                    </button>
                </div>
            </div>
            <div class="col">
                <input id="ms_inputId" type="file" class="ms_inputfile inputfile" />
            </div>
        </div>
        <div id="ms_mzSelect-container" class="row mb-2 mt-2">
            <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right;">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">File Type:</span>
            </div>
            <div class="col">
                <select id="ms_filetypeSelect" class="browser-default ms_select custom-select">
                    <option value="0" selected>TSV</option>
                    <option value="1">CSV</option>
                </select>
            </div>
        </div>
        <div class="row mt-2 mb-2">
            <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right;">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Polarity:</span>
            </div>
            <div class="col-auto">
                <div class="cbcontainer">
                    <input type="checkbox" class="air_checkbox" id="ms_positive" checked>
                    <label class="air_checkbox" for="ms_positive">Positive</label>
                </div>
            </div>
            <div class="col-auto">
                <div class="cbcontainer">
                    <input type="checkbox" class="air_checkbox" id="ms_negative">
                    <label class="air_checkbox" for="ms_negative">Negative</label>
                </div>
            </div>
        </div>

        <div class="row mb-1 mt-2">
            <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right;">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">m/z column:</span>
            </div>
            <div class="col">
                <select id="ms_mzSelect" class="air_disabledbutton browser-default ms_select custom-select">

                </select>
            </div>
        </div>

        <div class="row mb-1 mt-1">
            <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right;">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Rt column:</span>
            </div>
            <div class="col">
                <select id="ms_retentionSelect" class="air_disabledbutton browser-default ms_select custom-select">

                </select>
            </div>
        </div>

        <div class="row mb-1 mt-1">
            <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right;">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">CCS column:</span>
            </div>
            <div class="col">
                <select id="ms_ccsSelect" class="air_disabledbutton browser-default ms_select custom-select">

                </select>
            </div>
        </div>

        <div class="mb-2 mt-2" style="overflow: hidden;">
            <div class="air_checkboxlist_container">
                <label>Control Samples</label>
                <div class="air_checkboxlist_scroll_container">
                    <ul class="air_checkboxlist" id="ms_control_sample_list">
                    </ul>
                </div>
            </div>
            <div class="air_checkboxlist_container">
                <label>Case Samples</label>
                <div class="air_checkboxlist_scroll_container">
                    <ul  class="air_checkboxlist" id="ms_case_sample_list">
                    </ul>
                </div>
            </div>
        </div>
        
        <button type="button" id="ms_btn_readdata" class="air_disabledbutton air_btn btn btn-block mt-2 mb-2">Read File</button>

        <hr>
        <div class="air_disabledbutton" id="ms_results_pane">
            <table class="air_simple_table mb-1 mt-4" style="width: 100%">
                <colgroup>
                    <col span="1" style="width: 30%;"/>
                    <col span="1" style="width: 7%;"/>
                    <col span="1" style="width: 25%;"/>
                    <col span="1" style="width: 7%;"/>
                    <col span="1" style="width: 15.5%;"/>
                    <col span="1" style="width: 15.5%;"/>
                </colgroup>
                <thead>
                    <tr>
                        <th style="vertical-align: middle;"></th>
                        <th style="vertical-align: middle;"></th>
                        <th style="vertical-align: middle;"></th>
                        <th style="vertical-align: middle;"></th>
                        <th style="vertical-align: middle;">%</th>
                        <th style="vertical-align: middle;">abs [
                                <a href="javascript:void(0);" data-html="true"  style="color: black;" data-trigger="hover" data-toggle="popover" data-placement="left" title="Absolute Threshold"
                                        data-content="Enter a value to use as an absolute threshold instead of a relative one.">
                                    ?
                                </a>]
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="ms_slider_row">
                        <td style="text-align: right;">m/z Threshold:</td>
                        <td>0</td>
                        <td>
                            <input type="range" style="width: 100%"  value="20" min="0" max="100" step="1" class="slider air_slider ms_slider" data="m" id="ms_slider_m">
                        </td>
                        <td>1</td>
                        <td>
                            <input type="text"  style="text-align: center; width: 90%" class="textfield ms_relative_value" value="20" id="ms_mvalue_relative" onkeypress="return isNumber(event)" />
                        </td>  
                        <td>
                            <input type="text"  style="text-align: center; width: 90%" class="textfield ms_absolute_value" value="" id="ms_mvalue_absolute"  onkeypress="return isNumber(event)" />
                        </td>                    
                    </tr>
                    <tr class="ms_slider_row">
                        <td style="text-align: right;">Rt Threshold:</td>
                        <td>0</td>
                        <td>
                            <input type="range" value="5" min="0" max="10" step="0.5" class="slider air_slider ms_slider" data="r" id="ms_slider_r">
                        </td>
                        <td>10</td>
                        <td>
                            <input type="text"  style="text-align: center; width: 90%" class="textfield ms_relative_value" value="5" id="ms_rvalue_relative" onkeypress="return isNumber(event)" />
                        </td>  
                        <td>
                            <input type="text"  style="text-align: center; width: 90%" class="textfield ms_absolute_value" value="" id="ms_rvalue_absolute"  onkeypress="return isNumber(event)" />
                        </td>                    
                    </tr>
                    <tr class="ms_slider_row">
                        <td style="text-align: right;">CCS Threshold:</td>
                        <td>0</td>
                        <td>
                            <input type="range" value="5" min="0" max="10" step="0.5" class="slider air_slider ms_slider" data="c" id="ms_slider_c">
                        </td>
                        <td>10</td>
                        <td>
                            <input type="text"  style="text-align: center; width: 90%" class="textfield ms_relative_value" value="5" id="ms_cvalue_relative" onkeypress="return isNumber(event)" />
                        </td>  
                        <td>
                            <input type="text"  style="text-align: center; width: 90%" class="textfield ms_absolute_value" value="" id="ms_cvalue_absolute"  onkeypress="return isNumber(event)" />
                        </td>                    
                    </tr>
                </tbody>
            </table>

            <div class="row mt-2 mb-2">
                <div class="col-auto">
                    <div class="wrapper">
                        <button type="button" class="air_btn_info btn btn-secondary"
                                data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Chart behaviour"
                                data-content="Uncheck to increase performance.<br/>">
                            ?
                        </button>
                    </div>
                </div>
                <div class="col">
                    <div class="cbcontainer">
                        <input type="checkbox" class="air_checkbox" id="ms_checkbox_dynamicupdate" checked>
                        <label class="air_checkbox air_checkbox_label" for="ms_checkbox_dynamicupdate">Continuous update of chart</label>
                    </div>
                </div>
            </div>
            
            <div class="row  mt-2 mb-2">
                <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right;">
                    <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Mapping of peaks by:</span>
                </div>
                <div class="col">
                    <select id="ms_select_mapping" class="browser-default ms_axis_select custom-select">
                        <option selected value="0">Shortest euclidian distance</option>
                        <option value="1">Highest absolute FC</option>
                        <option value="2">Highest FC</option>
                        <option value="3">Lowest FC</option>
                        <option value="4">Highest Control Value</option>
                        <option value="5">Lowest Control Value</option>
                        <option value="6">Highest Case Value</option>
                        <option value="7">Lowest Case Value</option>
                    </select>
                </div>
            </div>
            <div class="row mt-2 mb-4">
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
                        <input type="checkbox" class="air_checkbox" id="ms_checkbox_weighting">
                        <label class="air_checkbox air_checkbox_label" for="ms_checkbox_weighting">Weighted Distance?</label>
                    </div>
                </div>
            </div>


            <div class="mt-4" id="ms_maintab" >
                <ul class="air_nav_tabs nav nav-tabs" role="tablist">
                    <li class="air_nav_item nav-item" style="width: 50%;">
                        <a class="air_tab air_tab_sub active nav-link" id="ms_table-tab" data-toggle="tab" href="#ms_table" role="tab" aria-controls="ms_table" aria-selected="true">Overview</a>
                    </li>
                    <li class="air_nav_item nav-item" style="width: 50%;">
                        <a class="air_tab air_tab_sub nav-link" id="ms_peak-tab" data-toggle="tab" href="#ms_peak" role="tab" aria-controls="ms_peak" aria-selected="false">Peak Chart</a>
                    </li>
                </ul>
                <div class="tab-content air_tab_content" id="ms_tab">
                    <div class="tab-pane show active air_sub_tab_pane mb-2" id="ms_table" role="tabpanel" aria-labelledby="ms_table-tab">  
                        <ul class="air_nav_tabs nav nav-tabs" role="tablist">
                            <li class="air_nav_item nav-item" style="width: 50%;">
                                <a class="air_tab air_tab_sub active nav-link" id="ms_table_adduct-tab" data-toggle="tab" href="#ms_table_adduct" role="tab" aria-controls="ms_table_adduct" aria-selected="true">Adducts</a>
                            </li>
                            <li class="air_nav_item nav-item" style="width: 50%;">
                                <a class="air_tab air_tab_sub nav-link" id="ms_table_metabolite-tab" data-toggle="tab" href="#ms_table_metabolite" role="tab" aria-controls="ms_table_metabolite" aria-selected="false">Metabolites</a>
                            </li>
                        </ul>
                        <div class="tab-content air_tab_content" id="ms_tab_sub">                    
                            <div class="tab-pane show active air_sub_tab_pane mb-2" id="ms_table_adduct" role="tabpanel" aria-labelledby="ms_table_adduct-tab"> 
                                <table class="air_table order-column hover nowrap  mt-2" style="width:100%" id="ms_adduct_table" cellspacing=0>
                                    <thead>
                                        <tr>
                                            <th style="vertical-align: middle;"></th>
                                            <th style="vertical-align: middle;">Metabolite</th>
                                            <th style="vertical-align: middle;">Full Name</th>
                                            <th style="vertical-align: middle;">Adduct</th>
                                            <th style="vertical-align: middle;">FC</th>
                                            <th style="vertical-align: middle;">p-value</th>
                                            <th style="vertical-align: middle;">m/z</th>
                                            <th style="vertical-align: middle;">Rt</th>
                                            <th style="vertical-align: middle;">CCS</th>
                                            <th style="vertical-align: middle;">Distance</th>
                                        </tr>
                                    </thead>
                                </table>  
                            </div>
                            <div class="tab-pane air_sub_tab_pane mb-2" id="ms_table_metabolite" role="tabpanel" aria-labelledby="ms_table_metabolite-tab"> 
                                <div class="row  mt-2 mb-2">
                                    <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right;">
                                        <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Mapping of adducts by:</span>
                                    </div>
                                    <div class="col">
                                        <select id="ms_select_a_mapping" class="browser-default ms_axis_select custom-select">
                                            <option selected value="0">Highest Intensity</option>
                                            <option value="1">Lowest Intensity</option>
                                            <option value="2">Mean Value</option>
                                        </select>
                                    </div>
                                </div>   
                                <div class="row  mt-2 mb-4">
                                    <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right;">
                                        <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Mapping of compounds by:</span>
                                    </div>
                                    <div class="col">
                                        <select id="ms_select_c_mapping" class="browser-default ms_axis_select custom-select">
                                            <option selected value="0">Mean Value</option>
                                            <option value="1">Aggregated Intensity</option>
                                        </select>
                                    </div>
                                </div>
                                <table class="air_table order-column hover nowrap mt-4" style="width:100%" id="ms_metabolite_table" cellspacing=0>
                                    <thead>
                                        <tr>
                                            <th style="vertical-align: middle;">Metabolite</th>
                                            <th style="vertical-align: middle;">FC</th>
                                            <th style="vertical-align: middle;">p-value</th>
                                        </tr>
                                    </thead>
                                </table>  
                                <table class="air_simple_table mb-4 mt-4" style="width: 100%">
                                    <colgroup>
                                        <col span="1" style="width: 30%;"/>
                                        <col span="1" style="width: 15%;"/>
                                        <col span="1" style="width: 5%;"/>
                                        <col span="1" style="width: 15%;"/>
                                    </colgroup>
                                    <tbody>
                                        <tr>
                                            <td style="text-align: right;">Map FC from </td>
                                            <td>
                                                <input type="text"  style="text-align: center; width: 90%" class="textfield" value="-5" id="ms_ol_min" onkeypress="return isNumber(event)" />
                                            </td>  
                                            <td>to</td>
                                            <td>
                                                <input type="text"  style="text-align: center; width: 90%" class="textfield" value="5" id="ms_ol_max"  onkeypress="return isNumber(event)" />
                                            </td>                    
                                        </tr>
                                    </tbody>
                                </table>
                                
                                <input id="ms_olname" class="form-control mb-4 mt-4" type="text" placeholder="Overlay Name"> 

                                <button type="button" id="ms_addoverlay" class="air_btn btn btn-block mt-4">Create Overlay</button>

                            </div>                
                        </div>
                    </div>
                    <div class="tab-pane air_sub_tab_pane mb-2" id="ms_peak" role="tabpanel" aria-labelledby="ms_peak-tab">  
                        <div class="row mt-2 mb-2">
                            <div class="col-2 air_select_label">
                                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">X-Axis:</span>
                            </div>
                            <div class="col" style="width: 80%; padding-left: 8px">
                                <select id="ms_select_x" class="browser-default ms_axis_select custom-select">
                                    <option selected value="m">m/z</option>
                                    <option disabled value="r">Retention Time</option>
                                    <option value="c">CCS</option>
                                </select>
                            </div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-2 air_select_label">
                                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Y-Axis:</span>
                            </div>
                            <div class="col" style="width: 80%; padding-left: 8px">
                                <select id="ms_select_y" class="browser-default ms_axis_select custom-select">
                                    <option disabled value="m">m/z</option>
                                    <option selected value="r">Retention Time</option>
                                    <option value="c">CCS</option>
                                </select>
                            </div>
                        </div>      
                        
                        <div class="row mt-2 mb-2">
                            <div class="col-auto">
                                <div class="wrapper">
                                    <button type="button" class="air_btn_info btn btn-secondary"
                                            data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Handling 3D axes"
                                            data-content="Decide whether the third parameter, that is not visible in the 2D graph, should be considered when filtering the values.<br/>">
                                        ?
                                    </button>
                                </div>
                            </div>
                            <div class="col">
                                <div class="cbcontainer">
                                    <input type="checkbox" class="air_checkbox" id="ms_checkbox_zaxis" checked>
                                    <label class="air_checkbox air_checkbox_label" for="ms_checkbox_zaxis">Account for z-Axis</label>
                                </div>
                            </div>
                        </div>
            
            
                        <hr>
            
                        <select id="ms_select_compound" class="browser-default ms_select custom-select mb-1">
            
                        </select>
            
                        <div id="ms_chart_data_container" style="position: relative; max-height: 400px;">
                            <canvas id="ms_chart_data" style="height: 400px;"></canvas>
                        </div>                
                    </div>
                </div>
            </div>
        </div>
    `
    ).appendTo(globals.massspec.ms_container);

    $('#ms_addoverlay').on('click', async function () {

        var max = parseFloat($("#ms_ol_max").val());
        var min = parseFloat($("#ms_ol_min").val());

        if (isNaN(min) || min >= 0) {
            alert("Please provide a value smaller than zero for the min FC.");
            return;
        }
        if (isNaN(max) || max <= 0) {
            alert("Please provide a value greater than zero for the min FC.");
            return;
        }

        var text = await disablebutton("ms_addoverlay");
        var olname = $("#ms_olname").val();
        globals.specialCharacters.forEach(c => {
            olname = olname.replaceAll(c, "");
        })

        if (olname == "") {
            alert("Please specify a name for the overlay.");
            enablebtn("ms_addoverlay", text);
            return;
        }

        await air_addoverlay(olname, ms_contentString)

        enablebtn("ms_addoverlay", text);
    });

    $("#ms_table-tab").on('shown.bs.tab', function () {
        globals.massspec.metabolite_table.columns.adjust();
        globals.massspec.adduct_table.columns.adjust();
    });

    $("#ms_table_metabolite-tab").on('shown.bs.tab', function () {
        globals.massspec.metabolite_table.columns.adjust();
    });

    $("#ms_table_adduct-tab").on('shown.bs.tab', function () {
        globals.massspec.adduct_table.columns.adjust();
    });

    $("#ms_peak-tab").on('shown.bs.tab', function () {
        globals.massspec.data_chart.update();
    });

    $('#air_btn_info_html').popover({
        html:true,
        container: "#air_btn_info_html"
    })

    $('.air_btn_info[data-toggle="popover"]').not('#air_btn_info_html').popover()

    $('a[data-toggle="popover"]').popover()

    $('#ms_checkbox_zaxis').on('change', async function () {
        fillGraph(true, false);
    });

    $('#ms_select_x').on('change', async function () {
        let val = $(this).val()
        $('#ms_select_y').children().each(
            function () {
                if ($(this).val() == val) {
                    $(this).attr('disabled', 'disabled');
                }
                else {
                    $(this).removeAttr('disabled');
                }
            }
        );
        fillGraph(true, true);
    });

    $('#ms_select_y').on('change', async function () {
        let val = $(this).val()
        $('#ms_select_x').children().each(
            function () {
                if ($(this).val() == val) {
                    $(this).attr('disabled', 'disabled');
                }
                else {
                    $(this).removeAttr('disabled');
                }
            }
        );
        fillGraph(true, true);
    });

    $('#ms_select_mapping').on('change', async function () {
        if ($("#ms_select_mapping").val() == 0)
            $("#ms_checkbox_weighting").removeClass("air_disabledbutton");
        else
            $("#ms_checkbox_weighting").addClass("air_disabledbutton");
        await fillGraph(true, false);
    });

    $("#ms_checkbox_weighting").on('change', async function () {
        await fillGraph(true, false);
    });

    $('.ms_relative_value').on('input', async function () {

        var number = parseFloat($(this).val());
        if (isNaN(number)) {
            return;
        }

        var slider = $(this).closest(".ms_slider_row").find(".ms_slider").first().get()[0];
        globals.massspec.thresholds[slider.getAttribute("data")] = number

        if (number > slider.max) {
            slider.value = slider.max
        }
        else if (number < slider.min) {
            slider.value = slider.min
        }
        else {
            slider.value = number
        }

        await fillGraph(true, false);
    });

    $('.ms_absolute_value').on('input', async function () {
        await fillGraph(true, false);
    });

    $('.ms_slider').on('change', async function () {
        await fillGraph(true, false);
    });

    $('.ms_slider').on('input', async function () {
        globals.massspec.thresholds[$(this).attr("data")] = $(this).val();
        $(this).closest(".ms_slider_row").find('.ms_relative_value').first().val($(this).val())
        if (($("#ms_checkbox_dynamicupdate").prop('checked') == true)) {
            await fillGraph(false, false);
        }
    });

    $('#ms_filetypeSelect').on('change', async function () {

        switch (parseFloat($('#ms_filetypeSelect').val())) {
            case 1:
                globals.massspec.seperator = ",";
                break;
            case 0:
                globals.massspec.seperator = "\t";
                break;
        }
        globals.massspec.ms_container.addClass("air_disabledbutton")
        await ms_detectFile(true);
        globals.massspec.ms_container.removeClass("air_disabledbutton")
    });

    $('#ms_select_compound').on('change', async function () {
        await fillGraph(true, true);
    });


    $('#ms_select_compound').on('change', async function () {
        await fillGraph(true, true);
    });

    $('#ms_inputId').on('change', async function () {
        globals.massspec.ms_container.addClass("air_disabledbutton")
        let result = await ms_detectFile(false);
        globals.massspec.ms_container.removeClass("air_disabledbutton")
        return result;
    });

    $('#ms_select_a_mapping').on('change', async function () {
        await updateMetaboliteTable();
    });
    $('#ms_select_c_mapping').on('change', async function () {
        await updateMetaboliteTable();
    });

    $('#ms_negative').change(function () {
        if ($(this).prop('checked') === true) {
            $('#ms_positive').prop('checked', false)
        }
    });
    $('#ms_negative').click(function () {
        if ($(this).prop('checked') === false) {
            return false;
        }
    });
    $('#ms_positive').change(function () {
        if ($(this).prop('checked') === true) {
            $('#ms_negative').prop('checked', false)
        }
    });
    $('#ms_positive').click(function () {
        if ($(this).prop('checked') === false) {
            return false;
        }
    });

    $('#ms_btn_readdata').on('click', async function () {
        var _text = await disablebutton("ms_btn_readdata")
        ms_loadfile().then(r => {
            fillGraph(true, true).then(s => {
                $("#ms_results_pane").removeClass("air_disabledbutton");
            })
        }).catch(error => {
            alert(error);
        }).finally(r => {
            enablebtn("ms_btn_readdata", _text)
        })

    });

    globals.massspec.adduct_table = $('#ms_adduct_table').DataTable({
        "order": [[1, "asc"]],
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
                className: 'dt-left'
            },
            {
                targets: 3,
                className: 'dt-left',
            },
            {
                targets: 4,
                className: 'dt-center'
            },
            {
                targets: 5,
                className: 'dt-center'
            },
            {
                targets: 6,
                className: 'dt-center',
            },
            {
                targets: 7,
                className: 'dt-center'
            },
            {
                targets: 8,
                className: 'dt-center'
            }
        ]
    }).columns.adjust().draw();

    globals.massspec.metabolite_table = $('#ms_metabolite_table').DataTable({
        "order": [[0, "asc"]],
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
            }
        ]
    }).columns.adjust().draw();


    async function ms_detectFile(force_seperator) {
        return new Promise((resolve, reject) => {

            if (document.getElementById("ms_inputId").files.length == 0) {
                $("#ms_ccsSelect").addClass("air_disabledbutton");
                $("#ms_retentionSelect").addClass("air_disabledbutton");
                $("#ms_mzSelect").addClass("air_disabledbutton");
                $("#ms_btn_readdata").addClass("air_disabledbutton");
            }
            var fileToLoad = document.getElementById("ms_inputId").files[0];

            globals.massspec.columnheaders = [];
            $("#ms_mzSelect").empty();
            $("#ms_retentionSelect").empty();

            $("#ms_control_sample_list").empty()
            $("#ms_case_sample_list").empty()

            var fileReader = new FileReader();
            var success = false;

            try {
                fileReader.readAsText(fileToLoad, "UTF-8");
            } catch (error) {
                resolve(false)
            }


            fileReader.onload = function (fileLoadedEvent) {

                var textFromFileLoaded = fileLoadedEvent.target.result;

                if (textFromFileLoaded.trim() == "") {
                    return stopfile('The file appears to be empty.');
                }
                var line = textFromFileLoaded.split('\n')[0];

                if (!force_seperator) {
                    if ((line.match(new RegExp(",", "g")) || []).length > (line.match(new RegExp("\t", "g")) || []).length) {
                        globals.massspec.seperator = ",";
                        $("#ms_filetypeSelect").val(1);
                    }
                    else {
                        globals.massspec.seperator = "\t";
                        $("#ms_filetypeSelect").val(0);
                    }
                }

                var index = 0;
                line.split(globals.massspec.seperator).forEach(entry => {
                    let header = entry;
                    globals.specialCharacters.forEach(c => {
                        header = header.replace(c, "");
                    })
                    globals.massspec.columnheaders.push(header.trim());
                    index++;
                })


                let mzSelect = document.getElementById('ms_mzSelect');
                let rSelect = document.getElementById('ms_retentionSelect');
                let cSelect = document.getElementById('ms_ccsSelect');

                for (let i = 0; i < globals.massspec.columnheaders.length; i++) {

                    let header = globals.massspec.columnheaders[i]

                    if (globals.massspec.columnheaders.filter(item => item == header).length > 1) {
                        resolve(stopfile('Headers in first line need to be unique!<br>Column ' + header + ' occured multiple times.'));
                    }

                    mzSelect.options[mzSelect.options.length] = new Option(header, i);
                    if (header.toLowerCase().includes("m/z") || header.toLowerCase().includes("m / z") || header.toLowerCase().includes("mz") || header.toLowerCase().includes("m /z") || header.toLowerCase().includes("m/ z")) {
                        $("#ms_mzSelect").val(i);
                    }
                    rSelect.options[rSelect.options.length] = new Option(header, i);
                    if (header.toLowerCase().includes("retention")) {
                        $("#ms_retentionSelect").val(i);
                    }
                    cSelect.options[cSelect.options.length] = new Option(header, i);
                    if (header.toLowerCase().includes("ccs")) {
                        $("#ms_ccsSelect").val(i);
                    }


                    var item = `
                        <input type="checkbox" class="air_checkbox" id="ms_positive" checked>

                    `
                    $("#ms_control_sample_list").append(`<li>
                        <input class="ms_sample_item" id="ms_sampleitem_control_${i}" data="${i}" type="checkbox">
                        <label class="air_checkbox" for="ms_sampleitem_control_${i}">${header}</label>
                    </li>`)
                    $("#ms_case_sample_list").append(`<li>
                        <input class="ms_sample_item" id="ms_sampleitem_case_${i}" data="${i}" type="checkbox">
                        <label class="air_checkbox" for="ms_sampleitem_case_${i}">${header}</label>
                    </li>`)
                };
                if (globals.massspec.columnheaders.length <= 1) {
                    resolve(stopfile('Could not read Headers'));
                    return;
                }

                success = true;

                function stopfile(alerttext) {
                    alert(alerttext);
                    success = false;
                    return false;
                }

                $("#ms_ccsSelect").removeClass("air_disabledbutton");
                $("#ms_retentionSelect").removeClass("air_disabledbutton");
                $("#ms_mzSelect").removeClass("air_disabledbutton");
                $("#ms_btn_readdata").removeClass("air_disabledbutton");

                resolve(success);
            };

        });
    }

    await drawChart();

}

function ms_Xvalue() {
    return $("#ms_select_x").val()
}
function ms_Yvalue() {
    return $("#ms_select_y").val()
}

async function ms_loadfile() {
    let _result = true;
    if (globals.massspec.metadata == null) {
        _result = await initializeData()
    }
    return new Promise((resolve, reject) => {

        if (_result == false) {
            reject("Could not read the reference data. Please check the file and try again.")
        }

        globals.massspec.raw_values = [];

        var resolvemessage = "";
        var fileToLoad = document.getElementById("ms_inputId").files[0];

        if (!fileToLoad) {

            reject('No file selected.');
        }

        var fileReader = new FileReader();
        try {
            fileReader.readAsText(fileToLoad, "UTF-8");
        } catch (error) {
            resolve(false)
        }
        fileReader.onload = function (fileLoadedEvent) {

            var textFromFileLoaded = fileLoadedEvent.target.result;
            if (textFromFileLoaded.trim() == "") {
                reject('The file appears to be empty.');
            }
            var firstline = true;

            globals.massspec.polarity = ($("#ms_positive").prop('checked') == true)
            globals.massspec.raw_values = [];
            globals.massspec.mz_column = $("#ms_mzSelect").val();
            globals.massspec.r_column = $("#ms_retentionSelect").val();
            globals.massspec.c_column = $("#ms_ccsSelect").val();
            globals.massspec.max_fc = 0;

            if (globals.massspec.mz_column == globals.massspec.r_column || globals.massspec.r_column == globals.massspec.c_column || globals.massspec.mz_column == globals.massspec.c_column) {
                reject("All three parameter columns have to be distinct.");
            }

            let control_samples = []
            let case_samples = []

            $("#ms_control_sample_list input:checked").each(function () {
                var value = $(this).attr("data")
                if (value == globals.massspec.mz_column || value == globals.massspec.r_column || value == globals.massspec.c_column) {
                    reject("Parameter columns can be set as value columns.")
                }
                control_samples.push(value)

            })
            $("#ms_case_sample_list input:checked").each(function () {
                var value = $(this).attr("data")
                if (value == globals.massspec.mz_column || value == globals.massspec.r_column || value == globals.massspec.c_column) {
                    reject("Parameter columns can be set as value columns.")
                }
                case_samples.push(value)
            })

            if (control_samples.length == 0) {
                reject("Please select columns for control values.");
            }
            if (case_samples.length == 0) {
                reject("Please select columns for case values.");
            }
            globals.massspec.numberofcontrols = control_samples.length;
            globals.massspec.numberofcases = case_samples.length;

            textFromFileLoaded.split('\n').forEach(function (line) {
                if (firstline === true) {
                    firstline = false;
                }
                else {
                    if (line == "") {
                        return;
                    }

                    let entries = line.split(globals.massspec.seperator);

                    globals.massspec.numberofuserprobes++;
                    if (globals.massspec.pvalue && entries.length != globals.massspec.samples.length * 2 + 1 || globals.massspec.pvalue == false && line.split('\t').length != globals.massspec.samples.length + 1) {
                        var linelengtherror = "Lines in the datafile may have been skipped because of structural issues.";
                        if (resolvemessage.includes(linelengtherror) === false) {
                            resolvemessage += linelengtherror
                        }
                        return;
                    }

                    let control_values = [];
                    let case_values = [];

                    for (let _id of control_samples) {
                        let _value = parseFloat(entries[_id].replace(",", ".").trim())
                        control_values.push(!isNaN(_value) ? _value : 0)
                    }
                    for (let _id of case_samples) {
                        let _value = parseFloat(entries[_id].replace(",", ".").trim())
                        case_values.push(!isNaN(_value) ? _value : 0)
                    }

                    let fc = Math.log2((mean(case_values) + 1) / (mean(control_values) + 1))
                    let pvalue = ttest(control_values, case_values).pValue();

                    if (!isNaN(fc)) {
                        if (Math.abs(fc) > globals.massspec.max_fc) {
                            globals.massspec.max_fc = Math.abs(fc);
                        }

                    }
                    else {
                        fc = 0
                    }

                    globals.massspec.raw_values.push({
                        "m": parseFloat(entries[globals.massspec.mz_column].replace(",", ".").trim()),
                        "r": parseFloat(entries[globals.massspec.r_column].replace(",", ".").trim()),
                        "c": parseFloat(entries[globals.massspec.c_column].replace(",", ".").trim()),
                        "control": control_values,
                        "case": case_values,
                        "fc": fc,
                        "pvalue": pvalue
                    })
                }

            });

            if (globals.massspec.raw_values.length === 0) {
                resolve(false);
            }
            else {
                fillGraph(true, false).then(r => {
                    resolve(resolvemessage);
                })
            }

        };

        // fileReader.readAsText(fileToLoad, "UTF-8");

    });

}

async function drawChart() {

    $("#ms_chart_data_container").empty().html('<canvas id="ms_chart_data" style="height: 400px;"></canvas>');

    var outputCanvas = document.getElementById('ms_chart_data');

    var chartOptions = {
        type: 'scatter',
        data: {
            datasets: [],
        },
        options: {
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: false,
                    text: 'Predicted Targets',
                    fontFamily: 'Helvetica',
                    fontColor: '#6E6EC8',
                    fontStyle: 'bold'
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
                            var label = context.dataset.label || '';

                            let _id = parseFloat(label)
                            if (isNaN(_id)) {
                                let labels = label.split(";")
                                return [
                                    labels[0],
                                    'm/z: ' + labels[1],
                                    'Rt: ' + labels[2],
                                    'CCS: ' + labels[3]
                                ];
                            }
                            let entry = globals.massspec.raw_values[_id];

                            return [
                                'm/z: ' + entry.m,
                                'Rt: ' + entry.r,
                                'CCS: ' + entry.c,
                                'FC: ' + entry.fc,
                            ];
                        }
                    }
                }
            },
            onHover: (event, chartElement) => {
                event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
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
            layout: {
                padding: {
                    top: 15
                }
            },

            scales: {
                y: {
                    title: {
                        display: true,
                        text: globals.massspec.abbreviations[ms_Yvalue()]
                    },
                },
                x: {
                    title: {
                        display: true,
                        text: globals.massspec.abbreviations[ms_Xvalue()]
                    },
                }
            }
        }
    };

    globals.massspec.data_chart = new Chart(outputCanvas, chartOptions);

    $("#ms_chart_data").height(400);
}

async function fillGraph(updateAll, redraw) {
    let xaxis = ms_Xvalue()
    let yaxis = ms_Yvalue()
    let zaxis = "c"

    if (updateAll) {
        globals.massspec.adduct_table.clear();
    }

    let accountfor_zaxis = ($("#ms_checkbox_zaxis").prop('checked') == true);

    let mapping = $("#ms_select_mapping").val();

    let abs_thresholds = {
        "m": parseFloat($("#ms_mvalue_absolute").val()),
        "r": parseFloat($("#ms_rvalue_absolute").val()),
        "c": parseFloat($("#ms_cvalue_absolute").val()),
    }

    let mapped_values = {}

    for (let p of Object.keys(globals.massspec.thresholds)) {
        if (p != xaxis && p != yaxis) {
            zaxis = p;
            continue;
        }
    }

    if (redraw) {
        await drawChart();
    }
    globals.massspec.data_chart.data.datasets = [];

    let selected_compound = $("#ms_select_compound option:selected").text();
    let weighted = $("#ms_checkbox_weighting").prop('checked') == true;


    if (!globals.massspec.metadata.hasOwnProperty(selected_compound)) {
        return;
    }

    for (let adduct of globals.massspec.metadata[selected_compound].adducts) {
        if (adduct["polarity"] != globals.massspec.polarity) {
            continue;
        }
        globals.massspec.data_chart.data.datasets.push({
            label: [adduct.adduct, adduct.m, adduct.r, adduct.c].join(";"),
            data: [{
                x: adduct[xaxis],
                y: adduct[yaxis],
                r: 6,
            }],
            backgroundColor: "#00FF00",
            hoverBackgroundColor: "#00FF00",
        });
    }
    let compoundsWithPeaks = new Set()
    let x_margin, y_margin, z_margin;
    let entry, xvalue, yvalue, zvalue;

    for (let e in globals.massspec.raw_values) {
        entry = globals.massspec.raw_values[e];
        xvalue = entry[xaxis];
        yvalue = entry[yaxis];
        zvalue = entry[zaxis];

        for (let c in globals.massspec.metadata) {
            if (!mapped_values.hasOwnProperty(c)) {
                mapped_values[c] = {};
            }
            if (c != selected_compound && updateAll == false) {
                continue;
            }
            let adducts = [];
            for (let a in globals.massspec.metadata[c].adducts) {
                if (!mapped_values[c].hasOwnProperty(a)) {
                    mapped_values[c][a] = {};
                }

                var adduct = globals.massspec.metadata[c].adducts[a];
                if (adduct["polarity"] != globals.massspec.polarity) {
                    continue;
                }

                x_margin = isNaN(abs_thresholds[xaxis]) ? adduct[xaxis] * globals.massspec.thresholds[xaxis] / 100 : abs_thresholds[xaxis];
                if (xvalue > (adduct[xaxis] + x_margin) || xvalue < (adduct[xaxis] - x_margin)) {
                    continue;
                }

                y_margin = isNaN(abs_thresholds[yaxis]) ? adduct[yaxis] * globals.massspec.thresholds[yaxis] / 100 : abs_thresholds[yaxis];
                if (yvalue > (adduct[yaxis] + y_margin) || yvalue < (adduct[yaxis] - y_margin)) {
                    continue;
                }

                if (!accountfor_zaxis && c == selected_compound) {
                    adducts.push(adduct["adduct"])
                }

                z_margin = isNaN(abs_thresholds[zaxis]) ? adduct[zaxis] * globals.massspec.thresholds[zaxis] / 100 : abs_thresholds[zaxis];
                if (zvalue > (adduct[zaxis] + z_margin) || zvalue < (adduct[zaxis] - z_margin)) {
                    continue;
                }

                if (accountfor_zaxis && c == selected_compound) {
                    adducts.push(adduct["adduct"])
                }

                switch (mapping) {
                    case "0":
                        if (weighted)
                            mapped_values[c][a][e] = -Math.sqrt(Math.pow((1 - (xvalue / adduct[xaxis])), 2) * Math.sqrt(x_margin / adduct[xaxis], 2) + Math.pow((1 - (yvalue / adduct[yaxis])), 2) * Math.sqrt(y_margin / adduct[yaxis], 2) + Math.pow((1 - (zvalue / adduct[zaxis])), 2) * Math.sqrt(z_margin / adduct[zaxis], 2))
                        else
                            mapped_values[c][a][e] = -Math.sqrt(Math.pow(1 - (xvalue / adduct[xaxis]), 2) + Math.pow(1 - (yvalue / adduct[yaxis]), 2) + Math.pow(1 - (zvalue / adduct[zaxis]), 2))
                        break;
                    case "1":
                        mapped_values[c][a][e] = Math.abs(entry.fc)
                        break;
                    case "2":
                        mapped_values[c][a][e] = entry.fc
                        break;
                    case "3":
                        mapped_values[c][a][e] = -entry.fc
                        break;
                    case "4":
                        mapped_values[c][a][e] = Math.max(entry.control)
                        break;
                    case "5":
                        mapped_values[c][a][e] = -Math.min(entry.control)
                        break;
                    case "6":
                        mapped_values[c][a][e] = Math.max(entry.case)
                        break;
                    case "7":
                        mapped_values[c][a][e] = Math.min(entry.case)
                        break;
                    default:
                        break;
                }

                compoundsWithPeaks.add(c)

            }

            if (adducts.length > 0) {

                let _result = {
                    label: e,
                    data: [{
                        x: xvalue,
                        y: yvalue,
                        r: 3,
                    }],
                }
                if (globals.massspec.max_fc != 0 && !isNaN(entry.fc)) {
                    var rgb = valueToRGB(entry.fc / globals.massspec.max_fc);
                    var colorstring = `rgb(${rgb[0]},${rgb[1]},${rgb[2]}, 1)`
                    _result["backgroundColor"] = colorstring
                    _result["hoverBackgroundColor"] = colorstring
                }
                globals.massspec.data_chart.data.datasets.push(_result);
            }
        }
    }

    compoundsWithPeaks = Array.from(compoundsWithPeaks)
    $('#ms_select_compound').children().each(
        function () {
            if (compoundsWithPeaks.includes($(this).text())) {
                $(this).css('backgroundColor', '#F08080');
            }
            else {
                $(this).css('backgroundColor', 'white');
            }
        }
    );

    globals.massspec.metabolite_values = {};
    var only_selected = {}
    only_selected[selected_compound] = {};

    for (let c in (updateAll ? mapped_values : only_selected)) {
        let _metabolite = globals.massspec.metadata[c].metabolite;
        for (let a in mapped_values[c]) {

            if (Object.keys(mapped_values[c][a]).length === 0) {
                continue;
            }

            var items = Object.keys(mapped_values[c][a]).map(function (key) {
                return [key, mapped_values[c][a][key]];
            });

            items.sort(function (first, second) {
                return second[1] - first[1];
            });

            let _id = items[0][0];
            let adduct = globals.massspec.metadata[c].adducts[a]

            if (!globals.massspec.metabolite_values.hasOwnProperty(_metabolite)) {
                globals.massspec.metabolite_values[_metabolite] = {};
            }
            if (!globals.massspec.metabolite_values[_metabolite].hasOwnProperty(c)) {
                globals.massspec.metabolite_values[_metabolite][c] = new Set();
            }
            globals.massspec.metabolite_values[_metabolite][c].add(_id);

            if (updateAll) {
                let entry = globals.massspec.raw_values[_id];

                var result_row = [
                    '<a target="_blank" href="http://identifiers.org/CHEBI/' + adduct.id + '"><span class="fa fa-external-link-alt ml-2"></span></a>',
                    _metabolite,
                    c,
                    adduct.adduct,
                    expo(entry.fc),
                    expo(entry.pvalue),
                    expo(entry.m) + " (" + expo(adduct.m) + ")",
                    expo(entry.r) + " (" + expo(adduct.r) + ")",
                    expo(entry.c) + " (" + expo(adduct.c) + ")",
                    expo(Math.sqrt(Math.pow(adduct.m - entry.m, 2) + Math.pow(adduct.r - entry.r, 2) + Math.pow(adduct.c - entry.c, 2)))
                ]
                globals.massspec.adduct_table.row.add(result_row)
            }

            if (c == selected_compound) {
                for (let data of globals.massspec.data_chart.data.datasets) {
                    if (data.label == _id) {
                        data.data[0]["pointStyle"] = "triangle";
                        data["borderWidth"] = 2;
                        data["borderColor"] = "rgba(0, 0, 0, 1)";
                        data.data[0].r = 6
                        data.data.push({
                            x: adduct[xaxis],
                            y: adduct[yaxis],
                            r: 0,
                        }),
                            data["showLine"] = true;
                        data["fill"] = false;
                        data["lineTension"] = 0;
                    }
                }
            }
        }

    }
    if (updateAll) {
        await updateMetaboliteTable()
    }

    if (updateAll) {
        globals.massspec.adduct_table.columns.adjust().draw();
    }
    if ($('#ms_peak').hasClass('active')) {
        globals.massspec.data_chart.update();
    }

}

async function updateMetaboliteTable() {
    globals.massspec.metabolite_table.clear();
    globals.massspec.results = {};

    let adduct_mapping = parseFloat($("#ms_select_a_mapping").val());
    let compound_mapping = parseFloat($("#ms_select_c_mapping").val());

    for (let m in globals.massspec.metabolite_values) {
        let m_control_values, m_case_values;

        switch (compound_mapping) {

            case 0:
                m_control_values = Array.from(Array(globals.massspec.numberofcontrols), () => [])
                m_case_values = Array.from(Array(globals.massspec.numberofcases), () => [])
                break;
            case 1:
                m_control_values = new Array(globals.massspec.numberofcontrols).fill(0);
                m_case_values = new Array(globals.massspec.numberofcases).fill(0);
                break;
        }

        for (let c in globals.massspec.metabolite_values[m]) {
            let c_control_values, c_case_values;

            switch (adduct_mapping) {
                case 0:
                    c_control_values = new Array(globals.massspec.numberofcontrols).fill(0);
                    c_case_values = new Array(globals.massspec.numberofcases).fill(0);
                    break;
                case 1:
                    c_control_values = new Array(globals.massspec.numberofcontrols).fill(Number.MAX_SAFE_INTEGER);
                    c_case_values = new Array(globals.massspec.numberofcases).fill(Number.MAX_SAFE_INTEGER);
                    break;
                case 2:
                    c_control_values = Array.from(Array(globals.massspec.numberofcontrols), () => [])
                    c_case_values = Array.from(Array(globals.massspec.numberofcases), () => [])
                    break;
            }


            for (let _id of Array.from(globals.massspec.metabolite_values[m][c])) {
                var entry = globals.massspec.raw_values[_id];
                switch (adduct_mapping) {
                    case 0:
                        for (var i = 0; i < globals.massspec.numberofcontrols; i++) {
                            if (entry.control[i] > c_control_values[i])
                                c_control_values[i] = entry.control[i];
                        }
                        for (var i = 0; i < globals.massspec.numberofcases; i++) {
                            if (entry.case[i] > c_case_values[i])
                                c_case_values[i] = entry.case[i];
                        }
                        break;
                    case 1:
                        for (var i = 0; i < globals.massspec.numberofcontrols; i++) {
                            if (entry.control[i] < c_control_values[i])
                                c_control_values[i] = entry.control[i];
                        }
                        for (var i = 0; i < globals.massspec.numberofcases; i++) {
                            if (entry.case[i] < c_case_values[i])
                                c_case_values[i] = entry.case[i];
                        }
                        break;
                    case 2:
                        for (var i = 0; i < globals.massspec.numberofcontrols; i++) {
                            c_control_values[i].push(entry.control[i])
                        }
                        for (var i = 0; i < globals.massspec.numberofcases; i++) {
                            c_case_values[i].push(entry.case[i])
                        }
                        break;
                }

            }
            switch (adduct_mapping) {
                case 1:
                    for (var i = 0; i < globals.massspec.numberofcontrols; i++) {
                        if (c_control_values[i] == Number.MAX_SAFE_INTEGER)
                            c_control_values[i] = 0;
                    }
                    for (var i = 0; i < globals.massspec.numberofcases; i++) {
                        if (c_case_values[i] == Number.MAX_SAFE_INTEGER)
                            c_case_values[i] = 0;
                    }
                    break;
                case 2:
                    for (var i = 0; i < globals.massspec.numberofcontrols; i++) {
                        c_control_values[i] = mean(c_control_values[i]);
                    }
                    for (var i = 0; i < globals.massspec.numberofcases; i++) {
                        c_case_values[i] = mean(c_case_values[i]);
                    }
                    break;
                default:
                    break;
            }


            switch (compound_mapping) {

                case 1:
                    for (var i = 0; i < globals.massspec.numberofcontrols; i++) {
                        m_control_values[i] += c_control_values[i];
                    }
                    for (var i = 0; i < globals.massspec.numberofcases; i++) {
                        m_case_values[i] += c_case_values[i];
                    }
                    break;
                case 0:
                    for (var i = 0; i < globals.massspec.numberofcontrols; i++) {
                        m_control_values[i].push(c_control_values[i])
                    }
                    for (var i = 0; i < globals.massspec.numberofcases; i++) {
                        m_case_values[i].push(c_case_values[i])
                    }
                    break;
            }
        }

        if (compound_mapping == 0) {
            for (var i = 0; i < globals.massspec.numberofcontrols; i++) {
                m_control_values[i] = mean(m_control_values[i])
            }
            for (var i = 0; i < globals.massspec.numberofcases; i++) {
                m_case_values[i] = mean(m_case_values[i])
            }
        }

        var fc = Math.log2((mean(m_case_values) + 1) / (mean(m_control_values) + 1))
        var pvalue = ttest(m_control_values, m_case_values).pValue()
        fc = isNaN(fc) ? 0 : fc;

        var result_row = [
            getLinkIconHTML(m),
            expo(fc),
            expo(pvalue)
        ]

        globals.massspec.results[m] = {
            "fc": fc,
            "pvalue": pvalue
        };
        globals.massspec.metabolite_table.row.add(result_row)
    }
    globals.massspec.metabolite_table.columns.adjust().draw();
    update_importMassSpecTable();
}

async function initializeData() {
    return new Promise((resolve, reject) => {

        globals.massspec.raw_values = [];

        var resolvemessage = "";
        var fileToLoad = document.getElementById("ms_input_meta").files[0];

        if (!fileToLoad) {
            reject(false);
        }

        var fileReader = new FileReader();
        try {
            fileReader.readAsText(fileToLoad, "UTF-8");
        } catch (error) {
            resolve(false)
        }
        fileReader.onload = function (fileLoadedEvent) {

            var output = fileLoadedEvent.target.result;
            if (output.trim() == "") {
                reject('The file appears to be empty.');
            }
            var firstline = true;

            globals.massspec.metadata = {}
            let lines = output.split('\n');
            for (let line of lines) {
                let entry = line.split("\t");

                if (!globals.massspec.metadata.hasOwnProperty(entry[1])) {
                    globals.massspec.metadata[entry[1]] = {
                        "metabolite": entry[0],
                        "adducts": []
                    }
                }
                globals.massspec.metadata[entry[1]].adducts.push({
                    "polarity": entry[2].toLowerCase() == "positive" ? true : false,
                    "adduct": entry[3],
                    "m": parseFloat(entry[4]),
                    "r": parseFloat(entry[5]),
                    "c": parseFloat(entry[6]),
                    "id": entry[7]
                })
            }

            $("#ms_select_compound").empty();
            let cSelect = document.getElementById('ms_select_compound');

            let metabolite = "";
            let first = true;
            for (let compound in globals.massspec.metadata) {
                if (globals.massspec.metadata[compound].metabolite != metabolite) {
                    metabolite = globals.massspec.metadata[compound].metabolite
                    let opt = new Option("-- " + metabolite + " --");
                    opt.disabled = true;
                    cSelect.options[cSelect.options.length] = opt
                }
                if (first) {
                    cSelect.options[cSelect.options.length] = new Option(compound, "", true, true);
                    first = false;
                }
                else {
                    cSelect.options[cSelect.options.length] = new Option(compound);
                }
            }

            resolve(true)
        };
    });
}

function ms_contentString() {
    var max = parseFloat($("#ms_ol_max").val());
    var min = parseFloat($("#ms_ol_min").val());
    var output = '';

    for (var m in globals.massspec.results) {
        var _value = globals.massspec.results[m].fc;
        output += `%0A${m}`;
        if (_value <= min) {
            output += '%09%230000ff'
        }
        else if (_value >= max) {
            output += '%09%23ff0000'
        }
        else if (_value == 0) {
            output += '%09%23ffffff'
        }
        else if (_value < 0) {
            var hex = rgbToHex((1 - Math.abs(_value / min)) * 255);
            output += '%09%23' + hex + hex + "ff";
        }
        else {
            var hex = rgbToHex((1 - Math.abs(_value / max)) * 255);
            output += '%09%23ff' + hex + hex;
        }
    };

    return output;
}
