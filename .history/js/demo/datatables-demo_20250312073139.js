$(document).ready(function() {
  fetch('http://localhost:3000/api/farmers')
    .then(response => response.json())
    .then(data => {
      console.log("Farmers data:", data); // Verify data structure in console
      window.farmersData = data; // Store globally

      // Build rows HTML
      let rows = "";
      data.forEach(function(farmer) {
        rows += `<tr data-id="${farmer.id}">
          <td>${farmer.Name || ''}</td>
          <td>${farmer.Location || ''}</td>
          <td>${farmer.Phone_Number || ''}</td>
          <td>${farmer.Crop_Type || ''}</td>
          <td>${farmer.Farm_Size || ''}</td>
          <td>${farmer.Average_Yield || ''}</td>
        </tr>`;
      });

      $("#dataTable tbody").html(rows);

      // Initialize DataTable with createdRow callback
      let table = $("#dataTable").DataTable({
        createdRow: function(row, rowData, dataIndex) {
          // Use the global farmersData to find the matching farmer by id.
          let id = $(row).data("id");
          let farmer = window.farmersData.find(f => parseInt(f.id, 10) === parseInt(id, 10));
          if (farmer && (farmer.deactivated === 1 || farmer.deactivated === "1")) {
            $(row).addClass("deactivated");
          }
        }
      });

      // Row click event for selection and enabling/disabling edit button.
      $('#dataTable tbody').on('click', 'tr', function() {
        $('#dataTable tbody tr').removeClass('selected');
        $(this).addClass('selected');
        const id = parseInt($(this).data('id'), 10);
        const selected = window.farmersData.find(f => parseInt(f.id, 10) === id);
        window.selectedFarmer = selected;

        if (selected && (selected.deactivated === 1 || selected.deactivated === "1")) {
          alert("This farmer is deactivated. Editing is disabled.");
          $("#editButton").prop("disabled", true);
        } else {
          $("#editButton").prop("disabled", false);
        }
      });
    })
    .catch(error => console.error("Error fetching farmers data:", error));
});
