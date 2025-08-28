air_data.fairdom = {
    loaded_data: null,
    selected_items: "",
    added_markers: [],
    container: null,
    current_data: null
  }

var air_fairdom = air_data.fairdom


const ICONS = {
  "investigation": "https://fairdomhub.org/assets/avatars/avatar-investigation-35a43ae47ff29f40a337f4df217b9e406b3d0e959465e5b5e37d1334e56f627f.png",
  "study": "https://fairdomhub.org/assets/avatars/avatar-study-cf2295264451598f1ffcf0379368bdb8dd86a5f58879d5cc1649ce92767121fb.png",
  "assay": "https://fairdomhub.org/assets/avatars/avatar-assay-459bd53f15bd3793a7e8b874c77a457012593bdba8f99f10be2a51f4639f6f9a.png",
  "data": "https://fairdomhub.org/assets/file_icons/small/txt-6dfb7dfdd4042a4fc251a5bee07972dd61df47e8d979cce525a54d8989300218.png",
  // you can replace these with your own icons
};

async function fairdom() {
  air_fairdom.container = air_data.container.find('#fairdom_tab_content');
  
  // Remove plugin header element from parent document
  removePluginHeader();
  
  // Maximize plugin container size
  maximizePluginContainer();

  $(
    `
      <button class="btn air_collapsible mt-2 collapsed" id="fd_collapse_1_btn" type="button" data-bs-toggle="collapse" data-bs-target="#fd_collapse_1" aria-expanded="false" aria-controls="fd_collapse_1">
        1. Login to FAIRDOMHub
      </button>
      <div class="collapse show" id="fd_collapse_1">
        <div class="card" style="padding: 1rem;">
          <form id="fd_loginForm">
            <div class="mb-2">
              <label for="fd_project_id" class="form-label">Project ID</label>
              <input type="text" class="form-control" id="fd_project_id">
            </div>
            <div class="mb-2">
              <label for="fd_username" class="form-label">User Name</label>
              <input type="text" class="form-control" id="fd_username">
            </div>
            <div class="mb-2">
              <label for="fd_password" class="form-label">Password</label>
              <input type="password" class="form-control" id="fd_password">
            </div>
            <div style="text-align: center;">
              <button id="fd_btn_submit" type="submit" class="air_btn btn mb-2 mt-2">Submit</button>
            </div>  
          </form>
        </div>
      </div>
      <button class="btn air_collapsible mt-2 collapsed air_disabledbutton" id="fd_collapse_2_btn" type="button" data-bs-toggle="collapse" data-bs-target="#fd_collapse_2" aria-expanded="false" aria-controls="fd_collapse_2">
        2. Select your Data
      </button>
      <div class="collapse" id="fd_collapse_2">
        <div class="card" style="padding: 1rem;">
          <div id="fd_data_treeview" class="treeview">

          </div>

          <div class="form-check mt-4 mb-2" style="display: flex; align-items: center; gap: 5px;">
            <div>
              <input class="form-check-input" type="checkbox" id="fd_cb_pvalues">
              <label class="form-check-label" for="fd_cb_pvalues">
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
            <button type="button" id="fd_btn_loaddata" class="air_btn btn air_disabledbutton mr-2">
              Load Data File
            </button>
            <button type="button" id="fd_btn_refresh" class="air_btn btn">
              ↻ Refresh
            </button>
          </div>
        </div>
      </div>
      <button class="btn air_collapsible mt-2 collapsed air_disabledbutton" id="fd_collapse_3_btn" type="button" data-bs-toggle="collapse" data-bs-target="#fd_collapse_3" aria-expanded="false" aria-controls="fd_collapse_3">
        3. Visualize your Data
      </button>
      <div class="collapse" id="fd_collapse_3">
        <div class="card" style="padding: 1rem;">
          <select class="form-select mb-1 mt-2" id="fd_select_column">
          </select>
          <div class="form-check mb-2">
            <input class="form-check-input" type="checkbox" value="" id="fd_cb_nonmapped">
            <label class="form-check-label" for="fd_cb_nonmapped">
              Normalize by total max in data
            </label>
          </div>
          <div class="form-check mb-2">
            <input class="form-check-input" type="checkbox" value="" id="fd_cb_mapped_only">
            <label class="form-check-label" for="fd_cb_mapped_only">
              Show only mapped entries
            </label>
          </div>
          <div id="table-container" style="width: 100%; max-width: 800px; overflow-x: auto; font-size: 10px;">
            <table id="fd_datatable" class="display" width="100%"></table>
          </div>
        </div>
      </div>


      `
  ).appendTo(air_fairdom.container);

  $("#fd_cb_nonmapped").on('change', highlightFairdomColumn);
  $("#fd_select_column").on('change', highlightFairdomColumn);
  $("#fd_cb_mapped_only").on('change', function() {
      if (air_fairdom.current_data) {
          const processedData = processDataForTable(air_fairdom.current_data, true, $(this).prop('checked'));
          createDataTable('#fd_datatable', processedData.data, processedData.columns);
      }
  });

  // Handle the login form submission
  air_fairdom.container.on('submit', '#fd_loginForm', async (e) => {
      e.preventDefault(); // Prevent the form from submitting the normal way

      const username = $("#fd_username").val();
      const password = $("#fd_password").val();
      const project_id = $("#fd_project_id").val();

      try {
          var btn_text = await disablebutton("fd_btn_submit")
      
          var project_data = await getDataFromServer("sylobio/login", data = {
              "username": username, 
              "password": password,
              "project_id": project_id
          }, type = "POST")
          project_data = JSON.parse(project_data)

          build_project_tree(project_data)

          enablebutton("fd_btn_submit", btn_text)
          
      } catch (err) {
          console.error("Error during FAIRDOM login:", err);
          alert(`Login failed: ${err.message}`);
          enablebutton("fd_btn_submit", btn_text)
      }
  });

  $('#fd_btn_refresh').on('click', async function () {
    try {
        var btn_text = await disablebutton("fd_btn_refresh")
    
        var project_data = await getDataFromServer("sylobio/refresh", data = {}, type = "POST")
        project_data = JSON.parse(project_data)
        
        var treeData = buildJsTreeNodes(project_data.investigations, "investigation");

        $('#fd_data_treeview').jstree(true).settings.core.data = treeData;
        $('#fd_data_treeview').jstree(true).refresh();
        
        enablebutton("fd_btn_refresh", btn_text)
    } catch (err) {
        console.error("Error refreshing FAIRDOM data:", err);
        alert(`Failed to refresh data: ${err.message}`);
        enablebutton("fd_btn_refresh", btn_text)
    }
  })

  $('#fd_btn_loaddata').on('click', async function () {
    try {

        if(air_fairdom.selected_items.length == 0)
          return

        for(var i = 0; i < air_fairdom.selected_items.length; i++)
        {
          var btn_text = await disablebutton("fd_btn_loaddata")
          
          const rawDatasets = await getDataFromServer(
            "sylobio/load_data", 
            {
              "id": air_fairdom.selected_items[i][1], 
              "name": air_fairdom.selected_items[i][0],
              "has_pvalues": $("#fd_cb_pvalues").prop('checked')
            },
            "POST",
            "json",
          )

          // const rawData = JSON.parse(response);
          for(var rawData of rawDatasets)
          {
            addDataToTree('fairdom', rawData);

            if(i == 0)
            {

              const response = await getDataFromServer(
                "sylobio/get_omics_data",
                { data_id: rawData.data_id },
                "POST",
                "json"
              );
              // Store the data ID
              air_fairdom.current_data = response;

              // Setup the data table
              const processedData = processDataForTable(response, true, $("#fd_cb_mapped_only").prop('checked'));
              createDataTable('#fd_datatable', processedData.data, processedData.columns);

              // Setup column selector
              setupColumnSelector('#fd_select_column', response.columns, [response.columns[0]].concat(response.pvalue_columns));
              
              bootstrap.Collapse.getOrCreateInstance(document.querySelector('#fd_collapse_1')).hide();
              bootstrap.Collapse.getOrCreateInstance(document.querySelector('#fd_collapse_2')).hide();
              bootstrap.Collapse.getOrCreateInstance(document.querySelector('#fd_collapse_3')).show();
              
              $("#fd_collapse_3_btn").removeClass("air_disabledbutton");
            }
          }
        }


        enablebutton("fd_btn_loaddata", btn_text)
    } 
    catch (err) {
        console.error("Error loading FAIRDOM data:", err);
        alert(`Failed to load data: ${err.message}`);
        enablebutton("fd_btn_loaddata", btn_text)
    }
  })

  // Setup node map link handling
  setupNodeMapLinks();
}

function build_project_tree(project_data) {
  
  if(Object.keys(project_data).length == 0)
    {
      alert("No Data Found.")
      return
    }
    console.log(project_data);

    var element = document.querySelector('#fd_collapse_1');
    bootstrap.Collapse.getOrCreateInstance(element).hide();
    
    var element = document.querySelector('#fd_collapse_2');
    bootstrap.Collapse.getOrCreateInstance(element).show();

    $("#fd_collapse_2_btn").removeClass("air_disabledbutton");
    
    const treeData = buildJsTreeNodes(project_data.investigations, "investigation");

    if($('#fd_data_treeview').jstree(true))
    {
      $('#fd_data_treeview').jstree(true).settings.core.data = treeData;
      $('#fd_data_treeview').jstree(true).refresh();
    }
    else
    {
      $('#fd_data_treeview').jstree({
        "core": {
        "multiple": false,
        "data": treeData,
        "themes": {
            "dots": true,      // show dots between nodes
            "icons": true      // show icons
        }
        },
        "plugins": ["wholerow"]  // you can add more plugins if needed
      });
      $('#fd_data_treeview').on('select_node.jstree deselect_node.jstree', function (e, data) {


        air_fairdom.selected_items = []
      
        const selectedNodes = $('#fd_data_treeview').jstree('get_selected', true);
        selectedNodes.forEach(function(selectedNode) {
            const parts = selectedNode.id.split("-");
            const itemType = parts[0];  
            const itemId   = parts.slice(1).join("-");
            if (itemType === "data") {
              air_fairdom.selected_items.push([selectedNode.text, itemId])
            }
        });

        if(air_fairdom.selected_items.length > 0)
          $("#fd_btn_loaddata").removeClass("air_disabledbutton");
        else
          $("#fd_btn_loaddata").addClass("air_disabledbutton");


      });
    }
}

function highlightFairdomColumn() {
    highlightColumn({
        selectedColumn: $("#fd_select_column").val(),
        data: air_fairdom.current_data,
        markerArray: air_fairdom.added_markers,
        includeNonMapped: $("#fd_cb_nonmapped").prop('checked'),
        markerPrefix: "fairdom_marker_"
    });
}

// $(document).on('click', '.node_map_link', function(e) {
//     e.preventDefault();
//     var minerva_id = $(this).data('id')

//     minerva.map.triggerSearch({ query: $(this).text(), perfectSearch: true});
    
//     minerva.map.openMap({ id: minerva_id[0] });

//     minerva.map.fitBounds({
//       x1: minerva_id[4],
//       y1: minerva_id[5],
//       x2: minerva_id[4] + minerva_id[3],
//       y2: minerva_id[5] + minerva_id[2]
//     });
// });

function buildJsTreeNodes(obj, typeHint = "", dictKey = "") {
  // Guard: if not an object, return no nodes
  if (!obj || typeof obj !== 'object') {
    return [];
  }

  // Case 1: if obj has a "title", we treat it as a single node
  if (obj.title) {
    // Gather children by recursing into sub-keys (except 'title'/'links')
    const children = [];
    for (const [key, val] of Object.entries(obj)) {
      if (key === 'title' || key === 'links') continue;

      // Guess the next level from the key
      let nextLevel = "data"; // fallback
      if (key.startsWith("stud"))      nextLevel = "study";
      else if (key.startsWith("assa")) nextLevel = "assay";
      else if (key.startsWith("inve")) nextLevel = "investigation";
      else if (key.startsWith("data")) nextLevel = "data";

      // Recurse: pass the 'nextLevel' and the dictionary key if available
      const subNodes = buildJsTreeNodes(val, nextLevel, key);
      children.push(...subNodes);
    }

    // Build one jsTree node for this object
    const node = {
      // Instead of a random string, we use typeHint + "-" + dictKey
      // e.g. "investigation-709", "study-1341", etc.
      id: `${typeHint}-${dictKey}`,
      text: obj.title,
      icon: ICONS[typeHint] || false, // Use your ICONS map or fallback
      children: children,
      state: { opened: true },
      li_attr: {
        class: `fair_jstree` + (typeHint == 'data'? `fair_jstree_li_data`:` fair_jstree_li_isa`)
      },
      a_attr: {
        class: typeHint == 'data'? `fair_jstree_a_data`:`fair_jstree_a_isa`
      }
    };
    return [node];

  } else {
    // Case 2: if there's no "title", then 'obj' is a dictionary like { "709": {...}, "710": {...} }
    // We loop over each entry and recurse
    let nodeArray = [];
    for (const [key, val] of Object.entries(obj)) {
      // Pass the key so that if 'val' has a "title", its node ID will be nextLevel + "-" + key
      const children = buildJsTreeNodes(val, typeHint, key);
      nodeArray.push(...children);
    }
    return nodeArray;
  }
}
