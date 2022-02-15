function AirXplore() {
    globals.xplore = {
        interactionpanel: undefined,
        targetpanel: undefined,
        centralitypanel: undefined,
        phenotypepanel: undefined,
        exportpanel: undefined,
        centralitychart: undefined,
        xp_target_downloadtext: '',
        regulationtable: undefined,
        targettable: undefined,
        phenotypetable: undefined,
        centraliytable: undefined,
        hpotable: undefined,
        targetphenotypetable: undefined,
        xp_targetchart: undefined,

        pe_element_table: undefined,
        pe_reults_table: undefined,
        pe_data: [{}],
        pe_data_index: 0,
        pe_influenceScores: {},
        pe_pathchart: undefined,
        pe_kochart: undefined,
        selected_element: "",
        centralitychartData: [],
        kochartdata: [],
        pe_results: {},
    }

    globals.xplore["container"] = document.getElementById("airxplore_tab_content")
                                                    
    $('#air_btn_clear').on('click', function () {
        highlightSelected([]);
    });
    
    let t0 = performance.now();

    $("#airomics_tab").on('shown.bs.tab', function () {

        if (globals.xplore.regulationtable)
            globals.xplore.regulationtable.columns.adjust();
        if (globals.xplore.targettable)
            globals.xplore.targettable.columns.adjust();
        if (globals.xplore.phenotypetable)
            globals.xplore.phenotypetable.columns.adjust();
        if (globals.xplore.centraliytable)
            globals.xplore.centraliytable.columns.adjust();
        if (globals.xplore.hpotable)
            globals.xplore.hpotable.columns.adjust();
        if (globals.xplore.targetphenotypetable)
            globals.xplore.targetphenotypetable.columns.adjust();
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
            var coll = globals.xplore.container.getElementsByClassName("air_collapsible")[0];
            coll.classList.toggle("active");
            var content = coll.nextElementSibling;
            content.style.maxHeight = content.scrollHeight + 1 + "px";
            globals.xplore.regulationtable.columns.adjust();
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

function Initiate() {
    return new Promise((resolve, reject) => {
        $(`
        <div id="xp_hide_container" style="display: none;">
        <button class="air_collapsible mt-4">Data Exploration</button>
            <div id="xp_panel_interaction" class="air_collapsible_content">

            </div>
        <button class="air_collapsible mt-2">Downstream Enrichment</button>
            <div id="xp_panel_phenotypes" class="air_collapsible_content">

            </div>
        <button class="air_collapsible mt-2">Upstream Enrichment</button>
            <div id="xp_panel_targets" class="air_collapsible_content">

            </div>
        <button class="air_collapsible mt-2">Data Export</button>
            <div id="xp_panel_export" class="air_collapsible_content">

            </div>

        </div>`).appendTo('#airxplore_tab_content');


        $('#xp_hide_container .collapse').collapse();

        var coll = globals.xplore.container.getElementsByClassName("air_collapsible");
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

        globals.xplore.interactionpanel = $("#xp_panel_interaction");
        globals.xplore.targetpanel = $("#xp_panel_targets");
        //globals.xplore.centralitypanel = $("#xp_panel_centrality");
        /*
        <button class="air_collapsible mt-2 mb-4">Centrality</button>
    <div id="xp_panel_centrality" class="air_collapsible_content">

    </div>
*/
        globals.xplore.exportpanel = $("#xp_panel_export");
        globals.xplore.phenotypepanel = $("#xp_panel_phenotypes");

        $('#xp_loading_text').html('Generating interaction panel ...')
        setTimeout(() => {
            getInteractionPanel().then(r => {
                $('#xp_loading_text').html('Generating Phenotype panel ...')
                setTimeout(() => {
                    getPhenotypePanel().then(s => {
                        $('#xp_loading_text').html('Generating export panel ...')
                        setTimeout(() => {
                            getExportPanel().then(r => {
                                $('#xp_loading_text').html('Generating target panel ...')
                                setTimeout(() => {
                                    getTargetPanel().then(s => {
                                        $('#xp_loading_text').html('Generating centrality panel ...')
                                        setTimeout(() => {
                                            getCentralityPanel().then(t => {
                                                $('.air_btn_info[data-toggle="popover"]').popover();
                                                resolve('');
                                            }).catch(error => {
                                                reject(error);
                                            })
                                        }, 0);
                                    }).catch(error => {
                                        reject(error);;
                                    });
                                }, 0);
                            }).catch(error => {
                                reject(error);
                            })
                        }, 0);
                    }).catch(error => {
                        reject(error);
                    });
                });
            }).catch(error => {
                reject(error);
            })
        }, 0);
    });
}

function getExportPanel() {
    return new Promise((resolve, reject) => {
        globals.xplore.exportpanel.append(`       
            <h4 class="mt-4">Raw Data:<h4>
            <div id="xp_selectsubmap-container" class="row mb-2 mt-4">
                <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right;">
                    <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Select Maps:</span>
                </div>
                <div class="col">
                    <select id="xp_selectsubmap" class="browser-default ms_select custom-select">
                        <option value="all" selected>Full MIM</option>
                        <option value="submaps">All Submaps</option>
                    </select>
                </div>
            </div>
            <div class="btn-group mt-2 mb-2" role="group">                
                <button id="xp_btn_download_datazip_csv" type="button" class="air_btn btn mr-2"><i class="fa fa-download"></i> CSV</button>
                <button id="xp_btn_download_datazip_txt" type="button" class="air_btn btn mr-2"><i class="fa fa-download"></i> TSV</button>
                <button id="xp_btn_download_datazip_json" type="button" class="air_btn btn"><i class="fa fa-download"></i> JSON (raw data)</button>
            </div>
            <h4 class="mt-2">Phenotype associated elements:<h4>
            <button id="xp_btn_download_gmt" class="air_btn btn mb-2" style="width:100%"> <i class="fa fa-download"></i> Download phenotype gene sets as GMT</button>
            <button id="xp_btn_download_json" class="air_btn btn mb-4" style="width:100%"> <i class="fa fa-download"></i> Download all phenotype regulators as JSON</button>
            <h4>Phenotype specific subnetworks:<h4>
            <select id="xp_select_export_phenotype" class="browser-default xp_select custom-select mt-2"></select>
            <div class="btn-group mt-2" role="group">
                <button id="xp_btn_download_phenotypesubnetwork_csv" class="air_btn btn mr-2" style="width:100%"> <i class="fa fa-download"></i> CSV</button>
                <button id="xp_btn_download_phenotypesubnetwork_tsv" class="air_btn btn" style="width:100%"> <i class="fa fa-download"></i> TSV</button>
            </div>
            
            </select>
        `);

        var phenotypeSelect = document.getElementById('xp_select_export_phenotype');
        var submapSelect = document.getElementById('xp_selectsubmap');
        i = 0;
        for (let phenotype in AIR.Phenotypes) {
            var p = AIR.Phenotypes[phenotype].name;

            phenotypeSelect.options[phenotypeSelect.options.length] = new Option(p, i);
            i++;
        };
        for (let modelid in globals.submaps) {
            submapSelect.options[submapSelect.options.length] = new Option(globals.submaps[modelid], modelid);
        };

        $('#xp_btn_download_json').on('click', function () {

            let output = {}
            for (let p in AIR.Phenotypes) {
                output[AIR.Molecules[p].name] = {}

                for (let e in AIR.Phenotypes[p].values) {
                    if (AIR.Phenotypes[p].values[e] == 0) {
                        continue
                    }

                    output[AIR.Molecules[p].name][AIR.Molecules[e].name] = AIR.Phenotypes[p].values[e]
                }
            }
            let downloadtext = JSON.stringify(output)
            air_download('AIR_PhenotypeRegulators.json', downloadtext)
        });

        $('#xp_btn_download_gmt').on('click', function () {

            let downloadtext = '';
            for (let p in AIR.Phenotypes) {
                downloadtext += AIR.Molecules[p].name + "\t";
                if (AIR.Molecules[p].ids.hasOwnProperty("go")) {
                    downloadtext += AIR.Molecules[p].ids["go"];
                }

                let includedids = [];
                for (let e in AIR.Phenotypes[p].values) {
                    if (AIR.Phenotypes[p].values[e] == 0) {
                        continue
                    }
                    else if (AIR.Molecules[e].subunits.length > 0) {
                        AIR.Molecules[e].subunits.forEach(function (s, index) {
                            if (AIR.Molecules[s].type == "PROTEIN" && includedids.includes(s) == false) {
                                downloadtext += "\t" + AIR.Molecules[s].name;
                                includedids.push(s);
                            }
                        });
                    }
                    else if (AIR.Molecules[e].type == "PROTEIN" && includedids.includes(e) == false) {
                        downloadtext += "\t" + AIR.Molecules[e].name;
                        includedids.push(e);
                    }
                }
                downloadtext += "\n";
            }
            if (downloadtext != "") {
                downloadtext = downloadtext.substring(0, downloadtext.length - 2);
            }
            air_download('AIR_PhenotypeGeneSets.gmt', downloadtext)
        });

        function getMapfilteredElements() {
            var selectedMap = submapSelect.options[submapSelect.selectedIndex].value;

            if (selectedMap == "all") {
                return [
                    AIR.Molecules,
                    AIR.interactions
                ]
            }

            var filteredElementIds = []

            if (selectedMap == "submaps") {
                filteredElementIds = Object.keys(AIR.Molecules).filter(e => AIR.Molecules[e].submap)
            }
            else {
                selectedMap = parseFloat(selectedMap)
                for (var e in AIR.Molecules) {
                    var lowername = AIR.Molecules[e].name.toLowerCase();
                    if (AIR.MapElements.hasOwnProperty(lowername)) {
                        for (let mapelement of AIR.MapElements[lowername])
                            if (selectedMap == mapelement._modelId) {
                                filteredElementIds.push(e)
                            }
                    }

                }
            }

            return [
                Object.filter(AIR.Molecules, e => filteredElementIds.includes(e)),
                AIR.Interactions.filter(i => filteredElementIds.includes(i["source"]) && filteredElementIds.includes(i["target"]))
            ]

        }

        $('#xp_btn_download_datazip_json').on('click', function () {

            var [elements, interactions] = getMapfilteredElements()

            var zip = new JSZip();
            zip.file("Elements.json", JSON.stringify(elements));
            zip.file("Interactions.json", JSON.stringify(interactions));
            zip.generateAsync({ type: "blob" })
                .then(function (content) {
                    FileSaver.saveAs(content, "AIR_raw.zip");
                });
        });

        $('#xp_btn_download_datazip_csv').on('click', function () {

            var [elements, interactions] = getMapfilteredElements()

            var zip = new JSZip();
            zip.file("Elements.csv", getElementContent(elements, ","));
            zip.file("Interactions.csv", getInterContent(interactions, ","));
            zip.generateAsync({ type: "blob" })
                .then(function (content) {
                    FileSaver.saveAs(content, "AIR_Data.zip");
                });
        });
        $('#xp_btn_download_datazip_txt').on('click', function () {

            var [elements, interactions] = getMapfilteredElements()

            var zip = new JSZip();
            zip.file("Elements.txt", getElementContent(elements, "\t"));
            zip.file("Interactions.txt", getInterContent(interactions, "\t"));
            zip.generateAsync({ type: "blob" })
                .then(function (content) {
                    FileSaver.saveAs(content, "AIR_Data.zip");
                });
        });

        $('#xp_btn_download_phenotypesubnetwork_csv').on('click', function () {
            phenotypeSubnetwork(",", "csv");
        });
        $('#xp_btn_download_phenotypesubnetwork_tsv').on('click', function () {
            phenotypeSubnetwork("\t", "txt");
        });

        function phenotypeSubnetwork(seperator, ending) {

            let phenotypename = phenotypeSelect.options[phenotypeSelect.selectedIndex].text;
            let phenotype = "";
            for (let p in AIR.Phenotypes) {
                if (AIR.Phenotypes[p].name == phenotypename) {
                    phenotype = p;
                    break;
                }
            }

            if (phenotype == "") {
                return;
            }

            let elementids = Object.keys(AIR.Phenotypes[phenotype].values)
            elementids.push(phenotype);
            let elements = {};
            let interactions = {};

            for (let i in AIR.Interactions) {
                if (elementids.includes(AIR.Interactions[i].source) && elementids.includes(AIR.Interactions[i].target)) {
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
            zip.generateAsync({ type: "blob" })
                .then(function (content) {
                    FileSaver.saveAs(content, "AIR_Subnetwork.zip");
                });
        }
        resolve('')
    });

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

$(document).on('change', '.xp_pe_clickCBinTable', async function () {


    var id = $(this).attr('data');

    let _data = JSON.parse(JSON.stringify(globals.xplore.pe_data[globals.xplore.pe_data_index]));


    if ($(this).prop('checked') == true) {
        _data[id].perturbed = true;
    }
    else {
        _data[id].perturbed = false;
    }

    if (JSON.stringify(globals.xplore.pe_data[globals.xplore.pe_data_index]) == JSON.stringify(_data)) {
        return;
    }

    globals.xplore.pe_data = globals.xplore.pe_data.slice(0, globals.xplore.pe_data_index + 1);
    globals.xplore.pe_data.push(_data)
    globals.xplore.pe_data_index += 1;

    $("#xp_import_redo").addClass("air_disabledbutton");
    $("#xp_import_undo").removeClass("air_disabledbutton");

    await recalculateInfluenceScores();
    await setPeTable();
    xp_EstimatePhenotypes();
    xp_updatePathgraph()
});

function xp_EstimatePhenotypes() {
    return new Promise(async function(resolve, reject) {
        await startloading()
        setTimeout(() => {
            globals.xplore.pe_results_table.clear()
            let _data = globals.xplore.pe_data[globals.xplore.pe_data_index];
            let elementsToHighlight = {};
            let elementswithFC = 0
            globals.xplore.pe_results = {};

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
            var xysum, xxsum, xy;

            for (let p in AIR.Phenotypes) {

                let phenotypeValues = globals.xplore.pe_influenceScores[p].values;

                let max_influence = 0;
                let influence = 0;
                let level = 0;
                let DCEs = {}
                let count_elements = 0;
                var regr_data = {}
                xysum = 0;
                xxsum = 2;

                for (let e in phenotypeValues) {
                    let SP = parseFloat(phenotypeValues[e]);
                    max_influence += Math.abs(SP);

                    if (_data.hasOwnProperty(e) && !_data[e].perturbed) {
                        let FC = _data[e].value;

                        if (FC != 0) {
                            DCEs[e] = [SP,FC]
                            influence += Math.abs(SP);
                            xy = SP * FC
                            level += xy;
                            xxsum += xy * xy
                            xysum += xy * Math.abs(xy) 
                        }
                    }
                }
                var score = xysum/xxsum
                let random_scores = [];
                let random_en_scores = [];


                for (let shuffled_elements of shuffled_arrays) {
                    xysum = 0;
                    xxsum = 2;

                    for (let i in FC_values) {
                        let element = shuffled_elements[i];
                        if (phenotypeValues.hasOwnProperty(element)) {
                            xy = phenotypeValues[element] * FC_values[i].value
                            xxsum += xy * xy
                            xysum += xy * Math.abs(xy) 
                        }
                    }
                    
                    random_scores.push(xysum/xxsum)
                }

                globals.xplore.pe_results[p] = {
                    id: p,
                    level: level,
                    percentage: (influence / max_influence) * 100,
                    pvalue: 1,
                    dces: regr_data,
                }


                var pvalueresults = GetpValueFromValues(score, random_scores)

                globals.xplore.pe_results[p]["pvalue"] = pvalueresults.pvalue;
                globals.xplore.pe_results[p]["std"] = [pvalueresults.posStd, pvalueresults.negStd]
                globals.xplore.pe_results[p]["slope"] = score;
                globals.xplore.pe_results[p]["dces"] = DCEs;
                globals.xplore.pe_results[p]["bins"] = pvalueresults.bins;
                globals.xplore.pe_results[p]["mean"] = [pvalueresults.posMean, pvalueresults.posMean]

                // pvalue = GetpValueFromValues(level, random_en_scores).pvalue
                // if (pvalue < globals.xplore.pe_results[p]["pvalue"])
                //     globals.xplore.pe_results[p]["pvalue"] =  pvalueresults

                if (Math.abs(level) > max_level) {
                    max_level = Math.abs(level)
                }
            }

            var m_pvalues = Object.values(globals.xplore.pe_results).map(r => r.pvalue).sort((a, b) => a - b);
            var m_phenotypevalues = {}

            for (var [p,r] of Object.entries(globals.xplore.pe_results))
            {
                m_phenotypevalues[r.id] = m_pvalues.indexOf(r.pvalue)
            }
            m_pvalues = getAdjPvalues(m_pvalues);

            for (var [p,r] of Object.entries(globals.xplore.pe_results)) {
                r.pvalue = m_pvalues[m_phenotypevalues[r.id]]
                var level = r.level / ((document.getElementById("xp_normalize_phen").checked === true && max_level != 0) ? max_level : 1);
                if (level != 0) {
                    if (level > 1)
                        level = 1;
                    else if (level < -1)
                        level = -1;
                    elementsToHighlight[AIR.Phenotypes[r.id].name] = valueToHex(level);
                }

                globals.xplore.pe_results_table.row.add(
                    [
                        '<button type="button" class="xp_pe_popup_btn air_invisiblebtn" data="' + r.id + '" style="cursor: pointer;"><a><span class="fa fa-external-link-alt"></span></a></button>',
                        getLinkIconHTML(AIR.Phenotypes[r.id].name),
                        getFontfromValue(expo(level)),
                        expo(r.pvalue),
                        expo(r.percentage)
                    ]
                )
            }

            globals.xplore.pe_results_table.columns.adjust().draw();
            adjustPanels(globals.xplore.container);
            ColorElements(elementsToHighlight);
            stoploading()            
            resolve()
        }, 0);
    });
}
$(document).on('click', '.xp_pe_popup_btn', function () {
    var phenotype = $(this).attr("data")
    var parameter = {
        "function": xp_getphenotypeValues,
        "functionparam": {
            "phenotype": phenotype,
        },
        "distribution": true,
        "slope": globals.xplore.pe_results[phenotype]["slope"],
        "std": globals.xplore.pe_results[phenotype]["std"],
        "bins": globals.xplore.pe_results[phenotype]["bins"],
        "title": "Regulators for '" + AIR.Phenotypes[phenotype].name,
        "size": 100,
        "histo": [
            {
                "title": "Distrbution-based",
                "bins": globals.xplore.pe_results[phenotype]["bins"],
                "std": globals.xplore.pe_results[phenotype]["std"],
                "value": globals.xplore.pe_results[phenotype]["slope"],
                "mean": globals.xplore.pe_results[phenotype]["mean"],
            }
        ]
    }

    air_createpopup(this, parameter);
});
function xp_getphenotypeValues(param) 
{
    var DCEs = {}

    for (let [element, data] of Object.entries(globals.xplore.pe_results[param.phenotype]["dces"])) {
        
        DCEs[element] = {
            "SP": data[0],
            "FC": data[1],
            "pvalue": "N/A",
        }
    }

    return {
        "DCEs": DCEs,
        "Baseline": [[1,0],[-1,0]],
    };
}

async function recalculateInfluenceScores() {
    await disablediv('airxplore_tab_content');
    let _data = globals.xplore.pe_data[globals.xplore.pe_data_index];
    let _perturbedElements = perturbedElements();
    globals.xplore.pe_influenceScores = {}
    if (_perturbedElements.length > 0) {
        if (!$("#xp_knockout_warning").length) {
            $("#xp_select_target_type").after(`<div class="air_alert alert alert-danger mt-2 mb-2" id="xp_knockout_warning">
                <span>Beware: At least one element is knocked out.</span>
                <button type="button" class="air_close close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>  `)
        }
    }
    else {
        $("#xp_knockout_warning").remove();
    }
    for (let p in AIR.Phenotypes) {
        globals.xplore.pe_influenceScores[p] = _perturbedElements.length > 0 ? await getPerturbedInfluences(p, _perturbedElements) : { values: AIR.Phenotypes[p].values, SPs: AIR.Phenotypes[p].SPs };
    }
    enablediv('airxplore_tab_content');
    xp_updatePhenotypeTable();
    xp_EstimatePhenotypes();
}

async function setPeTable() {
    return new Promise((resolve, reject) => {
        if (globals.xplore.pe_element_table)
            globals.xplore.pe_element_table.destroy();
        else
            return;

        $("#xp_table_pe_elements > tbody").empty()
        var tbl = document.getElementById('xp_table_pe_elements').getElementsByTagName('tbody')[0];;

        for (let e in globals.xplore.pe_data[globals.xplore.pe_data_index]) {
            var row = tbl.insertRow(tbl.rows.length);

            createCell(row, 'td', getLinkIconHTML(AIR.Molecules[e].name), 'col', '', 'right');
            let cbcell = checkBoxCell(row, 'td', "", e, 'center', "xp_pe_", _checked = globals.xplore.pe_data[globals.xplore.pe_data_index][e].perturbed);
            if (AIR.Molecules[e].submap == false) {
                cbcell.classList.add("air_disabledbutton");
            }
            createCell(row, 'td', getFontfromValue(globals.xplore.pe_data[globals.xplore.pe_data_index][e].value), 'col slidervalue', '', 'center').setAttribute('id', 'ESliderValue' + e);
            var slider = createSliderCell(row, 'td', e);
            slider.setAttribute('id', 'ESlider' + e);
            slider.setAttribute('value', globals.xplore.pe_data[globals.xplore.pe_data_index][e].value);
            slider.onchange = function () {
                let value = parseFloat(this.value);
                $("#ESliderValue" + e).html(getFontfromValue(parseFloat(value)));

                globals.xplore.pe_data_index += 1;
                globals.xplore.pe_data[globals.xplore.pe_data_index] = JSON.parse(JSON.stringify(globals.xplore.pe_data[globals.xplore.pe_data_index - 1]));

                globals.xplore.pe_data[globals.xplore.pe_data_index][e].value = value;

                globals.xplore.pe_element_table.rows($("#ESliderValue" + e).closest("tr")).invalidate().draw();
                xp_EstimatePhenotypes()
                xp_updatePathgraph()
            }

            let delete_btn = createButtonCell(row, 'td', '<i class="fas fa-trash"></i>', "center");
            delete_btn.onclick = async function () {

                globals.xplore.pe_data = globals.xplore.pe_data.slice(0, globals.xplore.pe_data_index + 1);
                let _data = JSON.parse(JSON.stringify(globals.xplore.pe_data[globals.xplore.pe_data_index]));

                let _value = _data[e].value
                delete _data[e];

                if (JSON.stringify(globals.xplore.pe_data[globals.xplore.pe_data_index]) == JSON.stringify(_data)) {
                    return;
                }

                globals.xplore.pe_data.push(_data)
                globals.xplore.pe_data_index += 1;

                $("#xp_import_redo").addClass("air_disabledbutton");
                $("#xp_import_undo").removeClass("air_disabledbutton");

                await setPeTable()

                if(_value != 0)
                    await xp_EstimatePhenotypes();
                    
                xp_updatePathgraph()
                adjustPanels(globals.xplore.container);
            };
        }

        globals.xplore.pe_element_table = $('#xp_table_pe_elements').DataTable({
            "dom": '<"top"<"left-col"B><"right-col"f>>rtip',
            "buttons": [
                {
                    text: 'Copy',
                    className: 'air_dt_btn',
                    action: function () {
                        copyContent(getDTExportString(globals.xplore.pe_element_table));
                    }
                },
                {
                    text: 'CSV',
                    className: 'air_dt_btn',
                    action: function () {
                        air_download("InSilicoPerturb_ElementsSettings_csv.txt", getDTExportString(globals.xplore.pe_element_table, seperator = ","))
                    }
                },
                {
                    text: 'TSV',
                    className: 'air_dt_btn',
                    action: function () {
                        air_download("InSilicoPerturb_ElementsSettings_tsv.txt", getDTExportString(globals.xplore.pe_element_table))
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
        $(globals.xplore.pe_element_table.table().container()).addClass('air_datatable');
        /*
        for(let btn of createdtButtons(this, download_string))
        {
            globals.xplore.pe_element_table.button().add( 0, btn);
        }*/

        adjustPanels(globals.xplore.container);
        resolve();

    });
}

async function getPhenotypePanel() {
    return new Promise((resolve, reject) => {

        for (let p in AIR.Phenotypes) {
            globals.xplore.pe_influenceScores[p] =
            {
                values: AIR.Phenotypes[p].values,
                SPs: AIR.Phenotypes[p].SPs
            }
        }
        globals.xplore.phenotypepanel.append(`


        <div class="mt-4">
            <h4 class="mb-2">Select perturbed elements:</h4>   
            <input type="text" style="width: 55%" class="textfield" id="xp_pe_element_input" placeholder="Type in elements seperated by comma"/>
            <button type="button" id="xp_pe_element_btn" style="width: 20%; font-size: 14px;" class="air_btn btn mr-1">Add Elements</button>
            <button type="button" id="xp_pe_selectedelement_btn" style="width: 20%; font-size: 14px;" class="air_btn btn mr-1" title="Add the currently selected element from the map.">Add Selected</button>
            <div class="btn-group btn-group-justified mt-4 mb-4">
                <div class="btn-group">
                    <button type="button" id="xp_import_undo" class="air_disabledbutton air_btn btn mr-1" style="font-size: 14px;"><i class="fas fa-undo"></i> Undo</button>
                </div>
                <div class="btn-group">
                    <button type="button" id="xp_import_redo" class="air_disabledbutton air_btn btn ml-1" style="font-size: 14px;"><i class="fas fa-redo"></i> Redo</button>
                </div>
            </div>
            <div class="air_table_background">
                <table id="xp_table_pe_elements" cellspacing="0" class="air_table table table-sm mt-4 mb-4" style="width:100%">
                    <thead>
                        <tr>
                            <th style="vertical-align: middle;">Element</th>
                            <th style="vertical-align: middle;">Knockout</th>
                            <th style="vertical-align: middle;">FC</th>
                            <th style="vertical-align: middle;"></th>
                            <th style="vertical-align: middle;"></th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
            </div>
            <button id="xp_pe_reset_btn" type="button" class="air_btn btn btn-block mb-4 mt-4">Reset</button>
            <h4 class="mb-4">Downstream Impact:</h4>
            <ul  id="xp_pe_tab_pane" class="air_nav_tabs nav nav-tabs mt-4" role="tablist">
                <li class="air_nav_item nav-item" style="width: 33%;">
                    <a class="air_tab air_tab_sub xp_pe_tabs active nav-link" id="xp_pe_result_pheno-tab" data-toggle="tab" href="#xp_pe_result_pheno" role="tab" aria-controls="xp_pe_result_pheno" aria-selected="true">Phenotypes</a>
                </li>
                <li class="air_nav_item nav-item" style="width: 33%;">
                    <a class="air_tab air_tab_sub nav-link xp_pe_tabs" id="xp_pe_result_element-tab" data-toggle="tab" href="#xp_pe_result_element" role="tab" aria-controls="xp_pe_result_element" aria-selected="false">Paths</a>
                </li>
                <li class="air_disabledbutton air_nav_item nav-item" style="width: 32%;">
                    <a class="air_tab air_tab_sub nav-link xp_pe_tabs" id="xp_pe_result_ko-tab" data-toggle="tab" href="#xp_pe_result_ko" role="tab" aria-controls="xp_pe_result_ko" aria-selected="false">KO Impact</a>
                </li>
            </ul>
            <div class="tab-content air_tab_content">
                <div class="tab-pane show active air_sub_tab_pane mb-2" id="xp_pe_result_pheno" role="tabpanel" aria-labelledby="xp_pe_result_pheno-tab">
                    <div class="row mt-2 mb-4">
                        <div class="col-auto">
                            <div class="wrapper">
                                <button type="button" class="air_btn_info btn btn-secondary"
                                        data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Data Type"
                                        data-content="If checked, phenotype levels will be normalized by the max absolute values.">
                                    ?
                                </button>
                            </div>
                        </div>
                        <div class="col">
                            <div class="cbcontainer">
                                <input type="checkbox" class="air_checkbox" id="xp_normalize_phen">
                                <label class="air_checkbox" for="xp_normalize_phen">Normalize Phenotypes</label>
                            </div>
                        </div>
                    </div>    

                    <div class="air_table_background">
                        <table id="xp_table_pe_results" cellspacing="0" class="air_table table table-sm mt-4 mb-4" style="width:100%">
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
                    </div>
                </div>
                <div class="tab-pane air_sub_tab_pane mb-2" id="xp_pe_result_element" role="tabpanel" aria-labelledby="xp_pe_result_element-tab">
                    <select id="xp_pe_result_path_select" class="browser-default xp_select custom-select mt-2 mb-2"></select>
                    <div class="mb-4 mt-4" style="height:300px;overflow-y:scroll; position:relative">
                        <div id="xp_pe_result_path_canvasContainer" style="height:0px">
                            <canvas id="xp_pe_result_path_chart"></canvas>
                        </div>
                    </div>
                </div>
                <div class="tab-pane air_sub_tab_pane mb-2" id="xp_pe_result_ko" role="tabpanel" aria-labelledby="xp_pe_result_ko-tab">
                    <select id="xp_pe_result_ko_select" class="browser-default xp_select custom-select mt-2 mb-2"></select>
                    <button id="xp_pe_ko_btn" type="button" class="air_btn btn btn-block mb-4 mt-2">Analyze</button>
                    <div class="mb-4 mt-4" style="height:300px;overflow-y:scroll; position:relative">
                        <div id="xp_pe_result_ko_canvasContainer" style="height:0px">
                            <canvas id="xp_pe_result_ko_chart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>`);

        var pathphenoSelect = document.getElementById('xp_pe_result_path_select');
        var kophenoSelect = document.getElementById('xp_pe_result_ko_select');
        $('#xp_pe_result_path_select').on('change', xp_updatePathgraph)
        $('#xp_pe_ko_btn').on('click', xp_updateKOgraph)


        i = 0;

        $("#xp_pe_selectedelement_btn").tooltip();
        $("#xp_pe_element_input").on('keypress', function (ev) {
            var keycode = (ev.keyCode ? ev.keyCode : ev.which);
            if (keycode == '13') {
                $("#xp_pe_element_btn").trigger("click");
            }
        });

        globals.xplore.pe_element_table = $('#xp_table_pe_elements').DataTable({
            //"scrollX": true,
            "order": [[0, "asc"]],
            "table-layout": "fixed", // ***********add this
            "word-wrap": "break-word",
        });
        $(globals.xplore.pe_element_table.table().container()).addClass('air_datatable');
        globals.xplore.pe_element_table.on('draw', function () {
            adjustPanels(globals.xplore.container);
        });

        var outputCanvas = document.getElementById('xp_pe_result_path_chart').getContext('2d');
        globals.xplore.pe_pathchart = new Chart(outputCanvas, {
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
                        display: false
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
                hover: {
                    animationDuration: 0
                },
                responsiveAnimationDuration: 0,
                indexAxis: 'y',
            }
        });

        var outputCanvas = document.getElementById('xp_pe_result_ko_chart').getContext('2d');
        globals.xplore.pe_kochart = new Chart(outputCanvas, {
            type: 'bar',
            data: {
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Changes in Centrality',
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
                                    "OG Value: " + expo(globals.xplore.kochartdata[context.dataIndex][4 + 2 * context.datasetIndex]),
                                    "KO Value: " + expo(globals.xplore.kochartdata[context.dataIndex][5 + 2 * context.datasetIndex])
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
                hover: {
                    animationDuration: 0
                },
                responsiveAnimationDuration: 0,
                indexAxis: 'y',
            }
        });

        globals.xplore.pe_results_table = $('#xp_table_pe_results').DataTable({
            "dom": '<"top"<"left-col"B><"right-col"f>>rtip',
            buttons: [
                {
                    text: 'Copy',
                    className: 'air_dt_btn',
                    action: function () {
                        copyContent(getDTExportString(globals.xplore.pe_results_table));
                    }
                },
                {
                    text: 'CSV',
                    className: 'air_dt_btn',
                    action: function () {
                        air_download("InSilicoPerturb_PhenotypeResults_csv.txt", getDTExportString(globals.xplore.pe_results_table, seperator = ","))
                    }
                },
                {
                    text: 'TSV',
                    className: 'air_dt_btn',
                    action: function () {
                        air_download("InSilicoPerturb_PhenotypeResults_tsv.txt", getDTExportString(globals.xplore.pe_results_table))
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
        $(globals.xplore.pe_results_table.table().container()).addClass('air_datatable');

        globals.xplore.pe_results_table.on('draw', function () {
            adjustPanels(globals.xplore.container);
        });


        for (let phenotype in AIR.Phenotypes) {
            var p = AIR.Phenotypes[phenotype].name;

            pathphenoSelect.options[pathphenoSelect.options.length] = new Option(p, phenotype);
            kophenoSelect.options[kophenoSelect.options.length] = new Option(p, phenotype);

            globals.xplore.pe_results_table.row.add([
                "",
                getLinkIconHTML(p),
                `<div id="xp_pe_value_${p}">0</div>`,
                1,
                `<div id="xp_pe_accuracy_${p}">0</div>`
            ])
        }
        globals.xplore.pe_results_table.columns.adjust().draw();
        globals.xplore.pe_element_table.columns.adjust().draw();

        $('#xp_normalize_phen').on('click', xp_EstimatePhenotypes)

        $('#xp_import_undo').on('click', async function () {

            if (globals.xplore.pe_data_index == 0) {
                return;
            }

            globals.xplore.pe_data_index -= 1;
            $("#xp_import_redo").removeClass("air_disabledbutton");

            if (globals.xplore.pe_data_index == 0) {
                $("#xp_import_undo").addClass("air_disabledbutton");
            }

            await recalculateInfluenceScores();
            await setPeTable()
            xp_EstimatePhenotypes();
            xp_updatePathgraph()
        })

        $('#xp_import_redo').on('click', async function () {

            if (globals.xplore.pe_data_index == (globals.xplore.pe_data.length - 1)) {
                return;
            }

            globals.xplore.pe_data_index += 1;
            $("#xp_import_undo").removeClass("air_disabledbutton");

            if (globals.xplore.pe_data_index == (globals.xplore.pe_data.length - 1)) {
                $('#xp_import_redo').addClass("air_disabledbutton");
            }

            await recalculateInfluenceScores();
            await setPeTable()
            xp_EstimatePhenotypes();
            xp_updateKOgraph()
            xp_updatePathgraph()
        })

        $('#xp_pe_selectedelement_btn').on('click', async function () {

            if (globals.xplore.selected.length > 0) {
                if (globals.xplore.selected[0].constructor.name === 'Alias') {
                    globals.xplore.pe_data = globals.xplore.pe_data.slice(0, globals.xplore.pe_data_index + 1);

                    let _data = JSON.parse(JSON.stringify(globals.xplore.pe_data[globals.xplore.pe_data_index]));
                    var tag = globals.xplore.selected[0]._other.structuralState;
                    if(tag && tag.toLowerCase() == "family")
                    {
                        tag = "";
                    }
                    let element = globals.xplore.selected[0].name+ (tag? ("_" + tag) : "")
                    
                    if (AIR.ElementNames.name.hasOwnProperty(element.toLowerCase().trim())) {
                        var m = AIR.ElementNames.name[element.toLowerCase().trim()];

                        if (!_data.hasOwnProperty(m))
                            _data[m] = {
                                "value": 0,
                                "perturbed": false
                            };
                    }

                    if (JSON.stringify(globals.xplore.pe_data[globals.xplore.pe_data_index]) == JSON.stringify(_data)) {
                        return;
                    }

                    globals.xplore.pe_data.push(_data)
                    globals.xplore.pe_data_index += 1;

                    $("#xp_import_redo").addClass("air_disabledbutton");
                    $("#xp_import_undo").removeClass("air_disabledbutton");

                    await setPeTable()
                    //await xp_EstimatePhenotypes();
                    adjustPanels(globals.xplore.container);
                }
            }

        });

        $('#xp_pe_element_btn').on('click', async function () {

            globals.xplore.pe_data = globals.xplore.pe_data.slice(0, globals.xplore.pe_data_index + 1);

            let _data = JSON.parse(JSON.stringify(globals.xplore.pe_data[globals.xplore.pe_data_index]));

            for (let element of $("#xp_pe_element_input").val().split(',')) {
                if (AIR.ElementNames.name.hasOwnProperty(element.toLowerCase().trim())) {
                    var m = AIR.ElementNames.name[element.toLowerCase().trim()];

                    if (!_data.hasOwnProperty(m))
                        _data[m] = {
                            "value": 0,
                            "perturbed": false
                        };
                }
            }

            if (JSON.stringify(globals.xplore.pe_data[globals.xplore.pe_data_index]) == JSON.stringify(_data)) {
                return;
            }

            globals.xplore.pe_data.push(_data)
            globals.xplore.pe_data_index += 1;

            $("#xp_import_redo").addClass("air_disabledbutton");
            $("#xp_import_undo").removeClass("air_disabledbutton");

            await setPeTable()
            //await xp_EstimatePhenotypes();
            adjustPanels(globals.xplore.container);
        });

        $('#xp_pe_reset_btn').on('click', () => {

            let _data = JSON.parse(JSON.stringify(globals.xplore.pe_data[globals.xplore.pe_data_index]));

            if (Object.keys(_data).length == 0) {
                return;
            }

            for (let e in _data) {
                _data[e] = {
                    "value": 0,
                    "perturbed": false
                };
            }

            globals.xplore.pe_element_table.rows().every(function () {
                var row = this.nodes().to$()
                row.find('.air_slider').val(0);
                row.find('.slidervalue')[0].innerHTML = `<font data-order="1"><b>0<b></font>`;
                row.find('.xp_pe_clickCBinTable')[0].checked = false;
            });

            globals.xplore.pe_element_table.columns.adjust().draw(false);
            globals.xplore.pe_data.push(_data)
            globals.xplore.pe_data_index += 1;

            xp_EstimatePhenotypes()
        });

        globals.xplore.targetpanel.append('<div class="mb-4"></div>');

        $('.xp_pe_tabs[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            var target = $(e.target).attr("href") // activated tab
            switch (target) {
                case "#xp_pe_result_pheno":
                    globals.xplore.pe_results_table.columns.adjust();
                    break;
            }
            adjustPanels(globals.xplore.container);
        });


        resolve('');
    });
}

function getInteractionPanel() {
    return new Promise((resolve, reject) => {
        globals.xplore.interactionpanel.append(`
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

        $("#xp_elementinput").on('input', function (e) {

            getData();
        });

        globals.xplore.interactionpanel.append(/*html*/`

        <ul class="air_nav_tabs nav nav-tabs mt-4" id="xp_interaction_tab" role="tablist">
            <li class="air_nav_item nav-item" style="width: 20%;">
                <a class="air_tab air_tab_sub xp_inter_tabs active nav-link" id="xp_tab_inter_regulation" data-toggle="tab" href="#xp_tabcontent_inter_regulation" role="tab" aria-controls="xp_tabcontent_inter_regulation" aria-selected="true">Regulators</a>
            </li>
            <li class="air_nav_item nav-item" style="width: 20%;">
                <a class="air_tab air_tab_sub xp_inter_tabs nav-link" id="xp_tab_inter_target" data-toggle="tab" href="#xp_tabcontent_inter_target" role="tab" aria-controls="xp_tabcontent_inter_target" aria-selected="false">Targets</a>
            </li>
            <li class="air_nav_item nav-item" style="width: 20%;">
                <a class="air_tab air_tab_sub xp_inter_tabs nav-link" id="xp_tab_inter_phenotype" data-toggle="tab" href="#xp_tabcontent_inter_phenotype" role="tab" aria-controls="xp_tabcontent_inter_phenotype" aria-selected="false">Phenotypes</a>
            </li>
            <li class="air_nav_item nav-item" style="width: 20%;">
                <a class="air_tab air_tab_sub xp_inter_tabs nav-link" id="xp_tab_inter_hpo" data-toggle="tab" href="#xp_tabcontent_inter_hpo" role="tab" aria-controls="xp_tabcontent_inter_hpo" aria-selected="false">HPO</a>
            </li>
            <li class="air_nav_item nav-item" style="width: 20%;">
                <a class="air_tab air_tab_sub xp_inter_tabs nav-link" id="xp_tab_inter_sequence" data-toggle="tab" href="#xp_tabcontent_inter_sequence" role="tab" aria-controls="xp_tabcontent_inter_sequence" aria-selected="false">Sequence</a>
            </li>
        </ul>
        <div class="tab-content air_tab_content" id="xp_tab">
            <div class="tab-pane air_sub_tab_pane show active" id="xp_tabcontent_inter_regulation" role="tabpanel" aria-labelledby="xp_tab_inter_regulation">
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
            <div class="tab-pane air_sub_tab_pane" id="xp_tabcontent_inter_target" role="tabpanel" aria-labelledby="xp_tab_inter_target">
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
            <div class="tab-pane air_sub_tab_pane" id="xp_tabcontent_inter_phenotype" role="tabpanel" aria-labelledby="xp_tab_inter_phenotype">
                <table style="width:100%" class="air_table table nowrap table-sm" id="xp_table_inter_phenotype" cellspacing="0">
                    <thead>
                        <tr>
                            <th style="vertical-align: middle;"></th>
                            <th style="vertical-align: middle;">Regulation</th>
                            <th style="vertical-align: middle;">Distance</th>
                            <th style="vertical-align: middle;">Phenotype</th>
                        </tr>
                    </thead>
                </table>
            </div>
            <div class="tab-pane air_sub_tab_pane" id="xp_tabcontent_inter_hpo" role="tabpanel" aria-labelledby="xp_tab_inter_hpo">
                <select id="xp_select_interaction_hpo" class="browser-default xp_select custom-select mb-4">
                    <option value="0" selected>All</option>
                    <option value="1">Phenotype</option>
                    <option value="2">Disease</option>
                </select>
                <table style="width:100%" class="air_table table nowrap table-sm" id="xp_table_inter_hpo" cellspacing="0">
                    <thead>
                        <tr>
                            <th style="vertical-align: middle;">ID</th>
                            <th style="vertical-align: middle;">Name</th>
                            <th style="vertical-align: middle;">Type</th>
                            <th style="vertical-align: middle;">Description</th>
                        </tr>
                    </thead>
                </table>
            </div>
            <div class="tab-pane air_sub_tab_pane" id="xp_tabcontent_inter_sequence" role="tabpanel" aria-labelledby="xp_tab_inter_sequence">
                <div id="xp_molart">No information available.</div>
            </div>
        </div>

        `);

        globals.xplore.regulationtable = $('#xp_table_inter_regulation').DataTable({
            "dom": '<"top"<"left-col"B><"right-col"f>>rtip',
            "buttons": [
                {
                    text: 'Copy',
                    className: 'air_dt_btn',
                    action: function () {
                        copyContent(getDTExportString(globals.xplore.regulationtable));
                    }
                },
                {
                    text: 'CSV',
                    className: 'air_dt_btn',
                    action: function () {
                        air_download("InSilicoPerturb_ElementsSettings_csv.txt", getDTExportString(globals.xplore.regulationtable, seperator = ","))
                    }
                },
                {
                    text: 'TSV',
                    className: 'air_dt_btn',
                    action: function () {
                        air_download("InSilicoPerturb_ElementsSettings_tsv.txt", getDTExportString(globals.xplore.regulationtable))
                    }
                }
            ],
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
        })

        globals.xplore.targettable = $('#xp_table_inter_target').DataTable({
            "dom": '<"top"<"left-col"B><"right-col"f>>rtip',
            "buttons": [
                {
                    text: 'Copy',
                    className: 'air_dt_btn',
                    action: function () {
                        copyContent(getDTExportString(globals.xplore.targettable));
                    }
                },
                {
                    text: 'CSV',
                    className: 'air_dt_btn',
                    action: function () {
                        air_download("InSilicoPerturb_ElementsSettings_csv.txt", getDTExportString(globals.xplore.targettable, seperator = ","))
                    }
                },
                {
                    text: 'TSV',
                    className: 'air_dt_btn',
                    action: function () {
                        air_download("InSilicoPerturb_ElementsSettings_tsv.txt", getDTExportString(globals.xplore.targettable))
                    }
                }
            ],
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
        })

        globals.xplore.hpotable = $('#xp_table_inter_hpo').DataTable({
            "dom": '<"top"<"left-col"B><"right-col"f>>rtip',
            "buttons": [
                {
                    text: 'Copy',
                    className: 'air_dt_btn',
                    action: function () {
                        copyContent(getDTExportString(globals.xplore.hpotable));
                    }
                },
                {
                    text: 'CSV',
                    className: 'air_dt_btn',
                    action: function () {
                        air_download("InSilicoPerturb_ElementsSettings_csv.txt", getDTExportString(globals.xplore.hpotable, seperator = ","))
                    }
                },
                {
                    text: 'TSV',
                    className: 'air_dt_btn',
                    action: function () {
                        air_download("InSilicoPerturb_ElementsSettings_tsv.txt", getDTExportString(globals.xplore.hpotable))
                    }
                }
            ],
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
                    className: 'dt-left'
                },
                {
                    targets: 2,
                    className: 'dt-center'
                }
            ]
        })

        globals.xplore.phenotypetable = $('#xp_table_inter_phenotype').DataTable({
            "dom": '<"top"<"left-col"B><"right-col"f>>rtip',
            "buttons": [
                {
                    text: 'Copy',
                    className: 'air_dt_btn',
                    action: function () {
                        copyContent(getDTExportString(globals.xplore.phenotypetable));
                    }
                },
                {
                    text: 'CSV',
                    className: 'air_dt_btn',
                    action: function () {
                        air_download("InSilicoPerturb_ElementsSettings_csv.txt", getDTExportString(globals.xplore.phenotypetable, seperator = ","))
                    }
                },
                {
                    text: 'TSV',
                    className: 'air_dt_btn',
                    action: function () {
                        air_download("InSilicoPerturb_ElementsSettings_tsv.txt", getDTExportString(globals.xplore.phenotypetable))
                    }
                }
            ],
            scrollX: true,
            autoWidth: true,
            columns: [
                { "width": "10%" },
                { "width": "22%" },
                { "width": "22%" },
                null,
            ],
            "order": [[3, "asc"]],
            columnDefs: [
                {
                    targets: 0,
                    className: 'dt-center'
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
                    className: 'dt-left'
                }
            ]
        })

        $('.xp_inter_tabs[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            var target = $(e.target).attr("href") // activated tab
            switch (target) {
                case "#xp_tabcontent_inter_regulation":
                    globals.xplore.regulationtable.columns.adjust();
                    break;
                case "#xp_tabcontent_inter_target":
                    globals.xplore.targettable.columns.adjust();
                    break;
                case "#xp_tabcontent_inter_phenotype":
                    globals.xplore.phenotypetable.columns.adjust();
                    break;
            }
            adjustPanels(globals.xplore.container);
        });


        $("#xp_select_interaction_type").on("change", function () {
            getData(onlyRegulators = true, onlyHPO = false);
        });

        $("#xp_select_interaction_hpo").on("change", function () {
            getData(onlyRegulators = false, onlyHPO = true);
        });

        globals.xplore.regulationtable.columns.adjust().draw();
        globals.xplore.targettable.columns.adjust().draw();
        globals.xplore.phenotypetable.columns.adjust().draw();
        globals.xplore.hpotable.columns.adjust().draw();

        resolve('')
    });

}

function getTargetPanel() {
    return new Promise((resolve, reject) => {

        globals.xplore.targetpanel.append('<h4 class="mt-4 mb-4">Select phenotype levels:</h4>');

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
                XP_PredictTargets();
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

        globals.xplore.targetpanel.append(_div);

        globals.xplore.targetphenotypetable = $('#xp_table_target_phenotype').DataTable({
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
        $(globals.xplore.targetphenotypetable.table().container()).addClass('air_datatable');

        globals.xplore.targetphenotypetable.on('click', 'a', function () {
            selectElementonMap(this.innerHTML, false);
        });

        globals.xplore.targetpanel.append(
        /*html*/`
            <button type="button" class="btn-reset air_btn btn btn-block mb-2 mt-4">Reset</button>
            
            <hr>
            <h4 class="mt-4 mb-4">Identified targets:</h4>
            <select id="xp_select_target_type" class="browser-default xp_select custom-select mb-2 mt-2">
                <option value="0" selected>All Elements</option>
                <option value="1">Proteins</option>
                <option value="2">miRNAs</option>
                <option value="3">lncRNAs</option>
                <option value="4">Transcription Factors</option>
            </select>

        `);
        $(".dropdown-toggle").dropdown();

        $('#xp_select_target_type').change(function () {
            XP_PredictTargets();
        });

        globals.xplore.targetpanel.find('.btn-reset').on('click', () => {

            globals.xplore.targetphenotypetable.rows().every(function () {
                var row = this.nodes().to$()
                row.find('.air_slider').val(0);
                row.find('.slidervalue')[0].innerHTML = `<font data-order="1"><b>0<b></font>`;
            });

            globals.xplore.targetphenotypetable.draw(false);

            for (let p in AIR.Phenotypes) {
                AIR.Phenotypes[p].value = 0;
            }

            globals.xplore.xp_targetchart.data.datasets = [];
            globals.xplore.xp_targetchart.update();
        });

        globals.xplore.targetpanel.append('<canvas id="xp_chart_target"></canvas>');
        globals.xplore.targetpanel.append(/*html*/`
            <div class="d-flex justify-content-center mt-2">
                    <li class="legendli" style="color:#6d6d6d; font-size:90%;"><span class="legendspan" style="background-color:#C00000"></span>positive Targets</li>
                    <li class="legendli" style="margin-left:20px; color:#6d6d6d; font-size:90%;"><span class="legendspan" style="background-color:#0070C0"></span>negative Targets</li>
                    <li class="legendli" style="margin-left:16px; color:#6d6d6d; font-size:90%;"><span class="triangle"></span>External Link</li>
            </div>
            <div class="btn-group btn-group-justified">
                <div class="btn-group">
                    <button id="xp_btn_download_target" class="om_btn_download btn mt-4" style="width:100%"> <i class="fa fa-download"></i> as .txt</button>
                </div>
                <div class="btn-group">
                    <button id="xp_btn_download_chart" class="om_btn_download btn mt-4" style="width:100%"> <i class="fa fa-download"></i> as .png</button>
                </div>
            </div>
            `);

        $('#xp_btn_download_target').on('click', function () {
            air_download('PredictedPhenotypeRegulators.txt', globals.xplore.xp_target_downloadtext)
        });
        $('#xp_btn_download_chart').on('click', function () {
            var a = document.createElement('a');
            a.href = globals.xplore.xp_targetchart.toBase64Image();
            a.download = 'AIR_predictedTargets.png';

            // Trigger the download
            a.click();

            a.remove();
        });

        var outputCanvas = document.getElementById('xp_chart_target').getContext('2d');
        globals.xplore.xp_targetchart = new Chart(outputCanvas, {
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
                        let name = globals.xplore.xp_targetchart.data.datasets[chartElement[0].datasetIndex].label;
                        selectElementonMap(name, true);
                        xp_setSelectedElement(name);
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

function getCentralityPanel() {
    return new Promise((resolve, reject) => {
        resolve();
        return;
        globals.xplore.centralitypanel.append(`
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
            let tooltip = "";
            if (headerText == "Betweenness")
                tooltip = "Betweenness was calculated using all paths from every element to the sleected phenotype.";
            else if (headerText == "Closeness")
                tooltip = "Closeness was calculated for each phenotype-specific subnetwork individually.";
            else if (headerText == "Degree")
                tooltip = "Degree was calculated for all the data available in the MIM.";
            else if (headerText == "Indegree")
                tooltip = "Indegree was calculated for all the data available in the MIM.";
            else if (headerText == "Outdegree")
                tooltip = "Outdegree was calculated for all dathe data availableta in the MIM.";

            if (tooltip != "")
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

        globals.xplore.centralitypanel.append(html);

        globals.xplore.centraliytable = $('#xp_table_centrality').DataTable({
            scrollX: true,
            autoWidth: true,
            columnDefs: columns,
            initComplete: function (settings) {
                $('#xp_table_centrality thead th').each(function () {
                    $(this).tooltip();
                });

                /* Apply the tooltips */

            }
        });

        $(".dropdown-toggle").dropdown();


        globals.xplore.centralitypanel.append(`
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

        globals.xplore.centralitypanel.append(/*html*/`
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
        for (let phenotype in AIR.Phenotypes) {
            var p = AIR.Phenotypes[phenotype].name;

            phenotypeSelect.options[phenotypeSelect.options.length] = new Option(p, i);
            xphenotypeSelect.options[xphenotypeSelect.options.length] = new Option(p, i);
            yphenotypeSelect.options[yphenotypeSelect.options.length] = new Option(p, i);
            i++;
        };

        i = 0;
        centralities.forEach(p => {

            xcentralitySelect.options[xcentralitySelect.options.length] = new Option(p, i);
            ycentralitySelect.options[ycentralitySelect.options.length] = new Option(p, i);
            i++;
        });

        createCentralityTable(AIR.ElementNames.name[phenotypeSelect.options[0].text]);

        $('#xp_select_centrality_phenotype').on('change', function () {
            createCentralityTable(AIR.ElementNames.name[phenotypeSelect.options[phenotypeSelect.selectedIndex].text]);
        });

        var outputCanvas = document.getElementById('xp_chart_centrality').getContext('2d');
        globals.xplore.centralitychart = new Chart(outputCanvas, {
            type: 'bubble',
            data: {
                datasets: []
            },
            options: {
                hover: {
                    onHover: function (e) {
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
            var activePoint = globals.xplore.centralitychart.lastActive[0]; //.getElementsAtEvent(evt)[0];

            if (activePoint !== undefined) {

                let name = globals.xplore.centralitychart.data.datasets[activePoint._datasetIndex].label;
                selectElementonMap(name, true);
                xp_setSelectedElement(name);
            }

            // Calling update now animates element from oldValue to newValue.
        };

        globals.xplore.centralitypanel.append('<div class="mb-4"></div>');



        $('#xp_select_centrality_x_centrality').on('change', function () {
            createCentralityGraph();
        });
        $('#xp_select_centrality_x_phenotype').on('change', function () {
            createCentralityGraph();
        });
        $('#xp_select_centrality_y_centrality').on('change', function () {
            createCentralityGraph();
        });
        $('#xp_select_centrality_y_phenotype').on('change', function () {
            createCentralityGraph();
        });
        $('#xp_select_centrality_type').on('change', function () {
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

            globals.xplore.centralitychart.options.scales.xAxes[0].scaleLabel.labelString = "'" + xphenotype + "' " + xcentrality;
            globals.xplore.centralitychart.options.scales.yAxes[0].scaleLabel.labelString = "'" + yphenotype + "' " + ycentrality;

            for (let e in AIR.Molecules) {
                let { name: _name, type: _type } = AIR.Molecules[e];

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

                if (AIR.Centrality.hasOwnProperty(xcentrality) && AIR.Centrality[xcentrality].hasOwnProperty(e) && AIR.Centrality[xcentrality][e].hasOwnProperty(xphenotype)) {
                    x = AIR.Centrality[xcentrality][e][xphenotype];
                }
                if (AIR.Centrality.hasOwnProperty(ycentrality) && AIR.Centrality[ycentrality].hasOwnProperty(e) && AIR.Centrality[ycentrality][e].hasOwnProperty(yphenotype)) {
                    y = AIR.Centrality[ycentrality][e][yphenotype];
                }


                if (y != 0 || x != 0) {

                    var pstyle = 'circle';
                    if (AIR.MapSpeciesLowerCase.includes(_name.toLowerCase()) === false) {
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

            globals.xplore.centralitychart.data.datasets = targets;
            globals.xplore.centralitychart.update();
            let t1 = performance.now();
            console.log("Centrality Graph took " + (t1 - t0) + " milliseconds.")
        }

        resolve('');
    });
}

function xp_setSelectedElement(name) {
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
                    if (entry[1] == "reviewed" && (entry[2].toLowerCase() == element.toLowerCase() || entry[2].substr(0, entry[2].indexOf(' ')).toLowerCase() == element.toLowerCase())) {
                        if (pdb) {
                            if (entry[3].includes(';')) {
                                resolve(entry[3].substr(0, entry[3].indexOf(';')).toLowerCase());
                            }
                            else {
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

                if (response.hasOwnProperty("PC_Substances")) {
                    for (let c in response.PC_Substances) {
                        if (chebiid != "" && checkNested(response.PC_Substances[c], "source", "db")) {
                            if (response.PC_Substances[c].source.db.hasOwnProperty("name") && response.PC_Substances[c].source.db.name == "ChEBI") {
                                if (chebiid != "" && checkNested(response.PC_Substances[c].source.db, "source_id", "str")) {
                                    if (chebiid == response.PC_Substances[c].source.db.source_id.str) {
                                        resolve(getCID(c));
                                    }
                                }
                            }

                        }
                        else if (chebiid == "") {
                            resolve(getCID(c));
                        }
                    }
                }

                async function getCID(c) {
                    if (response.PC_Substances[c].hasOwnProperty("compound")) {
                        for (let i in response.PC_Substances[c].compound) {
                            if (checkNested(response.PC_Substances[c].compound[i], "id", "id", "cid")) {
                                let id = response.PC_Substances[c].compound[i].id.id.cid;

                                return await requestPubChem(id)
                            }
                        }
                    }
                    return '';
                }

                async function requestPubChem(id) {
                    return new Promise((resolve) => {
                        $.ajax({
                            url: "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/" + id + "/SDF?record_type=3d",
                            error: function (XMLHttpRequest, textStatus, errorThrown) {
                                resolve('');
                            },
                            success: function (data) {
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

async function getHPO(element) {
    return new Promise((resolve, reject) => {

        if (AIR.Molecules.hasOwnProperty(element) && AIR.Molecules[element].ids.hasOwnProperty("ncbigene")) {
            $.ajax({
                url: 'https://hpo.jax.org/api/hpo/gene/' + AIR.Molecules[element].ids.ncbigene,
                success: function (content) {
                    resolve(content);
                },
                error: function (content) {
                    resolve({});
                },
                timeout: 500
                // statusCode:
                // {
                //     404: function () {
                //         resolve({});
                //     }
                // }
            });
        }
        else {
            resolve({});
        }

    });
}

async function getData(onlyRegulators = false, onlyHPO = false) {

    let elementname = $("#xp_elementinput").val().toLowerCase();

    if (onlyHPO == false) {
        $('#xp_dl').hide();
        $('#xp_value_type').html("");
        $("#xp_molart").replaceWith('<div id="xp_molart" class="xp_molartContainer">No information available.</div>');
        $("#xp_molartimg_modal").replaceWith('<div id="xp_molartimg_modal"></div>');
        globals.xplore.regulationtable.clear().draw();
        globals.xplore.targettable.clear().draw();
        globals.xplore.phenotypetable.clear().draw();
        globals.xplore.hpotable.clear().draw();
        globals.xplore.hpotable.columns.adjust().draw();
        globals.xplore.selected_element = "";
    }

    if (elementname.trim() != "") {
        let elementid = null;

        for (let element in AIR.Molecules) {
            if (AIR.Molecules[element].name.toLowerCase() === elementname) {
                elementid = element;
                break;
            }
        }
        if (elementid == null) {
            globals.xplore.regulationtable.columns.adjust().draw();
            globals.xplore.targettable.columns.adjust().draw();

            adjustPanels(globals.xplore.container);
            return
        }

        let elementtype = getElementType(elementname)
        if (elementtype) {
            switch (elementtype) {
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
            if (onlyRegulators === false && onlyHPO == false) {
                $('#xp_dl').show();
                $('#xp_value_type').html(elementtype);
            }
        }
        else {
            $('#xp_dl').hide();
            $('#xp_value_type').html("");
        }
        if (onlyRegulators === false && onlyHPO == false) {
            $("#xp_molart").replaceWith('<div id="xp_molart" class="xp_molartContainer">No information available.</div>');
            $("#xp_molartimg_modal").replaceWith('<div id="xp_molartimg_modal"></div>');

            let resizeObserver = new ResizeObserver(() => {
                adjustPanels(globals.xplore.container);
            });
            resizeObserver.observe($("#xp_molart")[0]);
            resizeObserver.observe($("#xp_molartimg_modal")[0]);
        }

        globals.xplore.selected_element = elementid;



        if (globals.xplore.pe_influenceScores.hasOwnProperty(elementid)) {
            elementsToHighlight = {}
            for (let e in globals.xplore.pe_influenceScores[elementid].values) {
                elementsToHighlight[AIR.Molecules[e].name] = valueToHex(globals.xplore.pe_influenceScores[elementid].values[e]);
            }
            for (let e of perturbedElements()) {
                elementsToHighlight[AIR.Molecules[e].name] = "#a9a9a9"
            }
            ColorElements(elementsToHighlight);
        }
        if (onlyHPO == false) {
            globals.xplore.regulationtable.clear();
            if (onlyRegulators === false) {
                globals.xplore.targettable.clear();
                await xp_updatePhenotypeTable();
            }
            for (let s of AIR.Molecules[elementid].subunits) {
                globals.xplore.regulationtable.row.add([
                    getLinkIconHTML(AIR.Molecules[s].name),
                    "Subunit",
                    AIR.Molecules[s].subtype,
                    ""
                ])
            }

            for (let inter in AIR.Interactions) {
                let { source: _source, target: _target, typeString: _typestring, type: _type, pubmed: _pubmed } = AIR.Interactions[inter];

                if (AIR.Molecules.hasOwnProperty(_source) == false || AIR.Molecules.hasOwnProperty(_target) == false) {
                    continue;
                }
                if (_target == elementid) {
                    let { subtype: _sourcetype, name: _sourcename, ids: _sourceids } = AIR.Molecules[_source];
                    let typevalue = $("#xp_select_interaction_type").val();
                    switch (typevalue) {
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

                    globals.xplore.downloadtext = "";

                    var result_row = [];

                    result_row.push(getLinkIconHTML(_sourcename));

                    var typehtml = '<font color="green">activation</font>';
                    if (_type == -1) {
                        typehtml = '<font color="red">inhibition</font>';
                    }
                    else if (_type == 0) {
                        typehtml = _typestring;
                    }


                    result_row.push(typehtml);

                    result_row.push(_sourcetype);

                    var pubmedstring = "";
                    _pubmed.forEach(p => {
                        p = p.trim();
                        var ptext = p.replace('pubmed:', '');

                        if (isNaN(ptext)) {
                            return;
                        }

                        if (p.includes(":") === false) {
                            p = "pubmed:" + p;
                        }
                        var ptext = p.replace('pubmed:', '');
                        pubmedstring += `<a target="_blank" href="https://identifiers.org/${p}">${ptext}</a>, `;
                    });

                    result_row.push(pubmedstring.substr(0, pubmedstring.length - 2));
                    globals.xplore.regulationtable.row.add(result_row)
                }

                if (_source == elementid && onlyRegulators === false) {

                    let { type: _targettype, name: _targetname, ids: _targetids } = AIR.Molecules[_target];

                    var result_row = [];

                    result_row.push(getLinkIconHTML(_targetname));

                    var typehtml = '<font color="green">activation</font>';
                    if (_type == -1) {
                        typehtml = '<font color="red">inhibition</font>';
                    }
                    else if (_type == 0) {
                        typehtml = _typestring;
                    }

                    result_row.push(_targettype);

                    result_row.push(typehtml);

                    var pubmedstring = "";
                    _pubmed.forEach(p => {
                        p = p.trim();
                        var ptext = p.replace('pubmed:', '');

                        if (isNaN(ptext)) {
                            return;
                        }
                        if (p.includes(":") === false) {
                            p = "pubmed:" + p;
                        }

                        pubmedstring += `<a target="_blank" href="https://identifiers.org/${p}">${ptext}</a>, `;
                    });

                    result_row.push(pubmedstring.substr(0, pubmedstring.length - 2));
                    globals.xplore.targettable.row.add(result_row)
                }


            }
        }
        globals.xplore.regulationtable.columns.adjust().draw();
        globals.xplore.targettable.columns.adjust().draw();
        if (onlyRegulators === false && ENABLE_API_CALLS == true) {

            globals.xplore.hpotable.clear();
            try {
                let response = await getHPO(elementid)
                let typevalue = $("#xp_select_interaction_hpo").val();
                if (response.hasOwnProperty("termAssoc") && typevalue != 2) {
                    for (let term in response["termAssoc"]) {
                        var result_row = [];

                        result_row.push(`<a target="_blank" href="https://hpo.jax.org/app/browse/term/${response["termAssoc"][term].ontologyId}">${response["termAssoc"][term].ontologyId}</a>`);

                        result_row.push(response["termAssoc"][term].name);

                        result_row.push("Phenotype");

                        result_row.push(response["termAssoc"][term].definition);

                        globals.xplore.hpotable.row.add(result_row)
                    }
                }
                if (response.hasOwnProperty("diseaseAssoc") && typevalue != 1) {
                    for (let term in response["diseaseAssoc"]) {
                        var result_row = [];

                        result_row.push(`<a target="_blank" href="https://hpo.jax.org/app/browse/disease/${response["diseaseAssoc"][term].diseaseId}">${response["diseaseAssoc"][term].diseaseId}</a>`);

                        result_row.push(response["diseaseAssoc"][term].diseaseName);

                        result_row.push("Disease");

                        result_row.push("");

                        globals.xplore.hpotable.row.add(result_row)
                    }
                }
            } catch (error) {

            }

            globals.xplore.hpotable.columns.adjust().draw();
        }


        if (onlyRegulators === false && onlyHPO == false) {
            setTimeout(async function () {
                if (ENABLE_API_CALLS == false) {
                    return;
                }

                if (elementid == null || isProtein(elementid)) {

                    let uniportID = await getUniprotID(elementname);

                    if (uniportID != "") {
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
                        catch (err) {
                            console.log(err.message);
                        }

                    }
                }

            }, 0);

            setTimeout(async function () {

                if (ENABLE_API_CALLS == false) {
                    return;
                }

                let idstring = '';
                if (elementid != null) {
                    if (isProtein(elementid)) {
                        let id = await getUniprotID(elementname, true);
                        if (id != '')
                            idstring = "pdb='" + id + "'";
                    }
                    else if (AIR.Molecules[elementid].ids.hasOwnProperty("chebi")) {
                        let id = await getPubChemID(elementname, AIR.Molecules[elementid].ids.chebi)
                        if (id != '')
                            idstring = "cid='" + id + "'";
                    }
                }

                if (idstring != "") {
                    $('#xp_value_type').html(elementtype + ' (<a href="#" id="xp_img_link">view structure</a>)');

                    document.getElementById("xp_img_link").onclick = async function () {

                        var $temp = $;
                        var jQuerytemp = jQuery;
                        var tag = document.createElement('script');
                        tag.src = "https://3Dmol.csb.pitt.edu/build/3Dmol-min.js";
                        tag.setAttribute('asnyc', '');

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
                        span.onclick = function () {
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

    adjustPanels(globals.xplore.container);

}

$(document).on('click', '.air_elementlink', function () {
    selectElementonMap($(this).html(), false);
});
$(document).on('click', '.air_phenotypepath', function (event) {
    
    let data = $(this).attr("data");
    let clicked = $(this).attr("data").endsWith("_clicked")
    globals.xplore.phenotypetable.rows().every(function (rowIdx, tableLoop, rowLoop) {
        var rowNode = this.node();
        $(rowNode).find(".air_phenotypepath").each(function () {

            if($(this).attr("data") == data)
            {
                if(clicked)
                {
                    $(this).attr("data", $(this).attr("data").replace("_clicked", ""));
                    $(this).html('<span class="fas fa-eye"></span>')
                }
                else
                {
              
                    data = data.split("_");
                    $(this).attr("data", $(this).attr("data") + "_clicked");
                    //$(this).removeClass("fa-eye")
                    //$(this).addClass("fa-eye-slash")
                    $(this).html('<span class="fas fa-eye-slash"></span>')

                }
            }
            else
            {
                $(this).attr("data", $(this).attr("data").replace("_clicked", ""));
                $(this).html('<span class="fas fa-eye"></span>')
            }
        });
        //this.invalidate();
    });

    if(clicked)
    {
        highlightSelected([])
    }
    else
    {
        let _perturbedElements = perturbedElements();
        findPhenotypePath(data[0], data[1], _perturbedElements);
    }
    globals.xplore.phenotypetable.draw(false);
});

async function xp_updatePhenotypeTable() {
    return new Promise((resolve, reject) => {

        let elementid = globals.xplore.selected_element;
        globals.xplore.phenotypetable.clear();

        if (!elementid) {
            resolve();
            return;
        }

        for (let p in globals.xplore.pe_influenceScores) {
            if (globals.xplore.pe_influenceScores[p].SPs.hasOwnProperty(elementid) == false) {
                continue;
            }
            var result_row = AIR.Phenotypes[p].SubmapElements.includes(elementid)? ['<a href="#" class="air_phenotypepath" data="' + elementid + "_" + p + '"><span class="fas fa-eye"></span></a>'] : [""];
            var pname = AIR.Molecules[p].name;

            var SP = globals.xplore.pe_influenceScores[p].SPs[elementid];

            if (SP === 0) {
                continue;
            }

            var type = "";
            if (SP < 0) {
                type = '<font color="red">inhibition</font>';
            }
            if (SP > 0) {
                type = '<font color="blue">activation</font>';
            }

            result_row.push(type);

            result_row.push(Math.abs(SP));

            result_row.push(getLinkIconHTML(pname));
            globals.xplore.phenotypetable.row.add(result_row)
        }
        globals.xplore.phenotypetable.columns.adjust().draw();
        resolve();

    });


}

function perturbedElements() {
    return Object.keys(globals.xplore.pe_data[globals.xplore.pe_data_index]).filter(e => globals.xplore.pe_data[globals.xplore.pe_data_index][e].perturbed == true);
}
function isProtein(elementid) {
    if (elementid == null) {
        return false;
    }
    else if (AIR.Molecules[elementid].type == "PROTEIN" || AIR.Molecules[elementid].subtype == "TF" || AIR.Molecules[elementid].subtype == "miRNA" || AIR.Molecules[elementid].subtype == "lncRNA") {
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
    globals.xplore.xp_target_downloadtext = `Filter: ${filter}\n\nSelected phenotype values:`;

    for (let p in AIR.Phenotypes) {

        globals.xplore.xp_target_downloadtext += `\n${AIR.Phenotypes[p].name}\t${AIR.Phenotypes[p].value}`;
    }
    globals.xplore.xp_target_downloadtext += '\n\nElement\tSpecificity\tSensitivity\tType';

    for (let e in AIR.Molecules) {

        let { name: _name, subtype: _type } = AIR.Molecules[e];

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

        for (let p in globals.xplore.pe_influenceScores) {

            let value = AIR.Phenotypes[p].value;

            let SP = 0;
            if (globals.xplore.pe_influenceScores[p].values.hasOwnProperty(e) == true) {
                SP = globals.xplore.pe_influenceScores[p].values[e];
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
        globals.xplore.xp_target_downloadtext += `\n${_name}\t${specificity}\t${sensitivity}\t${regType}`;
    }

    Promise.all(promises).finally(r => {
        globals.xplore.xp_targetchart.data.datasets = targets;
        globals.xplore.xp_targetchart.update();
    });

}


function createCentralityTable(phenotype) {
    let t0 = performance.now();
    globals.xplore.centraliytable.clear();

    for (let e in AIR.Molecules) {
        let result_row = [];

        //result_row.push(AIR.Molecules[e].name);
        let hasvalue = false;
        for (let c in AIR.Centrality) {

            if (AIR.Centrality[c].hasOwnProperty(e) && AIR.Centrality[c][e].hasOwnProperty(phenotype)) {
                let value = AIR.Centrality[c][e][phenotype];

                if (value != 0) {
                    hasvalue = true;
                }
                result_row.push(expo(value));
            }
            else {
                result_row.push(0);
            }

        }
        if (hasvalue) {
            result_row.unshift(getLinkIconHTML(AIR.Molecules[e].name));
            globals.xplore.centraliytable.row.add(result_row);
        }

    }

    globals.xplore.centraliytable.columns.adjust().draw();

    let t1 = performance.now();
    console.log("Centrality Table took " + (t1 - t0) + " milliseconds.")
}


// function xp_createpopup(button, phenotype) {

//     var $target = $('#xp_chart_popover');
//     var $btn = $(button);

//     if ($target) {


//         $('#xp_clickedpopupcell').css('background-color', 'transparent');
//         $('#xp_clickedpopupcell').removeAttr('id');

//         if ($target.siblings().is($btn)) {
//             $target.remove();
//             $("#xp_table_pe_results").parents(".dataTables_scrollBody").css({
//                 minHeight: "0px",
//             });
//             return;
//         }
//         $target.remove();

//     }

//     $(button).attr('id', 'xp_clickedpopupcell');
//     $(button).css('background-color', 'lightgray');

//     $target = $(`<div id="xp_chart_popover" class="popover bottom in" style="width: 100%; top: 55px; z-index: 2; border: none;">
//                     <div class="arrow" style="left: 9.375%;"></div>
//                     <div id="xp_chart_popover_content" class="popover-content" style="width: 100% !important;">
//                         <button type="button" id="xp_popup_close" class="air_close_tight close" data-dismiss="alert" aria-label="Close">
//                             <span aria-hidden="true">&times;</span>
//                         </button>
//                         <div class="cbcontainer mt-1 mb-2 ml-2">
//                             <input type="checkbox" class="air_checkbox" id="xp_popup_showregression">
//                             <label class="air_checkbox" for="xp_popup_showregression">Show Confidence Intervall</label>
//                         </div>
//                         <div id="xp_legend_target" class="d-flex justify-content-center mt-2 mb-2">
//                             <li class="legendli" style="color:#6d6d6d; font-size:100%; white-space: nowrap;">
//                                 <span class="legendspan_small" style="background-color:#C00000"></span>
//                                 Activates Phenotype</li>
//                             <li class="legendli" style="margin-left:5px; color:#6d6d6d; font-size:100%; white-space: nowrap;">
//                                 <span class="legendspan_small" style="background-color:#0070C0"></span>
//                                 Represses Phenotype</li>
//                             <li class="legendli" style="margin-left:5px; color:#6d6d6d; font-size:100%; white-space: nowrap;">
//                                 <span class="triangle_small"></span>
//                                 External Link</li>
//                         </div>
//                         <div style="height: 80%">
//                             <canvas class="popup_chart" id="xp_popup_chart"></canvas>
//                         </div>
//                     </div>
//                 </div>`);

    
//     $btn.after($target);

//     let close_btn = document.getElementById("xp_popup_close");
//     // When the user clicks on <span> (x), close the modal
//     close_btn.onclick = function () {
//         $target.remove();
//         $("#xp_table_pe_results").parents(".dataTables_scrollBody").css({
//             minHeight: "0px",
//         });
//     }

//     let targets = []
//     var dist_targets = [
//         {
//             label: "",
//             data: [{
//                 x: 1,
//                 y: 0,
//                 r: 4
//             }],
//         },
//         {
//             label: "",
//             data: [{
//                 x: -1,
//                 y: 0,
//                 r: 4
//             }],
//         }
//     ]
//     var maxx_dist = 0;
//     for (let [element, data] of Object.entries(globals.xplore.pe_results[phenotype]["dces"])) {

//         let SP = data[0];
//         let hex = "#cccccc";
//         let rad = 3;
//         let FC = data[1]

//         var aggr = SP * FC
//         rad = 6

//         if (aggr < 0) {
//             hex = "#0070C0";
//         }
//         else if (aggr > 0) {
//             hex = "#C00000"
//         }
//         if (Math.abs(aggr) > maxx_dist) { maxx_dist = Math.abs(aggr) }
//         dist_targets.push(
//             {
//                 label: element,
//                 data: [{
//                     x: Math.abs(aggr) * Math.sign(FC),
//                     y: Math.abs(aggr) * Math.sign(SP),
//                     r: rad
//                 }],
//                 pointStyle: pstyle,
//                 backgroundColor: hex,
//                 hoverBackgroundColor: hex,
//             })
        

//         var pstyle = 'circle';
//         if (AIR.MapSpeciesLowerCase.includes(AIR.Molecules[element].name.toLowerCase()) === false) {
//             pstyle = 'triangle'
//         }


//         targets.push(
//             {
//                 label: element,
//                 data: [{
//                     x: FC,
//                     y: SP,
//                     r: rad
//                 }],
//                 pointStyle: pstyle,
//                 backgroundColor: hex,
//                 hoverBackgroundColor: hex,
//             }
//         );
//     }

//     maxx_dist = maxx_dist < 1? 1 : maxx_dist;
    
//     var m = globals.xplore.pe_results[phenotype]["slope"];
//     var [std1,std2] = globals.xplore.pe_results[phenotype]["std"];
//     dist_targets.push(
//         {
//             data: [{
//                 x: -maxx_dist,
//                 y: -maxx_dist * m,
//                 r: 0,
//             },
//             {
//                 x: maxx_dist,
//                 y: maxx_dist * m,
//                 r: 0,
//             }],
//             type: 'line',
//             fill: false,
//             pointRadius: 0,
//             backgroundColor: m < 0 ? "#0070C0" : "#C00000",
//             borderColor: m < 0 ? "#0070C0" : "#C00000",
//             borderWidth: 2,
//         }
//     );
//     dist_targets.push(
//         {
//             data: [{
//                 x: -maxx_dist,
//                 y: -maxx_dist * std2,
//                 r: 0,
//             },
//             {
//                 x: maxx_dist,
//                 y: maxx_dist * std2,
//                 r: 0,
//             }],
//             type: 'line',
//             fill: "+1",
//             pointRadius: 0,
//         }
//     );
//     dist_targets.push(
//         {
//             data: [{
//                 x: -maxx_dist,
//                 y: -maxx_dist * std1,
//                 r: 0,
//             },
//             {
//                 x: maxx_dist,
//                 y: maxx_dist * std1,
//                 r: 0,
//             }],
//             type: 'line',
//             fill: false,
//             pointRadius: 0,
//         }
//     );

//     var outputCanvas = document.getElementById('xp_popup_chart');

//     var chartOptions = {
//         type: 'bubble',
//         data: {
//             datasets: targets,
//         },
//         options: {
//             plugins: {
//                 plugins: {
//                     filler: {
//                         propagate: false
//                     }
//                 },
//                 legend: {
//                     display: false
//                 },
//                 zoom: {
//                     // Container for pan options
//                     pan: {
//                         // Boolean to enable panning
//                         enabled: true,

//                         // Panning directions. Remove the appropriate direction to disable 
//                         // Eg. 'y' would only allow panning in the y direction
//                         mode: 'xy',
//                         rangeMin: {
//                             // Format of min pan range depends on scale type
//                             x: null,
//                             y: null
//                         },
//                         rangeMax: {
//                             // Format of max pan range depends on scale type
//                             x: null,
//                             y: null
//                         },

//                         // On category scale, factor of pan velocity
//                         speed: 20,

//                         // Minimal pan distance required before actually applying pan
//                         threshold: 10,

//                     },

//                     // Container for zoom options
//                     zoom: {
//                         wheel: {
//                             enabled: true,
//                         },
//                         pinch: {
//                             enabled: true
//                         },
//                         mode: 'xy',
//                     }
//                 },
//                 tooltip: {
//                     callbacks: {
//                         label: function (context) {
//                             var element = context.label || '';

//                             if (element && globals.xplore.pe_results[phenotype].dces.hasOwnProperty(element)) {
//                                 return [
//                                     'Name: ' + AIR.Molecules[element].name,
//                                     'Influence: ' + expo( globals.xplore.pe_results[phenotype].dces[element][0]),
//                                     'FC: ' + expo( globals.xplore.pe_results[phenotype].dces[element][1])
//                                 ];
//                             }
//                             else
//                                 return "";

//                         }
//                     }
//                 }
//             },
//             responsive: true,
//             maintainAspectRatio: false,
//             onHover: (event, chartElement) => {
//                 event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
//             },
//             onClick: (event, chartElement) => {
//                 if (chartElement[0]) {
//                     let name = AIR.Molecules[popupchart.data.datasets[chartElement[0].datasetIndex].label].name;
//                     selectElementonMap(name, true);
//                     xp_setSelectedElement(name);
//                 }
//             },
//             layout: {
//                 padding: {
//                     top: 0
//                 }
//             },
//             title: {
//                 display: true,
//                 text: "Regulators for '" + AIR.Phenotypes[phenotype].name,
//                 fontFamily: 'Helvetica',
//             },
//             scales: {
//                 y: {
//                     title: {
//                         display: true,
//                         text: 'Influence on Phenotype'
//                     },
//                     max: 1,
//                     min: -1,
//                     grid: {
//                         drawBorder: false,
//                         color: function (context) {
//                             if (context.tick.value == 0)
//                                 return '#000000';
//                             else
//                                 return "#D3D3D3";
//                         },
//                     }
//                 },
//                 x:
//                 {
//                     title: {
//                         display: true,
//                         text: 'Fold Change in Data'
//                     },
//                     ticks: {
//                         //beginAtZero: false,
//                     },
//                     grid: {
//                         drawBorder: false,
//                         color: function (context) {
//                             if (context.tick.value == 0)
//                                 return '#000000';
//                             else
//                                 return "#D3D3D3";
//                         },
//                     },
//                 },
//             }
//         }

//     };

//     let popupchart = new Chart(outputCanvas, chartOptions);
//     $target.show();

//     var popupheight = $("#xp_chart_popover").height() + 50;
//     $("#xp_resultstable").parents(".dataTables_scrollBody").css({
//         minHeight: (popupheight > 400 ? 400 : popupheight) + "px",
//     });


//     $('#xp_popup_showregression').on('click', function () {

//         if (document.getElementById("xp_popup_showregression").checked === true) {
//             popupchart.data.datasets = dist_targets
//             $("#xp_legend_target").replaceWith(`
//             <div id="xp_legend_target" class="d-flex justify-content-center mt-2 mb-2">
//                 <li class="legendli" style="color:#6d6d6d; font-size:100%; white-space: nowrap;">
//                     <span style="font-weight:bold; font-size: 50; color:${m < 0 ? "#0070C0" : "#C00000"}">—</span>
//                     Normalized Regression</li>
//                 <li class="legendli" style="margin-left:5px; color:#6d6d6d; font-size:100%; white-space: nowrap;">
//                     <span class="legendspan_small" style="background-color:#cccccc"></span>
//                     95% Confidence Intervall (unadjusted)</li>
//             </div>
//             `);
//         }
//         else {
//             popupchart.data.datasets = targets

//             $("#xp_legend_target").replaceWith(`            
//             <div id="xp_legend_target" class="d-flex justify-content-center mt-2 mb-2">
//                 <li class="legendli" style="color:#6d6d6d; font-size:100%; white-space: nowrap;">
//                     <span class="legendspan_small" style="background-color:#C00000"></span>
//                     Activates Phenotype</li>
//                 <li class="legendli" style="margin-left:5px; color:#6d6d6d; font-size:100%; white-space: nowrap;">
//                     <span class="legendspan_small" style="background-color:#0070C0"></span>
//                     Represses Phenotype</li>
//                 <li class="legendli" style="margin-left:5px; color:#6d6d6d; font-size:100%; white-space: nowrap;">
//                     <span class="triangle_small"></span>
//                     External Link</li>
//             </div>`);
//         }

//         popupchart.update();
//     })
// };

async function xp_updatePathgraph() {
    globals.xplore.pe_pathchart.data = {}
    let phenotype = $("#xp_pe_result_path_select").val()
    let _data = globals.xplore.pe_data[globals.xplore.pe_data_index];
    let fcelements = Object.keys(_data);

    let ko_elements = perturbedElements();
    let pathsfromelement = await getPathsConnectedToElement(phenotype, ko_elements, false, false, false)
    let epaths = Object.keys(pathsfromelement).filter(p => fcelements.includes(p.split("_")[0]));


    var re = new RegExp("_", 'g')

    let results = {}
    for (let path of epaths) {
        for (let e of path.split(re)) {
            if (!results.hasOwnProperty(e)) {
                results[e] = { "pos": 0, "neg": 0 };
            }
            results[e][epaths[path] == -1 ? "neg" : "pos"] += 1;
        }
    }

    let chartdata = []

    for (let e in results) {

        if (results[e] == 0 || e == phenotype || fcelements.includes(e))
            continue

        chartdata.push(
            [
                AIR.Molecules[e].name,
                results[e]["pos"] + results[e]["neg"],
                results[e]["pos"],
                results[e]["neg"]
            ]);

    }

    chartdata = chartdata.sort(function (a, b) {
        return b[1] - a[1];
    });

    globals.xplore.pathChartData = chartdata;

    globals.xplore.pe_pathchart.data = {
        labels: chartdata.map(p => p[0]),
        datasets:
            [
                {
                    label: "Percentage of positive Paths",
                    data: chartdata.map(p => expo(p[2] * 100 / epaths.length)),
                    backgroundColor: "#007bff"
                },
                {
                    label: "Percentage of negative Paths",
                    data: chartdata.map(p => expo(p[3] * 100 / epaths.length)),
                    backgroundColor: "#FF0000"
                }
            ]

    }

    document.getElementById("xp_pe_result_path_canvasContainer").style.height = (50 + 40 * chartdata.length).toString() + "px";


    globals.xplore.pe_pathchart.update();
    adjustPanels(globals.xplore.container);
}

async function xp_updateKOgraph() {
    let text = await disablebutton("xp_pe_ko_btn", true)
    let phenotype = $("#xp_pe_result_ko_select").val()
    var chartData = []
    globals.xplore.pe_kochart.data = {}
    globals.xplore.kochartdata = []

    let ko_elements = perturbedElements();

    if (!phenotype || ko_elements.length == 0) {
        document.getElementById("xp_pe_result_ko_canvasContainer").style.height = (70 * chartData.length) < 600 ? "600px" : (70 * chartData.length).toString() + "px";
        globals.xplore.pe_kochart.update();
        return;
    }

    var normalpaths = Object.keys(await getPathsConnectedToElement(phenotype, [], false, false, false))
    var kopaths = normalpaths.filter(p => ko_elements.every(ko => p.includes(ko + "_") == false && p.includes("_" + ko) == false))

    let pathelements = Array.from(new Set([].concat.apply([], normalpaths.map(m => m.split("_")))));
    await updateProgress(0, pathelements.length, "xp_pe_ko_btn", " analyzing centralities ...")
    let count = 1
    let re = new RegExp("_", "g")
    for (let e of pathelements) {

        if (count % 100 == 0)
            await updateProgress(count, pathelements.length, "xp_pe_ko_btn", " analyzing centralities ...")

        count++

        if (ko_elements.includes(e) || phenotype == e) {
            continue;
        }

        let betw = normalpaths.filter(p => p.includes("_" + e + "_")).length;
        let ko_betw = kopaths.filter(p => p.includes("_" + e + "_")).length;

        let betw_log2 = (betw == 0 ? 0 : ((betw - ko_betw) * 100 / betw));

        let infl = AIR.Phenotypes[phenotype].values.hasOwnProperty(e) ? AIR.Phenotypes[phenotype].values[e] : 0;
        let ko_infl = globals.xplore.pe_influenceScores[phenotype].values.hasOwnProperty(e) ? globals.xplore.pe_influenceScores[phenotype].values[e] : 0;

        let infl_log2 = (infl == 0 ? 0 : ((infl - ko_infl) * 100));

        let clos = normalpaths.filter(p => p.startsWith(e + "_")).map(p => (p.match(re) || []).length)
        clos = clos.length == 0 ? 0 : (1 / Math.min(...clos));
        let ko_clos = kopaths.filter(p => p.startsWith(e + "_")).map(p => (p.match(re) || []).length)
        ko_clos = ko_clos.length == 0 ? 0 : (1 / Math.min(...ko_clos));

        let clos_log2 = (clos == 0 ? 0 : ((clos - ko_clos) * 100 / clos))

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

    globals.xplore.kochartdata = chartData

    globals.xplore.pe_kochart.data = {
        labels: chartData.map(p => AIR.Molecules[p[0]].name),
        datasets: [
            {
                label: "Influence",
                data: chartData.map(p => p[1]),
                backgroundColor: "#FF0000",
            },
            {
                label: "Betweenness",
                data: chartData.map(p => p[2]),
                backgroundColor: "#007bff",
            },
            {
                label: "Closeness",
                data: chartData.map(p => p[3]),
                backgroundColor: "#00FF00",
            }
        ]

    }

    document.getElementById("xp_pe_result_ko_canvasContainer").style.height = (70 * chartData.length) < 600 ? "600px" : (70 * chartData.length).toString() + "px";
    globals.xplore.pe_kochart.update();
    await enablebtn("xp_pe_ko_btn", text)
}