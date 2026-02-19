air_data.xplore = {
    container: null,
    added_markers: []
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
        </div>
        `
    ).appendTo(air_xplore.container);

    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });

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
} 