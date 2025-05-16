// Main JavaScript for Smart Home Dashboard

// This is a placeholder for future functionality
// The smart home dashboard is currently static for demo purposes

document.addEventListener('DOMContentLoaded', function() {
    console.log('Smart Home Dashboard Initialized');
    
    // Simulate real-time data updates
    startSimulatedUpdates();
});

// Simulated sensor data updates for demo purposes
function startSimulatedUpdates() {
    // Update temperature with small variations every 30 seconds
    setInterval(function() {
        const tempElement = document.querySelector('.sensor-card:nth-child(1) .sensor-value');
        if (tempElement) {
            const currentTemp = parseFloat(tempElement.textContent);
            const variation = (Math.random() * 0.6) - 0.3; // -0.3 to +0.3 variation
            const newTemp = (currentTemp + variation).toFixed(1);
            tempElement.textContent = `${newTemp}°C`;
        }
    }, 30000);
    
    // Update humidity with small variations every 45 seconds
    setInterval(function() {
        const humidityElement = document.querySelector('.sensor-card:nth-child(2) .sensor-value');
        if (humidityElement) {
            const currentHumidity = parseInt(humidityElement.textContent);
            const variation = Math.floor(Math.random() * 3) - 1; // -1 to +1 variation
            const newHumidity = Math.min(Math.max(currentHumidity + variation, 30), 70); // Keep between 30-70%
            humidityElement.textContent = `${newHumidity}%`;
        }
    }, 45000);
    
    // Randomly update power usage every minute
    setInterval(function() {
        const powerElement = document.querySelector('.sensor-card:nth-child(6) .sensor-value');
        if (powerElement) {
            const currentPower = parseFloat(powerElement.textContent);
            const variation = (Math.random() * 0.4) - 0.2; // -0.2 to +0.2 variation
            const newPower = Math.max(0.5, (currentPower + variation).toFixed(1));
            powerElement.textContent = `${newPower} kW`;
        }
    }, 60000);
    
    // The rest of the sensors remain static for this demo
}

// Function to add an alert (for future use)
function addAlert(type, title, message) {
    const alertsPanel = document.querySelector('.alerts-panel');
    const emptyState = document.querySelector('.empty-state');
    
    if (emptyState) {
        emptyState.remove();
    }
    
    const alertItem = document.createElement('div');
    alertItem.className = 'alert-item';
    
    let iconClass = 'fa-info-circle';
    let alertClass = 'alert-info';
    
    if (type === 'warning') {
        iconClass = 'fa-exclamation-triangle';
        alertClass = 'alert-warning';
    } else if (type === 'danger') {
        iconClass = 'fa-exclamation-circle';
        alertClass = 'alert-danger';
    }
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    alertItem.innerHTML = `
        <div class="alert-icon ${alertClass}">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="alert-content">
            <div class="alert-title">${title}</div>
            <div class="alert-message">${message}</div>
            <div class="alert-time">${timeString}</div>
        </div>
    `;
    
    alertsPanel.appendChild(alertItem);
}