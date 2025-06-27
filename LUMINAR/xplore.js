air_data.xplore = {
    container: null,
    added_markers: []
}

var air_xplore = air_data.xplore

async function xplore() {
    air_xplore.container = air_data.container.find('#xplore_tab_content');

    $(
        `
        <div class="card card-body mt-3" style="border: 1px solid #FFF;">
            <div class="d-flex align-items-center justify-content-between mb-0">
                <h4 class="mb-0">Explore the Disease Map</h4>
                <div class="d-flex align-items-center gap-2">
                    <button type="button" id="xplore_btn_download_pdf" class="btn btn-sm btn-outline-secondary" title="Download chat as PDF">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                    <button type="button" id="xplore_btn_expand_chat" class="btn btn-sm btn-outline-primary air_expand_btn" title="Expand chat">
                        <i class="fas fa-arrow-left air_expand_arrow"></i>
                    </button>
                    <button type="button" class="btn btn-link p-0 fixed-queries-link" data-origin="xplore" style="color: #6c757d; font-size: 1.2em;" title="Show example queries">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            </div>
            <form id="xplore_queryform" class="d-flex mt-2 mb-3">
                <input type="text" id="xplore_query_input" class="form-control me-2" style="flex: 1;" 
                    placeholder="Ask a question ..." aria-label="Query input">
                <button type="button" id="xplore_btn_query" class="air_btn btn">Submit</button>
            </form>
            <div id="xplore_analysis_content" style="width: 100%; height: 100%; max-width: 800px; overflow-x: auto; overflow-y: auto; font-size: 12px;">
                <div class="text-center text-muted pt-5">
                    Submit a query to see results here
                </div>
            </div>
        </div>
        `
    ).appendTo(air_xplore.container);

    // Handle Enter key in the query input
    $("#xplore_query_input").on('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission
            $("#xplore_btn_query").trigger('click'); // Trigger the click event on the submit button
            return false;
        }
    });

    // Handle query button click
    $("#xplore_btn_query").on('click', async function() {
        var btn_text = await disablebutton("xplore_btn_query");
        
        try {
            const response = await getDataFromServer(
                "sylobio/query_llm_map",
                { query: $("#xplore_query_input").val() },
                "POST",
                "json"
            );

            console.log(response);
            
            // Use the generalized function to process responses
            processServerResponses(response, "xplore", $("#xplore_query_input").val(), "Xplore", true);
            
        } catch (err) {
            console.error("Error processing query:", err);
            processServerResponses({"response_type": "alert", "content": `Error: ${err.message}`}, "xplore", "", "Xplore", false);
        } finally {
            enablebutton("xplore_btn_query", btn_text);
        }
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