let elementsingraph = [];
let elementssources = [];
let staedystates = []
let knockedout = false

let foodcolors = {
    "undernourished": "#ff0000",
    "overnourished": "#0000ff",
    "well-nourished": "#00ff00",
    "custom": "#000000"
}
let foodarrays = {
    "undernourished": Array(5).fill(true).concat(Array(25).fill(false)),
    "overnourished": Array(5).fill(true).concat(Array(2).fill(false)),
    "well-nourished": Array(5).fill(true).concat(Array(10).fill(false))
}

async function AirBoolean() {

    $("#airboolean_tab_content").append(`
        <div class="mb-2 mt-2" style="overflow: hidden; width: 100%; white-space: nowrap;">
            <span id="air_bool_steps" class="col-md-2 control-label" style="vertical-align: sub;font-size: 15px;">Current Step: 0</span>
            <button id="air_reset_btn" style="float: right; width:20%" type="button" class="air_btn_light btn btn-block" title="Reset to original state (equal to page reload).">Full Reset</button>
            <button id="air_reset_steps_btn" style="float: right; width:20%" type="button" class="air_btn_light btn mr-1" title="Reset steps only and keep perturbed elements.">Reset Steps</button>            
        </div>
        <div>
            <span style="display: inline-block;width: 30%">
                    <input type="checkbox" class="air_checkbox" id="air_cb_undernour_step">
                    <label class="air_checkbox air_checkbox_label" for="air_cb_undernour_step" title="Long fasting periods with complete glycogen depletion.">Undernourished</label>
            </span>
            <span style="display: inline-block;width: 30%">
                    <input type="checkbox" class="air_checkbox" id="air_cb_wellnour_step" checked>
                    <label class="air_checkbox air_checkbox_label" for="air_cb_wellnour_step" title="Average food intake frequency - dependent on glycogen.">Well-nourished</label>
            </span>
            <span style="display: inline-block;width: 30%">
                    <input type="checkbox" class="air_checkbox" id="air_cb_overnour_step">
                    <label class="air_checkbox air_checkbox_label" for="air_cb_overnour_step" title="High food intake frequency - independent of glycogen.">Overnourished</label>
            </span>
        </div>
        <div class="row mt-2 mb-4">
            <div class="col-auto air_select_label" style="padding:0; width: 50%; text-align: right; ">
                <span style="display: inline-block">
                    <input type="checkbox" class="air_checkbox" id="air_cb_customnour_step">
                    <label class="air_checkbox air_checkbox_label" for="air_cb_customnour_step">Custom Food Intake Frequence:</label>
                </span>
            </div>
            <div class="col">
                <input type="text" class="textfield" value="" placeholder="e.g. 111000" id="sp_bl_foodintake_step"/>
            </div>
        </div>
        <button id="air_step_btn" type="button" class="air_btn btn btn-block mb-4 mt-4">Next Step</button>
        <div class="air_table_background">
            <table id="air_bool_table" cellspacing="0" class="air_table table table-sm" style="width:100%">
                <thead>
                    <tr>
                        <th style="vertical-align: middle;">Element</th>
                        <th style="vertical-align: middle;">Compartment</th>
                        <th style="vertical-align: middle;">State</th>
                        <th style="vertical-align: middle;">Locked</th>
                        <th style="vertical-align: middle;">Sources</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            </table>
        </div>

        <button class="air_collapsible mt-4 active">In silico Perturbation (Correlation analysis)</button>
        <div id="air_bool_panel_corr" class="air_collapsible_content" style="max-height: 500px">
            <h4 class="mt-2">Element to perturb:</h4>
            <input type="text" list="air_bool_elementnames_source" style="width: 70%" class="textfield mb-2 mt-2" id="air_bool_element_source" value="intestinal dysfunction (enterocyte)"/>
            <datalist id="air_bool_elementnames_source" style="height:5.1em;overflow:hidden">
            </datalist>
            <div>
                <span style="display: inline-block;width: 35%">
                        <input type="checkbox" class="air_checkbox" id="air_cb_source" checked>
                        <label class="air_checkbox air_checkbox_label" for="air_cb_source">Simulate Activation</label>
                </span>
                <span style="display: inline-block;width: 50%">
                        <input type="checkbox" class="air_checkbox" id="air_cb_target">
                        <label class="air_checkbox air_checkbox_label" for="air_cb_target">Simulate Inhibition</label>
                </span>
            </div>
            <hr>
            <h4>Nutrition States:</h4>
            <div>
                <span style="display: inline-block;width: 30%">
                        <input type="checkbox" class="air_checkbox" id="air_cb_undernour" checked>
                        <label class="air_checkbox air_checkbox_label" for="air_cb_undernour" title="Long fasting periods with complete glycogen depletion.">Undernourished</label>
                </span>
                <span style="display: inline-block;width: 30%">
                        <input type="checkbox" class="air_checkbox" id="air_cb_wellnour" checked>
                        <label class="air_checkbox air_checkbox_label" for="air_cb_wellnour" title="Average food intake frequency - dependent on glycogen.">Well-nourished</label>
                </span>
                <span style="display: inline-block;width: 30%">
                        <input type="checkbox" class="air_checkbox" id="air_cb_overnour" checked>
                        <label class="air_checkbox air_checkbox_label" for="air_cb_overnour" title="High food intake frequency - independent of glycogen.">Overnourished</label>
                </span>
            </div>
            <div class="row mt-2 mb-4">
                <div class="col-auto air_select_label" style="padding:0; width: 50%; text-align: right; ">
                    <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Custom Food Intake Frequence:</span>
                </div>
                <div class="col">
                    <input type="text" class="textfield" value="" placeholder="e.g. 111000" id="sp_bl_foodintake"/>
                </div>
            </div>
            <hr>
            <div class="row mb-4">
                <div class="col-auto air_select_label" style="padding:0; width: 50%; text-align: right; ">
                    <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Number of Steps:</span>
                </div>
                <div class="col">
                    <input type="text" class="textfield" value="100" id="sp_bl_steps"/>
                </div>
            </div>
            <button id="air_bool_corr_btn" type="button" class="air_btn btn btn-block mb-2 mt-2">Start Simulation</button>
            <div class="air_table_background">
                <table id="air_ss_table" cellspacing="0" class="air_table table table-sm" style="width:100%">
                    <thead>
                        <tr>
                            <th style="vertical-align: middle;"></th>
                            <th style="vertical-align: middle;">Impact On</th>
                            <th style="vertical-align: middle;">Compartment</th>
                            <th style="vertical-align: middle;" title="Average correlation among all selected nutrition states.">avg. Corr.</th>
                            <th style="vertical-align: middle;" title="Ten highest ranked mediators by their avarage correlation to both elements.">Strongest Mediators</th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
            </div>
        </div>
        
        <button class="air_collapsible mt-4">Analyze Steady State</button>
        <div id="air_bool_panel_ss" class="air_collapsible_content">
            <button id="air_ss_btn" type="button" class="air_btn btn btn-block mb-4 mt-4">Find Steady State</button>
            <div id="air_bool_ss_graph">
            </div>
        </div>
        
    `);
    await getBooleanPanel()
}

async function getBooleanPanel() {

    globals.air_bool_table = $('#air_bool_table').DataTable({
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
                className: 'dt-right',
            },
            {
                targets: 1,
                className: 'dt-center'
            },
            {
                targets: 2,
                className: 'dt-center',
                "searchable": false,
            },
            {
                targets: 3,
                className: 'dt-center',
                "searchable": false,
            },
            {
                targets: 4,
                className: 'dt-left',
                "searchable": false,
            }
        ]
    }) //.columns.adjust().draw(true);;
    globals.air_ss_table = $('#air_ss_table').DataTable({
        "lengthMenu": [5, 6, 7, 8, 9, 10],
        "order": [[3, "desc"]],
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
                className: 'dt-left'
            },
            {
                targets: 2,
                className: 'dt-left'
            },
            {
                targets: 3,
                className: 'dt-center'
            },
            {
                targets: 4,
                className: 'dt-left',
                searchable: false, 
            },
        ]
    })
    globals.air_ss_table.on( 'search.dt', function () {
        adjustPanels()
    } );
    $(globals.air_bool_table.table().container()).addClass('air_datatable');
    $(globals.air_ss_table.table().container()).addClass('air_datatable');

    $("#air_cb_source").change(function () {
        if(this.checked)
        {    
            $("#air_cb_target").prop("checked", !this.checked);
        }
    });
    $("#air_cb_source").on("click", function (e) {
        if (!$(this).is(":checked")) {
            e.preventDefault();
            return false;
        }
    });
    $("#air_cb_target").change(function () {
        if(this.checked)
        {    
            $("#air_cb_source").prop("checked", !this.checked);
        }
    });
    $("#air_cb_target").on("click", function (e) {
        if (!$(this).is(":checked")) {
            e.preventDefault();
            return false;
        }
    });

    $("#air_cb_undernour_step").change(function () {
        if(this.checked)
        {        
            $("#air_cb_overnour_step").prop("checked", !this.checked);
            $("#air_cb_wellnour_step").prop("checked", !this.checked);
            $("#air_cb_customnour_step").prop("checked", !this.checked);
        }
    });
    $("#air_cb_undernour_step").on("click", function (e) {
        if (!$(this).is(":checked")) {
            e.preventDefault();
            return false;
        }
    });
    $("#air_cb_wellnour_step").change(function () {
        if(this.checked)
        {  
            $("#air_cb_overnour_step").prop("checked", !this.checked);
            $("#air_cb_undernour_step").prop("checked", !this.checked);
            $("#air_cb_customnour_step").prop("checked", !this.checked);
        }
    });
    $("#air_cb_wellnour_step").on("click", function (e) {
        if (!$(this).is(":checked")) {
            e.preventDefault();
            return false;
        }
    });
    $("#air_cb_overnour_step").change(function () {
        if(this.checked)
        { 
            $("#air_cb_wellnour_step").prop("checked", !this.checked);
            $("#air_cb_undernour_step").prop("checked", !this.checked);
            $("#air_cb_customnour_step").prop("checked", !this.checked);
        }
    });
    $("#air_cb_overnour_step").on("click", function (e) {
        if (!$(this).is(":checked")) {
            e.preventDefault();
            return false;
        }
    });
    $("#air_cb_customnour_step").change(function () {
        if(this.checked)
        { 
            $("#air_cb_wellnour_step").prop("checked", !this.checked);
            $("#air_cb_undernour_step").prop("checked", !this.checked);
            $("#air_cb_overnour_step").prop("checked", !this.checked);
        }
    });
    $("#air_cb_customnour_step").on("click", function (e) {
        if (!$(this).is(":checked")) {
            e.preventDefault();
            return false;
        }
    });
    
    $( "#sp_bl_foodintake" ).keypress(function(evt) {
        evt = (evt) ? evt : window.event;
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        if (charCode ==  48 || charCode == 49)
            return true;
    
        return false;
      });

    $( "#sp_bl_steps" ).keypress(function(evt) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if (charCode >=  48 && charCode <= 57)
        return true;

    return false;
    });
    
    $('#air_reset_btn').on('click', setInitialState);

    $('#air_reset_steps_btn').on('click', function() {
        setInitialState(false)
    });

    $('#air_bool_corr_btn').on('click', environmentalSensitivity);

    $('#air_step_btn').on('click', manuelStep)

    $('#air_ss_btn').on('click', findSteadyState)

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

        $("#air_bool_elementnames_source").append(option)
    }

    adjustPanels()

    await setInitialState()
}
async function updateBooleanTable() {
    globals.air_bool_table.rows().every(function (rowIdx, tableLoop, rowLoop) {
        $(this.node()).find("td").each(function () {
            let cell = $($(this).children()[0])

            if (cell.hasClass("air_boolean_state_cb")) {
                cell.prop("checked", AIR.Boolean[cell.attr("data")].active)
            }
            else if (cell.hasClass("air_boolean_locked_cb")) {
                cell.val(AIR.Boolean[cell.attr("data")].locked)
            }
            else if (cell.hasClass("air_boolean_sources")) {
                cell.html(AIR.Boolean[cell.attr("data")].sources.map(s => getLinkIconHTML(s)).join(", "))
            }
            
        });
        //this.invalidate();
    });
    globals.air_bool_table.draw(false);
}

async function setBooleanTable() {
    
    globals.air_bool_table.clear();

    for(let [e, state] of Object.entries(AIR.Boolean))
    {
        globals.air_bool_table.row.add([

            getLinkIconHTML(e),
            AIR.Molecules[e].compartment,
            '<input class="air_boolean_state_cb" data="' + e + '" type="checkbox"' + (state.active? " checked" : "") + ' data-order="' + (state.active? "1" : "0") + '"></input>',
            `<select class="air_boolean_locked_cb air_select custom-select" data="${e}"  type="checkbox" style="width: 80px; background-color: ${globals.lockedcolors[state.locked]}">
                <option value="0" ${state.locked == 0? "selected" : ""} style="background-color: ${globals.lockedcolors[0]}" title="State is checked on every step.">Open</option>
                <option value="1" ${state.locked == 1? "selected" : ""} style="background-color: ${globals.lockedcolors[1]}" title="State can only be changed by diseases.">Partial</option>
                <option value="2" ${state.locked == 2? "selected" : ""} style="background-color: ${globals.lockedcolors[2]}" title="State can not be changed.">Full</option>
            </select>`,
            '<span class="air_boolean_sources" data="' + e + '">' + state.sources.map(s => getLinkIconHTML(s)).join(", ") + '</span>'
        ])
    }
    globals.air_bool_table.draw();
}
async function setInitialState(original = true)
{
    for(let e in AIR.Boolean)
    {
        if(original || AIR.Boolean[e].locked == 0)
        {
            AIR.Boolean[e].active = globals.intitalElements.has(e)? true : false
            AIR.Boolean[e].initial = globals.intitalElements.has(e)? true : false
            AIR.Boolean[e].locked = globals.intitalElements.has(e)? 1 : 0
        }

        AIR.Boolean[e].sources = []
        AIR.Boolean[e].storage = 0
    }
    $("#air_bool_steps").html("Current Step: 0")
    await setBooleanTable();
    await colorState()
}

async function environmentalSensitivity()
{
    let element = $("#air_bool_element_source").val().split(',')[0].toLowerCase().trim()
    if (AIR.ElementNames.fullname.hasOwnProperty(element)) {
        element = AIR.ElementNames.fullname[element]
    }
    else
    {
        return
    }

    let customfood = $("#sp_bl_foodintake").val().split('').filter(c => c == "1" || c == "0").map(c => c == "1"? true : false)
    let selectedfoodarrays = {}

    if($("#air_cb_undernour").prop("checked"))
        selectedfoodarrays["undernourished"] = foodarrays["undernourished"]
    if($("#air_cb_overnour").prop("checked"))
        selectedfoodarrays["overnourished"] = foodarrays["overnourished"]
    if($("#air_cb_wellnour").prop("checked"))
        selectedfoodarrays["well-nourished"] = foodarrays["well-nourished"] 

    if(customfood.length > 0)
    {
        selectedfoodarrays["custom"] = customfood;
    }

    let steps = parseFloat($("#sp_bl_steps").val())
    var knockout = $("#air_cb_target").prop("checked");
    
    var _text = await disablebutton("air_bool_corr_btn", true);

    //globals["activityvalues"] = Object.assign({}, ...[...Array(101).keys()].map((x) => ({[x]: evenDist(new Array(100-x).fill(false), new Array(x).fill(true))})))
    globals["activityvalues"] = Object.assign({}, ...[...Array(101).keys()].map((x) => ({[x]: evenDist(100, x)})))
    globals.corrResults = {}
    globals.air_ss_table.clear();
    let count = 0;

    let originalstate = JSON.stringify(AIR.Boolean)
    
    await setInitialState(false)

    let initialstate = JSON.stringify(AIR.Boolean)

    let results = {}
    for(let [diet, foodarray] of Object.entries(selectedfoodarrays))
    {
        results[diet] = []
        for (let index = 0; index <= 100; index += 5) 
        {
            AIR.Boolean = JSON.parse(initialstate)

            count += 5
            
            await updateProgress(count, 105 * Object.keys(selectedfoodarrays).length, "air_bool_corr_btn", " Iterating Attractor Activity...");

            let activate = {}
            let perturb = {}

            if (element != AIR.food)
            {
                activate[AIR.food] = foodarray
            }

            if(knockout)              
            {
                perturb[element] = index
            }  
            else
            {
                activate[element] = index
            }
            
            results[diet][index] = await InterateSteps(activate, steps, perturb)
        }
    }
    count = 0;

    for(let target of AIR.MoleculeIDs)
    {
        count += 1;
        if(count%100 == 0)
            await updateProgress(count, AIR.MoleculeIDs.length, "air_bool_corr_btn", " Calculating Correlations...");
            
        let corrs = [] 
        let mediators = Object.assign({}, ...AIR.MoleculeIDs.map((x) => ({[x]: []})))  
        globals.corrResults[element + "_" + target] = {}

        for(let diet in selectedfoodarrays)
        {
            let corr = getCorrelation(element, target, results[diet])
            corrs.push(corr)

            if(corr.corr != 0)
            { 
                for(let m of AIR.MoleculeIDs)
                {
                    if(m == target || m == element)
                        continue; 

                    let m_corr = getCorrelation(element, m, results[diet])
                    let dist = 0
                    for (let index = 1; index < m_corr.Y.length; index++) {
                        // var a = m_corr.X[index] - corr.X[index];
                        // var b = m_corr.Y[index] - corr.Y[index];
                        // dist += Math.sqrt( a*a + b*b );
                        dist += Math.abs((m_corr.Y[index]-m_corr.Y[index-1]) - (corr.Y[index]-corr.Y[index-1]))
                    }

                    mediators[m].push(dist)
                }
            }

            globals.corrResults[element + "_" + target][diet] = [corr.X, corr.Y]
        }

        let highestmediators = Object.keys(mediators).filter(m => mediators[m].length > 0).sort((a, b) => (Math.abs(mean(mediators[a])) - Math.abs(mean(mediators[b])))).slice(0, 10);

        let mediatorstring = '<span style="white-space:nowrap">'
        for(let m of highestmediators)
        {
            //globals.corrResults[element + "_" + m + "_" + target] = [mediators[m].X, mediators[m].Y]
            mediatorstring += '<span style="_color:' + (mean(mediators[m]) > 0? "#FF0000":"#0000FF")  + '"><a href="#" data="' + element + "_" + m + '" class="air_bl_popup_btn">' + AIR.Molecules[m].name + '</a></span>, '
        }
        mediatorstring = mediatorstring.slice(0, mediatorstring.length - 2)
        mediatorstring += "</span>"
        globals.air_ss_table.row.add([
            '<button type="button" class="air_bl_popup_btn air_invisiblebtn" data="' + element + "_" + target + '" style="cursor: pointer;"><a><span class="fa fa-external-link-alt"></span></a></button>',
            getLinkIconHTML(target),
            AIR.Molecules[target].compartment,
            expo(mean(corrs.map(corr => corr.corr))),
            mediatorstring
        ])
        
            
    }
    
    knockedout = knockout
    globals.air_ss_table.draw();
    AIR.Boolean = JSON.parse(originalstate)   
    await updateBooleanTable();
    adjustPanels()

    await enablebtn("air_bool_corr_btn", _text);

    function getCorrelation(source, target, results)
    {
        let arrX = []
        let arrY = []

        for(let [i, result] of Object.entries(results))
        {
            arrX.push(parseFloat(i)/100)

            if(target == AIR.sarcopenia)
            {
                let score = AIR.catabolicprocesses.reduce((sum, p) => sum +(result.elements[p]/result.size), 0) - AIR.anabolicprocesses.reduce((sum, p) => sum +(result.elements[p]/result.size), 0)
                arrY.push(score)
            }
            else if(target == AIR.anabolism)
            {
                arrY.push(AIR.anabolicprocesses.reduce((sum, p) => sum +(result.elements[p]/result.size), 0))
            }
            else if(target == AIR.catabolism)
            {
                arrY.push(AIR.catabolicprocesses.reduce((sum, p) => sum +(result.elements[p]/result.size), 0))
            }
            else
            {
                arrY.push(result.elements[target]/result.size)
            }
        }

        return {
            "corr": pcorr(arrX, arrY),
            "X": arrX,
            "Y": arrY
        } 
    }
}

async function InterateSteps(elementactivity, steps, perturbation = {})
{
    let countelements = Object.assign({}, ...AIR.MoleculeIDs.map((x) => ({[x]: 0})))   
    let activityvalues = Object.assign({}, ...Object.entries(elementactivity).map(([k,v]) => ({[k]: (Array.isArray(v)? v : globals.activityvalues[v])})))   
    let perturbationvalues = Object.assign({}, ...Object.entries(perturbation).map(([k,v]) => ({[k]: (Array.isArray(v)? v : globals.activityvalues[v])})))   

    //while (states.includes(currentstate) == false) {
    for (let index = 0; index < steps; index++) {

        for(let [e,vlist] of Object.entries(activityvalues))
            AIR.Boolean[e]["perturbed"] = vlist[index%vlist.length]? 1 : 0
        for(let [e,vlist] of Object.entries(perturbationvalues))
            AIR.Boolean[e]["perturbed"] = vlist[index%vlist.length]? -1 : 0

        let activeElements = await nextStep();

        for (let eindex = 0; eindex < activeElements.length; eindex++) {
            countelements[activeElements[eindex]] += 1;
        }
    }

    // let ssStart = states.indexOf(currentstate)
    // let countelements = Object.assign({}, ...ekeys.map((x) => ({[x]: 0})))

    // for (let index = ssStart; index < states.length; index++) {
    //     for (let eindex = 0; eindex < ekeys.length; eindex++) {
    //         countelements[ekeys[eindex]] += states[index][eindex] == "1" ? 1 : 0;
    //     }
    //   }    

    return {
        "steps": 0,
        "size": steps,
        "elements": countelements
    }
}

async function manuelStep(updateUI = true)
{
    let currentstep = parseFloat($("#air_bool_steps").html().split(": ")[1])
    let foodarray = [true]

    if($("#air_cb_undernour_step").prop("checked"))
        foodarray = foodarrays["undernourished"] 
    if($("#air_cb_overnour_step").prop("checked"))
        foodarray = foodarrays["overnourished"] 
    if($("#air_cb_wellnour_step").prop("checked"))
        foodarray = foodarrays["well-nourished"] 
    if($("#air_cb_customnour_step").prop("checked"))
        foodarray = $("#sp_bl_foodintake_step").val().split('').map(c => c == "1"? true : false)
    
    AIR.Boolean[AIR.food].active = foodarray[currentstep%foodarray.length]

    await nextStep()

    AIR.Boolean[AIR.food].active = foodarray[(currentstep + 1)%foodarray.length]

    if(updateUI)
    {
        await updateBooleanTable();
        await colorState()
        $("#air_bool_steps").html("Current Step: " + (currentstep + 1))
    }

}

async function nextStep()
{
    let BooleanEntry, breakflag, e;
    let oldstate = JSON.parse(JSON.stringify(AIR.Boolean))
    let activeElements = []
    for (let eindex = 0; eindex < AIR.MoleculeIDs.length; eindex++) {
        e = AIR.MoleculeIDs[eindex]
        breakflag = false
        BooleanEntry = AIR.Boolean[e]
        if(BooleanEntry.locked != 2)
        {
            for (let rulestring of ["dNOT", "dDO", "NOT", "DO"])
            {
                if (!breakflag)
                    breakflag = evaluateState(BooleanEntry, rulestring)
            }
            if (!breakflag)
            {
                BooleanEntry["active"] = BooleanEntry["keepstate"]? (BooleanEntry["storage"] > 0 ? true : false) : BooleanEntry["initial"]
                BooleanEntry["sources"] = []
            }
        }

        if(BooleanEntry["active"] || BooleanEntry["perturbed"] == 1)        
            activeElements.push(AIR.MoleculeIDs[eindex])
    }
    function evaluateState(BooleanEntry, rulestring)
    {
        for(let rule of BooleanEntry[rulestring])
            if(rule.every(s => ((oldstate[s]["active"] && oldstate[s]["perturbed"] != -1) || oldstate[s]["perturbed"] == 1)))
            {
                setState(!rulestring.includes("NOT"), rule, BooleanEntry)
                return true
            }
        return false
    }
    function setState(newstate, rule, BooleanEntry)
    {
        if (newstate)
        {
            BooleanEntry["active"] = true
            BooleanEntry["sources"] = rule
            if(BooleanEntry["keepstate"] && BooleanEntry["storage"] < 9)
                BooleanEntry["storage"] += 1
        }
        else
        {
            BooleanEntry["active"] = false
            BooleanEntry["sources"] = rule
            if (BooleanEntry["keepstate"] && BooleanEntry["storage"] > 0)
            {
                BooleanEntry["storage"] -= 1
                if(BooleanEntry["storage"] > 0)
                    BooleanEntry["active"] = true 
            }
        }
    }

    return activeElements
}
async function colorState()
{
    let colors = {}
    for(let [e, state] of Object.entries(AIR.Boolean))
    {
        if(state.active)
        {
            colors[AIR.Molecules[e].name] = "#FF0000"
        }
        else if (state.locked)
        {
            colors[AIR.Molecules[e].name] = "#808080"
        }
    }

    await ColorElements(colors);
}

$(document).on('change', '.air_boolean_state_cb', async function () {

    var id = $(this).attr('data');

    if ($(this).prop('checked') == true) {
        AIR.Boolean[id].active = true
        if(AIR.Boolean[id].locked > 0)
        {
            AIR.Boolean[id].initial = true
        }
        colorState()
    }
    else {
        AIR.Boolean[id].active = false
        if(AIR.Boolean[id].locked > 0)
        {
            AIR.Boolean[id].initial = false
        }
        colorState()
    }
});
$(document).on('change', '.air_boolean_locked_cb', async function () {

    var id = $(this).attr('data');
    var _value = parseFloat($(this).val());
    AIR.Boolean[id].locked = _value
    if(_value > 0)
    {
        AIR.Boolean[id].initial = AIR.Boolean[id].active
    }
    $(this).css( "background-color", globals.lockedcolors[_value] );
    colorState()

});

$(document).on('click', '.air_bl_coor_mediator', function () {
    var elements = $(this).attr("data")
    air_create_corr_popup(this, globals.corrResults[elements], (knockedout? "Inhibition " : "Activity ") + "of " + AIR.Molecules[elements.split("_")[0]].name, "Activity of " + AIR.Molecules[elements.split("_")[1]].name );
});
$(document).on('click', '.air_bl_popup_btn', function () {
    var elements = $(this).attr("data")
    air_create_corr_popup(this, globals.corrResults[elements], (knockedout? "Inhibition " : "Activity ") + "of " + AIR.Molecules[elements.split("_")[0]].name, "Activity of " + AIR.Molecules[elements.split("_")[1]].name );
});

async function air_create_corr_popup(button, corrdata, xlabel = "Activity", ylabel = "Activity") {

    var $target = $('#om_chart_popover');
    var $btn = $(button);

    if ($target) {


        $('#om_clickedpopupcell').css('background-color', 'transparent');
        $('#om_clickedpopupcell').removeAttr('id');

        if ($target.siblings().is($btn)) {
            $target.remove();
            $target.parents(".dataTables_scrollBody").css({
                minHeight: "0px",
            });
            return;
        }
        $target.remove();

    }

    $(button).attr('id', 'om_clickedpopupcell');
    $(button).css('background-color', 'lightgray');

    $target = $(`<div id="om_chart_popover" class="popover bottom in" style="max-width: none; top: 55px; z-index: 2; border: none;">
                    <div class="arrow" style="left: 9.375%;"></div>
                    <div id="om_chart_popover_content" class="popover-content">
                        <button type="button" id="om_popup_close" class="air_close_tight close" data-dismiss="alert" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <div style="height: 80%">
                            <canvas class="popup_chart" id="om_popup_chart"></canvas>
                        </div>
                    </div>
                </div>`);

    $btn.after($target);

    let close_btn = document.getElementById("om_popup_close");
    // When the user clicks on <span> (x), close the modal
    close_btn.onclick = function () {
        $target.parents(".dataTables_scrollBody").css({
            minHeight: "0px",
        });
        $target.remove();
        $('#om_clickedpopupcell').css('background-color', 'transparent');
        $('#om_clickedpopupcell').removeAttr('id');
        adjustPanels()

    }

    let datasets = []

    for(let [diet, data] of Object.entries(corrdata))
    {
        let dietdata = []
        for (let index = 0; index < data[0].length; index++) {
            
            dietdata.push(
                {
                    x: data[0][index],
                    y: data[1][index],
                    r: 3
                }
            );
        }
        datasets.push({
            data: dietdata,
            label: diet,
            backgroundColor: foodcolors[diet],
        })
    }

    var outputCanvas = document.getElementById('om_popup_chart');

    var chartOptions = {
        type: 'bubble',
        data: {
            datasets: datasets,
        },
        options: {
            plugins: {
                plugins: {
                    filler: {
                        propagate: false
                    }
                },
                legend: {
                    display: true
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
                text: "",
                fontFamily: 'Helvetica',
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: ylabel,
                    },
                    ticks: {
                        //beginAtZero: true,
                        max: 0,
                        min: 100
                    },
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
                        text: xlabel,
                    },
                    ticks: {
                        //beginAtZero: false,
                        max: 0,
                        min: 100
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

    var popupheight = $("#om_chart_popover").height() + 50;
    $target.parents("table").parents(".dataTables_scrollBody").css({
        minHeight: (popupheight > 400 ? 400 : popupheight) + "px",
    });

    adjustPanels()
};

async function findSteadyState()
{
    let ss_activityarray = []
    let ss_statearray = []
    let ss_sourcearray = []
    let index = 0
    
    $("#air_bool_ss_graph").empty().append(`
        <div class="row mt-2 mb-2">
            <div class="col-auto">
                <div class="wrapper">
                    <button type="button" class="air_btn_info btn btn-secondary"
                            data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Exclude Nutrients"
                            data-content="Because of the changing food intake, nutrients inherently have an oscillating behavior. Their high number might impede the readibility of the graph.">
                        ?
                    </button>
                </div>
            </div>
            <div class="col">
                <div class="cbcontainer">
                    <input type="checkbox" class="air_checkbox" id="sp_hidenutrients" checked>
                    <label class="air_checkbox" for="sp_hidenutrients">Hide intestinal nutrients in graph</label>
                </div>
            </div>
        </div> 
        <select id="air_bool_ssmode" class="browser-default air_select custom-select mb-2 mt-2">
            <option value="0" selected>During Steady State</option>
            <option value="1">Towards Steady State</option>
        </select>
        <div class="mb-4 mt-2" style="height:500px;overflow-y:scroll;overflow-x:scroll; position:relative">
            <div id="air_bool_canvasContainer" style="height:0px">
                <canvas id="air_bool_ss_chart"></canvas>
            </div> 
        </div>   
    `)
    $("#air_bool_ssmode").on("change", ShowSSGraph)
    $('.air_btn_info[data-toggle="popover"]').popover();

    var lineChart = new Chart(document.getElementById("air_bool_ss_chart").getContext('2d'), {
        type: "bubble",
        data: {
          datasets: []
        },
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            var e = context.label || '';
                            if(!e)
                                return e;
                            var output = [AIR.Molecules[e].name, "", "Activating Inputs:"]
                            
                            if (elementssources[context.parsed.x].hasOwnProperty(e)) {
                                for(let s of elementssources[context.parsed.x][e])
                                {
                                    output.push("   " + AIR.Molecules[s].name)
                                }
                            }
                            return output;
                        }
                    }
                },
                legend: {
                    display: false,
                },
            },
            onHover: (event, chartElement) => {
                event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
            },
            onClick: (event, chartElement) => {
                if (chartElement[0]) {
                    let e = lineChart.data.datasets[chartElement[0].datasetIndex].label;
                    let name = AIR.Molecules[e].name;
                    AIR.Boolean = JSON.parse(staedystates[chartElement[0].index])
                    selectElementonMap(name, true);
                    updateBooleanTable();
                    colorState()
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    ticks: {
                        stepSize: 1,
                        autoSkip: false,
                        beginAtZero: true,
                        callback: function(value) {
                            if (value % 1 === 0) {
                                if(elementsingraph.length == 0 || value == 0 || value > elementsingraph.length)
                                    return ""
                                else
                                    return AIR.Molecules[elementsingraph[value-1]].name
                            }
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Number of steps'
                    },
                    ticks: {
                        stepSize: 1,
                        autoSkip: false,
                        beginAtZero: true,
                        callback: function(value) {
                            if (value % 1 === 0) 
                            {
                                if(parseFloat($("#air_bool_ssmode").val()) == 0)
                                {
                                    return value += index
                                }
                                else
                                    return value;
                            }
                            else
                            {

                            }
                        }
                    }
                }
            }
        }
      });


    let currentstep = parseFloat($("#air_bool_steps").html().split(": ")[1])
    let foodarray = [true]

    if($("#air_cb_undernour_step").prop("checked"))
        foodarray = foodarrays["undernourished"] 
    if($("#air_cb_overnour_step").prop("checked"))
        foodarray = foodarrays["overnourished"] 
    if($("#air_cb_wellnour_step").prop("checked"))
        foodarray = foodarrays["well-nourished"] 
    if($("#air_cb_customnour_step").prop("checked"))
        foodarray = $("#sp_bl_foodintake_step").val().split('').map(c => c == "1"? true : false)
    

    ss_sourcearray.push(getCurrentSources())
    ss_statearray.push(JSON.stringify(AIR.Boolean))

    var currentstate = (currentstep%foodarray.length) + "_" + AIR.MoleculeIDs.map(e => (AIR.Boolean[e]["keepstate"]? AIR.Boolean[e]["storage"] : (AIR.Boolean[e].active? "1" : "0"))).join("")

    while((index = ss_activityarray.indexOf(currentstate)) == -1) {
    
        AIR.Boolean[AIR.food].active = foodarray[currentstep%foodarray.length]
        ss_activityarray.push(currentstate)
        await nextStep(false);

        currentstep++;
        ss_sourcearray.push(getCurrentSources())
        ss_statearray.push(JSON.stringify(AIR.Boolean))

        currentstate = (currentstep%foodarray.length) + "_" + AIR.MoleculeIDs.map(e => (AIR.Boolean[e]["keepstate"]? AIR.Boolean[e]["storage"] : (AIR.Boolean[e].active? "1" : "0"))).join("")
    }
    ss_activityarray.push(currentstate)
    ss_activityarray = ss_activityarray.map(s => s.split("_")[1])

    $("#air_bool_steps").html("Current Step: " + ss_activityarray.length)
    var toward_activityarray = ss_activityarray.slice(0,index+1)
    var toward_sourcearray = ss_sourcearray.slice(0,index+1)
    var toward_statearray = ss_statearray.slice(0,index+1)

    ss_activityarray = ss_activityarray.slice(index)
    ss_sourcearray = ss_sourcearray.slice(index)
    ss_statearray = ss_statearray.slice(index)

    async function ShowSSGraph()
    {   
        lineChart.data.datasets = []    
        var datasets = []     
        var statearray = []
        switch (parseFloat($("#air_bool_ssmode").val())) {
            case 0:
                statearray = ss_activityarray
                elementssources = ss_sourcearray
                staedystates = ss_statearray
                break;
            case 1:
                statearray = toward_activityarray
                elementssources = toward_sourcearray
                staedystates = toward_statearray
                break;
            case 2:
                statearray = toward_activityarray.concat(ss_activityarray)
                elementssources = toward_sourcearray.concat(ss_sourcearray)
                staedystates = toward_statearray.concat(ss_statearray)
                break;
        }

        var labels = [...new Array(statearray.length).keys()];
        elementsingraph = []

        var count = 1
        var edata = []
        for (let i = 0; i < AIR.MoleculeIDs.length; i++) {

            if($("#sp_hidenutrients").prop("checked") && (["enterocyte", "intestinallumen"].includes(AIR.Molecules[AIR.MoleculeIDs[i]].compartment)))
            {
                continue;
            }
            let values = statearray.map(x => parseFloat(x[i]));

            if(!values.every( v => v === values[0] ))
            {
                var _edata = [values.map(x => (x == 0? "b" : "a")).join(""),AIR.MoleculeIDs[i]]
                values = values.map(x => (x == 1? count : null))
                count++;
                let data = labels.map((label, index) => ({ x: label, y: values[index]}));

                _edata.push({
                    label: AIR.MoleculeIDs[i],
                    data: data,
                    borderColor: '#000000',
                    pointBackgroundColor: "transparent",
                    pointStyle: 'rectRounded'
                })

                switch (AIR.Molecules[AIR.MoleculeIDs[i]].compartment) {
                    case "liver":
                        _edata.push("#0000FF")
                        break;
                    case "intestine":
                        _edata.push("#FF0000")
                        break;
                    case "muscle":
                        _edata.push("#007F00")
                        break;
                    default:                        
                        _edata.push("#000000")
                        break;
                }

                edata.push(_edata)
            }
        }

        edata = edata.sort((a, b) => b[0].localeCompare(a[0]))
        edata.forEach((e, i) => {
            for(let d of e[2].data)
            {
                d.y = (d.y != null? (i+1) : null)
            }
        })
        elementsingraph = edata.map(e => e[1])

        lineChart.data.datasets = edata.map(e => e[2])
        lineChart.options.scales.y.ticks.color = edata.map(e => e[3])
        document.getElementById("air_bool_canvasContainer").style.height = (50 + 20 * elementsingraph.length).toString() + "px";
        document.getElementById("air_bool_canvasContainer").style.width = (300 + 20 * statearray.length).toString() + "px";

        lineChart.update()

        adjustPanels()
    }  


    await updateBooleanTable();
    await colorState()
    await ShowSSGraph()
}

function getCurrentSources()
{
    return Object.assign({}, ...AIR.MoleculeIDs.filter(e => AIR.Boolean[e].active).map((e) => ({[e]: AIR.Boolean[e].sources})))
}