air_data.xplore = {
    container: null,
    added_markers: [],
    selected_entities: [],
    ctrlPressed: false,
    last_submitted_entities: []
}

var air_xplore = air_data.xplore

async function xplore() {
    air_xplore.container = air_data.container.find('#xplore_tab_content');
    
    // Remove plugin header element from parent document
    removePluginHeader();
    
    // Maximize plugin container size
    maximizePluginContainer();

    $(
        `
        <div class="card mt-3" style="border: 1px solid #FFF; padding: 1rem; display: flex; flex-direction: column; height: calc(100vh - 80px);">
            <div class="d-flex align-items-center justify-content-between mb-0">
                <h4 class="mb-0">Explore the Disease Map</h4>
                <div class="d-flex align-items-center gap-2">
                    <button type="button" id="xplore_btn_download_pdf" class="btn btn-sm btn-outline-secondary" title="Download chat as PDF">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                    <button type="button" id="xplore_btn_expand_chat" class="btn btn-sm btn-outline-primary air_expand_btn" title="Pop out chat window">
                        <i class="fas fa-external-link-alt air_expand_arrow"></i>
                    </button>
                    <button type="button" class="btn btn-link p-0 fixed-queries-link" data-origin="xplore" style="color: #6c757d; font-size: 1.2em;" title="Show example queries">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            </div>
            <div id="xplore_analysis_content" class="mt-2" style="width: 100%; flex: 1; overflow-x: auto; overflow-y: hidden; font-size: 12px; border: none; padding: 0; margin-bottom: 0;">
                <div class="text-center text-muted pt-5">
                    Submit a query to see results here
                </div>
            </div>
            <form id="xplore_queryform" class="d-flex mt-2 mb-2">
                <textarea id="xplore_query_input" class="form-control me-2 auto-expand-input" style="flex: 1; resize: none;" 
                    placeholder="Ask a question ..." aria-label="Query input" rows="1"></textarea>
                <button type="button" id="xplore_btn_query" class="air_btn btn">Submit</button>
            </form>
            <div class="d-flex align-items-center gap-2 mb-2" style="font-size: 12px;">
                <label for="xplore_reasoning_level" class="mb-0">Reasoning</label>
                <input type="range" id="xplore_reasoning_level" min="1" max="3" step="1" value="1" style="flex: 1;" />
                <span id="xplore_reasoning_value" style="width: 16px; text-align: center;">1</span>
                <span data-bs-toggle="tooltip" data-bs-placement="top" title="Set the agent's depth of reasoning. Higher value significantly increases response time." style="cursor: help; color: #6c757d;"><i class="fas fa-info-circle"></i></span>
            </div>
            <span style="text-align: center;margin-bottom: 4pt;">or</span>
            <div class="d-flex justify-content-center mb-2">
                <button type="button" id="xplore_btn_function_selector" class="btn btn-outline-secondary btn-sm">
                    <i class="fas fa-list"></i> Select Function
                </button>
            </div>
            <div id="xplore_selection_status" class="mb-2" style="border: 1px solid #dbe5f1; border-radius: 12px; background: linear-gradient(180deg, #f8fbff 0%, #f2f7ff 100%); padding: 8px 10px;">
                <div class="d-flex align-items-center justify-content-between gap-2" style="min-height: 24px;">
                    <div id="xplore_selection_count" class="small fw-semibold" style="color: #1f3f66;">0 elements selected</div>
                    <a href="#" id="xplore_btn_selection_modal" class="badge" style="background: #e9f2ff; color: #245a97; font-weight: 600;">Analyze</a>
                </div>
                <div class="d-flex align-items-start justify-content-between gap-2 mt-1" style="min-height: 20px;">
                    <div id="xplore_selection_names" class="small" style="color: #4f6b8a; flex: 1 1 auto;">Click to select. Enable Multi-select to build a set.</div>
                    <div class="d-flex align-items-center gap-2" style="flex: 0 0 auto;">
                        <a href="#" id="xplore_clear_selection" class="small" style="display:none; color: #245a97; font-weight: 600; text-decoration: none;">Clear</a>
                    </div>
                </div>
            </div>
        </div>
        `
    ).appendTo(air_xplore.container);

    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });

    air_data.minerva_events.addListener("onBioEntityClick", xploreOnBioEntityClick);
    updateXploreSelectionStatus();

    // Setup auto-expanding input
    setupAutoExpandingInput("#xplore_query_input");
    
    // Handle Enter key in the query input (submit on Enter, allow Shift+Enter for new line)
    $("#xplore_query_input").on('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent form submission
            // Check if already processing a response
            if (window.isProcessingResponse) {
                showWaitAlert("xplore");
                return false;
            }
            $("#xplore_btn_query").trigger('click'); // Trigger the click event on the submit button
            return false;
        }
    });

    // Handle query button click
    $("#xplore_btn_query").on("click", () => {
        const queryText = $(`#xplore_query_input`).val().trim();
        multi_agent_query("xplore", queryText);
    })
        

    // Handle function selector button click
    $("#xplore_btn_function_selector").on('click', function() {
        showFunctionSelectorModal('xplore');
    });


    $("#xplore_btn_selection_modal").on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        showXploreSelectionModal();
    });

    $("#xplore_clear_selection").on('click', function(e) {
        e.preventDefault();
        clearXploreSelectedEntities();
    });

    $(document).on('click', '.xplore-reselect-elements-btn', function(e) {
        e.preventDefault();

        if (!Array.isArray(air_xplore.last_submitted_entities) || air_xplore.last_submitted_entities.length === 0) {
            return;
        }

        air_xplore.selected_entities = air_xplore.last_submitted_entities.map(entity => ({ ...entity }));
        updateXploreSelectionStatus();
    });

    // Update reasoning value display
    $("#xplore_reasoning_level").on('input', function() {
        $("#xplore_reasoning_value").text($(this).val());
    });

    // Handle expand chat button click
    $("#xplore_btn_expand_chat").on('click', function() {
        expandChatInterface('xplore');
    });

    // Handle PDF download button click
    $("#xplore_btn_download_pdf").on('click', function() {
        downloadChatAsPDF('xplore');
    });

    window.addEventListener("keydown", (event) => {
    if (event.key === "Control") {
        air_xplore.ctrlPressed = true;
    }
    });
    window.parent.addEventListener("keydown", (event) => {
    if (event.key === "Control") {
        air_xplore.ctrlPressed = true;
    }
    });

    window.addEventListener("keyup", (event) => {
    if (event.key === "Control") {
        air_xplore.ctrlPressed = false;
    }
    });
    window.parent.addEventListener("keyup", (event) => {
    if (event.key === "Control") {
        air_xplore.ctrlPressed = false;
    }
    });

    
    $('#xplore_selection_status').on('click.xploreSelectionStatus', '.xplore-remove-chip', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const entityKey = $(this).attr('data-entity-key');
        if (!entityKey) {
            return;
        }
        air_xplore.selected_entities = air_xplore.selected_entities.filter(entity => entity.name !== entityKey);
        updateXploreSelectionStatus();
    });
}


async function xploreOnBioEntityClick(data) {
    if (!data || data.type !== 'ALIAS') {
        return;
    }

    removeHighlight("xplore_selection");


    var entity = await getDataFromServer(
            `sylobio/map_minerva_elements`,
            {elements: [{ id: data.id, modelId: data.modelId }]},
            'POST',
            'json'
        );

    if (entity && Array.isArray(entity) && entity.length > 0) {
        entity = entity[0];
    }
    else {
        console.warn('Received unexpected response for element details:', entity);
        entity = null;
    }

    const ctrlPressed = air_xplore.ctrlPressed;

    entity.value = 0;

    if (!ctrlPressed) {
        air_xplore.selected_entities = [entity];
    } else if (!air_xplore.selected_entities.some(item => item.name === entity.name)) {
        air_xplore.selected_entities.push(entity);
    }

    var markers = [];
    for (const element of air_xplore.selected_entities) {
        for (const node of element.nodes) {
            for (const pin of node.pins) {
                markers.push({
                    modelId: pin[0],
                    x: pin[1],
                    y: pin[2],
                    number: pin[3],
                });
            }
        }
    }

    highlightPins(markers, created_by = "xplore_selection");

    updateXploreSelectionStatus();
}


function clearXploreSelectedEntities() {
    air_xplore.selected_entities = [];
    updateXploreSelectionStatus();
}

function updateXploreSelectionStatus() {
    const selectedEntities = Array.isArray(air_xplore.selected_entities) ? air_xplore.selected_entities : [];
    const count = selectedEntities.length;

    const countEl = $('#xplore_selection_count');
    const namesEl = $('#xplore_selection_names');
    const clearEl = $('#xplore_clear_selection');
    const actionBtn = $('#xplore_btn_selection_modal');

    if (countEl.length === 0) {
        return;
    }

    countEl.text(`${count} element${count === 1 ? '' : 's'} selected`);


    if (count > 0) {
        const chipsHtml = selectedEntities
            .map(entity => {

                return `
                    <span class="xplore-selection-chip" style="display: inline-flex; align-items: center; gap: 4px; border-radius: 999px; background: #e8f2ff; color: #1f4e85; padding: 2px 8px; max-width: 100%;">
                        <span class="xplore-selection-chip-label" style="max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${entity.name}</span>
                        <button type="button" class="xplore-remove-chip" data-entity-key="${entity.name}" style="border: none; background: transparent; color: #1f4e85; font-weight: 700; line-height: 1; cursor: pointer; padding: 0;" aria-label="Remove selected element">&times;</button>
                    </span>
                `;
            })
            .join('');

        namesEl.html(`<div class="d-flex flex-wrap gap-1">${chipsHtml}</div>`);
        clearEl.show();
        actionBtn
            .removeClass('disabled')
            .attr('aria-disabled', 'false')
            .css('pointer-events', 'auto')
            .css('opacity', 1);
    } else {
        namesEl.text('Click to select. Press Ctrl to multi-select.');
        clearEl.hide();
        actionBtn
            .addClass('disabled')
            .attr('aria-disabled', 'true')
            .css('pointer-events', 'none')
            .css('opacity', 0.65);
    }

}

async function showXploreSelectionModal() {
    if (!air_xplore.selected_entities.length) {
        alert('Please select at least one map element first.');
        return;
    }

    $('#xplore_selection_modal', window.parent.document).remove();
    $(window.parent.document).off('.xploreSelectionModal');


    const elementRows = air_xplore.selected_entities.map((element, index) => {
        const ids = element.nodes.map(item => item.index);

        return `
            <div class="xplore-selection-item"
                data-row-index="${index}"
                data-node-ids='${JSON.stringify(ids)}'
                style="border: 1px solid #dee2e6; border-radius: 10px; padding: 10px 12px; margin-bottom: 10px; background: #f8f9fa;">
                <div class="d-flex align-items-center gap-2" style="flex-wrap: wrap;">
                    <div style="font-weight: 600; color: #212529; min-width: 180px; flex: 0 1 260px;">${element.name}</div>
                    <input type="range"
                        class="form-range xplore-selection-slider"
                        min="-1" max="1" step="0.05" value="${element.value}"
                        data-row-index="${index}"
                        style="flex: 1 1 260px; margin: 0;">
                    <span class="badge bg-primary xplore-slider-value" style="min-width: 48px; text-align: center;">${element.value.toFixed(2)}</span>
                    <button type="button" class="btn btn-sm btn-outline-secondary xplore-reset-row" data-row-index="${index}">Reset</button>
                </div>
            </div>
        `;
    }).join('');


    const modalHtml = `
        <div id="xplore_selection_modal" style="position: fixed; inset: 0; background: rgba(9, 18, 31, 0.55); backdrop-filter: blur(3px); display: flex; justify-content: center; align-items: center; z-index: 99999; padding: 20px;">
            <div style="width: min(820px, 96vw); max-height: 92vh; overflow: auto; background: #fbfdff; border-radius: 16px; border: 1px solid #d7e4f3; box-shadow: 0 28px 72px rgba(15, 30, 55, 0.28);">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid #e5eef8; position: sticky; top: 0; background: linear-gradient(180deg, #f7fbff 0%, #f2f8ff 100%); z-index: 1;">
                    <div>
                        <div style="font-size: 18px; font-weight: 800; color: #1f3653; letter-spacing: 0.2px;">Analyze Selection</div>
                        <div style="font-size: 12px; color: #56708d;">Set per-target values, then run perturbation analysis.</div>
                    </div>
                    <button type="button" id="xplore_selection_close" class="btn btn-sm" style="border: 1px solid #c7d8eb; color: #355c85; background: #ffffff; border-radius: 10px; width: 34px; height: 34px;">&times;</button>
                </div>
                <div style="padding: 14px 18px 18px 18px;">
                    <div style="display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 8px; margin-bottom: 10px; border: 1px solid #deebf8; border-radius: 12px; background: #f4f9ff; padding: 8px 10px;">
                        <button type="button" id="xplore_selection_reset_all" class="btn btn-sm" style="background: #ffffff; border: 1px solid #c7d8eb; color: #2f587f; font-weight: 600;">
                            <i class="fas fa-rotate-left me-1"></i>Reset All
                        </button>
                    </div>
                    <div>${elementRows}</div>
                    <div class="d-flex justify-content-end gap-2 mt-3" style="padding-top: 4px; border-top: 1px solid #e5eef8;">
                        <button type="button" id="xplore_selection_cancel" class="btn btn-lg" style="min-width: 120px; font-weight: 700; border: 1px solid #c7d8eb; color: #3d6188; background: #ffffff;">Cancel</button>
                        <button type="button" id="xplore_selection_submit" class="btn btn-lg" style="min-width: 140px; font-weight: 800; color: #ffffff; border: 1px solid #0d6efd; background: linear-gradient(180deg, #2f8cff 0%, #0d6efd 100%); box-shadow: 0 10px 24px rgba(13,110,253,0.35);">Run Analysis</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    $(window.parent.document.body).append(modalHtml);

    $(window.parent.document).on('input.xploreSelectionModal', '.xplore-selection-slider', function() {
        const value = Number($(this).val()).toFixed(2);
        $(this).closest('.xplore-selection-item').find('.xplore-slider-value').text(value);
    });

    $(window.parent.document).on('click.xploreSelectionModal', '.xplore-reset-row', function() {
        const rowIndex = $(this).data('row-index');
        const slider = $(window.parent.document).find(`.xplore-selection-slider[data-row-index="${rowIndex}"]`);
        slider.val(0).trigger('input');
    });

    $(window.parent.document).on('click.xploreSelectionModal', '#xplore_selection_reset_all', function() {
        $(window.parent.document).find('.xplore-selection-slider').each(function() {
            $(this).val(0).trigger('input');
        });
    });

    $(window.parent.document).on('click.xploreSelectionModal', '#xplore_selection_close, #xplore_selection_cancel', function() {
        closeXploreSelectionModal();
    });

    $(window.parent.document).on('click.xploreSelectionModal', '#xplore_selection_submit', async function() {
        await submitSelectedXploreAnalysis();
    });
}

function closeXploreSelectionModal() {
    
    $(".xplore-selection-item", window.parent.document).each(function () {
        const ids = JSON.parse($(this).attr("data-node-ids") || "[]");
        const index = $(this).data('row-index');
        const rawValue = parseFloat($(this).find('.xplore-selection-slider').val());
        const value = Number.isFinite(rawValue) ? rawValue : 1;

        air_xplore.selected_entities[index].value = value;
    });

    $('#xplore_selection_modal', window.parent.document).remove();
    $(window.parent.document).off('.xploreSelectionModal');
}

async function submitSelectedXploreAnalysis() {
    if (!air_xplore.selected_entities.length) {
        alert('Please select at least one map element first.');
        return;
    }

    const selectedDirection = $('#xplore_selection_direction', window.parent.document).val() || 'downstream';
    const submittedEntitySnapshot = air_xplore.selected_entities.map(entity => ({ ...entity }));
    const selectedElements = {};

    $(".xplore-selection-item", window.parent.document).each(function () {
        const ids = JSON.parse($(this).attr("data-node-ids") || "[]");
        const index = $(this).data('row-index');
        const rawValue = parseFloat($(this).find('.xplore-selection-slider').val());
        const value = Number.isFinite(rawValue) ? rawValue : 1;

        ids.forEach((nodeId) => {
            selectedElements[nodeId] = value;
        });
        air_xplore.selected_entities[index].value = value;
    });

    closeXploreSelectionModal();

    const displayText = `${selectedDirection.charAt(0).toUpperCase() + selectedDirection.slice(1)} analysis for ${Object.keys(selectedElements).length} selected element${Object.keys(selectedElements).length === 1 ? '' : 's'}`;

    const selectionLines = Object.keys(selectedElements).map(id => `- ${id} (value: ${selectedElements[id].toFixed(2)})`).join('\n');

    await runXploreSelectionAnalysisQuery(displayText, selectedElements);
    air_xplore.last_submitted_entities = submittedEntitySnapshot;

    const submittedCount = submittedEntitySnapshot.length;
    processServerResponses({
        response_type: 'html',
        content: `
            <div class="alert alert-info mb-0 d-flex justify-content-between align-items-center" role="alert" style="border-radius: 8px;">
                <span>Analysis was run for ${submittedCount} selected element${submittedCount === 1 ? '' : 's'}.</span>
                <button type="button" class="btn btn-sm btn-outline-primary xplore-reselect-elements-btn" title="Select analyzed elements again" aria-label="Select analyzed elements again">
                    <i class="fas fa-rotate-right"></i>
                </button>
            </div>
        `
    }, 'xplore', '', 'selection_analysis', false);

    updateXploreSelectionStatus();
}

async function runXploreSelectionAnalysisQuery(displayText, selectionPayload) {
    if (!displayText) return;

    const reasoningLevel = parseInt($('#xplore_reasoning_level').val(), 10) || 1;

    if (window.isProcessingResponse) {
        showWaitAlert('xplore');
        return;
    }

    let btnText = '';

    try {
        btnText = await disablebutton('xplore_btn_selection_modal');

        addThinkingIndicator('xplore', displayText);

        let responses = await getDataFromServer(
            `sylobio/perturbation_analysis`,
            {
                perturbations: selectionPayload,
            },
            'POST',
            'json'
        );

        processServerResponses(responses, 'xplore', displayText, 'selection_analysis');

    } catch (err) {
        console.error('Error processing selected element analysis:', err);
        processServerResponses({ response_type: 'alert', content: `Error: ${err.message}` }, 'xplore', displayText, 'selection_analysis', true);
    } finally {
        if (btnText) {
            enablebutton('xplore_btn_selection_modal', btnText);
        }

        if (window.isProcessingResponse) {
            window.isProcessingResponse = false;
        }
    }
} 