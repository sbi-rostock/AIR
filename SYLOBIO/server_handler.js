let ENABLE_API_CALLS = true;
let TESTING;

//npm modules
let Chart;
let JSZip;
let FileSaver;
let VCF;
let ttest;
let Decimal;
let cytoscape;
// let jspdf;
var session_token;
let SBI_SERVER = "";

let sessionWarningTimeout;
const sessionWarningDuration = 16 * 60 * 1000;  // 15 minutes
const countdownDuration = 2 * 60 * 1000;  // 2 minutes

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


let minervaProxy;
let pluginContainer;
let pluginContainerId;
let minervaVersion;


function getDataFromServer(request, data = {}, type = "GET", datatype = "text", contentType = 'application/json') {
    return new Promise((resolve, reject) => {
      $.ajax({
        type: type,
        url: SBI_SERVER + session_token + "/" + request,
        contentType: contentType,
        dataType: datatype,
        data: data,
        success: function (data) {
          resolve(data);
        },
        error: function (error) {
          reject(error);
        }
      });
    });
  }

function initialize_server(_minerva, _filetesting, _session_token, _chart, _ttest, _jszip, _filesaver, _vcf, _decimal, _cytoscape, _sbi_server) {

    return new Promise((resolve, reject) => {

        // socket.on('progress', (data) => {
        //     if (data.id === 'abm_progress') {
        //         updateProgress(data.percent, 1, "om_pheno_analyzebtn", text = " Estimating phenotype levels.");
        //     } else if (data.id === 'another_task') {
        //         console.log('Progress from another_task:', data.percent);
        //     }
        // });
    
        minerva.ServerConnector.getLoggedUser().then(function (user) {
            globals.user = user._login.toString().toLowerCase();

            var t0 = 0;
            var t1 = 0;

            cytoscape = _cytoscape;
            Chart = _chart;
            VCF = _vcf;
            JSZip = _jszip;
            FileSaver = _filesaver;
            TESTING = _filetesting;
            minervaProxy = _minerva;
            session_token = _session_token;
            ttest = _ttest;
            Decimal = _decimal;
            // jspdf = _jspdf;
            SBI_SERVER = _sbi_server;
            pluginContainer = $(minervaProxy.element);
            pluginContainerId = pluginContainer.attr('id');
            
            // Start the initial timer
            resetSessionWarningTimer();

            minervaProxy.project.map.addListener({
                dbOverlayName: "search",
                type: "onSearch",
                callback: xp_searchListener
            });        


        });
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

