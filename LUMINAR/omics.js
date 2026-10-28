air_data.omics = {
    loaded_data: null,
    filtered_data: null,
    analysis_results: null,
    result_image: null,
    container: null,
    added_markers: [],
    selected_data_ids: [],
    node_selection_request: 0,
    data_tree: {
        fairdom: { title: "FAIRDOMHub", data: {} },
        user: { title: "User Uploads", data: {} }
    },
    data_types: {
        "transcriptomics": "Transcriptomics",
        "proteomics": "Proteomics",
        "metabolomics": "Metabolomics",
        "genomics": "Genomics",
        "epigenomics": "Epigenomics",
        "other": "Other"
    }
}

var air_omics = air_data.omics

async function omics() {
    air_omics.container = air_data.container.find('#airomics_tab_content');
    
    // Remove plugin header element from parent document
    removePluginHeader();
    
    // Maximize plugin container size
    maximizePluginContainer();

    $(
        `
        <button class="btn air_collapsible mt-2" id="omics_collapse_1_btn" type="button" data-bs-toggle="collapse" data-bs-target="#omics_collapse_1" aria-expanded="true" aria-controls="omics_collapse_1">
            1. Upload Data
        </button>
        <div class="collapse show" id="omics_collapse_1">
            <div class="card" style="padding: 1rem;">
                <form id="omics_fileForm">
                    <div class="mb-2">
                        <input type="file" class="form-control" id="omics_file" multiple accept=".txt,.tsv,.csv,.tab,.zip,.xlsx,.xls">
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
                        <div style="font-size: 0.8em;">
                            <a href="#" id="omics_example_data" class="air_link">Use example data</a>
                            <a href="https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE131032" target="_blank" class="air_link" style="margin-left: 5px;">
                                <i class="fas fa-info-circle"></i>
                            </a>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <button class="btn air_collapsible mt-2 collapsed air_disabledbutton" id="omics_collapse_2_btn" type="button" data-bs-toggle="collapse" data-bs-target="#omics_collapse_2" aria-expanded="false" aria-controls="omics_collapse_2">
            2. Select Data
        </button>
        <div class="collapse" id="omics_collapse_2">
            <div class="card" style="padding: 1rem;">
                <div id="omics_data_treeview" class="treeview fair_jstree">
                </div>
                <div id="omics_file_btn_container" style="display: flex; justify-content: center; gap: 8px; margin: 20px 0;">
                    <button type="button" id="omics_btn_viewdata" class="omics-action-btn omics-btn-view air_disabledbutton" title="View dataset details and visualize data">
                        <i class="fas fa-eye"></i>
                        <span>View</span>
                    </button>
                    <button type="button" id="omics_btn_editdata" class="omics-action-btn omics-btn-edit air_disabledbutton" title="Edit dataset properties and settings">
                        <i class="fas fa-edit"></i>
                        <span>Edit</span>
                    </button>
                    <button type="button" id="omics_btn_mergedata" class="omics-action-btn omics-btn-merge air_disabledbutton" title="Merge selected datasets into a single dataset">
                        <i class="fas fa-object-group"></i>
                        <span>Merge</span>
                    </button>
                    <button type="button" id="omics_btn_deletedata" class="omics-action-btn omics-btn-delete air_disabledbutton" title="Remove dataset from analysis">
                        <i class="fas fa-trash-alt"></i>
                        <span>Delete</span>
                    </button>
                        <button type="button" id="omics_btn_downloaddata" class="omics-action-btn omics-btn-download air_disabledbutton" title="Download selected datasets as TSV files in a zip file. The files are kept with edits such as filtered samples, split data, and dataset descriptions, to facilitate re-upload.">
                        <i class="fas fa-download"></i>
                        <span>Download</span>
                    </button>
                </div>
                
                <button class="btn air_collapsible mt-2 collapsed air_disabledbutton" id="omics_collapse_viewdata_btn" type="button" data-bs-toggle="collapse" data-bs-target="#omics_collapse_viewdata" aria-expanded="false" aria-controls="omics_collapse_viewdata">
                    Data Visualization
                </button>
                <div class="collapse" id="omics_collapse_viewdata">
                    <div class="card" style="padding: 1rem;">
                        <div class="d-flex gap-2 mb-1 mt-2">
                            <select class="form-select" id="omics_select_column" data-bs-toggle="tooltip" data-bs-placement="right" title="Select a data column to visualize on the Disease Map">
                            </select>
                            <input type="text" style="width: 80px;" class="form-control form-control-sm" id="omics_select_column_filter" placeholder="p-value" data-bs-toggle="tooltip" data-bs-placement="right" title="Only show values with p-values below this threshold">
                            <button type="button" class="btn btn-outline-secondary" id="omics_select_column_refresh">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                        </div>
                        <div class="form-check mt-2">
                            <input class="form-check-input" type="checkbox" value="" id="omics_cb_onlymapped_norm" checked>
                            <label class="form-check-label" for="omics_cb_onlymapped_norm" style="font-size: 11pt;">
                                Normalize only values mapped to the network.
                            </label>
                        </div>
                        <div class="form-check mb-4">
                            <input class="form-check-input" type="checkbox" value="" id="omics_cb_mapped_only" checked>
                            <label class="form-check-label" for="omics_cb_mapped_only" style="font-size: 11pt;">
                                Show only values mapped to the network.
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
            <div class="card" style="padding: 1rem;">
                <div class="d-flex gap-3 mb-2 justify-content-center">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="" id="omics_cb_downstream" checked>
                        <label class="form-check-label" for="omics_cb_downstream">
                            Downstream
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="" id="omics_cb_upstream" disabled>
                        <label class="form-check-label" for="omics_cb_upstream" disabled>
                            Upstream
                        </label>
                    </div>
                </div>
                <div style="text-align: center;">
                    <button type="button" id="omics_btn_analyze" style="width: 100%;" class="air_btn btn btn-block air_disabledbutton">Run Analysis</button>
                </div>
            </div>
        </div>
        <button class="btn air_collapsible mt-2 collapsed air_disabledbutton" id="omics_collapse_4_btn" type="button" data-bs-toggle="collapse" data-bs-target="#omics_collapse_4" aria-expanded="false" aria-controls="omics_collapse_4">
            4. Ask Questions about the Analysis
        </button>
        <div class="collapse" id="omics_collapse_4">
            <div class="card" style="padding: 1rem; display: flex; flex-direction: column; height: calc(100vh - 40px);">            
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div class="d-flex align-items-center gap-2">
                        <h6 class="mb-0">Analysis &amp; Chat</h6>
                    </div>

                    <div class="d-flex gap-2">
                        <button type="button" id="omics_btn_download_pdf" class="btn btn-sm btn-outline-secondary" title="Download chat as PDF">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                    </div>
                </div>
                <div id="omics_analysis_content" style="width: 100%; flex: 1; overflow-x: auto; overflow-y: hidden; font-size: 12px; border: none; padding: 0;">

                </div>
                <form id="omics_queryform" class="d-flex mt-2 mb-2">
                    <textarea placeholder="Ask a question about the data analysis." id="omics_query_input" class="form-control me-2 auto-expand-input" style="flex: 1; resize: none;" aria-label="Text input with segmented dropdown button" rows="1"></textarea>
                    <button type="button" type="submit" id="omics_btn_query" class="air_btn btn">Submit</button>
                </form>
                <span style="text-align: center;margin-bottom: 4pt;">or</span>
                <div class="d-flex justify-content-center mb-2">
                    <button type="button" id="omics_btn_function_selector" class="btn btn-outline-secondary btn-sm">
                        <i class="fas fa-list"></i> Select Function
                    </button>
                </div>
            </div>
        </div>
        `
    ).appendTo(air_omics.container);

    initOmicsOverlayPanel();

    // Setup auto-expanding input
    setupAutoExpandingInput("#omics_query_input");
    
    // Handle Enter key in the query input (submit on Enter, allow Shift+Enter for new line)
    $("#omics_query_input").on('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent form submission
            // Check if already processing a response
            if (window.isProcessingResponse) {
                showWaitAlert("omics");
                return;
            }
            $("#omics_btn_query").trigger('click'); // Trigger the click event on the submit button
        }
    });

    // Initialize chat when the collapse is shown
    $('#omics_collapse_4').on('shown.bs.collapse', function () {
        // Ensure chat container is initialized when the section becomes visible
        if (typeof initializeChatContainer === 'function') {
            initializeChatContainer('omics');
        }
    });

    // Initialize tooltips for plain text content
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });

    // Initialize the data tree
    initializeDataTree();

    air_data.minerva_events.addListener("onBioEntityClick", omicsOnBioEntityClick);

    $("#omics_cb_onlymapped_norm").on('change', highlightOmicsColumn);
    $("#omics_select_column").on('change', highlightOmicsColumn);
    $("#omics_cb_mapped_only").on('change', function() {
        if (air_omics.loaded_data) {
            const processedData = processDataForTable(air_omics.loaded_data, true, $(this).prop('checked'));
            createOmicsDataTable(processedData);
        }
    });
    $("#omics_select_column_refresh").on('click', highlightOmicsColumn);

    // Add file input change handler for p-value detection
    $("#omics_file").on('change', async function(e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        try {
            // Check first file to detect p-values
            const file = files[0];
            let content = '';
            
            // Handle zip files
            if (file.name.toLowerCase().endsWith('.zip') || file.type === 'application/zip') {
                try {
                    const zip = new air_data.JSZip();
                    const zipContents = await zip.loadAsync(file);
                    
                    // Find first valid data file in zip
                    for (const [filename, zipEntry] of Object.entries(zipContents.files)) {
                        if (!zipEntry.dir && isValidDataFile(filename)) {
                            content = await zipEntry.async("text");
                            break;
                        }
                    }
                } catch (zipErr) {
                    console.error("Error reading zip file for p-value detection:", zipErr);
                    return;
                }
            } else {
                // Handle regular files
                content = await file.text();
            }
            
            if (!content) return;
            
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
                
                // Check if file is a zip file
                if (file.name.toLowerCase().endsWith('.zip') || file.type === 'application/zip') {
                    console.log(`Processing zip file: ${file.name}`);
                    
                    try {
                        // Extract zip file contents
                        const zip = new air_data.JSZip();
                        const zipContents = await zip.loadAsync(file);
                        
                        // Process each file in the zip
                        for (const [filename, zipEntry] of Object.entries(zipContents.files)) {
                            if (!zipEntry.dir && isValidDataFile(filename)) {
                                console.log(`Extracting and processing: ${filename}`);
                                
                                // Get file content as blob
                                const fileBlob = await zipEntry.async("blob");
                                const extractedFile = new File([fileBlob], filename, { 
                                    type: getFileType(filename),
                                    lastModified: zipEntry.date ? zipEntry.date.getTime() : Date.now()
                                });
                                
                                // Process the extracted file
                                const formData = new FormData();
                                formData.append('file', extractedFile);
                                formData.append('has_pvalues', $("#omics_cb_pvalues").prop('checked'));
                                formData.append('session', air_data.session_token);
                                formData.append('name', filename);
                                
                                const response = await getDataFromServer(
                                    "sylobio/process_omics", 
                                    formData, 
                                    "POST",
                                    "json",
                                );

                                if(response[0].hasOwnProperty('error')) {
                                    console.error(`Could not process file from zip: ${filename}. ${response[0].error}`);
                                    continue;
                                }
                                
                                for(var dataset of response) {
                                    // Add data to the tree
                                    addDataToTree('user', dataset);
                                }
                            }
                        }
                        } catch (zipErr) {
                            console.error(`Error processing zip file ${file.name}:`, zipErr);
                            alert(`Failed to process zip file ${file.name}: ${zipErr.message}`);
                            continue;
                        }
                } else {
                    // Process regular file
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('has_pvalues', $("#omics_cb_pvalues").prop('checked'));
                    formData.append('session', air_data.session_token);
                    formData.append('name', file.name);
                    
                    const response = await getDataFromServer(
                        "sylobio/process_omics", 
                        formData, 
                        "POST",
                        "json",
                    );

                    if(response[0].hasOwnProperty('error')) {
                        alert("Could not process file: " + file.name + ". " + response[0].error);
                        continue;
                    }
                    
                    for(var dataset of response) {
                        // Add data to the tree
                        addDataToTree('user', dataset);
                    }
                }
            }

            $("#omics_collapse_2_btn").removeClass("air_disabledbutton");
            $("#omics_collapse_3_btn").removeClass("air_disabledbutton");
         
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

    // Handle example data click
    $("#omics_example_data").on('click', async function(e) {
        e.preventDefault();
        try {
            var btn_text = await disablebutton("omics_example_data");
            
            // Fetch example data from GitHub
            const response = await fetch(air_data.example_data_omics.url);
            if (!response.ok) {
                throw new Error('Failed to fetch example data');
            }
            
            const text = await response.text();
            const blob = new Blob([text], { type: 'text/plain' });
            const file = new File([blob], air_data.example_data_omics.name, { type: 'text/plain' });
            
            // Create a FormData object and append the file
            const formData = new FormData();
            formData.append('file', file);
            formData.append('has_pvalues', true);
            formData.append('session', air_data.session_token);
            formData.append('name', file.name);
            
            const processResponse = await getDataFromServer(
                "sylobio/process_omics", 
                formData, 
                "POST",
                "json",
            );

            if(processResponse[0].hasOwnProperty('error')) {
                alert("Could not process example data: " + processResponse[0].error);
                return;
            }

            for(var dataset of processResponse) {
                // Add data to the tree
                addDataToTree('user', dataset);
            }

            $("#omics_collapse_2_btn").removeClass("air_disabledbutton");
            $("#omics_collapse_3_btn").removeClass("air_disabledbutton");

            // Enable and show next section
            bootstrap.Collapse.getOrCreateInstance(document.querySelector('#omics_collapse_1')).hide();
            bootstrap.Collapse.getOrCreateInstance(document.querySelector('#omics_collapse_2')).show();
            bootstrap.Collapse.getOrCreateInstance(document.querySelector('#omics_collapse_3')).show();

            steps = [                
                {
                    scope: 'iframe',
                    props: [{ prop: 'id', value: 'omics_data_treeview' }],
                    text: 'Files uploaded by the user are displayed in the "User Uploads" section.',
                    actions: [
                        { scope: 'iframe', props: [{ prop: 'id', value: "airomics_tab" }], action: 'click', when: "post" }
                    ],
                    timeout: 500,
                },
                {
                    scope: 'iframe',
                    props: [{ prop: 'id', value: 'omics_file_btn_container' }],
                    text: 'These buttons allow you to interact with the currently selected data files.',
                    actions: [
                        { scope: 'iframe', props: [{ prop: 'data_id', value: "data-" + processResponse[0].data_id }], action: 'click' }
                    ]
                },
                {
                    scope: 'iframe',
                    props: [{ prop: 'id', value: 'omics_btn_viewdata' }],
                    text: 'Inspect the uploaded data in an interactive table.'
                },
                {
                    scope: 'iframe',
                    props: [{ prop: 'id', value: 'omics_btn_editdata' }],
                    text: 'Edit data details such as name, description, and metadata, or adjust data structure.'
                },
                {
                    scope: 'iframe',
                    props: [{ prop: 'id', value: 'omics_btn_analyze' }],
                    text: 'After selection one or multiple datasets, run the analysis with a single click.'
                },
                {
                    scope: 'iframe',
                    props: [{ prop: 'id', value: 'omics_collapse_4_btn' }],
                    text: 'After the analysis is complete, a summary of the results are shown here. You can then ask questions using the chat interface, similar to the explore tab, but with insights on the data and analysis results.'
                },
            ]
            
            startIntroTour(steps);
            
        } catch (err) {
            console.error("Error processing example data:", err);
            alert(`Failed to process example data: ${err.message}`);
        } finally {
            enablebutton("omics_example_data", btn_text);
        }
    });

 
    async function updateDataActionButtons() {

        let data_has_errors = false;

        for (const data_id of air_omics.selected_data_ids) {
            const data = await getDataFromLocalTree(data_id);

            const data_safe = data || {};

            const warnings = data_safe.warnings || [];
            data_has_errors = data_has_errors || (warnings.some(w => w.type === 'error' || w.type === 'critical'));
        }

                
        // Enable/disable the load button based on whether any data_id is selected
        if (air_omics.selected_data_ids.length > 1) {
            $("#omics_btn_deletedata").removeClass("air_disabledbutton");
            $("#omics_btn_downloaddata").removeClass("air_disabledbutton");
            $("#omics_btn_mergedata").removeClass("air_disabledbutton");
            $("#omics_btn_viewdata").addClass("air_disabledbutton");
            $("#omics_btn_editdata").addClass("air_disabledbutton");
            if (data_has_errors) {
                $("#omics_btn_analyze").addClass("air_disabledbutton");
            }
            else {
                $("#omics_btn_analyze").removeClass("air_disabledbutton");
            }
        }
        else if (air_omics.selected_data_ids.length == 1) {
            $("#omics_btn_viewdata").removeClass("air_disabledbutton");
            $("#omics_btn_editdata").removeClass("air_disabledbutton");
            $("#omics_btn_deletedata").removeClass("air_disabledbutton");
            $("#omics_btn_downloaddata").removeClass("air_disabledbutton");
            $("#omics_btn_mergedata").addClass("air_disabledbutton");
            if (data_has_errors) {
                $("#omics_btn_analyze").addClass("air_disabledbutton");
            }
            else {
                $("#omics_btn_analyze").removeClass("air_disabledbutton");
            }
        }
        else {
            $("#omics_btn_viewdata").addClass("air_disabledbutton");
            $("#omics_btn_editdata").addClass("air_disabledbutton");
            $("#omics_btn_deletedata").addClass("air_disabledbutton");
            $("#omics_btn_downloaddata").addClass("air_disabledbutton");
            $("#omics_btn_mergedata").addClass("air_disabledbutton");
        }

    }

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
        updateDataActionButtons();

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
            const processedData = processDataForTable(data, true, $("#omics_cb_mapped_only").prop('checked'));
            createOmicsDataTable(processedData);

            // Setup column selector
            setupColumnSelector('#omics_select_column', data.columns, [data.columns[0]].concat(data.pvalue_columns));
            
            // Enable and show visualization section
            bootstrap.Collapse.getOrCreateInstance(document.querySelector('#omics_collapse_viewdata')).show();
            $("#omics_collapse_3_btn").removeClass("air_disabledbutton");
            $("#omics_collapse_viewdata_btn").removeClass("air_disabledbutton");

            $("#omics_select_column_filter").prop('disabled', !data.has_pvalues);

            await showOmicsDatasetOverlay(air_omics.selected_data_ids[0], data);

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
                { data_ids: air_omics.selected_data_ids},
                "POST",
                "json"
            );

            // Remove the data from the tree
            removeDataFromTree(air_omics.selected_data_ids);

            air_omics.selected_data_ids = [];

            $('#omics_data_treeview').jstree('deselect_all');            

            updateDataActionButtons();

            enablebutton("omics_btn_deletedata", btn_text);
        } catch (err) {
            console.error("Error deleting data:", err);
            alert(`Failed to delete data: ${err.message}`);
        } finally {
            enablebutton("omics_btn_deletedata", btn_text);
        }

    });

    // Handle download data button click
    $('#omics_btn_downloaddata').on('click', async function() {
        if (air_omics.selected_data_ids.length == 0) return;

        try {
            var btn_text = await disablebutton("omics_btn_downloaddata");

            const zip = new air_data.JSZip();
            
            // Get data for each selected dataset
            for (let i = 0; i < air_omics.selected_data_ids.length; i++) {
                const dataId = air_omics.selected_data_ids[i];
                
                // Find dataset info in tree
                let datasetName = `dataset_${dataId}`;
                for (const [source, sourceData] of Object.entries(air_omics.data_tree)) {
                    if (sourceData.data[dataId]) {
                        datasetName = sourceData.data[dataId].name || `dataset_${dataId}`;
                        break;
                    }
                }

                try {
                    // Get data from server
                    const data = await getDataFromServer(
                        "sylobio/get_omics_data",
                        { data_id: dataId },
                        "POST",
                        "json"
                    );

                    // Get dataset description
                    let datasetDescription = '';
                    for (const [source, sourceData] of Object.entries(air_omics.data_tree)) {
                        if (sourceData.data[dataId]) {
                            datasetDescription = sourceData.data[dataId].description || '';
                            break;
                        }
                    }

                    // Convert to TSV format with description
                    const tsvContent = convertDataToTSV(data, datasetName, datasetDescription);
                    
                    // Add to zip with clean filename
                    const cleanName = datasetName.replace(/[^a-zA-Z0-9_-]/g, '_');
                    zip.file(`${cleanName}.tsv`, tsvContent);
                    
                } catch (err) {
                    console.error(`Error getting data for dataset ${dataId}:`, err);
                    // Add error file to zip
                    zip.file(`${datasetName}_ERROR.txt`, `Failed to export dataset: ${err.message}`);
                }
            }

            // Generate and download zip
            const zipBlob = await zip.generateAsync({type: "blob"});
            const zipUrl = URL.createObjectURL(zipBlob);
            
            // Create download link
            const downloadLink = document.createElement('a');
            downloadLink.href = zipUrl;
            downloadLink.download = `omics_datasets_${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Clean up URL
            URL.revokeObjectURL(zipUrl);

            enablebutton("omics_btn_downloaddata", btn_text);
        } catch (err) {
            console.error("Error downloading data:", err);
            alert(`Failed to download data: ${err.message}`);
        } finally {
            enablebutton("omics_btn_downloaddata", btn_text);
        }
    });

    // Handle merge data button click
    $('#omics_btn_mergedata').on('click', async function() {
        if (air_omics.selected_data_ids.length < 2) {
            alert('Please select at least 2 datasets to merge.');
            return;
        }

        try {
            var btn_text = await disablebutton("omics_btn_mergedata");

            // Send merge request to server
            const response = await getDataFromServer(
                "sylobio/merge_omics_datasets",
                { data_ids: air_omics.selected_data_ids },
                "POST",
                "json"
            );

            // Remove the original datasets from the tree
            removeDataFromTree(air_omics.selected_data_ids);

                
            // Add the merged dataset to the tree
            if (response.merged_dataset) {
                addDataToTree('user', response.merged_dataset);
            }
            
            // Store the number of datasets that were merged
            const numDatasets = air_omics.selected_data_ids.length;
            
            // Clear selection
            
            air_omics.selected_data_ids = [];

            $('#omics_data_treeview').jstree('deselect_all');
            
            updateDataActionButtons();
            
            alert(`Successfully merged ${numDatasets} datasets into a new dataset.`);

            enablebutton("omics_btn_mergedata", btn_text);
        } catch (err) {
            console.error("Error merging data:", err);
            alert(`Failed to merge datasets: ${err.message}`);
        } finally {
            enablebutton("omics_btn_mergedata", btn_text);
        }
    });

    // Handle edit data button click
    $('#omics_btn_editdata').on('click', async function() {
        if (air_omics.selected_data_ids.length != 1) return;

        try {
            const dataId = air_omics.selected_data_ids[0];
            
            // Find the dataset in the tree
            let datasetInfo = null;
            let datasetSource = null;
            let columns = [];
            let has_pvalues = false;
            for (const [source, sourceData] of Object.entries(air_omics.data_tree)) {
                if (sourceData.data[dataId]) {
                    datasetInfo = sourceData.data[dataId];
                    datasetSource = source;
                    columns = sourceData.data[dataId].original_data_columns;
                    has_pvalues = sourceData.data[dataId].has_pvalues;
                    break;
                }
            }

            if (!datasetInfo) {
                alert("Dataset not found");
                return;
            }

            // Remove any existing modals
            $("#omics_edit_modal", window.parent.document).remove();
            
            // Remove any existing event handlers to prevent memory leaks
            $(window.parent.document).off('click', '#omics_edit_close');
            $(window.parent.document).off('click', '#omics_btn_save_edit');

            const allColumns = datasetInfo.original_data_columns || [];
            const selectedSet = new Set((datasetInfo.selected_columns || []).map(i => parseInt(i)));
            const selectedOrdered = (datasetInfo.selected_columns || [])
                .map(i => parseInt(i))
                .filter(i => Number.isInteger(i) && i >= 0 && i < allColumns.length);
            const remainingColumns = allColumns
                .map((_, index) => index)
                .filter(index => !selectedSet.has(index));
            const orderedColumnIndices = [...selectedOrdered, ...remainingColumns];

            // Create column checkboxes HTML
            let columnsHtml = `
                <div style="margin-bottom: 15px;">
                    <label style="font-weight: bold; margin-bottom: 5px; display: block;">Available Columns</label>
                    <div style="font-size: 0.9em; color: #666; margin-bottom: 10px;">Select which columns to include in analysis and drag to reorder</div>
                    <div id="omics_edit_columns_container" style="border: 1px solid #ddd; border-radius: 4px; padding: 10px; max-height: 200px; overflow-y: auto;">
                        ${orderedColumnIndices.map((index) => `
                            <div class="omics-edit-column-item" draggable="true" data-column-index="${index}" style="margin-bottom: 5px; display: flex; align-items: center; gap: 8px; padding: 2px 4px; border-radius: 4px; cursor: move;">
                                <span title="Drag to reorder" style="color: #6c757d; font-size: 13px; user-select: none;">☰</span>
                                <input type="checkbox" id="column_${index}" value="${index}" ${selectedSet.has(index) ? 'checked' : ''} style="margin-right: 2px;">
                                <label for="column_${index}" style="cursor: pointer; margin-bottom: 0;">${allColumns[index]}</label>
                            </div>
                        `).join('')}
                    </div>
                    <div id="omics_edit_column_assignment" style="font-size: 0.9em; color: #495057; margin-top: 10px; padding: 10px; border: 1px solid #dee2e6; border-radius: 4px; background: #f8f9fa;"></div>
                </div>
            `;
            

            const modalHTML = `
                <div id="omics_edit_modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                     background: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center; z-index: 99999;">
                    <div style="position: relative; background: #fff; padding: 20px; border-radius: 8px;
                         max-width: 600px; width: 90%; max-height: 90%; overflow: auto;">
                        <button id="omics_edit_close" style="position: absolute; top: 10px; right: 10px;
                             background: transparent; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                        
                        <h5 style="margin-bottom: 20px; margin-top: 0;">Edit Dataset</h5>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="font-weight: bold; margin-bottom: 5px; display: block;">Dataset Name</label>
                            <input type="text" id="omics_edit_name" value="${datasetInfo.name || ''}" 
                                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" required>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="font-weight: bold; margin-bottom: 5px; display: block;">Description</label>
                            <textarea id="omics_edit_description" rows="3" 
                                      style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" 
                                      placeholder="Optional description of the dataset. A detailed description of samples helps the LLM in selecting the most suitable analyses.">${datasetInfo.description || ''}</textarea>
                        </div>` +
                        
                        // <div style="margin-bottom: 15px;">
                        //     <label style="font-weight: bold; margin-bottom: 5px; display: block;">Data Type</label>
                        //     <select id="omics_edit_data_type" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        //         ${Object.entries(air_omics.data_types).map(([value, label]) => 
                        //             `<option value="${value}" ${value === (datasetInfo.data_type || 'transcriptomics') ? 'selected' : ''}>${label}</option>`
                        //         ).join('')}
                        //     </select>
                        // </div>
                        
                        `<div style="margin-bottom: 15px;">
                            <label style="font-weight: bold; margin-bottom: 5px; display: block;">Index Column</label>
                            <select id="omics_edit_index_column" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <option value="" disabled>Select index column</option>
                                ${(datasetInfo.original_data_columns || []).map((column, index) => 
                                    `<option value="${index}" ${index === datasetInfo.index_column ? 'selected' : ''}>${column}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="omics_edit_has_pvalues" ${datasetInfo.has_pvalues ? 'checked' : ''} style="margin-right: 8px;">
                                <span style="font-weight: bold;">Data includes p-values</span>
                            </label>
                            <div style="font-size: 0.9em; color: #666; margin-top: 5px;">P-values should be in every second column (ignoring index column)</div>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="font-weight: bold; margin-bottom: 5px; display: block;">Normalization</label>
                            <select id="omics_edit_normalization" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <option value="none" ${(datasetInfo.normalization || 'none') === 'none' ? 'selected' : ''}>No normalization</option>
                                <option value="all" ${(datasetInfo.normalization || 'none') === 'all' ? 'selected' : ''}>Normalize by all</option>
                                <option value="sample" ${(datasetInfo.normalization || 'none') === 'sample' ? 'selected' : ''}>Normalize by sample</option>
                                <option value="probe" ${(datasetInfo.normalization || 'none') === 'probe' ? 'selected' : ''}>Normalize by probe</option>
                            </select>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="font-weight: bold; margin-bottom: 5px; display: block;">Pivot Column</label>
                            <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">Select column to split data on (for handling duplicates)</div>
                            <select id="omics_edit_pivot_column" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <option value="-1" selected>No pivot (default)</option>
                                ${(datasetInfo.original_data_columns || []).map((column, index) => 
                                    `<option value="${index}" ${index === (datasetInfo.pivot_column || '') ? 'selected' : ''}>${column}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="font-weight: bold; margin-bottom: 5px; display: block;">Aggregate Function</label>
                            <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">Function to use when combining duplicate values</div>
                            <select id="omics_edit_aggregate_function" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <option value="mean" ${(datasetInfo.aggregate_function || 'mean') === 'mean' ? 'selected' : ''}>Mean (average)</option>
                                <option value="median" ${(datasetInfo.aggregate_function || 'mean') === 'median' ? 'selected' : ''}>Median</option>
                                <option value="sum" ${(datasetInfo.aggregate_function || 'mean') === 'sum' ? 'selected' : ''}>Sum</option>
                                <option value="max" ${(datasetInfo.aggregate_function || 'mean') === 'max' ? 'selected' : ''}>Maximum</option>
                                <option value="min" ${(datasetInfo.aggregate_function || 'mean') === 'min' ? 'selected' : ''}>Minimum</option>
                                <option value="first" ${(datasetInfo.aggregate_function || 'mean') === 'first' ? 'selected' : ''}>First value</option>
                                <option value="last" ${(datasetInfo.aggregate_function || 'mean') === 'last' ? 'selected' : ''}>Last value</option>
                                <option value="count" ${(datasetInfo.aggregate_function || 'mean') === 'count' ? 'selected' : ''}>Count</option>
                                <option value="std" ${(datasetInfo.aggregate_function || 'mean') === 'std' ? 'selected' : ''}>Standard deviation</option>
                            </select>
                        </div>
                        
                        ${columnsHtml}
                        
                        <!-- Warning Container -->
                        <div id="omics_edit_warning" style="display: none; margin: 15px 0; padding: 12px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;">
                            <i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>
                            <span id="omics_edit_warning_text"></span>
                        </div>
                        
                        <div style="text-align: right; margin-top: 20px;">
                            <button id="omics_edit_cancel" style="background: #6c757d; color: white; border: none; padding: 8px 16px; margin-right: 10px; border-radius: 4px; cursor: pointer;">Cancel</button>
                            <button id="omics_btn_save_edit" data-data-id="${dataId}" data-source="${datasetSource}" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Save Changes</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Append to window.parent.document.body instead of document.body
            $(window.parent.document.body).append(modalHTML);
            console.log('Modal created and appended to DOM'); // Debug log

            // Define warning helper functions
            window.showOmicsWarning = function(message) {
                const warningDiv = $("#omics_edit_warning", window.parent.document);
                const warningText = $("#omics_edit_warning_text", window.parent.document);
                const saveBtn = $("#omics_btn_save_edit", window.parent.document);
                
                warningText.text(message);
                warningDiv.show();
                saveBtn.prop('disabled', true).css({
                    'background': '#6c757d',
                    'cursor': 'not-allowed',
                    'opacity': '0.6'
                });
            };

            window.hideOmicsWarning = function() {
                const warningDiv = $("#omics_edit_warning", window.parent.document);
                const saveBtn = $("#omics_btn_save_edit", window.parent.document);
                
                warningDiv.hide();
                saveBtn.prop('disabled', false).css({
                    'background': '#007bff',
                    'cursor': 'pointer',
                    'opacity': '1'
                });
            };

            // Define validation function
            window.validateOmicsModalForm = function() {
                const indexColumn = $("#omics_edit_index_column", window.parent.document).val();
                const hasPvalues = $("#omics_edit_has_pvalues", window.parent.document).prop('checked');
                const pivotColumn = $("#omics_edit_pivot_column", window.parent.document).val();
                
                let selectedColumns = [];
                $("#omics_edit_columns_container .omics-edit-column-item", window.parent.document).each(function() {
                    const checkbox = $(this).find("input[type='checkbox']");
                    if (checkbox.prop('checked')) {
                        selectedColumns.push(parseInt($(this).attr('data-column-index')));
                    }
                });

                const indexColumnInt = indexColumn !== null && indexColumn !== '' ? parseInt(indexColumn) : null;
                const pivotColumnInt = pivotColumn !== null && pivotColumn !== '' && pivotColumn !== '-1' ? parseInt(pivotColumn) : null;

                // Check if index column is selected
                if (selectedColumns.length > 0 && indexColumnInt !== null && !selectedColumns.includes(indexColumnInt)) {
                    window.showOmicsWarning("Index column must be selected in the column list");
                    return false;
                }

                // Check if pivot column is selected in the column list (if specified)
                if (selectedColumns.length > 0 && pivotColumnInt !== null && !selectedColumns.includes(pivotColumnInt)) {
                    window.showOmicsWarning("Pivot column must be selected in the column list");
                    return false;
                }

                if (pivotColumnInt !== null && indexColumnInt !== null && pivotColumnInt === indexColumnInt) {
                    window.showOmicsWarning("Pivot column cannot be the same as the index column");
                    return false;
                }

                // Check p-values validation
                if (hasPvalues && selectedColumns.length > 0 && indexColumnInt !== null) {
                    let dataColumnsCount = selectedColumns.filter(col => col !== indexColumnInt).length;
                    if (pivotColumnInt !== null) {
                        dataColumnsCount = selectedColumns.filter(col => col !== indexColumnInt && col !== pivotColumnInt).length;
                    }
                    if (dataColumnsCount % 2 !== 0) {
                        window.showOmicsWarning("When p-values are included, the number of data columns (excluding index and pivot column) must be even");
                        return false;
                    }
                }
                
                // If we get here, validation passed
                window.hideOmicsWarning();
                return true;
            };

            window.renderOmicsColumnAssignment = function() {
                const summaryContainer = $("#omics_edit_column_assignment", window.parent.document);
                if (!summaryContainer.length) return;

                const indexColumnRaw = $("#omics_edit_index_column", window.parent.document).val();
                const pivotColumnRaw = $("#omics_edit_pivot_column", window.parent.document).val();
                const hasPvalues = $("#omics_edit_has_pvalues", window.parent.document).prop('checked');

                const indexColumn = indexColumnRaw !== null && indexColumnRaw !== '' ? parseInt(indexColumnRaw) : null;
                const pivotColumn = pivotColumnRaw !== null && pivotColumnRaw !== '' && pivotColumnRaw !== '-1' ? parseInt(pivotColumnRaw) : null;

                const selectedOrderedColumns = [];
                $("#omics_edit_columns_container .omics-edit-column-item", window.parent.document).each(function() {
                    const checkbox = $(this).find("input[type='checkbox']");
                    if (checkbox.prop('checked')) {
                        selectedOrderedColumns.push(parseInt($(this).attr('data-column-index')));
                    }
                });

                const analysisColumns = selectedOrderedColumns.filter(col => col !== indexColumn && col !== pivotColumn);
                const dataColumns = [];
                const pvalueColumns = [];

                if (hasPvalues) {
                    for (let i = 0; i < analysisColumns.length; i += 2) {
                        const dataCol = analysisColumns[i];
                        const pvalCol = analysisColumns[i + 1];
                        if (dataCol !== undefined) dataColumns.push(allColumns[dataCol]);
                        if (pvalCol !== undefined) pvalueColumns.push(allColumns[pvalCol]);
                    }
                } else {
                    for (const columnIndex of analysisColumns) {
                        dataColumns.push(allColumns[columnIndex]);
                    }
                }

                const indexLabel = indexColumn !== null && allColumns[indexColumn] !== undefined ? allColumns[indexColumn] : "Not selected";
                const dataLabel = dataColumns.length ? dataColumns.join(', ') : "None";
                const pvalueLabel = hasPvalues
                    ? (pvalueColumns.length ? pvalueColumns.join(', ') : "None")
                    : "Disabled";

                summaryContainer.html(`
                    <div><strong>Index column:</strong> ${indexLabel}</div>
                    <div><strong>Data columns:</strong> ${dataLabel}</div>
                    <div><strong>P-value columns:</strong> ${pvalueLabel}</div>
                `);
            };

            // Index column change handler
            $(window.parent.document).on('change.omicsModalValidation', '#omics_edit_index_column', function() {
                window.validateOmicsModalForm();
                window.renderOmicsColumnAssignment();
            });

            // Column checkbox change handler
            $(window.parent.document).on('change.omicsModalValidation', '#omics_edit_columns_container input[type="checkbox"]', function() {
                window.validateOmicsModalForm();
                window.renderOmicsColumnAssignment();
            });

            // P-value checkbox change handler
            $(window.parent.document).on('change.omicsModalValidation', '#omics_edit_has_pvalues', function() {
                window.validateOmicsModalForm();
                window.renderOmicsColumnAssignment();
            });

            // Pivot column change handler
            $(window.parent.document).on('change.omicsModalValidation', '#omics_edit_pivot_column', function() {
                window.validateOmicsModalForm();
                window.renderOmicsColumnAssignment();
            });

            // Aggregate function change handler (no validation needed but keeping consistency)
            $(window.parent.document).on('change.omicsModalValidation', '#omics_edit_aggregate_function', function() {
                window.validateOmicsModalForm();
            });

            // Drag-and-drop reordering for columns
            const columnsContainer = $("#omics_edit_columns_container", window.parent.document);
            let draggedColumnItem = null;

            columnsContainer.on('dragstart', '.omics-edit-column-item', function(e) {
                draggedColumnItem = this;
                $(this).css('opacity', '0.5');
                if (e.originalEvent && e.originalEvent.dataTransfer) {
                    e.originalEvent.dataTransfer.effectAllowed = 'move';
                    e.originalEvent.dataTransfer.setData('text/plain', $(this).attr('data-column-index'));
                }
            });

            columnsContainer.on('dragend', '.omics-edit-column-item', function() {
                $(this).css('opacity', '1');
                window.validateOmicsModalForm();
                window.renderOmicsColumnAssignment();
                draggedColumnItem = null;
            });

            columnsContainer.on('dragover', '.omics-edit-column-item', function(e) {
                e.preventDefault();
                if (!draggedColumnItem || draggedColumnItem === this) return;

                const targetRect = this.getBoundingClientRect();
                const insertAfter = (e.originalEvent.clientY - targetRect.top) > targetRect.height / 2;

                if (insertAfter) {
                    $(this).after(draggedColumnItem);
                } else {
                    $(this).before(draggedColumnItem);
                }
            });

            columnsContainer.on('drop', '.omics-edit-column-item', function(e) {
                e.preventDefault();
                window.validateOmicsModalForm();
                window.renderOmicsColumnAssignment();
            });

            // Run initial validation
            window.validateOmicsModalForm();
            window.renderOmicsColumnAssignment();

            // Add save button event handler
            $(window.parent.document).on('click.omicsModalSave', '#omics_btn_save_edit', async function() {
                console.log('Save button clicked!'); // Debug log
                try {
                    const saveBtn = $(this);
                    
                    // Check if button is disabled due to validation errors
                    if (saveBtn.prop('disabled')) {
                        console.log('Save button is disabled, skipping'); // Debug log
                        return;
                    }
                    
                    const originalText = saveBtn.text();
                    saveBtn.text('Saving...').prop('disabled', true);

                    const dataId = saveBtn.data('data-id');
                    const source = saveBtn.data('source');

                    if (!dataId) {
                        window.showOmicsWarning("No dataset selected");
                        saveBtn.text(originalText).prop('disabled', false);
                        return;
                    }

                    // Get form data from parent document
                    const newName = $("#omics_edit_name", window.parent.document).val().trim();
                    const newDescription = $("#omics_edit_description", window.parent.document).val().trim();
                    // const newDataType = $("#omics_edit_data_type", window.parent.document).val();
                    const indexColumn = parseInt($("#omics_edit_index_column", window.parent.document).val());
                    const hasPvalues = $("#omics_edit_has_pvalues", window.parent.document).prop('checked');
                    const normalization = $("#omics_edit_normalization", window.parent.document).val();
                    const pivotColumn = $("#omics_edit_pivot_column", window.parent.document).val();
                    const aggregateFunction = $("#omics_edit_aggregate_function", window.parent.document).val();

                    if (!newName) {
                        window.showOmicsWarning("Dataset name is required");
                        saveBtn.text(originalText).prop('disabled', false);
                        return;
                    }

                    // Get selected columns if visible
                    let selectedColumns = [];
                    $("#omics_edit_columns_container .omics-edit-column-item", window.parent.document).each(function() {
                        const checkbox = $(this).find("input[type='checkbox']");
                        if (checkbox.prop('checked')) {
                            selectedColumns.push(parseInt($(this).attr('data-column-index')));
                        }
                    });

                    // Final validation before save
                    if (selectedColumns.length > 0) {                        
                        // Use the same validation function as real-time validation
                        if (!window.validateOmicsModalForm()) {
                            saveBtn.text(originalText).prop('disabled', false);
                            return;
                        }
                    }

                    // Update the dataset on server
                    const updateData = {
                        data_id: dataId,
                        name: newName,
                        description: newDescription,
                        // data_type: newDataType,
                        index_column: indexColumn,
                        has_pvalues: hasPvalues,
                        normalization: normalization,
                        pivot_column: pivotColumn !== "-1" ? parseInt(pivotColumn) : null,
                        pivot_aggfunc: aggregateFunction,
                        selected_columns: selectedColumns
                    };

                    const response = await getDataFromServer(
                        "sylobio/update_omics_dataset",
                        updateData,
                        "POST",
                        "json"
                    );

                    // Update local data tree
                    air_omics.data_tree[source].data[dataId].name = newName;
                    air_omics.data_tree[source].data[dataId].description = newDescription;
                    // air_omics.data_tree[source].data[dataId].data_type = newDataType;
                    air_omics.data_tree[source].data[dataId].index_column = indexColumn;
                    air_omics.data_tree[source].data[dataId].has_pvalues = hasPvalues;
                    air_omics.data_tree[source].data[dataId].normalization = normalization;
                    air_omics.data_tree[source].data[dataId].pivot_column = pivotColumn !== "-1" ? parseInt(pivotColumn) : null;
                    air_omics.data_tree[source].data[dataId].pivot_aggfunc = aggregateFunction;
                    air_omics.data_tree[source].data[dataId].selected_columns = selectedColumns;
                    air_omics.data_tree[source].data[dataId].warnings = response.warnings;

                    invalidateOmicsOverlayDataset(dataId);


                    // Close the modal
                    $('#omics_edit_modal', window.parent.document).remove();
                    $(window.parent.document).off('click.omicsModalClose');
                    $(window.parent.document).off('click.omicsModalSave');
                    $(window.parent.document).off('change.omicsModalValidation');
                    // Clean up global functions
                    delete window.validateOmicsModalForm;
                    delete window.showOmicsWarning;
                    delete window.hideOmicsWarning;
                    delete window.renderOmicsColumnAssignment;

                    // Refresh the tree view
                    if ($('#omics_data_treeview').jstree(true)) {
                        $('#omics_data_treeview').jstree(true).settings.core.data = buildTreeData();
                        $('#omics_data_treeview').jstree(true).refresh();
                    }

                } catch (err) {
                    console.error("Error saving changes:", err);
                    alert(`Failed to save changes: ${err.message}`);
                } finally {
                    // Reset button state
                    const saveBtn = $("#omics_btn_save_edit", window.parent.document);
                    if (saveBtn.length) {
                        saveBtn.text('Save Changes').prop('disabled', false);
                    }
                }
            });
            
            // Use window.parent.document for event binding with namespaced event to avoid duplicates
            $(window.parent.document).on('click.omicsModalClose', '#omics_edit_close, #omics_edit_cancel', function() {
                $('#omics_edit_modal', window.parent.document).remove();
                // Clean up event handlers
                $(window.parent.document).off('click.omicsModalClose');
                $(window.parent.document).off('click.omicsModalSave');
                $(window.parent.document).off('change.omicsModalValidation');
                // Clean up global functions
                delete window.validateOmicsModalForm;
                delete window.showOmicsWarning;
                delete window.hideOmicsWarning;
                delete window.renderOmicsColumnAssignment;
            });

        } catch (err) {
            console.error("Error opening edit modal:", err);
            alert(`Failed to open edit dialog: ${err.message}`);
        }
    });

    // Handle analysis button click
    $("#omics_btn_analyze").on('click', async function() {
        try {
            var btn_text = await disablebutton("omics_btn_analyze", progress = true);

            if (air_omics.selected_data_ids.length == 0) {
                alert("Please select at least one dataset to analyze");
                enablebutton("omics_btn_analyze", btn_text);
                return;
            }
            
            var analysis_types = []
            if($("#omics_cb_upstream").prop('checked')) analysis_types.push("upstream");
            if($("#omics_cb_downstream").prop('checked')) analysis_types.push("downstream");

            if(analysis_types.length == 0)
            {
                alert("Please select at least one analysis type");
                enablebutton("omics_btn_analyze", btn_text);
                return;
            }

            const n_datasets = air_omics.selected_data_ids.length;
            const total = n_datasets * analysis_types.length;

            if(n_datasets > 10)
            {
                alert("Analysis is available only for up to 10 datasets.");
                enablebutton("omics_btn_analyze", btn_text);
                return;
            }

            air_omics.analyzed_data_ids = air_omics.selected_data_ids.slice();

            await updateProgress(0, total, "omics_btn_analyze", text = `Initialising...`);

            // Get data types for selected datasets
            const dataTypes = air_omics.selected_data_ids.map(dataId => {
                for (const source of Object.values(air_omics.data_tree)) {
                    if (source.data[dataId]) {
                        return source.data[dataId].data_type || 'transcriptomics';
                    }
                }
                return 'transcriptomics';
            });

            await getDataFromServer(
                "sylobio/prepare_LLM",
                { 
                    data_ids: air_omics.selected_data_ids,
                    data_types: dataTypes
                },
                "POST",
                "json"
            );
            
            // Process each dataset separately
            for (let i = 0; i < n_datasets; i++) {
                for(let j = 0; j < analysis_types.length; j++)
                {
                    await updateProgress(i * analysis_types.length + j, total, "omics_btn_analyze", text = `${analysis_types[j]} analysis - dataset ${i+1}/${n_datasets} ...`);

                    await getDataFromServer(
                        "sylobio/analyze_data",
                        { 
                            data_id: i, 
                            analysis_type: analysis_types[j],
                            data_type: dataTypes[i]
                        },
                        "POST",
                        "json"
                    );
                }
            }
            
            // Final progress update
            await updateProgress(total, total, "omics_btn_analyze", text = "Initialising LLM...");

            const response = await getDataFromServer(
                "sylobio/initialize_LLM",
                {},
                "POST",
                "json"
            );
            
            // var initial_query = "Provide the user with an overview of the data and the by this tool performed enrichment analysis results especially in the context of the current disease map. The user is not knowledgeable of the method. Also provide a list of fitting queries that they can use to explore the data further. Don't go into methodological details but rather focus on how this tool can support their data analysis. Talk directly to the user."
            
            // const response = await getDataFromServer(
            //     "sylobio/query_llm",
            //     { query: initial_query },
            //     "POST",
            //     "json"
            // );

            // console.log(response);
            
            // Enable omics focus switch after analysis completes
            $("#omics_focus_switch").prop('checked', true).trigger('change');
            
            // Append a "Download Results" button to the chat response
            const responsesWithDownload = (Array.isArray(response) ? response.slice() : [response]);
            responsesWithDownload.push({
                response_type: "btn",
                content: {
                    label: "Download Results",
                    icon: "fas fa-download",
                    onClick: async function() {
                        const result = await getDataFromServer("sylobio/get_analysis_result", {}, "POST", "json");
                        const dateStamp = new Date().toISOString().split('T')[0];

                        // Result is an object mapping filename -> file content (string)
                        const entries = Object.entries(result["output"] || {});

                        if (entries.length === 1) {
                            // Single file - download directly as .txt
                            const [name, content] = entries[0];
                            const filename = name.endsWith('.txt') ? name : `${name}.txt`;
                            download_data(filename, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
                        } else {
                            // Multiple files - bundle as .txt files in a zip
                            const zip = new air_data.JSZip();
                            entries.forEach(([name, content]) => {
                                const filename = name.endsWith('.txt') ? name : `${name}.txt`;
                                zip.file(filename, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
                            });

                            const zipBlob = await zip.generateAsync({ type: "blob" });
                            const zipUrl = URL.createObjectURL(zipBlob);

                            const downloadLink = document.createElement('a');
                            downloadLink.href = zipUrl;
                            downloadLink.download = `analysis_results_${dateStamp}.zip`;
                            document.body.appendChild(downloadLink);
                            downloadLink.click();
                            document.body.removeChild(downloadLink);
                            URL.revokeObjectURL(zipUrl);
                        }
                    }
                }
            });

            // // Use the generalized function to process responses
            processServerResponses(responsesWithDownload, "omics", $("#omics_query_input").val(), "analysis");            

            bootstrap.Collapse.getOrCreateInstance(document.querySelector('#omics_collapse_3')).hide();
            bootstrap.Collapse.getOrCreateInstance(document.querySelector('#omics_collapse_4')).show();
            $("#omics_collapse_4_btn").removeClass("air_disabledbutton");


            enablebutton("omics_btn_analyze", btn_text);
        } catch (err) {
            console.error("Error during analysis:", err);
            alert(`Analysis failed: ${err.message}`);
        }
        finally {
            
            // Scroll to bottom of analysis content and tab content
            const analysisContent = document.getElementById('omics_analysis_content');
            if (analysisContent) {
                analysisContent.scrollTop = analysisContent.scrollHeight;
            }
            const tabContent = document.getElementById('airomics_tab_content');
            if (tabContent) {
                // Get the actual height of the content
                const scrollHeight = tabContent.scrollHeight;
                // Animate scroll to bottom
                $(tabContent).animate({scrollTop: scrollHeight}, 'slow');
            }

            enablebutton("omics_btn_analyze", btn_text);
        }
    });

    // Handle file upload form submission
    $("#omics_btn_query").on("click", () => {
        const queryText = $(`#omics_query_input`).val().trim();
        multi_agent_query("omics", queryText);
    });
    // Handle function selector button click
    $("#omics_btn_function_selector").on('click', function() {
        showFunctionSelectorModal('omics');
    });

    // Setup node map link handling
    setupNodeMapLinks();

    // Handle PDF download button click
    $("#omics_btn_download_pdf").on('click', function() {
        downloadChatAsPDF('omics');
    });
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
    
    // Add handler after jstree is initialized to prevent select interaction issues
    $('#omics_data_treeview').on('ready.jstree', function() {
        // Find all select elements in the tree
        $('#omics_data_treeview .data-type-selector').each(function() {
            const $select = $(this);
            
            // Remove and reinsert the select to break the DOM parent-child relationship for events
            const $parent = $select.parent();
            const selectHtml = $select.prop('outerHTML');
            const selectPosition = $select.index();
            
            $select.remove();
            
            // Insert a wrapper div to capture events instead
            $parent.append('<span class="select-container"></span>');
            const $container = $parent.find('.select-container');
            $container.html(selectHtml);
            
            // Add specific event handlers to stop propagation
            $container.on('mousedown click', function(e) {
                e.stopImmediatePropagation();
                e.stopPropagation();
                e.preventDefault();
                return false;
            });
            
            // Add change handler for the select
            $container.find('.data-type-selector').on('change', function(e) {
                e.stopPropagation();
                
                const select = $(this);
                const value = select.val();
                const nodeId = select.closest('.jstree-node').attr('id');
                const dataId = nodeId.split('-')[1];
                
                // Update the data type in the tree structure
                for (const source of Object.values(air_omics.data_tree)) {
                    if (source.data[dataId]) {
                        source.data[dataId].data_type = value;
                        break;
                    }
                }
            });
        });
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
            children: [],
            a_attr: {
                'data-bs-toggle': 'tooltip',
                'data-bs-placement': 'right',
                title: sourceData.title
            }
        };
        // Add data entries as children
        for (const [dataId, dataInfo] of Object.entries(sourceData.data)) {
            const currentType = dataInfo.data_type || 'transcriptomics';
            const currentLabel = air_omics.data_types[currentType];
            
            // Process warnings and determine styling
            const warnings = dataInfo.warnings || [];
            const { warningClass, warningIcon, tooltipText } = processDataWarnings(dataInfo.name, warnings);
            
            // Debug: Log tooltip content
            if (warnings.length > 0) {
                console.log('Generated tooltip for', dataInfo.name, ':', tooltipText);
            }
            
            sourceNode.children.push({
                id: `data-${dataId}`,
                text: `${dataInfo.name}${warningIcon}`,
                icon: getDataIcon(dataInfo.type),
                data_id: dataId,
                li_attr: {
                    class: warningClass
                },
                a_attr: {
                    'data-bs-toggle': 'tooltip',
                    'data-bs-placement': 'right',
                    title: tooltipText
                }
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

function processDataWarnings(datasetName, warnings) {
    if (!warnings || warnings.length === 0) {
        return {
            warningClass: '',
            warningIcon: '',
            tooltipText: datasetName
        };
    }
    
    // Define warning severity hierarchy
    const severityOrder = ['critical', 'error', 'warning', 'info'];
    const severityColors = {
        'critical': 'omics-data-critical',
        'error': 'omics-data-error', 
        'warning': 'omics-data-warning',
        'info': 'omics-data-info'
    };
    const severityIcons = {
        'critical': '<span style="color: #dc3545; font-weight: bold;">🔴</span>',
        'error': '<span style="color: #fd7e14; font-weight: bold;">🟠</span>',
        'warning': '<span style="color: #ffc107; font-weight: bold;">🟡</span>',
        'info': '<span style="color: #17a2b8; font-weight: bold;">🔵</span>'
    };
    const treeIcons = {
        'critical': ' 🔴',
        'error': ' 🟠',
        'warning': ' 🟡',
        'info': ' 🔵'
    };
    
    // Find the highest severity warning
    let highestSeverity = 'info';
    for (const severityLevel of severityOrder) {
        if (warnings.some(w => w.type === severityLevel)) {
            highestSeverity = severityLevel;
            break;
        }
    }
    
    // Build tooltip text with all warnings (plain text format)
    let tooltipText = `${datasetName}\n\nData Quality Warnings:\n`;
    
    // Group warnings by type
    const warningsByType = {};
    warnings.forEach(warning => {
        if (!warningsByType[warning.type]) {
            warningsByType[warning.type] = [];
        }
        warningsByType[warning.type].push(warning);
    });
    
    // Simple icons for plain text
    const plainTextIcons = {
        'critical': '🔴',
        'error': '🟠', 
        'warning': '🟡',
        'info': '🔵'
    };
    
    // Display warnings in severity order
    severityOrder.forEach(type => {
        if (warningsByType[type]) {
            warningsByType[type].forEach(warning => {
                const icon = plainTextIcons[type];
                tooltipText += `${icon} ${type.toUpperCase()}: ${warning.message}\n`;
                if (warning.suggestion) {
                    tooltipText += `   Suggestion: ${warning.suggestion}\n`;
                }
                tooltipText += '\n';
            });
        }
    });
    
    return {
        warningClass: severityColors[highestSeverity],
        warningIcon: treeIcons[highestSeverity],
        tooltipText: tooltipText.trim()
    };
}

function addDataToTree(source, data) {
    $("#omics_collapse_2_btn").removeClass("air_disabledbutton");

    // Add data to the tree structure
    air_omics.data_tree[source].data[data.data_id] = data
    renderOmicsOverlayPanel();

    // Refresh the tree view
    if ($('#omics_data_treeview').jstree(true)) {
        $('#omics_data_treeview').jstree(true).settings.core.data = buildTreeData();
        $('#omics_data_treeview').jstree(true).refresh();
        
        // Reinitialize tooltips after tree refresh
        // First dispose any existing tooltips to prevent memory leaks
        $('#omics_data_treeview [data-bs-toggle="tooltip"]').each(function() {
            const existingTooltip = bootstrap.Tooltip.getInstance(this);
            if (existingTooltip) {
                existingTooltip.dispose();
            }
        });
        
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('#omics_data_treeview [data-bs-toggle="tooltip"]'))
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    bootstrap.Collapse.getOrCreateInstance(document.querySelector('#omics_collapse_3')).show();
}

function removeDataFromTree(dataIds) {
    for (const dataId of dataIds) {
        for (const source of Object.values(air_omics.data_tree)) {
            if (source.data[dataId]) {
                delete source.data[dataId];
            }
        }
    }

    // Refresh the tree view
    if ($('#omics_data_treeview').jstree(true)) {
        $('#omics_data_treeview').jstree(true).settings.core.data = buildTreeData();
        $('#omics_data_treeview').jstree(true).refresh();
    }

    forgetOmicsOverlayDatasets(dataIds);
}

async function getDataFromLocalTree(dataId) {

    for (const [source, sourceData] of Object.entries(air_omics.data_tree)) {
        if (sourceData.data[dataId]) {
            return sourceData.data[dataId];
        }
    }

    return null;
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

    if (dataColumns.length === 0) return false;

    // Check if every second column contains 'pvalue' or 'p-value'
    for (let i = 1; i < dataColumns.length; i += 2) {
        const colName = dataColumns[i].toLowerCase();
        if (!colName.includes('pval') && !colName.includes('p-val')) {
            return false;
        }
    }

    return true;
}

function createOmicsDataTable(processedData) {
    const columns = processedData.columns.map((column, index) => index === 0 ? column : {
        ...column,
        render: (value, type) => {
            if (type === 'display' && typeof value === 'number' && Number.isFinite(value)) {
                if (value === 0 || Math.abs(value) >= 0.01) {
                    return value === 0 ? '0' : value.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 2 });
                }
                return value.toExponential(2).replace(/\.?0+(?=e)/, '');
            }
            return value;
        }
    });
    return createDataTable('#omics_datatable', processedData.data, columns);
}

async function omicsOnBioEntityClick(data) {
    if (!data || data.type !== 'ALIAS') {
        return;
    }

    const request = ++air_omics.node_selection_request;
    if (!$.fn.DataTable.isDataTable($('#omics_datatable')[0])) {
        return;
    }

    try {
        const entities = await getDataFromServer(
            'sylobio/map_minerva_elements',
            { elements: [{ id: data.id, modelId: data.modelId }] },
            'POST',
            'json'
        );
        if (!Array.isArray(entities) || typeof entities[0]?.name !== 'string') {
            console.warn('Received unexpected response for omics element details:', entities);
            return;
        }
        if (request !== air_omics.node_selection_request ||
            !$.fn.DataTable.isDataTable($('#omics_datatable')[0])) {
            return;
        }

        $('#omics_datatable').DataTable().search(entities[0].name).draw();
    } catch (err) {
        console.error('Error searching omics data for selected node:', err);
    }
}

function highlightOmicsColumn() {
    highlightColumn({
        selectedColumn: $("#omics_select_column").val(),
        data: air_omics.loaded_data,
        markerArray: air_omics.added_markers,
        includeNonMapped: $("#omics_cb_onlymapped_norm").prop('checked'),
        markerPrefix: "omics_marker_",
        pvalueThreshold: $("#omics_select_column_filter").val() ? parseFloat($("#omics_select_column_filter").val()) : null
    });
}

// Add click handler for node mapping links
$(document).on('click', '.node_map_link', function(e) {
    e.preventDefault();
    var minerva_ids = $(this).data('id');

    minerva.map.triggerSearch({ query: $(this).text(), perfectSearch: true});
    
    for(var minerva_id of minerva_ids) {
        minerva.map.openMap({ id: minerva_id[0] });

        minerva.map.fitBounds({
            x1: minerva_id[4],
            y1: minerva_id[5],
            x2: minerva_id[4] + minerva_id[3],
                y2: minerva_id[5] + minerva_id[2]
            });
    }
});

// Helper function to check if a file is a valid data file
function isValidDataFile(filename) {
    const validExtensions = ['.txt', '.tsv', '.csv', '.tab', '.data', '.xlsx', '.xls'];
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return validExtensions.includes(ext);
}

// Helper function to get MIME type based on file extension
function getFileType(filename) {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    const mimeTypes = {
        '.txt': 'text/plain',
        '.tsv': 'text/tab-separated-values',
        '.csv': 'text/csv',
        '.tab': 'text/tab-separated-values',
        '.data': 'text/plain',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.xls': 'application/vnd.ms-excel'
    };
    return mimeTypes[ext] || 'text/plain';
}

// Helper function to convert data to TSV format
function convertDataToTSV(data, datasetName = '', datasetDescription = '') {
    if (!data || !data.columns || !data.data) {
        return "Error: Invalid data format";
    }
    
    let tsvContent = '';
    

    if (datasetDescription && datasetDescription.trim()) {
        // Split description into lines and prefix each with #
        const descriptionLines = datasetDescription.trim().split('\n');
        descriptionLines.forEach(line => {
            tsvContent += `# ${line.trim()}\n`;
        });
    }
    
    // Add header row
    tsvContent += data.columns.slice(0, -1).join('\t') + '\n'; // Exclude the last column (minerva_ids)
    
    // Add data rows
    data.data.forEach(row => {
        const rowData = row.slice(0, -1); // Exclude the last column (minerva_ids)
        tsvContent += rowData.join('\t') + '\n';
    });
    
    return tsvContent;
}


// ---------------------------------------------------------------------------
// Map overlay panel: one place to choose which datasets and analysis results
// are shown on the map, with per-layer p-value thresholds and sample filters.
// ---------------------------------------------------------------------------

const OMICS_OVERLAY_DEFAULT_PVALUE = 0.05;

function getOmicsOverlayState() {
    if (!air_omics.overlays) {
        air_omics.overlays = {
            open: false,
            settings: {},
            cache: {},
            loading: {},
            failed: {},
            openSamples: {},
            enrichment: null,
            enrichmentToken: 0,
            renderToken: 0,
            renderTimer: null,
            paused: false,
            influenceCreatedBy: null,
            lastLayers: []
        };
    }
    return air_omics.overlays;
}

function omicsOverlayEscape(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function getOmicsOverlayDatasets() {
    const datasets = [];
    for (const sourceData of Object.values(air_omics.data_tree)) {
        for (const [dataId, info] of Object.entries(sourceData.data)) {
            datasets.push({
                id: String(dataId),
                name: (info && info.name) || `Dataset ${dataId}`,
                has_pvalues: !!(info && info.has_pvalues)
            });
        }
    }
    return datasets;
}

function getOmicsOverlaySettings(key) {
    const state = getOmicsOverlayState();
    if (!state.settings[key]) {
        state.settings[key] = { visible: false, threshold: OMICS_OVERLAY_DEFAULT_PVALUE, hidden: [] };
    }
    return state.settings[key];
}

function loadOmicsOverlayDataset(dataId) {
    const state = getOmicsOverlayState();
    dataId = String(dataId);
    if (state.cache[dataId]) {
        return Promise.resolve(state.cache[dataId]);
    }
    if (!state.loading[dataId]) {
        const request = getDataFromServer("sylobio/get_omics_data", { data_id: dataId }, "POST", "json")
            .then(data => {
                if (!data || !Array.isArray(data.columns) || !Array.isArray(data.data)) {
                    throw new Error("Invalid dataset response");
                }
                if (state.loading[dataId] === request) {
                    state.cache[dataId] = data;
                    delete state.failed[dataId];
                }
                return data;
            })
            .catch(err => {
                if (state.loading[dataId] === request) {
                    state.failed[dataId] = (err && err.message) || String(err);
                }
                throw err;
            })
            .finally(() => {
                if (state.loading[dataId] === request) {
                    delete state.loading[dataId];
                }
            });
        state.loading[dataId] = request;
    }
    return state.loading[dataId];
}

function getOmicsSampleNames(data) {
    return Array.isArray(data && data.value_columns) ? data.value_columns.map(String) : [];
}

function parseOmicsOverlayPvalue(raw) {
    if (raw === null || raw === undefined || raw === '') {
        return NaN;
    }
    return Number(raw);
}

function addOmicsOverlayNode(nodes, minervaId, values) {
    if (!Array.isArray(minervaId) || minervaId.length < 6) {
        return;
    }
    const key = `${minervaId[0]}_${minervaId[1]}`;
    const existing = nodes.get(key);
    if (!existing) {
        nodes.set(key, {
            modelId: minervaId[0],
            id: key,
            height: minervaId[2],
            width: minervaId[3],
            x: minervaId[4],
            y: minervaId[5],
            values: values.slice()
        });
        return;
    }
    // Several rows can map to the same element: keep the strongest value per slice.
    values.forEach((value, index) => {
        if (Math.abs(value) > Math.abs(existing.values[index])) {
            existing.values[index] = value;
        }
    });
}

function buildOmicsDataOverlayLayer(data, settings) {
    const sampleNames = getOmicsSampleNames(data);
    const hidden = new Set(settings.hidden);
    const selected = sampleNames
        .map((name, index) => ({ name, index }))
        .filter(sample => !hidden.has(sample.name));
    const valueIndices = data.value_columns.map(column => data.columns.indexOf(column));
    const pvalueColumns = Array.isArray(data.pvalue_columns) ? data.pvalue_columns : [];
    const pvalueIndices = data.value_columns.map((column, index) => data.columns.indexOf(pvalueColumns[index]));
    const hasPvalues = !!data.has_pvalues && pvalueColumns.length > 0;
    const threshold = settings.threshold;
    const max = Math.abs(Number(data.minerva_max)) || 1;
    const minervaColumn = data.columns.length - 1;
    const significantRows = hasPvalues && threshold <= OMICS_OVERLAY_DEFAULT_PVALUE && Array.isArray(data.significant_mask)
        ? new Set(data.significant_mask)
        : null;
    const nodes = new Map();

    if (selected.length > 0) {
        for (const row of data.data) {
            const minervaIds = row[minervaColumn];
            if (!Array.isArray(minervaIds) || minervaIds.length === 0) {
                continue;
            }
            if (significantRows && !significantRows.has(row[0])) {
                continue;
            }
            const values = selected.map(({ index }) => {
                const value = Number(row[valueIndices[index]]);
                if (valueIndices[index] < 0 || !Number.isFinite(value)) {
                    return 0;
                }
                if (hasPvalues) {
                    const pvalue = pvalueIndices[index] < 0 ? NaN : parseOmicsOverlayPvalue(row[pvalueIndices[index]]);
                    if (!(Number.isFinite(pvalue) && pvalue <= threshold)) {
                        return 0;
                    }
                }
                return value / max;
            });
            if (values.every(value => value === 0)) {
                continue;
            }
            for (const minervaId of minervaIds) {
                addOmicsOverlayNode(nodes, minervaId, values);
            }
        }
    }

    return { slices: selected.map(sample => sample.name), nodes };
}

function buildOmicsEnrichmentOverlayLayer(enrichment, group, settings) {
    const hidden = new Set(settings.hidden);
    const selected = group.samples
        .map((name, index) => ({ name, index }))
        .filter(sample => !hidden.has(sample.name));
    const nodes = new Map();

    if (selected.length > 0) {
        for (const row of enrichment.rows) {
            const rowValues = Array.isArray(row[6]) ? row[6] : [row[6]];
            const rowPvalues = Array.isArray(row[7]) ? row[7] : rowValues.map(() => row[7]);
            const values = selected.map(({ index }) => {
                const position = group.offset + index;
                const value = Number(rowValues[position]);
                if (!Number.isFinite(value)) {
                    return 0;
                }
                if (enrichment.hasPvalues) {
                    const pvalue = parseOmicsOverlayPvalue(rowPvalues[position]);
                    if (!(Number.isFinite(pvalue) && pvalue <= settings.threshold)) {
                        return 0;
                    }
                }
                return value;
            });
            if (!values.every(value => value === 0)) {
                addOmicsOverlayNode(nodes, row, values);
            }
        }
    }

    return { slices: selected.map(sample => sample.name), nodes };
}

function getOmicsOverlayLayerDescriptors() {
    const state = getOmicsOverlayState();
    const datasets = getOmicsOverlayDatasets();
    const datasetIds = new Set(datasets.map(dataset => dataset.id));
    const groups = state.enrichment ? state.enrichment.groups : [];
    const descriptors = [];

    for (const dataset of datasets) {
        descriptors.push({ key: `data:${dataset.id}`, kind: 'data', datasetId: dataset.id, title: dataset.name, label: 'Measured values' });
        for (const group of groups.filter(group => group.datasetId === dataset.id)) {
            descriptors.push({ key: `enr:${group.key}`, kind: 'enrichment', datasetId: dataset.id, group, title: dataset.name, label: 'Enrichment results' });
        }
    }
    for (const group of groups.filter(group => !group.datasetId || !datasetIds.has(group.datasetId))) {
        descriptors.push({ key: `enr:${group.key}`, kind: 'enrichment', datasetId: null, group, title: group.title, label: 'Enrichment results' });
    }
    return descriptors;
}

// Measured values and enrichment results never hit the same elements (molecules vs. phenotypes),
// so each kind is laid out as its own slice track starting at slice 0.
function composeOmicsOverlayMarkers(layers) {
    const markers = new Map();

    for (const kind of ['data', 'enrichment']) {
        const trackLayers = layers.filter(layer => layer.descriptor.kind === kind);
        const trackSlices = trackLayers.reduce((sum, layer) => sum + layer.slices.length, 0);
        let offset = 0;

        for (const layer of trackLayers) {
            for (const [key, node] of layer.nodes) {
                if (!markers.has(key)) {
                    markers.set(key, {
                        modelId: node.modelId,
                        id: node.id,
                        height: node.height,
                        width: node.width,
                        x: node.x,
                        y: node.y,
                        value: new Array(trackSlices).fill(0)
                    });
                }
                const marker = markers.get(key);
                while (marker.value.length < trackSlices) {
                    marker.value.push(0);
                }
                node.values.forEach((value, index) => {
                    // Fallback if an element unexpectedly appears in both tracks: keep the stronger value.
                    if (Math.abs(value) >= Math.abs(marker.value[offset + index])) {
                        marker.value[offset + index] = value;
                    }
                });
            }
            offset += layer.slices.length;
        }
    }
    return Array.from(markers.values());
}

async function renderOmicsOverlays() {
    const state = getOmicsOverlayState();
    if (state.paused) {
        return;
    }
    const token = ++state.renderToken;
    const descriptors = getOmicsOverlayLayerDescriptors().filter(descriptor => getOmicsOverlaySettings(descriptor.key).visible);
    const layers = [];
    let loadedNewData = false;

    for (const descriptor of descriptors) {
        const settings = getOmicsOverlaySettings(descriptor.key);
        if (descriptor.kind === 'data') {
            const wasCached = !!state.cache[descriptor.datasetId];
            let data;
            try {
                data = await loadOmicsOverlayDataset(descriptor.datasetId);
            } catch (err) {
                console.error(`Could not load dataset ${descriptor.datasetId} for map overlay:`, err);
                loadedNewData = true;
                continue;
            }
            loadedNewData = loadedNewData || !wasCached;
            if (token !== state.renderToken) {
                return;
            }
            layers.push({ descriptor, ...buildOmicsDataOverlayLayer(data, settings) });
        } else {
            layers.push({ descriptor, ...buildOmicsEnrichmentOverlayLayer(state.enrichment, descriptor.group, settings) });
        }
    }

    if (token !== state.renderToken) {
        return;
    }

    const markers = composeOmicsOverlayMarkers(layers.filter(layer => layer.slices.length > 0));
    await highlightValues(markers, OMICS_DATAVIEW_HIGHLIGHT, false);
    if (token !== state.renderToken) {
        return;
    }

    state.lastLayers = layers.map(layer => ({
        kind: layer.descriptor.kind,
        title: layer.descriptor.title,
        label: layer.descriptor.label,
        slices: layer.slices
    }));

    if (loadedNewData) {
        renderOmicsOverlayPanel();
    } else {
        updateOmicsOverlayStatus();
    }
}

function scheduleOmicsOverlayRender(delay = 300, restore = false) {
    const state = getOmicsOverlayState();
    clearTimeout(state.renderTimer);
    state.renderTimer = setTimeout(() => {
        const render = restore ? restoreOmicsOverlays() : renderOmicsOverlays();
        render.catch(err => console.error("Error updating map overlays:", err));
    }, delay);
}

function getOmicsOverlaySamples(descriptor) {
    const state = getOmicsOverlayState();
    if (descriptor.kind === 'enrichment') {
        return descriptor.group.samples;
    }
    const data = state.cache[descriptor.datasetId];
    return data ? getOmicsSampleNames(data) : null;
}

function omicsOverlayHasPvalues(descriptor) {
    const state = getOmicsOverlayState();
    if (descriptor.kind === 'enrichment') {
        return !!(state.enrichment && state.enrichment.hasPvalues);
    }
    const data = state.cache[descriptor.datasetId];
    if (data) {
        return !!data.has_pvalues && Array.isArray(data.pvalue_columns) && data.pvalue_columns.length > 0;
    }
    const dataset = getOmicsOverlayDatasets().find(item => item.id === descriptor.datasetId);
    return !!(dataset && dataset.has_pvalues);
}

function getOmicsOverlaySampleSummary(samples, hidden) {
    const hiddenSet = new Set(hidden);
    const shown = samples.filter(name => !hiddenSet.has(name)).length;
    if (shown === samples.length) {
        return `All ${samples.length} shown`;
    }
    if (shown === 0) {
        return 'None selected';
    }
    return `${shown} of ${samples.length} shown`;
}

function renderOmicsOverlaySettingsHtml(descriptor) {
    const state = getOmicsOverlayState();
    const settings = getOmicsOverlaySettings(descriptor.key);
    const key = omicsOverlayEscape(descriptor.key);
    const parts = [];

    if (omicsOverlayHasPvalues(descriptor)) {
        parts.push(`
            <label class="omics-ov-field">
                <span>Show only where p-value ≤</span>
                <input type="number" class="form-control form-control-sm omics-ov-threshold" data-key="${key}"
                       min="0" max="1" step="0.01" value="${settings.threshold}" aria-label="P-value threshold">
            </label>`);
    } else {
        const reason = descriptor.kind === 'data'
            ? 'This dataset has no p-values, so all values are shown.'
            : 'These results include no p-values, so all values are shown.';
        parts.push(`<div class="omics-ov-note">${reason}</div>`);
    }

    const samples = getOmicsOverlaySamples(descriptor);
    if (!samples) {
        if (descriptor.kind === 'data' && state.failed[descriptor.datasetId]) {
            parts.push(`<div class="omics-ov-note text-danger">Could not load this dataset. Untick and tick again to retry.</div>`);
        } else {
            parts.push(`<div class="omics-ov-note"><span class="spinner-border spinner-border-sm me-1" role="status"></span>Loading samples…</div>`);
        }
    } else if (samples.length === 1) {
        parts.push(`<div class="omics-ov-note">Sample: ${omicsOverlayEscape(samples[0])}</div>`);
    } else if (samples.length > 1) {
        const hidden = new Set(settings.hidden);
        const checkboxes = samples.map(name => `
                <label>
                    <input type="checkbox" class="form-check-input omics-ov-sample" data-key="${key}"
                           value="${omicsOverlayEscape(name)}" ${hidden.has(name) ? '' : 'checked'}>
                    <span>${omicsOverlayEscape(name)}</span>
                </label>`).join('');
        parts.push(`
            <details class="omics-ov-samples" data-key="${key}" ${state.openSamples[descriptor.key] ? 'open' : ''}>
                <summary>Samples: <span class="omics-ov-samples-summary">${getOmicsOverlaySampleSummary(samples, settings.hidden)}</span></summary>
                <div class="omics-ov-sample-actions">
                    <a href="#" class="omics-ov-samples-all" data-key="${key}">Select all</a>
                    <span>·</span>
                    <a href="#" class="omics-ov-samples-none" data-key="${key}">Clear</a>
                </div>
                <div class="omics-ov-sample-list">${checkboxes}</div>
            </details>`);
    }

    return `<div class="omics-ov-settings">${parts.join('')}</div>`;
}

function renderOmicsOverlayLayerHtml(descriptor) {
    const settings = getOmicsOverlaySettings(descriptor.key);
    const icon = descriptor.kind === 'data' ? 'fa-table' : 'fa-chart-bar';
    return `
        <div class="omics-ov-layer" data-key="${omicsOverlayEscape(descriptor.key)}">
            <label class="omics-ov-layer-toggle">
                <input type="checkbox" class="form-check-input omics-ov-visible" data-key="${omicsOverlayEscape(descriptor.key)}" ${settings.visible ? 'checked' : ''}>
                <i class="fas ${icon}"></i>
                <span>${descriptor.label}${settings.visible && getOmicsOverlayState().paused ? ' (paused)' : ''}</span>
            </label>
            ${settings.visible ? renderOmicsOverlaySettingsHtml(descriptor) : ''}
        </div>`;
}

function renderOmicsOverlayPanel() {
    const $body = $('#omics_overlay_body');
    if ($body.length === 0) {
        return;
    }

    const state = getOmicsOverlayState();
    const datasets = getOmicsOverlayDatasets();
    const descriptors = getOmicsOverlayLayerDescriptors();
    const cards = [];

    for (const dataset of datasets) {
        const layers = descriptors.filter(descriptor => descriptor.datasetId === dataset.id);
        let enrichmentHint = '';
        if (!layers.some(descriptor => descriptor.kind === 'enrichment')) {
            const hint = !state.enrichment
                ? 'Enrichment results: run the analysis (step 3) to add them here.'
                : state.enrichment.groups.some(group => !group.datasetId)
                    ? 'Enrichment results: shown under “Latest analysis results” below.'
                    : 'Enrichment results: this dataset was not part of the latest analysis.';
            enrichmentHint = `<div class="omics-ov-layer omics-ov-note"><i class="fas fa-chart-bar me-1"></i>${hint}</div>`;
        }
        cards.push(`
            <div class="omics-ov-card">
                <div class="omics-ov-card-title" title="${omicsOverlayEscape(dataset.name)}">${omicsOverlayEscape(dataset.name)}</div>
                ${layers.map(renderOmicsOverlayLayerHtml).join('')}
                ${enrichmentHint}
            </div>`);
    }

    for (const descriptor of descriptors.filter(descriptor => !descriptor.datasetId)) {
        cards.push(`
            <div class="omics-ov-card">
                <div class="omics-ov-card-title" title="${omicsOverlayEscape(descriptor.title)}">${omicsOverlayEscape(descriptor.title)}</div>
                ${renderOmicsOverlayLayerHtml(descriptor)}
            </div>`);
    }

    if (cards.length === 0) {
        $body.html(`<div class="omics-ov-note">Upload a dataset (step 1) to choose what is shown on the map here.</div>`);
    } else {
        $body.html(`
            <div class="omics-ov-intro">Tick what you want to see on the map. Changes are applied immediately.</div>
            ${cards.join('')}
            <div class="omics-ov-legend" id="omics_overlay_legend"></div>
            <div class="omics-ov-footer">
                <button type="button" class="btn btn-link btn-sm p-0 omics-ov-hide-all">Hide all overlays</button>
            </div>`);
    }

    $body.prepend(`
        <div id="omics_overlay_focus" class="alert alert-warning py-2 px-3 mb-2 small" role="status" style="display: none;">
            Xplore highlights are shown instead. Your Omics layer selections, thresholds and samples are saved.
            <button type="button" class="btn btn-outline-secondary btn-sm mt-1 omics-ov-restore">Restore Omics overlays</button>
        </div>`);

    $body.find('details.omics-ov-samples').on('toggle', function() {
        getOmicsOverlayState().openSamples[$(this).attr('data-key')] = this.open;
    });

    updateOmicsOverlayStatus();
}

function updateOmicsOverlayStatus() {
    const state = getOmicsOverlayState();
    const visibleCount = getOmicsOverlayLayerDescriptors().filter(descriptor => getOmicsOverlaySettings(descriptor.key).visible).length;
    const $status = $('#omics_overlay_status');
    $status
        .text(state.paused ? 'Paused for Xplore' : visibleCount === 0 ? 'Nothing shown' : `${visibleCount} layer${visibleCount === 1 ? '' : 's'} shown`)
        .toggleClass('active', !state.paused && visibleCount > 0);
    $('#omics_overlay_focus').toggle(state.paused);
    $('#omics_overlay_panel .omics-ov-hide-all').prop('disabled', visibleCount === 0);

    const $legend = $('#omics_overlay_legend');
    if ($legend.length === 0) {
        return;
    }
    const tracks = [
        { kind: 'data', label: 'Molecules (measured values)' },
        { kind: 'enrichment', label: 'Phenotypes (enrichment results)' }
    ].map(track => ({
        ...track,
        slices: state.lastLayers
            .filter(layer => layer.kind === track.kind)
            .flatMap(layer => layer.slices.map(sample => ({ layer, sample })))
    })).filter(track => track.slices.length >= 2);
    if (state.paused || visibleCount === 0 || tracks.length === 0) {
        $legend.empty().hide();
        return;
    }
    $legend.html(tracks.map(track => {
        const items = track.slices.map(({ layer, sample }) =>
            `<li>${omicsOverlayEscape(layer.title)} · <b>${omicsOverlayEscape(sample)}</b></li>`
        ).join('');
        return `
            <div class="omics-ov-note">${omicsOverlayEscape(track.label)} are split into ${track.slices.length} slices, from left to right:</div>
            <ol>${items}</ol>`;
    }).join('')).show();
}

function setOmicsOverlaySamples(key, $details) {
    const settings = getOmicsOverlaySettings(key);
    const hidden = [];
    const all = [];
    $details.find('.omics-ov-sample').each(function() {
        all.push(this.value);
        if (!this.checked) {
            hidden.push(this.value);
        }
    });
    settings.hidden = hidden;
    $details.find('.omics-ov-samples-summary').text(getOmicsOverlaySampleSummary(all, hidden));
    scheduleOmicsOverlayRender(300, true);
}

function setOmicsOverlayPanelOpen(open) {
    getOmicsOverlayState().open = open;
    $('#omics_overlay_toggle').attr('aria-expanded', String(open));
    $('#omics_overlay_body').toggle(open);
    air_data.container.toggleClass('omics-overlay-focused', open);
}

function initOmicsOverlayPanel() {
    const state = getOmicsOverlayState();
    air_data.container.addClass('omics-overlay-host');
    $('<div class="omics-overlay-backdrop" aria-hidden="true"></div>').appendTo(air_data.container);
    const $panel = $(`
        <div id="omics_overlay_panel" class="mt-2">
            <button type="button" id="omics_overlay_toggle" aria-expanded="false" aria-controls="omics_overlay_body">
                <i class="fas fa-chevron-right omics-ov-chevron"></i>
                <i class="fas fa-layer-group"></i>
                <span>Map overlays</span>
                <span id="omics_overlay_status" class="omics-ov-status">Nothing shown</span>
            </button>
            <div id="omics_overlay_body" style="display: none;"></div>
        </div>
    `).prependTo(air_omics.container);

    let hovered = false;
    let keyboardFocused = false;
    let pointerFocus = false;
    let dismissed = false;
    let closeTimer = null;
    const closeWhenOutside = () => {
        clearTimeout(closeTimer);
        closeTimer = setTimeout(() => {
            if (!hovered && !(keyboardFocused && $panel[0].contains(document.activeElement))) {
                setOmicsOverlayPanelOpen(false);
            }
        }, 150);
    };

    $panel.on('mouseenter', function() {
        if (!window.matchMedia('(hover: hover)').matches) {
            return;
        }
        hovered = true;
        dismissed = false;
        clearTimeout(closeTimer);
        setOmicsOverlayPanelOpen(true);
    });
    $panel.on('mouseleave', function() {
        hovered = false;
        closeWhenOutside();
    });
    $panel.on('pointerdown mousedown', function() {
        pointerFocus = true;
        keyboardFocused = false;
    });
    $panel.on('focusin', function() {
        if (!pointerFocus && !dismissed) {
            keyboardFocused = true;
            clearTimeout(closeTimer);
            setOmicsOverlayPanelOpen(true);
        }
        pointerFocus = false;
    });
    $panel.on('focusout', closeWhenOutside);
    $panel.on('keydown', function(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            dismissed = true;
            keyboardFocused = false;
            clearTimeout(closeTimer);
            setOmicsOverlayPanelOpen(false);
            $('#omics_overlay_toggle').trigger('focus');
        } else {
            pointerFocus = false;
            keyboardFocused = true;
            dismissed = false;
            if (event.target.id !== 'omics_overlay_toggle' || (event.key !== 'Enter' && event.key !== ' ')) {
                setOmicsOverlayPanelOpen(true);
            }
        }
    });
    $panel.on('click', '#omics_overlay_toggle', function() {
        dismissed = state.open;
        setOmicsOverlayPanelOpen(!state.open);
    });
    $(document).on('pointerdown.omicsOverlayPanel mousedown.omicsOverlayPanel', function(event) {
        if (!$panel[0].contains(event.target)) {
            hovered = false;
            keyboardFocused = false;
            pointerFocus = false;
            clearTimeout(closeTimer);
            setOmicsOverlayPanelOpen(false);
        }
    });
    $(document).on('keydown.omicsOverlayPanel', function(event) {
        if (event.key === 'Tab') {
            pointerFocus = false;
        }
    });
    $(window).on('blur.omicsOverlayPanel', function() {
        hovered = false;
        keyboardFocused = false;
        clearTimeout(closeTimer);
        setOmicsOverlayPanelOpen(false);
    });
    $('#airomics_tab').on('hide.bs.tab', function() {
        hovered = false;
        keyboardFocused = false;
        clearTimeout(closeTimer);
        setOmicsOverlayPanelOpen(false);
    });

    $panel.on('change', '.omics-ov-visible', function() {
        getOmicsOverlaySettings($(this).attr('data-key')).visible = this.checked;
        renderOmicsOverlayPanel();
        scheduleOmicsOverlayRender(0, true);
    });

    $panel.on('input change', '.omics-ov-threshold', function() {
        const value = parseFloat(String(this.value).replace(',', '.'));
        const valid = Number.isFinite(value) && value > 0 && value <= 1;
        $(this).toggleClass('is-invalid', !valid);
        if (valid) {
            getOmicsOverlaySettings($(this).attr('data-key')).threshold = value;
            scheduleOmicsOverlayRender(300, true);
        }
    });

    $panel.on('change', '.omics-ov-sample', function() {
        setOmicsOverlaySamples($(this).attr('data-key'), $(this).closest('details'));
    });

    $panel.on('click', '.omics-ov-samples-all, .omics-ov-samples-none', function(e) {
        e.preventDefault();
        const $details = $(this).closest('details');
        $details.find('.omics-ov-sample').prop('checked', $(this).hasClass('omics-ov-samples-all'));
        setOmicsOverlaySamples($(this).attr('data-key'), $details);
    });

    $panel.on('click', '.omics-ov-hide-all', function() {
        for (const descriptor of getOmicsOverlayLayerDescriptors()) {
            getOmicsOverlaySettings(descriptor.key).visible = false;
        }
        renderOmicsOverlayPanel();
        scheduleOmicsOverlayRender(0);
    });

    $panel.on('click', '.omics-ov-restore', function() {
        restoreOmicsOverlays().catch(err => console.error("Error restoring Omics overlays:", err));
    });

    renderOmicsOverlayPanel();
}

function pauseOmicsOverlaysForInfluence(createdBy) {
    const state = getOmicsOverlayState();
    clearTimeout(state.renderTimer);
    state.renderToken++;
    state.enrichmentToken++;
    state.paused = true;
    state.influenceCreatedBy = createdBy;
    renderOmicsOverlayPanel();
}

async function restoreOmicsOverlays() {
    const state = getOmicsOverlayState();
    const token = ++state.renderToken;
    if (state.influenceCreatedBy !== null) {
        await removeHighlight(state.influenceCreatedBy, false, "surface");
    }
    if (token !== state.renderToken) {
        return;
    }
    state.influenceCreatedBy = null;
    state.paused = false;
    renderOmicsOverlayPanel();
    await renderOmicsOverlays();
}

// Called by Dataset View: show this dataset's measured values, replacing other dataset views.
async function showOmicsDatasetOverlay(dataId, data) {
    const state = getOmicsOverlayState();
    dataId = String(dataId);
    if (data) {
        state.cache[dataId] = data;
        delete state.loading[dataId];
        delete state.failed[dataId];
    }
    for (const dataset of getOmicsOverlayDatasets()) {
        getOmicsOverlaySettings(`data:${dataset.id}`).visible = dataset.id === dataId;
    }
    renderOmicsOverlayPanel();
    await restoreOmicsOverlays();
}

// Called for map highlights from Omics analysis responses: replaces previous analysis results.
async function setOmicsEnrichmentOverlay(content, createdBy = '') {
    const state = getOmicsOverlayState();
    const token = ++state.enrichmentToken;
    const rows = (Array.isArray(content) ? content : []).filter(row => Array.isArray(row) && row.length >= 7);
    const sliceCount = rows.reduce((max, row) => Math.max(max, Array.isArray(row[6]) ? row[6].length : 1), 0);
    const hasPvalues = rows.some(row => row[7] !== undefined && row[7] !== null);
    const analyzedIds = (air_omics.analyzed_data_ids || []).map(String);
    const datasetNames = new Map(getOmicsOverlayDatasets().map(dataset => [dataset.id, dataset.name]));
    let groups = null;

    if (analyzedIds.length > 0 && sliceCount > 0) {
        try {
            const datasets = await Promise.all(analyzedIds.map(id => loadOmicsOverlayDataset(id)));
            if (token !== state.enrichmentToken) {
                return;
            }
            const sampleLists = datasets.map(getOmicsSampleNames);
            const totalSamples = sampleLists.reduce((sum, samples) => sum + samples.length, 0);
            let offset = 0;
            if (totalSamples === sliceCount) {
                groups = analyzedIds.map((id, index) => {
                    const group = { key: id, datasetId: id, title: datasetNames.get(id) || `Dataset ${id}`, offset, samples: sampleLists[index] };
                    offset += sampleLists[index].length;
                    return group;
                });
            } else if (analyzedIds.length === sliceCount) {
                groups = analyzedIds.map((id, index) => ({ key: id, datasetId: id, title: datasetNames.get(id) || `Dataset ${id}`, offset: index, samples: ['Score'] }));
            }
        } catch (err) {
            console.warn("Could not match analysis results to datasets:", err);
        }
    }

    if (token !== state.enrichmentToken) {
        return;
    }

    if (!groups) {
        groups = sliceCount > 0 ? [{
            key: 'all',
            datasetId: null,
            title: 'Latest analysis results',
            offset: 0,
            samples: sliceCount === 1 ? ['Score'] : Array.from({ length: sliceCount }, (_, index) => `Slice ${index + 1}`)
        }] : [];
    }

    for (const key of Object.keys(state.settings)) {
        if (key.startsWith('enr:')) {
            delete state.settings[key];
            delete state.openSamples[key];
        }
    }
    state.enrichment = { createdBy, rows, groups, hasPvalues };
    for (const group of groups) {
        getOmicsOverlaySettings(`enr:${group.key}`).visible = true;
    }

    renderOmicsOverlayPanel();
    await restoreOmicsOverlays();
}

// Called when all map highlights were removed elsewhere (e.g. "Clear highlights").
function onOmicsOverlaysCleared() {
    const state = getOmicsOverlayState();
    clearTimeout(state.renderTimer);
    state.renderToken++;
    state.enrichmentToken++;
    state.paused = false;
    state.influenceCreatedBy = null;
    for (const settings of Object.values(state.settings)) {
        settings.visible = false;
    }
    state.lastLayers = [];
    renderOmicsOverlayPanel();
}

function invalidateOmicsOverlayDataset(dataId) {
    const state = getOmicsOverlayState();
    dataId = String(dataId);
    delete state.cache[dataId];
    delete state.loading[dataId];
    delete state.failed[dataId];
    renderOmicsOverlayPanel();
    if (getOmicsOverlaySettings(`data:${dataId}`).visible) {
        scheduleOmicsOverlayRender(0);
    }
}

function forgetOmicsOverlayDatasets(dataIds) {
    const state = getOmicsOverlayState();
    let wasVisible = false;
    for (let dataId of dataIds) {
        dataId = String(dataId);
        const key = `data:${dataId}`;
        wasVisible = wasVisible || !!(state.settings[key] && state.settings[key].visible);
        delete state.settings[key];
        delete state.openSamples[key];
        delete state.cache[dataId];
        delete state.loading[dataId];
        delete state.failed[dataId];
    }
    renderOmicsOverlayPanel();
    if (wasVisible) {
        scheduleOmicsOverlayRender(0);
    }
}