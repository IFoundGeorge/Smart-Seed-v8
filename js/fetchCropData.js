async function fetchCropData() {
    try {
      const response = await fetch("http://localhost:3000/api/crop_distribution");
      const data = await response.json();
  
      console.log("Fetched Data:", data); // Debug output
  
      if (data.length === 0) {
        console.warn("No crop data found.");
        return;
      }
  
      const labels = data.map(item => item.crop_type);
      const values = data.map(item => item.count);
  
      updatePieChart(labels, values);
    } catch (error) {
      console.error("Error fetching crop data:", error);
    }
  }
  
  // Attach to the window object
  window.fetchCropData = fetchCropData;
  
  document.addEventListener("DOMContentLoaded", () => {
    fetchCropData();
});
