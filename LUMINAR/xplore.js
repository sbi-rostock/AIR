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
        <div class="card mt-3" style="border: 1px solid #FFF; padding: 0.3rem; display: flex; flex-direction: column; height: calc(100vh - 80px);">
            <div class="d-flex align-items-center justify-content-between mb-0">
                <div class="d-flex align-items-center gap-2">
                    <h4 class="mb-0">Explore the Disease Map</h4>
                </div>

                <div class="d-flex align-items-center gap-2">
                    <button type="button" id="xplore_btn_download_pdf" class="btn btn-sm btn-outline-secondary" title="Download chat as PDF">
                        <i class="fas fa-file-pdf"></i>
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
            <span style="text-align: center;margin-bottom: 4pt;">or</span>
            <div class="d-flex justify-content-center mb-2">
                <button type="button" id="xplore_btn_function_selector" class="btn btn-outline-secondary btn-sm">
                    <i class="fas fa-list"></i> Select Function
                </button>
            </div>
            <div id="xplore_selection_status" style="border: 1px solid var(--bs-border-color, #dee2e6); border-radius: 10px; background: var(--bs-body-bg, #fff); padding: 10px 12px;">
                <div class="d-flex align-items-center justify-content-between gap-2" style="min-height: 24px;">
                    <div id="xplore_selection_count" class="small fw-semibold" style="color: var(--bs-body-color, #212529);">0 elements selected</div>
                    <a href="#" id="xplore_btn_selection_modal" style="display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(180deg, #1f7bff 0%, #0d6efd 100%); color: #fff; font-weight: 600; font-size: 12px; padding: 4px 12px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 10px rgba(13, 110, 253, 0.25);"><i class="fas fa-play" style="font-size: 10px;"></i>Simulate</a>
                </div>
                <div class="d-flex align-items-start justify-content-between gap-2 mt-1" style="min-height: 20px;">
                    <div id="xplore_selection_names" class="small" style="color: var(--bs-secondary-color, #6c757d); flex: 1 1 auto; min-width: 0; overflow-x: scroll; overflow-y: hidden; white-space: nowrap; scrollbar-width: thin;">Click to select. Enable Multi-select to build a set.</div>
                    <div class="d-flex align-items-center gap-2" style="flex: 0 0 auto;">
                        <a href="#" id="xplore_clear_selection" class="small mt-2" style="display:none; color: var(--bs-secondary-color, #6c757d); font-weight: 600; text-decoration: none;">Clear</a>
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

    $(document).on('click', '.xplore-reselect-elements-btn', async function(e) {
        e.preventDefault();

        const encodedSelection = $(this).attr('data-selected-entities');
        if (!encodedSelection) {
            return;
        }

        let parsedSelection = [];

        try {
            parsedSelection = JSON.parse(decodeURIComponent(encodedSelection));
        } catch (error) {
            console.error('Could not decode stored xplore selection:', error);
            return;
        }

        if (!Array.isArray(parsedSelection) || parsedSelection.length === 0) {
            return;
        }

        if (air_xplore.selected_entities.length > 0 && !window.confirm('This will overwrite your current selection. Do you want to continue?')) {
            return;
        }

        const restoredEntities = [];

        for (const storedEntity of parsedSelection) {
            const entityName = String(storedEntity?.name || '').trim();
            if (!entityName) {
                continue;
            }

            try {
                const response = await getDataFromServer(
                    'sylobio/map_minerva_elements',
                    { elements: [{ name: entityName }] },
                    'POST',
                    'json'
                );

                const resolvedEntity = parseManualXploreEntityResponse(response);
                if (!resolvedEntity || !Array.isArray(resolvedEntity.nodes) || resolvedEntity.nodes.length === 0) {
                    continue;
                }

                resolvedEntity.value = Number.isFinite(Number(storedEntity.value)) ? Number(storedEntity.value) : 0;
                restoredEntities.push(resolvedEntity);
            } catch (error) {
                console.error(`Could not restore analyzed entity "${entityName}":`, error);
            }
        }

        if (restoredEntities.length === 0) {
            return;
        }

        air_xplore.selected_entities = restoredEntities;
        updateXploreSelectionStatus();
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


    $('#xplore_selection_status').on('click.xploreSelectionStatus', '.xplore-selection-chip-label', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const entityKey = $(this).attr('data-entity-key');
        if (!entityKey) {
            return;
        }
        const entity = air_xplore.selected_entities.find(entity => entity.name === entityKey);
        if (entity) {
            for(var node of entity.nodes) {
                
                if (!node.modelId || !Array.isArray(node.pins) || node.pins.length === 0) {
                    continue;
                }

                pin = node.pins[0];

                minerva.map.openMap({ id: pin[0] });

                minerva.map.fitBounds({
                    x1: pin[1] - 50,
                    y1: pin[2] - 50,
                    x2: pin[1] + 50,
                    y2: pin[2] + 50
                });

                break;
            }
        }
    });

    

    $('#xplore_selection_status').on('keydown.xploreSelectionStatus', '#xplore_manual_selection_input', async function(e) {
        if (e.key !== 'Enter') {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        $('#xplore_add_manual_selection').trigger('click');
    });

    $('#xplore_selection_status').on('click.xploreSelectionStatus', '#xplore_add_manual_selection', async function(e) {
        e.preventDefault();
        e.stopPropagation();

        const rawName = $('#xplore_manual_selection_input').val();
        await addManualXploreSelectionByName(rawName);
    });
}


async function xploreOnBioEntityClick(data) {
    if (!data || data.type !== 'ALIAS') {
        return;
    }


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
        if(air_xplore.selected_entities.length > 1)
        {
            if (window.confirm((`Do you want to clear your selection of ${air_xplore.selected_entities.length} elements?`))) {
                air_xplore.selected_entities = [entity];
            }
            else {
                return;
            }
        }
        air_xplore.selected_entities = [entity];
    } else if (!air_xplore.selected_entities.some(item => item.name === entity.name)) {
        air_xplore.selected_entities.push(entity);
    }

    updateXploreSelectionStatus();
}


function clearXploreSelectedEntities() {
    air_xplore.selected_entities = [];
    updateXploreSelectionStatus();
}

function parseManualXploreEntityResponse(response) {
    let payload = response;

    if (payload && Array.isArray(payload.data)) {
        payload = payload.data;
    }

    if (Array.isArray(payload)) {
        return payload[0] || null;
    }

    return payload || null;
}

async function addManualXploreSelectionByName(rawName) {
    const name = String(rawName || '').trim();
    const inputEl = $('#xplore_manual_selection_input');
    const addBtn = $('#xplore_add_manual_selection');

    if (!name) {
        inputEl.trigger('focus');
        return;
    }

    if (air_xplore.selected_entities.some(entity => entity.name === name)) {
        inputEl.val('');
        return;
    }

    inputEl.prop('disabled', true);
    addBtn.prop('disabled', true);

    try {

        var text = await disablebutton('xplore_add_manual_selection');

        const response = await getDataFromServer(
            'sylobio/map_minerva_elements',
            { elements: [{ name: name }] },
            'POST',
            'json'
        );

        const entity = parseManualXploreEntityResponse(response);

        if (!entity || !Array.isArray(entity.nodes) || entity.nodes.length === 0) {
            minerva.map.triggerSearch({ query: name, perfectSearch: true });
            alert(`Could not add "${name}" directly. The map search was opened so you can pick the exact element.`);
            return;
        }

        entity.value = Number.isFinite(entity.value) ? entity.value : 0;
        air_xplore.selected_entities.push(entity);
        inputEl.val('');
        updateXploreSelectionStatus();


    } catch (error) {
        console.error('Error while adding manual xplore selection:', error);
        minerva.map.triggerSearch({ query: name, perfectSearch: true });
        alert(`Could not resolve "${name}" automatically. The map search was opened instead.`);
    } finally {
        inputEl.prop('disabled', false);
        addBtn.prop('disabled', false);
        inputEl.trigger('focus');
        enablebutton('xplore_add_manual_selection', text);
    }
}

async function updateXploreSelectionStatus() {
    const selectedEntities = Array.isArray(air_xplore.selected_entities) ? air_xplore.selected_entities : [];
    const count = selectedEntities.length;

    const countEl = $('#xplore_selection_count');
    const namesEl = $('#xplore_selection_names');
    const clearEl = $('#xplore_clear_selection');
    const actionBtn = $('#xplore_btn_selection_modal');
    const manualInputEl = $('#xplore_manual_selection_input');

    if (countEl.length === 0) {
        return;
    }

    countEl.text(`${count} element${count === 1 ? '' : 's'} selected`);

    var selectionText = manualInputEl.length ? String(manualInputEl.val() || '').trim() : '';

    const manualEntryChip = `
        <span class="xplore-selection-chip" style="display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; background: transparent; color: var(--bs-secondary-color, #6c757d); padding: 2px 6px 2px 8px; border: 1px dashed var(--bs-border-color, #ced4da); max-width: 100%;">
            <i class="fas fa-plus" style="font-size: 10px; color: var(--bs-secondary-color, #6c757d);"></i>
            <input id="xplore_manual_selection_input" type="text" placeholder="Add by name" style="border: none; outline: none; background: transparent; color: var(--bs-body-color, #212529); width: 70px; font-size: 12px; line-height: 1.2; padding: 0;" />
            <button type="button" id="xplore_add_manual_selection" style="border: 1px solid #0d6efd; background: transparent; color: #0d6efd; border-radius: 6px; padding: 2px 8px; font-size: 11px; font-weight: 700; line-height: 1.2; cursor: pointer;">Add</button>
        </span>
    `;


    if (count > 0) {
        const chipsHtml = selectedEntities
            .map(entity => {

                return `
                    <span class="xplore-selection-chip" style="display: inline-flex; align-items: center; gap: 4px; border-radius: 8px; background: var(--bs-body-bg, #fff); color: var(--bs-body-color, #212529); padding: 2px 8px; border: 1px solid var(--bs-border-color, #dee2e6); max-width: 100%;">
                        <a href="#" class="xplore-selection-chip-label" data-entity-key="${entity.name}" style="max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #0d6efd; text-decoration: none;">${entity.name}</a>
                        <button type="button" class="xplore-remove-chip" data-entity-key="${entity.name}" style="border: none; background: transparent; color: var(--bs-secondary-color, #6c757d); font-weight: 700; line-height: 1; cursor: pointer; padding: 0;" aria-label="Remove selected element">&times;</button>
                    </span>
                `;
            })
            .join('');

        namesEl.html(`<div class="d-flex mb-2 mt-1 flex-nowrap align-items-center gap-1" style="width: max-content; min-width: 100%; white-space: nowrap;">${chipsHtml}${manualEntryChip}</div>`);
        clearEl.show();
        actionBtn
            .removeClass('disabled')
            .attr('aria-disabled', 'false')
            .css('pointer-events', 'auto')
            .css('opacity', 1);
    } else {
        namesEl.html(`<div class="d-flex mb-2 mt-1 flex-nowrap align-items-center gap-2" style="width: max-content; min-width: 100%; white-space: nowrap;"><span style="color: var(--bs-secondary-color, #6c757d);">Click to select (hold ctrl for multiple) or</span>${manualEntryChip}</div>`);
        namesEl.scrollLeft(0);
        clearEl.hide();
        actionBtn
            .addClass('disabled')
            .attr('aria-disabled', 'true')
            .css('pointer-events', 'none')
            .css('opacity', 0.65);
    }

    $('#xplore_manual_selection_input').val(selectionText)

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

    await removeHighlight("xplore_selection", exclude = false, remove_same_type = "pin");

    highlightPins(markers, created_by = "xplore_selection");


}
function getXploreSliderDisplayValue(value) {
    const numericValue = Number.isFinite(Number(value)) ? Number(value) : 0;
    return `${numericValue > 0 ? '+' : ''}${numericValue.toFixed(2)}`;
}

function getXploreSliderTone(value) {
    const numericValue = Number.isFinite(Number(value)) ? Number(value) : 0;

    if (numericValue > 0) {
        return {
            state: 'ACTIVATE',
            bg: '#f8d7da',
            color: '#dc3545',
            border: '#f5c6cb'
        };
    }

    if (numericValue < 0) {
        return {
            state: 'INHIBIT',
            bg: '#cfe2ff',
            color: '#0d6efd',
            border: '#b6d4fe'
        };
    }

    return {
        state: 'NEUTRAL',
        bg: '#e9ecef',
        color: '#6c757d',
        border: '#dee2e6'
    };
}

function updateXploreSelectionSliderUI(sliderElement) {
    const slider = $(sliderElement);
    const row = slider.closest('.xplore-selection-item');
    const value = Number(slider.val()) || 0;
    const tone = getXploreSliderTone(value);

    row.find('.xplore-slider-value')
        .text(getXploreSliderDisplayValue(value))
        .css({
            // background: tone.bg,
            color: tone.color,
            // borderColor: tone.border
        });

    row.find('.xplore-row-state')
        .text(tone.state)
        .css({
            color: tone.color
        });
}

function applyXploreSelectionPreset(value) {
    $(window.parent.document).find('.xplore-selection-slider').each(function() {
        $(this).val(value).trigger('input');
    });
}

function syncXploreSelectionModalValues() {
    $(".xplore-selection-item", window.parent.document).each(function () {
        const index = $(this).data('row-index');
        const rawValue = parseFloat($(this).find('.xplore-selection-slider').val());
        const value = Number.isFinite(rawValue) ? rawValue : 0;

        if (air_xplore.selected_entities[index]) {
            air_xplore.selected_entities[index].value = value;
        }
    });
}

async function showXploreSelectionModal() {
    if (!air_xplore.selected_entities.length) {
        alert('Please select at least one map element first.');
        return;
    }

    $('#xplore_selection_modal, #xplore_selection_modal_styles', window.parent.document).remove();
    $(window.parent.document).off('.xploreSelectionModal');

    const presetValues = [-1, -0.5, 0, 0.5, 1];
    const presetButtons = presetValues.map((value) => {
        const label = value > 0 ? `All +${value}` : `All ${value}`;
        return `
            <button
                type="button"
                class="xplore-selection-preset"
                data-preset-value="${value}">
                ${label}
            </button>
        `;
    }).join('');

    const elementRows = air_xplore.selected_entities.map((element, index) => {
        const ids = element.nodes.map(item => item.index);
        const initialValue = Number.isFinite(Number(element.value)) ? Number(element.value) : 0;
        const tone = getXploreSliderTone(initialValue);

        return `
            <div class="xplore-selection-item" data-row-index="${index}" data-node-ids='${JSON.stringify(ids)}'>
                <div class="xplore-selection-name" title="${element.name}">${element.name}</div>

                <div class="xplore-selection-control">
                    <div class="xplore-row-state" style="color:${tone.color};">${tone.state}</div>
                    <input
                        type="range"
                        class="xplore-selection-slider"
                        min="-1"
                        max="1"
                        step="0.01"
                        value="${initialValue}"
                        data-row-index="${index}">
                </div>

                <span
                    class="xplore-slider-value"
                    style="/* background:${tone.bg}; color:${tone.color}; /* border-color:${tone.border}; */">
                    ${getXploreSliderDisplayValue(initialValue)}
                </span>

                <button
                    type="button"
                    class="xplore-reset-row"
                    data-row-index="${index}"
                    title="Reset ${element.name} to 0"
                    aria-label="Reset ${element.name} to 0">
                    ↺
                </button>
            </div>
        `;
    }).join('');

    const modalHtml = `
        <style id="xplore_selection_modal_styles">
            #xplore_selection_modal {
                position: fixed;
                inset: 0;
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 16px;
                background: rgba(0, 0, 0, 0.75);
                box-sizing: border-box;
            }

            #xplore_selection_modal * {
                box-sizing: border-box;
            }

            #xplore_selection_modal .xplore-modal-panel {
                width: min(760px, 95vw);
                max-height: min(92vh, 820px);
                overflow: auto;
                border-radius: 12px;
                background: var(--bs-body-bg, #fff);
                border: 1px solid var(--bs-border-color, #dee2e6);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
                display: flex;
                flex-direction: column;
                font-size: 14px;
                line-height: 1.45;
            }

            #xplore_selection_modal .xplore-modal-header {
                position: sticky;
                top: 0;
                background: var(--bs-body-bg, #fff);
                border-bottom: 1px solid var(--bs-border-color, #dee2e6);
                padding: 14px 16px;
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 12px;
                z-index: 1;
            }

            #xplore_selection_modal .xplore-modal-title-wrap {
                min-width: 0;
            }

            #xplore_selection_modal .xplore-modal-title {
                font-weight: 700;
                font-size: 18px;
                line-height: 1.3;
                color: var(--bs-body-color, #212529);
            }

            #xplore_selection_modal .xplore-modal-subtitle {
                margin-top: 2px;
                font-size: 13px;
                line-height: 1.4;
                color: var(--bs-secondary-color, #6c757d);
                max-width: 100%;
            }

            #xplore_selection_modal .xplore-modal-close {
                border: 1px solid var(--bs-border-color, #dee2e6);
                background: transparent;
                border-radius: 10px;
                width: 34px;
                height: 34px;
                flex: 0 0 auto;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 22px;
                line-height: 1;
                color: var(--bs-secondary-color, #6c757d);
                cursor: pointer;
            }

            #xplore_selection_modal .xplore-modal-close:hover {
                color: var(--bs-body-color, #212529);
                background: rgba(0, 0, 0, 0.03);
            }

            #xplore_selection_modal .xplore-modal-body {
                padding: 14px 16px 16px 16px;
                display: flex;
                flex-direction: column;
                gap: 14px;
                min-height: 0;
            }

            #xplore_selection_modal .xplore-selection-summary-top {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                flex-wrap: wrap;
            }

            #xplore_selection_modal .xplore-selection-count {
                font-size: 13px;
                font-weight: 600;
                color: var(--bs-body-color, #212529);
            }

            #xplore_selection_modal .xplore-selection-count-badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 22px;
                height: 22px;
                padding: 0 6px;
                border-radius: 999px;
                background: #0d6efd;
                color: #fff;
                font-weight: 700;
                font-size: 12px;
                margin-right: 4px;
            }

            #xplore_selection_modal .xplore-selection-presets {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                justify-content: flex-end;
            }

            #xplore_selection_modal .xplore-selection-preset,
            #xplore_selection_modal #xplore_selection_reset_all {
                border: 1px solid var(--bs-border-color, #dee2e6);
                background: transparent;
                color: var(--bs-secondary-color, #6c757d);
                border-radius: 8px;
                padding: 5px 10px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
                white-space: nowrap;
            }

            #xplore_selection_modal .xplore-selection-preset:hover,
            #xplore_selection_modal #xplore_selection_reset_all:hover {
                background: rgba(13, 110, 253, 0.08);
                color: #0d6efd;
                border-color: #0d6efd;
            }

            #xplore_selection_modal .xplore-selection-scale-labels {
                margin-top: 6px;
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                font-weight: 600;
                color: var(--bs-secondary-color, #6c757d);
            }

            #xplore_selection_modal .xplore-selection-list {
                overflow-y: auto;
                max-height: 50vh;
                padding-right: 2px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            #xplore_selection_modal .xplore-selection-list::-webkit-scrollbar {
                width: 7px;
            }

            #xplore_selection_modal .xplore-selection-list::-webkit-scrollbar-thumb {
                background: #ced4da;
                border-radius: 999px;
            }

            #xplore_selection_modal .xplore-selection-item {
                display: grid;
                grid-template-columns: minmax(140px, 200px) minmax(220px, 1fr) auto auto;
                align-items: center;
                gap: 12px;
                padding: 10px 12px;
                border-radius: 10px;
                background: var(--bs-body-bg, #fff);
                border: 1px solid var(--bs-border-color, #dee2e6);
            }

            #xplore_selection_modal .xplore-selection-item:hover {
                background: rgba(0, 0, 0, 0.02);
            }

            #xplore_selection_modal .xplore-selection-name {
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                font-size: 14px;
                font-weight: 600;
                color: var(--bs-body-color, #212529);
            }

            #xplore_selection_modal .xplore-selection-control {
                display: flex;
                align-items: center;
                gap: 10px;
                min-width: 0;
            }

            #xplore_selection_modal .xplore-row-state {
                width: 62px;
                flex: 0 0 62px;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.03em;
                text-transform: uppercase;
                text-align: left;
            }

            #xplore_selection_modal .xplore-selection-slider {
                width: 100%;
                min-width: 0;
                cursor: pointer;
                -webkit-appearance: none;
                appearance: none;
                height: 6px;
                border-radius: 999px;
                outline: none;
                background: linear-gradient(90deg, #0d6efd 0%, #e9ecef 50%, #dc3545 100%);
            }

            #xplore_selection_modal .xplore-selection-slider::-webkit-slider-runnable-track {
                height: 6px;
                border-radius: 999px;
                background: transparent;
            }

            #xplore_selection_modal .xplore-selection-slider::-moz-range-track {
                height: 6px;
                border-radius: 999px;
                background: transparent;
            }

            #xplore_selection_modal .xplore-selection-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 16px;
                margin-top: -5px;
                border-radius: 50%;
                background: #ffffff;
                border: 2px solid #0d6efd;
                box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
            }

            #xplore_selection_modal .xplore-selection-slider::-moz-range-thumb {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #ffffff;
                border: 2px solid #0d6efd;
                box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
            }

            #xplore_selection_modal .xplore-slider-value {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 50px;
                padding: 3px 6px;
                font-size: 13px;
                font-weight: 700;
                text-align: center;
            }

            #xplore_selection_modal .xplore-reset-row {
                width: 28px;
                height: 28px;
                border: 1px solid var(--bs-border-color, #dee2e6);
                background: transparent;
                color: var(--bs-secondary-color, #6c757d);
                border-radius: 8px;
                cursor: pointer;
                transition: background 0.12s ease, color 0.12s ease;
            }

            #xplore_selection_modal .xplore-reset-row:hover {
                background: rgba(0, 0, 0, 0.03);
                color: var(--bs-body-color, #212529);
            }

            #xplore_selection_modal .xplore-modal-footer {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                gap: 10px;
                flex-wrap: wrap;
            }

            #xplore_selection_modal #xplore_selection_cancel {
                border: 1px solid var(--bs-border-color, #dee2e6);
                background: transparent;
                color: var(--bs-secondary-color, #6c757d);
                border-radius: 8px;
                padding: 8px 16px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.12s ease;
            }

            #xplore_selection_modal #xplore_selection_cancel:hover {
                background: rgba(0, 0, 0, 0.03);
            }

            #xplore_selection_modal #xplore_selection_submit {
                min-width: 140px;
                padding: 10px 18px;
                font-size: 14px;
                font-weight: 700;
                letter-spacing: 0.2px;
                border: 1px solid #0b5ed7;
                border-radius: 8px;
                background: linear-gradient(180deg, #1f7bff 0%, #0d6efd 100%);
                color: #ffffff;
                box-shadow: 0 8px 20px rgba(13, 110, 253, 0.28);
                cursor: pointer;
                transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease;
            }

            #xplore_selection_modal #xplore_selection_submit:hover {
                filter: brightness(1.03);
                transform: translateY(-1px);
                box-shadow: 0 12px 24px rgba(13, 110, 253, 0.34);
            }

            @media (max-width: 700px) {
                #xplore_selection_modal .xplore-selection-item {
                    grid-template-columns: 1fr;
                    align-items: stretch;
                }

                #xplore_selection_modal .xplore-selection-control {
                    flex-direction: column;
                    align-items: stretch;
                }

                #xplore_selection_modal .xplore-row-state {
                    width: auto;
                    flex: none;
                }

                #xplore_selection_modal .xplore-modal-footer {
                    flex-direction: column;
                    align-items: stretch;
                }
            }
        </style>

        <div id="xplore_selection_modal">
            <div class="xplore-modal-panel" role="dialog" aria-modal="true" aria-labelledby="xplore_selection_modal_title">
                <div class="xplore-modal-header">
                    <div class="xplore-modal-title-wrap">
                        <div class="xplore-modal-subtitle">
                            Set a perturbation value per target, from inhibition to activation, or apply a preset to all targets.
                        </div>
                    </div>
                    <button type="button" id="xplore_selection_close" class="xplore-modal-close" aria-label="Close modal">
                        &times;
                    </button>
                </div>

                <div class="xplore-modal-body">
                    <div class="xplore-selection-summary">

                        <div class="xplore-selection-summary-top" style="margin-top: 8px;">
                            <div class="xplore-selection-count">
                                ${air_xplore.selected_entities.length} target${air_xplore.selected_entities.length === 1 ? '' : 's'} selected
                            </div>
                            <div class="xplore-selection-presets">
                                ${presetButtons}
                                <button type="button" id="xplore_selection_reset_all">Reset all</button>
                            </div>
                        </div>
                    </div>

                    <div class="xplore-selection-list">
                        ${elementRows}
                    </div>

                    <div class="xplore-modal-footer">
                        <button type="button" id="xplore_selection_cancel">Cancel</button>
                        <button type="button" id="xplore_selection_submit">Run analysis</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    $(window.parent.document.body).append(modalHtml);

    $(window.parent.document).find('.xplore-selection-slider').each(function() {
        updateXploreSelectionSliderUI(this);
    });

    $(window.parent.document).on('input.xploreSelectionModal', '.xplore-selection-slider', function() {
        updateXploreSelectionSliderUI(this);
    });

    $(window.parent.document).on('click.xploreSelectionModal', '.xplore-reset-row', function() {
        const rowIndex = $(this).data('row-index');
        const slider = $(window.parent.document).find(`.xplore-selection-slider[data-row-index="${rowIndex}"]`);
        slider.val(0).trigger('input');
    });

    $(window.parent.document).on('click.xploreSelectionModal', '.xplore-selection-preset', function() {
        const presetValue = Number($(this).attr('data-preset-value'));
        applyXploreSelectionPreset(Number.isFinite(presetValue) ? presetValue : 0);
    });

    $(window.parent.document).on('click.xploreSelectionModal', '#xplore_selection_reset_all', function() {
        applyXploreSelectionPreset(0);
    });

    $(window.parent.document).on('click.xploreSelectionModal', '#xplore_selection_modal', function(event) {
        if (event.target === this) {
            closeXploreSelectionModal();
        }
    });

    $(window.parent.document).on('keydown.xploreSelectionModal', function(event) {
        if (event.key === 'Escape') {
            closeXploreSelectionModal();
        }
    });

    $(window.parent.document).on('click.xploreSelectionModal', '#xplore_selection_close, #xplore_selection_cancel', function() {
        closeXploreSelectionModal();
    });

    $(window.parent.document).on('click.xploreSelectionModal', '#xplore_selection_submit', async function() {
        await submitSelectedXploreAnalysis();
    });
}

function closeXploreSelectionModal() {
    syncXploreSelectionModalValues();
    $('#xplore_selection_modal, #xplore_selection_modal_styles', window.parent.document).remove();
    $(window.parent.document).off('.xploreSelectionModal');
}

async function submitSelectedXploreAnalysis() {
    if (!air_xplore.selected_entities.length) {
        alert('Please select at least one map element first.');
        return;
    }

    const selectedElements = {};

    $(".xplore-selection-item", window.parent.document).each(function () {
        const ids = JSON.parse($(this).attr("data-node-ids") || "[]");
        const index = $(this).data('row-index');
        const rawValue = parseFloat($(this).find('.xplore-selection-slider').val());
        const value = Number.isFinite(rawValue) ? rawValue : 0;

        ids.forEach((nodeId) => {
            selectedElements[nodeId] = value;
        });

        if (air_xplore.selected_entities[index]) {
            air_xplore.selected_entities[index].value = value;
        }
    });

    const submittedEntitySnapshot = air_xplore.selected_entities.map(entity => ({
        name: entity.name,
        value: Number.isFinite(Number(entity.value)) ? Number(entity.value) : 0
    }));

    closeXploreSelectionModal();

    const selectedCount = Object.keys(selectedElements).length;
    const displayText = `Perturbation analysis for ${selectedCount} selected element${selectedCount === 1 ? '' : 's'}`;
    const encodedSelectionSnapshot = encodeURIComponent(JSON.stringify(submittedEntitySnapshot));

    const submittedCount = submittedEntitySnapshot.length;
    additional_responses = [{
        response_type: 'html',
        content: `
            <div class="mb-0 d-flex justify-content-between align-items-center" role="alert" style="border-radius: 8px; padding: 5px">
                <span>Analysis was run for ${submittedCount} selected element${submittedCount === 1 ? '' : 's'}. Reapply perturbations?</span>
                <button type="button" class="btn btn-sm btn-outline-primary xplore-reselect-elements-btn" data-selected-entities="${encodedSelectionSnapshot}" title="Select analyzed elements again" aria-label="Select analyzed elements again">
                    <i class="fas fa-rotate-right"></i>
                </button>
            </div>
        `
    }];

    updateXploreSelectionStatus();

    await runXploreSelectionAnalysisQuery(displayText, selectedElements, additional_responses);

}

async function runXploreSelectionAnalysisQuery(displayText, selectionPayload, additional_responses = []) {
    if (!displayText) return;

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

        processServerResponses(responses.concat(additional_responses), 'xplore', displayText, 'selection_analysis');

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