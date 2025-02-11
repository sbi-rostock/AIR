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
        location.reload();
    }, countdownDuration);

    let message = `Your session is about to expire in 2 Minutes. Do you want to extend the session?`;

    if (window.confirm(message)) {
        clearTimeout(expirationTimeout);

        data = JSON.parse(await getDataFromServer("extend_session", type = "GET"))
        
        if (data.status === 'extended') {
            resetSessionWarningTimer();
        } else {
            alert('Session already expired.');
            location.reload();
        }
    }
    else
    {
        alert('Your session has ended.');
        location.reload();
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
    data.session = air_data.session_token;
    return new Promise((resolve, reject) => {
      $.ajax({
        type: type,
        url: air_data.SBI_SERVER + request,
        contentType: contentType,
        dataType: datatype,
        data: JSON.stringify(data),
        success: function (data) {
          resolve(data);
        },
        error: function (error) {
          reject(error);
        }
      });
    });
  }


function GetProjectHash(project_data) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'POST',
            contentType: 'application/json',
            cors: true,
            secure: true,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            data: JSON.stringify(project_data),
            dataType: 'json',
            url: air_data.SBI_SERVER + 'initialize_session',
            success: function (data) {
                console.log(data["hash"]);
                resolve(data["hash"]);
            },
            error: function (error) {
                reject(error);
            }
        });
    });
}

function initialize_server() {

    minerva = window.parent.minerva;
    GetProjectHash([
        window.parent.location.origin,
        minerva.project.data.getProjectId(),
    ]).then(function (session_token) {
        air_data.session_token = session_token;
        buildPLuginNavigator();
        loadAndExecuteScripts(["fairdom.js"])
        resetSessionWarningTimer();
    }).catch(function (error) {
        console.error("Error while logging in:", error);
    });

}

buildPLuginNavigator = () => {
    air_data.container.find("#stat_spinner").remove();
            
    air_data.container.append(`
            <ul class="air_nav_tabs nav nav-tabs mt-2" id="air_navs" role="tablist" hidden>
                <li class="air_nav_item nav-item" style="width: 50%;">
                    <a class="air_tab active nav-link" id="fairdom_tab" data-bs-toggle="tab" href="#fairdom_tab_content" role="tab" aria-controls="fairdom_tab_content" aria-selected="true">FAIRDOM</a>
                </li>
                <li class="air_nav_item nav-item" style="width: 50%;">
                    <a class="air_tab nav-link" id="airomics_tab" data-bs-toggle="tab" href="#airomics_tab_content" role="tab" aria-controls="airomics_tab_content" aria-selected="true">AirOmics</a>
                </li>                
            </ul>
            <div class="tab-content air_tab_content" id="air_tabs" style="height:calc(100% - 45px);background-color: white;">
                <div class="tab-pane show active" id="fairdom_tab_content" role="tabpanel" aria-labelledby="fairdom_tab">
                </div>
                <div class="tab-pane show" id="airomics_tab_content" role="tabpanel" aria-labelledby="airomics_tab">
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