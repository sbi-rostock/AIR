async function AirGenvar(){  
    globals.variant = {
        samples: [],
        gv_table: null,
        selected_elements: new Set(),
        gv_table_cons: null,
        gv_table_sub: null,
        gv_table_sub_sub: null,
        variants: [],
        variants_temp: {},
        transcripts: null,
        analyzed_genome: "",
        index_db: {},
        gv_results: {},
        mutation_results: {},
        impacts: ["NONE", "LOW", "MODIFIER", "MODERATE", "HIGH"],
        impactValues: {
            "HIGH":4,
            "MODERATE":3,
            "LOW":1,
            "MODIFIER":2,
            "None": 0
        },
        vep_results: {},
        transcriptfilter: {
            0: "transcript",
            1: "exon",
            2: "cds",
            3: "stop_codon",
            4: "5utr",
            5: "3utr"
        },
        selected_ttype: "transcript",
        negativeStrand: false
    }  
    var t0 = performance.now();   
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
                <input id="gv_inputId" type="file"  accept=".vcf" class="om_inputfile inputfile" multiple/>
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

        <button type="button" id="gv_readfile" class="air_btn btn btn-block mt-4 mb-4">Read VCF</button>

        <hr>

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
        </table>

        <button type="button" id="gv_selectmapelements" class="air_btn btn btn-block mt-4 mb-2">Select all map elements</button>

        <button type="button" id="gv_reset" class="air_btn btn btn-block mt-2 mb-4">Reset</button>

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
            <div class="col" style="padding-right: 0px">
                <input id="gv_elementfilter" class="form-control" type="text" placeholder="Element names seperated by comma."> 
            </div>
            <div class="col-auto" style="padding-right: 15px">
                <p id="gv_elementnumbers">0</p>
            </div>
        </div>
        
        <div id="gv_frequency-container" class="row mb-2">
            <div class="col-5 air_select_label" style="padding:0; width: 30%; text-align: right; ">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;"><a href="https://gnomad.broadinstitute.org/about" target="_blank">gnomAD</a> frequency threshold:</span>
            </div>
            <div class="col">
                <input type="text" class="textfield" value="0.1" id="gv_frequency" onkeypress="return isNumber(event)" />
            </div>
        </div>

        <button type="button" id="gv_getConsequences" class="air_btn btn btn-block mt-4 mb-5">Predict Variant Consequences</button>

        <div id="gv_impactselect-container" class="air_disabledbutton row mb-4 mt-4">
            <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right;">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Impact Filter:</span>
            </div>
            <div class="col">
                <select id="gv_impactselect" class="browser-default om_select custom-select">
                    <option value="0" selected>Any</option>
                    <option value="4">High</option>
                    <option value="3">Moderate</option>
                    <option value="2">Modifier</option>
                    <option value="1">Low</option>
                </select>
            </div>
        </div>
        
        <table style="width:100%" id="gv_table_cons" cellspacing=0>
        </table>
        <button type="button" id="gv_resetConsequences" class="air_btn btn btn-block mt-2 mb-2">Reset Outputs</button>
        <button id="gv_btn_download" class="om_btn_download btn mt-2 mb-4" style="width:100%"> <i class="fa fa-download"></i> Download results as .txt</button>
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

        <button type="button" id="gv_addoverlay" class="air_btn btn btn-block mt-4 mb-5">Create Overlay</button>

    `).appendTo(globals.gv_container);


    $('#gv_btn_download').on('click', function() {

        var _text = "gene\t" + globals.variant.samples.join("\t") + "\n";

        for(var m in globals.variant.mutation_results)
        {
            _text += AIR.Molecules[m].name;
            for(var sample in globals.variant.samples)
            {
                switch(globals.variant.impacts.indexOf(globals.variant.mutation_results[m][sample].impact))
                {
                    case 4: _text += "\t-1"; break;
                    case 3: _text += "\t-0.5"; break;
                    default: _text += "\t0"; break;
                }
            }
            _text += "\n";
        }
        air_download('VariantEffectResults.txt', _text)
    });

    $('#gv_typeselect').on('change', async function() {
        globals.variant.selected_ttype = globals.variant.transcriptfilter[this.value];
        globals.variant.gv_table.clear();
        await gv_createTable()
    });

    $('#gv_impactselect').on('change', set_cons_table);
    
    $('.air_btn_info[data-toggle="popover"]').popover()

    var t1 = performance.now()
    console.log("Call to AirGenvar took " + (t1 - t0) + " milliseconds.")
    
    $('#gv_readfile').on('click', async function() {

        var _negativeStrand = document.getElementById("gv_checkbox_strand").checked
        var genome = $('#gv_genomeselect').val()
        globals.variant.mutation_results = {}
        
        if(globals.variant.analyzed_genome != genome || globals.variant.negativeStrand != _negativeStrand)
        {            
            globals.variant.transcripts = null;
            globals.variant.index_db = {};
            globals.variant.analyzed_genome = genome
            globals.variant.negativeStrand = _negativeStrand

            $("#gv_elementfilter").val("");
        }
        if(!globals.variant.vep_results.hasOwnProperty(globals.variant.analyzed_genome))
        {
            globals.variant.vep_results[globals.variant.analyzed_genome] = {};
        }
        if(globals.variant.transcripts == null)
        {
            var _text = disablebutton("gv_readfile")
            var client = new XMLHttpRequest();

            client.open('GET', fileURL + '/' + genome + '_genome.json');
            client.onreadystatechange = async function() {
                if (this.readyState == 4)
                {
                    if(this.status == 200) {
                        var output = client.responseText;
                        output = replaceAll(output, "ß", '"},"');
                        output = replaceAll(output, "ü", '":{"');
                        output = replaceAll(output, "ä", '":"');
                        output = replaceAll(output, "q", '","');
                        output = replaceAll(output, "ö", '"},{"');
                        var _data = JSON.parse(output)
                        globals.variant.transcripts = [];
                        for(var m in _data)
                        {
                            for(var _id in _data[m])
                            {
                                var _temp = _data[m][_id];
                                if(_temp.p == true || globals.variant.negativeStrand == true)
                                {
                                    _temp["m"] = m;
                                    globals.variant.transcripts.push(_temp)
                                }
                            }
                        }
                        disablebutton("gv_readfile", progress = true);           
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
            disablebutton("gv_readfile", progress = true);    

            globals.variant.gv_results = {};
            globals.variant.samples = [];

            var files = Array.from(document.getElementById("gv_inputId").files);
            for (const file of files) {
                await readfile(file, max = files.length)
            }

            enablebtn("gv_readfile", "Read VCF")
            gv_createTable()   
        }

    });

    async function readfile(file, max = 1)
    {        
        if(!file)
        {
            return;  
        }
        var tbiVCFParser = null;

        var file_name = file.name;
        if(file_name.includes("."))
            file_name = file_name.substr(0, file_name.lastIndexOf("."));

        globals.variant.samples.push(file_name)
        var number = globals.variant.samples.length - 1;

        var headers = [];
        var fileSize   = file.size;
        var chunkSize  = 1048576; // bytes
        var offset     = 0;
        var chunkReaderBlock = null;

        var chunkcount = fileSize/chunkSize;
        var count = 0;

        async function readlines(_text) {
            if(offset + chunkSize < fileSize)
            {
                _text = _text.substr(0, _text.lastIndexOf("\n"));
            }
            offset += _text.length; // callback for handling read chunk
            _text.split('\n').forEach(async function(line) {

                if(line == "")
                {
                    return;
                }
                if(line.startsWith("#"))
                {
                    headers.push(line)
                }
                else
                {
                    if(tbiVCFParser == null)
                    {
                        tbiVCFParser = new VCF({ header: headers.join("\r") })
                    }
                    
                    await readvcfline(line);
                }
            })
            
            if (offset >= fileSize) {
                console.log("Done reading file");
                return;
            }

            // of to the next chunk
            await chunkReaderBlock(offset, chunkSize, file);
        }

        chunkReaderBlock = async function(_offset, length, _file) {
            await updateProgress(count++, chunkcount, "gv_readfile", text = " of file " + (number + 1) + "/" + max)
            var blob = _file.slice(_offset, length + _offset);
            var _text = await readFileAsync(blob)
            await readlines(_text);
        }

        // now var's start the read with the first block
        await chunkReaderBlock(offset, chunkSize, file);

        function readFileAsync(blob) {
            return new Promise((resolve, reject) => {
              var reader = new FileReader();
          
              reader.onload = function (evt)  {
                  
                if (evt.target.error == null) {
                    resolve(evt.target.result);
                }
                else
                {
                    resolve("")
                }
              };
          
              reader.onerror = reject;
          
              reader.readAsText(blob);
            })
          }

        async function readvcfline(line) {

            if(tbiVCFParser == null)
            {
                return;
            }
            var variant = tbiVCFParser.parseLine(line);
            if(!variant)
                return;
            var results =  await getTranscripts(variant["CHROM"], variant["POS"]);
            if(results.length)
            {
                var variantstring = [variant["CHROM"], variant["POS"], variant["ALT"], variant["REF"]].join("$")
                var variantid = -1;
                if(globals.variant.variants_temp.hasOwnProperty(variantstring))
                {
                    variantid = globals.variant.variants_temp[variantstring];
                }
                else
                {
                    globals.variant.variants.push(variant);
                    variantid = globals.variant.variants.indexOf(variant);
                    globals.variant.variants_temp[variantstring] = variantid
                }
                results.forEach(function(transcriptid) {
                    if(transcriptid == null)
                        return;
                    
                    var transcript = globals.variant.transcripts[transcriptid]
                    var molecule = transcript["m"]

                    if(!globals.variant.gv_results.hasOwnProperty(number))
                    {
                        globals.variant.gv_results[number] = {}
                    }
                    if(!globals.variant.gv_results[number].hasOwnProperty(molecule))
                    {
                        globals.variant.gv_results[number][molecule] = {}
                    }
                    if(!globals.variant.gv_results[number][molecule].hasOwnProperty(transcriptid))
                    {
                        globals.variant.gv_results[number][molecule][transcriptid] = []
                    }

                    globals.variant.gv_results[number][molecule][transcriptid].push(variantid);

                });
            }
        }     
        
    }

    $('#gv_addoverlay').on('click', async function() {
        
        var text = await disablebutton("gv_addoverlay"); 
        var olname = $("#gv_olname").val();
        globals.specialCharacters.forEach(c => {
            olname = olname.replaceAll(c, "");
        })
    
        if(olname == "")
        {
            alert("Please specify a name for the overlay.");
            enablebtn("gv_addoverlay", text);
            return;
        }
        for(var sample in globals.variant.samples)
        {            
            await air_addoverlay(olname + "_" + globals.variant.samples[sample], gv_contentString, sample)
        }

        enablebtn("gv_addoverlay", text);
    });

    $('#gv_getConsequences').on('click', getConsequences);

    $('#gv_resetConsequences').on('click', function() {
        $("#gv_table_cons").parents(".dataTables_scrollBody").css({
            minHeight: "0px",
        });
        globals.variant.mutation_results = {};
        globals.variant.gv_table_cons.clear();
        globals.variant.gv_table_cons.columns.adjust().draw();
    });

    $('#gv_reset').on('click', async function() {
        globals.variant.selected_elements = new Set()
        globals.variant.gv_table.rows().every( function () {
            var row = this.nodes().to$()
            row.find('.gv_clickCBinTable').prop('checked', false)
        } );

        $("#gv_elementfilter").val("");
        $("#gv_elementnumbers").html(0);
    });

    $('#gv_selectmapelements').on('click', async function() {
        
        globals.variant.selected_elements = new Set()
        var _idset = new Set()
        for(var sample in globals.variant.samples)
        {
            for(var element in globals.variant.gv_results[sample])
            {
                if(AIR.MapElements.hasOwnProperty(AIR.Molecules[element].name.toLowerCase()))
                {
                    globals.variant.selected_elements.add(AIR.Molecules[element].name)
                    _idset.add(element)
                }
            }
        }
        var _ids = Array.from(_idset);
        globals.variant.gv_table.rows().every( function () {
            var row = this.nodes().to$()
            if(_ids.includes(row.attr("id")))
            {
                row.find('.gv_clickCBinTable').prop('checked', true)
            }
            else
            {
                row.find('.gv_clickCBinTable').prop('checked', false)
            }
        } );

        updateElementInput();
    });

    $("#gv_elementfilter").on("input", function(){
        globals.variant.selected_elements = new Set()
        var _ids = [];
        if($(this).val().trim() == "")
        {
            $("#gv_elementnumbers").html(0);
        }
        else
        {
            var array = $(this).val().split(",")
            $("#gv_elementnumbers").html(array.length);
            var _idset = new Set()
            for(var element of array)
            {
                
                if(AIR.ElementNames.name.hasOwnProperty(element.toLowerCase().trim()))
                {
                    var m = AIR.ElementNames.name[element.toLowerCase().trim()];
                    _idset.add(m)
                    globals.variant.selected_elements.add(AIR.Molecules[m].name)
                }
                else 
                {
                    globals.variant.selected_elements.add(element.trim())
                }
            }
            _ids = Array.from(_idset);
        }
        globals.variant.gv_table.rows().every( function () {
            var row = this.nodes().to$()
            if(_ids.includes(row.attr("id")))
            {
                row.find('.gv_clickCBinTable').prop('checked', true)
            }
            else
            {
                row.find('.gv_clickCBinTable').prop('checked', false)
            }
        } );
    });
}


function gv_contentString()
{
    var olfilter = $("#gv_overlayselect").val();
    var output = '';

    if(olfilter == 2)
    {
        for (var m in globals.variant.mutation_results)
        {
            output += `%0A${AIR.Molecules[m].name}`;
            switch(globals.variant.mutation_results[m][sample].impact)
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
        var _values = {};

        for (var m in globals.variant.gv_results[sample])
        {            
            if(olfilter == 0)
            {
                _values[encodeURIComponent(AIR.Molecules[m].name)] = Object.keys(globals.variant.gv_results[sample][m]).length;
            }
            else if (olfilter == 1)
            {
                var _value = new Set();
                for (var t in globals.variant.gv_results[sample][m])
                { 
                    globals.variant.gv_results[sample][m][t].forEach(v => {
                        _value.add(v)
                    })
                }
                _values[encodeURIComponent(AIR.Molecules[m].name)] = Array.from(_value).length;
            }
        }


        var _max = _values[Object.keys(_values).reduce((a, b) => _values[a] > _values[b] ? a : b)];

        for (var m in _values)
        {
            var _value = _max != 0? _values[m]/Math.abs(_max) : 0
            var hex = rgbToHex((1 - Math.abs(_value)) * 255);
            output += `%0A${m}`;
            if (_value > 0)
                output += '%09%23ff' + hex + hex;
            else if (_value < 0)
                output += '%09%23' + hex + hex + 'ff';
            else output += '%09%23ffffff';
        };
    }   

    return output;
}

$(document).on('change', '.gv_clickCBinTable',function () {
    if ($(this).prop('checked') === true) {
        globals.variant.selected_elements.add(AIR.Molecules[$(this).attr('data')].name);
    }
    else {
        globals.variant.selected_elements.delete(AIR.Molecules[$(this).attr('data')].name);
    }   
    updateElementInput()
})

function updateElementInput()
{
    $("#gv_elementfilter").val(Array.from(globals.variant.selected_elements).join(", "));
    $("#gv_elementnumbers").html(Array.from(globals.variant.selected_elements).length);
}

async function getConsequences()
{
    var _text = await disablebutton("gv_getConsequences", progress = true)

    var count = 0;
    var totallength = 0;
    var input = $("#gv_elementfilter").val().trim();
    var _elements = {}
    var _elementids = new Set()
    var frequency_th = parseFloat($("#gv_frequency").val().replace(',', '.'))

    if(input == "")
    {
        if (confirm('Are you sure you want to predict consequences for all variants? This will take a long time. Otherwise specify element names in the text box.')) 
        {
            for(var m in globals.variant.gv_results[selectedsample()])
            {
                _elementids.add(m);
            }

        } else {
            $('#gv_impactselect-container').removeClass("air_disabledbutton")
            enablebtn("gv_getConsequences", _text)
            return;
        }
    }
    else
    {
        input.split(",").forEach(_e => 
        {
            var e = _e.trim().toLowerCase();
            if(AIR.ElementNames.name.hasOwnProperty(e))
            {
                _elementids.add(AIR.ElementNames.name[e])
            }
        });
    }
    for(var e in globals.variant.mutation_results)
    {
        _elementids.add(e);
    }
    for(sample in globals.variant.samples)
    {
        for(var element of Array.from(_elementids))
        {
            var _variants = {}
            for(var t in globals.variant.gv_results[sample][element])
            {
                if(validTranscript(t))
                {
                    globals.variant.gv_results[sample][element][t].forEach(v => 
                    {
                    
                        if(!_variants.hasOwnProperty(v))
                        {
                            _variants[v] = new Set()
                        }
                        _variants[v].add(globals.variant.transcripts[t].r)
                    });
                }
            }
            totallength += Object.keys(_variants).length;
            _elements[element] = _variants;
        }
        for(var m in _elements)
        {
            var element_result = await getMutations(m, sample);
            if(!globals.variant.mutation_results.hasOwnProperty(m))
            {
                globals.variant.mutation_results[m] = {}
            }
            globals.variant.mutation_results[m][sample] = {"variants": element_result};     
        }
    }

    set_cons_table()
    $('#gv_impactselect-container').removeClass("air_disabledbutton")
    $("#gv_getConsequences").html('Predict Variant Consequences').removeClass("air_disabledbutton");
    enablebtn("gv_getConsequences", _text)
    async function getMutations(m, sample)
    {
        var variant_promises = [];
        var variant_results = [];
        var iterations = Object.keys(_elements[m]).length;
        for(var v in _elements[m])
        {                    
            var last = !--iterations;
            variant_promises.push(getConsequencesFromVariant(v, Array.from(_elements[m][v])).then(r => 
                {
                    variant_results = variant_results.concat(r)
                }).finally(r => {     
                    updateProgress(count++, totallength, "gv_getConsequences", "  for sample " + (parseFloat(sample) + 1) + "/" + globals.variant.samples.length)
            }));

            
            if (last || variant_promises.length >= 20)
            {
                await Promise.allSettled(variant_promises).catch(e => {
                    console.log(e);
                }).finally(r => {
                    variant_promises = [];
                });
            }
        }

        return variant_results;
            
        function getConsequencesFromVariant(v, tIDs)
        {
            return new Promise((resolve, reject) => {

                var variant = globals.variant.variants[v]
                var p = variant["POS"]
                var a = variant["ALT"]
                var r = variant["REF"]
                var c = variant["CHROM"]
                var _result = []

                if(r.length != 1)
                {
                    resolve([])
                }
                else
                {
                    var response = {};
                    if(globals.variant.vep_results[globals.variant.analyzed_genome].hasOwnProperty(v))
                    {
                        response = globals.variant.vep_results[globals.variant.analyzed_genome][v];
                        analyzeVEPoutput(response)
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
    
                                    response =  JSON.parse(client.responseText)[0];
                                    globals.variant.vep_results[globals.variant.analyzed_genome][v] = response;
                                    analyzeVEPoutput(response)
    
                                }
                                else
                                {
                                    console.log(client.responseText)
                                    resolve(_result)
                                }
                            }
                        }
                        client.send();
                    }
                };

                function analyzeVEPoutput(response)
                {
                    if(response.hasOwnProperty("transcript_consequences"))
                    {
                        for(var _cons in response["transcript_consequences"])
                        {
                            var breakflag = false;
                            if(response["transcript_consequences"][_cons].hasOwnProperty("transcript_id"))
                            {
                                if(tIDs.includes(response["transcript_consequences"][_cons]["transcript_id"]))
                                {
                                    var _temp = response["transcript_consequences"][_cons]
                                    _temp["most_severe_consequence"] = response["most_severe_consequence"]
                                    _temp["position"] = p
                                    _temp["frequency"] = NaN
                                    _temp["id"] = ""
                                    _temp["pubmed"] = []
                                    if(response.hasOwnProperty("colocated_variants"))
                                    {
                                        for(var _variant in response.colocated_variants)
                                        {
                                            if(response.colocated_variants[_variant].hasOwnProperty("id"))
                                            {
                                                _temp["id"] = response.colocated_variants[_variant].id
                                            }
                                            if(response.colocated_variants[_variant].hasOwnProperty("pubmed"))
                                            {
                                                _temp["pubmed"] = response.colocated_variants[_variant].pubmed
                                            }
                                            if(response.colocated_variants[_variant].hasOwnProperty("start"))
                                            {
                                                if(p = response.colocated_variants[_variant].start)
                                                {
                                                    if(response.colocated_variants[_variant].hasOwnProperty("frequencies"))
                                                    {
                                                        if(response.colocated_variants[_variant].frequencies.hasOwnProperty(a))
                                                        {
                                                            if(response.colocated_variants[_variant].frequencies[a].hasOwnProperty("gnomad"))
                                                            {    
                                                                if(response.colocated_variants[_variant].frequencies[a].gnomad >= frequency_th)
                                                                {
                                                                    breakflag = true;
                                                                }
                                                            
                                                                _temp["frequency"] = response.colocated_variants[_variant].frequencies[a].gnomad
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    if(breakflag)
                                        continue;
                                    _result.push(_temp);

                                }
                            }
                        }

                        resolve(_result)

                    }
                }
            });
        }
    }
}

function set_cons_table()
{
    var selected_impact = $("#gv_impactselect").val()

    if(globals.variant.gv_table_cons)
    {
        globals.variant.gv_table_cons.destroy();
    }
    $("#gv_table_cons").empty()

    var tbl = document.getElementById('gv_table_cons');

    _elementnames = []
    for(var m in globals.variant.mutation_results)
    {
        var result_row = tbl.insertRow(tbl.rows.length);
        createLinkCell(result_row, 'td', AIR.Molecules[m].name, 'col-3', 'center');
        var break_flag = true;

        for (var sample in globals.variant.samples)
        {
            var element_result = globals.variant.mutation_results[m][sample].variants;
            var impact = 0;
            var consequences = new Set()

            for(var t in element_result)
            {

                var _impact = globals.variant.impacts.indexOf(element_result[t]["impact"])
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
            if(selected_impact == impact || selected_impact == 0)
            {
                break_flag = false;
            }
            globals.variant.mutation_results[m][sample]["impact"] = globals.variant.impacts[impact];
            globals.variant.mutation_results[m][sample]["consequences"] = Array.from(consequences);

            var cell = createPopupCell(result_row, 'td', globals.variant.impacts[impact], 'col-3', 'center', gv_create_cons_popup, {"element": m, "sample": sample});
            cell.setAttribute("data-order", impact);
            switch(impact)
            {
                case 4: $(cell).addClass('air_red'); break;
                case 3: $(cell).addClass('air_yellow'); break;
                case 1: $(cell).addClass('air_green'); break;
                case 2: $(cell).addClass('air_gray'); break;
                default: break;
            }
    
        }

        if(break_flag)
        {
            result_row.parentNode.removeChild(result_row);
        }
        else
        {
            _elementnames.push(AIR.Molecules[m].name)
        }

    }

    var header = tbl.createTHead();
    var headerrow = header.insertRow(0);
 
    createCell(headerrow, 'th', 'Gene', 'col-3', 'col', 'center');

    for(var _id in globals.variant.samples)
    {
        createCell(headerrow, 'th', globals.variant.samples[_id], 'col-3', 'col', 'center');
    }

    globals.variant.gv_table_cons = $('#gv_table_cons').DataTable({
        "order": [[ 0, "asc" ]], 
        "scrollX": true,
        "autoWidth": true,
        "autoHeight": false,
        "rowHeight" : "37px",
    }).columns.adjust().draw();
    
    highlightSelected(_elementnames);
}

async function gv_createTable() 
{
    if(globals.variant.gv_table)
    {
        globals.variant.gv_table.destroy();
    }

    $("#gv_table").empty()

    var tbl = document.getElementById('gv_table');
    var tbl_data = {};
    for(var sample in globals.variant.samples)
    {
        for(var m in globals.variant.gv_results[sample])
        {
            if(!tbl_data.hasOwnProperty(m))
            {
                tbl_data[m] = {
                    "transcripts": new Set(),
                    "chromosome": "",
                    "samples": {}
                }
            }
            tbl_data[m].samples[sample] = new Set()

            for(var t in globals.variant.gv_results[sample][m])
            {
                if(validTranscript(t))
                {
                    tbl_data[m].chromosome = globals.variant.transcripts[t].c
                    tbl_data[m].transcripts.add(t);
                    globals.variant.gv_results[sample][m][t].forEach(variant => tbl_data[m].samples[sample].add(variant))
                }
            }
        }
    }
        
    for(var m in tbl_data)
    {
        if(Array.from(tbl_data[m].transcripts).length == 0)
            continue;
        var result_row = tbl.insertRow(tbl.rows.length);
        result_row.setAttribute("id", m);
        checkBoxCell(result_row, 'th', "", m, 'center', "gv_");
        createLinkCell(result_row, 'td', AIR.Molecules[m].name, 'col-3', 'center');
        createCell(result_row, 'td', tbl_data[m].chromosome, 'col-3', '', 'center');
        createCell(result_row, 'td', Array.from(tbl_data[m].transcripts).length, 'col-3', '', 'center');

        for(var _id in globals.variant.samples)
        {
            if(tbl_data[m].samples.hasOwnProperty(_id))
            {
                createPopupCell(result_row, 'td', Array.from(tbl_data[m].samples[_id]).length, 'col-3', 'center', gv_create_table_popup, {"element": m, "sample": _id});
            }
            else 
            {
                createPopupCell(result_row, 'td', 0, 'col-3', 'center', gv_create_table_popup, {"element": m, "sample": _id});
            }

        }
    }
        
    var header = tbl.createTHead();
    var headerrow = header.insertRow(0);

    createCell(headerrow, 'th', '', 'col-3', 'col', 'center');  
    createCell(headerrow, 'th', 'Gene', 'col-3', 'col', 'center');
    createCell(headerrow, 'th', 'Chrom.', 'col-3', 'col', 'center');
    createCell(headerrow, 'th', '#Transcripts', 'col-3', 'col', 'center');

    for(var _id in globals.variant.samples)
    {
        createCell(headerrow, 'th', globals.variant.samples[_id], 'col-3', 'col', 'center');
    }

    globals.variant.gv_table = $('#gv_table').DataTable({
        "order": [[ 1, "asc" ]], 
        "scrollX": true,
        "autoWidth": true
    }).columns.adjust();


    globals.variant.gv_table.columns.adjust().draw();
}
function validTranscript(t)
{
    if(globals.variant.transcripts[t].t == globals.variant.selected_ttype)
    {
        return true;
    }
    else {
        return false;
    }
}
async function buildIndexDatabase() 
{
    for(var _id in globals.variant.transcripts)
    {
        var chromosome = globals.variant.transcripts[_id]["c"];
        var start = globals.variant.transcripts[_id]["s"]
        var end = globals.variant.transcripts[_id]["e"]

        if(!globals.variant.index_db.hasOwnProperty(chromosome))
        {
            globals.variant.index_db[chromosome] = {}
            globals.variant.index_db[chromosome]["largest"] = {}
            globals.variant.index_db[chromosome]["large"] = {}
            globals.variant.index_db[chromosome]["long"] = {}
            globals.variant.index_db[chromosome]["middle"] = {}
            globals.variant.index_db[chromosome]["short"] = {}
        }

        var  range = (end - start)
        if(range >= 1000000)
        {
            createIndexDictionary(globals.variant.index_db[chromosome].largest, start, end, _id, 7, 7)
        }
        else if(range >= 100000)
        {
            createIndexDictionary(globals.variant.index_db[chromosome].large, start, end, _id, 7, 6)
        }
        else if(range >= 10000)
        {
            createIndexDictionary(globals.variant.index_db[chromosome].long, start, end, _id, 7, 5)
        }
        else if (range >= 1000)
        {
            createIndexDictionary(globals.variant.index_db[chromosome].middle, start, end, _id, 7, 4)
        }
        else {
            createIndexDictionary(globals.variant.index_db[chromosome].short, start, end, _id, 7, 3)
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

            var factor = Math.pow(10, p)
            var step = Math.floor(start/ factor) * factor

            if(!dict.hasOwnProperty(step))
            {
                dict[step] = {}
            }
            createIndexDictionary(dict[step], start, end, _id, p - 1 , min)
        }
            
        if(_id % 1000 == 0)
            await updateProgress(_id, globals.variant.transcripts.length, "gv_readfile", " Buiilding index database...")
    }
}

async function getTranscripts(chr, position)
{
    return new Promise(resolve => {

        if(!globals.variant.index_db.hasOwnProperty(chr))
            resolve([]);


        var results = new Set();

        [
            getRangeDictionaries(globals.variant.index_db[chr].largest, 1),
            getRangeDictionaries(globals.variant.index_db[chr].large, 2),
            getRangeDictionaries(globals.variant.index_db[chr].long, 3),
            getRangeDictionaries(globals.variant.index_db[chr].middle, 4),
            getRangeDictionaries(globals.variant.index_db[chr].short, 5)
        
        ].forEach(current_dicts =>
            {
                current_dicts.forEach(current_dict => 
                {
                    Object.keys(current_dict).map(Number).filter(function(start) { return start <= position; }).forEach(s_pos =>
                    {
                        Object.keys(current_dict[s_pos]).map(Number).filter(function(end) { return end >= position; }).forEach(e_pos =>
                        {
                            current_dict[s_pos][e_pos].forEach(_id => results.add(_id))
                        });
                    });
                });
            });

        resolve(Array.from(results))

        function getRangeDictionaries(dict, iterations)
        {
            var breakflag = true;
            var current_dicts = [dict]
            var _array = undefined;    
            for (var i = 1; i <= iterations; i++) {
                var new_dicts = []
                current_dicts.forEach(current_dict => 
                {
                    _array = Object.keys(current_dict).map(Number).filter(function(x) { return x <= position; }).sort(function(a, b){return a-b});
                    if(_array.length > 0)
                    {
                        if(i == iterations)
                            breakflag = false;
                        
                        var laststep = _array[_array.length - 1]
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

function gv_create_table_popup(button, parameters) {
    var $target = $('#gv_table_popover');
    var $btn = $(button);

    var m = parameters.element;
    var sample = parameters.sample;

    if($target)
    {
        
        
        $('#gv_clickedpopupcell').css('background-color', 'transparent');
        $('#gv_clickedpopupcell').removeAttr('id');

        if($target.siblings().is($btn))
        {
            $target.remove();
            return;
        }   
        $target.remove();

    }

    $(button).attr('id', 'gv_clickedpopupcell');
    $(button).css('background-color', 'lightgray');

    $target = $(`<div id="gv_table_popover" class="popover bottom in" style="max-width: none; top: 40px; z-index: 2;">
                    <div class="arrow" style="left: 9.375%;"></div>
                    <div id="gv_table_popover_content" class="popover-content">
                        <ul class="list-group" id="gv_table_popovr_transcript_list">

                        </ul>
                    </div>
                </div>`);


    $btn.after($target);

    var addedtranscripts = []
    for(var t in globals.variant.gv_results[sample][m])
    {
        if(validTranscript(t))
        {
            var tstring = []
            if(globals.variant.transcripts[t].r != "")
                tstring.push('<a target="_blank" href="https://www.ensembl.org/Homo_sapiens/Transcript/Summary?t=' + globals.variant.transcripts[t].r + '"><span class="fa fa-external-link-alt ml-2"></span>' + globals.variant.transcripts[t].r + '</a>')
                tstring.push(globals.variant.transcripts[t].p == true? "positive":"negative");   
            tstring.push(globals.variant.transcripts[t].t)
            tstring.push("(" + globals.variant.transcripts[t].s + ' <i class="fas fa-arrow-right"></i> ' + globals.variant.transcripts[t].e + ")")  

            if(addedtranscripts.includes(tstring.join("$")))
            {
                continue;
            }
            addedtranscripts.push(tstring.join("$"))

            var vstring = []
            {
                for(var v in globals.variant.gv_results[sample][m][t])
                {    
                    var variant = globals.variant.variants[v];
                    vstring.push('<li class="list-group-item d-flex justify-content-between align-items-center">' + variant["POS"] + ": " + variant["REF"] + ' <i class="fas fa-arrow-right"></i> ' + variant["ALT"] + "</li>");
                }
            }
            if(vstring.length > 0)
            {
                $(`
                <li class="air_collapsible_smallgrey list-group-item d-flex justify-content-between align-items-center"> ${tstring.join(" ")}<span class="badge badge-primary badge-pill">${vstring.length}</span></button></li>
                <ul class="air_collapsible_content list-group">
                    ${vstring.join("")}
                </ul>    
                `).appendTo("#gv_table_popovr_transcript_list");
            }
        }
       
    }

    var coll = document.getElementById("gv_table_popover_content").getElementsByClassName("air_collapsible_smallgrey");
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

    $target.show();
};

function gv_create_cons_popup(button, parameters) {
    var $target = $('#gv_cons_popover');
    var $btn = $(button);

    var m = parameters.element;
    var sample = parameters.sample;

    if($target)
    {        
        $('#gv_clickedpopupcell').css('border', 'none');
        $('#gv_clickedpopupcell').removeAttr('id');

        $("#gv_table_cons").parents(".dataTables_scrollBody").css({
            minHeight: "0px",
        });

        if($btn.siblings().is($target))
        {
            $target.remove();
            return;
        }   
        $target.remove();
    }

    $(button).attr('id', 'gv_clickedpopupcell');
    $(button).css('border', '2px solid black');

    $target = $(`<div id="gv_cons_popover" class="popover bottom in" style="max-width: none; top: 40px; z-index: 2;">
                    <div class="arrow" style="left: 9.375%;"></div>
                    <div id="gv_cons_popover_content" class="popover-content">
                    <table style="width:100%" class="air_table table nowrap table-sm" id="gv_cons_sub_table" cellspacing="0">
                        <thead>
                            <tr>
                                <th style="vertical-align: middle;"></th>
                                <th style="vertical-align: middle;">Impact</th>
                                <th style="vertical-align: middle;">Frequency</th>
                                <th style="vertical-align: middle;">Consequence</th>
                                <th style="vertical-align: middle;">References</th>
                            </tr>
                        </thead>
                    </table>
                    </div>
                </div>`);


    $btn.after($target);

    $("#gv_cons_sub_table").empty()

    var tbl = document.getElementById('gv_cons_sub_table');

    var element_result = globals.variant.mutation_results[m][sample].variants;

    var addedrows = [];

    for(var t in element_result)
    {
        var rowcontent = [];
        rowcontent.push('<a target="_blank" href="https://www.ncbi.nlm.nih.gov/snp/' + element_result[t].id + '"><span class="fa fa-external-link-alt ml-2"></span></a>');
        rowcontent.push(element_result[t]["impact"])
        rowcontent.push(element_result[t]["most_severe_consequence"]);
        rowcontent.push(isNaN(element_result[t].frequency) ? "N/A":element_result[t].frequency);

        var pubmeds = [];
        for(var p of element_result[t].pubmed) 
            pubmeds.push('<a target="_blank" href="https://pubmed.ncbi.nlm.nih.gov/' + p + '">' + p + '</a>')

        rowcontent.push(pubmeds.join(", "));
        
        if(addedrows.includes(rowcontent.join("$")))
        {
            continue;
        }
        addedrows.push(rowcontent.join("$"))

        var result_row = tbl.insertRow(tbl.rows.length);
        result_row.setAttribute("id", m);

        createCell(result_row, 'td', rowcontent[0], 'col-3', '', 'center');

        var impact = globals.variant.impacts.indexOf(element_result[t]["impact"])

        var cell = createCell(result_row, 'td', rowcontent[1], 'col-3', '', 'center');

        cell.setAttribute("data-order", impact);
        switch(impact)
            {
                case 4: $(cell).addClass('air_red'); break;
                case 3: $(cell).addClass('air_yellow'); break;
                case 1: $(cell).addClass('air_green'); break;
                case 2: $(cell).addClass('air_gray'); break;
                default: break;
            }


        createCell(result_row, 'td', rowcontent[2], 'col-3', '', 'center');
        createCell(result_row, 'td', rowcontent[3], 'col-3', '', 'center');
        createCell(result_row, 'td', rowcontent[4], 'col-3', '', 'center');
            
    }
    

    var header = tbl.createTHead();
    var headerrow = header.insertRow(0);

    createCell(headerrow, 'th', '', 'col-3', 'col', 'center');  
    createCell(headerrow, 'th', 'Impact', 'col-3', 'col', 'center');
    createCell(headerrow, 'th', 'Consequence', 'col-3', 'col', 'center');
    createCell(headerrow, 'th', 'Frequency', 'col-3', 'col', 'center');
    createCell(headerrow, 'th', 'References', 'col-3', 'col', 'center');

    var popupheight = $("#gv_cons_popover_content").height() + 50;
    $("#gv_table_cons").parents(".dataTables_scrollBody").css({
        minHeight: (popupheight > 400? 400 : popupheight) + "px",
    });
   
    $('#gv_cons_sub_table').DataTable({
        "order": [[ 1, "desc" ]], 
        "scrollX": true,
        "autoWidth": true,
    }).columns.adjust().draw();

    $target.show();
};


