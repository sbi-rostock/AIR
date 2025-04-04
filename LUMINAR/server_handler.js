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
        
        air_data.session_token = session_token;
        buildPLuginNavigator();
        loadAndExecuteScripts(["omics.js", "fairdom.js", "xplore.js"]);
        resetSessionWarningTimer();
        
        air_data.minerva_events.addListener("onBioEntityClick", showModulatorsOnClick);


    } catch (error) {
        console.error("Error while initializing:", error);
    }
}

buildPLuginNavigator = () => {
    air_data.container.find("#stat_spinner").remove();
            
    air_data.container.append(`
            <ul class="air_nav_tabs nav nav-tabs mt-2" id="air_navs" role="tablist" hidden>
                <li class="air_nav_item nav-item" style="width: 33.3%;">
                    <a class="air_tab nav-link" id="xplore_tab" data-bs-toggle="tab" href="#xplore_tab_content" role="tab" aria-controls="xplore_tab_content" aria-selected="false">Xplore</a>
                </li>
                <li class="air_nav_item nav-item" style="width: 33.3%;">
                    <a class="air_tab active nav-link" id="airomics_tab" data-bs-toggle="tab" href="#airomics_tab_content" role="tab" aria-controls="airomics_tab_content" aria-selected="true">Omics</a>
                </li>   
                <li class="air_nav_item nav-item" style="width: 33.3%;">
                    <a class="air_tab nav-link" id="fairdom_tab" data-bs-toggle="tab" href="#fairdom_tab_content" role="tab" aria-controls="fairdom_tab_content" aria-selected="false">FAIRDOM</a>
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
            $("#" + progressbar + "_progress_label").html('<span class="loadingspinner spinner-border spinner-border-sm me-1 mt-1"></span> ' + percentage + "% " + text);
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
        scrollY: '50vh',
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
        filteredData = data.data.filter(row => row[row.length - 1]);
    }

    const columns = data.columns.map((col, index) => {
        if (includeLinks && index === 0) {
            return {
                data: index,
                title: col,
                render: (data, type, row) => {
                    return row[row.length - 1] ? 
                        `<a href="#" class="node_map_link" data-type="${col}" data-id="${row[row.length - 1]}">${data}</a>` : 
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

function setupColumnSelector(selectId, columns, excludeColumns = [0]) {
    const $select = $(selectId);
    $select.empty();
    $select.append($("<option selected>").attr("value", -1).text("None"));
    
    columns.forEach((col, index) => {
        if (!excludeColumns.includes(index)) {
            $select.append($("<option>").attr("value", index).text(col));
        }
    });
}

// Generalized highlighting function
function highlightColumn(options) {
    const {
        selectedColumn,
        data,
        markerArray,
        includeNonMapped,
        markerPrefix = "marker_"
    } = options;

    // Clear existing markers
    for(var marker_id of markerArray) {
        minerva.data.bioEntities.removeSingleMarker(marker_id);
    }
    markerArray.length = 0;  // Clear the array while maintaining the reference

    if (selectedColumn == -1) {
        return;
    }

    var max = includeNonMapped ? data.max : data.minerva_max;
    var id_col = data.columns.length - 1;
    
    var new_markers = data.data
        .filter(row => row[selectedColumn] != 0 && row[id_col])
        .map(function(row) {
            var val = row[selectedColumn];
            var id = JSON.parse(row[id_col]);
            var marker_id = markerPrefix + id[1];
            markerArray.push(marker_id);
            return {
                type: 'surface',
                opacity: 0.67,
                x: id[4],
                y: id[5],
                width: id[3],
                height: id[2],
                modelId: id[0],
                id: marker_id,
                color: data.columns[selectedColumn].toLowerCase().endsWith('_pvalue') ? 
                    valueToHex(-Math.log10(Math.abs(val)), 5) : 
                    valueToHex(val, max)
            };
        });

    for(var marker of new_markers) {
        minerva.data.bioEntities.addSingleMarker(marker);
    }
}

// Generalized node map link handler
function setupNodeMapLinks() {
    $(document).on('click', '.node_map_link', function(e) {
        e.preventDefault();
        var minerva_id = $(this).data('id');
        var type = $(this).data('type');
        if (typeof minerva_id === 'string') {
            minerva_id = JSON.parse(minerva_id);
        }

        minerva.map.triggerSearch({ query: (type == "name"? "" : (type + ":")) + $(this).text(), perfectSearch: true});
        
        minerva.map.openMap({ id: minerva_id[0] });

        minerva.map.fitBounds({
            x1: minerva_id[4],
            y1: minerva_id[5],
            x2: minerva_id[4] + minerva_id[3],
            y2: minerva_id[5] + minerva_id[2]
        });
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
    
    // Handle each response
    for (const response of responses) {
        // Handle AI-generated content with warning
        if (response.created_by === "llm") {
            responseContainer.append(`
                <div class="alert alert-warning" role="alert">
                   The following response has been AI-generated. 
                   While the response is based specifically on the disease map content or analyzed data, inaccuracies are still possible.
                   Make sure you verify all important information using  <a href="#" class="alert-link"><span class="fixed-queries-link" style="color: blue; text-decoration: underline; cursor: pointer;">fixed response queries</span>
                   </a>
                </div>
                <div class="mt-2">
                    ${response.content}
                </div>
            `);

            // Add click handler for fixed queries link
            responseContainer.find(".fixed-queries-link").on('click', function(e) {
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
        
        // Handle different response types
        else if (response.response_type === "html") {
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
            
            responseContainer.find(".analysis-image").on('click', function(e) {
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
                id: minerva_id[0],
                x: minerva_id[1], 
                y: minerva_id[2],
                width: minerva_id[3],
                height: minerva_id[4],
                modelId: minerva_id[5],
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
                            const minervaId = row[row.length - 1];
                            return minervaId ? 
                                `<a href="#" class="node_map_link" data-type="name" data-id="${minervaId}">${data}</a>` : 
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
                    scrollY: '50vh',
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
            console.error('Failed to copy: ', err);
        });
}