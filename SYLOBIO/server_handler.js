let minerva = null;
let air_data = window.parent.air_data
const parent$ = air_data.$;

const $ = function(selector, context) {
  return parent$(selector, context || document);
};

Object.assign($, parent$);

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
        dataType: datatype,
        success: function (data) {
            return data;
        },
        error: function (xhr, status, error) {
            // Log detailed error information
            console.error("Server request failed:", {
                endpoint: request,
                status: xhr.status,
                statusText: xhr.statusText,
                responseText: xhr.responseText,
                error: error
            });
            
            // If there's a JSON response with error details, throw that
            if (xhr.responseJSON && xhr.responseJSON.error) {
                throw new Error(xhr.responseJSON.error);
            }
            // Otherwise throw the general error
            throw new Error(error || xhr.statusText);
        }
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
            .done(resolve)
            .fail(reject);
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
                loadingText.text("This is the first time the project is loaded since the last server restart... This may take a moment.");
            }
        }
            
        await getDataFromServer('initialize_model', {
            session: sessionData.hash,
            project_hash: sessionData.project_hash
        }, "POST", "json");
        
        if (loadingText.length) {
            loadingText.text("LOADING ...");
        }
        
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
        
        air_data.session_token = session_token;
        buildPLuginNavigator();
        loadAndExecuteScripts(["omics.js", "fairdom.js"]);
        resetSessionWarningTimer();
    } catch (error) {
        console.error("Error while initializing:", error);
    }
}

buildPLuginNavigator = () => {
    air_data.container.find("#stat_spinner").remove();
            
    air_data.container.append(`
            <ul class="air_nav_tabs nav nav-tabs mt-2" id="air_navs" role="tablist" hidden>
                <li class="air_nav_item nav-item" style="width: 50%;">
                    <a class="air_tab active nav-link" id="airomics_tab" data-bs-toggle="tab" href="#airomics_tab_content" role="tab" aria-controls="airomics_tab_content" aria-selected="true">Omics</a>
                </li>   
                <li class="air_nav_item nav-item" style="width: 50%;">
                    <a class="air_tab nav-link" id="fairdom_tab" data-bs-toggle="tab" href="#fairdom_tab_content" role="tab" aria-controls="fairdom_tab_content" aria-selected="true">FAIRDOM</a>
                </li>             
            </ul>
            <div class="tab-content air_tab_content" id="air_tabs" style="height:calc(100% - 45px);background-color: white;">
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
            var $btn = $(id);
            var btnWidth = $btn.outerWidth();
            $btn.css('width', btnWidth + 'px');

            let originalContent = $btn.html();
            
            if (!progress) {
                $btn.html('<span class="loadingspinner spinner-border spinner-border-sm"></span>');
            } else {
                $btn.empty().append(`
                    <div class="air_progress position-relative mb-4">
                        <div id="${id}_progress" class="air_progress_value"></div>
                        <span id="${id}_progress_label" class="air_progress_label justify-content-center d-flex position-absolute w-100">0 %</span>
                    </div>
                `);
            }

            $(".air_btn").each(function () {
                $(this).addClass("air_temp_disabledbutton");
            });
            resolve(originalContent);
        }, 0);
    });
    return promise;
}

async function enablebutton(id, originalContent) {
    return new Promise(resolve => {
        setTimeout(() => {
            $(".air_btn").each(function () {
                $(this).removeClass("air_temp_disabledbutton");
            });
            var $btn = $(id);
            $btn.html(originalContent);
            $btn.css('width', '');
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

function processDataForTable(data, includeLinks = false) {
    if (!data || !data.columns || !data.data) {
        console.error("Invalid data format");
        return null;
    }

    const columns = data.columns.map((col, index) => {
        if (includeLinks && col === "index") {
            return {
                data: index,
                title: col,
                render: (data, type, row) => {
                    return row[row.length - 1] ? 
                        `<a href="#" class="node_map_link" data-id="${row[row.length - 1]}">${data}</a>` : 
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
        columns: columns.slice(0, -1), // Remove last column (usually metadata)
        data: data.data
    };
}

function setupColumnSelector(selectId, columns, excludeColumns = ["index"]) {
    const $select = $(selectId);
    $select.empty();
    $select.append($("<option selected>").attr("value", -1).text("None"));
    
    columns.forEach((col, index) => {
        if (!excludeColumns.includes(col)) {
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

        minerva.map.triggerSearch({ query: $(this).text(), perfectSearch: true});
        
        minerva.map.openMap({ id: minerva_id[0] });

        minerva.map.fitBounds({
            x1: minerva_id[4],
            y1: minerva_id[5],
            x2: minerva_id[4] + minerva_id[3],
            y2: minerva_id[5] + minerva_id[2]
        });
    });
}