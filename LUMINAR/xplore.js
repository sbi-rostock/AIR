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
            <h4>Explore the Disease Map</h4>
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
            processServerResponses(response, "xplore", $("#xplore_query_input").val(), "Xplore");
            
        } catch (err) {
            console.error("Error processing query:", err);
            processServerResponses({"response_type": "alert", "content": `Error: ${err.message}`}, "xplore", $("#xplore_query_input").val(), "Xplore");
        } finally {
            enablebutton("xplore_btn_query", btn_text);
        }
    });
} 