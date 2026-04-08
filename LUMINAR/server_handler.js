let minerva = null;
let air_data = window.parent.air_data

const parent$ = air_data.$;

const $ = function(selector, context) {
  return parent$(selector, context || document);
};

Object.assign($, parent$);

air_data.added_markers = {}
air_data.example_data_omics = {
    "url": "https://raw.githubusercontent.com/sbi-rostock/AIR/refs/heads/master/LUMINAR/example%20data/GSE131032_Czarnewski_2019.txt",
    "name": "GSE131032_Czarnewski_2019.txt",
}


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
        window.top.location.reload()
    }, countdownDuration);

    let message = `Your session is about to expire in 2 Minutes. Do you want to extend the session?`;

    if (window.confirm(message)) {
        clearTimeout(expirationTimeout);

        data = JSON.parse(await getDataFromServer("extend_session", type = "GET"))
        
        if (data.status === 'extended') {
            resetSessionWarningTimer();
        } else {
            alert('Session already expired.');
            window.top.location.reload()
        }
    }
    else
    {
        alert('Your session has ended.');
        window.top.location.reload()
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


function getDataFromServer(request, data = {}, type = "GET", datatype = "text", contentType = "application/json") {
  if (air_data.session_token && !request.includes("initialize_session")) {
    if (data instanceof FormData) {
      if (!data.has("session")) data.append("session", air_data.session_token);
    } else {
      data.session = air_data.session_token;
    }
  }

  const ajaxOptions = {
    type,
    url: air_data.SBI_SERVER + request,
    dataType: datatype,

    // 👇 Add a generous client-side timeout (e.g., 5 minutes)
    timeout: 300000
  };

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
      .done((resp) => {
        try {
          if (datatype === "json" && typeof resp === "string") resp = JSON.parse(resp);
          resolve(resp);
        } catch (e) {
          reject(e);
        }
      })
      .fail((xhr, textStatus, errorThrown) => {
        console.error("Server request failed:", {
          endpoint: request,
          fullURL: air_data.SBI_SERVER + request,
          httpStatus: xhr.status,
          textStatus,
          statusText: xhr.statusText,
          responseText: xhr.responseText,
          errorThrown
        });

        let msg = "Unknown error";

        if (xhr.status === 504) {
          msg = `Gateway timeout (504): the proxy gave up waiting for the server. This usually means the LLM request took too long.`;
        } else if (textStatus === "timeout") {
          msg = `Client timeout: waited ${ajaxOptions.timeout / 1000}s without a response.`;
        } else if (textStatus === "abort") {
          msg = `Request aborted (client-side).`;
        } else if (xhr.status === 0) {
          // status 0: could be CORS, could be network. Don't assume CORS.
          msg = `Network/CORS error: request did not complete (status 0). Check DevTools Network tab + server/proxy logs.`;
        } else if (xhr.responseJSON?.error) {
          msg = xhr.responseJSON.error;
        } else if (xhr.responseText) {
          msg = xhr.responseText;
        } else if (errorThrown || xhr.statusText) {
          msg = errorThrown || xhr.statusText;
        }

        const err = new Error(msg);
        err.httpStatus = xhr.status;
        err.textStatus = textStatus;
        err.responseText = xhr.responseText;
        reject(err);
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

        console.log("session token", air_data.session_token);
        
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
        if (response.example_data_omics) {
            air_data.example_data_omics = response.example_data_omics;
            console.log("Example data for omics", air_data.example_data_omics);
        }
        else
        {
            console.log("No example data for omics");
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

        air_data.submaps = minerva.map.data.getModels()
        
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
            
            /* Chat bubble animations */
            @keyframes chatBubblePopIn {
                0% {
                    transform: translateY(50px) scale(0.8);
                    opacity: 0;
                }
                60% {
                    transform: translateY(-5px) scale(1.05);
                    opacity: 0.9;
                }
                80% {
                    transform: translateY(2px) scale(0.98);
                    opacity: 1;
                }
                100% {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }
            }
            
            .chat-bubble-animate {
                animation: chatBubblePopIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                animation-fill-mode: forwards;
                transform-origin: bottom center;
                opacity: 0;
                transform: translateY(30px) scale(0.95);
            }
            
            /* Clean animation classes after completion */
            
            /* Prevent re-animation of existing messages */
            .chat-bubble-animated {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
            
            /* Stagger animation delays for multiple responses */
            .chat-bubble-animate:nth-child(1) { animation-delay: 0ms; }
            .chat-bubble-animate:nth-child(2) { animation-delay: 150ms; }
            .chat-bubble-animate:nth-child(3) { animation-delay: 300ms; }
            .chat-bubble-animate:nth-child(4) { animation-delay: 450ms; }
            .chat-bubble-animate:nth-child(5) { animation-delay: 600ms; }
            .chat-bubble-animate:nth-child(6) { animation-delay: 750ms; }
            .chat-bubble-animate:nth-child(7) { animation-delay: 900ms; }
            .chat-bubble-animate:nth-child(8) { animation-delay: 1050ms; }
            
            /* Focus mode styles */
            .air-focus-mode-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.7);
                z-index: 1000;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .air-focus-mode-overlay.active {
                opacity: 1;
                pointer-events: auto;
            }
            
            .air-focus-mode-highlight {
                position: relative;
                z-index: 1001;
                box-shadow: 0 0 30px rgba(0, 123, 255, 0.5);
                border-radius: 12px;
                transition: all 0.3s ease;
            }

            .air-focus-mode-highlight:not(button[id$="_btn_query"]) {
                background: white;
            }
            
            .air-focus-mode-active .chat-container,
            .air-focus-mode-active .chat-header {
                position: relative;
                z-index: 1001;
            }
            
            .air-focus-mode-active textarea[id$="_query_input"],
            .air-focus-mode-active input[id$="_query_input"] {
                position: relative;
                z-index: 1001;
                background: white;
                border-radius: 8px;
                box-shadow: 0 0 20px rgba(0, 123, 255, 0.3);
                border-color: #007bff;
            }
            
            .air-focus-mode-active button[id$="_btn_query"] {
                position: relative;
                z-index: 1001;
                border-radius: 8px;
                box-shadow: 0 0 20px rgba(0, 123, 255, 0.3);
                border-color: #007bff;
                color: #007bff;
            }
            
            .air-focus-mode-active button[id$="_btn_function_selector"] {
                position: relative;
                z-index: 1001;
                box-shadow: 0 0 15px rgba(0, 123, 255, 0.2);
                border-radius: 6px;
            }
            
            /* Fix submit button alignment */
            form[id$="_queryform"] {
                align-items: center;
            }
            
            form[id$="_queryform"] .air_btn {
                height: auto;
                align-self: center;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 38px;
            }
            
            form[id$="_queryform"] .form-control {
                height: 38px;
            }
            

            .air-focus-mode-active button[id$="_btn_function_selector"] {
                background-color: rgba(0, 123, 255, 0.1);
                border-color: rgba(0, 123, 255, 0.3);
                color: #007bff;
            }
            
                    /* Focus mode switch styling */
        .form-check.form-switch {
            margin-bottom: 0;
            padding-left: 0;
            min-height: auto;
        }
        
        /* Auto-expanding text input styling */
        .auto-expand-input {
            resize: none;
            overflow-y: auto;
            transition: height 0.2s ease;
            min-height: 38px;
            max-height: 200px;
        }
        
        .auto-expand-input:focus {
            overflow-y: auto;
        }
            
            .form-check.form-switch .form-check-input {
                width: 3rem;
                height: 1.5rem;
                background-color: #f8f9fa;
                border: 2px solid #007bff;
                cursor: pointer;
                transition: all 0.15s ease-in-out;
                margin-top: 0;
                margin-left: 0;
            }
            
            .form-check.form-switch .form-check-input:checked {
                background-color: #007bff;
                border-color: #007bff;
            }
            
            .form-check.form-switch .form-check-input:hover {
                border-color: #0056b3;
                background-color: rgba(0, 123, 255, 0.1);
            }
            
            .form-check.form-switch .form-check-input:checked:hover {
                background-color: #0056b3;
                border-color: #0056b3;
            }
            
            .form-check.form-switch .form-check-input:focus {
                box-shadow: 0 0 0 0.25rem rgba(0, 123, 255, 0.25);
                border-color: #007bff;
            }
            
            .form-check.form-switch .form-check-label,
            .form-check-label[for$="_focus_switch"] {
                cursor: pointer;
                user-select: none;
                line-height: 1.5rem;
                margin-left: 0;
            }
            
            /* Chat container with proper scrolling */
            .chat-container {
                display: flex;
                flex-direction: column;
                height: calc(100% - 54px);
            }
            
            .chat-messages {
                flex: 1;
                overflow-y: scroll;
                overflow-x: hidden;
                padding: 10px;
                background: white;
                border: none;
                display: flex;
                flex-direction: column;
                height: 100%;
            }
            
            /* Push-up animation for new messages handled by existing .chat-bubble-animate */
            
            /* Push effect on existing messages */
            .message-push-up {
                animation: messagePushUp 0.4s ease-out forwards;
            }
            
            @keyframes messagePushUp {
                0% {
                    transform: translateY(0);
                }
                100% {
                    transform: translateY(-10px);
                }
            }
        `;
        document.head.appendChild(customCSS);
        
        air_data.session_token = session_token;
        buildPLuginNavigator();
        loadAndExecuteScripts(["intro.js", "omics.js", "fairdom.js", "xplore.js"]);
        
        // Initialize chat containers after a short delay to ensure modules are loaded
        setTimeout(() => {
            initializeChatContainer('xplore');
            initializeChatContainer('fairdom');
            initializeChatContainer('omics');
        }, 200);
        
        resetSessionWarningTimer();
        
        air_data.minerva_events.addListener("onBioEntityClick", showModulatorsOnClick);

        // Setup node map link handling
        setupNodeMapLinks();

            // Initialize tooltips for plain text content
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl)
        });

    } catch (error) {
        console.error("Error while initializing:", error);
    }
}

// Function to initialize chat container without any messages
function initializeChatContainer(origin) {
    var containerId = "#" + origin + "_analysis_content";
    
    // Check if container exists and doesn't already have chat structure
    if ($(containerId).length > 0 && $(containerId).find('.chat-messages').length === 0) {
        // Create the chat header and container structure
        $(containerId).html(`
            <div class="chat-header d-flex justify-content-between align-items-center mb-2 p-2" style="background: #eeeeee; border-radius: 8px; flex-shrink: 0;">
                <div class="d-flex align-items-center gap-2">
                    <h6 class="mb-0" style="color: #495057;">
                        <i class="fas fa-comments me-2"></i>Chat History
                    </h6>
                    <button id="${origin}_clear_btn" class="btn btn-sm btn-outline-danger" title="Clear chat history" style="padding: 0.25rem 0.5rem;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <label class="form-check-label d-flex align-items-center mb-0" for="${origin}_focus_switch" style="font-size: 12px; color: #6c757d; cursor: pointer;">
                        <i class="fas fa-eye me-1"></i>Focus
                    </label>
                    <div class="form-check form-switch mb-0" style="padding-left: 0;">
                        <input class="form-check-input" type="checkbox" role="switch" id="${origin}_focus_switch" title="Toggle focus mode" style="margin-left: 0;" checked>
                    </div>
                </div>
            </div>
            <div class="chat-container">
                <div class="chat-messages">
                    <div class="text-center text-muted mt-3">
                        <i class="fas fa-comments" style="font-size: 3em; color: #dee2e6; margin-bottom: 10px;"></i>
                        <p class="mb-0">No messages yet</p>
                        <small>Start a conversation by asking a question below</small>
                    </div>
                </div>
            </div>
        `);
        
        // Add focus mode toggle handler for switch
        $(`#${origin}_focus_switch`).on('change', function() {
            const isChecked = $(this).prop('checked');
            if (isChecked) {
                air_focus_mode_sticky[origin] = true;
                ensureFocusListeners(origin);
                // If input currently focused, activate highlight immediately
                const input = getOriginQueryInput(origin);
                if (input.is(':focus')) {
                    activateFocusMode(origin, { fromFocus: true });
                } else {
                    // No focus now – remain idle until focus event
                    deactivateFocusMode(origin, { preserveSticky: true });
                }
            } else {
                // Full disable: remove highlight and sticky
                deactivateFocusMode(origin, { preserveSticky: false });
            }
        });

        // Prepare focus listeners (harmless if switch off; they only act when sticky flag true)
        ensureFocusListeners(origin);
        
        // Enable focus mode by default
        air_focus_mode_sticky[origin] = true;        // Add clear history button handler
        $(`#${origin}_clear_btn`).on('click', function() {
            const chatMessages = $(containerId).find('.chat-messages');
            chatMessages.html(`
                <div class="text-center text-muted mt-3">
                    <i class="fas fa-comments" style="font-size: 3em; color: #dee2e6; margin-bottom: 10px;"></i>
                    <p class="mb-0">No messages yet</p>
                    <small>Start a conversation by asking a question below</small>
                </div>
            `);
            // No animation needed for clear action
        });
        
        // Add scroll event handling to prevent outer container scrolling when at limits
        $(containerId).find('.chat-messages').on('wheel', function(e) {
            const chatMessages = $(this);
            const scrollTop = chatMessages.scrollTop();
            const scrollHeight = chatMessages[0].scrollHeight;
            const clientHeight = chatMessages[0].clientHeight;
            
            // Check if scrolling up and at the top
            if (e.originalEvent.deltaY < 0 && scrollTop <= 0) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            
            // Check if scrolling down and at the bottom
            if (e.originalEvent.deltaY > 0 && scrollTop + clientHeight >= scrollHeight) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        });
        
        // No initial animation needed for empty state
    }
}

// Function to mark existing messages as already animated
function markExistingMessagesAsAnimated(origin) {
    const containerId = "#" + origin + "_analysis_content";
    const chatMessages = $(containerId).find('.chat-messages');
    
    if (chatMessages.length === 0) return;
    
    // Find all existing messages with animation class
    const existingAnimatedMessages = chatMessages.find('.chat-bubble-animate');
    
    // Mark them as already animated and remove the animation class
    existingAnimatedMessages.removeClass('chat-bubble-animate').addClass('chat-bubble-animated');
}

// Function to create push-up effect when new messages appear
function addPushUpEffect(origin, delay = 0) {
    setTimeout(() => {
        const containerId = "#" + origin + "_analysis_content";
        const chatMessages = $(containerId).find('.chat-messages');
        
        if (chatMessages.length === 0) return;
        
        // Add push-up class to all existing messages
        const existingMessages = chatMessages.find('.message-pair, .response-item');
        
        if (existingMessages.length > 0) {
            existingMessages.addClass('message-push-up');
            
            // Remove the push-up class after animation completes
            setTimeout(() => {
                existingMessages.removeClass('message-push-up');
            }, 400);
        }
    }, delay);
}

// Function to clean up animation classes after they complete
function cleanupAnimationClasses(origin, animationCount = 1, baseDelay = 0) {
    const animationDuration = 600;
    const staggerDelay = (animationCount - 1) * 150;
    const totalDelay = baseDelay + staggerDelay + animationDuration + 50; // Small buffer
    
    setTimeout(() => {
        const containerId = "#" + origin + "_analysis_content";
        const chatMessages = $(containerId).find('.chat-messages');
        
        if (chatMessages.length > 0) {
            // Mark all animated messages as completed
            chatMessages.find('.chat-bubble-animate').removeClass('chat-bubble-animate').addClass('chat-bubble-animated');
        }
    }, totalDelay);
}

// Function to add a single message with animation and scroll
function addMessageWithAnimation(origin, messageElement, callback) {
    const containerId = "#" + origin + "_analysis_content";
    const chatMessages = $(containerId).find('.chat-messages');
    
    if (chatMessages.length === 0) return;
    
    // Add the message to the DOM
    const responsesContainer = chatMessages.find('.assistant-responses').last();
    if (responsesContainer.length > 0) {
        responsesContainer.append(messageElement);
    } else {
        chatMessages.append(messageElement);
    }
    
    // Wait for animation to complete, then scroll
    setTimeout(() => {
        // Scroll to show the new message
        if (chatMessages.length > 0 && chatMessages[0]) {
            chatMessages.animate({
                scrollTop: chatMessages[0].scrollHeight
            }, 300, callback); // Callback fires when scroll completes
        } else if (callback) {
            callback();
        }
    }, 200); // Animation duration + small buffer

    const evt = new CustomEvent('air:response:visible', { detail: { origin, el: messageElement }});
    document.dispatchEvent(evt);
}

// Function to process messages sequentially
async function processMessagesSequentially(origin, messages) {
    for (let i = 0; i < messages.length; i++) {
        await new Promise(resolve => {
            addMessageWithAnimation(origin, messages[i], resolve);
        });
    }
}

// Focus mode functionality
let air_focus_mode_active = false;
let air_focus_overlay = null;
// Track whether focus mode is enabled (sticky) per origin – highlight only appears while input focused
const air_focus_mode_sticky = {}; // { origin: true|false }
const air_focus_lastPointerInside = {}; // transient flag to keep highlight on pointer-based transitions

// Helper to get query input element for an origin
function getOriginQueryInput(origin) {
    return $(`#${origin}_queryform`).find('textarea[id$="_query_input"], input[id$="_query_input"]');
}

// Helper: get all elements that should keep highlight when focused
function getOriginFocusableHighlightGroup(origin) {
    const queryForm = $(`#${origin}_queryform`);
    const analysisContent = $(`#${origin}_analysis_content`);
    const input = getOriginQueryInput(origin);
    const submitBtn = queryForm.find('button[id$="_btn_query"]');
    const functionBtn = $(`#${origin}_btn_function_selector`);
    // chat messages container (clicks inside should preserve highlight)
    const chatMessages = analysisContent.find('.chat-messages');
    // function selector modal (may be in parent document)
    const functionModal = $(`#${origin}_function_modal`, window.parent.document);
    return $([]).add(input).add(submitBtn).add(functionBtn).add(chatMessages).add(functionModal);
}

function isFocusWithinHighlightGroup(origin) {
    const active = document.activeElement;
    const parentActive = window.parent.document.activeElement;
    if (!active && !parentActive) return false;
    
    const group = getOriginFocusableHighlightGroup(origin);
    let inside = false;
    group.each(function() { 
        if ((active && (this === active || $.contains(this, active))) ||
            (parentActive && (this === parentActive || $.contains(this, parentActive)))) { 
            inside = true; 
            return false; 
        } 
    });
    return inside;
}

// Attach focus/blur listeners (once) to drive highlight when sticky enabled
function ensureFocusListeners(origin) {
    const group = getOriginFocusableHighlightGroup(origin);
    if (group.length === 0) return;
    // Use a flag on first element to prevent rebinding
    const markerEl = getOriginQueryInput(origin);
    if (markerEl.length && markerEl.data('focus-listeners-added')) return;

    // Make chat messages focusable so focus can remain within group on clicks
    const chatMessages = $(`#${origin}_analysis_content`).find('.chat-messages');
    if (chatMessages.length) {
        chatMessages.attr('tabindex', '-1');
    }

    // Focus handler: activate highlight if sticky
    group.on('focus.focusmode', function() {
        if (air_focus_mode_sticky[origin]) {
            activateFocusMode(origin, { fromFocus: true });
        }
    });

    // Add specific parent document interaction handler only for known highlight elements
    $(window.parent.document).on('mousedown.focusmode', function(e) {
        if (air_focus_mode_sticky[origin] && window.parent.document !== document) {
            // Check if click is on a function modal or other known highlight elements
            const functionModal = $(`#${origin}_function_modal`, window.parent.document);
            if (functionModal.length && (e.target === functionModal[0] || $.contains(functionModal[0], e.target))) {
                air_focus_lastPointerInside[origin] = true;
                activateFocusMode(origin, { fromFocus: true });
            }
        }
    });

    // Blur handler: defer check to allow next element to receive focus
    group.on('blur.focusmode', function() {
        setTimeout(() => {
            if (!air_focus_mode_sticky[origin]) return;
            // If a pointer interaction started inside group, skip this blur cycle
            if (air_focus_lastPointerInside[origin]) {
                air_focus_lastPointerInside[origin] = false;
                return;
            }
            if (!isFocusWithinHighlightGroup(origin)) {
                deactivateFocusMode(origin, { preserveSticky: true });
            }
        }, 10); // slight delay to allow new focus target to settle
    });

    // Mouse interaction inside chat messages should also re-activate highlight when sticky
    chatMessages.on('mousedown.focusmode', function() {
        if (air_focus_mode_sticky[origin]) {
            air_focus_lastPointerInside[origin] = true;
            activateFocusMode(origin, { fromFocus: true });
            // Move focus to chat area to keep it inside group
            $(this).focus();
        }
    });

    if (markerEl.length) markerEl.data('focus-listeners-added', true);
}

function activateFocusMode(origin, opts = {}) {
    const analysisContent = $(`#${origin}_analysis_content`);
    const queryForm = $(`#${origin}_queryform`);
    const functionSelectorBtn = $(`#${origin}_btn_function_selector`);
    
    // Activate focus mode
    air_focus_mode_active = true;
    
    // Create overlay if it doesn't exist
    if (!air_focus_overlay) {
        air_focus_overlay = $('<div class="air-focus-mode-overlay"></div>');
        $('body').append(air_focus_overlay);
        
        // Click overlay to exit focus mode
        air_focus_overlay.on('click', function(e) {
            if (e.target === this) {
                // Clicking overlay (outside elements) removes highlight but preserves sticky
                deactivateFocusMode(origin, { preserveSticky: true });
            }
        });
        
        // ESC key to exit focus mode
        $(document).on('keydown.focusmode', function(e) {
            if (e.key === 'Escape' && air_focus_mode_active) {
                deactivateFocusMode(origin, { preserveSticky: true });
            }
        });
    }
    
    // Clear any existing focus highlights
    $('.air-focus-mode-active, .air-focus-mode-highlight').removeClass('air-focus-mode-active air-focus-mode-highlight');
    
    // Add classes and show overlay
    analysisContent.addClass('air-focus-mode-active air-focus-mode-highlight');
    
    // Highlight individual form elements instead of the form container
    const queryInput = queryForm.find('textarea[id$="_query_input"], input[id$="_query_input"]');
    const submitButton = queryForm.find('button[id$="_btn_query"]');
    
    if (queryInput.length > 0) {
        queryInput.addClass('air-focus-mode-highlight');
    }
    if (submitButton.length > 0) {
        submitButton.addClass('air-focus-mode-highlight');
    }
    
    // Highlight function selector button if it exists
    if (functionSelectorBtn.length > 0) {
        functionSelectorBtn.addClass('air-focus-mode-highlight');
    }
    
    air_focus_overlay.addClass('active');
    
    // Store current origin
    air_focus_overlay.data('current-origin', origin);
}

function deactivateFocusMode(origin, options = {}) {
    const { preserveSticky = false } = options;
    // Remove highlight classes & overlay active state
    $('.air-focus-mode-active, .air-focus-mode-highlight').removeClass('air-focus-mode-active air-focus-mode-highlight');
    if (air_focus_overlay) {
        air_focus_overlay.removeClass('active');
    }
    air_focus_mode_active = false;
    if (!preserveSticky) {
        // User explicitly turned off switch – disable sticky behavior
        air_focus_mode_sticky[origin] = false;
        // Uncheck ONLY this origin's switch
        $(`#${origin}_focus_switch`).prop('checked', false);
    }
}

buildPLuginNavigator = () => {
    air_data.container.find("#stat_spinner").remove();
            
    air_data.container.append(`
            <ul class="air_nav_tabs nav nav-tabs mt-2" id="air_navs" role="tablist" hidden>
                <li class="air_nav_item nav-item" style="width: 21%;">
                    <a class="air_tab active nav-link" id="intro_tab" data-bs-toggle="tab" href="#intro_tab_content" role="tab" aria-controls="intro_tab_content" aria-selected="true">Start</a>
                </li>
                <li class="air_nav_item nav-item" style="width: 21%;">
                    <a class="air_tab nav-link" id="xplore_tab" data-bs-toggle="tab" href="#xplore_tab_content" role="tab" aria-controls="xplore_tab_content" aria-selected="true">Explore</a>
                </li>
                <li class="air_nav_item nav-item" style="width: 21%;">
                    <a class="air_tab nav-link" id="airomics_tab" data-bs-toggle="tab" href="#airomics_tab_content" role="tab" aria-controls="airomics_tab_content" aria-selected="false">Analyze</a>
                </li>   
                <li class="air_nav_item nav-item" style="width: 21%;">
                    <a class="air_tab nav-link" id="fairdom_tab" data-bs-toggle="tab" href="#fairdom_tab_content" role="tab" aria-controls="fairdom_tab_content" aria-selected="false">SEEK</a>
                </li>
                <li class="air_nav_item nav-item d-flex align-items-center justify-content-center" style="width: 16%;">
                    <button id="clear_highlights_btn" class="btn btn-xs btn-outline-danger" style="font-size: 10px; padding: 2px 6px;" title="Remove all highlighted elements from the map">
                        <i class="fas fa-eraser"></i>
                    </button>
                </li>
            </ul>
            <div class="tab-content air_tab_content" id="air_tabs" style="height: calc(100% - 45px);background-color: white;">
                <div class="tab-pane show active" id="intro_tab_content" role="tabpanel" aria-labelledby="intro_tab" style="overflow-y: scroll;">
                </div>
                <div class="tab-pane show" id="xplore_tab_content" role="tabpanel" aria-labelledby="xplore_tab" style="overflow-y: hidden;">
                </div>
                <div class="tab-pane show" id="airomics_tab_content" role="tabpanel" aria-labelledby="airomics_tab" style="overflow-y: scroll;">
                </div>
                <div class="tab-pane show" id="fairdom_tab_content" role="tabpanel" aria-labelledby="fairdom_tab">
                </div>
            </div>
    `);
    air_data.container.find("#air_tabs").children(".tab-pane").addClass("air_tab_pane");
    air_data.container.find("#air_navs").removeAttr("hidden");
    air_data.container.find(".air_tab_pane").css("height", "100%") //"calc(100vh - " + 700 + "px)");
    
    // Add click handler for clear highlights button
    air_data.container.find("#clear_highlights_btn").on('click', function() {
        removeHighlight();
    });
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

            $(".air_btn, .omics-action-btn").each(function (pindex) {
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

            $(".air_btn, .omics-action-btn").each(function (pindex) {
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

    // Ensure any existing DataTable is completely destroyed first
    if ($.fn.DataTable.isDataTable($(containerId)[0])) {
        console.log('Destroying existing DataTable in createDataTable for:', containerId);
        $(containerId).DataTable().clear().destroy();
        $(containerId).empty(); // Clear the table HTML completely
    } else {
        console.log('No existing DataTable found for:', containerId);
        // Still clear any existing content to ensure clean state
        $(containerId).empty();
    }

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
    if(created_by == "") {
        minerva.data.bioEntities.removeAllMarkers();
        air_data.added_markers = {};
        return;
    }
    
    for(var [_created_by, marker_ids] of Object.entries(air_data.added_markers)) {
        if(_created_by != created_by) {
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
            id: marker_id,
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
            id: marker_id,
        };
    });

    for(var marker of new_markers) {
        minerva.data.bioEntities.addSingleMarker(marker);
    }
}


function extractContent(s) {
    var span = document.createElement('span');
    span.innerHTML = s;
    if (span.textContent == "" && span.innerText == "") {
        var htmlObject = $(s);
        if (htmlObject && htmlObject.is(":checkbox")) {
            return htmlObject.is(':checked') ? "true" : "false";
        }
    }
    return span.textContent || span.innerText;
}

function getDTExportString(dt, seperator = "\t") {
    let output = [];
    
    // Get visible column indices
    let visibleColumnIndices = [];
    dt.columns(':visible').every(function (colIdx) {
        visibleColumnIndices.push(colIdx);
    });

    // Get data for visible columns only
    dt.rows().every(function (rowIdx, tableLoop, rowLoop) {
        let rowData = this.data();
        let visibleRowData = visibleColumnIndices.map(function(colIdx) {
            return extractContent(rowData[colIdx]);
        });
        output.push(visibleRowData);
    });

    // Filter out columns that have no values (empty columns)
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

    // Add headers for visible columns only
    output.unshift([]);
    dt.columns(':visible').every(function () {
        output[0].push(this.header().textContent)
    });

    // Remove empty columns from output
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

// Function selector modal and parameter form functionality
function showFunctionSelectorModal(origin) {
    // Remove any existing modals
    $(`#${origin}_function_modal`, window.parent.document).remove();

    // Remove any existing event handlers to prevent leaks (scoped per origin)
    $(window.parent.document).off(`.airFuncModal_${origin}`);
    
    const queries = origin == "omics" ? air_data.example_queries_dea : air_data.example_queries_map;
    
    // Create function list HTML (inline expandable parameter forms)
    let functionListHtml = '';
    for (const [key, query] of Object.entries(queries)) {
        const title = query.ui_name || key;
        const desc = query.ui_description || '';
        functionListHtml += `
            <div class="function-item" data-function-key="${key}">
                <button type="button" class="function-item-header" aria-expanded="false">
                    <div class="function-item-text">
                        <div class="function-item-title">${title}</div>
                        ${desc ? `<div class="function-item-desc">${desc}</div>` : ''}
                    </div>
                    <div class="function-item-caret" aria-hidden="true">▾</div>
                </button>
                <div class="function-params" style="display:none;"></div>
            </div>
        `;
    }
    
    const modalHTML = `
        <div id="${origin}_function_modal" class="air-function-modal-overlay">
            <div class="air-function-modal-panel" role="dialog" aria-modal="true" aria-label="Select Function">
                <div class="air-function-modal-header">
                    <div class="air-function-modal-header-text">
                        <div class="air-function-modal-title">Select Function</div>
                        <div class="air-function-modal-subtitle">Choose a function and fill its parameters inline.</div>
                    </div>
                    <button id="${origin}_function_close" type="button" class="air-function-modal-close" aria-label="Close">&times;</button>
                </div>

                <div id="${origin}_function_list" class="air-function-list">
                    ${functionListHtml}
                </div>
            </div>
            <style>
                #${origin}_function_modal.air-function-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.75);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 99999;
                    padding: 16px;
                }

                #${origin}_function_modal .air-function-modal-panel {
                    width: min(840px, 95vw);
                    max-height: min(92vh, 860px);
                    overflow: auto;
                    background: var(--bs-body-bg, #fff);
                    border: 1px solid var(--bs-border-color, #dee2e6);
                    border-radius: 12px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
                    font-size: 14px;
                    line-height: 1.45;
                }

                #${origin}_function_modal .air-function-modal-header {
                    position: sticky;
                    top: 0;
                    background: var(--bs-body-bg, #fff);
                    border-bottom: 1px solid var(--bs-border-color, #dee2e6);
                    padding: 14px 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    z-index: 1;
                }

                #${origin}_function_modal .air-function-modal-title {
                    font-weight: 700;
                    font-size: 18px;
                    line-height: 1.3;
                    color: var(--bs-body-color, #212529);
                }

                #${origin}_function_modal .air-function-modal-subtitle {
                    margin-top: 2px;
                    font-size: 13px;
                    line-height: 1.4;
                    color: var(--bs-secondary-color, #6c757d);
                }

                #${origin}_function_modal .air-function-modal-close {
                    border: 1px solid var(--bs-border-color, #dee2e6);
                    background: transparent;
                    border-radius: 10px;
                    width: 34px;
                    height: 34px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 22px;
                    line-height: 1;
                    color: var(--bs-secondary-color, #6c757d);
                    cursor: pointer;
                }

                #${origin}_function_modal .air-function-modal-close:hover {
                    color: var(--bs-body-color, #212529);
                    background: rgba(0, 0, 0, 0.03);
                }

                #${origin}_function_modal .air-function-list {
                    padding: 12px 16px 16px 16px;
                }

                #${origin}_function_modal .function-item {
                    border: 1px solid var(--bs-border-color, #dee2e6);
                    border-radius: 10px;
                    overflow: hidden;
                    background: var(--bs-body-bg, #fff);
                    margin-bottom: 10px;
                }

                #${origin}_function_modal .function-item-header {
                    width: 100%;
                    text-align: left;
                    border: none;
                    background: transparent;
                    padding: 12px 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 12px;
                    cursor: pointer;
                }

                #${origin}_function_modal .function-item-header:hover {
                    background: rgba(0, 0, 0, 0.02);
                }

                #${origin}_function_modal .function-item-title {
                    font-weight: 600;
                    font-size: 15px;
                    line-height: 1.35;
                    color: var(--bs-body-color, #212529);
                    margin-bottom: 2px;
                }

                #${origin}_function_modal .function-item-desc {
                    font-size: 13px;
                    line-height: 1.4;
                    color: var(--bs-secondary-color, #6c757d);
                    font-style: normal;
                }

                #${origin}_function_modal .function-item-caret {
                    flex: 0 0 auto;
                    transition: transform 0.15s ease;
                    color: var(--bs-secondary-color, #6c757d);
                    margin-top: 2px;
                }

                #${origin}_function_modal .function-item.expanded .function-item-caret {
                    transform: rotate(180deg);
                }

                #${origin}_function_modal .function-params {
                    border-top: 1px solid var(--bs-border-color, #dee2e6);
                    padding: 14px;
                    background: #f8fafc;
                }

                #${origin}_function_modal .function-params-help {
                    font-size: 13px;
                    line-height: 1.4;
                    color: var(--bs-secondary-color, #6c757d);
                    margin-bottom: 12px;
                }

                #${origin}_function_modal .function-params .form-label {
                    display: block;
                    font-size: 13px;
                    line-height: 1.35;
                    margin-bottom: 6px;
                    color: #334155;
                }

                #${origin}_function_modal .function-params .form-text {
                    font-size: 12px;
                    line-height: 1.4;
                    color: #64748b;
                    margin-top: 0;
                    margin-bottom: 6px;
                }

                #${origin}_function_modal .form-control,
                #${origin}_function_modal .form-select {
                    display: block;
                    width: 100%;
                    max-width: 100%;
                    box-sizing: border-box;
                    font-size: 14px;
                    line-height: 1.4;
                    min-height: 44px;
                    padding: 10px 12px;
                    background: #ffffff;
                    border: 1.5px solid #cbd5e1;
                    color: #0f172a;
                }

                #${origin}_function_modal textarea.form-control {
                    min-height: 100px;
                    padding: 10px 12px;
                }

                #${origin}_function_modal .form-check-input {
                    border: 1.5px solid #94a3b8;
                    background-color: #fff;
                }

                #${origin}_function_modal .form-check-label {
                    font-size: 13px;
                    line-height: 1.4;
                    color: #334155;
                }

                #${origin}_function_modal .required-field.is-invalid {
                    border-color: var(--bs-danger, #dc3545) !important;
                }

                #${origin}_function_modal .form-control:focus,
                #${origin}_function_modal .form-select:focus {
                    border-color: var(--bs-primary, #0d6efd);
                    box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.2);
                }

                #${origin}_function_modal .form-check-input.is-invalid {
                    border-color: var(--bs-danger, #dc3545) !important;
                }

                #${origin}_function_modal .function-submit {
                    min-width: 140px;
                    min-height: 44px;
                    padding: 10px 18px;
                    font-size: 14px;
                    font-weight: 700;
                    letter-spacing: 0.2px;
                    border: 1px solid #0b5ed7;
                    background: linear-gradient(180deg, #1f7bff 0%, #0d6efd 100%);
                    color: #ffffff;
                    box-shadow: 0 8px 20px rgba(13, 110, 253, 0.28);
                    transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease;
                }

                #${origin}_function_modal .function-submit:hover {
                    filter: brightness(1.03);
                    transform: translateY(-1px);
                    box-shadow: 0 12px 24px rgba(13, 110, 253, 0.34);
                }

                #${origin}_function_modal .function-submit:active {
                    transform: translateY(0);
                    box-shadow: 0 6px 14px rgba(13, 110, 253, 0.24);
                }

                #${origin}_function_modal .function-submit:focus,
                #${origin}_function_modal .function-submit:focus-visible {
                    outline: none;
                    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.3), 0 8px 20px rgba(13, 110, 253, 0.3);
                }
            </style>
        </div>
    `;
    
    // Append to window.parent.document.body
    $(window.parent.document.body).append(modalHTML);
    
    // Expand/collapse inline parameter form under clicked function
    $(window.parent.document).on(`click.airFuncModal_${origin}`, `#${origin}_function_list .function-item-header`, function(e) {
        e.preventDefault();
        const $item = $(this).closest('.function-item');
        const functionKey = $item.data('function-key');
        const query = queries[functionKey];
        if (!query) return;

        const isExpanded = $item.hasClass('expanded');

        // Collapse others
        $(window.parent.document).find(`#${origin}_function_list .function-item.expanded`).not($item).each(function() {
            $(this).removeClass('expanded');
            $(this).find('.function-item-header').attr('aria-expanded', 'false');
            $(this).find('.function-params').hide().empty();
        });

        if (isExpanded) {
            $item.removeClass('expanded');
            $(this).attr('aria-expanded', 'false');
            $item.find('.function-params').hide().empty();
            return;
        }

        $item.addClass('expanded');
        $(this).attr('aria-expanded', 'true');
        renderInlineParameterForm(origin, functionKey, query, $item);
        $item.find('.function-params').show();
    });
    
    // Add close button handler
    $(window.parent.document).on(`click.airFuncModal_${origin}`, `#${origin}_function_close`, function() {
        $(`#${origin}_function_modal`, window.parent.document).remove();
        $(window.parent.document).off(`.airFuncModal_${origin}`);
    });

    // Add submit button handler (scoped to the expanded function)
    $(window.parent.document).on(`click.airFuncModal_${origin}`, `#${origin}_function_list .function-submit`, async function(e) {
        e.preventDefault();
        e.stopPropagation();

        const $item = $(this).closest('.function-item');
        const selectedFunction = $item.data('function-key');
        const queryDef = queries[selectedFunction];
        if (!selectedFunction || !queryDef) return;
        
        // Check if already processing a response
        if (window.isProcessingResponse) {
            showWaitAlert(origin);
            return;
        }
        
        // Validate required fields (only within this function item)
        const requiredFields = $item.find(`.required-field`);
        let isValid = true;
        let $firstInvalid = null;
        
        requiredFields.each(function() {
            const field = $(this);
            const fieldType = field.attr('type');
            
            let hasValue = false;
            if (fieldType === 'checkbox') {
                hasValue = field.is(':checked');
            } else {
                hasValue = field.val() && field.val().trim() !== '';
            }
            
            if (!hasValue) {
                field.addClass('is-invalid');
                if (!$firstInvalid) $firstInvalid = field;
                isValid = false;
            } else {
                field.removeClass('is-invalid');
            }
        });
        
        if (!isValid) {
            alert('Please fill in all required fields.');
            if ($firstInvalid && $firstInvalid.length) {
                $firstInvalid.trigger('focus');
            }
            return;
        }

        // Collect parameter values from this inline form
        const finalParams = collectInlineFinalParams($item, queryDef.parameters || []);
        
        // Close the modal first
        $(`#${origin}_function_modal`, window.parent.document).remove();
        $(window.parent.document).off(`.airFuncModal_${origin}`);
        
        try {
            // Show loading state on the query button
            var btn_text = await disablebutton(`${origin}_btn_query`);
            
            // Add thinking indicator immediately
            // addThinkingIndicator(origin, `Function call: ${selectedFunction}`);
            
            var query = {};
            query["function name"] = selectedFunction;
            query["parameters"] = finalParams

            query = JSON.stringify(query);

            await multi_agent_query(origin, query, true);
                        
        } catch (err) {
            console.error("Error submitting function:", err);
            processServerResponses({"response_type": "alert", "content": `Error: ${err.message}`}, origin, "Function call", "function_call");
        } finally {
            // Restore button state
            enablebutton(`${origin}_btn_query`, btn_text);
            
            // Reset global flag and hide wait alert in case of error
            window.isProcessingResponse = false;
            hideWaitAlert(origin);
            
            // Scroll to bottom of analysis content and tab content
            const analysisContent = document.getElementById(`${origin}_analysis_content`);
            if (analysisContent) {
                analysisContent.scrollTop = analysisContent.scrollHeight;
            }
        }
    });
}

function renderInlineParameterForm(origin, functionKey, query, $functionItem) {
    const $params = $functionItem.find('.function-params');
    if ($params.length === 0) return;

    const parameters = query.parameters || [];

    let fieldsHtml = '';
    if (parameters.length > 0) {
        parameters.forEach((param, index) => {
            const isBoolean = param.type === 'boolean';
            fieldsHtml += `
                <div class="mb-3">
                    ${!isBoolean ? `<label class="form-label" style="font-weight: 600;">
                        ${param.ui_name || param.name}
                        ${param.required ? '<span class="text-danger">*</span>' : ''}
                    </label>` : ''}
                    ${param.ui_description ? `<div class="form-text">${param.ui_description}</div>` : ''}
                    ${createParameterInput(param, index, functionKey)}
                </div>
            `;
        });
    } else {
        fieldsHtml = `<div class="text-muted" style="font-size: 12px;">This function has no parameters.</div>`;
    }

    $params.html(`
        <div class="function-params-help">Enter values in natural language; the function call will be built from these.</div>
        <div class="function-params-fields">${fieldsHtml}</div>
        <div class="d-flex justify-content-end gap-2 mt-2">
            <button type="button" class="btn btn-primary function-submit">Submit</button>
        </div>
    `);
}

function createParameterInput(param, index, functionKey) {
    const inputId = `${functionKey}_param_${index}`;
    const requiredClass = param.required ? 'required-field' : '';
    const dataAttrs = `data-param-index="${index}"`;
    
    switch (param.type) {
        case 'boolean':
            return `<div class="form-check form-switch mt-1">
                        <input type="checkbox" id="${inputId}" class="form-check-input ${requiredClass}" ${dataAttrs}
                               ${param.defaultValue ? 'checked' : ''}>
                        <label class="form-check-label" for="${inputId}">${param.ui_name || param.name}</label>
                    </div>`;
        
        case 'number':
            return `<input type="number" id="${inputId}" class="form-control ${requiredClass}" ${dataAttrs}
                          value="${param.defaultValue ? param.defaultValue : ''}" 
                          placeholder="${param.placeholder || ''}">`;
        
        case 'select':
            return `<select id="${inputId}" class="form-select ${requiredClass}" ${dataAttrs}>
                        <option value="">Select ${param.name}</option>
                        ${param.options ? param.options.map(opt => 
                            `<option value="${opt.value}" ${opt.value === param.defaultValue ? 'selected' : ''}>${opt.label}</option>`
                        ).join('') : ''}
                    </select>`;
        
        case 'textarea':
            return `<textarea id="${inputId}" class="form-control ${requiredClass}" rows="3" ${dataAttrs}
                              placeholder="${param.placeholder || ''}">${param.defaultValue ? param.defaultValue : ''}</textarea>`;
        
        default:
            return `<input type="text" id="${inputId}" class="form-control ${requiredClass}" ${dataAttrs}
                          value="${param.defaultValue ? param.defaultValue : ''}" 
                          placeholder="${param.placeholder || `Enter ${param.name}`}">`;
    }
}

function collectInlineFinalParams($functionItem, parameterDefs) {
    const finalParams = {};
    const fields = $functionItem.find('input[data-param-index], select[data-param-index], textarea[data-param-index]');

    fields.each(function() {
        const $field = $(this);
        const idx = parseInt($field.data('param-index'));
        if (Number.isNaN(idx) || !parameterDefs[idx]) return;

        const def = parameterDefs[idx];
        const fieldType = $field.attr('type');
        let value;
        if (fieldType === 'checkbox') {
            value = $field.is(':checked') ? 'true' : 'false';
        } else {
            value = $field.val();
        }

        if (value !== undefined && value !== null) {
            const trimmed = typeof value === 'string' ? value.trim() : value;
            if (trimmed !== '') {
                finalParams[def.name] = trimmed;
            }
        }
    });

    return finalParams;
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

// Function to remove plugin header element from parent document
function removePluginHeader() {
    try {
        // Remove the plugin header element if it exists
        const headerElement = window.parent.document.querySelector('[data-testid="drawer-plugins-header"]');
        if (headerElement) {
            headerElement.remove();
            console.log('Plugin header element removed');
        }
    } catch (error) {
        console.error('Error removing plugin header:', error);
    }
}



// Function to maximize plugin container size
function maximizePluginContainer() {
    try {
        const parentDoc = window.parent.document;
        
        // Target the main plugins content area
        const pluginsContent = parentDoc.querySelector('[data-testid="drawer-plugins-content"]');
        if (pluginsContent) {
            // Maximize the height by removing the header offset
            pluginsContent.style.height = 'calc(100% - 60px)'; // Reduced from 166px to account for removed header
            pluginsContent.style.maxHeight = 'calc(100% - 60px)';
            console.log('Plugin container height maximized');
        }
        
        // // Hide or minimize the tab close button to gain a bit more space
        // const tabCloseIcon = parentDoc.querySelector('[data-testid="close-icon"]');
        // if (tabCloseIcon) {
        //     tabCloseIcon.style.display = 'none';
        //     console.log('Tab close icon hidden');
        // }
        
        // Minimize tab padding to gain more space
        const tabButton = parentDoc.querySelector('[data-testid="drawer-plugins-tab"] button');
        if (tabButton) {
            tabButton.style.padding = '4px 8px'; // Reduced from default padding
            tabButton.style.height = '32px'; // Reduced height
            console.log('Tab button padding minimized');
        }
        
        // Minimize the tab container height
        const tabContainer = parentDoc.querySelector('[data-testid="drawer-plugins-tab"]');
        if (tabContainer) {
            tabContainer.style.minHeight = '32px'; // Reduced from default
            tabContainer.style.height = '32px';
            console.log('Tab container height minimized');
        }
        
        // Adjust the plugins content height to account for smaller tab
        if (pluginsContent) {
            pluginsContent.style.height = 'calc(100% - 32px)'; // Further optimized
            pluginsContent.style.maxHeight = 'calc(100% - 32px)';
        }
        
        // // If there's only one plugin, consider hiding the tab bar entirely
        // const allTabs = parentDoc.querySelectorAll('[data-testid="drawer-plugins-tab"] button');
        // if (allTabs.length === 1 && tabContainer) {
        //     // Hide the entire tab container to maximize space
        //     tabContainer.style.display = 'none';
        //     if (pluginsContent) {
        //         pluginsContent.style.height = '100%'; // Use full height
        //         pluginsContent.style.maxHeight = '100%';
        //         console.log('Single plugin detected - tab bar hidden for maximum space');
        //     }
        // }
        
    } catch (error) {
        console.error('Error maximizing plugin container:', error);
    }
}

// Function to add a "thinking..." indicator 
function addThinkingIndicator(origin, queryText) {
        // Set global flag to prevent new queries
    window.isProcessingResponse = true;
    
    var containerId = "#" + origin + "_analysis_content";
    
    // Ensure chat container is initialized (fallback if not already done)
    if ($(containerId).find('.chat-messages').length === 0) {
        initializeChatContainer(origin);
    }
    
    const chatMessages = $(containerId).find('.chat-messages');
    const timestamp = new Date().toLocaleTimeString();
    
    // Clear any placeholder content
    chatMessages.find('.text-center.text-muted').remove();
    
    // Mark existing messages as already animated to prevent re-animation
    markExistingMessagesAsAnimated(origin);
    
    // Schedule push-up effect to happen just before user message animation starts
    addPushUpEffect(origin, 50); // Small delay before animation
    
    // Add user query message
    if (queryText && queryText.trim()) {
        // Create user message with animation
        const userMessage = $(`
            <div class="user-message-container mb-3 chat-bubble-animate">
                <div class="user-message" style="display: flex; flex-direction: column; align-items: flex-end;">
                    <div class="message-header d-flex justify-content-end align-items-center mb-2" style="width: 100%;">
                        <small class="text-muted me-2">${timestamp}</small>
                        <div class="d-flex align-items-center">
                            <span class="fw-bold text-primary me-2">You</span>
                            <div class="message-avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 32px; height: 32px; font-size: 14px;">
                                <i class="fas fa-user"></i>
                            </div>
                        </div>
                    </div>
                    <div class="message-content p-3" style="background: #e3f2fd; border-radius: 12px; border-top-right-radius: 4px; max-width: 80%; text-align: left;">
                        ${queryText}
                    </div>
                </div>
            </div>
        `);
        
        // Create thinking indicator with delayed animation (after user message completes)
        const thinkingMessage = $(`
            <div class="message-pair mb-3 chat-bubble-animate" style="animation-delay: 600ms;">
                <div class="assistant-message">
                    <div class="message-header d-flex justify-content-between align-items-center mb-2">
                        <div class="d-flex align-items-center">
                            <div class="message-avatar bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px; overflow: hidden;">
                                <img src="https://raw.githubusercontent.com/sbi-rostock/AIR/refs/heads/master/LUMINAR/images/Luminar_icon_small.jpg" alt="LUMINAR" style="width: 100%; height: 100%; object-fit: cover;">
                            </div>
                            <span class="fw-bold text-success">LUMINAR Assistant</span>
                        </div>
                        <small class="text-muted">${timestamp}</small>
                    </div>
                    <div class="thinking-indicator p-3" style="background: #f8f9fa; border-radius: 12px; border-top-left-radius: 4px; border: 1px solid #dee2e6;">
                        <div class="d-flex align-items-center">
                            <div class="thinking-dots" style="margin: 0 16px 0 8px;">
                                <div class="dot-flashing" style="position: relative; width: 6px; height: 6px; border-radius: 3px; background-color: #6c757d; color: #6c757d; animation: dotFlashing 1.4s infinite linear alternate; animation-delay: 0.5s;"></div>
                            </div>
                            <span class="text-muted" id="${origin}_thinking_text">Thinking...</span>
                        </div>
                    </div>
                </div>
            </div>
        `);
        
        chatMessages.append(userMessage);
        chatMessages.append(thinkingMessage);
        
        // Add CSS for thinking animation
        if (!document.getElementById('thinking-animation-css')) {
            const thinkingCSS = document.createElement('style');
            thinkingCSS.id = 'thinking-animation-css';
            thinkingCSS.textContent = `
                .dot-flashing {
                    position: relative;
                    width: 6px;
                    height: 6px;
                    border-radius: 3px;
                    background-color: #6c757d;
                    color: #6c757d;
                    animation: dotFlashing 1.4s infinite linear alternate;
                    animation-delay: 0.5s;
                }
                .dot-flashing::before, .dot-flashing::after {
                    content: '';
                    display: inline-block;
                    position: absolute;
                    top: 0;
                }
                .dot-flashing::before {
                    left: -10px;
                    width: 6px;
                    height: 6px;
                    border-radius: 3px;
                    background-color: #6c757d;
                    color: #6c757d;
                    animation: dotFlashing 1.4s infinite alternate;
                    animation-delay: 0s;
                }
                .dot-flashing::after {
                    left: 10px;
                    width: 6px;
                    height: 6px;
                    border-radius: 3px;
                    background-color: #6c757d;
                    color: #6c757d;
                    animation: dotFlashing 1.4s infinite alternate;
                    animation-delay: 1s;
                }
                @keyframes dotFlashing {
                    0% {
                        opacity: 0.2;
                    }
                    50%, 100% {
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(thinkingCSS);
        }
    }
    
    // Schedule scroll after user message animation
    setTimeout(() => {
        const chatMessages = $(containerId).find('.chat-messages');
        if (chatMessages.length > 0 && chatMessages[0]) {
            chatMessages.animate({
                scrollTop: chatMessages[0].scrollHeight
            }, 300);
        }
        
        // Clean up animation classes
        cleanupAnimationClasses(origin, 1, 0);
    }, 350); // After user message animation completes
    
    return chatMessages.find('.message-pair').last();
}

// Generalized function to process server responses
function processServerResponses(response, origin, queryText = "", filePrefix = "Export", new_query = true) {
    var containerId = "#" + origin + "_analysis_content";
    
    // Ensure the container exists, if not, create it
    if ($(containerId).length === 0) {
        console.warn(`Container ${containerId} not found, cannot process server responses`);
        return false;
    }
    
    // Ensure chat container is initialized (fallback if not already done)
    if ($(containerId).find('.chat-messages').length === 0) {
        initializeChatContainer(origin);
    }
    
    const chatMessages = $(containerId).find('.chat-messages');
    
    // Clear any placeholder content (e.g., "No messages yet")
    chatMessages.find('.text-center.text-muted').remove();
    
    // If this is a new query, the thinking indicator should already be there
    // Find the current message pair and replace the thinking indicator
    let messageContainer;
    
    if (new_query && chatMessages.find('.thinking-indicator').length > 0) {
        // Replace thinking indicator with actual responses
        messageContainer = chatMessages.find('.message-pair').last();
        messageContainer.find('.thinking-indicator').replaceWith(`
            <div class="assistant-responses">
                <!-- Responses will be added here -->
            </div>
        `);
    } else if (!new_query && chatMessages.find('.message-pair').length > 0) {
        // Adding to existing conversation
        messageContainer = chatMessages.find('.message-pair').last();
    } else {
        // Fallback - create a new assistant message
        const timestamp = new Date().toLocaleTimeString();
        messageContainer = $(`
            <div class="message-pair mb-4">
                <div class="assistant-message">
                    <div class="message-header d-flex justify-content-between align-items-center mb-2">
                        <div class="d-flex align-items-center">
                            <div class="message-avatar bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px; overflow: hidden;">
                                <img src="https://raw.githubusercontent.com/sbi-rostock/AIR/refs/heads/master/LUMINAR/images/Luminar_icon_small.jpg" alt="LUMINAR" style="width: 100%; height: 100%; object-fit: cover;">
                            </div>
                            <span class="fw-bold text-success">LUMINAR Assistant</span>
                        </div>
                        <small class="text-muted">${timestamp}</small>
                    </div>
                    <div class="assistant-responses">
                        <!-- Responses will be added here -->
                    </div>
                </div>
            </div>
        `);
        chatMessages.append(messageContainer);
    }
    
    const responsesContainer = messageContainer.find('.assistant-responses');
    
    // Convert response to array if not already
    const responses = Array.isArray(response) ? response : [response];

    var created_by = now();

    if (response.hasOwnProperty("created_by") == false) {
        response.created_by = "user";
    }
    
    // Check if any response is from LLM to show disclaimer
    const hasLLMResponse = responses.some(resp => resp.created_by === "llm");
    if (hasLLMResponse) {
        const disclaimer = $(`
            <div class="response-item mb-2">
                <div class="alert alert-warning mb-0" role="alert" style="border-radius: 12px; border-top-left-radius: 4px;">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>AI-Generated Content:</strong> The following responses include AI-generated text. While based on disease map content and analyzed data, AI hallucinations are possible.
                    <br>
                    <small class="mt-1 d-block">
                        For deterministic results, use <a href="#" class="alert-link fixed-queries-link" data-origin="${origin}" style="color: #721c24; text-decoration: underline;">pre-defined query examples</a>.
                    </small>
                </div>
            </div>
        `);
        responsesContainer.append(disclaimer);
    }

    // Mark existing messages as already animated to prevent re-animation
    markExistingMessagesAsAnimated(origin);
    
    // Create all response elements first (without adding to DOM)
    const responseElements = [];
    
    // Process each response as a separate item
    responses.forEach((resp, index) => {
        
        if (resp.response_type === "html") {
            // For HTML responses - keep in chat bubble
            const responseItem = $(`
                <div class="response-item mb-2 chat-bubble-animate">
                    <div class="response-content p-2" style="background: #f8f9fa; border-radius: 12px; border-top-left-radius: 4px; border: 1px solid #dee2e6;">
                        ${resp.content}
                    </div>
                </div>
            `);
            responseElements.push(responseItem);
        }

        else if (resp.response_type === "pure_html") {
            const responseItem = $(`
                <div class="response-item mb-2 mt-2 chat-bubble-animate">
                    ${resp.content}
                </div>
            `);
            responseElements.push(responseItem);
        }
        
        else if (resp.response_type === "image") {
            // For image responses - no chat bubble
            const imgContainer = $(`
                <div class="response-item mb-2 chat-bubble-animate">
                    <div class="text-center">
                        <img src="data:image/png;base64,${resp.content}" 
                             class="img-fluid analysis-image" 
                             style="max-width: 100%; height: auto; cursor: pointer; border-radius: 8px;" 
                             alt="Analysis Result">
                        <p class="mt-2 text-muted small">
                            <i class="fas fa-expand-arrows-alt me-1"></i>Click to enlarge
                        </p>
                    </div>
                </div>
            `);
            responseElements.push(imgContainer);
            
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
                      <img src="data:image/png;base64,${resp.content}" style="max-width: 100%; max-height: 100%;" alt="Analysis Result">
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

        else if (resp.response_type === "highlight") {
            var markers = resp.content.map(minerva_id => ({
                modelId: minerva_id[0],
                id: minerva_id[1],
                height: minerva_id[2],
                width: minerva_id[3],
                x: minerva_id[4], 
                y: minerva_id[5],
                value: minerva_id[6]
            }));
            highlightValues(markers, created_by = created_by);
            
            const highlightNotification = $(`
                <div class="response-item mb-2 chat-bubble-animate">
                    <div class="alert alert-info mb-0" style="border-radius: 8px;" title="Values from the analysis and/or data have been added as colored overlays to corresponding elements on the disease map.">
                        <i class="fas fa-map-marker-alt me-2"></i>
                        Highlighted ${markers.length} elements on the disease map
                    </div>
                </div>
            `);
            responseElements.push(highlightNotification);
        }

        else if (resp.response_type === "open_map") {
            minerva.map.openMap({ id: resp.content });
            
            const mapNotification = $(`
                <div class="response-item mb-2 chat-bubble-animate">
                    <div class="alert alert-info mb-0" style="border-radius: 8px;" title="The submap which the results are based on has been automatically opened.">
                        <i class="fas fa-external-link-alt me-2"></i>
                        Opened map with ID: ${resp.content}
                    </div>
                </div>
            `);
            responseElements.push(mapNotification);
        }

        else if (resp.response_type === "search_map") {
            minerva.map.triggerSearch(resp.content);
                        
            const searchNotification = $(`
                <div class="response-item mb-2 chat-bubble-animate">
                    <div class="alert alert-info mb-0" style="border-radius: 8px;">
                        <i class="fas fa-share-alt me-2"></i>
                        Initiated searching for "${resp.content.query}" on the Disease Map.
                    </div>
                </div>
            `);
            responseElements.push(searchNotification);
        }
        else if (resp.response_type === "highlight_edge") {
            var markers = resp.content.map(minerva_id => ({
                modelId: minerva_id[0],
                start: {
                  x: minerva_id[1],
                  y: minerva_id[2],
                },
                end: {
                  x: minerva_id[3],
                  y: minerva_id[4],
                }
            }));
            highlightEdges(markers, created_by);
            
            const edgeNotification = $(`
                <div class="response-item mb-2 chat-bubble-animate">
                    <div class="alert alert-info mb-0" style="border-radius: 8px;">
                        <i class="fas fa-share-alt me-2"></i>
                        Highlighted ${markers.length} connections on the disease map
                    </div>
                </div>
            `);
            responseElements.push(edgeNotification);
        }

        else if (resp.response_type === "highlight_pin") {
            var markers = resp.content.map(minerva_id => ({
                modelId: minerva_id[0],
                x: minerva_id[1],
                y: minerva_id[2],
                number: minerva_id[3],
            }));

            // Sort by pin number ascending
            markers.sort((a, b) => a.number - b.number);

            highlightPins(markers, created_by = created_by);

            const btnStyle = 'padding: 1px 5px; font-size: 10px; line-height: 1.4;';
            const pinNotification = $(`
                <div class="response-item mb-2 chat-bubble-animate">
                    <div class="alert alert-info mb-0 d-flex justify-content-between align-items-center" style="border-radius: 8px;" title="For nodes in the network which the results are based on, a pin has been added to the corresponding element on the disease map.">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-thumbtack me-2"></i>
                            <span>
                                Added ${markers.length} pins to the disease map
                                <span class="pin-nav-status ms-2 small text-muted"></span>
                            </span>
                        </div>
                        <div class="pin-nav-controls d-flex align-items-center gap-1">
                            <button type="button" class="btn btn-outline-secondary pin-nav-refresh" style="${btnStyle}" title="Recreate pins on the map">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                            <div class="btn-group btn-group-sm" role="group" aria-label="Pin navigation">
                                <button type="button" class="btn btn-outline-secondary pin-nav-left" style="${btnStyle}" title="Previous pin">
                                    <i class="fas fa-chevron-left"></i>
                                </button>
                                <button type="button" class="btn btn-outline-secondary pin-nav-right" style="${btnStyle}" title="Next pin">
                                    <i class="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `);

            const $pinAlert = pinNotification.find('.alert');
            const mapPositions = markers.map(m => m.modelId);
            const yxValues = markers.map(m => ({ x: m.x, y: m.y }));
            const pinNumbers = markers.map(m => m.number);

            // Store as data properties for navigation
            $pinAlert.data('mappositions', mapPositions);
            $pinAlert.data('yx', yxValues);
            $pinAlert.data('pinnumbers', pinNumbers);
            $pinAlert.data('markers', markers);
            $pinAlert.data('index', 0);

            const updatePinNavUI = () => {
                const total = ($pinAlert.data('yx') || []).length;
                const idx = Number($pinAlert.data('index') || 0);
                const numbers = $pinAlert.data('pinnumbers') || [];
                $pinAlert.find('.pin-nav-status').text(total > 0 ? `(${Math.min(idx + 1, total)}/${total})` : '');

                const disabled = total <= 1;
                $pinAlert.find('.pin-nav-left, .pin-nav-right').prop('disabled', disabled);
            };

            const openPinAtIndex = (idx) => {
                const positions = $pinAlert.data('mappositions') || [];
                const yx = $pinAlert.data('yx') || [];
                const total = Math.min(positions.length, yx.length);
                if (total === 0) return;

                let nextIdx = Number(idx);
                if (!Number.isFinite(nextIdx)) nextIdx = 0;
                nextIdx = ((nextIdx % total) + total) % total;

                $pinAlert.data('index', nextIdx);
                updatePinNavUI();

                const mapId = positions[nextIdx];
                const center = yx[nextIdx];
                if (mapId == null || center == null) return;

                minerva.map.openMap({ id: mapId });
                minerva.map.fitBounds({
                    x1: center.x - 50,
                    y1: center.y - 50,
                    x2: center.x + 50,
                    y2: center.y + 50
                });
            };

            updatePinNavUI();

            pinNotification.find('.pin-nav-left').on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                openPinAtIndex(Number($pinAlert.data('index') || 0) - 1);
            });

            pinNotification.find('.pin-nav-right').on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                openPinAtIndex(Number($pinAlert.data('index') || 0) + 1);
            });

            pinNotification.find('.pin-nav-refresh').on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                highlightPins($pinAlert.data('markers'), created_by);
            });

            responseElements.push(pinNotification);
        }

        else if (resp.response_type === "alert") {
            const alertNotification = $(`
                <div class="response-item mb-2 chat-bubble-animate">
                    <div class="alert alert-warning mb-0" role="alert" style="border-radius: 8px;">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        ${resp.content}
                    </div>
                </div>
            `);
            responseElements.push(alertNotification);
        }

        else if (resp.response_type === "call_string") {
            // For call string responses - displays content with a copy button for reproducibility
            const callStringHtml = $(`
                <div class="response-item mb-2 chat-bubble-animate">
                    <div class="call-string-container">
                        <div class="d-flex justify-content-between align-items-start mb-1">
                            <div class="fw-bold text-muted small d-flex align-items-center" style="padding-top: 20px;">
                                <i class="fas fa-code me-1"></i>
                                Reproducible Query:
                                <span class="ms-2 reproducible-info-tooltip" title="This is the function call that generated the above response.\nCopy and paste it into a new query to directly reproduce your results by bypassing AI-processing."
                                      style="cursor: help;">
                                    <i class="fas fa-info-circle" style="color: #17a2b8; font-size: 12px;"></i>
                                </span>
                            </div>
                            <button  style="margin-top: 5px;" class="btn btn-sm btn-outline-secondary copy-call-btn" 
                                    data-content="${resp.content.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}" 
                                    title="Copy to clipboard">
                                <i class="fas fa-copy"></i> Copy
                            </button>
                        </div>
                        <div class="call-string-content" >
                            <code style="background-color: white; padding: 12px; border-radius: 8px; display: block; white-space: pre-wrap; word-break: break-all; border: 1px solid #dee2e6;">${resp.content}</code>
                        </div>
                    </div>
                </div>
            `);
            
            responseElements.push(callStringHtml);
            
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

        else if (resp.response_type === "table") {
            // For table responses
            const tableContent = resp.content;
            const tableId = `${origin}_table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; // Unique ID for each table
            
            // Debug logging
            console.log('Table Content:', tableContent);
            
            // Create a container for the table
            const tableHtml = $(`
                <div class="table-response">
                    <div class="table-container" style="width: 100%; overflow-x: auto; font-size: 12px; background-color: white; padding: 10px; border-radius: 8px; border: 1px solid #dee2e6;">
                        <table id="${tableId}" class="display" width="100%" style="margin-bottom: 0;"></table>
                    </div>
                    <div class="table-controls mt-2">
                        <button class="btn btn-sm btn-outline-secondary copy-btn me-2" title="Copy table data">
                            <i class="fas fa-copy me-1"></i>Copy
                        </button>
                        <button class="btn btn-sm btn-outline-secondary csv-btn me-2" title="Download as CSV">
                            <i class="fas fa-file-csv me-1"></i>CSV
                        </button>
                        <button class="btn btn-sm btn-outline-secondary tsv-btn" title="Download as TSV">
                            <i class="fas fa-file-alt me-1"></i>TSV
                        </button>
                    </div>
                </div>
            `);
            
            const tableResponseItem = $(`
                <div class="response-item mb-2 chat-bubble-animate">
                </div>
            `);
            tableResponseItem.append(tableHtml);
            
            // Initialize DataTable immediately before animation
            const columns = tableContent.columns.map((col, index) => {
                if (index === 0) {
                    return {
                        data: index,
                        title: col,
                        render: (data, type, row) => {
                            const minervaIds = row[row.length - 1];
                            return minervaIds && minervaIds.length > 0 ? 
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

            // Initialize DataTable immediately so content is visible during animation
            try {

                document.addEventListener('air:response:visible', function onVisible(e) {

                    const scope = e.detail?.el[0] || document;

                    const el = scope.querySelector(`#${tableId}`);
                    if (!el || !el.isConnected) return;

                    document.removeEventListener('air:response:visible', onVisible);
                    const $table = $(el);

                    const dt = $table.DataTable({
                        data: tableContent.data,
                        columns: columns.slice(0, -1),
                        dom: "<'top'<'dt-length'l><'dt-search'f>>" +
                            "<'clear'>" +
                            "rt" +
                            "<'bottom'ip><'clear'>",
                        scrollY: '300px',
                        scrollX: true,
                        paging: true,
                        searching: true,
                        deferRender: true,
                        autoWidth: false,
                        destroy: true,
                        initComplete: function(settings, json) {
                            console.log('DataTable initialized:', {
                                tableId: tableId,
                                rowCount: this.api().rows().count(),
                                columnCount: this.api().columns().count()
                            });
                        }
                    });

                    // final width fix after CSS animation ends
                    $table.closest('.response-item').one('transitionend animationend', () => {
                        dt.columns.adjust().draw(false);
                    });
                                    
                    // Bind button events immediately
                    tableHtml.find('.copy-btn').on('click', function() {
                        copyContent(getDTExportString(table));
                        $(this).removeClass('btn-outline-secondary').addClass('btn-success');
                        $(this).html('<i class="fas fa-check me-1"></i>Copied!');
                        setTimeout(() => {
                            $(this).removeClass('btn-success').addClass('btn-outline-secondary');
                            $(this).html('<i class="fas fa-copy me-1"></i>Copy');
                        }, 2000);
                    });
                    
                    // wire buttons now (and fix the comma arg)
                    tableHtml.find('.csv-btn').on('click', () => {
                        download_data(`${filePrefix}_results.csv`, getDTExportString(dt, ","));
                    });
                    tableHtml.find('.tsv-btn').on('click', () => {
                        download_data(`${filePrefix}_results.txt`, getDTExportString(dt, "\t"));
                    });
                });


                tableHtml.find('.csv-btn').on('click', function() {
                    download_data(`${filePrefix}_results.csv`, getDTExportString(table, seperator = ","));
                });
                
                tableHtml.find('.tsv-btn').on('click', function() {
                    download_data(`${filePrefix}_results.txt`, getDTExportString(table));
                });
                
            } catch (error) {
                console.error('Error initializing DataTable:', error);
                tableHtml.html(`
                    <div class="alert alert-danger mb-0" style="border-radius: 8px;">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Error creating data table: ${error.message}
                    </div>
                `);
            }
            
            responseElements.push(tableResponseItem);
        }
        
        else if (resp.response_type === "chart") {
            // For interactive chart responses
            const chartData = resp.content;
            const chartId = `${origin}_chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const chartHtml = $(`
                <div class="mt-3">
                    <div class="chart-container" style="width: 100%; height: 250px; background-color: white; padding: 15px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <canvas id="${chartId}" style="width: 100%; height: 100%;"></canvas>
                    </div>                
                </div>
            `);
            
            // responseContainer.append(chartHtml);
            
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
                            <i class="fas fa-download me-1"></i>PNG
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
            
            const chartResponseItem = $(`
                <div class="response-item mb-2 chat-bubble-animate">
                </div>
            `);
            chartResponseItem.append(chartHtml);
            responseElements.push(chartResponseItem);
            
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
                document.addEventListener('air:response:visible', function onVisible(e) {
                    const scope = e.detail?.el[0] || document;

                    const canvas = scope.querySelector(`#${chartId}`);
                    if (!canvas || !canvas.isConnected) return;

                    document.removeEventListener('air:response:visible', onVisible);

                    const chart = new Chart(canvas, chartConfig);

                    chartHtml.find('.chart-download-btn').on('click', function () {
                        downloadChartAsPNG(chart, chartData.title || 'Chart');
                    });
                });
                
                // Store chart reference for potential future use
                // responseContainer.data('chart', chart);
                
                // Download handler
                chartHtml.find('.chart-download-btn').on('click', function() {
                    downloadChartAsPNG(chart, chartData.title || 'Chart');
                });
                
            } catch (error) {
                console.error('Error creating chart:', error);
                const chartErrorItem = $(`
                    <div class="response-item mb-2 chat-bubble-animate">
                        <div class="alert alert-danger mb-0" style="border-radius: 8px;">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            Error creating chart: ${error.message}
                        </div>
                    </div>
                `);
                responseElements.push(chartErrorItem);
            }
        }
        else {
            // For any other type, display as text - no chat bubble
            const textResponseItem = $(`
                <div class="response-item mb-2 chat-bubble-animate">
                    <pre style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #dee2e6; margin: 0;">${resp.content || resp.response}</pre>
                </div>
            `);
            responseElements.push(textResponseItem);
        }
    });
    
    // Process all response elements sequentially
    processMessagesSequentially(origin, responseElements).then(() => {
        // Clean up animation classes after all messages are processed
        cleanupAnimationClasses(origin, responseElements.length, 0);
        
        // Reset global flag and hide wait alert
        window.isProcessingResponse = false;
        hideWaitAlert(origin);
    });
    
    return true;
}

// Function to handle auto-expanding text inputs
function setupAutoExpandingInput(inputElement) {
    const input = $(inputElement);
    const originalHeight = input.height();
    
    function adjustHeight() {
        // Reset height to auto to get the correct scrollHeight
        input.css('height', 'auto');
        
        // Calculate new height based on content
        const scrollHeight = input[0].scrollHeight;
        const newHeight = Math.min(Math.max(scrollHeight, 38), 200); // min 38px, max 200px
        
        input.css('height', newHeight + 'px');
        
        // Show/hide scrollbar based on content overflow
        if (scrollHeight > 200) {
            input.css('overflow-y', 'auto');
        } else {
            input.css('overflow-y', 'hidden');
        }
    }
    
    // Handle input events
    input.on('input', adjustHeight);
    
    // Handle focus events
    input.on('focus', function() {
        adjustHeight();
    });
    
    // Handle blur events - return to original size
    input.on('blur', function() {
        setTimeout(() => {
            input.css('height', originalHeight + 'px');
            input.css('overflow-y', 'hidden');
        }, 100); // Small delay to allow for any final input events
    });
    
    // Handle form submission - return to original size
    input.closest('form').on('submit', function() {
        input.css('height', originalHeight + 'px');
        input.css('overflow-y', 'hidden');
    });
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

// Global flag to track when responses are being processed
window.isProcessingResponse = false;

// Add CSS for wobbly buzzing animation and alert popup
if (!document.getElementById('query-prevention-css')) {
    const queryPreventionCSS = document.createElement('style');
    queryPreventionCSS.id = 'query-prevention-css';
    queryPreventionCSS.textContent = `
        .input-buzzing {
            animation: inputBuzz 0.5s ease-in-out;
            border-color: #dc3545 !important;
            box-shadow: 0 0 10px rgba(220, 53, 69, 0.5) !important;
            transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        
        @keyframes inputBuzz {
            0% { transform: translateX(0) rotate(0deg); }
            25% { transform: translateX(-3px) rotate(-1deg); }
            50% { transform: translateX(3px) rotate(1deg); }
            75% { transform: translateX(-2px) rotate(-0.5deg); }
            100% { transform: translateX(0) rotate(0deg); }
        }
        
        .wait-alert {
            position: absolute;
            top: -45px;
            left: 50%;
            transform: translateX(-50%);
            background: #dc3545;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            white-space: nowrap;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: alertPulse 1s ease-in-out infinite;
        }
        
        .wait-alert::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: 5px solid transparent;
            border-top-color: #dc3545;
        }
        
        @keyframes alertPulse {
            0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
            50% { opacity: 0.8; transform: translateX(-50%) scale(1.05); }
        }
        
        .input-container {
            position: relative;
        }
        
        .input-waiting {
            border-color: #ffc107 !important;
            background-color: #fff8e1 !important;
            cursor: text;
            transition: border-color 0.3s ease, background-color 0.3s ease;
        }
        
        .btn-waiting {
            opacity: 0.6;
            cursor: not-allowed;
            transition: opacity 0.3s ease;
        }
    `;
    document.head.appendChild(queryPreventionCSS);
}

// Function to show wait alert and buzzing animation
function showWaitAlert(origin) {
    const input = $(`#${origin}_query_input`);
    const form = input.closest('form');
    
    // Add input-container class to form for positioning
    form.addClass('input-container');
    
    // Add buzzing animation to input
    input.addClass('input-buzzing');
    
    // Create and show wait alert
    const waitAlert = $(`
        <div class="wait-alert">
            <i class="fas fa-clock me-1"></i>Please wait for response to complete
        </div>
    `);
    
    form.append(waitAlert);
    
    // Store reference to alert for later removal
    form.data('wait-alert', waitAlert);
    
    // Remove buzzing animation after 500ms and add waiting state
    setTimeout(() => {
        input.removeClass('input-buzzing');
        input.addClass('input-waiting');
        
        // Also style the submit button to show it's disabled
        const submitBtn = form.find('button[id$="_btn_query"]');
        if (submitBtn.length > 0) {
            submitBtn.addClass('btn-waiting');
        }
    }, 500);
    
    // Make alert dismissible by clicking anywhere
    $(document).one('click.waitAlert', function(e) {
        if (!$(e.target).closest('.wait-alert').length) {
            hideWaitAlert(origin);
        }
    });
}

// Function to hide wait alert and buzzing animation
function hideWaitAlert(origin) {
    const input = $(`#${origin}_query_input`);
    const form = input.closest('form');
    
    // Remove buzzing animation and waiting state (in case they're still active)
    input.removeClass('input-buzzing input-waiting');
    
    // Remove button waiting state
    const submitBtn = form.find('button[id$="_btn_query"]');
    if (submitBtn.length > 0) {
        submitBtn.removeClass('btn-waiting');
    }
    
    // Remove wait alert
    const waitAlert = form.data('wait-alert');
    if (waitAlert) {
        waitAlert.remove();
        form.removeData('wait-alert');
    }
    
    // Remove input-container class
    form.removeClass('input-container');
    
    // Remove the click event handler
    $(document).off('click.waitAlert');
}

function getContextData() {
    // Gather any necessary context data for the query
    // This is a placeholder function and should be customized as needed
    open_map_id = minerva.map.data.getOpenMapId();
    overlays = minerva.overlays.data.getDataOverlays();
    open_overlays = minerva.overlays.data.getVisibleDataOverlays()
    open_overlays_ids = open_overlays.map(overlay => overlay.id);

    open_map = null;
    for(var map of air_data.submaps){
        if (map.id == open_map_id){
            open_map = {
                "id": map.id,
                "name": map.name,
                "description": map.description,
            };
            break;
        }
    }



    summary = `On submitting the query, the user is viewing the map ${open_map.name} (ID: ${open_map.id})` 
    
    if (open_map.description) {
        summary += ` with Description: ${open_map.description}.`;
    }

    summary += `\n`;

    if (overlays.length > 0) {
        summary += `The following overlays are available  to the user:\n`;
        for(var overlay of overlays){
            summary += `${overlay.name} (ID: ${overlay.id})`;

            if (overlay.description) {
                summary += ` with Description: ${overlay.description}; `;
            } else {
                summary += `; `;
            }

            if (open_overlays_ids.includes(overlay.id)) {
                summary += `The overlay is currently visible. `;
            } else {
                summary += `The overlay is currently hidden. `;
            }

            summary += `\n`;
        }
    }

    return summary;

}

async function multi_agent_query(origin, queryText, correct_query = false) {

    if (!queryText) return;

    const reasoningLevel = parseInt($(`#${origin}_reasoning_level`).val(), 10) || 3;
    
    // Check if already processing a response
    if (window.isProcessingResponse) {
        showWaitAlert(origin);
        return;
    }
    
    try {
        var btn_text = await disablebutton(`${origin}_btn_query`);
        
        // Add thinking indicator immediately
        addThinkingIndicator(origin, queryText);
        
        // Clear the input and reset height
        $(`#${origin}_query_input`).val('').css('height', '38px').css('overflow-y', 'hidden');

        let responses = await getDataFromServer(
            `sylobio/query_llm`,
            { query: queryText, summarize: false, reasoning: reasoningLevel, origin, step: 0, cycle: 0, correct_query: correct_query, context: getContextData() },
            "POST",
            "json"
        );

        let finalized = false;
        while (!finalized) {
            let foundAgentStep = false;
            const responseList = Array.isArray(responses) ? responses : [responses];

            for (const response of responseList) {
                if (response.response_type === "agent_step") {

                    finalized = response.finalized;

                    if (response.content)
                    {
                        $(`#${origin}_thinking_text`).text(response.content ?? "");
                    }
                    
                    if (finalized) {
                        break;
                    }
                    
                    responses = await getDataFromServer(
                        `sylobio/query_llm`,
                        {
                            query: queryText,
                            summarize: false,
                            reasoning: reasoningLevel,
                            origin,
                            step: response.step,
                            cycle: response.cycle,
                            correct_query: correct_query,
                            context: getContextData()
                        },
                        "POST",
                        "json"
                    );

                    foundAgentStep = true;
                }
            }

            if (!foundAgentStep) {
                finalized = true;
            }
        }

        responses = responses.filter(r => r.response_type != "agent_step")

        console.log(responses);
        
        // Use the generalized function to process responses
        processServerResponses(responses, origin, queryText, "analysis");
        
    } catch (err) {
        console.error("Error processing query:", err);
        
        processServerResponses({"response_type": "alert", "content": `Error: ${err.message}`}, origin, queryText, "analysis", true);
    } finally {
        enablebutton(`${origin}_btn_query`, btn_text);
        
        // Reset global flag and hide wait alert in case of error
        if (window.isProcessingResponse) {
            window.isProcessingResponse = false;
            // Note: hideWaitAlert is called from processServerResponses when successful
        }
    }
}