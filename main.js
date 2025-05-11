// Main JavaScript for Load Shedding Control System

// DOM Elements
const manualToggle = document.getElementById('manual-toggle');
const themeToggle = document.getElementById('theme-toggle');
const acToggle = document.getElementById('ac-toggle');
const lightingToggle = document.getElementById('lighting-toggle');
const heaterToggle = document.getElementById('heater-toggle');

// Status elements
const acStatusLed = document.getElementById('ac-status-led');
const lightingStatusLed = document.getElementById('lighting-status-led');
const heaterStatusLed = document.getElementById('heater-status-led');

// Load value elements
const acLoadValue = document.getElementById('ac-load-value');
const lightingLoadValue = document.getElementById('lighting-load-value');
const heaterLoadValue = document.getElementById('heater-load-value');
const totalLoadValue = document.getElementById('total-load-value');

const endpoints = {
  acLoadValue: "https://blynk.cloud/external/api/get?token=h-wpP2eYFG0bxHR3U0dik6jzsC_9xHDb&V0",
  heaterLoadValue: "https://blynk.cloud/external/api/get?token=h-wpP2eYFG0bxHR3U0dik6jzsC_9xHDb&V1",
  lightingLoadValue: "https://blynk.cloud/external/api/get?token=h-wpP2eYFG0bxHR3U0dik6jzsC_9xHDb&V2",
  manualMode: "https://blynk.cloud/external/api/get?token=h-wpP2eYFG0bxHR3U0dik6jzsC_9xHDb&V3",
  ac: "https://blynk.cloud/external/api/get?token=h-wpP2eYFG0bxHR3U0dik6jzsC_9xHDb&V4",
  heater: "https://blynk.cloud/external/api/get?token=h-wpP2eYFG0bxHR3U0dik6jzsC_9xHDb&V5",
  lighting: "https://blynk.cloud/external/api/get?token=h-wpP2eYFG0bxHR3U0dik6jzsC_9xHDb&V6"
}

// System state
const system = {
  manualControl: false,
  darkMode: false,
  loads: {
    ac: { status: false, power: 0, unit: 'kW' },
    lighting: { status: false, power: 0, unit: 'W' },
    heater: { status: false, power: 0, unit: 'W' }
  }
};

// Event Listeners
manualToggle.addEventListener('click', toggleManualControl);
themeToggle.addEventListener('click', toggleTheme);
acToggle.addEventListener('click', () => toggleLoad('ac'));
lightingToggle.addEventListener('click', () => toggleLoad('lighting'));
heaterToggle.addEventListener('click', () => toggleLoad('heater'));

// Initialize the application
function init() {
  console.log('Initializing Load Shedding Control System');
  // First fetch current status and mode
  fetchInitialState();
  // Start polling for load values
  startPolling();
}

// Fetch initial state from server
function fetchInitialState() {
  Promise.all([
    fetch(endpoints.manualMode).then(res => res.text()),
    fetch(endpoints.ac).then(res => res.text()),
    fetch(endpoints.lighting).then(res => res.text()),
    fetch(endpoints.heater).then(res => res.text())
  ])
  .then(([manualMode, ac, lighting, heater]) => {
    system.manualControl = manualMode === "1";
    system.loads.ac.status = ac === "1";
    system.loads.lighting.status = lighting === "1";
    system.loads.heater.status = heater === "1";
    
    // Update UI with fetched state
    updateUIState();
    // Fetch initial power values
    fetchLoadPower();
  })
  .catch(error => {
    console.error('Error fetching initial state: ', error);
    // Still update UI with default values
    updateUIState();
  });
}

// Toggle manual control mode
function toggleManualControl() {
  system.manualControl = manualToggle.checked;
  console.log(`Manual control: ${system.manualControl ? 'Enabled' : 'Disabled'}`);
  
  // Enable or disable load toggles based on manual control setting
  acToggle.disabled = !system.manualControl;
  lightingToggle.disabled = !system.manualControl;
  heaterToggle.disabled = !system.manualControl;

  // API Call: Send manual control status to ESP32
  fetch(`${endpoints.manualMode}=${system.manualControl ? 1 : 0}`)
  .then(res => res.text())
  .then(data => console.log("Setting mode succeeded: ", data))
  .catch(error => console.error('Error setting mode: ', error));
}

// Toggle dark/light theme
function toggleTheme() {
  system.darkMode = themeToggle.checked;
  document.body.classList.toggle('dark-mode', system.darkMode);
  console.log(`Theme: ${system.darkMode ? 'Dark' : 'Light'}`);
}

// Toggle individual load
function toggleLoad(loadType) {
  if (!system.manualControl) return;
  
  const toggle = document.getElementById(`${loadType}-toggle`);
  system.loads[loadType].status = toggle.checked;
  
  console.log(`${loadType} load: ${system.loads[loadType].status ? 'ON' : 'OFF'}`);
  
  // Update UI immediately to give feedback
  updateLoadStatus(loadType);
  
  // API Call: Send load control command to ESP32
  fetch(`${endpoints[loadType]}=${system.loads[loadType].status ? 1 : 0}`)
  .then(res => res.text())
  .then(data => {
    console.log(`${loadType} load toggled successfully:`, data);
    // Refresh power values after toggle
    fetchLoadPower();
  })
  .catch(error => {
    console.error(`Error changing ${loadType} status:`, error);
    // Revert UI if API call fails
    system.loads[loadType].status = !system.loads[loadType].status;
    updateLoadStatus(loadType);
  });
}

// Update load status in UI
function updateLoadStatus(loadType) {
  const statusLed = document.getElementById(`${loadType}-status-led`);
  statusLed.classList.toggle('active', system.loads[loadType].status);
  
  const toggle = document.getElementById(`${loadType}-toggle`);
  toggle.checked = system.loads[loadType].status;
}

// Update total power consumption
function updateTotalLoad() {
  // Convert all powers to watts for consistent calculation
  const totalPowerWatts = 
    (system.loads.ac.status ? parseFloat(system.loads.ac.power) * 1000 : 0) + 
    (system.loads.lighting.status ? parseFloat(system.loads.lighting.power) : 0) + 
    (system.loads.heater.status ? parseFloat(system.loads.heater.power) : 0);
  
  // Format total based on magnitude
  let formattedTotal;
  if (totalPowerWatts >= 1000) {
    formattedTotal = `${(totalPowerWatts / 1000).toFixed(2)} kW`;
  } else {
    formattedTotal = `${Math.round(totalPowerWatts)} W`;
  }
  
  totalLoadValue.textContent = formattedTotal;
}

// Start polling for load values
function startPolling() {
  setInterval(() => {
    // Always fetch current power values
    fetchLoadPower();
    
    // If not in manual mode, also fetch current status
    if (!system.manualControl) {
      fetchLoadStatus();
    }
  }, 5000); // Poll every 5 seconds
}

// Helper function to fetch power endpoints
async function fetchPowerEndpoints() {
  try {
    const acRes = await fetch(endpoints.acLoadValue);
    const heaterRes = await fetch(endpoints.heaterLoadValue);
    const lightingRes = await fetch(endpoints.lightingLoadValue);

    const acLoadValue = await acRes.text();
    const heaterLoadValue = await heaterRes.text();
    const lightingLoadValue = await lightingRes.text();

    return { acLoadValue, heaterLoadValue, lightingLoadValue };
  } catch (err) {
    console.error("Failed to fetch one or more power values:", err);
    return null;
  }
}

// Helper function to fetch status endpoints
async function fetchStatusEndpoints() {
  try {
    const acRes = await fetch(endpoints.ac);
    const heaterRes = await fetch(endpoints.heater);
    const lightingRes = await fetch(endpoints.lighting);

    const ac = await acRes.text();
    const heater = await heaterRes.text();
    const lighting = await lightingRes.text();

    return { ac, heater, lighting };
  } catch (err) {
    console.error("Failed to fetch one or more status values:", err);
    return null;
  }
}

// Fetch power values from ESP32
function fetchLoadPower() {
  console.log('Fetching load power values...');
  
  // Fetch values
  fetchPowerEndpoints()
    .then(res => {
      if (!res) {
        console.warn('Failed to fetch power values.');
        return;
      }
      
      // Update power values in the system state
      updatePowerValues(res);
      // Update the UI with new power values
      updatePowerUI();
      // Calculate and display total load
      updateTotalLoad();
    })
    .catch(err => {
      console.error('Unexpected error in fetchLoadPower:', err);
    });
}

// Fetch load status from ESP32
function fetchLoadStatus() {
  console.log('Fetching load status values...');
  
  fetchStatusEndpoints()
    .then(res => {
      if (!res) {
        console.warn('Failed to fetch status values.');
        return;
      }
      
      // Update status in system state based on API responses
      system.loads.ac.status = res.ac === "1";
      system.loads.lighting.status = res.lighting === "1";
      system.loads.heater.status = res.heater === "1";
      
      // Update UI status indicators
      updateLoadStatus('ac');
      updateLoadStatus('lighting');
      updateLoadStatus('heater');
      
      // Recalculate total load with new status
      updateTotalLoad();
    })
    .catch(err => {
      console.error('Unexpected error in fetchLoadStatus:', err);
    });
}

// Update power values in system state
function updatePowerValues(powerData) {
  // Parse values as floats to ensure calculations work properly
  system.loads.ac.power = parseFloat(powerData.acLoadValue) || 0;
  system.loads.lighting.power = parseFloat(powerData.lightingLoadValue) || 0;
  system.loads.heater.power = parseFloat(powerData.heaterLoadValue) || 0;
}

// Update power display in UI
function updatePowerUI() {
  acLoadValue.textContent = `${system.loads.ac.power} ${system.loads.ac.unit}`;
  lightingLoadValue.textContent = `${system.loads.lighting.power} ${system.loads.lighting.unit}`;
  heaterLoadValue.textContent = `${system.loads.heater.power} ${system.loads.heater.unit}`;
}

// Update the UI to reflect the system state
function updateUIState() {
  // Set all toggles based on system state
  manualToggle.checked = system.manualControl;
  themeToggle.checked = system.darkMode;
  
  // Set theme
  document.body.classList.toggle('dark-mode', system.darkMode);
  
  // Set toggle enablement
  acToggle.disabled = !system.manualControl;
  lightingToggle.disabled = !system.manualControl;
  heaterToggle.disabled = !system.manualControl;
  
  // Update status LEDs and toggles
  updateLoadStatus('ac');
  updateLoadStatus('lighting');
  updateLoadStatus('heater');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);