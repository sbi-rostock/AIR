air_data.omics = {
    loaded_data: null,
    filtered_data: null,
    analysis_results: null,
    result_image: null,
    container: null,
    added_markers: [],
    selected_data_ids: [],
    data_tree: {
        fairdom: { title: "FAIRDOMHub", data: {} },
        user: { title: "User Uploads", data: {} }
    }
}

var air_omics = air_data.omics

async function omics() {
    air_omics.container = air_data.container.find('#airomics_tab_content');

    $(
        `
        <button class="btn air_collapsible mt-2" id="omics_collapse_1_btn" type="button" data-bs-toggle="collapse" data-bs-target="#omics_collapse_1" aria-expanded="true" aria-controls="omics_collapse_1">
            1. Upload Data
        </button>
        <div class="collapse show" id="omics_collapse_1">
            <div class="card card-body">
                <form id="omics_fileForm">
                    <div class="mb-2">
                        <input type="file" class="form-control" id="omics_file" accept=".csv,.txt,.tsv" multiple>
                    </div>
                    <div class="form-check mb-2" style="display: flex; align-items: center; gap: 5px;">
                        <div>
                            <input class="form-check-input" type="checkbox" id="omics_cb_pvalues">
                            <label class="form-check-label" for="omics_cb_pvalues">
                                Data includes p-values
                            </label>
                        </div>
                        <button type="button" class="air_btn_info btn btn-info btn-sm" 
                                data-bs-toggle="tooltip" data-bs-placement="right"
                                title="P-values should be in every second column (ignoring index column). Column names should contain 'pvalue' or 'p-value' (case insensitive).">
                            ?
                        </button>
                    </div>
                    <div style="text-align: center;">
                        <button id="omics_btn_submit" type="submit" class="air_btn btn mb-2 mt-2">Upload and Process</button>
                    </div>
                </form>
            </div>
        </div>

        <button class="btn air_collapsible mt-2 collapsed air_disabledbutton" id="omics_collapse_2_btn" type="button" data-bs-toggle="collapse" data-bs-target="#omics_collapse_2" aria-expanded="false" aria-controls="omics_collapse_2">
            2. Select Data
        </button>
        <div class="collapse" id="omics_collapse_2">
            <div class="card card-body">
                <div id="omics_data_treeview" class="treeview fair_jstree">
                </div>
                <div style="text-align: center;">
                    <button type="button" id="omics_btn_viewdata" class="air_btn btn air_disabledbutton mt-4 mb-2">
                        View
                    </button>
                    <button type="button" id="omics_btn_deletedata" class="air_btn btn air_disabledbutton mt-4 mb-2">
                        Delete
                    </button>
                </div>
                
                <button class="btn air_collapsible mt-2 collapsed air_disabledbutton" id="omics_collapse_viewdata_btn" type="button" data-bs-toggle="collapse" data-bs-target="#omics_collapse_viewdata" aria-expanded="false" aria-controls="omics_collapse_viewdata">
                    Data Visualization
                </button>
                <div class="collapse" id="omics_collapse_viewdata">
                    <div class="card card-body">
                        <select class="form-select mb-1 mt-2" id="omics_select_column">
                        </select>
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="checkbox" value="" id="omics_cb_nonmapped">
                            <label class="form-check-label" for="omics_cb_nonmapped">
                                Include non-mapped entries
                            </label>
                        </div>
                        <div id="table-container" style="width: 100%; max-width: 800px; overflow-x: auto; font-size: 10px;">
                            <table id="omics_datatable" class="display" width="100%"></table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <button class="btn air_collapsible mt-2 collapsed air_disabledbutton" id="omics_collapse_3_btn" type="button" data-bs-toggle="collapse" data-bs-target="#omics_collapse_3" aria-expanded="false" aria-controls="omics_collapse_3">
            3. Run Analysis
        </button>
        <div class="collapse" id="omics_collapse_3">
            <div class="card card-body">
                <div style="text-align: center;">
                    <button type="button" id="omics_btn_analyze" style="width: 100%;" class="air_btn btn btn-block air_disabledbutton">Run Analysis</button>
                </div>
            </div>
        </div>
        <button class="btn air_collapsible mt-2 collapsed air_disabledbutton" id="omics_collapse_4_btn" type="button" data-bs-toggle="collapse" data-bs-target="#omics_collapse_4" aria-expanded="false" aria-controls="omics_collapse_4">
            4. Submit your Query
        </button>
        <div class="collapse" id="omics_collapse_4">
            <div class="card card-body">
                <form id="omics_queryform" class="d-flex mb-2">
                    <input type="text" id="omics_query_input" class="form-control me-2" style="flex: 1;" aria-label="Text input with segmented dropdown button">
                    <button type="button" type="submit" id="omics_btn_query" class="air_btn btn">Submit</button>
                </form>
                <div id="omics_analysis_content" style="width: 100%; height: 100%; max-width: 800px; overflow-x: auto; overflow-y: auto; font-size: 10px;">

                </div>
            </div>
        </div>
        `
    ).appendTo(air_omics.container);

    $("#omics_query_input").on('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission
            $("#omics_btn_query").trigger('click'); // Trigger the click event on the submit button
        }
    });

    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });

    // Initialize the data tree
    initializeDataTree();

    $("#omics_cb_nonmapped").on('change', highlightOmicsColumn);
    $("#omics_select_column").on('change', highlightOmicsColumn);

    // Add file input change handler for p-value detection
    $("#omics_file").on('change', async function(e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        try {
            // Check first file to detect p-values
            const file = files[0];
            const content = await file.text();
            const lines = content.split('\n');
            if (lines.length < 2) return;  // Need at least header and one data row

            // Get headers
            const delimiter = content.includes('\t') ? '\t' : ',';
            const headers = lines[0].split(delimiter);

            // Check if data might contain p-values
            const hasPValues = detectPValues(headers);
            $("#omics_cb_pvalues").prop('checked', hasPValues);
        } catch (err) {
            console.error("Error reading file:", err);
        }
    });

    // Handle file upload form submission
    air_omics.container.on('submit', '#omics_fileForm', async (e) => {
        e.preventDefault();

        const fileInput = $("#omics_file")[0];
        const files = fileInput.files;

        if (!files || files.length === 0) {
            alert('Please select at least one file first');
            return;
        }

        try {
            var btn_text = await disablebutton("omics_btn_submit");
            
            // Process each file
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const formData = new FormData();
                formData.append('file', file);
                formData.append('has_pvalues', $("#omics_cb_pvalues").prop('checked'));
                formData.append('session', air_data.session_token);
                
                const response = await getDataFromServer(
                    "sylobio/process_omics", 
                    formData, 
                    "POST",
                    "json",
                );

                for(var dataset of response)
                {
                    // Add data to the tree
                    addDataToTree('user', dataset.name, dataset.data_id);
                }
            }

            $("#omics_collapse_2_btn").removeClass("air_disabledbutton");
            $("#omics_collapse_3_btn").removeClass("air_disabledbutton");

            enablebutton("omics_btn_submit", btn_text);            
            // Enable and show next section
            bootstrap.Collapse.getOrCreateInstance(document.querySelector('#omics_collapse_1')).hide();
            bootstrap.Collapse.getOrCreateInstance(document.querySelector('#omics_collapse_2')).show();
            bootstrap.Collapse.getOrCreateInstance(document.querySelector('#omics_collapse_3')).show();
            
        } catch (err) {
            console.error("Error processing omics file:", err);
            alert(`Failed to process file: ${err.message}`);
        } finally {
            enablebutton("omics_btn_submit", btn_text);
        }
    });

 
    // Handle both selection and deselection events
    $('#omics_data_treeview').on('select_node.jstree deselect_node.jstree', function (e, data) {
        // Get all selected nodes
        const selectedNodes = $('#omics_data_treeview').jstree('get_selected', true);
        
        // Reset selected data ids and add all currently selected nodes
        air_omics.selected_data_ids = [];
        selectedNodes.forEach(function(selectedNode) {
            if (selectedNode.original.data_id) {
                air_omics.selected_data_ids.push(selectedNode.original.data_id);
            }
        });
        
        // Enable/disable the load button based on whether any data_id is selected
        if (air_omics.selected_data_ids.length > 1) {
            $("#omics_btn_deletedata").removeClass("air_disabledbutton");
            $("#omics_btn_viewdata").addClass("air_disabledbutton");
            $("#omics_btn_analyze").removeClass("air_disabledbutton");
        }
        else if (air_omics.selected_data_ids.length == 1) {
            $("#omics_btn_viewdata").removeClass("air_disabledbutton");
            $("#omics_btn_deletedata").removeClass("air_disabledbutton");
            $("#omics_btn_analyze").removeClass("air_disabledbutton");
        }
        else {
            $("#omics_btn_viewdata").addClass("air_disabledbutton");
            $("#omics_btn_deletedata").addClass("air_disabledbutton");
        }
    });

    // Handle load data button click
    $('#omics_btn_viewdata').on('click', async function() {
        if (air_omics.selected_data_ids.length != 1) return;

        try {
            var btn_text = await disablebutton("omics_btn_viewdata");

            // Get the data from the tree
            const data = await getDataFromTree(air_omics.selected_data_ids[0]);
            if (!data) {
                throw new Error("Selected data not found");
            }

            // Store current data
            air_omics.loaded_data = data;

            // Setup the data table
            const processedData = processDataForTable(data, true);
            createDataTable('#omics_datatable', processedData.data, processedData.columns);

            // Setup column selector
            setupColumnSelector('#omics_select_column', data.columns);
            
            // Enable and show visualization section
            bootstrap.Collapse.getOrCreateInstance(document.querySelector('#omics_collapse_viewdata')).show();
            $("#omics_collapse_3_btn").removeClass("air_disabledbutton");
            $("#omics_collapse_viewdata_btn").removeClass("air_disabledbutton");

            enablebutton("omics_btn_viewdata", btn_text);
        } catch (err) {
            console.error("Error loading data:", err);
            alert(`Failed to load data: ${err.message}`);
        } finally {
            enablebutton("omics_btn_viewdata", btn_text);
        }
    });
    $('#omics_btn_deletedata').on('click', async function() {
        if (air_omics.selected_data_ids.length == 0) return;

        try {
            var btn_text = await disablebutton("omics_btn_deletedata");

            const response = await getDataFromServer(
                "sylobio/delete_omics",
                { data_id: air_omics.selected_data_ids},
                "POST",
                "json"
            );

            // Remove the data from the tree
            removeDataFromTree(air_omics.selected_data_ids);

            enablebutton("omics_btn_deletedata", btn_text);
        } catch (err) {
            console.error("Error deleting data:", err);
            alert(`Failed to delete data: ${err.message}`);
        } finally {
            enablebutton("omics_btn_deletedata", btn_text);
        }

    });

    // Handle analysis button click
    $("#omics_btn_analyze").on('click', async function() {
        try {
            var btn_text = await disablebutton("omics_btn_analyze", progress = true);
            
            const total = air_omics.selected_data_ids.length;

            await updateProgress(0, total, "omics_btn_analyze", text = `Initialising...`);

            await getDataFromServer(
                "sylobio/prepare_LLM",
                { data_ids: air_omics.selected_data_ids },
                "POST",
                "json"
            );
            
            // Process each dataset separately
            for (let i = 0; i < total; i++) {

                // Update progress bar with current file information
                await updateProgress(i, total, "omics_btn_analyze", text = `Processing dataset ${i+1}/${total} ...`);

                // Request analysis for the current dataset from server
                await getDataFromServer(
                    "sylobio/analyze_data",
                    { data_id: i},
                    "POST",
                    "json"
                );
            }
            
            // Final progress update
            await updateProgress(total, total, "omics_btn_analyze", text = "Initialising LLM...");

            await getDataFromServer(
                "sylobio/initialize_LLM",
                {},
                "POST",
                "json"
            );
            
            bootstrap.Collapse.getOrCreateInstance(document.querySelector('#omics_collapse_3')).hide();
            bootstrap.Collapse.getOrCreateInstance(document.querySelector('#omics_collapse_4')).show();
            $("#omics_collapse_4_btn").removeClass("air_disabledbutton");

            enablebutton("omics_btn_analyze", btn_text);
        } catch (err) {
            console.error("Error during analysis:", err);
            alert(`Analysis failed: ${err.message}`);
        }
        finally {
            enablebutton("omics_btn_analyze", btn_text);
        }
    });

    // Handle file upload form submission
    $("#omics_btn_query").on('click', async function() {
        try {
            var btn_text = await disablebutton("omics_btn_query");
            
            const response = await getDataFromServer(
                "sylobio/query_llm",
                { query: $("#omics_query_input").val() },
                "POST",
                "json"
            );

            console.log(response);
            
            // Use the generalized function to process responses
            processServerResponses(response, "omics", $("#omics_query_input").val(), "analysis");
            
            enablebutton("omics_btn_query", btn_text);  
        } catch (err) {
            console.error("Error processing query:", err);
            
            processServerResponses({"response_type": "alert", "content": `Error: ${err.message}`}, "omics", $("#omics_query_input").val(), "analysis");
        } finally {
            enablebutton("omics_btn_query", btn_text);
        }
    });
    
    // Setup node map link handling
    setupNodeMapLinks();
}

function initializeDataTree() {
    $('#omics_data_treeview').jstree({
        'core': {
            'data': buildTreeData(),
            'themes': {
                'dots': true,
                'icons': true
            }
        },
        'plugins': ['wholerow']
    });
}

function buildTreeData() {
    const treeData = [];
    
    // Add each data source as a top-level node
    for (const [source, sourceData] of Object.entries(air_omics.data_tree)) {
        const sourceNode = {
            id: `source-${source}`,
            text: sourceData.title,
            icon: getSourceIcon(source),
            state: { opened: true },
            children: []
        };

        // Add data entries as children
        for (const [dataId, dataInfo] of Object.entries(sourceData.data)) {
            sourceNode.children.push({
                id: `data-${dataId}`,
                text: dataInfo.title,
                icon: getDataIcon(dataInfo.type),
                data_id: dataId
            });
        }

        treeData.push(sourceNode);
    }

    return treeData;
}

function getSourceIcon(source) {
    const icons = {
        'fairdom': 'https://fairdomhub.org/assets/fairdom-seek-logo-6be8618c4036c446fda08690eb9548440ff7c25af936875fc2972c9bf34c84e5.svg',
        'user': 'https://pixsector.com/cache/94bed8d5/av3cbfdc7ee86dab9a41d.png'
    };
    return icons[source] || false;
}

function getDataIcon(type) {
    const icons = {
        'omics': 'https://fairdomhub.org/assets/file_icons/small/txt-6dfb7dfdd4042a4fc251a5bee07972dd61df47e8d979cce525a54d8989300218.png',
        'default': 'https://fairdomhub.org/assets/file_icons/small/txt-6dfb7dfdd4042a4fc251a5bee07972dd61df47e8d979cce525a54d8989300218.png'
    };
    return icons[type] || icons.default;
}

function addDataToTree(source, title, data_id) {

    $("#omics_collapse_2_btn").removeClass("air_disabledbutton");

    // Add data to the tree structure
    air_omics.data_tree[source].data[data_id] = {
        title: title,
        type: 'omics',
    };

    // Refresh the tree view
    if ($('#omics_data_treeview').jstree(true)) {
        $('#omics_data_treeview').jstree(true).settings.core.data = buildTreeData();
        $('#omics_data_treeview').jstree(true).refresh();
    }

    bootstrap.Collapse.getOrCreateInstance(document.querySelector('#omics_collapse_3')).show();
}

function removeDataFromTree(dataIds) {
    for (const dataId of dataIds) {
        delete air_omics.data_tree[dataId];
    }

    // Refresh the tree view
    if ($('#omics_data_treeview').jstree(true)) {
        $('#omics_data_treeview').jstree(true).settings.core.data = buildTreeData();
        $('#omics_data_treeview').jstree(true).refresh();
    }
}

async function getDataFromTree(dataId) {
    // Search for the data in all sources
    try {
        var btn_text = await disablebutton("omics_btn_viewdata");

        const response = await getDataFromServer(
            "sylobio/get_omics_data",
            { data_id: dataId },
            "POST",
            "json"
        );

        enablebutton("omics_btn_viewdata", btn_text);

        return response;
    } catch (err) {
        console.error("Error getting data from tree:", err);
        enablebutton("omics_btn_viewdata", btn_text);
        return null;
    }
}

function detectPValues(headers) {
    // Skip first column (index) and clean headers
    const dataColumns = headers.slice(1).map(header => header.trim().replace(/\r$/, ''));

    // Check if we have an odd number of data columns
    if (dataColumns.length % 2 !== 0) return false;

    // Check if every second column contains 'pvalue' or 'p-value'
    for (let i = 1; i < dataColumns.length; i += 2) {
        const colName = dataColumns[i].toLowerCase();
        if (!colName.includes('pvalue') && !colName.includes('p-value')) {
            return false;
        }
    }

    return true;
}

function highlightOmicsColumn() {
    highlightColumn({
        selectedColumn: $("#omics_select_column").val(),
        data: air_omics.loaded_data,
        markerArray: air_omics.added_markers,
        includeNonMapped: $("#omics_cb_nonmapped").prop('checked'),
        markerPrefix: "omics_marker_"
    });
}

// Add click handler for node mapping links
$(document).on('click', '.node_map_link', function(e) {
    e.preventDefault();
    var minerva_id = $(this).data('id');

    minerva.map.triggerSearch({ query: $(this).text(), perfectSearch: true});
    
    minerva.map.openMap({ id: minerva_id[0] });

    minerva.map.fitBounds({
        x1: minerva_id[4],
        y1: minerva_id[5],
        x2: minerva_id[4] + minerva_id[3],
        y2: minerva_id[5] + minerva_id[2]
    });
});