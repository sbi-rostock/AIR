let minerva = null;
let air_data = window.parent.air_data

const parent$ = air_data.$;

const $ = function(selector, context) {
  return parent$(selector, context || document);
};

Object.assign($, parent$);

air_data.added_markers = {}


let sessionWarningTimeout;
const sessionWarningDuration = 105 * 60 * 1000;  // 15 minutes
const countdownDuration = 10 * 60 * 1000;  // 2 minutes


function resetSessionWarningTimer() {
    clearTimeout(sessionWarningTimeout);

    sessionWarningTimeout = setTimeout(() => {
        promptForExtension();
    }, sessionWarningDuration);
}


async function promptForExtension() {
    let expirationTimeout = setTimeout(() => {
        alert('Your session has ended.');
        window.parent.document.querySelector('button[role="reload-plugin-drawer-button"]').click();
    }, countdownDuration);

    let message = `Your session is about to expire in 2 Minutes. Do you want to extend the session?`;

    if (window.confirm(message)) {
        clearTimeout(expirationTimeout);

        data = JSON.parse(await getDataFromServer("extend_session", type = "GET"))
        
        if (data.status === 'extended') {
            resetSessionWarningTimer();
        } else {
            alert('Session already expired.');
            window.parent.document.querySelector('button[role="reload-plugin-drawer-button"]').click();
        }
    }
    else
    {
        alert('Your session has ended.');
        window.parent.document.querySelector('button[role="reload-plugin-drawer-button"]').click();
    }
}


Object.filter = (obj, predicate) =>
    Object.keys(obj)
        .filter(key => predicate(key))
        .reduce((res, key) => (res[key] = obj[key], res), {});

const AIR = {

}

const globals = {

};



function getDataFromServer(request, data = {}, type = "GET", datatype = "text", contentType = 'application/json') {
    // Only add session token if it exists and the request is not for initialization
    if (air_data.session_token && !request.includes('initialize_session')) {
        if (data instanceof FormData) {
            if (!data.has('session')) {
                data.append('session', air_data.session_token);
            }
        } else {
            data.session = air_data.session_token;
        }
    }

    // Prepare the AJAX options
    const ajaxOptions = {
        type: type,
        url: air_data.SBI_SERVER + request,
        dataType: datatype
    };

    // Handle FormData vs JSON data
    if (data instanceof FormData) {
        ajaxOptions.processData = false;
        ajaxOptions.contentType = false;
        ajaxOptions.data = data;
    } else {
        ajaxOptions.contentType = contentType;
        ajaxOptions.data = type === "GET" ? data : JSON.stringify(data);
    }

    return new Promise((resolve, reject) => {
        $.ajax(ajaxOptions)
            .done((data) => {
                try {
                    if (datatype === "json" && typeof data === "string") {
                        data = JSON.parse(data);
                    }
                    resolve(data);
                } catch (e) {
                    reject(e); // Properly reject the promise if parsing fails
                }
            })
            .fail((xhr, status, error) => {
                // Log detailed error information
                console.error("Server request failed:", {
                    endpoint: request,
                    status: xhr.status,
                    statusText: xhr.statusText,
                    responseText: xhr.responseText,
                    error: error
                });
                
                // Create an error object to reject with
                let errorObj;
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorObj = new Error(xhr.responseJSON.error);
                } else {
                    errorObj = new Error(error || xhr.statusText || "Unknown error");
                }
                
                // Add xhr properties to the error object for more context
                errorObj.status = xhr.status;
                errorObj.responseText = xhr.responseText;
                
                // Reject the promise with the error
                reject(errorObj);
            });
    });
}


async function GetProjectHash(project_data) {
    const loadingText = air_data.container.find("#air_loading_text");
    
    try {
        if (loadingText.length) {
            loadingText.text("Checking model status...");
        }
        
        let sessionData;
        try {
            sessionData = await getDataFromServer('initialize_session', project_data, "POST", "json");
        } catch (error) {
            if (!error.status || error.status === 0) {
                throw new Error("Could not contact the server. Please check your internet connection and try again.");
            } else if (error.responseJSON && error.responseJSON.error) {
                throw new Error(`Server error: ${error.responseJSON.error}`);
            } else {
                throw new Error(`Failed to initialize session: ${error.message || 'Unknown error'}`);
            }
        }

        air_data.session_token = sessionData.hash;
        
        // needs_model_init only exists to display a message to the user that it may take a few moments to initialize the model
        // intiialize_model is requested anyway
        if (sessionData.needs_model_init) {
            if (loadingText.length) {
                loadingText.text("This is the first time this project has been loaded since the last server restart... This may take a moment.");
            }
        }
            
        const response = await getDataFromServer('initialize_model', {
            session: sessionData.hash,
            project_hash: sessionData.project_hash
        }, "POST", "json");
        
        if (loadingText.length) {
            loadingText.text("LOADING ...");
        }
        air_data.example_queries_map = response.example_queries_map;
        air_data.example_queries_dea = response.example_queries_dea;
        
        return sessionData.hash;
        
    } catch (error) {
        if (loadingText.length) {
            loadingText.text("Error: " + error.message);
        }
        throw error;
    }
}

async function initialize_server() {
    try {
        minerva = window.parent.minerva;
        const session_token = await GetProjectHash([
            window.parent.location.origin,
            minerva.project.data.getProjectId(),
        ]);
        
        // Add Font Awesome
        const fontAwesomeLink = document.createElement('link');
        fontAwesomeLink.rel = 'stylesheet';
        fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
        document.head.appendChild(fontAwesomeLink);
        
        // Add Chart.js
        const chartJsScript = document.createElement('script');
        chartJsScript.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
        chartJsScript.onload = function() {
            console.log('Chart.js loaded successfully');
        };
        document.head.appendChild(chartJsScript);
        
        // Add Chart.js zoom plugin for interactive features
        const chartJsZoomScript = document.createElement('script');
        chartJsZoomScript.src = 'https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.0.1/dist/chartjs-plugin-zoom.min.js';
        chartJsZoomScript.onload = function() {
            console.log('Chart.js zoom plugin loaded successfully');
        };
        document.head.appendChild(chartJsZoomScript);
        
        // Add Chart.js annotation plugin for quadrant lines
        const chartJsAnnotationScript = document.createElement('script');
        chartJsAnnotationScript.src = 'https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.0.1/dist/chartjs-plugin-annotation.min.js';
        chartJsAnnotationScript.onload = function() {
            console.log('Chart.js annotation plugin loaded successfully');
        };
        document.head.appendChild(chartJsAnnotationScript);
        
        // Add html2pdf library for PDF export
        const html2pdfScript = document.createElement('script');
        html2pdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        html2pdfScript.onload = function() {
            console.log('html2pdf loaded successfully');
        };
        document.head.appendChild(html2pdfScript);
        
        // Add custom CSS for the expand functionality
        const customCSS = document.createElement('style');
        customCSS.textContent = `
            .air_expand_btn {
                transition: transform 0.2s ease;
                padding: 4px 8px !important;
                font-size: 16px !important;
            }
            .air_expand_btn:hover {
                transform: scale(1.1);
            }
            
            /* Expanded chatbox styles */
            .air_chat_expanded #omics_analysis_content,
            .air_chat_expanded #xplore_analysis_content,
            .air_chat_expanded #fairdom_analysis_content {
                max-width: none !important;
                width: 100% !important;
                font-size: 12px !important;
            }
            
            .air_chat_expanded .responses-wrapper {
                height: 60vh !important;
                max-height: 60vh !important;
                overflow-y: auto !important;
            }
            
            .air_chat_expanded .response-container {
                font-size: 13px !important;
            }
            
            .air_chat_expanded .table-container {
                font-size: 11px !important;
                max-width: 100% !important;
                overflow-x: auto !important;
            }
            
            /* Limit image size when expanded */
            .air_chat_expanded .analysis-image,
            .air_chat_expanded img {
                max-width: 600px !important;
                max-height: 400px !important;
                width: auto !important;
                height: auto !important;
            }
            
            /* Arrow animation */
            .air_expand_arrow {
                transition: transform 0.3s ease;
            }
            
            .air_expand_arrow.expanded {
                transform: rotate(180deg);
            }
        `;
        document.head.appendChild(customCSS);
        
        air_data.session_token = session_token;
        buildPLuginNavigator();
        loadAndExecuteScripts(["omics.js", "fairdom.js", "xplore.js"]);
        resetSessionWarningTimer();
        
        air_data.minerva_events.addListener("onBioEntityClick", showModulatorsOnClick);

        // Setup node map link handling
        setupNodeMapLinks();

    } catch (error) {
        console.error("Error while initializing:", error);
    }
}

buildPLuginNavigator = () => {
    air_data.container.find("#stat_spinner").remove();
            
    air_data.container.append(`
            <ul class="air_nav_tabs nav nav-tabs mt-2" id="air_navs" role="tablist" hidden>
                <li class="air_nav_item nav-item" style="width: 33.3%;">
                    <a class="air_tab nav-link" id="xplore_tab" data-bs-toggle="tab" href="#xplore_tab_content" role="tab" aria-controls="xplore_tab_content" aria-selected="false">Exploration</a>
                </li>
                <li class="air_nav_item nav-item" style="width: 33.3%;">
                    <a class="air_tab active nav-link" id="airomics_tab" data-bs-toggle="tab" href="#airomics_tab_content" role="tab" aria-controls="airomics_tab_content" aria-selected="true">Data Analysis</a>
                </li>   
                <li class="air_nav_item nav-item" style="width: 33.3%;">
                    <a class="air_tab nav-link" id="fairdom_tab" data-bs-toggle="tab" href="#fairdom_tab_content" role="tab" aria-controls="fairdom_tab_content" aria-selected="false">FAIRDOMHub</a>
                </li>
            </ul>
            <div class="tab-content air_tab_content" id="air_tabs" style="height:calc(100% - 45px);background-color: white;">
                <div class="tab-pane show" id="xplore_tab_content" role="tabpanel" aria-labelledby="xplore_tab">
                </div>
                <div class="tab-pane show active" id="airomics_tab_content" role="tabpanel" aria-labelledby="airomics_tab">
                </div>
                <div class="tab-pane show" id="fairdom_tab_content" role="tabpanel" aria-labelledby="fairdom_tab">
                </div>
            </div>
    `);
    air_data.container.find("#air_tabs").children(".tab-pane").addClass("air_tab_pane");
    air_data.container.find("#air_navs").removeAttr("hidden");
    air_data.container.find(".air_tab_pane").css("height", "100%") //"calc(100vh - " + 700 + "px)");
}

function xp_searchListener(entites) {
    globals.xplore.selected = entites[0];
    if (globals.xplore.selected.length > 0) {
        if (globals.xplore.selected[0].constructor.name === 'Alias') {
            var tag = globals.xplore.selected[0]._other.structuralState;
            if(tag && tag.toLowerCase() == "family")
            {
                tag = "";
            }
            xp_setSelectedElement(globals.xplore.selected[0].name+ (tag? ("_" + tag) : ""), fullname = getNameFromAlias(globals.xplore.selected[0]));            
        }
    }
}

function loadAndExecuteScripts(urls) {
    urls.forEach(url => {
      const script = document.createElement('script');
      const cacheBuster = 'v=' + new Date().getTime();
      script.src = air_data.JS_FOLDER_PATH + url + (url.indexOf('?') === -1 ? '?' : '&') + cacheBuster;
  
      script.onload = function() {

        const fileName = url.substring(url.lastIndexOf('/') + 1); 
        const funcName = fileName.replace('.js', '');
        
        if (typeof window[funcName] === 'function') {
          window[funcName]();
        } else {
          console.error(`Function "${funcName}" not found after loading ${url}`);
        }
      };
      document.head.appendChild(script);
    });
}

async function disablebutton(id, progress = false) {
    var promise = new Promise(function (resolve, reject) {
        setTimeout(() => {
            var $btn = $('#' + id);
            var btnWidth = $btn.outerWidth();
            $btn.css('width', btnWidth + 'px');
            let text = $btn.html();
            if (progress == false) {
                $btn.html('<span class="loadingspinner spinner-border spinner-border-sm"></span>');
            }
            else {
                // Remove padding when showing progress bar to prevent cutoff
                $btn.css('padding', '0');
                $btn.empty().append(`<div class="air_progress position-relative">
                    <div id= "${id}_progress" class="air_progress_value"></div>
                    <span id="${id}_progress_label" class="air_progress_label justify-content-center d-flex position-absolute w-100"><span class="loadingspinner spinner-border spinner-border-sm me-2 mt-1"></span> 0% </span>
                </div>`);
            }

            $(".air_btn").each(function (pindex) {
                var airbtn = $(this)
                airbtn.addClass("air_temp_disabledbutton");
            });
            resolve(text)
        }, 0);
    });
    return promise;
}

async function enablebutton(id, text) {
    return new Promise(resolve => {
        setTimeout(() => {

            $(".air_btn").each(function (pindex) {
                $(this).removeClass("air_temp_disabledbutton");
            });
            var $btn = $('#' + id);
            // Restore default padding
            $btn.css('padding', '');
            $btn.html(text);
            resolve('');
        }, 0);
    });
}


async function updateProgress(value, max, progressbar, text = "") {
    return new Promise(resolve => {
        let percentage = (max == 0 ? 0 : Math.ceil(value * 100 / max));
        setTimeout(function () {
            $("#" + progressbar + "_progress").width(percentage + "%");
            $("#" + progressbar + "_progress_label").html('<span style="margin-top: 2px;" class="loadingspinner spinner-border spinner-border-sm me-1"></span> ' + percentage + "% " + text);
            resolve('');
        }, 0);
    });
}


function rgbToHex(rgb) {
    var hex = Number(Math.round(rgb)).toString(16);
    if (hex.length < 2) {
        hex = "0" + hex;
    }
    return hex;
};
function valueToHex(val, max=1) {

    val = val / max;
    if (val > 1) {
        val = 1;
    }
    else if (val < -1) {
        val = -1
    }
    var hex = rgbToHex((1 - Math.abs(val)) * 255);
    if (val > 0)
        return '#ff' + hex + hex;
    else if (val < 0)
        return '#' + hex + hex + 'ff';
    else return '#ffffff';
}

// Common utility functions
function createDataTable(containerId, data, columns, options = {}) {
    const defaultOptions = {
        dom: "<'top'<'dt-length'l><'dt-search'f>>" +
             "<'clear'>" +
             "rt" +
             "<'bottom'ip><'clear'>",
        scrollY: '47vh',
        scrollX: true,
        paging: true,
        searching: true,
        destroy: true
    };

    const tableOptions = {
        ...defaultOptions,
        ...options,
        data: data,
        columns: columns.map(col => typeof col === 'string' ? {
            title: col,
            data: col
        } : col)
    };

    return $(containerId).DataTable(tableOptions);
}

function processDataForTable(data, includeLinks = false, showMappedOnly = false) {
    if (!data || !data.columns || !data.data) {
        console.error("Invalid data format");
        return null;
    }

    // Filter data if showMappedOnly is true
    let filteredData = data.data;
    if (showMappedOnly) {
        filteredData = data.data.filter(row => row[row.length - 1].length > 0);
    }

    const columns = data.columns.map((col, index) => {
        if (includeLinks && index === 0) {
            return {
                data: index,
                title: col,
                render: (data, type, row) => {
                    var minerva_ids = row[row.length - 1]; 
                    return minerva_ids.length > 0 ? 
                        `<a href="#" class="node_map_link" data-type="${col}" data-id="${JSON.stringify(minerva_ids)}">${data}</a>` : 
                        data;
                }
            };
        }
        return {
            data: index,
            title: col
        };
    });

    return {
        columns: columns.slice(0, -1),
        data: filteredData
    };
}

function setupColumnSelector(selectId, columns, excludeColumns = []) {
    const $select = $(selectId);
    $select.empty();
    $select.append($("<option selected disabled>").attr("value", -2).text("Select a column to visualize"));
    $select.append($("<option>").attr("value", -1).text("None"));
    
    columns.forEach((col, index) => {
        if (!excludeColumns.includes(col)) {
            $select.append($("<option>").attr("value", index).text(col));
        }
    });
}

// Generalized highlighting function
function highlightColumn(options) {
    // Set waiting cursor
    window.parent.document.body.style.cursor = 'wait';

    // Defer heavy processing so cursor has time to update
    setTimeout(() => {
        try {
            const {
                selectedColumn,
                data,
                markerArray,
                includeNonMapped,
                markerPrefix = "marker_",
                pvalueThreshold = null
            } = options;

            const selectedColumnInt = parseInt(selectedColumn);
            if (isNaN(selectedColumnInt)) {
                return;
            }

            // Clear existing markers
            for (var marker_id of markerArray) {
                minerva.data.bioEntities.removeSingleMarker(marker_id);
            }
            markerArray.length = 0;

            if (selectedColumn < 0) {
                return;
            }

            var max = includeNonMapped ? data.minerva_max : data.max;
            var id_col = data.columns.length - 1;

            var new_markers = data.data
                .filter(row => row[selectedColumnInt] != 0 && row[id_col])
                .flatMap(function (row) {
                    var val = row[selectedColumnInt];
                    if (val == 0 || (pvalueThreshold && row[selectedColumnInt + 1] > pvalueThreshold)) {
                        return [];
                    }
                    var minerva_ids = row[id_col];
                    return minerva_ids.map(minerva_id => {
                        var marker_id = markerPrefix + minerva_id[1];
                        markerArray.push(marker_id);
                        return {
                            type: 'surface',
                            opacity: 0.67,
                            x: minerva_id[4],
                            y: minerva_id[5],
                            width: minerva_id[3],
                            height: minerva_id[2],
                            modelId: minerva_id[0],
                            id: marker_id,
                            color: data.columns[selectedColumnInt].toLowerCase().endsWith('_pvalue') ?
                                valueToHex(-Math.log10(Math.abs(val)), 5) :
                                valueToHex(val, max)
                        };
                    });
                });

            for (var marker of new_markers) {
                minerva.data.bioEntities.addSingleMarker(marker);
            }
        } finally {
            // Reset cursor back to default
            window.parent.document.body.style.cursor = 'default';
        }
    }, 0); // Delay just enough for the browser to repaint
}


// Generalized node map link handler
function setupNodeMapLinks() {
    $(document).on('click', '.node_map_link', function(e) {
        e.preventDefault();
        var minerva_ids = $(this).data('id');
        var type = $(this).data('type');
        if (typeof minerva_ids === 'string') {
            minerva_ids = JSON.parse(minerva_ids);
        }

        minerva.map.triggerSearch({ query: (!type || type == "name"? "" : (type + ":")) + $(this).text(), perfectSearch: true});
        
        if(minerva_ids.length > 0) {
            minerva.map.openMap({ id: minerva_ids[0][0] });

            minerva.map.fitBounds({
                x1: minerva_ids[0][4],
                y1: minerva_ids[0][5],
                x2: minerva_ids[0][4] + minerva_ids[0][3],
                y2: minerva_ids[0][5] + minerva_ids[0][2]
            });
        }
    });
    $(document).on('click', '.edge_map_link', function(e) {
        e.preventDefault();
        var minerva_id = $(this).data('id');

        if (typeof minerva_id === 'string') {
            minerva_id = JSON.parse(minerva_id);    
        }

        if(minerva_id.length > 0) {
            minerva.map.openMap({ id: minerva_id[0][0] });
            minerva.map.setCenter({ x: minerva_id[0][1]+(minerva_id[0][3]-minerva_id[0][1])/2, y: minerva_id[0][2]+(minerva_id[0][4]-minerva_id[0][2])/2, z: 5})
            
            var markers = minerva_id.map(line => ({
                modelId: line[0],
                start: {
                  x: line[1],
                  y: line[2],
                },
                end: {
                  x: line[3],
                  y: line[4],
                },
            }));
            highlightEdges(markers, created_by = now());
        }
    });
    
    // Global click handler for fixed queries links
    $(document).on('click', '.fixed-queries-link', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const origin = $(this).data('origin');
        
        // Remove any existing modals
        $("#air_Modal", window.parent.document).remove();
        
        // Remove any existing event handlers to prevent memory leaks
        $(window.parent.document).off('click', '#air_closeModal');
        
        const modalHTML = `
            <div id="air_Modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                 background: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center; z-index: 99999;">
                <div style="position: relative; background: #fff; padding: 20px; border-radius: 8px;
                     max-width: 90%; max-height: 90%; overflow: auto;">
                    <button id="air_closeModal" style="position: absolute; top: 10px; right: 10px;
                         background: transparent; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                    ${getFixedQueries(origin)}
                </div>
            </div>
        `;
        
        // Append to window.parent.document.body instead of document.body
        $(window.parent.document.body).append(modalHTML);
        
        // Use window.parent.document for event binding with namespaced event to avoid duplicates
        $(window.parent.document).on('click.modalClose', '#air_closeModal', function() {
            $('#air_Modal', window.parent.document).remove();
            // Clean up event handler
            $(window.parent.document).off('click.modalClose');
        });
    });
}

const showModulatorsOnClick = async data => {

    if(data.type == "ALIAS") {
        const response = await getDataFromServer(
            'get_modulators', {
            id: data.id,
            modelId: data.modelId
        }, "POST", "json");

        if(response.ok && response.data.length > 0) {
            highlightValues(response.data, now(), true);
        }
    }
};

function removeHighlight(created_by = "") {
    for(var [_created_by, marker_ids] of Object.entries(air_data.added_markers)) {
        if(_created_by != created_by || created_by == "") {
            for(var marker_id of marker_ids) {
                minerva.data.bioEntities.removeSingleMarker(marker_id);
            }
            delete air_data.added_markers[_created_by];
        }
    }
}

function highlightValues(data, created_by = "", remove = true) {

    // Clear existing markers
    if(remove) {
        removeHighlight(created_by);
    }

    air_data.added_markers[created_by] = air_data.added_markers[created_by] || [];

    var new_markers = data.map(function(entity) {
        // Convert single value to array if needed
        const values = Array.isArray(entity.value) ? entity.value : [entity.value];
        
        // Calculate width of each slice
        const sliceWidth = entity.width / values.length;
        
        // Create markers for each value
        return values.map((value, index) => {
            const marker_id = "marker_value_" + entity.id + "_" + index;
            air_data.added_markers[created_by].push(marker_id);
            return {
                type: 'surface',
                opacity: 0.67,
                x: entity.x + (index * sliceWidth), // Offset x by slice position
                y: entity.y,
                width: sliceWidth,
                height: entity.height,
                modelId: entity.modelId,
                id: marker_id,
                color: valueToHex(value)
            };
        });
    }).flat(); // Flatten array of arrays into single array

    for(var marker of new_markers) {
        minerva.data.bioEntities.addSingleMarker(marker);
    }
}

function highlightEdges(data, created_by = "", remove = true) {
    if(remove) {
        removeHighlight(created_by);
    }
    
    air_data.added_markers[created_by] = air_data.added_markers[created_by] || [];

    var new_markers = data.map(function(entity, index) {

        const marker_id = "marker_edge_" + created_by + "_" + index;

        air_data.added_markers[created_by].push(marker_id);
        return {
            type: 'line',
            color: '#106AD7',
            opacity: 1,
            start: {
                x: entity.start.x,
                y: entity.start.y,
              },
              end: {
                x: entity.end.x,
                y: entity.end.y,
              },
            modelId: entity.modelId,
        };
    });

    for(var marker of new_markers) {
        minerva.data.bioEntities.addSingleMarker(marker);
    }
}

function highlightPins(data, created_by = "", remove = true) {
    if(remove) {
        removeHighlight(created_by);
    }
        
    air_data.added_markers[created_by] = air_data.added_markers[created_by] || [];

    var new_markers = data.map(function(entity, index) {

        const marker_id = "marker_pin_" + created_by + "_" + index;

        air_data.added_markers[created_by].push(marker_id);
        return {
            type: 'pin',
            color: '#106AD7',
            opacity: 1,
            x: entity.x,
            y: entity.y,
            number: entity.number,
            modelId: entity.modelId,
        };
    });

    for(var marker of new_markers) {
        minerva.data.bioEntities.addSingleMarker(marker);
    }
}


function getDTExportString(dt, seperator = "\t") {
    let output = [];


    dt.rows().every(function (rowIdx, tableLoop, rowLoop) {
        output.push(this.data().map(function (cell) {
            return extractContent(cell);
        }));
    });

    let columnstodelete = [];

    if (output.length > 1) {
        let index_hasValue = {}
        for (let i in output[0]) {
            index_hasValue[i] = false;
        }
        for (let row of output) {
            for (let i in row) {
                if (row[i] != "") {
                    index_hasValue[i] = true;
                }
            }
        }

        columnstodelete = Object.keys(index_hasValue).filter(key => index_hasValue[key] === false)
    }


    output.unshift([]);
    dt.columns().every(function () {
        output[0].push(this.header().textContent)
    })

    output = output.map(row => {

        let newarray = []
        for (let i in row) {
            if (!columnstodelete.includes(i)) {
                newarray.push(row[i]);
            }
        }
        return newarray
    });

    return output.map(e => e.join(seperator)).join("\n");
}

function download_data(filename, data) {

    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}


function getFixedQueries(origin) {
    var queries = origin == "omics" ? air_data.example_queries_dea : air_data.example_queries_map;

    var response = `
        <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; max-width: 400px;">
            <p style="font-weight: bold; margin-bottom: 10px;">
                Queries in the following styles call functions on the server that return fixed responses and are thus not subject to AI-generated inaccuracies:
            </p>`;
    
    for(var [key, query] of Object.entries(queries)) {
        response += `<div style="margin-bottom: 8px;">
            <i>'${query.example_query}'</i>: ${query.ui_description}
        </div>`;
    }

    response += `</div>`;
    return response;
}

function now() {
    return new Date().toISOString().replace(/[^0-9]/g, '')
}

// Function to download Chart.js chart as high-resolution PNG
function downloadChartAsPNG(chart, title = 'Chart') {
    try {
        if (!chart || typeof chart.toBase64Image !== 'function') {
            alert('Chart is not available for download.');
            return;
        }
        
        // Get the chart as high-resolution base64 image
        const base64Image = chart.toBase64Image('image/png'); // 2x resolution for high quality
        
        // Create download link
        const link = document.createElement('a');
        link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.png`;
        link.href = base64Image;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log(`Chart "${title}" downloaded as PNG`);
        
    } catch (error) {
        console.error('Error downloading chart:', error);
        alert('Error downloading chart: ' + error.message);
    }
}

// Function to expand chat interface by expanding the parent drawer width
function expandChatInterface(origin) {
    const parentDrawer = window.parent.document.querySelector('[role="plugins-drawer"]');
    const expandBtn = $(`#${origin}_btn_expand_chat`);
    const arrow = expandBtn.find('.air_expand_arrow');
    
    if (!parentDrawer) {
        console.warn('Parent drawer not found');
        return;
    }
    
    if (parentDrawer.classList.contains('air_chat_expanded')) {
        // Collapse - return to normal width
        parentDrawer.style.width = '432px';
        parentDrawer.classList.remove('air_chat_expanded');
        arrow.removeClass('expanded');
        
        // Remove expanded class from iframe content
        $('body').removeClass('air_chat_expanded');
    } else {
        // Expand - increase width
        parentDrawer.style.width = '80vw';
        parentDrawer.style.maxWidth = '1200px';
        parentDrawer.classList.add('air_chat_expanded');
        arrow.addClass('expanded');
        
        // Add expanded class to iframe content
        $('body').addClass('air_chat_expanded');
    }
}

// Simple function - no separate collapse needed
function collapseChatInterface(origin) {
    // Just call expand again to toggle
    expandChatInterface(origin);
}

// Function to download chat content as PDF
async function downloadChatAsPDF(origin) {
    const moduleNames = {
        'omics': 'Data Analysis',
        'xplore': 'Map Exploration',
        'fairdom': 'FAIRDOMHub'
    };
    const moduleTitle = moduleNames[origin] || 'Chat';
    
    // Get the chat content element directly
    const chatContent = document.getElementById(`${origin}_analysis_content`);
    
    if (!chatContent) {
        alert('Chat content container not found.');
        return;
    }
    
    // Check if there's any content
    if (!chatContent.innerHTML.trim() || chatContent.textContent.trim().length < 10) {
        alert('No chat content to export. Please have some conversation first.');
        return;
    }
    
    // Check if html2pdf is available
    if (typeof window.html2pdf === 'undefined') {
        alert('PDF export library is still loading. Please try again in a moment.');
        return;
    }
    
    console.log('Starting PDF generation for:', moduleTitle);
    console.log('Content length:', chatContent.innerHTML.length);
    
    // Store original styles to restore later
    const originalStyles = {
        height: chatContent.style.height,
        maxHeight: chatContent.style.maxHeight,
        overflow: chatContent.style.overflow,
        overflowY: chatContent.style.overflowY
    };
    
    // Also store styles for responses wrapper if it exists
    const responsesWrapper = chatContent.querySelector('.responses-wrapper');
    const responsesOriginalStyles = responsesWrapper ? {
        height: responsesWrapper.style.height,
        maxHeight: responsesWrapper.style.maxHeight,
        overflow: responsesWrapper.style.overflow,
        overflowY: responsesWrapper.style.overflowY
    } : null;
    
    try {
        // Temporarily remove height/scroll constraints to show all content
        chatContent.style.height = 'auto';
        chatContent.style.maxHeight = 'none';
        chatContent.style.overflow = 'visible';
        chatContent.style.overflowY = 'visible';
        
        // Do the same for responses wrapper
        if (responsesWrapper) {
            responsesWrapper.style.height = 'auto';
            responsesWrapper.style.maxHeight = 'none';
            responsesWrapper.style.overflow = 'visible';
            responsesWrapper.style.overflowY = 'visible';
        }
        
        // Give the DOM a moment to adjust
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Configure PDF options
        const opt = {
            margin: 15,
            filename: `${moduleTitle.replace(/\s+/g, '_')}_Chat_Export_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.9 },
            html2canvas: { 
                scale: 1.5,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                height: chatContent.scrollHeight, // Use full scroll height
                windowHeight: chatContent.scrollHeight // Ensure full content is captured
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait'
            }
        };
        
        console.log('Generating PDF with full content visible...');
        console.log('Content scroll height:', chatContent.scrollHeight);
        
        // Generate PDF directly from the expanded element
        await window.html2pdf().set(opt).from(chatContent).save();
        
        console.log('PDF generated successfully');
        
    } catch (error) {
        console.error('PDF generation error:', error);
        alert('Error generating PDF: ' + error.message);
    } finally {
        // Restore original styles
        chatContent.style.height = originalStyles.height || '';
        chatContent.style.maxHeight = originalStyles.maxHeight || '';
        chatContent.style.overflow = originalStyles.overflow || '';
        chatContent.style.overflowY = originalStyles.overflowY || '';
        
        // Restore responses wrapper styles
        if (responsesWrapper && responsesOriginalStyles) {
            responsesWrapper.style.height = responsesOriginalStyles.height || '';
            responsesWrapper.style.maxHeight = responsesOriginalStyles.maxHeight || '';
            responsesWrapper.style.overflow = responsesOriginalStyles.overflow || '';
            responsesWrapper.style.overflowY = responsesOriginalStyles.overflowY || '';
        }
        
        console.log('Original styles restored');
    }
}

// Generalized function to process server responses
function processServerResponses(response, origin, queryText = "", filePrefix = "Export") {
    var containerId = "#" + origin + "_analysis_content";
    
    // Check if we need to initialize the container
    if ($(containerId).find('.responses-wrapper').length === 0) {
        // First time - create the scrollable container
        $(containerId).html(`
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <button id="${origin}_clear_btn" class="btn btn-sm btn-outline-danger">Clear History</button>
                </div>
            </div>
            <div class="responses-wrapper" style="height:500px; overflow-y:scroll, border: 1px solid #dee2e6; border-radius: 4px;"></div>
        `);
        
        // Add clear history button handler
        $(`#${origin}_clear_btn`).on('click', function() {
            $(containerId).find('.responses-wrapper').empty();
        });
    }

    // Get the responses wrapper after ensuring it exists
    const responsesWrapper = $(containerId).find('.responses-wrapper');
    
    // Create a container for the current response with timestamp
    const timestamp = new Date().toLocaleTimeString();
    
    // Create the response container
    const responseContainer = $(`<div class="response-container mt-3 p-3 border-bottom"></div>`);
    
    // Append the new response to the container (newest at bottom)
    responsesWrapper.append(responseContainer);

    // Add query text if provided
    if (queryText) {
        const queryHeader = $(`
            <div class="query-header mb-3 p-2 bg-light rounded">
                <div class="d-flex align-items-center">
                    <span class="badge bg-primary me-2">Query</span>
                    <div class="query-text">${queryText}</div>
                </div>
            </div>
        `);
        responseContainer.append(queryHeader);
    }
    
    const responseHeader = $(`<div class="response-header mb-2"><small class="text-muted">${timestamp}</small></div>`);
    responseContainer.append(responseHeader);
    
    // Convert response to array if not already
    const responses = Array.isArray(response) ? response : [response];

    var created_by = now();
    
    for(const response of responses) {
        if (response.created_by === "llm") {
            responseContainer.append(`
                <div class="alert alert-warning" role="alert">
                   The following response includes AI-generated text. While the response is based specifically on the disease map content or analyzed data, AI hallucinations are possible.
                   However, all figures and tables generate deterministic results, which can explicitly be retrieved using the following <a href="#" class="alert-link"><span class="fixed-queries-link" data-origin="${origin}" style="color: blue; text-decoration: underline; cursor: pointer;">query examples</span>
                   </a>.
                </div>  
            `);
            break;
        }   
    }

    for (const response of responses) {

        if (response.response_type === "html") {
            // For HTML responses
            responseContainer.append(response.content);
        }
        
        else if (response.response_type === "image") {
            // For image responses
            const imgContainer = $(`
                <div class="text-center">
                    <img src="data:image/png;base64,${response.content}" 
                         class="img-fluid analysis-image" 
                         style="width: 100%; cursor: pointer;" 
                         alt="Analysis Result">
                    <p class="mt-2 text-muted small">Click on the image to expand</p>
                </div>
            `);
            responseContainer.append(imgContainer);
            
            imgContainer.find(".analysis-image").on('click', function(e) {
                // Prevent event from bubbling up to parent document
                e.preventDefault();
                e.stopPropagation();
                // Remove any existing modals
                $("#air_Modal", window.parent.document).remove();
                
                // Remove any existing event handlers to prevent memory leaks
                $(window.parent.document).off('click', '#air_closeModal');
                
                const modalHTML = `
                  <div id="air_Modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                       background: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center; z-index: 99999;">
                    <div style="position: relative; background: #fff; padding: 20px; border-radius: 8px;
                         max-width: 90%; max-height: 90%; overflow: auto;">
                      <button id="air_closeModal" style="position: absolute; top: 10px; right: 10px;
                           background: transparent; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                      <img src="data:image/png;base64,${response.content}" style="max-width: 100%; max-height: 100%;" alt="Analysis Result">
                    </div>
                  </div>
                `;
              
                // Append to window.parent.document.body instead of document.body
                $(window.parent.document.body).append(modalHTML);
              
                // Use window.parent.document for event binding with namespaced event to avoid duplicates
                $(window.parent.document).on('click.modalClose', '#air_closeModal', function() {
                  $('#air_Modal', window.parent.document).remove();
                  // Clean up event handler
                  $(window.parent.document).off('click.modalClose');
                });
            });
        }

        else if (response.response_type === "highlight") {
            var markers = response.content.map(minerva_id => ({
                modelId: minerva_id[0],
                id: minerva_id[1],
                height: minerva_id[2],
                width: minerva_id[3],
                x: minerva_id[4], 
                y: minerva_id[5],
                value: minerva_id[6]
            }));
            highlightValues(markers, created_by = created_by);
            responseContainer.append(`<div class="alert alert-info">Highlighted ${markers.length} elements on the map</div>`);
        }

        else if (response.response_type === "open_map") {
            minerva.map.openMap({ id: response.content });
            responseContainer.append(`<div class="alert alert-info">Opened map with ID: ${response.content}</div>`);
        }

        else if (response.response_type === "highlight_edge") {
            var markers = response.content.map(minerva_id => ({
                modelId: minerva_id[0],
                start: {
                  x: minerva_id[1],
                  y: minerva_id[2],
                },
                end: {
                  x: minerva_id[3],
                  y: minerva_id[4],
                },
            }));
            highlightEdges(markers, created_by = created_by);
            responseContainer.append(`<div class="alert alert-info">Highlighted ${markers.length} edges on the map</div>`);
        }

        else if (response.response_type === "highlight_pin") {
            var markers = response.content.map(minerva_id => ({
                modelId: minerva_id[0],
                x: minerva_id[1],
                y: minerva_id[2],
                number: minerva_id[3],
            }));
            highlightPins(markers, created_by = created_by);
            responseContainer.append(`<div class="alert alert-info">Added ${markers.length} pins to the map</div>`);
        }

        else if (response.response_type === "alert") {
            responseContainer.append(`
                <div class="alert alert-warning" role="alert">
                    ${response.content}
                </div>
            `);
        }

        else if (response.response_type === "call_string") {
            // For call string responses - displays content with a copy button for reproducibility
            const callStringId = `call_string_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; // Unique ID
            
            const callStringHtml = $(`
                <div class="call-string-container mt-3 p-3 border rounded" style="background-color: #f8f9fa;">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                                                 <div class="fw-bold text-muted small">Query to reproduce this result:</div>
                        <button class="btn btn-sm btn-outline-secondary copy-call-btn" 
                                data-content="${response.content.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}" 
                                title="Copy to clipboard">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                    <div class="call-string-content">
                        <code style="background-color: white; padding: 8px; border-radius: 4px; display: block; white-space: pre-wrap; word-break: break-all;">${response.content}</code>
                    </div>
                </div>
            `);
            
            responseContainer.append(callStringHtml);
            
            // Add click handler for copy button
            callStringHtml.find('.copy-call-btn').on('click', function() {
                const content = $(this).data('content');
                copyContent(content);
                
                // Visual feedback
                const originalText = $(this).html();
                $(this).html('<i class="fas fa-check"></i> Copied!');
                $(this).addClass('btn-success').removeClass('btn-outline-secondary');
                
                setTimeout(() => {
                    $(this).html(originalText);
                    $(this).removeClass('btn-success').addClass('btn-outline-secondary');
                }, 2000);
            });
        }

        else if (response.response_type === "table") {
            // For table responses
            const tableContent = response.content;
            const tableId = `${origin}_table_${Date.now()}`; // Unique ID for each table
            
            // Debug logging
            console.log('Table Content:', tableContent);
            
            // Create a container for the table
            const tableHtml = $(`
                <div class="mt-3">
                    <div class="table-container" style="width: 100%; overflow-x: auto; font-size: 12px; background-color: white; padding: 10px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <table id="${tableId}" class="display" width="100%" style="margin-bottom: 0;"></table>
                    </div>
                </div>
            `);
            
            responseContainer.append(tableHtml);
            
            // Define columns before DataTable initialization
            const columns = tableContent.columns.map((col, index) => {
                if (index === 0) {
                    return {
                        data: index,
                        title: col,
                        render: (data, type, row) => {
                            const minervaIds = row[row.length - 1];
                            return minervaIds.length > 0 ? 
                                `<a href="#" class="node_map_link" data-type="name" data-id="${JSON.stringify(minervaIds)}">${data}</a>` : 
                                data;
                        }
                    };
                }
                return {
                    data: index,
                    title: col
                };
            });

            // Initialize DataTable with the defined columns
            try {
                const table = $(`#${tableId}`).DataTable({
                    data: tableContent.data,
                    columns: columns.slice(0, -1),
                    dom: "<'top'<'dt-length'l><'dt-search'f>>" +
                    "<'clear'>" +
                    "rt" +
                    "<'bottom'ip><'clear'>",
                    scrollY: '47vh',
                    scrollX: true,
                    paging: true,
                    searching: true,
                    destroy: false,
                    initComplete: function(settings, json) {
                        console.log('DataTable initialized:', {
                            tableId: tableId,
                            rowCount: this.api().rows().count(),
                            columnCount: this.api().columns().count()
                        });
                    },
                    "buttons": [
                        {
                            text: 'Copy',
                            className: 'air_dt_btn',
                            action: function () {
                                copyContent(getDTExportString(table));
                            }
                        },
                        {
                            text: 'CSV',
                            className: 'air_dt_btn',
                            action: function () {
                                download_data(`${filePrefix}_results.csv`, getDTExportString(table, seperator = ","))
                            }
                        },
                        {
                            text: 'TSV',
                            className: 'air_dt_btn',
                            action: function () {
                                download_data(`${filePrefix}_results.txt`, getDTExportString(table))
                            }
                        }
                    ],
                });
                
                // Add export buttons
                const exportButtons = $(`
                    <div class="mt-2 mb-2">
                        <button class="btn btn-sm btn-outline-secondary copy-btn mr-2">Copy</button>
                        <button class="btn btn-sm btn-outline-secondary csv-btn mr-2">CSV</button>
                        <button class="btn btn-sm btn-outline-secondary tsv-btn">TSV</button>
                    </div>
                `);
                
                tableHtml.append(exportButtons);
                
                exportButtons.find('.copy-btn').on('click', function() {
                    copyContent(getDTExportString(table));
                });
                
                exportButtons.find('.csv-btn').on('click', function() {
                    download_data(`${filePrefix}_results.csv`, getDTExportString(table, seperator = ","));
                });
                
                exportButtons.find('.tsv-btn').on('click', function() {
                    download_data(`${filePrefix}_results.txt`, getDTExportString(table));
                });
            } catch (error) {
                console.error('Error initializing DataTable:', error);
            }
        }

        else if (response.response_type === "chart") {
            // For interactive chart responses
            const chartData = response.content;
            const chartId = `${origin}_chart_${Date.now()}`; // Unique ID for each chart
            
            console.log('Chart Data:', chartData);
            
            // Create a container for the chart
            const chartHtml = $(`
                <div class="mt-3">
                    <div class="chart-container" style="width: 100%; height: 250px; background-color: white; padding: 15px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <canvas id="${chartId}" style="width: 100%; height: 100%;"></canvas>
                    </div>                
                </div>
            `);
            
            responseContainer.append(chartHtml);
            
            // Add HTML title if provided (supports clickable content)
            if (chartData.title) {
                const titleHtml = $(`
                    <div class="text-center mt-4" style="font-weight: bold; font-size: 1.3em; color: #333;">
                        ${chartData.title}
                    </div>
                `);
                chartHtml.prepend(titleHtml);
            }

            const downloadButton = $(`                    <div class="d-flex justify-content-end mb-2">
                        <button type="button" class="btn btn-sm btn-outline-secondary chart-download-btn" data-chart-id="${chartId}" title="Download chart as PNG">
                            <i class="fas fa-download"></i> PNG
                        </button>
                    </div>
                `);
            
            // Add legend if provided
            if (chartData.legend && chartData.legend.length > 0) {
                const legendHtml = $(`
                    <div class="d-flex justify-content-center flex-wrap mt-2">
                        ${chartData.legend.map(item => `
                            <div class="d-flex align-items-center mx-2 mb-1">
                                ${item.style === 'triangle' ? 
                                    `<span class="triangle_small me-1"></span>` : 
                                    `<span style="display: inline-block; width: 12px; height: 12px; background-color: ${item.color}; margin-right: 5px; border-radius: ${item.style === 'circle' ? '50%' : '0'};"></span>`
                                }
                                <span style="color: #6d6d6d; font-size: 90%; white-space: nowrap;">${item.label}</span>
                            </div>
                        `).join('')}
                    </div>
                `);
                downloadButton.prepend(legendHtml);
            }
            
            chartHtml.append(downloadButton);
            
            try {
                // Process data points
                const datasets = chartData.data.map((point, index) => ({
                    label: point.label || `Point ${index}`,
                    data: [{
                        x: point.x,
                        y: point.y,
                        r: point.size || 5
                    }],
                    pointStyle: point.style || 'circle',
                    backgroundColor: point.color || '#3498db',
                    hoverBackgroundColor: point.hoverColor || point.color || '#2980b9',
                    borderColor: point.borderColor || 'transparent',
                    borderWidth: point.borderWidth || 0
                }));
                
                // Chart configuration with defaults and overrides
                const chartConfig = {
                    type: chartData.chart_type || 'bubble',
                    data: { datasets: datasets },
                    options: {
                        devicePixelRatio: 4,
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false // We use custom legend
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const pointData = chartData.data[context.datasetIndex];
                                        if (pointData.tooltip) {
                                            if (typeof pointData.tooltip === 'string') {
                                                return pointData.tooltip;
                                            } else if (Array.isArray(pointData.tooltip)) {
                                                return pointData.tooltip;
                                            }
                                        }
                                        return `${pointData.label || 'Point'}: (${context.parsed.x}, ${context.parsed.y})`;
                                    }
                                }
                            },
                            // Add annotation plugin for quadrant lines
                            annotation: {
                                annotations: {
                                    verticalLine: {
                                        type: 'line',
                                        xMin: 0,
                                        xMax: 0,
                                        borderColor: 'rgba(0, 0, 0, 0.6)',
                                        borderWidth: 2,
                                        borderDash: [],
                                        label: {
                                            display: false
                                        }
                                    },
                                    horizontalLine: {
                                        type: 'line',
                                        yMin: 0,
                                        yMax: 0,
                                        borderColor: 'rgba(0, 0, 0, 0.6)',
                                        borderWidth: 2,
                                        borderDash: [],
                                        label: {
                                            display: false
                                        }
                                    }
                                }
                            },
                            // Add zoom plugin if enabled
                            ...(chartData.enable_zoom !== false && {
                                zoom: {
                                    pan: {
                                        enabled: true,
                                        mode: 'xy',
                                        speed: 20,
                                        threshold: 10
                                    },
                                    zoom: {
                                        wheel: { enabled: true },
                                        pinch: { enabled: true },
                                        mode: 'xy'
                                    }
                                }
                            })
                        },
                        onHover: (event, chartElement) => {
                            event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
                        },
                        onClick: (event, chartElement) => {
                            if (chartElement[0]) {
                                const pointData = chartData.data[chartElement[0].datasetIndex];
                                
                                // Handle click actions
                                if (pointData.click_action) {
                                    if (pointData.click_action.type === 'highlight_map' && pointData.click_action.minerva_ids) {
                                        // Highlight on map
                                        if (pointData.click_action.minerva_ids.length > 0) {
                                            const markers = pointData.click_action.minerva_ids.map(id => ({
                                                modelId: id[0],
                                                id: id[1],
                                                height: id[2],
                                                width: id[3],
                                                x: id[4], 
                                                y: id[5],
                                                value: pointData.y
                                            }));
                                            minerva.map.openMap({ id: markers[0].modelId });
                                            minerva.map.fitBounds({
                                                x1: markers[0].x,
                                                y1: markers[0].y,
                                                x2: markers[0].x + markers[0].width,
                                                y2: markers[0].y + markers[0].height
                                            });
                                            minerva.map.triggerSearch({ 
                                                query: pointData.label, 
                                                perfectSearch: true 
                                            });
                                            // highlightValues(markers, created_by);
                                        }
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                title: {
                                    display: !!(chartData.x_label),
                                    text: chartData.x_label || 'X Axis',
                                    font: {
                                        size: 10,
                                    },
                                },
                                min: chartData.x_min,
                                max: chartData.x_max,
                                grid: {
                                    drawBorder: false,
                                    color: function(context) {
                                        return context.tick.value === 0 ? '#000000' : '#D3D3D3';
                                    }
                                }
                            },
                            y: {
                                title: {
                                    display: !!(chartData.y_label),
                                    text: chartData.y_label || 'Y Axis',
                                    font: {
                                        size: 10,
                                    },
                                },
                                min: chartData.y_min,
                                max: chartData.y_max,
                                grid: {
                                    drawBorder: false,
                                    color: function(context) {
                                        return context.tick.value === 0 ? '#000000' : '#D3D3D3';
                                    }
                                }
                            }
                        },
                        // Override with any custom options provided
                        ...(chartData.chart_options || {})
                    }
                };
                
                // Initialize the chart
                const chart = new Chart(document.getElementById(chartId), chartConfig);
                
                // Store chart reference for potential future use
                responseContainer.data('chart', chart);
                
                // Add download button click handler
                chartHtml.find('.chart-download-btn').on('click', function() {
                    downloadChartAsPNG(chart, chartData.title || 'Chart');
                });
                
            } catch (error) {
                console.error('Error initializing Chart:', error);
                responseContainer.append(`<div class="alert alert-danger">Error creating chart: ${error.message}</div>`);
            }
        }
        else {
            // For any other type, display as text
            responseContainer.append(`<pre>${response.content || response.response}</pre>`);
        }
    }
    
    // Scroll to the bottom to show the new response
    responsesWrapper.scrollTop(responsesWrapper[0].scrollHeight);
    
    return true;
}

// Function to copy content to clipboard
function copyContent(content) {
    // Use modern Clipboard API
    navigator.clipboard.writeText(content)
        .then(() => {
            console.log('Content copied to clipboard');
        })
        .catch(err => {
            console.error(' Failed to copy: ', err);
        });
}