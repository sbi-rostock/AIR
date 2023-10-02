let timeoutId;


async function AirBM() {
    globals.abm = {
        results: {},
        prestored_colors: {},
        agents: [],
        current_step: 0,
    }

    AIR.allBioEntities.forEach(e => {
        if (e.constructor.name === 'Alias' && e.getModelId() == globals.liverMapID) {

            let match = e._elementId.match(/sa(\d+)_(\d+)/);

            if (match)
            {
                // Extract integer values
                let x = parseInt(match[1], 10); // The first group in the regex is x
                let y = parseInt(match[2], 10);
                
                globals.abm.agents.push({
                    "x": x,
                    "y": y,
                    "element": e,
                    "previous_color": ""
                })
            }

        }
    });

    for (let i = -100; i <= 100; i += 5) {
        globals.abm.prestored_colors[i] = valueToHex(i/100);
    }

    globals.abm.container = $('#airbm_tab_content');

    $(
        `           
        <h4 class="mt-4 mb-2">1. Initalize Model</h4>
        <div id="abm_seed-container" class="row mt-4 mb-2">
            <div class="col-auto">
                <div class="wrapper">
                    <button type="button" class="air_btn_info btn btn-secondary ml-1"
                            data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Randomization Seed."
                            data-content="Seeds allow for reproducability in probabilitic simulations. Models with the same seed will have exact same results, given that parameters stay the same.">
                        ?
                    </button>
                </div>
            </div>
            <div class="col-auto air_select_label" style="padding:0; width: 10%; text-align: right; ">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Seed:</span>
            </div>
            <div class="col">
                <input type="text" class="textfield" value="" id="abm_seed" onkeypress="return isNumber(event, int = true)" />
            </div>
        </div>
        <button type="button" id="abm_initializebtn" class="air_btn btn btn-block mt-2 mb-2">Initialize</button>
        
        <hr>
        <h4 class="mt-4 mb-2">3. Configure Parameters</h4>
        <div id="abm_steps-container" class="row mt-4 mb-2">
            <div class="col-auto">
                <div class="wrapper">
                    <button type="button" class="air_btn_info btn btn-secondary ml-1"
                            data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Number of Steps."
                            data-content="Number of consecutive steps the Boolean model is running for. The number of steps might increase accuracy of simulations, espacially for complex conditions and long food intake sequences, but increases calculation time proportionally.">
                        ?
                    </button>
                </div>
            </div>
            <div class="col-auto air_select_label" style="padding:0; width: 10%; text-align: right; ">
                <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">#Steps:</span>
            </div>
            <div class="col">
                <input type="number" id="abm_steps" min="1" value="200">
            </div>
        </div>
        
        <div class="row mt-4 mb-2">
            <div class="col-auto">
                <div class="wrapper">
                    <button type="button" class="air_btn_info btn btn-secondary ml-1"
                            data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Food Intake Frequence."
                            data-content="Number of Boolean steps the food intake element is turn ON and OFF, representing feeding and fasting situations, respectively. If the total number of steps in the sequence is less than the number of steps of the simulation, the sequence is repeated">
                        ?
                    </button>
                </div>
            </div>
            <div class="col-auto air_select_label" style="padding-left: 10px; width: 50%; text-align: left; ">
                <h4>Food Intake Sequence</h4>
            </div>
        </div>
        <div id="abm_foodsequence_container">
            <div class="form-row align-items-center mb-2">
                <div class="col-1" style="text-align: right;">                    
                </div>
                <div class="col-5" style="text-align: center;">
                    <span>State</span>
                </div>
                <div class="col-2" style="text-align: center;">
                    <span>Steps</span>
                </div>
            </div>
        </div>
        <button id="abm_addSequence" class="air_btn_light btn btn-block mb-4">Add Sequence Item</button>

        <div class="row mt-2 mb-2" style="display: flex; align-items: center; justify-content: center;">
            <div class="col-auto">
                <div class="cbcontainer">
                    <input type="checkbox" class="air_checkbox" id="abm_single_analysis" checked>
                    <label class="air_checkbox" for="abm_single_analysis">Single Simulation</label>
                </div>
            </div>
            <div class="col-auto">
                <div class="cbcontainer">
                    <input type="checkbox" class="air_checkbox" id="abm_differential_analysis">
                    <label class="air_checkbox" for="abm_differential_analysis">Comparitive Simulation</label>
                </div>
            </div>
        </div>
        <div class="air_table_background">
            <table id="abm_condition_table" cellspacing="0" class="air_table table table-sm mt-4 mb-4" style="width:100%">
                <thead>
                    <tr>
                        <th style="vertical-align: middle;">Element</th>
                        <th style="vertical-align: middle;">Control\nSettings</th>
                        <th style="vertical-align: middle;">Interference\nSettings</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            </table>
        </div>

        <hr>
            
        <h4 class="mt-4 mb-2">3. Run Simulation</h4>
        <button type="button" id="abm_runbtn" class="air_btn btn btn-block mt-4 mb-2 air_disabledbutton">Run</button>

        <hr>
        
        <h4 class="mt-4 mb-2">4. Visualize Results</h4> 
        <div id="abm_showtab">            
        
            <input type="text" value="TAG (Simple molecule, Hepatocyte)" list="air_abm_node_list" style="width: 70%" class="textfield mb-2 mt-2" id="air_abm_node_select"/>
            <datalist id="air_abm_node_list" style="height:5.1em;overflow:hidden">
            </datalist>

            <button type="button" id="abm_show_abm_btn" class="air_btn btn btn-block mt-2 mb-2 air_disabledbutton" air_disabledbutton>Show</button>

            <input type="range" style="width: 100%"  value="1" min="1" max="200" step="1" class="slider air_slider mt-2 mb-2 air_disabledbutton" data="m" id="abm_slider_step">
            <div class="btn-group mt-2 mb-4" role="group">
                <button id="abm_btn_play" class="air_btn btn mr-2 air_disabledbutton" style="width:100%">Start</button>
                <button id="abm_btn_stop" class="air_btn btn air_disabledbutton" style="width:100%">Pause</button>
            </div>
        </div>

    `).appendTo(globals.abm.container);
    
    function generate_food_sequence_item(state = "ON", value = 10)
    {
        return `
            <div class="abm_sequenceItem form-row align-items-center mb-2">
                <div class="col-1" style="text-align: right;">
                    <span class="sequenceNumber">${document.getElementById('abm_foodsequence_container').children.length}.</span>
                </div>
                <div class="col-5">
                    <select class="abm_stimulusState form-control">
                        <option value="ON"${state == "ON"? " selected" : ""}>ON / Feeding</option>
                        <option value="OFF"${state == "OFF"? " selected" : ""}>OFF / Fasting</option>
                    </select>
                </div>
                <div class="col-2">
                    <input type="number" class="abm_food_consecutiveSteps form-control" min="1" value="${value}">
                </div>
            </div>
        `
    }
    $("#abm_foodsequence_container").append(generate_food_sequence_item(state = "ON", value = 25))
    $("#abm_foodsequence_container").append(generate_food_sequence_item(state = "OFF", value = 75))

    $('#abm_addSequence').click(function () {
        $("#abm_foodsequence_container").append(generate_food_sequence_item())
    });
    $('#abm_differential_analysis').change(function () {
        if ($(this).prop('checked') === true) {
            $('#abm_single_analysis').prop('checked', false)
            globals.abm.condition_table.column(2).visible(true);
            // globals.abm.condition_table.column(4).visible(true);
        }
    });
    $('#abm_differential_analysis').click(function () {
        if ($(this).prop('checked') === false) {
            return false;
        }
    });
    $('#abm_single_analysis').change(function () {
        if ($(this).prop('checked') === true) {
            $('#abm_differential_analysis').prop('checked', false)
            globals.abm.condition_table.column(2).visible(false);
            // globals.abm.condition_table.column(4).visible(false);
        }
    });
    $('#abm_single_analysis').click(function () {
        if ($(this).prop('checked') === false) {
            return false;
        }
    });

    globals.abm.condition_table = $('#abm_condition_table').DataTable({
        //"scrollX": true,
        //"autoWidth": true,
        "table-layout": "fixed", // ***********add this
        "word-wrap": "break-word",
    }).columns.adjust().draw();
    $(globals.abm.condition_table.table().container()).addClass('air_datatable');

  
    // $(globals.abm.condition_table.table().container()).addClass('air_datatable');
    // globals.abm.condition_table.on('draw', function () {
    //     adjustPanels(globals.xplore.container);
    // });

    $('#abm_initializebtn').on('click', initialize_abm);
    $('#abm_runbtn').on('click', run_abm);
    $('#abm_show_abm_btn').on('click', show_abm);
    $('#abm_slider_step').on('input', async function (e) {
        globals.abm.current_step = $(this).val() - 1
        await highlightabm()
    })
    $('#abm_btn_play').on('click', function (e) {
        if(timeoutId)
        {
            return
        }
        next_step()
    })
    $('#abm_btn_stop').on('click', async function (e) {
        clearTimeout(timeoutId);
        timeoutId = NaN
    })
}

async function next_step() {
    globals.abm.current_step += 1
    if(globals.abm.current_step >= $('#abm_slider_step').attr('max'))
    {
        globals.abm.current_step = 0
    }
    $('#abm_slider_step').val(globals.abm.current_step+1); 
    await highlightabm()
    timeoutId = setTimeout(next_step, 10);
}

async function initialize_abm() {
    var text = await disablebutton("abm_initializebtn")
    var seed = $("#abm_seed").val()
    var abm_params = JSON.parse(await getDataFromServer("ABM", data = seed? {"seed": parseInt(seed)} : {}))
    $("#abm_seed").val(abm_params["seed"])


    if (globals.abm.condition_table)
        globals.abm.condition_table.destroy();

    $("#abm_condition_table > tbody").empty()
    var tbl = document.getElementById('abm_condition_table').getElementsByTagName('tbody')[0];;
    for (let e of abm_params["intestine_nodes"]) {
        var row = tbl.insertRow(tbl.rows.length);
        createCell(row, 'td', getLinkIconHTML(e.name), 'col', '', 'right');

        var slider_value_html = '<span style="padding-left: 3px;" class="slider-value">1.00</span>'

        var slider_control = createSliderCell(row, 'td', 'abm_control_');
        slider_control.setAttribute('style', 'width: 100px;'); 
        $(slider_control).after(slider_value_html);

        var slider_interference = createSliderCell(row, 'td', 'abm_interference_');
        slider_interference.setAttribute('style', 'width: 100px;'); 
        $(slider_interference).after(slider_value_html);

        for(var [i, slider] of Object.entries([slider_control, slider_interference]))
        {
            slider.setAttribute('data', e.hash);
            slider.setAttribute('value', 1.00);
            slider.setAttribute('min', 0);
            slider.setAttribute('max', 1.00);
            slider.setAttribute('step', 0.01);
            slider.oninput = function () {
                let value = parseFloat(this.value).toFixed(2);
                $(this).next('.slider-value').text(value);
                // $("#" + (i == 0? "abm_control_sliderValue" : "abm_inteference_sliderValue") + e.hash).html(parseFloat(value));
            }
        }

    }
    globals.abm.condition_table = $('#abm_condition_table').DataTable({
        "dom": '<"top"<"left-col"B><"right-col"f>>rtip',
        "pageLength": 10,
        "lengthMenu": [ [5, 10, 15], [5, 10, 15] ],
        "buttons": [
            {
                text: 'Reset',
                className: 'air_dt_btn',
                action: reset_condition_table,
            },
        ],
        // "scrollX": true,
        // "autoWidth": true,
        // "table-layout": "fixed",
        "word-wrap": "break-word",
        // "columns": [
        //     null,
        //     { "width": "15%" },
        //     { "width": "15%" },
        // ],
        columnDefs: [
            {
              targets: [1, 2], // Indexes of the slider columns
              width: 'auto',
              className: 'slider-column'
            }
        ]
    }).columns.adjust().draw();
    $(globals.abm.condition_table.table().container()).addClass('air_datatable');
    globals.abm.condition_table.column(2).visible(false);
    // globals.abm.condition_table.column(4).visible(false);

    globals.abm.nodes = abm_params["agent_nodes"]
    $('#air_abm_node_list').empty();
    for (let [hash, name] of Object.entries(globals.abm.nodes).sort(function(a, b) {
        var nameA = a[1];
        var nameB = b[1];
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      })) {

        $("#air_abm_node_list").append('<option data-value="' + hash + '" value="' + name + '"></option>')
    }

    enablebtn("abm_initializebtn", text);
    $('#abm_runbtn').removeClass("air_disabledbutton")
}

function reset_condition_table()
{
    globals.abm.condition_table.rows().every(function () {
        var row = this.nodes().to$()
        row.find('input').val(1);
        row.find('.slider-value').html(`1.00`)
    });
    globals.abm.condition_table.columns.adjust().draw(false);
};


async function run_abm() {
    const food_sequence = [];

    document.querySelectorAll('.abm_sequenceItem').forEach(item => {
        const stimulusState = item.querySelector('.abm_stimulusState').value;
        const consecutiveSteps = parseInt(item.querySelector('.abm_food_consecutiveSteps').value);
        const valueToAdd = stimulusState === "ON" ? 1 : -1;
        for (let i = 0; i < consecutiveSteps; i++) {
            food_sequence.push(valueToAdd);
        }
    });


    var text = await disablebutton("abm_runbtn")
    
    var run_parameters = {
        comparative: $('#abm_differential_analysis').prop('checked'),
        control_parameters: {},        
        interference_parameters: {},
        food_sequence: food_sequence,
        steps: parseInt($("#abm_steps").val()),
    }

    globals.abm.condition_table.rows().every(function () {
        var sliders = this.nodes().to$().find('.air_slider');
        sliders.each(function (index) {
            var slider = $(this)
            var value = slider.val();
            if (value != 1)
            run_parameters[index == 0? "control_parameters" : "interference_parameters"][slider.attr('data')] = value;
        });
    });
    console.log(run_parameters)
    $('.abm_slider').each(function() {
        // "this" now refers to the current item in the iteration
        // Output the value to the console
    });

    await getDataFromServer("ABM/run", data = JSON.stringify(run_parameters), type = "POST", datatype = "json")


    enablebtn("abm_runbtn", text);
    $('#abm_show_abm_btn').removeClass("air_disabledbutton")
}

async function show_abm() {
    var text = await disablebutton("abm_show_abm_btn")
    globals.abm.current_step = 0
    $('#abm_slider_step').val(1); 

    var node_name = $("#air_abm_node_select").val()
    var node_hash = document.querySelector("#air_abm_node_list option[value='"+node_name+"']").dataset.value;

    results = JSON.parse(await getDataFromServer("ABM/show/" + node_hash))
    for(let agent of globals.abm.agents)
    {
        agent["colors"] = results.map(step_values => globals.abm.prestored_colors[step_values[agent.x][agent.y]])
    }
    await highlightabm()
    
    minervaProxy.project.map.openMap({ id: globals.liverMapID });

    enablebtn("abm_show_abm_btn", text);
    $('#abm_slider_step').removeClass("air_disabledbutton")
    $('#abm_btn_play').removeClass("air_disabledbutton")
    $('#abm_btn_stop').removeClass("air_disabledbutton")
}

async function highlightabm() {

    console.time("Generate Entities");
    let highlightDefs = []
    let remove_highlighted = []
    for(let agent of globals.abm.agents)
    {
        let color = agent.colors[globals.abm.current_step]
        if(color != agent.previous_color)
        {
            highlightDefs.push({
                element: {
                    id: agent.element.id,
                    modelId: agent.element.getModelId(),
                    type: "ALIAS"
                },
                type: "SURFACE",
                options: {
                    color: color,
                    opacity: 0.5,
                    lineOpacity: 0,
                },
            });
            if(agent.previous_color)
            {
                remove_highlighted.push({
                    element: {
                        id: agent.element.id,
                        modelId: agent.element.getModelId(),
                        type: "ALIAS"
                    },
                    type: "SURFACE",
                });
            }
            agent.previous_color = color
        }

    }
    console.timeEnd("Generate Entities");

    console.time("Hide Entities");
    if(remove_highlighted.length > 0)
        await minervaProxy.project.map.hideBioEntity(remove_highlighted)
    console.log(remove_highlighted.length)
    console.timeEnd("Hide Entities");

    console.time("Show Entities");
    if(highlightDefs.length > 0)
        await minervaProxy.project.map.showBioEntity(highlightDefs)
    console.log(highlightDefs.length)
    console.timeEnd("Show Entities");

    // minervaProxy.project.map.getHighlightedBioEntities().then(highlighted => {


    //     let highlightDefs = []
    //     let remove_highlighted = []

    //     for(let highlighted_agent of Object.entries(globals.abm.agents))
    //     {
    //         if(globals.abm.agents.hasOwnProperty(highlighted_agent.element.id))
    //         {
    //             let agent = globals.abm.agents[highlighted_agent.element.id]
    //             let color = agent.colors[globals.abm.current_step]
    //             if(color != highlighted_agent.options.color)
    //             {
    //                 remove_highlighted.push(highlighted_agent)
    //                 highlightDefs.push({
    //                     element: {
    //                         id: agent.element.id,
    //                         modelId: agent.element.getModelId(),
    //                         type: "ALIAS"
    //                     },
    //                     type: "SURFACE",
    //                     options: {
    //                         color: color,
    //                     },
    //                 });
    //             }
    //             else
    //             {

    //             }

    //         }



    //     }

    //     minervaProxy.project.map.hideBioEntity(highlighted).then(r => {


    //         minervaProxy.project.map.showBioEntity(highlightDefs);
    //     });
    // });
}