var gv_table = null;
var selected_elements = new Set();
var gv_table_cons = null;
var gv_table_sub = null;
var gv_table_sub_sub = null;
var variants = [];
var transcripts = null;
var analyzed_genome = "";
var index_db = {};
var gv_results = {};
var mutation_results = {}
var impacts = ["NONE", "MODIFIER", "LOW", "MODERATE", "HIGH"]
var impactValues = {
    "HIGH":4,
    "MODERATE":3,
    "LOW":2,
    "MODIFIER":1,
    "None": 0
}
var transcriptfilter = {
    0: "transcript",
    1: "exon",
    2: "cds",
    3: "stop_codon",
    4: "5utr",
    5: "3utr"
}
var selected_ttype = "transcript";
var negativeStrand = false;

async function AirGenvar(){    
    let t0 = performance.now();   
    globals.gv_container = $("#airgenvar_tab_content")
    $(
        /*<div class="text-center">
            <img src="https://www.sbi.uni-rostock.de/files/Projects/AIR/AIR3D_croped.png" class="img-fluid" width="100%">
        </div>*/
        /*html*/`  
        <h4 class="mt-4 mb-4">1. Map Variants</h4>               
        <div class="row mb-4 mt-4">
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
                <input id="gv_inputId" type="file" accept=".vcf" class="om_inputfile inputfile" />
            </div>
        </div>

        <div id="gv_genomeselect-container" class="row mb-4 mt-4">
            <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right;">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Genome:</span>
            </div>
            <div class="col">
                <select id="gv_genomeselect" class="browser-default om_select custom-select">
                    <option value="hg19" selected>hg19</option>
                    <option value="hg38">hg38</option>
                </select>
            </div>
        </div>

        <div class="cbcontainer mt-4 mb-4">
            <input type="checkbox" class="air_checkbox" id="gv_checkbox_strand">
            <label class="air_checkbox air_checkbox_label" for="gv_checkbox_strand">Include negative strands?</label>
        </div>

        <button type="button" id="var_readfile" class="om_btn_air btn btn-block mt-4 mb-5">Read VCF</button>

        <div id="gv_typeselect-container" class="air_disabledbutton row mb-4 mt-4">
            <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right;">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Transcript type:</span>
            </div>
            <div class="col">
                <select id="gv_typeselect" class="browser-default om_select custom-select">
                    <option value="0" selected>Full Transcripts</option>
                    <option value="1">Exons</option>
                    <option value="2">Protein Coding Sequences</option>
                    <option value="3">Stop Codons</option>
                    <option value="4">5' UTR</option>
                    <option value="5">3' UTR</option>
                </select>
            </div>
        </div>
        
        <table class="stripe" style="width:100%" id="gv_table" cellspacing=0>
            <thead>
                <tr>
                    <th></th>
                    <th></th>
                    <th style="vertical-align: middle;">Gene</th>
                    <th style="vertical-align: middle;">Chrom.</th>
                    <th style="vertical-align: middle;">#Transcripts</th>
                    <th style="vertical-align: middle;">#Variants</th>
                </tr>
            </thead>
        </table>

        <button type="button" id="gv_selectmapelements" class="om_btn_air btn btn-block mt-4 mb-2">Select all map elements</button>

        <button type="button" id="gv_reset" class="om_btn_air btn btn-block mt-2 mb-4">Reset</button>

        <hr>

        <h4 class="mt-4 mb-4">2. Predict Consequences</h4> 

        <div class="row mb-2 mt-2">
            <div class="col-auto">
                <div class="wrapper">
                    <button type="button" class="air_btn_info btn btn-secondary ml-1"
                            data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="File Specifications"
                            data-content="Filter elements for which mutation consequence are fetched.">
                        ?
                    </button>
                </div>
            </div>
            <div class="col">
                <input id="gv_elementfilter" class="form-control" type="text" placeholder="Element names seperated by comma."> 
            </div>
            <div class="col-auto">
                <p id="gv_elementnumbers">0</p>
            </div>
        </div>
        

        <button type="button" id="gv_getConsequences" class="om_btn_air btn btn-block mt-4 mb-5">Predict Variant Consequences</button>

        <div id="gv_impactselect-container" class="air_disabledbutton row mb-4 mt-4">
            <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right;">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Impact Filter:</span>
            </div>
            <div class="col">
                <select id="gv_impactselect" class="browser-default om_select custom-select">
                    <option value="0" selected>Any</option>
                    <option value="4">High</option>
                    <option value="3">Moderate</option>
                    <option value="2">Low</option>
                    <option value="1">Modifier</option>
                </select>
            </div>
        </div>
        
        <table style="width:100%" id="gv_table_cons" cellspacing=0>
            <thead>
                <tr>
                    <th></th>
                    <th style="vertical-align: middle;">Gene</th>
                    <th style="vertical-align: middle;">Impact</th>
                    <th style="vertical-align: middle;">Most severe consequence</th>
                    <th style="vertical-align: middle;">#Variants</th>
                </tr>
            </thead>
        </table>

        <hr>

        <h4 class="mt-4 mb-4">3. Create Overlays</h4> 

        <div id="gv_overlayselect-container" class="row mb-4 mt-4">
            <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right;">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Overlay by:</span>
            </div>
            <div class="col">
                <select id="gv_overlayselect" class="browser-default om_select custom-select">
                    <option value="0" selected>Number of transcripts</option>
                    <option value="1">Number of variants</option>
                    <option value="2">Variant effects</option>
                </select>
            </div>
        </div>

        <input id="gv_olname" class="form-control mb-4 mt-4" type="text" placeholder="Overlay Name"> 

        <button type="button" id="gv_addoverlay" class="om_btn_air btn btn-block mt-4 mb-5">Create Overlay</button>

    `).appendTo(globals.gv_container);
    gv_table = $('#gv_table').DataTable({
        "order": [[ 2, "asc" ]], 
        "scrollX": true,
        "autoWidth": true,
        "columns": [
            {
                "class":          "gv_table_expand",
                "orderable":      false,
                "data":           null,
                "width": "5%",
                "defaultContent": '<a class="fa fa-caret-right"></a>'
            },
            {
                "width": "5%",
                "orderable":false
            },
            {"width": "40%"},
            {"width": "10%"},
            {"width": "20%"},
            {"width": "20%"}
        ],
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
        ]
    }).columns.adjust();

    gv_table_cons = $('#gv_table_cons').DataTable({
        "order": [[ 1, "asc" ]], 
        "scrollX": true,
        "autoWidth": true,
        "columns": [
            {
                "class":          "gv_table_cons_expand",
                "orderable":      false,
                "data":           null,
                "width": "5%",
                "defaultContent": '<a class="fa fa-caret-right"></a>'
            },
            {"width": "20%"},
            {"width": "15%"},
            {"width": "40%"},
            {"width": "15%"}
        ],
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
                className: 'dt-center'
            },
            {
                targets: 4,
                className: 'dt-center'
            },
        ]
    }).columns.adjust();;
    $('#gv_typeselect').on('change', async function() {
        selected_ttype = transcriptfilter[this.value];
        gv_table.clear();
        await gv_createTable()
    });

    $('#gv_impactselect').on('change', set_cons_table);
    
    $('.air_btn_info[data-toggle="popover"]').popover()

    let t1 = performance.now()
    console.log("Call to AirGenvar took " + (t1 - t0) + " milliseconds.")
    gv_table_cons.columns.adjust();
    gv_table.columns.adjust();
    
    $('#var_readfile').on('click', async function() {

        let _negativeStrand = document.getElementById("gv_checkbox_strand").checked
        var genome = $('#gv_genomeselect').val()
        if(analyzed_genome != genome || negativeStrand != _negativeStrand)
        {
            transcripts = null;
            variants = [];
            index_db = {};
            analyzed_genome = genome
            negativeStrand = _negativeStrand
            mutation_results = {}
            $("#gv_elementfilter").val("");
            gv_table_cons.clear()
            gv_table_cons.columns.adjust();
        }
        if(transcripts == null)
        {
            $('#var_readfile').empty().append(`<i class="fa fa-spinner fa-spin"></i> Fetching genome data ...`).addClass("air_disabledbutton");
            var client = new XMLHttpRequest();

            client.open('GET', fileURL + '/' + genome + '_genome.json');
            client.onreadystatechange = async function() {
                if (this.readyState == 4)
                {
                    if(this.status == 200) {
                        let output = client.responseText;
                        output = replaceAll(output, "ß", '"},"');
                        output = replaceAll(output, "ü", '":{"');
                        output = replaceAll(output, "ä", '":"');
                        output = replaceAll(output, "q", '","');
                        output = replaceAll(output, "ö", '"},{"');
                        let _data = JSON.parse(output)
                        transcripts = [];
                        for(let m in _data)
                        {
                            for(let _id in _data[m])
                            {
                                let _temp = _data[m][_id];
                                if(_temp.p == true || negativeStrand == true)
                                {
                                    _temp["m"] = m;
                                    transcripts.push(_temp)
                                }
                            }
                        }
                        setTimeout(() => {
                            $('#var_readfile').empty().append(`<div class="air_progress position-relative mb-4">
                                <div id="gv_progress" class="air_progress_value"></div>
                                <span id="gv_progress_label" class="air_progress_label justify-content-center d-flex position-absolute w-100">0 %</span>
                            </div>`);
                        }, 0);              
                        await buildIndexDatabase();
                        await analyzevcf();
                        $("#gv_typeselect-container").removeClass("air_disabledbutton");
                    }
                }
            };
            client.send();
        }
        else
        {
            await analyzevcf();
        }
        async function analyzevcf()
        {
            $('#var_readfile').empty().append(`<div class="air_progress position-relative mb-4">
                <div id="gv_progress" class="air_progress_value"></div>
                <span id="gv_progress_label" class="air_progress_label justify-content-center d-flex position-absolute w-100">0 %</span>
            </div>`);
            gv_table.clear();

            var fileToLoad = document.getElementById("gv_inputId").files[0];

            var fileReader = new FileReader();
            fileReader.readAsText(fileToLoad, "UTF-8");

            fileReader.onload = async function (fileLoadedEvent) {
                var textFromFileLoaded = fileLoadedEvent.target.result;
                let headers = [];
                var variantLines = [];
                textFromFileLoaded.split('\n').forEach(function(line) {
                    if(line.startsWith("#"))
                    {
                        headers.push(line)
                    }
                    else
                    {
                        variantLines.push(line);
                    }
                });
                let headerText = headers.join("\r");
                const tbiVCFParser = new VCF({ header: headerText })
                let varlength = variantLines.length - 1;
                gv_results = {};
                for(let line in variantLines)
                {
                    await readvcfline(line);
                    if(line % 1000 == 0)
                        await updateProgress(line, varlength, "gv_progress")
                }  
                async function readvcfline(line) {
                    let variant = tbiVCFParser.parseLine(variantLines[line]);
                    if(!variant)
                        return;
                    variants.push(variant);
                    let results =  await getTranscripts(variant["CHROM"], variant["POS"]);
                    results.forEach(function(transcriptid) {
                        if(transcriptid == null)
                            return;
                        
                        let transcript = transcripts[transcriptid]
                        let molecule = transcript["m"]

                        if(!gv_results.hasOwnProperty(molecule))
                        {
                            gv_results[molecule] = {}
                        }
                        if(!gv_results[molecule].hasOwnProperty(transcriptid))
                        {
                            gv_results[molecule][transcriptid] = []
                        }

                        gv_results[molecule][transcriptid].push(variants.indexOf(variant));

                    });
                }    

                $("#var_readfile").html('Read VCF').removeClass("air_disabledbutton");
                gv_createTable()     
                
            }
        }

    });

    $('#gv_table tbody').on( 'click', 'tr td.gv_table_expand', function () {
        var tr = $(this).closest('tr');
        var row = gv_table.row( tr );

        if(row.child.isShown())
        {
            if(row.child.child)
                row.child.child.hide()
            row.child.hide();
            $(row.node()).find("td:first").html('<a class="fa fa-caret-right"></a>');
        }
        else {
            var m = $(row.node()).attr("id")
            $(row.node()).find("td:first").html('<a class="fa fa-caret-down"></a>');
            row.child(
                `<table class="stripe ml-4" style="width:100%" id="gv_table_sub_${m}" cellspacing=0>
                    <thead>
                        <tr>
                            <th></th>
                            <th style="vertical-align: middle;">Link</th>
                            <th style="vertical-align: middle;">Type</th>
                            <th style="vertical-align: middle;">Start</th>
                            <th style="vertical-align: middle;">End</th>
                            <th style="vertical-align: middle;">Strand</th>
                            <th style="vertical-align: middle;">#Variants</th>
                        </tr>
                    </thead>
                </table>`
            ).show();

            gv_table_sub = $("#gv_table_sub_" + m).DataTable({
                "order": [[ 2, "asc" ]], 
                "paging":   false,
                "searching": false,
                "info":     false, 
                "scrollX": true,
                "autoWidth": true,
                "columns": [
                    {
                        "class":          "gv_table_sub_expand",
                        "orderable":      false,
                        "data":           null,
                        "width": "5%",
                        "defaultContent": '<a class="fa fa-caret-right"></a>'
                    },
                    {"width": "10%"},
                    {"width": "15%"},
                    {"width": "20%"},
                    {"width": "20%"},
                    {"width": "10%"},
                    {"width": "15%"}
                ],
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
                    {
                        targets: 6,
                        className: 'dt-center'
                    }
                ]
            }).columns.adjust();

            for(let t in gv_results[m])
            {
                if(validTranscript(t))
                {
                    let result_row = [""];
                    result_row.push(transcripts[t].r != ""? '<a target="_blank" href="https://www.ensembl.org/Homo_sapiens/Transcript/Summary?t=' + transcripts[t].r + '"><span class="fa fa-external-link-alt ml-2"></span></a>' : "");
                    result_row.push(transcripts[t].t);
                    result_row.push(transcripts[t].s);
                    result_row.push(transcripts[t].e);
                    result_row.push(transcripts[t].p == true? "+":"-");                    
                    result_row.push(gv_results[m][t].length);
                
                    let new_sub_row = gv_table_sub.row.add(result_row).node();
                    $(new_sub_row).attr("id", t + "_" + m);
                }
            }
            gv_table_sub.columns.adjust().draw();

            $('#gv_table_sub_' + m + ' tbody').on( 'click', 'tr td.gv_table_sub_expand', function () {
                var sub_tr = $(this).closest('tr');
                var sub_row = gv_table_sub.row( sub_tr );
                if(sub_row.child.isShown())
                {
                    sub_row.child.hide();
                    $(sub_row.node()).find("td:first").html('<a class="fa fa-caret-right"></a>');
                }
                else {
                    var _id = $(sub_row.node()).attr("id").split("_")
                    var _t = _id[0]
                    var _m = _id[1]
                    $(sub_row.node()).find("td:first").html('<a class="fa fa-caret-down"></a>');
                    sub_row.child(
                        `<table class="stripe ml-5" id="gv_table_sub_${_m}_${_t}" style="width:60%" cellspacing=0>
                            <thead>
                                <tr>
                                    <th style="vertical-align: middle;">Position</th>
                                    <th style="vertical-align: middle;">Ref</th>
                                    <th style="vertical-align: middle;">Alt</th>
                                </tr>
                            </thead>
                        </table>`
                    ).show();

                    gv_table_sub_sub = $("#gv_table_sub_" + _m + "_" + _t).DataTable({
                        "order": [[ 0, "asc" ]], 
                        "paging":   false,
                        "searching": false,
                        "info":     false,
                        "columns": [
                            {"width": "30%"},
                            {"width": "30%"},
                            {"width": "30%"},
                        ],
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
                        ]                    
                    }).columns.adjust();
        
                    if(gv_results[_m][_t])
                    {
                        gv_results[_m][_t].forEach(v =>
                        {
                            let variant = variants[v];
                            let result_row = [];

                            result_row.push(variant["POS"]);
                            result_row.push(variant["REF"]);
                            result_row.push(variant["ALT"]);

                            gv_table_sub_sub.row.add(result_row)
                        });
                        gv_table_sub_sub.columns.adjust().draw();
                    }
                }
            });
        }
    });

    $('#gv_table_cons tbody').on( 'click', 'tr td.gv_table_cons_expand', function () {
        var tr = $(this).closest('tr');
        var row = gv_table_cons.row( tr );

        if(row.child.isShown())
        {
            if(row.child.child)
                row.child.child.hide()
            row.child.hide();
            $(row.node()).find("td:first").html('<a class="fa fa-caret-right"></a>');
        }
        else {
            var m = $(row.node()).attr("id")
            $(row.node()).find("td:first").html('<a class="fa fa-caret-down"></a>');
            row.child(
                `<table class="ml-4" style="width:80%" id="gv_table_cons_sub_${m}" cellspacing=0>
                    <thead>
                        <tr>
                            <th style="vertical-align: middle;">Consequence Terms</th>
                            <th style="vertical-align: middle;">Position</th>
                            <th style="vertical-align: middle;">Impact</th>
                            <th style="vertical-align: middle;">Biotype</th>
                        </tr>
                    </thead>
                </table>`
            ).show();

            let gv_table_cons_sub = $("#gv_table_cons_sub_" + m).DataTable({
                "createdRow": function( row, data, dataIndex ) {
                    switch( data[2])
                    {
                        case"HIGH": $(row).addClass('air_red'); break;
                        case "MODERATE": $(row).addClass('air_yellow'); break;
                        case "LOW": $(row).addClass('air_green'); break;
                        case "MODIFIER": $(row).addClass('air_gray'); break;
                        default: break;
                    }
                },
                "order": [[ 2, "asc" ]], 
                "paging":   false,
                "searching": false,
                "info":     false, 
                "scrollX": true,
                "autoWidth": true,
                "columns": [
                    {"width": "10%"},
                    {"width": "15%"},
                    {"width": "20%"},
                    {"width": "20%"},
                ],
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
                        className: 'dt-center'
                    }
                ]
            }).columns.adjust();

            for(let v in mutation_results[m].variants)
            {
                let result_row = [];
                result_row.push(mutation_results[m].variants[v].consequence_terms.join(', '));
                result_row.push(mutation_results[m].variants[v].position);
                result_row.push(mutation_results[m].variants[v].impact);
                result_row.push(mutation_results[m].variants[v].biotype);      
                gv_table_cons_sub.row.add(result_row)
            }
            gv_table_cons_sub.columns.adjust().draw();

            
        }
    });

    $('#gv_addoverlay').on('click', async function() {
        gv_addoverlay()
    });

    $('#gv_getConsequences').on('click', getConsequences);

    $('#gv_reset').on('click', async function() {
        selected_elements = new Set()
        gv_table.rows().every( function () {
            var row = this.nodes().to$()
            row.find('.gv_clickCBinTable').prop('checked', false)
        } );

        $("#gv_elementfilter").val("");
        $("#gv_elementnumbers").html(0);
    });

    $('#gv_selectmapelements').on('click', async function() {
        
        selected_elements = new Set()
        let _ids = []
        for(let element in gv_results)
        {
            if(AIR.MapElements.hasOwnProperty(AIR.Molecules[element].name.toLowerCase()))
            {
                selected_elements.add(AIR.Molecules[element].name)
                _ids.push(element)
            }
        }

        gv_table.rows().every( function () {
            var row = this.nodes().to$()
            if(_ids.includes(row.attr("id")))
            {
                row.find('.gv_clickCBinTable').prop('checked', true)
            }
        } );

        updateElementInput();
    });

    
}
async function gv_addoverlay()
{
    let text = await disablebutton("gv_addoverlay"); 
    let olname = $("#gv_olname").val();
    globals.specialCharacters.forEach(c => {
        olname = olname.replaceAll(c, "");
    })

    if(olname == "")
    {
        alert("Please specify a name for the overlay.");
        return;
    }

    let _content = await gv_contentString() 
    if(_content != "")
    {
        $.ajax({
            method: 'POST',
            url: minerva.ServerConnector._serverBaseUrl + 'api/projects/' + minervaProxy.project.data.getProjectId() + '/overlays/',

            data: `content=name%09color${_content}&description=PhenotypeActivity&filename=${olname}.txt&name=${olname}&googleLicenseConsent=true`,
            cookie: 'MINERVA_AUTH_TOKEN=xxxxxxxx',
            success: (response) => {
                enablebtn("gv_addoverlay", text);
                $("[name='refreshOverlays']").click();
            },
            error: (response) => {
                enablebtn("gv_addoverlay", text);
            }
        })
    }
    else
    {
        enablebtn("gv_addoverlay", text);
    }

    function deleteOldOverlay()
    {
        return new Promise((resolve, reject) =>  
        { 
            let _found = false;
            var overlays = minervaProxy.project.data.getDataOverlays();

            for (let ol in overlays)
            {
                if(overlays[ol].name.toLowerCase() == olname.toLowerCase())
                {
                    _found = true;
                    $.ajax({
                        method: 'DELETE',
                        url: minerva.ServerConnector._serverBaseUrl + 'api/projects/' + minervaProxy.project.data.getProjectId() + '/overlays/' + ol,
                        cookie: 'MINERVA_AUTH_TOKEN=xxxxxxxx',
                        success: (response) => {
                            $("[name='refreshOverlays']").click();
                            resolve("");
                        }
                    })
                }
            };
            if(!_found)
            {
                resolve("")
            }
        });
    }
    function gv_contentString()
    {
        return new Promise((resolve, reject) =>  
        { 
            let olfilter = $("#gv_overlayselect").val();
            let output = '';

            if(olfilter == 2)
            {
                for (let m in mutation_results)
                {
                    output += `%0A${AIR.Molecules[m].name}`;
                    switch(mutation_results[m].impact)
                    {
                        case "HIGH": output += '%09%23ff0000'; break;
                        case "LOW": output += '%09%2300ff00'; break;
                        case "MODERATE": output += '%09%23ffff00'; break;
                        case "MODIFIER": output += '%09%23d3d3d3'; break;
                        default: output += '%09%23ffffff'; break;
                    }
                }
            }        

            else
            {
                let _values = {};

                for (let m in gv_results)
                {            
                    if(olfilter == 0)
                    {
                        _values[encodeURIComponent(AIR.Molecules[m].name)] = Object.keys(gv_results[m]).length;
                    }
                    else if (olfilter == 1)
                    {
                        let _value = new Set();
                        for (let t in gv_results[m])
                        { 
                            gv_results[m][t].forEach(v => {
                                _value.add(v)
                            })
                        }
                        _values[encodeURIComponent(AIR.Molecules[m].name)] = Array.from(_value).length;
                    }
                }


                let _max = _values[Object.keys(_values).reduce((a, b) => _values[a] > _values[b] ? a : b)];

                for (let m in _values)
                {
                    let _value = _max != 0? _values[m]/Math.abs(_max) : 0
                    let hex = rgbToHex((1 - Math.abs(_value)) * 255);
                    output += `%0A${m}`;
                    if (_value > 0)
                        output += '%09%23ff' + hex + hex;
                    else if (_value < 0)
                        output += '%09%23' + hex + hex + 'ff';
                    else output += '%09%23ffffff';
                };
            }   

            resolve(output);
        })
    }
}

$(document).on('change', '.gv_clickCBinTable',function () {
    if ($(this).prop('checked') === true) {
        $(this).parents("tr").each(function( pindex ) {
            selected_elements.add(AIR.Molecules[$(gv_table.row(this).node()).attr("id")].name);
        });
    }
    else {
        $(this).parents("tr").each(function( pindex ) {
            selected_elements.delete(AIR.Molecules[$(gv_table.row(this).node()).attr("id")].name);
        });
    }   
    updateElementInput()
})

function updateElementInput()
{
    $("#gv_elementfilter").val(Array.from(selected_elements).join(", "));
    $("#gv_elementnumbers").html(Array.from(selected_elements).length);
}

async function getConsequences()
{
    $('#gv_getConsequences').empty().append(`<div class="air_progress position-relative mb-4">
            <div id="gv_progress" class="air_progress_value"></div>
            <span id="gv_progress_label" class="air_progress_label justify-content-center d-flex position-absolute w-100">0 %</span>
        </div>`).addClass("air_disabledbutton");

    var count = 0;
    var totallength = 0;
    let element_promises = [];
    let input = $("#gv_elementfilter").val().trim();
    var _elements = {}
    var _elementids = []

    if(input == "")
    {
        if (confirm('Are you sure you want to predict consequences for all variants? This will take a long time. Otherwise specify element names in the text box.')) 
        {
            for(let m in gv_results)
            {
                _elementids.push(m);
            }

        } else {
            return;
        }
    }
    else
    {
        input.split(",").forEach(_e => 
        {
            let e = _e.trim().toLowerCase();
            if(AIR.ElementNames.name.hasOwnProperty(e))
            {
                _elementids.push(AIR.ElementNames[globals.selectedmapping][e])
            }
        });
    }
    for(let _i in _elementids)
    {
        let _variants = {}
        let element = _elementids[_i];
        for(let t in gv_results[element])
        {
            if(validTranscript(t))
            {
                gv_results[element][t].forEach(v => 
                {
                
                    if(!_variants.hasOwnProperty(v))
                    {
                        _variants[v] = new Set()
                    }
                    _variants[v].add(transcripts[t].r)
                });
            }
        }
        totallength += Object.keys(_variants).length;
        _elements[element] = _variants;
    }
    for(let m in _elements)
    {
        element_promises.push(
            getMutations(m).then(element_result => 
            {       
                mutation_results[m] = {"variants": element_result};            
            }).catch(e => {
                reject(e)
            }));
    }
    Promise.allSettled(element_promises).catch(e => {
        console.log(e);
    }).finally(r => {
        set_cons_table()
        $('#gv_impactselect-container').removeClass("air_disabledbutton")
        $("#gv_getConsequences").html('Predict Variant Consequences').removeClass("air_disabledbutton");

    });    

    function getMutations(m)
    {
        return new Promise((resolve, reject) =>  
        {          
            let variant_promises = [];
            let variant_results = [];

            for(let v in _elements[m])
            {
                variant_promises.push(getConsequencesFromVariant(variants[v], Array.from(_elements[m][v])).then(r => 
                    {
                        variant_results = variant_results.concat(r)
                    }).finally(r => {     
                        updateProgress(count++, totallength, "gv_progress")
                }));
            }
            Promise.allSettled(variant_promises).catch(e => {
                reject(e)
            }).then(r => {
                resolve(variant_results);
            });
            
            function getConsequencesFromVariant(variant, tIDs)
            {
                return new Promise((resolve, reject) => {
                    let p = variant["POS"]
                    let a = variant["ALT"]
                    let r = variant["REF"]
                    let c = variant["CHROM"]
                    let _result = []

                    if(r.length != 1)
                    {
                        resolve([])
                    }
                    else
                    {
                        var client = new XMLHttpRequest();

                        client.open('GET', `https://${$('#gv_genomeselect').val() == "hg19"? "grch37.":""}rest.ensembl.org/vep/human/region/${c.toLowerCase().replace("chr", "")}:${p}:${p}/${a}?`);
                        client.setRequestHeader("Content-Type", "application/json")
                        client.onreadystatechange = function() {
                            if (this.readyState == 4)
                            {
                                if(this.status == 200) {

                                    let response =  JSON.parse(client.responseText)[0];

                                    if(response.hasOwnProperty("transcript_consequences"))
                                    {
                                        for(let _cons in response["transcript_consequences"])
                                        {
                                            if(response["transcript_consequences"][_cons].hasOwnProperty("transcript_id"))
                                            {
                                                if(tIDs.includes(response["transcript_consequences"][_cons]["transcript_id"]))
                                                {
                                                    let _temp = response["transcript_consequences"][_cons]
                                                    _temp["most_severe_consequence"] = response["most_severe_consequence"]
                                                    _temp["position"] = p
                                                    _result.push(_temp);
                                                }
                                            }
                                        }

                                    }

                                    resolve(_result)
                                }
                                else
                                {
                                    console.log(client.responseText)
                                    resolve(_result)
                                }
                            }
                        }
                        client.send();
                    };
                });
            }
        });
    }
}

function set_cons_table()
{
    let selected_impact = $("#gv_impactselect").val()
    gv_table_cons.clear();
    gv_table_cons.columns.adjust();

    _elementnames = []
    for(let m in mutation_results)
    {
        let element_result = mutation_results[m].variants;
        let result_row = [""];
        let impact = 0;
        let consequences = new Set()

        for(let t in element_result)
        {
            let _impact = impacts.indexOf(element_result[t]["impact"])
            if(_impact > impact)
            {
                impact = _impact
                consequences = new Set()
                consequences.add(element_result[t]["most_severe_consequence"])
            }
            else if (_impact == impact) {
                consequences.add(element_result[t]["most_severe_consequence"])
            }
            
        }

        if(selected_impact != impact && selected_impact != 0)
            continue;

        mutation_results[m]["impact"] = impacts[impact];
        mutation_results[m]["consequences"] = Array.from(consequences);

        result_row.push(getLinkIconHTML(AIR.Molecules[m].name));
        result_row.push(impacts[impact]);
        result_row.push(Array.from(consequences).join(', '));
        result_row.push(element_result.length);
    
        let row = gv_table_cons.row.add(result_row).node()
        $(row).attr("id", m);

        switch(impact)
        {
            case 4: $(row).addClass('air_red'); break;
            case 3: $(row).addClass('air_yellow'); break;
            case 2: $(row).addClass('air_green'); break;
            case 1: $(row).addClass('air_gray'); break;
            default: break;
        }

        _elementnames.push(AIR.Molecules[m].name)
    }
    highlightSelected(_elementnames);
    gv_table_cons.columns.adjust().draw();
}

async function gv_createTable(onlyPositive = true) 
{
    for(let m in gv_results)
    {
        let result_row = [""];

        let transcript_number = 0;
        let number_of_variants = new Set();
        let chromosome = "";
        for(let t in gv_results[m])
        {
            if(validTranscript(t))
            {
                chromosome = transcripts[t].c
                transcript_number++;
                gv_results[m][t].forEach(variant => number_of_variants.add(variant))
            }
        }

        if(transcript_number == 0)
            continue;
        result_row.push('<input type="checkbox" class="gv_clickCBinTable">')
        result_row.push(getLinkIconHTML(AIR.Molecules[m].name));
        result_row.push(chromosome);
        result_row.push(transcript_number);
        result_row.push(number_of_variants.size);
    
        let row = gv_table.row.add(result_row).node()
        $(row).attr("id", m);
    }
    gv_table.columns.adjust().draw();
}
function validTranscript(t)
{
    if(transcripts[t].t == selected_ttype)
    {
        return true;
    }
    else {
        return false;
    }
}
async function buildIndexDatabase() 
{
    for(let _id in transcripts)
    {
        let chromosome = transcripts[_id]["c"];
        let start = transcripts[_id]["s"]
        let end = transcripts[_id]["e"]

        if(!index_db.hasOwnProperty(chromosome))
        {
            index_db[chromosome] = {}
            index_db[chromosome]["largest"] = {}
            index_db[chromosome]["large"] = {}
            index_db[chromosome]["long"] = {}
            index_db[chromosome]["middle"] = {}
            index_db[chromosome]["short"] = {}
        }

        let  range = (end - start)
        if(range >= 1000000)
        {
            createIndexDictionary(index_db[chromosome].largest, start, end, _id, 7, 7)
        }
        else if(range >= 100000)
        {
            createIndexDictionary(index_db[chromosome].large, start, end, _id, 7, 6)
        }
        else if(range >= 10000)
        {
            createIndexDictionary(index_db[chromosome].long, start, end, _id, 7, 5)
        }
        else if (range >= 1000)
        {
            createIndexDictionary(index_db[chromosome].middle, start, end, _id, 7, 4)
        }
        else {
            createIndexDictionary(index_db[chromosome].short, start, end, _id, 7, 3)
        }

        function createIndexDictionary(dict, start, end, _id, p, min)
        {
            if(p < min)
            {
                if(!dict.hasOwnProperty(start))
                {
                    dict[start] = { };
                }
        
                if(!dict[start].hasOwnProperty(end))
                {
                    dict[start][end] = [];
                }

                dict[start][end].push(_id);

                return;
            }

            let factor = Math.pow(10, p)
            let step = Math.floor(start/ factor) * factor

            if(!dict.hasOwnProperty(step))
            {
                dict[step] = {}
            }
            createIndexDictionary(dict[step], start, end, _id, p - 1 , min)
        }
            
        if(_id % 1000 == 0)
            await updateProgress(_id, transcripts.length, "gv_progress", " Buiilding index database...")
    }
}

async function getTranscriptsFromPosition(chr, start)
{
    return new Promise(resolve => {
        let results = []
        if(!index_db.hasOwnProperty(chr))
            resolve([]);
        
        let step_6_array = Object.keys(index_db[chr]).sort();
        let step_6_temp = step_6_array[0]
        let lastitem = step_6_array[step_6_array.length - 1]
        step_6_array.forEach(step_6 => {
            if((start < step_6 || step_6 == lastitem) && step_6 != step_6_array[0]) 
            {
                if(step_6 == lastitem)
                    step_6_temp = step_6;
                let step_5_array = Object.keys(index_db[chr][step_6_temp]).sort();
                let step_5_temp = step_5_array[0]
                lastitem = step_5_array[step_5_array.length - 1]
                step_5_array.forEach(step_5 => {
                    if((start < step_5 || step_5 ==  lastitem) && step_5 != step_5_array[0]) 
                    {
                        if(step_5 == lastitem)
                            step_5_temp = step_5;
                        let step_4_array =  Object.keys(index_db[chr][step_6_temp][step_5_temp]).sort()
                        let step_4_temp = step_4_array[0]
                        lastitem = step_4_array[step_4_array.length - 1]
                        step_4_array.forEach(step_4 => {
                            if((start < step_4 || step_4 ==  lastitem) && step_4 != step_4_array[0]) 
                            {
                                if(step_4 == lastitem)
                                    step_4_temp = step_4;
                                let step_3_array = Object.keys(index_db[chr][step_6_temp][step_5_temp][step_4_temp]).sort()
                                let step_3_temp = step_3_array[0]
                                lastitem = step_3_array[step_3_array.length - 1]
                                step_3_array.forEach(step_3 => {
                                    if((start < step_3 || step_3 ==  lastitem) && step_3 != step_3_array[0]) 
                                    {
                                        if(step_3 == lastitem)
                                            step_3_temp = step_3;
                                        for(let s_pos in index_db[chr][step_6_temp][step_5_temp][step_4_temp][step_3_temp])
                                        {
                                            for(let e_pos in index_db[chr][step_6_temp][step_5_temp][step_4_temp][step_3_temp][s_pos])
                                            {
                                                if(start >= s_pos && start <= e_pos)
                                                {
                                                    index_db[chr][step_6_temp][step_5_temp][step_4_temp][step_3_temp][s_pos][e_pos].forEach(_id => results.push(_id))
                                                }
                                            }
                                        }
                                        resolve(results);
                                    } 
                                    step_3_temp = step_3;
                                });
                                resolve([]);
                            } 
                            step_4_temp = step_4;
                        });
                        resolve([]);
                    } 
                    step_5_temp = step_5;
                });
                resolve([]);
            } 
            step_6_temp = step_6;
        });

        resolve([]);
    });
}

async function getTranscripts(chr, position)
{
    return new Promise(resolve => {

        if(!index_db.hasOwnProperty(chr))
            resolve([]);


        let results = new Set();

        [
            getRangeDictionaries(index_db[chr].largest, 1),
            getRangeDictionaries(index_db[chr].large, 2),
            getRangeDictionaries(index_db[chr].long, 3),
            getRangeDictionaries(index_db[chr].middle, 4),
            getRangeDictionaries(index_db[chr].short, 5)
        ].forEach(current_dicts =>
            {
                current_dicts.forEach(current_dict => 
                {
                    Object.keys(current_dict).map(Number).filter(function(x) { return x <= position; }).forEach(s_pos =>
                    {
                        Object.keys(current_dict[s_pos]).map(Number).filter(function(x) { return x >= position; }).forEach(e_pos =>
                        {
                            current_dict[s_pos][e_pos].forEach(_id => results.add(_id))
                        });
                    });
                });
            });

        resolve(Array.from(results))

        function getRangeDictionaries(dict, iterations)
        {
            let breakflag = true;
            let current_dicts = [dict]
            let _array = undefined;    
            for (var i = 1; i <= iterations; i++) {
                let new_dicts = []
                current_dicts.forEach(current_dict => 
                {
                    _array = Object.keys(current_dict).map(Number).filter(function(x) { return x <= position; }).sort(function(a, b){return a-b});
                    if(_array.length >= 1)
                    {
                        if(i == iterations)
                            breakflag = false;
                        
                        let laststep = _array[_array.length - 1]
                        new_dicts.push(current_dict[laststep])
                        if(_array.length >= 2 && (laststep + Math.pow(10, 8 - iterations) > position))
                            new_dicts.push(current_dict[_array[_array.length - 2]])
                    } 
                });
                current_dicts = new_dicts;
            }
            if(breakflag)
                return [];
            else
                return current_dicts;
        }
    });
    
}

async function getTranscriptIDs(chr, position)
{
    return new Promise(resolve => {
        let results = []
        if(!index_db.hasOwnProperty(chr))
            resolve([]);

        for(let start in index_db[chr])
        {
            if(position >= start)
            {
                for(let end in index_db[chr][start])
                {
                    if(position <= end)
                    {
                        index_db[chr][start][end].forEach(r => results.push(r))
                    }
                }
            }
        }

        resolve(results)
    });
    
}