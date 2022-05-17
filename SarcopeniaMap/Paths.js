async function AirPaths() {

        $("#airpaths_tab_content").append(`<div id="stat_spinner" class="mt-5">
            <div class="d-flex justify-content-center">
                        <div class="spinner-border" role="status">
                            <span class="sr-only"></span>
                        </div>
            </div>
            <div class="d-flex justify-content-center mt-2">
                <span id="air_loading_text">LOADING ...</span>
            </div>
            <button type="button" id="air_init_btn" class="air_btn btn btn-block mt-2"></button>
        </div>`)

        await getPhenotypeInfluences(true)
        $("#air_init_btn").remove()

        $("#airpaths_tab_content").append(`
            <button class="air_collapsible mt-4">Interaction Path Identification</button>
            <div id="air_panel_interaction" class="air_collapsible_content">
                <div class="row mt-4 mb-2">
                    <div class="col-auto">
                        <div class="wrapper">
                            <button type="button" class="air_btn_info btn btn-secondary"
                                    data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Shortest Paths"
                                    data-content="If checked, only the shortest path between the selected elements will be shown.<br/>">
                                ?
                            </button>
                        </div>
                    </div>
                    <div class="col">
                        <div class="cbcontainer">
                            <input type="checkbox" class="air_checkbox" id="air_cb_allpaths">
                            <label class="air_checkbox air_checkbox_label" for="air_cb_allpaths">Only shortest paths?</label>
                        </div>
                    </div>
                </div>
                <div class="row mt-2 mb-2">
                    <div class="col-auto mb-2">
                        <div class="wrapper">
                            <button type="button" class="air_btn_info btn btn-secondary"
                                    data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Knocked out elements"
                                    data-content="If checked, paths will not include any of the knocked out elements specified in the in silico perturbation tool below.<br/>">
                                ?
                            </button>
                        </div>
                    </div>
                    <div class="col">
                        <div class="cbcontainer">
                            <input type="checkbox" class="air_checkbox" id="air_cb_considerko" checked>
                            <label class="air_checkbox air_checkbox_label" for="air_cb_considerko">Consider KO perturbations from below?</label>
                        </div>
                    </div>
                </div>
                <div class="row mt-2 mb-2">
                    <div class="col-auto mb-4">
                        <div class="wrapper">
                            <button type="button" class="air_btn_info btn btn-secondary"
                                    data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Reenter Compartments"
                                    data-content="If checked, paths will not enter the same compartment twice after leaving, except for direct reentry (i.e. paracrin signaling).">
                                ?
                            </button>
                        </div>
                    </div>
                    <div class="col">
                        <div class="cbcontainer">
                            <input type="checkbox" class="air_checkbox" id="air_cb_reentry">
                            <label class="air_checkbox air_checkbox_label" for="air_cb_reentry">Allow compartment reentry?</label>
                        </div>
                    </div>
                </div>
                <div class="row mt-2 mb-2">
                    <div class="col-auto mb-4">
                        <div class="wrapper">
                            <button type="button" class="air_btn_info btn btn-secondary"
                                    data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Weighting"
                                    data-content="If this option is enabled, the number of paths is weighted according to the number of compartments through which the paths pass.<br/>Attention: If checked, the absolute number of path in the graph tooltips will not reflect the actual number.">
                                ?
                            </button>
                        </div>
                    </div>
                    <div class="col">
                        <div class="cbcontainer">
                            <input type="checkbox" class="air_checkbox" id="air_cb_weighted">
                            <label class="air_checkbox air_checkbox_label" for="air_cb_weighted">Weight paths by number of compartments?</label>
                        </div>
                    </div>
                </div>
                
                <div><span>From</span></div>
                <div>
                <input type="text" list="air_path_elementnames_source" style="width: 70%" class="textfield mb-2" id="air_path_element_source" value="cirrhosis (liver)"/>
                <datalist id="air_path_elementnames_source" style="height:5.1em;overflow:hidden">
                </datalist>
                </div>
                <div>
                    <span style="display: inline-block;width: 20%">
                            <input type="checkbox" class="air_checkbox" id="air_cb_through" checked>
                            <label class="air_checkbox air_checkbox_label" for="air_cb_through">Through</label>
                    </span>
                    <span style="display: inline-block;width: 50%">
                            <input type="checkbox" class="air_checkbox" id="air_cb_notthrough">
                            <label class="air_checkbox air_checkbox_label" for="air_cb_notthrough">not Through</label>
                    </span>
                </div>
                <div>
                    <input type="text" list="air_path_elementnames_through" style="width: 70%" class="textfield mb-2" id="air_path_element_through" placeholder="Type in name (not required)"/>
                    <datalist id="air_path_elementnames_through" style="height:5.1em;overflow:hidden">
                    </datalist>
                </div>
                <div><span>To</span></div>
                <input type="text" list="air_path_elementnames_target" style="width: 70%" class="textfield mb-2" id="air_path_element_target" value="sarcopenia (muscle)"/>
                <datalist id="air_path_elementnames_target" style="height:5.1em;overflow:hidden">
                </datalist>

                <button type="button" id="air_path_btn" class="air_btn btn btn-block mt-2 mb-2">Show Paths</button>
                <hr>
                <h4 class="mt-4 mb-2">Path List:</h4>
                <div class="air_table_background">
                    <table id="air_path_table" cellspacing="0" class="air_table table table-sm" style="width:100%">
                        <thead>
                            <tr>
                                <th style="vertical-align: middle;"></th>
                                <th style="vertical-align: middle;">Length</th>
                                <th style="vertical-align: middle;">Type</th>
                                <th style="vertical-align: middle;">Impact</th>
                                <th style="vertical-align: left;">Path</th>
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                </div>
                <hr>
                <h4 class="mt-4 mb-2">Elements in Paths:</h4>
                <div class="mb-4 mt-2" style="height:500px;overflow-y:scroll; position:relative">
                    <div id="canvasContainer" style="height:0px">
                        <canvas id="air_chart_path"></canvas>
                    </div>
                </div>
            </div>
            <button class="air_collapsible mt-2">in silico Perturbation</button>
            <div id="air_panel_phenotypes" class="air_collapsible_content">
                <input type="text" list="air_elementnames" style="width: 55%" class="textfield mt-4" id="air_pe_element_input" placeholder="Type in elements seperated by comma"/>
                <datalist id="air_elementnames" style="height:5.1em;overflow:hidden">
                </datalist>
                <button type="button" id="air_pe_element_btn" style="width: 40%" class="air_btn btn mr-1">Add Element</button>

                <div class="btn-group btn-group-justified mt-4 mb-4">
                    <div class="btn-group">
                        <button type="button" id="air_import_undo" class="air_disabledbutton air_btn btn mr-1"><i class="fas fa-undo"></i> Undo</button>
                    </div>
                    <div class="btn-group">
                        <button type="button" id="air_import_redo" class="air_disabledbutton air_btn btn ml-1"><i class="fas fa-redo"></i> Redo</button>
                    </div>
                </div>
                <div class="air_table_background">
                    <table id="air_table_pe_elements" cellspacing="0" class="air_table table table-sm mt-4 mb-4" style="width:100%">
                        <thead>
                            <tr>
                                <th style="vertical-align: middle;">Element</th>
                                <th style="vertical-align: middle;">Knockout (KO)</th>
                                <th style="vertical-align: middle;">FC</th>
                                <th style="vertical-align: middle;"></th>
                                <th style="vertical-align: middle;"></th>
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                </div>
                <button id="air_pe_reset_btn" type="button" class="air_btn btn btn-block mb-4 mt-4">Reset</button>

                <ul class="air_nav_tabs nav nav-tabs" role="tablist">
                    <li class="air_nav_item nav-item" style="width: calc(100% / 3)">
                        <a class="air_tab air_tab_sub active nav-link" id="air_pheno-tab" data-toggle="tab" href="#air_pheno" role="tab" aria-controls="air_pheno" aria-selected="true">FC effects</a>
                    </li>
                    <li class="air_nav_item nav-item" style="width: calc(100% / 3)">
                        <a class="air_tab air_tab_sub nav-link" id="air_centrality-tab" data-toggle="tab" href="#air_centrality" role="tab" aria-controls="air_centrality" aria-selected="false">KO effects</a>
                    </li>
                    <li class="air_nav_item nav-item" style="width: calc(100% / 3)">
                        <a class="air_tab air_tab_sub nav-link" id="air_optimize-tab" data-toggle="tab" href="#air_optimize" role="tab" aria-controls="air_optimize" aria-selected="false">Knock out all</a>
                    </li>
                </ul>
                <div class="tab-content air_tab_content" id="air_path_tab">

                </div>
            </div>
            <button class="air_collapsible mt-2">Upstream Enrichment</button>
            <div id="air_panel_targets" class="air_collapsible_content">

            </div>
        `)


        $('#air_hide_container .collapse').collapse();
        $('.air_btn_info[data-toggle="popover"]').popover();

        await getPhenotypePanel()
        await getPathPanel()
        await getCentralityPanel()
        await getOptimizePanel()
        await getTargetPanel();

        for (let eid of Object.keys(AIR.Molecules).sort(function(a, b) {
            var nameA = AIR.Molecules[a].name.toUpperCase();
            var nameB = AIR.Molecules[b].name.toUpperCase();
            if (nameA < nameB) {
              return -1;
            }
            if (nameA > nameB) {
              return 1;
            }
            return 0;
          })) {

            var element = AIR.Molecules[eid].name;
            var symbol = AIR.Molecules[eid].ids.name
            var description = ""

            if(AIR.Fullnames.hasOwnProperty(symbol))
            {
                if(AIR.Fullnames[symbol])
                    description += AIR.Fullnames[symbol] + " " 
                if(AIR.Aliases[symbol])
                    description += "(" + AIR.Aliases[symbol] + ")"
            }

            var option = '<option value="' + element + '">' + (description != ""? (description + "</option>") : "")

            $("#air_elementnames").append(option)
            $("#air_path_elementnames_source").append(option)
            $("#air_path_elementnames_through").append(option)
            $("#air_path_elementnames_target").append(option)
            $("#air_cent_elementnames_target").append(option)
            $("#air_cent_elementnames_source").append(option)
            $("#air_opt_elementnames_target").append(option)
            $("#air_opt_elementnames_source").append(option)
        }
        for (let p in AIR.Phenotypes) {
            AIR.Phenotypes[p]["value"] = 0;
            globals.pe_results_table.row.add([
                "",
                getLinkIconHTML(p),
                `<div id="air_pe_value_${p}">0</div>`,
                1,
                `<div id="air_pe_accuracy_${p}">0</div>`
            ])
            $("#air_path_phenotypes").append('<option value="' + p + '">' + AIR.Phenotypes[p].name + '</option>');
            $("#air_cent_phenotypes").append('<option value="' + p + '">' + AIR.Phenotypes[p].name + '</option>');
        }
        globals.pe_results_table.columns.adjust().draw();
        globals.pe_element_table.columns.adjust().draw();


        var coll = document.getElementById("sarco_plugincontainer").getElementsByClassName("air_collapsible");
        var i;

        for (i = 0; i < coll.length; i++) {
            coll[i].addEventListener("click", function () {
                this.classList.toggle("active");
                var content = this.nextElementSibling;
                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                } else {
                    content.style.maxHeight = content.scrollHeight + 1 + "px";
                }
            });
        }
        // coll[0].click();
        adjustPanels()

        document.getElementById("stat_spinner").remove();
}

$(document).on('click', '.air_path_entry', function () {

    let ko_elements = perturbedElements();
    let _additionalelements = ko_elements.reduce((accumulator, currentValue) => {
        accumulator[currentValue] = "#a9a9a9";
        return accumulator;
    }, {});

    let data = $(this).attr("data").split(/([+-])/g);
    let cutpath = {}
    for (let i = 0; i < data.length - 1; i += 2) {
        cutpath[data[i] + "_" + data[i + 2]] = data[i + 1] == "+" ? "#00ff00" : "#ff0000";
    }

    highlightPath(cutpath, "#0000ff", _additionalelements, true);
});

function getTargetPanel() {
    return new Promise((resolve, reject) => {
        globals.targetpanel = $("#air_panel_targets");
        globals.targetpanel.append('<h4 class="mt-4 mb-4">Select phenotype levels:</h4>');

        var tbl = undefined;

        if (document.getElementById('air_table_target_phenotype')) {

            $('#air_table_target_phenotype').DataTable().destroy();
            tbl = document.getElementById('air_table_target_phenotype');

            tbl.parentElement.removeChild(tbl);

        }

        tbl = document.createElement("table")

        tbl.setAttribute('class', 'air_table table table-sm mt-4 mb-4');
        tbl.setAttribute('style', 'width:100%');
        tbl.setAttribute('id', 'air_table_target_phenotype');
        tbl.setAttribute('cellspacing', '0');

        for (let p in AIR.Phenotypes) {
            var row = tbl.insertRow(tbl.rows.length);

            let pname = AIR.Phenotypes[p].name;

            createCell(row, 'td', getLinkIconHTML(p), 'col', '', 'right');
            createCell(row, 'td', `<font data-order="1"><b>0<b></font>`, 'col slidervalue', '', 'center').setAttribute('id', 'PSliderValue' + p);
            var slider = createSliderCell(row, 'td', p);
            slider.setAttribute('id', 'PSlider' + p);
            slider.oninput = function () {
                let value = this.value;
                $("#PSliderValue" + p).each(function () {

                    var invalue = parseFloat(value);
                    var output = `<font data-order="1"><b>${invalue}<b></font>`;
                    if (invalue < 0) {
                        output = `<font color="blue" data-order="2"><b>${invalue}<b></font>`;
                    }
                    if (invalue > 0) {
                        output = `<font color="red" data-order="0"><b>${invalue}<b></font>`;
                    }

                    jQuery(this)[0].innerHTML = output;
                    AIR.Phenotypes[p].value = invalue;
                });
            }
            slider.onchange = function () {
                air_PredictTargets();
            }
        }

        let header = tbl.createTHead();
        var headerrow = header.insertRow(0);

        createCell(headerrow, 'th', 'Phenotype', 'col', '', 'right');
        createCell(headerrow, 'th', 'logFC', 'col', '', 'center');
        createCell(headerrow, 'th', 'Select FC', 'col-2', '', 'center');

        var _div = document.createElement("div");
        _div.setAttribute('class', "air_table_background");
        _div.appendChild(tbl);

        globals.targetpanel.append(_div);

        globals.targetphenotypetable = $('#air_table_target_phenotype').DataTable({
            //"scrollX": true,
            //"autoWidth": true,
            "table-layout": "fixed", // ***********add this
            "word-wrap": "break-word",
            "columns": [
                { "width": "40%" },
                { "width": "10%" },
                { "width": "50%" }
            ]
        });
        $(globals.targetphenotypetable.table().container()).addClass('air_datatable');

        globals.targetphenotypetable.on('click', 'a', function () {
            selectElementonMap(this.innerHTML, false);
        });

        globals.targetpanel.append(
        /*html*/`
            <button type="button" class="btn-reset air_btn btn btn-block mb-2 mt-4">Reset</button>
            
            <hr>
            <h4 class="mt-4 mb-4">Identified targets:</h4>
            <select id="air_select_target_type" class="browser-default air_select custom-select mb-2 mt-2">
                <option value="0" selected>All Elements</option>
                <option value="1">Proteins</option>
                <option value="2">miRNAs</option>
                <option value="3">lncRNAs</option>
                <option value="4">Transcription Factors</option>
            </select>

        `);
        $(".dropdown-toggle").dropdown();

        $('#air_select_target_type').change(function () {
            air_PredictTargets();
        });

        globals.targetpanel.find('.btn-reset').on('click', () => {

            globals.targetphenotypetable.rows().every(function () {
                var row = this.nodes().to$()
                row.find('.air_slider').val(0);
                row.find('.slidervalue')[0].innerHTML = `<font data-order="1"><b>0<b></font>`;
            });

            globals.targetphenotypetable.draw(false);

            for (let p in AIR.Phenotypes) {
                AIR.Phenotypes[p].value = 0;
            }

            globals.air_targetchart.data.datasets = [];
            globals.air_targetchart.update();
        });

        globals.targetpanel.append('<canvas id="air_chart_target"></canvas>');
        globals.targetpanel.append(/*html*/`
            <div class="d-flex justify-content-center mt-2">
                    <li class="legendli" style="color:#6d6d6d; font-size:90%;"><span class="legendspan" style="background-color:#C00000"></span>positive Targets</li>
                    <li class="legendli" style="margin-left:20px; color:#6d6d6d; font-size:90%;"><span class="legendspan" style="background-color:#0070C0"></span>negative Targets</li>
                    <li class="legendli" style="margin-left:16px; color:#6d6d6d; font-size:90%;"><span class="triangle"></span>External Link</li>
            </div>
            <div class="btn-group btn-group-justified">
                <div class="btn-group">
                    <button id="air_btn_download_target" class="om_btn_download btn mt-4" style="width:100%"> <i class="fa fa-download"></i> as .txt</button>
                </div>
                <div class="btn-group">
                    <button id="air_btn_download_chart" class="om_btn_download btn mt-4" style="width:100%"> <i class="fa fa-download"></i> as .png</button>
                </div>
            </div>
            `);

        $('#air_btn_download_target').on('click', function () {
            air_download('PredictedPhenotypeRegulators.txt', globals.air_target_downloadtext)
        });
        $('#air_btn_download_chart').on('click', function () {
            var a = document.createElement('a');
            a.href = globals.air_targetchart.toBase64Image();
            a.download = 'AIR_predictedTargets.png';

            // Trigger the download
            a.click();

            a.remove();
        });

        var outputCanvas = document.getElementById('air_chart_target').getContext('2d');
        globals.air_targetchart = new Chart(outputCanvas, {
            type: 'bubble',
            data: {
                datasets: []
            },
            options: {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                var label = context.label || '';

                                if (label) {
                                    label += ': ';
                                }
                                label += context.parsed.x;
                                label += "; ";
                                label += context.parsed.y;
                                return label;
                            }
                        }
                    },
                    legend: {
                        display: false,
                    },
                    title: {
                        display: false,
                        text: 'Predicted Targets',
                        fontFamily: 'Helvetica',
                        fontColor: '#6E6EC8',
                        fontStyle: 'bold'
                    }
                },
                onHover: (event, chartElement) => {
                    event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
                },
                onClick: (event, chartElement) => {
                    if (chartElement[0]) {
                        let name = globals.air_targetchart.data.datasets[chartElement[0].datasetIndex].label;
                        selectElementonMap(name, true);
                        air_setSelectedElement(name);
                    }
                },
                layout: {
                    padding: {
                        top: 15
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Sensitivity'
                        },
                        ticks: {
                            beginAtZero: false,
                            //suggestedMax: 1
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Specificity'
                        },
                        ticks: {
                            beginAtZero: false,
                            //suggestedMax: 1
                        }
                    }
                }
            }

        });


        resolve('');
    });
}

function air_PredictTargets() {
    var targets = [];
    let promises = [];

    let filter = $('#air_select_target_type option:selected').text();
    globals.air_target_downloadtext = `Filter: ${filter}\n\nSelected phenotype values:`;

    for (let p in AIR.Phenotypes) {

        globals.air_target_downloadtext += `\n${AIR.Phenotypes[p].name}\t${AIR.Phenotypes[p].value}`;
    }
    globals.air_target_downloadtext += '\n\nElement\tSpecificity\tSensitivit\type';

    for (let e in AIR.Molecules) {

        let { name: _name, subtype: _type } = AIR.Molecules[e];

        if (_type.toLowerCase() === "phenotype") {
            continue;
        }

        let typevalue = $('#air_select_target_type').val();
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

        for (let p in globals.pe_influenceScores) {

            let value = AIR.Phenotypes[p].value;

            let SP = 0;
            if (globals.pe_influenceScores[p].values.hasOwnProperty(e) == true) {
                SP = globals.pe_influenceScores[p].values[e];
            }

            if (value != 0) {
                positiveSum += value * SP;
                positiveinhibitorySum -= value * SP;

                positiveCount += Math.abs(value);
            }
            else {
                negativeSum += (1 - Math.abs(SP));

                negativeCount++;
            }
        }

        let positiveSensitivity = 0;
        let negativeSensitivity = 0;

        if (positiveCount > 0) {
            positiveSensitivity = Math.round(((positiveSum / positiveCount) + Number.EPSILON) * 100) / 100;
            negativeSensitivity = Math.round(((positiveinhibitorySum / positiveCount) + Number.EPSILON) * 100) / 100;
        }

        if (positiveSensitivity <= 0 && negativeSensitivity <= 0) {
            continue;
        }

        let sensitivity = positiveSensitivity;
        let specificity = 0

        if (negativeCount > 0) {
            specificity = Math.round(((negativeSum / negativeCount) + Number.EPSILON) * 100) / 100;
        }

        //var hex = pickHex([255, 140, 140], [110, 110, 200], (positiveresult + negativeresult) / 2);
        var hex = '#C00000';
        var regType = "positive";
        if (negativeSensitivity > positiveSensitivity) {
            hex = '#0070C0';
            regType = "negative"
            sensitivity = negativeSensitivity;
        }
        var radius = ((sensitivity + specificity) / 2) * 8;


        var pstyle = 'circle';
        if (AIR.MapSpeciesLowerCase.includes(_name.toLowerCase()) === false) {
            pstyle = 'triangle'
        }

        if (radius < 3) {
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
        globals.air_target_downloadtext += `\n${_name}\t${specificity}\t${sensitivity}\t${regType}`;
    }

    Promise.all(promises).finally(r => {
        globals.air_targetchart.data.datasets = targets;
        globals.air_targetchart.update();
    });

}

async function getOptimizePanel() {
    return new Promise((resolve, reject) => {
        $("#air_path_tab").append(`
        <div class="tab-pane air_sub_tab_pane" id="air_optimize" role="tabpanel" aria-labelledby="air_optimize-tab">
            <div class="mt-4">
                <span style="display: inline-block;width: 49.5%">From</span>
                <span style="display: inline-block;width: 49%">To</span>
            </div>
            <div class="mb-4">
                <input type="text" list="air_opt_elementnames_source" style="width: 49%" class="textfield mr-1" id="air_opt_element_source" placeholder="Type in name"/>
                <datalist id="air_opt_elementnames_source" style="height:5.1em;overflow:hidden">
                </datalist>
                <input type="text" list="air_opt_elementnames_target" style="width: 49%" class="textfield" id="air_opt_element_target" value="sarcopenia (muscle)"/>
                <datalist id="air_opt_elementnames_target" style="height:5.1em;overflow:hidden">
                </datalist>
            </div>
            <button type="button" id="air_opt_btn" class="air_btn btn btn-block mt-2 mb-2">Predict maximized KO impact</button>
            <div class="mb-4 mt-4" style="height:160px">
                <canvas id="air_chart_optimizetotal"></canvas>
            </div>
            <div class="mb-5 mt-4" style="height:600px;overflow-y:scroll; position:relative">
                <div id="opt_canvasContainer" style="height:0px">
                    <canvas id="air_chart_optimize"></canvas>
                </div>
            </div>
        </div>`);

        $('#air_opt_btn').on('click', getOptimizedKO);

        var outputCanvas = document.getElementById('air_chart_optimizetotal').getContext('2d');
        globals.optimizetotalchart = new Chart(outputCanvas, {
            type: 'bar',
            data: {
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Total paths ditribution',
                        fontFamily: 'Helvetica',
                        fontColor: '#6E6EC8',
                        fontStyle: 'bold'
                    },
                    legend: {
                        display: true
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {

                                return context.dataset.label + ": " + expo(Math.abs(context.raw)) + "%";

                            }
                        }
                    },
                },

                scales: {
                    y: {
                        ticks:
                        {
                            mirror: true,
                            z: 2,
                            color: "#000000",
                        },
                        stacked: true
                    },
                    x: {
                        position: "top",
                        type: 'linear',
                        title: {
                            display: false,
                            text: 'Percentage'
                        },
                        ticks: {
                            callback: function (value, index, values) {
                                return Math.abs(value) + '%';
                            },
                            stepSize: 20
                        },
                        min: -100,
                        max: 100,
                        stacked: true
                    }
                },

                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0
                },
                onHover: (event, chartElement) => {
                    event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
                },
                indexAxis: 'y',
            }
        });

        outputCanvas = document.getElementById('air_chart_optimize').getContext('2d');
        globals.optimizechart = new Chart(outputCanvas, {
            type: 'bar',
            data: {
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Percentage point increase in either directions after the respective knockout',
                        fontFamily: 'Helvetica',
                        fontColor: '#6E6EC8',
                        fontStyle: 'bold'
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {

                                return context.dataset.label + ": +" + expo(Math.abs(context.raw)) + "%";

                            }
                        }
                    },
                },

                scales: {
                    y: {
                        ticks:
                        {
                            mirror: true,
                            z: 2,
                            color: "#000000",
                        },
                        stacked: true
                    },
                    x: {
                        position: "top",
                        type: 'linear',
                        title: {
                            display: false,
                            text: 'Percentage'
                        },
                        ticks: {
                            callback: function (value, index, values) {
                                return "+" + Math.abs(value) + '%';
                            },
                        },
                        stacked: true,
                    }
                },

                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0
                },
                onHover: (event, chartElement) => {
                    event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
                },
                indexAxis: 'y',
            }
        });

        resolve();
    });
}

async function getOptimizedKO() {

    let text = await disablebutton("air_opt_btn", true);
    let count = 0;
    await updateProgress(0, 1, "air_opt_btn", " ... Calculating new topology")
    let source = $("#air_opt_element_source").val().split(',')[0]
    let target = $("#air_opt_element_target").val().split(',')[0]

    var chartData = []


    if (AIR.ElementNames.fullname.hasOwnProperty(source.toLowerCase().trim())) {
        source = AIR.ElementNames.fullname[source.toLowerCase().trim()]
    }
    else {
        source = false;
    }

    if (AIR.ElementNames.fullname.hasOwnProperty(target.toLowerCase().trim())) {
        target = AIR.ElementNames.fullname[target.toLowerCase().trim()]
    }
    else {
        target = false;
    }

    if (!target || source == target) {
        document.getElementById("opt_canvasContainer").style.height = (70 * chartData.length) < 600 ? "600px" : (70 * chartData.length).toString() + "px";
        globals.optimizetotalchart.data = {}
        globals.optimizechart.data = {}
        globals.optimizechart.update();
        globals.optimizetotalchart.update();
        enablebtn("air_opt_btn", text)
        adjustPanels()
        return;
    }
    var allpaths = await BFSfromTarget(target, [], true, false, false)
    await updateProgress(1, 3, "air_opt_btn", " ... Calculating new topology")
    var re = new RegExp("_", "g")

    if (source) {
        allpaths = Object.filter(allpaths, p => p.startsWith(source + "_"))
    }
    else {
        $("#air_cent_element_source").val("")
    }
    var pathvalues = {
        pos: 0,
        neg: 0,
    }
    var evalues = {}

    for (var e in AIR.Molecules) {
        evalues[e] = {
            pos: 0,
            neg: 0,
            total: 0,
        }
    }
    for (var [path, value] of Object.entries(allpaths)) {
        var splitted = path.split(re)
        if (!consistentCompartments(splitted).consistent) {
            continue;
        }
        pathvalues[value == -1 ? "neg" : "pos"] += 1;
        for (var e of splitted) {

            evalues[e][value == -1 ? "neg" : "pos"] += 1;
            evalues[e].total += 1;
        }
    }
    pathvalues["total"] = pathvalues.pos + pathvalues.neg
    var totalratio = 2 * (pathvalues.pos / pathvalues.total) - 1;
    var neg_percentage = pathvalues.neg * 100 / pathvalues.total;
    var pos_percentage = pathvalues.pos * 100 / pathvalues.total;

    for (var e in AIR.Molecules) {
        if (e == source || e == target)
            continue;

        var e_pos_percentage = (pathvalues.pos - evalues[e].pos) * 100 / (pathvalues.total - evalues[e].total);

        var diff = e_pos_percentage - pos_percentage;

        if (diff == 0) {
            continue;
        }

        chartData.push([
            e,
            diff,
            evalues[e].pos,
            evalues[e].neg,
            evalues[e].total
        ])
    }
    chartData = chartData.sort(function (a, b) {
        return Math.abs(b[1]) - Math.abs(a[1]);
    });
    globals.optimizetotalchart.data = {
        labels: ["Total"],
        datasets:
            [
                {
                    label: "Negative Paths",
                    data: [
                        -neg_percentage,
                    ],
                    barThickness: 30,
                    backgroundColor: "#4da3ff"
                },
                {
                    label: "Positive Paths",
                    data: [
                        pos_percentage,
                    ],
                    barThickness: 30,
                    backgroundColor: "#ff4d4d"
                },

            ]
    }

    globals.optimizechart.data = {
        labels: chartData.map(d => strikeThrough(AIR.Molecules[d[0]].name)),
        datasets:
            [
                {
                    label: "Negative Paths",
                    data: chartData.map(d => d[1] < 0 ? d[1] : 0),
                    barThickness: 30,
                    backgroundColor: "#4da3ff"
                },
                {
                    label: "Positive Paths",
                    data: chartData.map(d => d[1] > 0 ? d[1] : 0),
                    barThickness: 30,
                    backgroundColor: "#ff4d4d"
                },

            ]
    }

    document.getElementById("opt_canvasContainer").style.height = (70 * chartData.length) < 600 ? "600px" : (70 * chartData.length).toString() + "px";

    globals.optimizechart.update();
    globals.optimizetotalchart.update();
    enablebtn("air_opt_btn", text)
    adjustPanels()


    globals.optimizechart.scales.x.min = -Math.max(...chartData.map(d => Math.abs(d[1])));
    globals.optimizechart.scales.x.max = - globals.optimizechart.scales.x.min;

}

async function getCentralityPanel() {
    return new Promise((resolve, reject) => {
        $("#air_path_tab").append(`

        <div class="tab-pane air_sub_tab_pane" id="air_centrality" role="tabpanel" aria-labelledby="air_centrality-tab">
            <div class="mt-4">
                <span style="display: inline-block;width: 49.5%">From</span>
                <span style="display: inline-block;width: 49%">To</span>
            </div>
            <div class="mb-4">
                <input type="text" list="air_cent_elementnames_source" style="width: 49%" class="textfield mr-1" id="air_cent_element_source" placeholder="Type in name"/>
                <datalist id="air_cent_elementnames_source" style="height:5.1em;overflow:hidden">
                </datalist>
                <input type="text" list="air_cent_elementnames_target" style="width: 49%" class="textfield" id="air_cent_element_target" value="sarcopenia (muscle)"/>
                <datalist id="air_cent_elementnames_target" style="height:5.1em;overflow:hidden">
                </datalist>
            </div>
            <button type="button" id="air_cent_btn" class="air_btn btn btn-block mt-2 mb-2">Calculate Centrality</button>
            <div class="mb-4 mt-4" style="height:220px">
                <canvas id="air_chart_centralitypath"></canvas>
            </div>
            <div class="mb-4 mt-4" style="height:600px;overflow-y:scroll; position:relative">
                <div id="cent_canvasContainer" style="height:0px">
                    <canvas id="air_chart_centrality"></canvas>
                </div>
            </div>
        </div>`);

        $('#air_cent_btn').on('click', getCentralityFC);

        var outputCanvas = document.getElementById('air_chart_centralitypath').getContext('2d');
        globals.centralitypathchart = new Chart(outputCanvas, {
            type: 'bar',
            data: {
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Total paths ditribution',
                        fontFamily: 'Helvetica',
                        fontColor: '#6E6EC8',
                        fontStyle: 'bold'
                    },
                    legend: {
                        display: true
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {

                                return context.dataset.label + ": " + expo(Math.abs(context.raw)) + "%";

                            }
                        }
                    },
                },

                scales: {
                    y: {
                        ticks:
                        {
                            mirror: true,
                            z: 2,
                            color: "#000000",
                        },
                        stacked: true
                    },
                    x: {
                        position: "top",
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Percentage'
                        },
                        ticks: {
                            callback: function (value, index, values) {
                                return Math.abs(value) + '%';
                            },
                            stepSize: 20
                        },
                        min: -100,
                        max: 100,
                        stacked: true
                    }
                },

                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0
                },
                onHover: (event, chartElement) => {
                    event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
                },
                indexAxis: 'y',
            }
        });

        outputCanvas = document.getElementById('air_chart_centrality').getContext('2d');
        globals.centralityChart = new Chart(outputCanvas, {
            type: 'bar',
            data: {
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Changes in element centralities',
                        fontFamily: 'Helvetica',
                        fontColor: '#6E6EC8',
                        fontStyle: 'bold'
                    },
                    legend: {
                        display: true
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {

                                return ([
                                    ["Influence", "Betweenness", "Closeness"][context.datasetIndex] + ": " + expo(context.raw) + "%",
                                    "OG Value: " + expo(globals.centralitychartData[context.dataIndex][4 + 2 * context.datasetIndex]),
                                    "KO Value: " + expo(globals.centralitychartData[context.dataIndex][5 + 2 * context.datasetIndex])
                                ])


                            }
                        }
                    },
                    zoom: {
                        pan: {
                            enabled: true,
                        },
                        zoom: {
                            wheel: {
                                enabled: true,
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'xy',
                        }
                    }
                },

                scales: {
                    y: {
                        ticks:
                        {
                            mirror: true,
                            z: 3,
                            color: "#000000"
                        }
                    },
                    x: {
                        position: "top",
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Percentage change in centrality'
                        },
                        ticks: {
                            callback: function (value, index, values) {
                                return value + '%';
                            },
                        },
                    }
                },

                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0
                },
                responsiveAnimationDuration: 0,
                indexAxis: 'y',
            }
        });

        resolve();
    });
}

async function getCentralityFC() {

    let text = await disablebutton("air_cent_btn", true);
    let count = 0;
    await updateProgress(0, 1, "air_cent_btn", " ... Calculating new topology")
    let source = $("#air_cent_element_source").val().split(',')[0]
    let target = $("#air_cent_element_target").val().split(',')[0]

    var chartData = []


    if (AIR.ElementNames.fullname.hasOwnProperty(source.toLowerCase().trim())) {
        source = AIR.ElementNames.fullname[source.toLowerCase().trim()]
    }
    else {
        source = false;
    }

    if (AIR.ElementNames.fullname.hasOwnProperty(target.toLowerCase().trim())) {
        target = AIR.ElementNames.fullname[target.toLowerCase().trim()]
    }
    else {
        target = false;
    }

    let ko_elements = perturbedElements();


    if (!target || source == target || ko_elements.length == 0) {
        document.getElementById("cent_canvasContainer").style.height = (70 * chartData.length) < 600 ? "600px" : (70 * chartData.length).toString() + "px";
        globals.centralityChart.data = {}
        globals.centralitypathchart.data = {}
        globals.centralitychartData = []

        globals.centralityChart.update();
        globals.centralitypathchart.update();
        enablebtn("air_cent_btn", text)
        adjustPanels();
        return;
    }
    var allpaths = await BFSfromTarget(target, [], true, false, false)
    await updateProgress(1, 3, "air_cent_btn", " ... Calculating new topology")
    var re = new RegExp("_", "g")

    if (source) {
        allpaths = Object.filter(allpaths, p => p.startsWith(source + "_"))
    }
    else {
        $("#air_cent_element_source").val("")
    }
    var normalpathvalues = {
        pos: 0,
        neg: 0
    }
    var kopathvalues =
    {
        pos: 0,
        neg: 0
    }

    var elementsinpaths = {}
    var ko_elementsinpaths = {}

    for (var [path, value] of Object.entries(allpaths)) {
        var splitted = path.split(re)

        if (!consistentCompartments(splitted).consistent) {
            continue;
        }

        var is_ko = ko_elements.some(ko => splitted.includes(ko) == true)

        for (var e of splitted) {
            if (!elementsinpaths.hasOwnProperty(e)) {
                elementsinpaths[e] = []
                ko_elementsinpaths[e] = []
            }
            elementsinpaths[e].push([splitted, value])
            normalpathvalues[value == -1 ? "neg" : "pos"] += 1;
            if (!is_ko) {
                kopathvalues[value == -1 ? "neg" : "pos"] += 1;
                ko_elementsinpaths[e].push([splitted, value])
            }
        }
    }
    await updateProgress(2, 3, "air_cent_btn", " ... Calculating new topology")
    allpaths = {}

    var maxlength = Object.keys(elementsinpaths).length



    for (var e of Object.keys(elementsinpaths)) {

        if (count % 30 == 0)
            await updateProgress(2 + maxlength + count, 3 * maxlength, "air_cent_btn", " ... Calculating new topology")
        count++

        if (ko_elements.includes(e) || target == e) {
            continue;
        }

        var betw = elementsinpaths[e].filter(p => p[0][0] != e).map(p => p[0]).length;
        var ko_betw = ko_elementsinpaths[e].filter(p => p[0][0] != e).map(p => p[0]).length;

        var betw_log2 = (betw == 0 ? 0 : ((betw - ko_betw) * 100 / betw));

        var epaths = elementsinpaths[e].filter(p => p[0][0] == e).map(p => p[1])
        var ko_epath = ko_elementsinpaths[e].filter(p => p[0][0] == e).map(p => p[1])

        var infl, ko_infl;
        if (AIR.Phenotypes.hasOwnProperty(target)) {
            infl = AIR.Phenotypes[target].values.hasOwnProperty(e) ? AIR.Phenotypes[target].values[e] : 0;
            ko_infl = globals.pe_influenceScores[target].values.hasOwnProperty(e) ? globals.pe_influenceScores[target].values[e] : 0;
        }
        else {
            infl = (2 * epaths.filter(p => p == 1).length / epaths.length) - 1;
            ko_infl = (2 * ko_epath.filter(p => p == 1).length / ko_epath.length) - 1;
        }


        var infl_log2 = (infl - ko_infl) * 100

        var clos = epaths.length
        var ko_clos = ko_epath.length

        var clos_log2 = (clos == 0 ? 0 : ((clos - ko_clos) * 100 / clos))

        if (clos_log2 != 0 || betw_log2 != 0) {
            chartData.push([
                e,
                -infl_log2,
                -betw_log2,
                -clos_log2,
                infl,
                ko_infl,
                betw,
                ko_betw,
                clos,
                ko_clos
            ])
        }
    }

    chartData = chartData.sort(function (a, b) {
        return Math.max(...[Math.abs(b[1]), Math.abs(b[2]), Math.abs(b[3])]) - Math.max(...[Math.abs(a[1]), Math.abs(a[2]), Math.abs(a[3])]);
    });

    globals.centralitychartData = chartData

    globals.centralityChart.data = {
        labels: chartData.map(p => AIR.Molecules[p[0]].name),
        datasets: [
            {
                label: "Impact",
                data: chartData.map(p => p[1]),
                backgroundColor: "#FF0000",
            },
            {
                label: "Betweenness",
                data: chartData.map(p => p[2]),
                backgroundColor: "#4da3ff",
            },
            {
                label: "Closeness",
                data: chartData.map(p => p[3]),
                backgroundColor: "#00FF00",
            }
        ]

    }

    var _total = (normalpathvalues.pos + normalpathvalues.neg)
    globals.centralitypathchart.data = {
        labels: ["Before Knockout", "After Knockout"],
        datasets:
            [
                {
                    label: "Positive Paths",
                    data: [
                        normalpathvalues.pos * 100 / _total,
                        kopathvalues.pos * 100 / _total,
                    ],
                    barThickness: 30,
                    backgroundColor: "#ff4d4d"
                },
                {
                    label: "Negative Paths",
                    data: [
                        -normalpathvalues.neg * 100 / _total,
                        -kopathvalues.neg * 100 / _total,
                    ],
                    barThickness: 30,
                    backgroundColor: "#4da3ff"
                }
            ]
    }

    enablebtn("air_cent_btn", text)
    document.getElementById("cent_canvasContainer").style.height = (70 * chartData.length) < 600 ? "600px" : (70 * chartData.length).toString() + "px";
    globals.centralitypathchart.update();
    globals.centralityChart.update();

    adjustPanels();
}

async function getPathPanel() {
    return new Promise((resolve, reject) => {

        $("#air_path_element").keyup(function (event) {
            if (event.keyCode === 13) {
                $("#air_path_btn").click();
            }
        });

        $("#air_cb_through").change(function () {
            $("#air_cb_notthrough").prop("checked", !this.checked);
        });
        $("#air_cb_notthrough").change(function () {
            $("#air_cb_through").prop("checked", !this.checked);
        });

        globals.air_path_table = $('#air_path_table').DataTable({
            "lengthMenu": [5, 6, 7, 8, 9, 10],
            "order": [[1, "asc"]],
            "scrollX": true,
            "autoWidth": true,
            // "columns": [
            //     { "width": "10px" },
            //     { "width": "10px" },
            //     { "width": "30px" },
            //     { "width": "100px" },
            // ],
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
                    className: 'dt-left',
                }
            ]
        }) //.columns.adjust().draw(true);;
        $(globals.air_path_table.table().container()).addClass('air_datatable');

        var outputCanvas = document.getElementById('air_chart_path').getContext('2d');
        globals.pathchart = new Chart(outputCanvas, {
            type: 'bar',
            data: {
            },
            options: {
                plugins: {
                    title: {
                        display: false,
                        text: 'Elements included in Paths',
                        fontFamily: 'Helvetica',
                        fontColor: '#6E6EC8',
                        fontStyle: 'bold'
                    },
                    legend: {
                        display: true
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                var _data = globals.pathChartData.data[context.dataIndex]
                                if (context.dataIndex == 0) {
                                    return ([
                                        "Total paths: " + expo(_data[1]) + " (" + expo(_data[1] * 100 / _data[8]) + "%)",
                                        "   of these positive: " + expo(_data[2]) + " (" + expo(_data[2] * 100 / _data[1]) + "%)",
                                        "   of these negative: " + expo(_data[3]) + " (" + expo(_data[3] * 100 / _data[1]) + "%)"
                                    ])
                                }

                                var indexincrease = context.datasetIndex;
                                var typeText = context.datasetIndex == 0 ? ["Positive", "++", "Pos-Pos Paths (→→)", "--", "Neg-Neg Paths (⊣⊣)"] :
                                    ["Negative", "+-", "Pos-Neg Paths (→⊣)", "-+", "Neg-Pos Paths (⊣→)"]
                                return ([
                                    typeText[0] + " Paths: " + expo(_data[2 + indexincrease]) + " (" + expo(_data[2 + indexincrease] * 100 / _data[1]) + "%)",
                                    "(Total Paths: " + _data[1] + " (" + expo(_data[1] * 100 / _data[8]) + "%))",
                                    "",
                                    typeText[2] + ": " + expo(_data[4 + indexincrease]) + " (" + expo(_data[4 + indexincrease] * 100 / _data[2 + indexincrease]) + "%)",
                                    ...(_data[9][typeText[1] + "in"].length > 0 ?
                                        ["  incoming:",
                                            ..._data[9][typeText[1] + "in"].map(e => "    " + AIR.Molecules[e].name),
                                        ] : []),
                                    ...(_data[9][typeText[1] + "out"].length > 0 ?
                                        ["  outgoing:",
                                            ..._data[9][typeText[1] + "out"].map(e => "    " + AIR.Molecules[e].name)
                                        ] : []),
                                    "",
                                    typeText[4] + ": " + expo(_data[6 + indexincrease]) + " (" + expo(_data[6 + indexincrease] * 100 / _data[2 + indexincrease]) + "%)",
                                    ...(_data[9][typeText[3] + "in"].length > 0 ?
                                        ["  incoming:",
                                            ..._data[9][typeText[3] + "in"].map(e => "    " + AIR.Molecules[e].name),
                                        ] : []),
                                    ...(_data[9][typeText[3] + "out"].length > 0 ?
                                        ["  outgoing:",
                                            ..._data[9][typeText[3] + "out"].map(e => "    " + AIR.Molecules[e].name)
                                        ] : [])
                                ])

                            }
                        }
                    },
                },

                scales: {
                    y: {
                        ticks:
                        {
                            mirror: true,
                            z: 2,
                            color: "#000000",
                        },
                        stacked: true
                    },
                    x: {
                        position: "top",
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Percentage'
                        },
                        ticks: {
                            callback: function (value, index, values) {
                                return value + '%';
                            },
                            stepSize: 20
                        },
                        min: 0,
                        max: 100,
                        stacked: true
                    }
                },

                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0
                },
                onHover: (event, chartElement) => {
                    event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
                },
                indexAxis: 'y',
            }
        });

        document.getElementById('air_chart_path').onclick = async function (evt) {
            if (globals.pathchart) {
                var activePoints = globals.pathchart.getElementsAtEventForMode(evt, 'point', globals.pathchart.options);
                var firstPoint = activePoints[0];

                $("#air_path_element_source").val(AIR.Molecules[globals.pathChartData.source].name)
                $("#air_path_element_through").val(globals.pathChartData.data[firstPoint.index][0])
                $("#air_path_element_target").val(AIR.Molecules[globals.pathChartData.target].name)
                $("#air_cb_through").prop("checked", true)
                $("#air_cb_notthrough").prop("checked", false)
                await updatePathData();

                globals.air_path_table.search(firstPoint.datasetIndex == 0 ? "positive" : "negative").draw();

            }
        };

        $('#air_path_btn').on('click', updatePathData);

        resolve();
    });
}
async function updatePathData() {
    return new Promise(async function (resolve, reject) {
        let text = await disablebutton("air_path_btn");
        minervaProxy.project.map.getHighlightedBioEntities().then(async function (highlighted) {

            minervaProxy.project.map.hideBioEntity(highlighted).then(async function (pv) {

                globals.air_path_table.clear();

                let source = $("#air_path_element_source").val().split(',')[0]
                let through = $("#air_path_element_through").val().split(',')[0]
                let target = $("#air_path_element_target").val().split(',')[0]

                if (AIR.ElementNames.fullname.hasOwnProperty(source.toLowerCase().trim())) {
                    source = AIR.ElementNames.fullname[source.toLowerCase().trim()]
                }
                else {
                    source = false;
                }

                if (AIR.ElementNames.fullname.hasOwnProperty(target.toLowerCase().trim())) {
                    target = AIR.ElementNames.fullname[target.toLowerCase().trim()]
                }
                else {
                    target = false;
                }

                if (AIR.ElementNames.fullname.hasOwnProperty(through.toLowerCase().trim())) {
                    through = AIR.ElementNames.fullname[through.toLowerCase().trim()]
                }
                else {
                    through = false;
                }

                if (!source || !target || source == target || source == through || target == through) {
                    document.getElementById("canvasContainer").style.height = "0px";
                    globals.air_path_table.search("");
                    globals.pathchart.data.datasets = []
                    globals.pathchart.update();
                    globals.air_path_table.columns.adjust().draw();
                    enablebtn("air_path_btn", text)
                    resolve();
                    return;
                }

                let ko_elements = perturbedElements();
                let pathsfromelement = (await BFSfromTarget(target, document.getElementById("air_cb_considerko").checked ? ko_elements : [], document.getElementById("air_cb_allpaths").checked ? false : true, true, true))[source]
                let epaths = [];

                var re = new RegExp("([+-])", 'g')
                var sre = new RegExp("[+-]")

                var allowreentry = $("#air_cb_reentry").prop("checked");
                var filteronlythrough = $("#air_cb_through").prop("checked");
                var weighted = $("#air_cb_weighted").prop("checked");
                var through_regExp = new RegExp(through + "[+-]")

                for (let p of Object.keys(pathsfromelement)) {
                    var comps = consistentCompartments(p.split(sre));
                    pathsfromelement[p] = {
                        type: pathsfromelement[p],
                        skips: comps.numberofskips == 0 ? 1 : comps.numberofskips
                    }

                    if (!allowreentry && !comps.consistent)
                        continue;
                    if (through) {
                        if (filteronlythrough) {
                            if (!p.match(through_regExp))
                                continue
                        }
                        else {
                            if (!p.match(through_regExp))
                                continue
                        }
                    }
                    epaths.push(p)
                }


                pathsfromelement = Object.filter(pathsfromelement, p => epaths.includes(p));


                var numberofinclusions = {}

                for (var e in AIR.Molecules) {
                    numberofinclusions[e] = {
                        total: 0,
                        negative: 0,
                        positive: 0,
                        "++": 0,
                        "--": 0,
                        "+-": 0,
                        "-+": 0,
                        topregulators: {
                            "++in": {},
                            "--in": {},
                            "+-in": {},
                            "-+in": {},
                            "++out": {},
                            "--out": {},
                            "+-out": {},
                            "-+out": {},
                        }
                    };

                }

                for (var path of epaths) {
                    var newpath = '<div style="white-space: pre">'
                    var length = 0;
                    var relation = 1;
                    var crossedElements = {}
                    var elementcounter = 0
                    var throughtype = pathsfromelement[path].type;
                    var elist = path.split(re)
                    for (var [i,e] of elist.entries()) {
                        switch (e) {
                            case "+":
                                newpath += getInteractionLinkIconHTML(1, elist[i-1], elist[i+1]);
                                length += 1;
                                break;
                            case "-":
                                newpath += getInteractionLinkIconHTML(-1, elist[i-1], elist[i+1]);
                                length += 1;
                                relation *= -1;
                                break;
                            default:
                                newpath += getLinkIconHTML(e) //getLinkIconHTML(e, false)
                                var _number = weighted ? (1 / pathsfromelement[path].skips) : 1;
                                numberofinclusions[e].total += _number;
                                var type = (pathsfromelement[path].type == -1 ? "negative" : "positive");
                                var subtype = (relation == -1 ? "-" : "+") + ((pathsfromelement[path].type * relation) == 1 ? "+" : "-");
                                numberofinclusions[e][type] += _number;
                                numberofinclusions[e][subtype] += _number;
                                var intype = subtype + "in";
                                if (e != target) {
                                    for (var _e in crossedElements) {
                                        var outtype = (crossedElements[_e] == -1 ? "-" : "+") + ((pathsfromelement[path].type * crossedElements[_e]) == 1 ? "+" : "-") + "out";
                                        if (!numberofinclusions[_e].topregulators[outtype].hasOwnProperty(e)) {
                                            numberofinclusions[_e].topregulators[outtype][e] = _number;
                                        }
                                        else {
                                            numberofinclusions[_e].topregulators[outtype][e] += _number;
                                        }
                                        if (_e != source || elementcounter == 1) {
                                            if (!numberofinclusions[e].topregulators[intype].hasOwnProperty(_e)) {
                                                numberofinclusions[e].topregulators[intype][_e] = _number;
                                            }
                                            else {
                                                numberofinclusions[e].topregulators[intype][_e] += _number;
                                            }
                                        }
                                    }
                                }
                                if (through && e == through) {
                                    throughtype = relation;
                                }
                                crossedElements[e] = relation;
                                elementcounter++;
                                break;
                        }
                    }
                    newpath += "</div>"
                    globals.air_path_table.row.add([
                        '<a href="#" class="air_path_entry" data="' + path + '"><span class="fas fa-eye"></a>',
                        length,
                        coloredElement(through ? [throughtype, throughtype * pathsfromelement[path].type] : [throughtype], false),
                        coloredElement([pathsfromelement[path].type]),
                        newpath
                    ])
                }

                function coloredElement(typearray, text = true, seperator = "") {
                    return typearray.map(t =>
                    (t == -1 ?
                        '<span style="color:red">' + (text ? "negative" : "⊣") + '</span>' :
                        '<span style="color:black">' + (text ? "positive" : "→") + '</span>')
                    ).join(seperator)
                }

                var _elength = 0
                for (var p of epaths) {
                    _elength += (1 / pathsfromelement[p].skips)

                    if (!_elength) {
                        let gawhgnwg;
                    }
                }

                var elength = weighted ? epaths.reduce((total, p) => (1 / pathsfromelement[p].skips) + total, 0) : epaths.length;

                let chartdata = [
                    [
                        "Total",
                        elength,
                        weighted ? epaths.filter(p => pathsfromelement[p].type == 1).reduce((total, p) => (1 / pathsfromelement[p].skips) + total, 0) : epaths.filter(p => pathsfromelement[p].type == 1).length,
                        weighted ? epaths.filter(p => pathsfromelement[p].type == -1).reduce((total, p) => (1 / pathsfromelement[p].skips) + total, 0) : epaths.filter(p => pathsfromelement[p].type == -1).length,
                        0,
                        0,
                        0,
                        0,
                        elength,
                        {},
                    ]
                ]

                for (let e in numberofinclusions) {

                    if (numberofinclusions[e].total == 0 || e == source || e == target)
                        continue
                    var topregulators = {}
                    for (var type in numberofinclusions[e].topregulators) {
                        topregulators[type] = Object.keys(pickHighest(numberofinclusions[e].topregulators[type], 3, false))
                    }
                    chartdata.push(
                        [
                            AIR.Molecules[e].name,
                            (numberofinclusions[e].total),
                            (numberofinclusions[e].positive),
                            (numberofinclusions[e].negative),
                            (numberofinclusions[e]["++"]),
                            (numberofinclusions[e]["+-"]),
                            (numberofinclusions[e]["--"]),
                            (numberofinclusions[e]["-+"]),
                            elength,
                            topregulators
                        ]);

                }

                chartdata = chartdata.sort(function (a, b) {
                    return b[1] - a[1];
                });

                globals.pathChartData = {
                    source: source,
                    through: through,
                    target: target,
                    data: chartdata
                };

                document.getElementById("canvasContainer").style.height = (50 + 40 * chartdata.length).toString() + "px";

                globals.pathchart.data = {
                    labels: chartdata.map(p => p[0]),
                    datasets:
                        [
                            {
                                label: "Percentage of positive Paths",
                                data: chartdata.map(p => expo(p[2] * 100 / elength)),
                                backgroundColor: "#d8d8d8",
                                barThickness: 30,
                            },
                            {
                                label: "Percentage of negative Paths",
                                data: chartdata.map(p => expo(p[3] * 100 / elength)),
                                backgroundColor: "#ff4d4d",
                                barThickness: 30,
                            }
                        ]

                }

                globals.air_path_table.columns.adjust().draw();
                globals.pathchart.update();
                adjustPanels();
                enablebtn("air_path_btn", text)
                resolve();
            });
        });
    });
}
async function getPhenotypePanel() {
    return new Promise((resolve, reject) => {

        for (let p in AIR.Phenotypes) {
            globals.pe_influenceScores[p] =
            {
                values: AIR.Phenotypes[p].values,
                SPs: AIR.Phenotypes[p].SPs
            }
        }
        $("#air_path_tab").append(`

        <div class="tab-pane air_sub_tab_pane show active" id="air_pheno" role="tabpanel" aria-labelledby="air_pheno-tab">
            <h4 class="mt-4 mb-4">Resulting phenotype levels:</h4>
            <div class="row mt-2 mb-4">
                <div class="col-auto">
                    <div class="wrapper">
                        <button type="button" class="air_btn_info btn btn-secondary"
                                data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Normalization"
                                data-content="If checked, phenotype levels will be normalized by the max absolute values.">
                            ?
                        </button>
                    </div>
                </div>
                <div class="col">
                    <div class="cbcontainer">
                        <input type="checkbox" class="air_checkbox" id="air_normalize_phen">
                        <label class="air_checkbox" for="air_normalize_phen">Normalize Phenotypes</label>
                    </div>
                </div>
            </div> 
            <table id="air_table_pe_results" cellspacing="0" class="air_table table table-sm mt-4 mb-4" style="width:100%">
                <thead>
                    <tr>
                        <th style="vertical-align: middle;"></th>
                        <th style="vertical-align: middle;">Phenotype</th>
                        <th style="vertical-align: middle;" data-toggle="tooltip" title="Predicted change in the level of the phenotype after perturbation (normalized from -1 to 1)." >Level</th>
                        <th style="vertical-align: middle;">adj. p-value</th>
                        <th style="vertical-align: middle;" data-toggle="tooltip" title="Weighted percentage of the total number of regulators of the phenotype that were perturbed.">Sat.</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            </table>
        </div>`);

        $('.air_btn_info[data-toggle="popover"]').popover();
        $("#air_pe_selectedelement_btn").tooltip();
        $("#air_pe_element_input").keyup(function (event) {
            if (event.keyCode === 13) {
                $("#air_pe_element_btn").click();
            }
        });
        $('#air_normalize_phen').on('click', air_EstimatePhenotypes)

        globals.pe_element_table = $('#air_table_pe_elements').DataTable({
            //"scrollX": true,
            "order": [[0, "asc"]],
            "table-layout": "fixed", // ***********add this
            "word-wrap": "break-word",
        });
        $(globals.pe_element_table.table().container()).addClass('air_datatable');

        globals.pe_results_table = $('#air_table_pe_results').DataTable({
            "dom": '<"top"<"left-col"B><"right-col"f>>rtip',
            buttons: [
                {
                    text: 'Copy',
                    className: 'air_dt_btn',
                    action: function () {
                        copyContent(getDTExportString(globals.pe_results_table));
                    }
                },
                {
                    text: 'CSV',
                    className: 'air_dt_btn',
                    action: function () {
                        air_download("InSilicoPerturb_PhenotypeResults_csv.txt", getDTExportString(globals.pe_results_table, seperator = ","))
                    }
                },
                {
                    text: 'TSV',
                    className: 'air_dt_btn',
                    action: function () {
                        air_download("InSilicoPerturb_PhenotypeResults_tsv.txt", getDTExportString(globals.pe_results_table))
                    }
                }
            ],
            //"scrollX": true,
            "order": [[3, "asc"]],
            "table-layout": "fixed", // ***********add this
            "word-wrap": "break-word",
            "columns": [
                { "width": "5%" },
                { "width": "50%" },
                { "width": "15%" },
                { "width": "20%" },
                { "width": "10%" }
            ],
            "columnDefs": [
                {
                    targets: 0,
                    className: 'dt-center',
                },
                {
                    targets: 1,
                    className: 'dt-right',
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
            ]
        });

        $('#air_import_undo').on('click', async function () {

            if (globals.pe_data_index == 0) {
                return;
            }

            globals.pe_data_index -= 1;
            $("#air_import_redo").removeClass("air_disabledbutton");

            if (globals.pe_data_index == 0) {
                $("#air_import_undo").addClass("air_disabledbutton");
            }

            await setPeTable()

            let ko_elements = perturbedElements()
            if (globals.ko_elements.filter(x => !ko_elements.includes(x)).concat(ko_elements.filter(x => !globals.ko_elements.includes(x))).length != 0) {
                await recalculateInfluenceScores();
            }

            await air_EstimatePhenotypes();
        })

        $('#air_import_redo').on('click', async function () {

            if (globals.pe_data_index == (globals.pe_data.length - 1)) {
                return;
            }

            globals.pe_data_index += 1;
            $("#air_import_undo").removeClass("air_disabledbutton");

            if (globals.pe_data_index == (globals.pe_data.length - 1)) {
                $('#air_import_redo').addClass("air_disabledbutton");
            }

            await setPeTable()

            let ko_elements = perturbedElements()
            if (globals.ko_elements.filter(x => !ko_elements.includes(x)).concat(ko_elements.filter(x => !globals.ko_elements.includes(x))).length != 0) {
                await recalculateInfluenceScores();
            }

            await air_EstimatePhenotypes();
        })

        $('#air_pe_selectedelement_btn').on('click', async function () {

            if (globals.selected.length > 0) {
                if (globals.selected[0].constructor.name === 'Alias') {
                    globals.pe_data = globals.pe_data.slice(0, globals.pe_data_index + 1);

                    let _data = JSON.parse(JSON.stringify(globals.pe_data[globals.pe_data_index]));

                    let element = globals.selected[0].name.toLowerCase().trim();

                    if (globals.selected[0]._compartmentId) {
                        element += "_" + AIR.Compartments[globals.selected[0]._compartmentId];
                    }
                    else {
                        element += "_secreted";
                    }

                    if (AIR.ElementNames.fullname.hasOwnProperty(element.toLowerCase().trim())) {
                        var m = AIR.ElementNames.fullname[element.toLowerCase().trim()];

                        if (!_data.hasOwnProperty(m))
                            _data[m] = {
                                "value": 0,
                                "perturbed": false
                            };
                    }

                    if (JSON.stringify(globals.pe_data[globals.pe_data_index]) == JSON.stringify(_data)) {
                        return;
                    }

                    globals.pe_data.push(_data)
                    globals.pe_data_index += 1;

                    $("#air_import_redo").addClass("air_disabledbutton");
                    $("#air_import_undo").removeClass("air_disabledbutton");

                    await setPeTable()
                    await air_EstimatePhenotypes();
                }
            }

        });


        $('#air_pe_element_btn').on('click', async function () {

            globals.pe_data = globals.pe_data.slice(0, globals.pe_data_index + 1);

            let _data = JSON.parse(JSON.stringify(globals.pe_data[globals.pe_data_index]));

            for (let element of $("#air_pe_element_input").val().split(',')) {
                if (AIR.ElementNames.fullname.hasOwnProperty(element.toLowerCase().trim())) {
                    var m = AIR.ElementNames.fullname[element.toLowerCase().trim()];

                    if (!_data.hasOwnProperty(m))
                        _data[m] = {
                            "value": 0,
                            "perturbed": false
                        };
                }
            }

            if (JSON.stringify(globals.pe_data[globals.pe_data_index]) == JSON.stringify(_data)) {
                return;
            }

            globals.pe_data.push(_data)
            globals.pe_data_index += 1;

            $("#air_import_redo").addClass("air_disabledbutton");
            $("#air_import_undo").removeClass("air_disabledbutton");

            await setPeTable()
            await air_EstimatePhenotypes();
        });

        $('#air_pe_reset_btn').on('click', () => {

            let _data = JSON.parse(JSON.stringify(globals.pe_data[globals.pe_data_index]));

            if (Object.keys(_data).length == 0) {
                return;
            }

            for (let e in _data) {
                _data[e] = {
                    "value": 0,
                    "perturbed": false
                };
            }

            globals.pe_element_table.rows().every(function () {
                var row = this.nodes().to$()
                row.find('.air_slider').val(0);
                row.find('.slidervalue')[0].innerHTML = `<font data-order="1"><b>0<b></font>`;
                row.find('.air_pe_clickCBinTable')[0].checked = false;
            });

            globals.pe_element_table.columns.adjust().draw(false);
            globals.pe_data.push(_data)
            globals.pe_data_index += 1;

            air_EstimatePhenotypes()
        });



        resolve('');
    });
}

async function calculateshortestPath(ko_elements = []) {
    let elements = {};
    let elementids = Object.keys(AIR.Molecules)
    for (let e of elementids) {
        elements[e] = [];
    }

    for (var s of elementids) {
        let ElementCentrality = AIR.Molecules[s].Centrality;
        ElementCentrality.Betweenness = 0;
        ElementCentrality.Closeness = 0;
        ElementCentrality.Indegree = 0;
        ElementCentrality.Outdegree = 0;
        ElementCentrality.Degree = 0;
    }

    for (let inter of AIR.Interactions) {
        if (ko_elements.includes(inter.source) || ko_elements.includes(inter.target)) {
            continue;
        }

        elements[inter.source].push(inter.target);

        let ElementCentrality = AIR.Molecules[inter.source].Centrality;
        ElementCentrality.Outdegree += 1;
        ElementCentrality.Degree += 1;

        ElementCentrality = AIR.Molecules[inter.target].Centrality;
        ElementCentrality.Indegree += 1;
        ElementCentrality.Degree += 1;
    }

    elements = Object.fromEntries(Object.entries(elements).filter(([_, v]) => v.length > 0));

    var neighbour, e, visited, queue, dist, spcount;
    var localBetweenness = {};


    for (var s of elementids) {
        visited = [s]
        queue = [s]
        dist = {};
        spcount = {};
        localBetweenness = {}

        dist[s] = 0;
        spcount[s] = 0;

        while (queue.length > 0) {
            e = queue.shift();

            localBetweenness[e] = []
            for (var _neighbour in elements[e]) {
                neighbour = elements[e][_neighbour]

                if (!visited.includes(neighbour)) {
                    visited.push(neighbour);
                    dist[neighbour] = dist[e] + 1;
                    spcount[neighbour] = 1;
                    queue.push(neighbour);

                    localBetweenness[e].push(neighbour);
                }
                else if (dist[neighbour] == dist[e] + 1) {
                    spcount[neighbour] += 1;
                    localBetweenness[e].push(neighbour);
                }
            }
        }
        for (var t in dist) {
            if (dist[t] > 0) {
                AIR.Molecules[s].Centrality.Closeness += 1 / dist[t]
            }
        }
        for (var k in localBetweenness) {
            if (k != s) {
                for (var t of getSPNodes(k)) {
                    AIR.Molecules[k].Centrality.Betweenness += 1 / spcount[t]
                }
            }
        }
        //await updateProgress(count++, _totalIterations, _progressbutton, text=_progressText);
    }

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

function getData(elementname) {
    let elementid = null;

    for (let element in AIR.Molecules) {
        if (AIR.Molecules[element].name.toLowerCase() === elementname.toLowerCase()) {
            elementid = element;
            break;
        }
    }
    if (elementid) {
        $("#air_pe_element_input").val(AIR.Molecules[elementid].name)
        //$("#air_path_element").val(AIR.Molecules[elementid].name)

        if (globals.pe_influenceScores.hasOwnProperty(elementid)) {


            let elementsToHighlight = {}
            for (let e in globals.pe_influenceScores[elementid].values) {
                elementsToHighlight[AIR.Molecules[e].name] = valueToHex(globals.pe_influenceScores[elementid].values[e]);
            }
            for (let e of perturbedElements()) {
                elementsToHighlight[AIR.Molecules[e].name] = "#a9a9a9"
            }
            ColorElements(elementsToHighlight);
        }
    }
}

function perturbedElements() {
    return Object.keys(globals.pe_data[globals.pe_data_index]).filter(e => globals.pe_data[globals.pe_data_index][e].perturbed == true);
}


$(document).on('change', '.air_pe_clickCBinTable', async function () {

    var id = $(this).attr('data');

    let _data = JSON.parse(JSON.stringify(globals.pe_data[globals.pe_data_index]));


    if ($(this).prop('checked') == true) {
        _data[id].perturbed = true;
    }
    else {
        _data[id].perturbed = false;
    }

    if (JSON.stringify(globals.pe_data[globals.pe_data_index]) == JSON.stringify(_data)) {
        return;
    }

    globals.pe_data = globals.pe_data.slice(0, globals.pe_data_index + 1);
    globals.pe_data.push(_data)
    globals.pe_data_index += 1;

    $("#air_import_redo").addClass("air_disabledbutton");
    $("#air_import_undo").removeClass("air_disabledbutton");

    await recalculateInfluenceScores();
});

async function air_EstimatePhenotypes() {
    return new Promise(async function(resolve, reject) {
        await startloading()
        setTimeout(() => {
            globals.pe_results_table.clear()
            let _data = globals.pe_data[globals.pe_data_index];
            let elementsToHighlight = {};
            let elementswithFC = 0
            globals.pe_results = {};

            let typeNumbersinSamples = {
                "protein": 0,
                "metabolite": 0
            }
            for (let e in _data) {
                let FC = _data[e].value
                if (_data[e].perturbed) {
                    elementsToHighlight[AIR.Molecules[e].name] = "#a9a9a9";
                }
                else if (FC != 0) {
                    elementswithFC++;
                    elementsToHighlight[AIR.Molecules[e].name] = valueToHex(FC);
                }
                switch (AIR.Molecules[e].type) {
                    case "PROTEIN":
                    case "RNA":
                        typeNumbersinSamples.protein += 1;
                        break;
                    case "SIMPLE_MOLECULE":
                        typeNumbersinSamples.metabolite += 1;
                        break;
                    default:
                        break;
                }
            }

            let FC_values = Object.values(_data);
            let shuffled_arrays = [];
            let elementarray_proteins = Object.keys(AIR.Molecules).filter(m => ["PROTEIN", "RNA"].includes(AIR.Molecules[m].type))
            let elementarray_metabolite = Object.keys(AIR.Molecules).filter(m => AIR.Molecules[m].type == "SIMPLE_MOLECULE")
        
            for (let i = 0; i < 1000; i++) {
                let shuffled_array = pickRandomElements(elementarray_proteins, typeNumbersinSamples.protein);
                shuffled_array.push(...pickRandomElements(elementarray_metabolite, typeNumbersinSamples.metabolite))
                shuffled_arrays.push(shuffle(shuffled_array))
            }

            var max_level = 0;
            var results = [];
            for (let p in AIR.Phenotypes) {

                let phenotypeValues = globals.pe_influenceScores[p].values;

                let max_influence = 0;
                let influence = 0;
                let level = 0;
                let count_elements = 0;
                var regr_data = {}

                for (let e in phenotypeValues) {
                    let SP = parseFloat(phenotypeValues[e]);
                    max_influence += Math.abs(SP);

                    if (_data.hasOwnProperty(e) && !_data[e].perturbed) {
                        let FC = _data[e].value;

                        if (FC != 0) {
                            influence += Math.abs(SP);
                            level += SP * FC;
                            count_elements++;
                            regr_data[e] = [SP, FC];
                        }
                    }
                }
                var score = getEnrichmentScore(Object.values(regr_data))
                let random_scores = [];
                let random_en_scores = [];
                for (let shuffled_elements of shuffled_arrays) {
                    var _regr_data = [];
                    var _en_score = 0;
                    for (let i in FC_values) {
                        let element = shuffled_elements[i];
                        if (phenotypeValues.hasOwnProperty(element)) {
                            var SP = phenotypeValues[element];
                            var FC = FC_values[i].value
                            _en_score += FC * SP;
                            _regr_data.push([SP, FC]);
                        }
                    }
                    if (_regr_data.length > 0)
                        random_scores.push(getEnrichmentScore(_regr_data))
                    else
                        random_scores.push(0)

                    random_en_scores.push(_en_score)
                }

                globals.pe_results[p] = {
                    id: p,
                    level: level,
                    percentage: (influence / max_influence) * 100,
                    pvalue: 1,
                    dces: regr_data,
                }

                var std = standarddeviation(random_scores)
                var _mean = mean(random_scores);
                var z_score = std != 0 ? (score - _mean) / std : 0;
                var pvalue = GetpValueFromZ(z_score);
                if (!isNaN(pvalue))
                    globals.pe_results[p]["pvalue"] = pvalue;
                globals.pe_results[p]["std"] = [_mean + 1.96 * std, _mean - 1.96 * std];
                globals.pe_results[p]["slope"] = score;

                std = standarddeviation(random_en_scores)
                z_score = std != 0 ? (level - mean(random_en_scores)) / std : 0;
                pvalue = GetpValueFromZ(z_score);
                if (!isNaN(pvalue) && pvalue < globals.pe_results[p]["pvalue"])
                    globals.pe_results[p]["pvalue"] = pvalue

                if (Math.abs(level) > max_level) {
                    max_level = Math.abs(level)
                }
            }

            var m_pvalues = Object.values(globals.pe_results).map(r => r.pvalue).sort((a, b) => a - b);
            var m_phenotypevalues = {}

            for (var [p,r] of Object.entries(globals.pe_results))
            {
                m_phenotypevalues[r.id] = m_pvalues.indexOf(r.pvalue)
            }
            m_pvalues = getAdjPvalues(m_pvalues);

            for (var [p,r] of Object.entries(globals.pe_results)) {
                r.pvalue = m_pvalues[m_phenotypevalues[r.id]]
                var level = r.level / ((document.getElementById("air_normalize_phen").checked === true && max_level != 0) ? max_level : 1);
                if (level != 0) {
                    if (level > 1)
                        level = 1;
                    else if (level < -1)
                        level = -1;
                    elementsToHighlight[AIR.Phenotypes[r.id].name] = valueToHex(level);
                }

                globals.pe_results_table.row.add(
                    [
                        '<button type="button" class="air_pe_popup_btn air_invisiblebtn" data="' + r.id + '" style="cursor: pointer;"><a><span class="fa fa-external-link-alt"></span></a></button>',
                        getLinkIconHTML(r.id),
                        getFontfromValue(expo(level)),
                        expo(r.pvalue),
                        expo(r.percentage)
                    ]
                )
            }

            globals.pe_results_table.columns.adjust().draw();
            adjustPanels(globals.container);
            ColorElements(elementsToHighlight);
            stoploading()            
            resolve()
        }, 0);
    });
}
$(document).on('click', '.air_pe_popup_btn', function () {
    air_createpopup(this, $(this).attr("data"));
});
$('.air_btn').bind('dblclick', function (e) {
    e.preventDefault();
})
$('.clickCBinTable').bind('dblclick', function (e) {
    e.preventDefault();
})

async function recalculateInfluenceScores() {
    $('#sarco_plugincontainer').addClass('waiting');
    //await disablediv('airxplore_tab_content');
    //let _data = globals.pe_data[globals.pe_data_index];
    let _perturbedElements = perturbedElements();
    globals.pe_influenceScores = {}
    if (_perturbedElements.length > 0) {
        if (!$("#air_knockout_warning").length) {
            $("#air_select_target_type").after(`<div class="air_alert alert alert-danger mt-2 mb-2" id="air_knockout_warning">
                <span>Beware: At least one element is knocked out.</span>
                <button type="button" class="air_close close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>  `)
        }
    }
    else {
        $("#air_knockout_warning").remove();
    }

    await getPhenotypeInfluences()

    globals.ko_elements = _perturbedElements
    await air_EstimatePhenotypes();
    //enablediv('airxplore_tab_content');
    $('#sarco_plugincontainer').removeClass('waiting');
}

async function setPeTable() {

    return new Promise((resolve, reject) => {
        if (globals.pe_element_table)
            globals.pe_element_table.destroy();
        else
            return;

        $("#air_table_pe_elements > tbody").empty()
        var tbl = document.getElementById('air_table_pe_elements').getElementsByTagName('tbody')[0];;

        for (let e in globals.pe_data[globals.pe_data_index]) {
            var row = tbl.insertRow(tbl.rows.length);

            createCell(row, 'td', getLinkIconHTML(e), 'col', '', 'right');
            checkBoxCell(row, 'td', "", e, 'center', "air_pe_", globals.pe_data[globals.pe_data_index][e].perturbed);
            createCell(row, 'td', getFontfromValue(globals.pe_data[globals.pe_data_index][e].value), 'col slidervalue', '', 'center').setAttribute('id', 'ESliderValue' + e);
            var slider = createSliderCell(row, 'td', e);
            slider.setAttribute('id', 'ESlider' + e);
            slider.setAttribute('value', globals.pe_data[globals.pe_data_index][e].value);
            slider.onchange = async function () {
                let value = this.value;
                $("#ESliderValue" + e).html(getFontfromValue(parseFloat(value)));
                globals.pe_data[globals.pe_data_index][e] = {
                    "perturbed": false,
                    "value": value
                }
                globals.pe_element_table.rows($("#ESliderValue" + e).closest("tr")).invalidate().draw();
                air_EstimatePhenotypes()
            }

            let delete_btn = createButtonCell(row, 'td', '<i class="fas fa-trash"></i>', "center");
            delete_btn.onclick = async function () {

                globals.pe_data = globals.pe_data.slice(0, globals.pe_data_index + 1);
                let _data = JSON.parse(JSON.stringify(globals.pe_data[globals.pe_data_index]));

                delete _data[e];

                if (JSON.stringify(globals.pe_data[globals.pe_data_index]) == JSON.stringify(_data)) {
                    return;
                }

                globals.pe_data.push(_data)
                globals.pe_data_index += 1;

                $("#air_import_redo").addClass("air_disabledbutton");
                $("#air_import_undo").removeClass("air_disabledbutton");

                await setPeTable()
                await air_EstimatePhenotypes();
            };
        }

        globals.pe_element_table = $('#air_table_pe_elements').DataTable({
            "dom": '<"top"<"left-col"B><"right-col"f>>rtip',
            "buttons": [
                {
                    text: 'Copy',
                    className: 'air_dt_btn',
                    action: function () {
                        copyContent(getDTExportString(globals.pe_element_table));
                    }
                },
                {
                    text: 'CSV',
                    className: 'air_dt_btn',
                    action: function () {
                        air_download("InSilicoPerturb_ElementsSettings_csv.txt", getDTExportString(globals.pe_element_table, seperator = ","))
                    }
                },
                {
                    text: 'TSV',
                    className: 'air_dt_btn',
                    action: function () {
                        air_download(download_string + "InSilicoPerturb_ElementsSettings_tsv.txt", getDTExportString(globals.pe_element_table))
                    }
                }
            ],
            //"scrollX": true,
            //"autoWidth": true,
            "table-layout": "fixed", // ***********add this
            "word-wrap": "break-word",
            "columns": [
                { "width": "25%" },
                { "width": "10%" },
                { "width": "10%" },
                { "width": "55%" },
                { "width": "10%" }
            ]
        }).columns.adjust().draw();
        $(globals.pe_element_table.table().container()).addClass('air_datatable');
        /*
        for(let btn of createdtButtons(this, download_string))
        {
            globals.pe_element_table.button().add( 0, btn);
        }*/

        resolve();

    });
}

async function findPhenotypePath(element, phenotype, hideprevious = true) {

    let ko_elements = perturbedElements();
    var pathsfromelement = await BFSfromTarget(phenotype, ko_elements)
    let epaths = Object.keys(pathsfromelement).filter(p => p.startsWith(element + "_"));

    if (epaths.length > 0) {
        let _additionalelements = ko_elements.reduce((accumulator, currentValue) => {
            accumulator[currentValue] = "#a9a9a9";
            return accumulator;
        }, {});

        let shortestpath = epaths.reduce((a, b) => (a.match(/_/g) || []).length <= (b.match(/_/g) || []).length ? a : b);
        highlightPath(shortestpath.split("_"), pathsfromelement[shortestpath] == -1 ? "#ff0000" : "#0000ff", _additionalelements, hideprevious);
    }
}

async function DFSfromTarget(element, ko_elements = [], interactiontype = false) {

    var paths = new Set();
    var elements = {};
    var elementids = Object.keys(AIR.Molecules)
    var elementres = {}

    for (var e of elementids) {
        elements[e] = {};
        paths[e] = {};
        elementres[e] = new RegExp(e + "([" + (interactiontype ? "+-" : "_") + "]|$)")
    }

    for (var inter of AIR.Interactions) {
        if (ko_elements.includes(inter.source) || ko_elements.includes(inter.target) || inter.type == 0) {
            continue;
        }
        elements[inter.target][inter.source] = {
            type: inter.type,
            sign: (interactiontype ? (inter.type == -1 ? "-" : "+") : "_")
        } 
    }
    elements = Object.filter(elements, e => Object.keys(elements[e]).length > 0);
    var path, newcomps, newtype;

    async function dfs(e, visited, type)
    {
        for (var neighbour in elements[e]) {
            
            if (elementres[neighbour].test(visited))
            {
                paths.add(visited)
                continue;
            }
            
            var {secreted: _secreted, compartment: comp} = AIR.Molecules[neighbour]

            if(leftcompartments.indexOf(comp) != -1)
                continue;
            
            newcomps = [...leftcompartments]
            if(!_secreted && currentcompartment != comp)
            {
                newcomps.push(currentcompartment)
            }

            path = neighbour + elements[e][neighbour].sign + visited
            newtype = type * elements[e][neighbour].type

            await dfs(neighbour, path, newtype)//, _secreted? currentcompartment : comp, newcomps)
        }
    }

    await dfs(element, element, 1)//, AIR.Molecules[element].compartment, [])

    return paths;

}

async function BFSfromTarget(element, ko_elements = [], allpaths = false, interactiontype = false, sorted = false, btn = "") {


    let paths = {};
    let elements = {};
    let elementids = Object.keys(AIR.Molecules)

    let count = 0
    let maxlength = elementids.length;
    await updateProgress(0, 1, btn, " Finding Paths ...");

    var elementres = {}
    var visitedpaths = {}

    for (let e of elementids) {
        elements[e] = {};
        paths[e] = {}
        elementres[e] = new RegExp(e + "([" + (interactiontype ? "+-" : "_") + "]|$)")
    }

    for (var inter of AIR.Interactions) {
        if (ko_elements.includes(inter.source) || ko_elements.includes(inter.target) || inter.type == 0) {
            continue;
        }
        elements[inter.target][inter.source] = {
            type: inter.type,
            sign: (interactiontype ? (inter.type == -1 ? "-" : "+") : "_")
        }
    }

    var re = new RegExp(e + "([" + (interactiontype ? "+-" : "_") + "]|$)")

    elements = Object.filter(elements, e => Object.keys(elements[e]).length > 0);

    var neighbour, l, e, visited, queue, dist, spcount;

    var queue = [element]
    var dist = {};
    var spcount = {};
    var visited = [element]
    visitedpaths[element] = []
    dist[element] = 0;
    spcount[element] = 0;

    paths[element][element] = 1

    var splitsign, type, neighbourpaths, neighbour_re, newpath;

    while (queue.length > 0) {
        e = queue.shift();
        // if(l < 15)
        // {
        for (var neighbour in elements[e]) {            
            if (allpaths) {
                
                // queue.push([neighbour, l+1]);
                // splitsign = neighbour + elements[e][neighbour].sign
                // type = elements[e][neighbour].type
                // neighbourpaths = paths[neighbour]
                // neighbour_re = elementres[neighbour];
    
                // for (var [path, ptype] of Object.entries(paths[e])) {
                //     if (!neighbour_re.test(path)) {
                //         neighbourpaths[splitsign + path] = ptype * type
                //     }
                // }       

                var exists = false
                if(!visitedpaths.hasOwnProperty(neighbour))
                {
                    dist[neighbour] = dist[e] + 1;
                    visitedpaths[neighbour] = []
                }
                else
                {
                    exists = visitedpaths[neighbour].indexOf(e) != -1
                }
                if(dist[neighbour] == dist[e] + 1 || !exists)
                {
                    if(!exists)
                        queue.push(neighbour);

                    visitedpaths[neighbour].push(e);
                    neighbourpaths = paths[neighbour]
                    splitsign = neighbour + elements[e][neighbour].sign
                    type = elements[e][neighbour].type
                    neighbour_re = elementres[neighbour];
        
                    for (var [path, ptype] of Object.entries(paths[e])) {
                        if (!neighbour_re.test(path)) {
                            neighbourpaths[splitsign + path] = ptype * type
                        }
                    }       
                }              
            }
            else {
                if (!visited.includes(neighbour)) {

                    visited.push(neighbour)

                    neighbourpaths = paths[neighbour]
                    splitsign = neighbour + elements[e][neighbour].sign
                    type = elements[e][neighbour].type
                    neighbour_re = elementres[neighbour];
        
                    for (var [path, ptype] of Object.entries(paths[e])) {
                        if (!neighbour_re.test(path)) {
                            neighbourpaths[splitsign + path] = ptype * type
                        }
                    }    

                    queue.push(neighbour);

                }
                else if (dist[neighbour] == dist[e] + 1) {

                    neighbourpaths = paths[neighbour]
                    splitsign = neighbour + elements[e][neighbour].sign
                    type = elements[e][neighbour].type
                    neighbour_re = elementres[neighbour];
        
                    for (var [path, ptype] of Object.entries(paths[e])) {
                        if (!neighbour_re.test(path)) {
                            neighbourpaths[splitsign + path] = ptype * type
                        }
                    }    
                }
            }
        }
        
    //  }
    }

    if (sorted) {
        return paths
    }
    else {

        var output = {};

        for (const e of Object.values(paths)) {
            for (const [path, ptype] of Object.entries(e)) {
                output[path] = ptype
            }
        }
        return output
    }
}

async function getPhenotypeInfluences(force = false) {
    $('body').addClass('waiting');
    let text = await disablebutton("air_init_btn", true);
    await updateProgress(0, 1, "air_init_btn", " Calculating Influence Scores");
    var maxlength = Object.keys(AIR.Phenotypes).length
    let ko_elements = perturbedElements();

    if (ko_elements.length == 0 && !force) {
        for (var p in AIR.Phenotypes) {
            globals.pe_influenceScores[p] = {
                values: AIR.Phenotypes[p].values,
                SPs: AIR.Phenotypes[p].SPs
            }
        }
        $('body').removeClass('waiting');
        await enablebtn("air_init_btn", text);
        return;
    }

    var re = new RegExp("[+-]")
    var reg = new RegExp("([+-])", "g")
    var neg_re = new RegExp("-", "g")
    var ko_re = new RegExp("(" + ko_elements.join("|") + ")(_|$)")

    var allpaths = await BFSfromTarget(AIR.sarcopenia, ko_elements, true, true, true, "")
    globals.phenopaths[p] = JSON.parse(JSON.stringify(allpaths))

    var Relatives = Object.assign({}, ...Object.keys(AIR.Molecules).map((x) => ({[x]: []})))
    var modifiers = {}

    allpaths = Object.entries(allpaths)
    var processedPaths = {}

    var count = 0
    for(let [e, epaths] of allpaths)
    {
        if(count % 100 == 0) 
            await updateProgress(count, allpaths.length, "air_init_btn", " Analyzing Paths...");

        count++
        for(var relative of [e, ...AIR.Molecules[e].parent])
            Relatives[relative].push(e)
        
        if(AIR.Modifiers.hasOwnProperty(e))
        {
            for(let [m, rs] of Object.entries(AIR.Modifiers[e]))
            {
                for(let r of rs)
                {
                    if(!modifiers.hasOwnProperty(r))
                    {
                        modifiers[r] = {
                            "regex": new RegExp(r.split("_").join("[+-]")),
                            "modifiers": []
                        }
                    }
                    modifiers[r].modifiers.push(m)
                }
            }
        }
        processedPaths[e] = []
        for (var [path, t] of Object.entries(epaths))
        {
            var elements = path.split(re)

            if(!consistentCompartments(elements).consistent)
            {
                delete epaths[path]
                continue;
            }
            processedPaths[e].push({
                path: elements.join("_"),
                type: t,
                elements: elements,
                types: path.split(reg),
            })
        }
    }
    delete allpaths
    processedPaths = Object.entries(processedPaths)

    var i = 0
    for (let p in AIR.Phenotypes) {
        
        await updateProgress(i++, maxlength, "air_init_btn", " Calculating Influence Scores...");

        // var ppaths = {} 
        // var pre = new RegExp("[+-]" + p + "(?=[+-])")
        var regulators = new Set()
        var BetweennessValues = Object.assign({}, ...Object.keys(AIR.Molecules).map((x) => ({[x]: 0})))
        var Types = {}
        var elementsonpaths = new Set()
        var totalpaths = 0

        for(var [e, epaths] of processedPaths)
        {
            var minlength = Number.POSITIVE_INFINITY
            var type = 0
            if(AIR.Molecules[e].ids.name == "mstn")
            {
                let afawifhwafwaf;
            }
            for (var path of epaths)
            {
                let i = 0
                let elements = path.elements
                let nettype = 1
                
                if(p != AIR.sarcopenia)
                {
                    i = elements.indexOf(p)
                    if(i < 1)
                        continue;
                    
                    elements = elements.slice(0,i)
                    nettype = (path.types.slice(i + i - 1).filter(x => x == "-")).length % 2 == 0? 1 : -1
                }
                // for(let ms of Object.values(modifiers))
                // {
                //     var occurences = (path.path.match(ms["regex"]) || []).length;
                //     ms["modifiers"].forEach(item => BetweennessValues[item] += occurences)
                // }
                totalpaths += 1

                elements.forEach(item => elementsonpaths.add(item))

                for(let eInPath of elements)
                {
                    for(var relative of Relatives[eInPath])
                        BetweennessValues[relative] += 1;
                    regulators.add(eInPath)
                }
                plen = elements.length - 1
                if(plen == minlength)
                {
                    type += path.type*nettype;
                }
                else if(plen < minlength)
                {
                    type = path.type*nettype;
                    minlength = plen
                }
            }
            if(minlength != Number.POSITIVE_INFINITY)
                Types[e] = type == 0 ? -1 : Math.sign(type)
        }
        regulators = Array.from(regulators);

        var influencevalues = {
            values: {},
            SPs: {},
            SubmapElements: regulators
        }

        for (let e of regulators) {
            if (e == p)
                continue

            var includedpaths = BetweennessValues[e]

            influencevalues.SPs[e] = minlength * Types[e];
            influencevalues.values[e] = Types[e] * (includedpaths / totalpaths + elementsonpaths.size / regulators.length)
        };

        let maxvalue = Math.max(...Object.values(influencevalues.values).map(v => Math.abs(v)));
        Object.keys(influencevalues.values).map(key => influencevalues.values[key] /= maxvalue)


        globals.pe_influenceScores[p] = {
            values: influencevalues.values,
            SPs: influencevalues.SPs
        }

        if (force) {
            AIR.Phenotypes[p].values = influencevalues.values
            AIR.Phenotypes[p].SPs = influencevalues.SPs
        }
    }
    $('body').removeClass('waiting');
    await enablebtn("air_init_btn", text);
}

async function _oldoldgetPhenotypeInfluences(force = false) {

    let text = await disablebutton("air_init_btn", true);
    let count = 0
    await updateProgress(0, 1, "air_init_btn", " Calculating Influence Scores");

    let ko_elements = perturbedElements();

    let sarco = Object.keys(AIR.Phenotypes).filter(e => AIR.Molecules[e].name == "sarcopenia (muscle)")[0]
    let allpaths;
    var re = new RegExp("(" + ko_elements.join("|") + ")(_|$)")


    if (ko_elements.length == 0 && !force) {
        for (var p in AIR.Phenotypes) {
            globals.pe_influenceScores[p] = {
                values: AIR.Phenotypes[p].values,
                SPs: AIR.Phenotypes[p].SPs
            }
        }
        await enablebtn("air_init_btn", text);
        return;
    }

    allpaths = await BFSfromTarget(sarco, [], true, false, true, "air_init_btn")
    if (ko_elements.length > 0) {
        for (var e in allpaths)
            allpaths[e] = Object.filter(allpaths[e], k => !re.test(k));
    }

    console.log(JSON.stringify(allpaths).length)

    let maxlength = Object.keys(AIR.Phenotypes).length + Object.keys(allpaths).length
    var phenotypevalues = {}
    for (var p in AIR.Phenotypes) {
        var typesum = Object.values(allpaths[p]).reduce((a, b) => a + b, 0);
        typesum = typesum != 0 ? Math.sign(typesum) : -1;
        phenotypevalues[p] = {
            type: typesum,
            paths: 0,
            elements: new Set(),
            regulators: {},
            regex: new RegExp("_" + p + "(_|$)")
        };
        for (var e in AIR.Molecules) {
            phenotypevalues[p].regulators[e] = {
                elements: new Set(),
                paths: 0,
                type: 1,
                sumtype: 0,
                min: Infinity,
            }
        }
    }
    var re = new RegExp("_")
    for (var e in allpaths) {
        if (count % 30 == 0)
            await updateProgress(count, maxlength, "air_init_btn", " Calculating Influence Scores");
        count++;
        var phenotypes = Object.keys(phenotypevalues).filter(p => p != e)
        for (var [path, value] of Object.entries(allpaths[e])) {
            let elements = path.split(re);
            if (!consistentCompartments(elements).consistent)
                continue;

            for (var p of phenotypes) {
                var i = elements.indexOf(p);
                if (i > 0) {
                    phenotypevalues[p].paths += 1;
                    phenotypevalues[p].regulators[e].sumtype += value * phenotypevalues[p].type;
                    if (i < phenotypevalues[p].regulators[e].min) {
                        phenotypevalues[p].regulators[e].min = i;
                        phenotypevalues[p].regulators[e].type = value * phenotypevalues[p].type;
                    }
                    else if (i == phenotypevalues[p].regulators[e].min) {
                        phenotypevalues[p].regulators[e].type = Math.min(phenotypevalues[p].regulators[e].type, value * phenotypevalues[p].type);
                    }

                    for (var _e of elements.slice(0, i)) {
                        phenotypevalues[p].elements.add(_e);
                        phenotypevalues[p].regulators[e].elements.add(_e);
                        phenotypevalues[p].regulators[_e].paths += 1;
                    }
                }
            }
        }
    }

    allpaths = {}

    for (let p in AIR.Phenotypes) {

        let influencevalues = {
            values: {},
            SPs: {}
        }

        await updateProgress(count++, maxlength, "air_init_btn", " Calculating Influence Scores");

        if (phenotypevalues.hasOwnProperty(p)) {
            phenotypevalues[p].regulators = Object.filter(phenotypevalues[p].regulators, k => phenotypevalues[p].regulators[k].min != Infinity)

            for (let e in phenotypevalues[p].regulators) {

                var _type = 0;

                if (AIR.Molecules[e].compartment == AIR.Molecules[p].compartment) {
                    _type = phenotypevalues[p].regulators[e].type
                }
                else {
                    _type = phenotypevalues[p].regulators[e].sumtype != 0 ? Math.sign(phenotypevalues[p].regulators[e].sumtype) : -1
                }
                var value = _type * (phenotypevalues[p].regulators[e].paths / phenotypevalues[p].paths + phenotypevalues[p].regulators[e].elements.size / phenotypevalues[p].elements.size)

                if (!value) {
                    continue;
                }
                influencevalues.SPs[e] = phenotypevalues[p].type;
                influencevalues.values[e] = value;
            };

            let maxvalue = Math.max(...Object.values(influencevalues.values).map(v => Math.abs(v)));
            Object.keys(influencevalues.values).map(key => influencevalues.values[key] /= maxvalue)
        }

        globals.pe_influenceScores[p] = {
            values: influencevalues.values,
            SPs: influencevalues.SPs
        }

        if (force) {
            AIR.Phenotypes[p].values = influencevalues.values
            AIR.Phenotypes[p].SPs = influencevalues.SPs
        }
    }

    await enablebtn("air_init_btn", text);
}

function air_createpopup(button, phenotype) {

    var $target = $('#air_chart_popover');
    var $btn = $(button);

    if ($target) {


        $('#air_clickedpopupcell').css('background-color', 'transparent');
        $('#air_clickedpopupcell').removeAttr('id');

        if ($target.siblings().is($btn)) {
            $target.remove();
            $("#air_table_pe_results").parents(".dataTables_scrollBody").css({
                minHeight: "0px",
            });
            return;
        }
        $target.remove();

    }

    $(button).attr('id', 'air_clickedpopupcell');
    $(button).css('background-color', 'lightgray');

    $target = $(`<div id="air_chart_popover" class="popover bottom in" style="width: 100%; top: 55px; z-index: 2; border: none;">
                    <div class="arrow" style="left: 9.375%;"></div>
                    <div id="air_chart_popover_content" class="popover-content" style="width: 100% !important;">
                        <button type="button" id="air_popup_close" class="air_close_tight close" data-dismiss="alert" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <div class="cbcontainer mt-1 mb-2 ml-2">
                            <input type="checkbox" class="air_checkbox" id="air_popup_showregression">
                            <label class="air_checkbox" for="air_popup_showregression">Show Confidence Intervall</label>
                        </div>
                        <div id="air_legend_target" class="d-flex justify-content-center mt-2 mb-2">
                            <li class="legendli" style="color:#6d6d6d; font-size:100%; white-space: nowrap;">
                                <span class="legendspan_small" style="background-color:#C00000"></span>
                                Activates Phenotype</li>
                            <li class="legendli" style="margin-left:5px; color:#6d6d6d; font-size:100%; white-space: nowrap;">
                                <span class="legendspan_small" style="background-color:#0070C0"></span>
                                Represses Phenotype</li>
                            <li class="legendli" style="margin-left:5px; color:#6d6d6d; font-size:100%; white-space: nowrap;">
                                <span class="triangle_small"></span>
                                External Link</li>
                        </div>
                        <div style="height: 80%">
                            <canvas class="popup_chart" id="air_popup_chart"></canvas>
                        </div>
                    </div>
                </div>`);

    
    $btn.after($target);

    let close_btn = document.getElementById("air_popup_close");
    // When the user clicks on <span> (x), close the modal
    close_btn.onclick = function () {
        $target.remove();
        $("#air_table_pe_results").parents(".dataTables_scrollBody").css({
            minHeight: "0px",
        });
    }

    let targets = []
    var dist_targets = [
        {
            label: "",
            data: [{
                x: 1,
                y: 0,
                r: 4
            }],
        },
        {
            label: "",
            data: [{
                x: -1,
                y: 0,
                r: 4
            }],
        }
    ]
    var maxx_dist = 0;
    for (let [element, data] of Object.entries(globals.pe_results[phenotype]["dces"])) {

        let SP = data[0];
        let hex = "#cccccc";
        let rad = 3;
        let FC = data[1]

        var aggr = SP * FC
        rad = 6

        if (aggr < 0) {
            hex = "#0070C0";
        }
        else if (aggr > 0) {
            hex = "#C00000"
        }
        if (Math.abs(aggr) > maxx_dist) { maxx_dist = Math.abs(aggr) }
        dist_targets.push(
            {
                label: element,
                data: [{
                    x: Math.abs(aggr) * Math.sign(FC),
                    y: Math.abs(aggr) * Math.sign(SP),
                    r: rad
                }],
                pointStyle: pstyle,
                backgroundColor: hex,
                hoverBackgroundColor: hex,
            })
        

        var pstyle = 'circle';
        if (AIR.MapSpeciesLowerCase.includes(AIR.Molecules[element].name.toLowerCase()) === false) {
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

    maxx_dist = maxx_dist < 1? 1 : maxx_dist;
    
    var m = globals.pe_results[phenotype]["slope"];
    var [std1,std2] = globals.pe_results[phenotype]["std"];
    dist_targets.push(
        {
            data: [{
                x: -maxx_dist,
                y: -maxx_dist * m,
                r: 0,
            },
            {
                x: maxx_dist,
                y: maxx_dist * m,
                r: 0,
            }],
            type: 'line',
            fill: false,
            pointRadius: 0,
            backgroundColor: m < 0 ? "#0070C0" : "#C00000",
            borderColor: m < 0 ? "#0070C0" : "#C00000",
            borderWidth: 2,
        }
    );
    dist_targets.push(
        {
            data: [{
                x: -maxx_dist,
                y: -maxx_dist * std2,
                r: 0,
            },
            {
                x: maxx_dist,
                y: maxx_dist * std2,
                r: 0,
            }],
            type: 'line',
            fill: "+1",
            pointRadius: 0,
        }
    );
    dist_targets.push(
        {
            data: [{
                x: -maxx_dist,
                y: -maxx_dist * std1,
                r: 0,
            },
            {
                x: maxx_dist,
                y: maxx_dist * std1,
                r: 0,
            }],
            type: 'line',
            fill: false,
            pointRadius: 0,
        }
    );

    var outputCanvas = document.getElementById('air_popup_chart');

    var chartOptions = {
        type: 'bubble',
        data: {
            datasets: targets,
        },
        options: {
            plugins: {
                plugins: {
                    filler: {
                        propagate: false
                    }
                },
                legend: {
                    display: false
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
                            var element = context.label || '';

                            if (element && globals.pe_results[phenotype].dces.hasOwnProperty(element)) {
                                return [
                                    'Name: ' + AIR.Molecules[element].name,
                                    'Influence: ' + expo( globals.pe_results[phenotype].dces[element][0]),
                                    'FC: ' + expo( globals.pe_results[phenotype].dces[element][1])
                                ];
                            }
                            else
                                return "";

                        }
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            onHover: (event, chartElement) => {
                event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
            },
            onClick: (event, chartElement) => {
                if (chartElement[0]) {
                    let name = AIR.Molecules[popupchart.data.datasets[chartElement[0].datasetIndex].label].name;
                    selectElementonMap(name, true);
                    air_setSelectedElement(name);
                }
            },
            layout: {
                padding: {
                    top: 0
                }
            },
            title: {
                display: true,
                text: "Regulators for '" + AIR.Phenotypes[phenotype].name,
                fontFamily: 'Helvetica',
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Influence on Phenotype'
                    },
                    max: 1,
                    min: -1,
                    grid: {
                        drawBorder: false,
                        color: function (context) {
                            if (context.tick.value == 0)
                                return '#000000';
                            else
                                return "#D3D3D3";
                        },
                    }
                },
                x:
                {
                    title: {
                        display: true,
                        text: 'Fold Change in Data'
                    },
                    ticks: {
                        //beginAtZero: false,
                    },
                    grid: {
                        drawBorder: false,
                        color: function (context) {
                            if (context.tick.value == 0)
                                return '#000000';
                            else
                                return "#D3D3D3";
                        },
                    },
                },
            }
        }

    };

    let popupchart = new Chart(outputCanvas, chartOptions);
    $target.show();

    var popupheight = $("#air_chart_popover").height() + 50;
    $("#air_resultstable").parents(".dataTables_scrollBody").css({
        minHeight: (popupheight > 400 ? 400 : popupheight) + "px",
    });


    $('#air_popup_showregression').on('click', function () {

        if (document.getElementById("air_popup_showregression").checked === true) {
            popupchart.data.datasets = dist_targets
            $("#air_legend_target").replaceWith(`
            <div id="air_legend_target" class="d-flex justify-content-center mt-2 mb-2">
                <li class="legendli" style="color:#6d6d6d; font-size:100%; white-space: nowrap;">
                    <span style="font-weight:bold; font-size: 50; color:${m < 0 ? "#0070C0" : "#C00000"}">—</span>
                    Normalized Regression</li>
                <li class="legendli" style="margin-left:5px; color:#6d6d6d; font-size:100%; white-space: nowrap;">
                    <span class="legendspan_small" style="background-color:#cccccc"></span>
                    95% Confidence Intervall (unadjusted)</li>
            </div>
            `);
        }
        else {
            popupchart.data.datasets = targets

            $("#air_legend_target").replaceWith(`            
            <div id="air_legend_target" class="d-flex justify-content-center mt-2 mb-2">
                <li class="legendli" style="color:#6d6d6d; font-size:100%; white-space: nowrap;">
                    <span class="legendspan_small" style="background-color:#C00000"></span>
                    Activates Phenotype</li>
                <li class="legendli" style="margin-left:5px; color:#6d6d6d; font-size:100%; white-space: nowrap;">
                    <span class="legendspan_small" style="background-color:#0070C0"></span>
                    Represses Phenotype</li>
                <li class="legendli" style="margin-left:5px; color:#6d6d6d; font-size:100%; white-space: nowrap;">
                    <span class="triangle_small"></span>
                    External Link</li>
            </div>`);
        }

        popupchart.update();
    })
};

function consistentCompartments(path) {
    if (path.length == 0)
        return false;

    var currentcompartment = AIR.Molecules[path[0]].compartment;
    var currentcompartment_allskips = ""
    var numberofskips = 0;
    let leftcompartments = [];
    var consistent = true

    for (var e of path) {
        var ecompartment = AIR.Molecules[e].compartment;
        if (currentcompartment_allskips != ecompartment) {
            currentcompartment_allskips = ecompartment
            numberofskips++;
        }

        if (AIR.Molecules[e].secreted) {
            continue;
        }

        if (leftcompartments.includes(ecompartment))
            consistent = false;

        if (currentcompartment != ecompartment) {
            leftcompartments.push(currentcompartment)
            currentcompartment = ecompartment;
        }
    }

    return {
        consistent: consistent,
        numberofskips: numberofskips,
    }
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

function getEnrichmentScore(points, maxfc = 0) {
    var _points = [[1, 0], [-1, 0]]
    for (var p of points)
        _points.push([Math.abs(p[0]) * p[1], p[0] * Math.abs(p[1])]);

    var slope = leastSquaresRegression(_points);
    return slope;

}

async function startloading()
{
    return new Promise(resolve => {
        setTimeout(() => {

            $("#air_plugincontainer").addClass("waiting")
            $("body").css("cursor", "progress");
            resolve('');
        }, 0);
    });
}

async function stoploading()
{
    return new Promise(resolve => {
        setTimeout(() => {

            $("#air_plugincontainer").removeClass("waiting")
            $("body").css("cursor", "default");
            resolve('');
        }, 0);
    });
}

function leastSquaresRegression(data) {
    var sum = [0, 0], _d = 0;

    for (_d of data)
    {
        sum[0] += _d[0] * _d[0]; //sumSqX
        sum[1] += _d[0] * _d[1]; //sumXY
    }

    var gradient = sum[1] / sum[0];

    return gradient;
}
