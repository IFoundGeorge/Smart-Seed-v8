let cropChart; // Store the chart instance globally

function updatePieChart(labels, values) {
    const ctx = document.getElementById("myPieChart").getContext("2d");

    // Destroy old chart if it exists (prevents duplicate charts)
    if (cropChart) {
        cropChart.destroy();
    }

    cropChart = new Chart(ctx, {
        type: "doughnut", // or 'pie'
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: ["#4e73df", "#1cc88a", "#36b9cc", "#f6c23e", "#e74a3b"],
                hoverBackgroundColor: ["#2e59d9", "#17a673", "#2c9faf", "#dda20a", "#be2617"],
                hoverBorderColor: "rgba(234, 236, 244, 1)",
            }]
        },
        options: {
            maintainAspectRatio: false,
            tooltips: {
                backgroundColor: "rgb(255,255,255)",
                bodyFontColor: "#858796",
                borderColor: '#dddfeb',
                borderWidth: 1,
                xPadding: 15,
                yPadding: 15,
                displayColors: false,
                caretPadding: 10,
            },
            legend: {
                display: true
            },
            cutoutPercentage: 80,
        }
    });
}
