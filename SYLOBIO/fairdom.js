var loaded_data = null;
var selected_item = "";
var added_markers = []
let air_fairdom_container = null;

const ICONS = {
    "investigation": "https://fairdomhub.org/assets/avatars/avatar-investigation-35a43ae47ff29f40a337f4df217b9e406b3d0e959465e5b5e37d1334e56f627f.png",
    "study":         "https://fairdomhub.org/assets/avatars/avatar-study-cf2295264451598f1ffcf0379368bdb8dd86a5f58879d5cc1649ce92767121fb.png",
    "assay":         "https://fairdomhub.org/assets/avatars/avatar-assay-459bd53f15bd3793a7e8b874c77a457012593bdba8f99f10be2a51f4639f6f9a.png",
    "data":          "https://fairdomhub.org/assets/file_icons/small/txt-6dfb7dfdd4042a4fc251a5bee07972dd61df47e8d979cce525a54d8989300218.png",
    // you can replace these with your own icons
  };

async function fairdom() {

  air_fairdom_container = air_data.container.find('#fairdom_tab_content')

    $(
      `

      <button class="btn air_collapsible mt-2" id="fd_collapse_1_btn" type="button" data-bs-toggle="collapse"data-bs-target="#fd_collapse_1" aria-expanded="false" aria-controls="fd_collapse_1">
        1. Log in to your FAIRDOMHub account
      </button>
      <div class="collapse show" id="fd_collapse_1">
        <div class="card card-body">
          <form id="fd_loginForm">
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
        <div class="card card-body">
          <div id="fd_data_treeview" class="treeview">

          </div>

          <div style="text-align: center;">
            <button type="button" id="fd_btn_loaddata" class="air_btn btn btn-block air_disabledbutton mt-4 mb-2">Load Data File</button>
          </div>
        </div>
      </div>
      <button class="btn air_collapsible mt-2 collapsed air_disabledbutton" id="fd_collapse_3_btn" type="button" data-bs-toggle="collapse" data-bs-target="#fd_collapse_3" aria-expanded="false" aria-controls="fd_collapse_3">
        3. Visualize your Data
      </button>
      <div class="collapse" id="fd_collapse_3">
        <div class="card card-body">
          <select class="form-select mb-1 mt-2" id="fd_select_column">
          </select>
          <div class="form-check mb-2">
            <input class="form-check-input" type="checkbox" value="" id="fd_cb_nonmapped">
            <label class="form-check-label" for="fd_cb_nonmapped">
              Include non-mapped entries
            </label>
          </div>
          <div id="table-container" style="width: 100%; max-width: 800px; overflow-x: auto; font-size: 10px;">
            <table id="fd_datatable" class="display" width="100%"></table>
          </div>
        </div>
      </div>


      `
  ).appendTo(air_fairdom_container);

  $("#fd_cb_nonmapped").on('change', highlightcolumn);
  $("#fd_select_column").on('change', highlightcolumn);

  // Handle the login form submission
  air_fairdom_container.on('submit', '#fd_loginForm', async (e) => {
      e.preventDefault(); // Prevent the form from submitting the normal way

      const username = $("#fd_username").val();
      const password = $("#fd_password").val();

      try {
        
          var btn_text = await disablebutton("#fd_btn_submit")
      
          loaded_data = await getDataFromServer("sylobio/login", data = {"username":username, "password":password}, type = "POST")
          loaded_data = JSON.parse(loaded_data)

          if(Object.keys(loaded_data).length == 0)
          {
            alert("No Data Found.")
            return
          }
          console.log(loaded_data);

          var element = document.querySelector('#fd_collapse_1');
          bootstrap.Collapse.getOrCreateInstance(element).hide();
          
          var element = document.querySelector('#fd_collapse_2');
          bootstrap.Collapse.getOrCreateInstance(element).show();

          $("#fd_collapse_2_btn").removeClass("air_disabledbutton");
          
          const treeData = buildJsTreeNodes(loaded_data.investigations, "investigation");

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

          $('#fd_data_treeview').on('select_node.jstree', function (e, data) {
            const node = data.node; 
            // e.g. node.id = "assay-2541"
            const parts = node.id.split("-");
            const itemType = parts[0];  
            const itemId   = parts.slice(1).join("-");
          
            if (itemType === "data") {
              $("#fd_btn_loaddata").removeClass("air_disabledbutton");
              selected_item = itemId
            }
            else
            {
              $("#fd_btn_loaddata").addClass("air_disabledbutton");
              selected_item = ""
            }
          });

          enablebutton("#fd_btn_submit", btn_text)
          
      } catch (err) {
          console.error("Error while logging in:", err);
          alert("An error occurred. See console for details.");
      }
  });

  $('#fd_btn_loaddata').on('click', async function () {
    try {

      var btn_text = await disablebutton("#fd_btn_loaddata")
      
      loaded_data = await getDataFromServer("sylobio/load_data", data = {"id": selected_item}, type = "POST")
      loaded_data = JSON.parse(loaded_data)

      var data = loaded_data["data"]
      var columns = [];

      $("#fd_select_column").empty();              
      $("#fd_select_column").append(
        $("<option selected>").attr("value", -1).text("None")
      );

      $.each(loaded_data["columns"], function(index, key) {
        if (index < loaded_data["columns"].length - 1)
        {
          columns.push({
            data: index,
            title: key,
            render: function(data, type, row, meta) {
              // Create an anchor element with a data attribute containing the id
              return key == "index" && row[row.length - 1]? `<a href="#" class="node_map_link" data-id="${row[row.length - 1]}">${data}</a>` : data;
            }
          });
          if(index > 0)
            $("#fd_select_column").append(
              $("<option>").attr("value", index).text(key)
            );
        }
          
      });
      
      // Initialize DataTables
      $('#fd_datatable').DataTable({
          dom:
            "<'top'<'dt-length'l><'dt-search'f>>" +
            "<'clear'>" +
            "rt" +
            "<'bottom'ip><'clear'>",
          destroy: true,
          data: data,
          columns: columns,
          scrollY: '50vh',  // Optional: vertical scroll
          scrollX: true,    // Optional: horizontal scroll
          paging: true,
          searching: true
      });
      
      bootstrap.Collapse.getOrCreateInstance(document.querySelector('#fd_collapse_1')).hide();
      bootstrap.Collapse.getOrCreateInstance(document.querySelector('#fd_collapse_2')).hide();
      bootstrap.Collapse.getOrCreateInstance(document.querySelector('#fd_collapse_3')).show();
      
      $("#fd_collapse_3_btn").removeClass("air_disabledbutton");

      enablebutton("#fd_btn_loaddata", btn_text)
    } 
    catch (err) {
      console.error("Error while logging in:", err);
      alert("An error occurred. See console for details.");
    }
  })

}

function highlightcolumn() {
  var selected_col = $("#fd_select_column").val();

  for(var marker_id of added_markers)
  {
    minerva.data.bioEntities.removeSingleMarker(marker_id);
  }
  added_markers = []
  if (selected_col == -1)
  {
    return
  }

  var max = $("#fd_cb_nonmapped").prop('checked')? loaded_data["max"] : loaded_data["minerva_max"]
  var id_col = loaded_data["columns"].length - 1
  var new_markers = loaded_data["data"].filter((row) => row[selected_col] != 0 && row[id_col]).map(function (row) {
    var val = row[selected_col];
    var id = JSON.parse(row[id_col]);
    var marker_id = "fd_marker_" + id[1]
    added_markers.push(marker_id)
    return {
      type: 'surface',
      opacity: 0.67,
      x: id[4],
      y: id[5],
      width: id[3],
      height: id[2],
      modelId: id[0],
      id: marker_id,
      color: selected_col.endsWith('_pvalue')? valueToHex(-Math.log10(Math.abs(val)), 5) : valueToHex(val, max) 
    };
  })
  for(var marker of new_markers)
  {
    minerva.data.bioEntities.addSingleMarker(marker);
  }
}

$(document).on('click', '.node_map_link', function(e) {
    e.preventDefault();
    var id = $(this).data('id');
    
    minerva.map.triggerSearch({ query: $(this).text()});
});

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