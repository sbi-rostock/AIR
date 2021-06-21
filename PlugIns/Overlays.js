(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var css = ".Overlays-container {\n  padding: 10px;\n  background-color: #ffffff;\n}\n.inputfile {\n  font-size: 1.0em;\n  font-weight: 500;\n  color: black;\n  display: inline-block;\n}\n.ol_small_btn {\n  background-color: lightgrey;\n  color: black;\n  width: 90px;\n}\n.ol_small_btn:focus {\n  outline: none;\n  box-shadow: none;\n}\n.btn-group {\n  width: 100%;\n}\n.ol_info-btn {\n  width: 20px;\n  height: 20px;\n  font-size: 0.8em;\n  position: absolute;\n  top: 10%;\n  text-align: center !important;\n  padding: 0;\n}\n.wrapper {\n  text-align: center;\n}\n.clickElementinTable {\n  background-color: transparent;\n  display: inline-block;\n  white-space: nowrap;\n}\n.clickElementinTable body {\n  text-align: center;\n}\n.ol_disabledbutton {\n  pointer-events: none;\n}\n.cbcontainer {\n  margin-left: 0;\n}\n.ol_checkbox_label {\n  margin-bottom: 0px;\n}\n.ol_checkbox_label,\n.ol_checkbox,\ninput[type=checkbox] {\n  vertical-align: middle;\n}\n"; (require("browserify-css").createStyle(css, { "href": "Overlays\\__tmp_minerva_plugin\\css\\styles.css" }, { "insertAt": "bottom" })); module.exports = css;
},{"browserify-css":3}],2:[function(require,module,exports){
require('../css/styles.css');

const pluginName = 'Overlays';
const pluginVersion = '0.9.0';
const minervaProxyServer = 'https://minerva-dev.lcsb.uni.lu/minerva-proxy/';
const globals = {
  specialCharacters: ['+', '#', '*', '~', '%', '&', '$', '§', '"'],
  numberofuserprobes: undefined,
  selected: [],
  allBioEntities: [],
  pickedRandomly: undefined,
  MIMSpeciesLowerCase: [],
  MIMSpecies: [],
  probes: [],
  speciesinsamples: [],
  normalizedExpressionValues: [],
  ExpressionValues: [],
  UsernormalizedExpressionValues: [],
  UserExpressionValues: [],
  PhenotypeResults: [],
  alreadycalculated: false,
  samples: [],
  samplestring: '',
  numberofSamples: 0,
  container: undefined,
  downloadtext: '',
  ol_table: undefined,
  defaultusers: ['anonymous', 'guest', 'guest user'],
  specialCharacters: ['+', '#', '*', '~', '%', '&', '$', '§', '"'],
  guestuser: ['airuser'],
  pvalue: false,
  seperator: "\t",
  user: undefined
};
let $ = window.$;

if ($ === undefined && minerva.$ !== undefined) {
  $ = minerva.$;
} // ******************************************************************************
// ********************* PLUGIN REGISTRATION WITH MINERVA *********************
// ******************************************************************************


let minervaProxy;
let pluginContainer;
let pluginContainerId;
let minervaVersion;

const register = function (_minerva) {
  console.log('registering ' + pluginName + ' plugin');
  $(".tab-content").css('position', 'relative');
  minervaProxy = _minerva;
  pluginContainer = $(minervaProxy.element);
  pluginContainerId = pluginContainer.attr('id');

  if (!pluginContainerId) {
    //the structure of plugin was changed at some point and additional div was added which is the container but does not have any properties (id or height)
    pluginContainerId = pluginContainer.parent().attr('id');
  }

  console.log('minerva object ', minervaProxy);
  console.log('project id: ', minervaProxy.project.data.getProjectId());
  console.log('model id: ', minervaProxy.project.data.getModels()[0].modelId);
  return minerva.ServerConnector.getConfiguration().then(function (conf) {
    minervaVersion = parseFloat(conf.getVersion().split('.').slice(0, 2).join('.'));
    console.log('minerva version: ', minervaVersion);
    initPlugin();
  });
};

const unregister = function () {
  console.log('unregistering ' + pluginName + ' plugin');
  unregisterListeners();
  $('[data-toggle="popover"]').each(function () {
    $(this).popover('dispose');
  });
  return deHighlightAll();
};

const getName = function () {
  return pluginName;
};

const getVersion = function () {
  return pluginVersion;
};
/**
 * Function provided by Minerva to register the plugin
 */


minervaDefine(function () {
  return {
    register: register,
    unregister: unregister,
    getName: getName,
    getVersion: getVersion,
    minWidth: 400,
    defaultWidth: 500
  };
});

function initPlugin() {
  registerListeners();
  initMainPageStructure();
}

function registerListeners() {
  minervaProxy.project.map.addListener({
    object: "overlay",
    type: "onShow",
    callback: onShowListener
  });
  minervaProxy.project.map.addListener({
    object: "overlay",
    type: "onHide",
    callback: onHideListener
  });
  minervaProxy.project.map.addListener({
    dbOverlayName: "search",
    type: "onSearch",
    callback: searchListener
  });
}

function onHideListener(overlay) {
  $('#ol_table').find(`[data='${overlay.id}']`).prop('checked', false);
}

function onShowListener(overlay) {
  $('#ol_table').find(`[data='${overlay.id}']`).prop('checked', true);
}

function unregisterListeners() {
  minervaProxy.project.map.removeAllListeners();
} // ****************************************************************************
// ********************* MINERVA INTERACTION*********************
// ****************************************************************************


function deHighlightAll() {
  return minervaProxy.project.map.getHighlightedBioEntities().then(highlighted => minervaProxy.project.map.hideBioEntity(highlighted));
} // ****************************************************************************
// ********************* PLUGIN STRUCTURE AND INTERACTION*********************
// ****************************************************************************


function initMainPageStructure() {
  globals.container = $('<div class="' + pluginName + '-container" id="ol_plugincontainer"></div>').appendTo(pluginContainer);
  $("#ol_plugincontainer").addClass("ol_disabledbutton");
  minerva.ServerConnector.getLoggedUser().then(function (user) {
    globals.user = user._login.toString().toLowerCase();

    if (globals.defaultusers.includes(globals.user) === true) {
      alert('Waning: You can reate overlays only after sing-in');
    }

    if (globals.guestuser.includes(globals.user) === true) {
      alert("Warning: You're logged in through a public account. Overlays you create are visible to other users if not removed.");
    }

    minervaProxy.project.data.getAllBioEntities().then(function (bioEntities) {
      globals.allBioEntities = bioEntities;
      bioEntities.forEach(e => {
        if (e.constructor.name === 'Alias') {
          globals.MIMSpeciesLowerCase.push(e.getName().toLowerCase());
          globals.MIMSpecies.push(e.getName());
        }
      });
      globals.alreadycalculated = true;
      globals.container.append(`
            <h1>Edit Overlays</h1>
            <table style="width:100%" class="table nowrap table-sm" id="ol_table" cellspacing="0">
                <thead>
                    <tr>
                        <th style="vertical-align: middle;">Select</th>
                        <th style="vertical-align: middle;">Shown</th>
                        <th style="vertical-align: middle;">Overlay</th>
                        <th style="vertical-align: middle;">Creator</th>
                        <th style="vertical-align: middle;">Description</th>
                    </tr>
                </thead>
            </table>
            <div class="mb-4 mt-2">
                    <button type="button" id="ol_selectallbtn" class="ol_small_btn mr-1">Select All</button >
                    <button type="button" id="ol_deselectallbtn" class="ol_small_btn ml-1">Deselect All</button >
            </div>
            <div class="btn-group btn-group-justified">
                <div class="btn-group">
                    <button type="button" id="ol_showselectedbtn" class="btn btn-primary mr-1">Show Selected Overlays</button >
                </div>
                <div class="btn-group">
                    <button type="button" id="ol_hideselectedbtn" class="btn btn-primary ml-1">Hide Selected Overlays</button >
                </div>
            </div>
            <button type="button" id="ol_removeselectedbtn" class="btn btn-primary btn-default btn-block mb-4 mt-2">Remove Selected Overlays</button> 
            
            <hr>
            <h1>Upload Overlays</h1>
            `);
      $('#ol_selectallbtn').click(function () {
        $(".clickCBinTable").each(function () {
          $(this).prop('checked', true);
        });
      });
      $('#ol_deselectallbtn').click(function () {
        $(".clickCBinTable").each(function () {
          $(this).prop('checked', false);
        });
      });
      $('#ol_showselectedbtn').click(function () {
        let text = disablebutton('ol_showselectedbtn');
        showOverlays(getSelectedOVerlays()).finally(rs => {
          enablebtn('ol_showselectedbtn', text);
        });
      });
      $('#ol_hideselectedbtn').click(function () {
        let text = disablebutton('ol_hideselectedbtn');
        hideOverlays(getSelectedOVerlays()).finally(rs => {
          enablebtn('ol_hideselectedbtn', text);
        });
      });
      $('#ol_removeselectedbtn').click(function () {
        let text = disablebutton('ol_removeselectedbtn');
        removeOverlays(getSelectedOVerlays()).finally(r => {
          enablebtn('ol_removeselectedbtn', text);
        });
      });
      globals.container.append(`<div class="row">
            <div class="col-auto">
        <div class="wrapper">
                <button type="button" class="ol_info-btn btn btn-secondary mb-2 ml-1" 
        data-html="true" data-toggle="popover" data-placement="top" title="File Specifications"
        data-content="A tab-seperated .txt file.<br/>First Row contains the sample names.<br/>First Column contains the official gene/molecule symbols/names">
        ?</button>
        </div>
            </div>    
            <div class="col">
                <input id="inputId" type="file" class="inputfile mb-2"/>
            </div>
        </div>`);
      $('#inputId').on('change', function () {
        om_detectfile(false);
      });
      globals.container.append(`
                <select id="TypeSelect" class="selecttype browser-default custom-select mb-2 mt-2">
                <option value="0" selected>No normalization</option>
                <option value="1">Normalize each probe</option>
                <option value="2">Normalize each sample</option>
                </select>
                `);
      $(".dropdown-toggle").dropdown();
      globals.container.append(
      /*html*/
      `
            <div class="mb-2 mt-2" style="width: 270px; margin: 0 auto;">
                <p align="right">
                    <label for="positivecolor">Positive (1) Values:</label>
                    <input class="user-colorvalue" style="width:70px; text-align:center" id="ol-positivecolorvalue" value="FF0000">
                    <input type="color" id="ol-positivecolor" value="#ff0000">
                </p>
                <p align="right">
                    <label for="neutralcolor">Neutral (0) Values:</label>
                    <input class="user-colorvalue" style="width:70px; text-align:center" id="ol-neutralcolorvalue" value="FFFFFF">
                    <input type="color" id="ol-neutralcolor" value="#ffffff">
                </p>
                <p align="right">
                    <label for="negativecolor">Negative (-1) Values:</label>
                    <input class="user-colorvalue" style="width:70px; text-align:center" id="ol-negativecolorvalue" value="0000FF">
                    <input type="color" id="ol-negativecolor" value="#0000ff">
                </p>
            </div>`);
      $('#ol-positivecolor').change(function () {
        $('#ol-positivecolorvalue').val($(this).val());
      });
      $('#ol-neutralcolor').change(function () {
        $('#ol-neutralcolorvalue').val($(this).val());
      });
      $('#ol-negativecolor').change(function () {
        $('#ol-negativecolorvalue').val($(this).val());
      });
      globals.container.append(`
            <div id="ms_mzSelect-container" class="row mb-2 mt-4">
                <div class="col-auto air_select_label" style="padding:0; width: 30%; text-align: right;">
                    <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">File Type:</span>
                </div>
                <div class="col">
                    <select id="om_filetypeSelect" class="browser-default selecttype custom-select">
                        <option value="0" selected>TSV</option>
                        <option value="1">CSV</option>
                    </select>
                </div>
            </div>
            <div class="row mt-4 mb-4">
                <div class="col-auto">
                    <div class="wrapper">
                        <button type="button" class="ol_info-btn btn btn-secondary"
                                data-html="true" data-trigger="hover" data-toggle="popover" data-placement="top" title="Integrating p-Values"
                                data-content="If checked, every second column will be mapped as a p-value for the previous sample column.<br/>">
                            ?
                        </button>
                    </div>
                </div>
                <div class="col">
                    <div class="cbcontainer">
                        <input type="checkbox" class="ol_checkbox" id="om_checkbox_pvalue">
                        <label class="ol_checkbox_label" for="om_checkbox_pvalue">Data has p-values?</label>
                    </div>
                </div>
            </div>
            <div id="pvalue_threshold-container" class="row mb-2">
                <div class="col-auto air_select_label" style="padding:0; width: 50%; text-align: right; ">
                    <span style="margin: 0; display: inline-block; vertical-align: middle; line-height: normal;">Phenotype p-value threshold:</span>
                </div>
                <div class="col">
                    <input type="text" class="textfield" value="0.05" id="pvalue_threshold" onkeypress="return isNumber(event)" />
                </div>
            </div>
            <div class="row mt-4 mb-2">
                <div class="col-auto">
                    <div class="wrapper">
                        <button type="button" class="ol_info-btn btn btn-secondary"
                                data-html="true" data-toggle="popover" data-placement="top" title="Overlays"
                                data-content="If checked, overlays with same name will be ">
                            ?
                        </button>
                    </div>
                </div>
                <div class="cbcontainer col-auto">
                    <input type="checkbox" class="ol_checkbox" id="ol_cb_overrideOverlay" checked>
                    <label class="ol_checkbox_label" for="om_transcriptomics">Override Overlays</label>
                </div>
            </div>`);
      globals.container.append('<button type="button" id="ol_startbtn" class="btn btn-primary btn-default btn-block">Generate Overlays</button>');
      var $note = $(`<div>Note: This will overwrite existing overlays with the same sample names.</div>`);
      globals.container.append($note);
      $("#ol_cb_overrideOverlay").change(function () {
        if (this.checked) {
          $note.remove();
          $("#ol_startbtn").after($note);
        } else {
          $note.remove();
        }
      });
      $('#ol_startbtn').click(function () {
        readUserFile();
      });
      $("#ol_plugincontainer").removeClass("ol_disabledbutton");
      globals.ol_table = $('#ol_table').DataTable({
        "order": [[2, "asc"]],
        scrollX: true,
        autoWidth: true,
        columns: [{
          "width": "10%"
        }, {
          "width": "10%"
        }, null, {
          "width": "15%"
        }, {
          "width": "25%"
        }],
        columnDefs: [{
          orderable: false,
          className: 'dt-center',
          targets: 0
        }, {
          targets: 1,
          className: 'dt-center'
        }, {
          targets: 2,
          className: 'dt-left'
        }, {
          targets: 3,
          className: 'dt-left'
        }, {
          targets: 4,
          className: 'dt-left'
        }]
      });
      $('[data-toggle="popover"]').popover();
      createOverlayTable();
    });
  });
}

function getSelectedOVerlays() {
  let selected = [];
  $(".clickCBinTable").each(function () {
    var id = $(this).attr('data');

    if ($(this).prop('checked') === true) {
      selected.push(id);
    }
  });
  return selected;
}

function createOverlayTable() {
  globals.ol_table.clear();
  var tbl = document.getElementById('ol_table');
  let selectedDict = {};
  $('input[type=checkbox]').each(function () {
    var data = $(this).attr('data');

    if ($(this).attr('name') == "overlayToggle" && typeof data !== typeof undefined && data !== false) {
      selectedDict[data] = $(this).prop('checked');
    }
  });
  var overlays = minervaProxy.project.data.getDataOverlays();

  for (let olCount = 0; olCount < overlays.length; olCount++) {
    var result_row = tbl.insertRow(tbl.rows.length);
    checkBoxCell(result_row, 'th', overlays[olCount].name, overlays[olCount].name, 'center', 'clickCBinTable');
    let cbcell = checkBoxCell(result_row, 'th', "", overlays[olCount].id, 'center', "");
    cbcell.disabled = true;
    cbcell.checked = selectedDict[overlays[olCount].id];
    createTextCell(result_row, 'th', overlays[olCount].name, "", 'left');
    createTextCell(result_row, 'th', overlays[olCount]._creator, "", 'left');
    createTextCell(result_row, 'th', overlays[olCount]._description, "", 'left');
    globals.ol_table.row.add(result_row);
  }

  globals.ol_table.columns.adjust().draw();
}

function checkBoxCell(row, type, text, data, align, classname) {
  var button = document.createElement('input'); // create text node

  button.innerHTML = text;
  button.setAttribute('type', 'checkbox');
  if (classname != "") button.setAttribute('class', classname);
  if (data != "") button.setAttribute('data', data);
  var cell = document.createElement(type); // create text node

  cell.appendChild(button);
  cell.setAttribute('style', 'text-align: ' + align + '; vertical-align: middle;'); // append DIV to the table cell

  row.appendChild(cell); // append DIV to the table cell

  return button;
}

function createTextCell(row, type, text, data, align) {
  var button = document.createElement('span'); // create text node

  button.innerHTML = text;
  if (data != "") button.setAttribute('data', data);
  var cell = document.createElement(type); // create text node

  cell.appendChild(button);
  cell.setAttribute('style', 'text-align: ' + align + '; vertical-align: middle;'); // append DIV to the table cell

  row.appendChild(cell); // append DIV to the table cell

  return button; // append DIV to the table cell
}

$(document).on('click', '.clickElementinTable', function () {
  var sid = parseFloat($(this).attr('data'));
  globals.selected = [];
  globals.allBioEntities.forEach(e => {
    if (e.constructor.name === 'Alias') {
      if (github.phenotypeNames[sid].toLowerCase() === e.getName().toLowerCase()) {
        globals.selected.push(e);
      }
    }
  });
  focusOnSelected();
  highlightSelected(false);
});

function AddOverlays() {
  AddOverlaysPromise().then(r => {
    $("[name='refreshOverlays']").click();
  }).catch(error => alert('Failed to Add Overlays'));
}

function AddOverlaysPromise() {
  return new Promise((resolve, reject) => {
    function ajaxPostQuery(count) {
      return new Promise((resolve, reject) => {
        if (count <= globals.numberofSamples) {
          $.ajax({
            method: 'POST',
            url: minerva.ServerConnector._serverBaseUrl + 'api/projects/' + minervaProxy.project.data.getProjectId() + '/overlays/',
            data: `content=name%09color${contentString(count)}&description=PhenotypeActivity&filename=${globals.samples[count - 1]}.txt&name=${globals.samples[count - 1]}&googleLicenseConsent=true`,
            cookie: 'MINERVA_AUTH_TOKEN=xxxxxxxx',
            success: response => {
              ajaxPostQuery(count + 1).then(r => resolve(response));
            },
            error: response => {
              reject();
            }
          });
        } else {
          resolve('');
        }
      });
    }

    ajaxPostQuery(1).then(pr => {
      $("[name='refreshOverlays']").click();
      setTimeout(() => {
        createOverlayTable();
        resolve('');
      }, 400);
    }).catch(error => {
      reject('');
    });
  });
}

function readUserFile() {
  let text = disablebutton("ol_startbtn");
  setTimeout(() => {
    loadfile($("#ol_cb_overrideOverlay").prop('checked')).then(lf => {
      if (lf != "") {
        alert(lf);
      }

      normalizeExpressionValues().then(ne => {
        removeOverlays(globals.samples).then(r => {
          AddOverlaysPromise().then(ao => {
            if (globals.container.find('.resultscontainer').length > 0) {
              var element = globals.container.find('.resultscontainer')[0];
              element.parentElement.removeChild(element);
            }

            if (!(globals.container.find('.resultscontainer').length > 0)) {
              globals.container.append(`<div class="resultscontainer"><hr>

                        <div class="btn-group btn-group-justified">
                        <div class="btn-group">
                        <button type="button" id="ol_showoverlaybtn" class="ol_btn-showoverlay btn btn-primary mr-1">Show Generated Overlays</button >
                        </div>
                        <div class="btn-group">
                        <button type="button" id="ol_hideoverlaybtn" class="ol_btn-hideoverlay btn btn-primary ml-1">Hide Generated Overlays</button >
                        </div>
                        </div>
                        <button type="button" id="ol_removeoverlaybtn" class="ol_btn-delete  btn btn-primary btn-default btn-block mb-2 mt-2">Remove Generated Overlays</button> 
                        </div>
                        `);
              $('#ol_showoverlaybtn').click(function () {
                let text = disablebutton('ol_showoverlaybtn');
                setTimeout(() => {
                  showOverlays(globals.samples).finally(rs => {
                    enablebtn('ol_showoverlaybtn', text);
                  });
                }, 200);
              });
              $('#ol_hideoverlaybtn').click(function () {
                let text = disablebutton('ol_hideoverlaybtn');
                setTimeout(() => {
                  hideOverlays(globals.samples).finally(rs => {
                    enablebtn('ol_hideoverlaybtn', text);
                  });
                }, 200);
              });
              $('#ol_removeoverlaybtn').click(function () {
                let text = disablebutton('ol_removeoverlaybtn');
                setTimeout(() => {
                  removeOverlays(globals.samples).finally(r => {
                    enablebtn('ol_removeoverlaybtn', text);
                  });
                }, 200);
              });
            }
          }).catch(error => alert('Failed to create overlays.')).finally(r => enablebtn("ol_startbtn", text));
        }).catch(error => {
          alert('Failed to remove old overlays.');
          enablebtn("ol_startbtn", text);
        });
      }).catch(error => {
        alert('Failed to normalize data values.');
        enablebtn("ol_startbtn", text);
      });
    }).catch(error => {
      alert('Could not read the file.');
      enablebtn("ol_startbtn", text);
    });
  }, 400);
}

function disablebutton(id) {
  var $btn = $('#' + id);
  let text = $btn.html();
  $btn.html('<span class="loadingspinner spinner-border spinner-border-sm"></span>');
  $btn.addClass("ol_disabledbutton");
  $("#ol_plugincontainer").addClass("ol_disabledbutton");
  return text;
}

function enablebtn(id, text) {
  var $btn = $('#' + id);
  $btn.html(text);
  $btn.removeClass("ol_disabledbutton");
  $("#ol_plugincontainer").removeClass("ol_disabledbutton");
}

function loadfile(override) {
  return new Promise((resolve, reject) => {
    let existingols = [];
    var overlays = minervaProxy.project.data.getDataOverlays();

    for (let olCount = 0; olCount < overlays.length; olCount++) {
      existingols.push(overlays[olCount].name);
    }

    var resolvemessage = "";
    globals.pvalue = document.getElementById("om_checkbox_pvalue").checked;

    if (globals.pValue && (globals.columnheaders.length - 1) % 2 != 0) {
      reject('Number of p-value columns is different from the sumber of sample columns!');
      return;
    }

    let pvalue_threshold = 1;

    if (globals.pvalue) {
      pvalue_threshold = parseFloat($("#pvalue_threshold").val().replace(',', '.'));

      if (isNaN(pvalue_threshold)) {
        alert("Only (decimal) numbers are allowed as an p-value threshold. p-value threshold was set to 0.05.");
        pvalue_threshold = 0.05;
      }
    }

    var fileToLoad = document.getElementById("inputId").files[0];

    if (!fileToLoad) {
      reject('No file selected.');
    }

    globals.numberofuserprobes = 0;
    var fileReader = new FileReader();

    fileReader.onload = function (fileLoadedEvent) {
      globals.PhenotypeResults = [];
      globals.downloadtext = [];
      globals.speciesinsamples = [];
      globals.ExpressionValues = [];
      globals.samples = [];
      globals.UserExpressionValues = [];
      globals.normalizedExpressionValues = [];
      globals.UsernormalizedExpressionValues = [];
      var datamapped = false;
      var textFromFileLoaded = fileLoadedEvent.target.result;

      if (textFromFileLoaded.trim() == "") {
        reject('The file appears to be empty.');
      }

      var firstline = true;
      textFromFileLoaded.split('\n').forEach(line => {
        if (firstline === true) {
          firstline = false;
          globals.samplestring = line;
          globals.numberofSamples = (line.split(globals.seperator).length - 1) / (globals.pvalue ? 2 : 1);
          var genename = true;
          let even_count = 0;
          line.split(globals.seperator).forEach(s => {
            if (genename === false) {
              even_count++;

              if (even_count % 2 != 0 || globals.pvalue == false) {
                var samplename = s;
                globals.specialCharacters.forEach(c => {
                  samplename = samplename.replace(c, "");
                });
                samplename = samplename.trim();

                if (!override) {
                  let originalname = samplename;
                  let j = 1;

                  while (existingols.includes(samplename)) {
                    samplename = originalname + "(" + j++ + ")";
                  }
                }

                existingols.push(samplename);
                globals.samples.push(samplename);
              }
            } else genename = false;
          });
        } else {
          let breakflag = false;
          globals.numberofuserprobes++;
          var expression = [];
          var isname = true;

          if (line == "") {
            return;
          }

          if (globals.pvalue && line.split(globals.seperator).length != globals.samples.length * 2 + 1 || globals.pvalue == false && line.split(globals.seperator).length > globals.samples.length + 1) {
            var linelengtherror = "Lines in the datafile may have been skipped because of structural issues.";

            if (resolvemessage.includes(linelengtherror) === false) {
              resolvemessage += linelengtherror;
            }

            return;
          }

          let even_count = 0;
          line.split(globals.seperator).forEach(element => {
            if (isname === true) {
              isname = false;
              let name = element.toLowerCase().trim();

              if (globals.MIMSpeciesLowerCase.includes(name) === false) {
                breakflag = true;
              } else {
                datamapped = true;
              }

              if (breakflag === false) {
                expression.push(name);
                globals.speciesinsamples.push(name);
              }
            } else {
              even_count++;

              if (breakflag === false) {
                var number = parseFloat(element.replace(",", ".").trim());

                if (even_count % 2 != 0 || globals.pvalue == false) {
                  if (isNaN(number)) {
                    var numbererror = "Some values could not be read as numbers.";

                    if (resolvemessage.includes(numbererror) === false) {
                      if (resolvemessage != "") {
                        resolvemessage += "\n";
                      }

                      resolvemessage += numbererror;
                    }

                    expression.push(0);
                  } else {
                    expression.push(number);
                  }
                }

                if (even_count % 2 == 0 && globals.pvalue == true) {
                  if (isNaN(number) || number > pvalue_threshold) {
                    expression[expression.length - 1] = 0;
                  }
                }
              }
            }
          });

          if (expression.length === globals.numberofSamples + 1) {
            globals.ExpressionValues.push(expression);
            globals.UserExpressionValues.push(expression);
          }
        }
      });

      if (globals.ExpressionValues.length === 0) {
        if (datamapped === false) {
          reject('No data in the file could be found, read or mapped.');
        } else {
          reject('The data could not be read.');
        }
      } else {
        resolve(resolvemessage);
      }
    };

    fileReader.readAsText(fileToLoad, "UTF-8");
  });
}

function contentString(ID) {
  function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    if (result) {
      return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
    } else {
      throw new Error('Color hex code error!');
    }
  }

  function pickHex(weight) {
    var color1 = hexToRgb($('#ol-neutralcolor').val());
    var color2;

    if (weight < 0) {
      color2 = hexToRgb($('#ol-negativecolor').val());
    } else {
      color2 = hexToRgb($('#ol-positivecolor').val());
    }

    var rgbToHex = function (rgb) {
      var hex = Number(Math.round(rgb)).toString(16);

      if (hex.length < 2) {
        hex = "0" + hex;
      }

      return hex;
    };

    var w2 = Math.abs(weight);
    var w1 = 1 - w2;
    var output = rgbToHex(color1[0] * w1 + color2[0] * w2) + rgbToHex(color1[1] * w1 + color2[1] * w2) + rgbToHex(color1[2] * w1 + color2[2] * w2);
    return output;
  }

  let output = '';
  globals.UsernormalizedExpressionValues.forEach(p => {
    if (!isNaN(p[ID]) && p[ID] != 0) {
      output += `%0A${p[0]}%09%23` + pickHex(p[ID]);
    }
  });
  return output;
}

function removeOverlays(samples) {
  return new Promise((resolve, reject) => {
    function ajaxDeleteQuery(count) {
      return new Promise((resolve, reject) => {
        if (count.length > 0) {
          $.ajax({
            method: 'DELETE',
            url: minerva.ServerConnector._serverBaseUrl + 'api/projects/' + minervaProxy.project.data.getProjectId() + '/overlays/' + count[0].id,
            cookie: 'MINERVA_AUTH_TOKEN=xxxxxxxx',
            success: response => {
              count.splice(0, 1);
              ajaxDeleteQuery(count).then(r => resolve(response));
            }
          });
        } else {
          resolve('');
        }
      });
    }

    hideOverlays(samples = samples).then(rs => {
      setTimeout(getDataOverlays(samples).then(ols => {
        ajaxDeleteQuery(ols).then(dr => {
          $("[name='refreshOverlays']").click();
          setTimeout(() => {
            createOverlayTable();
            resolve('');
          }, 400); //Overlay POST function
        });
      }), 200);
    });
  });
}

function getDataOverlays(samples, all = false) {
  return new Promise((resolve, reject) => {
    var overlays = minervaProxy.project.data.getDataOverlays();

    if (all) {
      resolve(overlays);
    } else {
      let olarray = [];

      for (let olCount = 0; olCount < overlays.length; olCount++) {
        if (samples.includes(overlays[olCount].name) === true) {
          olarray.push(overlays[olCount]);
        }
      }

      resolve(olarray);
    }
  });
}

function hideOverlays(samples = [], all = false) {
  return new Promise((resolve, reject) => {
    var overlays = minervaProxy.project.data.getDataOverlays();

    function hideOverlay(ols) {
      return new Promise((resolve, reject) => {
        if (ols.length > 0) {
          minervaProxy.project.map.hideDataOverlay(ols[0].id).then(r => {
            ols.splice(0, 1);
            hideOverlay(ols).then(s => {
              resolve('');
            });
          });
          ;
        } else {
          resolve('');
        }
      });
    }

    getDataOverlays(samples, all = all).then(ol => {
      hideOverlay(ol).then(rs => {
        $("[name='refreshOverlays']").click();
        setTimeout(() => {
          resolve('');
        }, 400);
      });
    });
  });
}

function showOverlays(samples) {
  return new Promise((resolve, reject) => {
    function showOverlay(ols) {
      return new Promise((resolve, reject) => {
        if (ols.length > 0) {
          minervaProxy.project.map.showDataOverlay(ols[0]).then(r => {
            ols.splice(0, 1);
            showOverlay(ols).then(s => {
              resolve('');
            });
          });
          ;
        } else {
          resolve('');
        }
      });
    }

    getDataOverlays(samples).then(ol => {
      showOverlay(ol).then(rs => {
        $("[name='refreshOverlays']").click();
        setTimeout(() => {
          resolve('');
        }, 400);
      });
    });
  });
}

function normalizeExpressionValues() {
  return new Promise((resolve, reject) => {
    let typevalue = $('.selecttype').val();
    let allmax = 0.0;
    let alreadyincluded = [];
    let samplemaxvalues = [];
    let probemaxvalues = [];

    for (var i = 0; i < globals.numberofSamples; i++) {
      samplemaxvalues.push(0);
    }

    for (var i = 0; i < globals.UserExpressionValues.length; i++) {
      let probemax = 0;

      for (let j = 1; j < globals.UserExpressionValues[i].length; j++) {
        let value = Math.abs(globals.UserExpressionValues[i][j]);
        if (value > allmax) allmax = value;
        if (value > probemax) probemax = value;

        if (j <= globals.numberofSamples) {
          if (value > samplemaxvalues[j - 1]) {
            samplemaxvalues[j - 1] = value;
          }
        }
      }

      probemaxvalues.push(probemax);
    }

    for (var m = 0; m < globals.UserExpressionValues.length; m++) {
      if (globals.UserExpressionValues[m].length != globals.numberofSamples + 1) continue;
      let name = globals.UserExpressionValues[m][0];
      if (alreadyincluded.includes(name) === true) continue;
      let normalizedExpression = [];
      normalizedExpression.push(name);
      alreadyincluded.push(name);
      let max = allmax;

      if (typevalue == 1) {
        max = probemaxvalues[m];
      }

      for (let k = 1; k < globals.UserExpressionValues[m].length; k++) {
        if (typevalue == 2) {
          max = samplemaxvalues[k - 1];
        }

        if (max > 0) {
          normalizedExpression.push(globals.UserExpressionValues[m][k] / max);
        } else {
          normalizedExpression.push(globals.UserExpressionValues[m][k]);
        }
      }

      globals.UsernormalizedExpressionValues.push(normalizedExpression);
    }

    resolve('');
  });
}

function highlightSelected(pickedRandomly = false) {
  minervaProxy.project.map.getHighlightedBioEntities().then(highlighted => {
    minervaProxy.project.map.hideBioEntity(highlighted).then(r => {
      const highlightDefs = [];

      if (pickedRandomly) {
        if (globals.pickedRandomly) {
          highlightDefs.push({
            element: {
              id: globals.pickedRandomly.id,
              modelId: globals.pickedRandomly.getModelId(),
              type: globals.pickedRandomly.constructor.name.toUpperCase()
            },
            type: "SURFACE",
            options: {
              color: '#00FF00',
              opacity: 0.2
            }
          });
        }
      } else {
        globals.selected.forEach(e => {
          if (e.constructor.name === 'Alias') {
            highlightDefs.push({
              element: {
                id: e.id,
                modelId: e.getModelId(),
                type: "ALIAS"
              },
              type: "ICON"
            });
          }
        });
      }

      minervaProxy.project.map.showBioEntity(highlightDefs);
    });
  });
}

function focusOnSelected() {
  function focus(entity) {
    if (entity.constructor.name === 'Alias') {
      minervaProxy.project.map.fitBounds({
        modelId: entity.getModelId(),
        x1: entity.getX(),
        y1: entity.getY(),
        x2: entity.getX() + entity.getWidth(),
        y2: entity.getY() + entity.getHeight()
      });
    } else {
      minervaProxy.project.map.fitBounds({
        modelId: entity.getModelId(),
        x1: entity.getCenter().x,
        y1: entity.getCenter().y,
        x2: entity.getCenter().x,
        y2: entity.getCenter().y
      });
    }
  }

  if (globals.selected.length > 0) {
    minervaProxy.project.map.openMap({
      id: globals.selected[0].getModelId()
    });
    focus(globals.selected[0]);
  }
}

function searchListener(entites) {
  globals.selected = entites[0];
  let str = '';

  if (globals.selected.length > 0) {
    globals.selected.forEach(e => {
      if (e.constructor.name === 'Alias') str += `<div>${e.getName()} - ${e.getElementId()} - ${e._type}</div>`;
    });
  }
}

function om_detectfile(force_seperator) {
  if (document.getElementById("inputId").files.length == 0) {
    return false;
  }

  var fileToLoad = document.getElementById("inputId").files[0];
  var fileReader = new FileReader();
  fileReader.readAsText(fileToLoad, "UTF-8");

  fileReader.onload = function (fileLoadedEvent) {
    var success = false;
    globals.columnheaders = [];
    $("#om_columnSelect").empty();
    var textFromFileLoaded = fileLoadedEvent.target.result;

    if (textFromFileLoaded.trim() == "") {
      return stopfile('The file appears to be empty.');
    }

    var firstline = textFromFileLoaded.split('\n')[0];

    if (!force_seperator) {
      if ((firstline.match(new RegExp(",", "g")) || []).length > (firstline.match(new RegExp("\t", "g")) || []).length) {
        globals.seperator = ",";
        $("#om_filetypeSelect").val(1);
      } else {
        globals.seperator = "\t";
        $("#om_filetypeSelect").val(0);
      }
    }

    var index = 0;
    firstline.split(globals.seperator).forEach(entry => {
      let header = entry;
      globals.specialCharacters.forEach(c => {
        header = header.replace(c, "");
      });
      globals.columnheaders.push(header.trim());
      index++;
    });

    if ((globals.columnheaders.length - 1) % 2 != 0) {
      $('#om_checkbox_pvalue').prop('checked', false);
    } else {
      for (let _header of globals.columnheaders) {
        if (_header.toLowerCase().includes("pvalue")) {
          $('#om_checkbox_pvalue').prop('checked', true);
          break;
        }
      }
    } //let columnSelect = document.getElementById('om_columnSelect');


    for (let i = 0; i < globals.columnheaders.length; i++) {
      if (globals.columnheaders.filter(item => item == globals.columnheaders[i]).length > 1) {
        return stopfile('Headers in first line need to be unique!<br>Column ' + globals.columnheaders[i] + ' occured multiple times.');
      } //columnSelect.options[columnSelect.options.length] = new Option(globals.columnheaders[i], i); 

    }

    ;

    if (globals.columnheaders.length <= 1) {
      return stopfile('Could not read Headers');
    }

    success = true;

    function stopfile(alerttext) {
      if (alerttext != "") alert(alerttext);
      success = false;
      return false;
    }

    return success;
  };
}

function isNumber(evt) {
  evt = evt ? evt : window.event;
  var charCode = evt.which ? evt.which : evt.keyCode;

  if (charCode > 31 && (charCode < 48 || charCode > 57) && charCode != 44 && charCode != 46) {
    return false;
  }

  return true;
}
},{"../css/styles.css":1}],3:[function(require,module,exports){
'use strict';
// For more information about browser field, check out the browser field at https://github.com/substack/browserify-handbook#browser-field.

var styleElementsInsertedAtTop = [];

var insertStyleElement = function(styleElement, options) {
    var head = document.head || document.getElementsByTagName('head')[0];
    var lastStyleElementInsertedAtTop = styleElementsInsertedAtTop[styleElementsInsertedAtTop.length - 1];

    options = options || {};
    options.insertAt = options.insertAt || 'bottom';

    if (options.insertAt === 'top') {
        if (!lastStyleElementInsertedAtTop) {
            head.insertBefore(styleElement, head.firstChild);
        } else if (lastStyleElementInsertedAtTop.nextSibling) {
            head.insertBefore(styleElement, lastStyleElementInsertedAtTop.nextSibling);
        } else {
            head.appendChild(styleElement);
        }
        styleElementsInsertedAtTop.push(styleElement);
    } else if (options.insertAt === 'bottom') {
        head.appendChild(styleElement);
    } else {
        throw new Error('Invalid value for parameter \'insertAt\'. Must be \'top\' or \'bottom\'.');
    }
};

module.exports = {
    // Create a <link> tag with optional data attributes
    createLink: function(href, attributes) {
        var head = document.head || document.getElementsByTagName('head')[0];
        var link = document.createElement('link');

        link.href = href;
        link.rel = 'stylesheet';

        for (var key in attributes) {
            if ( ! attributes.hasOwnProperty(key)) {
                continue;
            }
            var value = attributes[key];
            link.setAttribute('data-' + key, value);
        }

        head.appendChild(link);
    },
    // Create a <style> tag with optional data attributes
    createStyle: function(cssText, attributes, extraOptions) {
        extraOptions = extraOptions || {};

        var style = document.createElement('style');
        style.type = 'text/css';

        for (var key in attributes) {
            if ( ! attributes.hasOwnProperty(key)) {
                continue;
            }
            var value = attributes[key];
            style.setAttribute('data-' + key, value);
        }

        if (style.sheet) { // for jsdom and IE9+
            style.innerHTML = cssText;
            style.sheet.cssText = cssText;
            insertStyleElement(style, { insertAt: extraOptions.insertAt });
        } else if (style.styleSheet) { // for IE8 and below
            insertStyleElement(style, { insertAt: extraOptions.insertAt });
            style.styleSheet.cssText = cssText;
        } else { // for Chrome, Firefox, and Safari
            style.appendChild(document.createTextNode(cssText));
            insertStyleElement(style, { insertAt: extraOptions.insertAt });
        }
    }
};

},{}]},{},[2]);
