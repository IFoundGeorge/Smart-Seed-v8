document.addEventListener("DOMContentLoaded", function () {
  const areaCtx = document.getElementById("myAreaChart")?.getContext("2d");
  const barCtx = document.getElementById("myChart")?.getContext("2d");

  let areaChart = null;
  let barChart = null;

  function computeSMA(values, windowSize) {
      let sma = [];
      for (let i = 0; i < values.length; i++) {
          if (i < windowSize - 1) {
              sma.push(null);
          } else {
              let sum = 0;
              for (let j = 0; j < windowSize; j++) {
                  sum += values[i - j];
              }
              sma.push(sum / windowSize);
          }
      }
      return sma;
  }

  function computeEMA(values, windowSize) {
      let ema = [];
      let alpha = 2 / (windowSize + 1);
      let prevEMA = values[0];
      ema.push(prevEMA);

      for (let i = 1; i < values.length; i++) {
          let newEMA = alpha * values[i] + (1 - alpha) * prevEMA;
          ema.push(newEMA);
          prevEMA = newEMA;
      }
      return ema;
  }

  function fetchDataAndUpdateChart() {
      fetch("http://localhost:3000/api/data", { cache: "no-store" })
          .then(response => response.json())
          .then(data => {
              console.log("📊 Updated Historical Yield Data:", data);

              let labels = data.map(entry => entry.Date);
              let values = data.map(entry => entry.Yield_kg_per_hectare);
              let smaValues = computeSMA(values, 3);
              let emaValues = computeEMA(values, 3);

              // Reverse only the data (not labels)
              values.reverse();
              smaValues.reverse();
              emaValues.reverse();

              // Destroy previous charts if they exist
              if (areaChart) areaChart.destroy();
              if (barChart) barChart.destroy();

              // Create Area Chart (Line Chart)
              if (areaCtx) {
                  areaChart = new Chart(areaCtx, {
                      type: "line",
                      data: {
                          labels: labels,
                          datasets: [
                              {
                                  label: "Yield (kg per hectare)",
                                  data: values,
                                  borderColor: "blue",
                                  fill: false
                              },
                              {
                                  label: "3-Month Moving Avg (SMA)",
                                  data: smaValues,
                                  borderColor: "red",
                                  borderDash: [5, 5],
                                  fill: false
                              },
                              {
                                  label: "3-Month Moving Avg (EMA)",
                                  data: emaValues,
                                  borderColor: "green",
                                  borderDash: [2, 2],
                                  fill: false
                              }
                          ]
                      },
                      options: {
                          responsive: true,
                          scales: {
                              y: { beginAtZero: true }
                          }
                      }
                  });
              }

              // Create Bar Chart
              if (barCtx) {
                  barChart = new Chart(barCtx, {
                      type: "bar",
                      data: {
                          labels: labels,
                          datasets: [{
                              label: "Average Yield",
                              data: values,
                              backgroundColor: "rgba(75, 192, 192, 0.2)",
                              borderColor: "rgba(75, 192, 192, 1)",
                              borderWidth: 1
                          }]
                      },
                      options: {
                          responsive: true,
                          scales: {
                              y: { beginAtZero: true }
                          }
                      }
                  });
              }
          })
          .catch(error => console.error("❌ Error fetching data:", error));
  }

  // Make function globally accessible
  window.fetchDataAndUpdateChart = fetchDataAndUpdateChart;

  // Call initially after page loads
  fetchDataAndUpdateChart();

  // Auto-refresh every 30 seconds
  if (!window.chartUpdateInterval) {
      window.chartUpdateInterval = setInterval(fetchDataAndUpdateChart, 30000);
  }
});
