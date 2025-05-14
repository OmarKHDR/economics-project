// Main JavaScript for Load Shedding Control System

// DOM Elements
const manualToggle = document.getElementById('manual-toggle');
const themeToggle = document.getElementById('theme-toggle');
const acToggle = document.getElementById('ac-toggle');
const lightingToggle = document.getElementById('lighting-toggle');
const heaterToggle = document.getElementById('heater-toggle');
const fanToggle = document.getElementById('fan-toggle');
const fanSpeedSlider = document.getElementById('fan-speed-slider');
const fanSpeedValue = document.getElementById('fan-speed-value');

// Status elements
const acStatusLed = document.getElementById('ac-status-led');
const lightingStatusLed = document.getElementById('lighting-status-led');
const heaterStatusLed = document.getElementById('heater-status-led');
const fanStatusLed = document.getElementById('fan-status-led');

// Load value elements
const acLoadValue = document.getElementById('ac-load-value');
const lightingLoadValue = document.getElementById('lighting-load-value');
const heaterLoadValue = document.getElementById('heater-load-value');
const fanLoadValue = document.getElementById('fan-load-value');
const totalLoadValue = document.getElementById('total-load-value');

const endpoints = {
  acLoadValue: "https://blynk.cloud/external/api/get?token=h-wpP2eYFG0bxHR3U0dik6jzsC_9xHDb&V0",
  heaterLoadValue: "https://blynk.cloud/external/api/get?token=h-wpP2eYFG0bxHR3U0dik6jzsC_9xHDb&V1",
  lightingLoadValue: "https://blynk.cloud/external/api/get?token=h-wpP2eYFG0bxHR3U0dik6jzsC_9xHDb&V2",
  fanLoadValue: "https://blynk.cloud/external/api/get?token=h-wpP2eYFG0bxHR3U0dik6jzsC_9xHDb&V7",
  fanSpeedValue: "https://blynk.cloud/external/api/get?token=h-wpP2eYFG0bxHR3U0dik6jzsC_9xHDb&V8",
  manualMode: "https://blynk.cloud/external/api/update?token=h-wpP2eYFG0bxHR3U0dik6jzsC_9xHDb&V3",
  ac: "https://blynk.cloud/external/api/update?token=h-wpP2eYFG0bxHR3U0dik6jzsC_9xHDb&V4",
  heater: "https://blynk.cloud/external/api/update?token=h-wpP2eYFG0bxHR3U0dik6jzsC_9xHDb&V5",
  lighting: "https://blynk.cloud/external/api/update?token=h-wpP2eYFG0bxHR3U0dik6jzsC_9xHDb&V6",
  fan: "https://blynk.cloud/external/api/update?token=h-wpP2eYFG0bxHR3U0dik6jzsC_9xHDb&V9",
  fanSpeed: "https://blynk.cloud/external/api/update?token=h-wpP2eYFG0bxHR3U0dik6jzsC_9xHDb&V8",
  manualModeStatus: "https://blynk.cloud/external/api/get?token=h-wpP2eYFG0bxHR3U0dik6jzsC_9xHDb&V3",
  acStatus: "https://blynk.cloud/external/api/get?token=h-wpP2eYFG0bxHR3U0dik6jzsC_9xHDb&V4",
  heaterStatus: "https://blynk.cloud/external/api/get?token=h-wpP2eYFG0bxHR3U0dik6jzsC_9xHDb&V5",
  lightingStatus: "https://blynk.cloud/external/api/get?token=h-wpP2eYFG0bxHR3U0dik6jzsC_9xHDb&V6",
  fanStatus: "https://blynk.cloud/external/api/get?token=h-wpP2eYFG0bxHR3U0dik6jzsC_9xHDb&V9",
}

// System state
const system = {
  manualControl: false,
  darkMode: false,
  loads: {
    ac: { status: false, power: 0, unit: 'kW' },
    lighting: { status: false, power: 0, unit: 'kW' },
    heater: { status: false, power: 0, unit: 'kW' },
    fan: { status: false, power: 0, speed: 0, unit: 'kW' }
  }
};

// Event Listeners
manualToggle.addEventListener('click', toggleManualControl);
themeToggle.addEventListener('click', toggleTheme);
acToggle.addEventListener('click', () => toggleLoad('ac'));
lightingToggle.addEventListener('click', () => toggleLoad('lighting'));
heaterToggle.addEventListener('click', () => toggleLoad('heater'));
fanToggle.addEventListener('click', () => toggleLoad('fan'));
fanSpeedSlider.addEventListener('input', updateFanSpeedDisplay);
fanSpeedSlider.addEventListener('change', setFanSpeed);

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
    fetch(endpoints.manualModeStatus).then(res => res.text()),
    fetch(endpoints.acStatus).then(res => res.text()),
    fetch(endpoints.lightingStatus).then(res => res.text()),
    fetch(endpoints.heaterStatus).then(res => res.text()),
    fetch(endpoints.fanStatus).then(res => res.text()),
    fetch(endpoints.fanSpeedValue).then(res => res.text())
  ])
  .then(([manualMode, ac, lighting, heater, fan, fanSpeed]) => {
    console.log("initial states", manualMode, ac, lighting, heater, fan, fanSpeed);
    system.manualControl = manualMode === "1";
    system.loads.ac.status = ac === "1";
    system.loads.lighting.status = lighting === "1";
    system.loads.heater.status = heater === "1";
    system.loads.fan.status = fan === "1";
    system.loads.fan.speed = parseInt(fanSpeed) || 0;
    
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
  fanToggle.disabled = !system.manualControl;
  fanSpeedSlider.disabled = !system.manualControl || !system.loads.fan.status;

  // API Call: Send manual control status to ESP32
  fetch(`${endpoints.manualMode}=${system.manualControl ? 1 : 0}`)
  .then(res => res.text())
  .then(data => console.log("Setting mode succeeded: status", data))
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
    console.log(`${loadType} load toggled successfully status:`, data);
    // Refresh power values after toggle
    fetchLoadPower();

    // Enable/disable fan speed slider based on fan status
    if (loadType === 'fan') {
      fanSpeedSlider.disabled = !system.loads.fan.status || !system.manualControl;
      if (!system.loads.fan.status) {
        // Reset fan speed to 0 when turning off
        system.loads.fan.speed = 0;
        fanSpeedSlider.value = 0;
        fanSpeedValue.textContent = "0%";
        fetch(`${endpoints.fanSpeed}=0`)
          .then(res => res.text())
          .then(data => console.log("Fan speed reset to 0%", data))
          .catch(error => console.error('Error resetting fan speed:', error));
      }
    }
  })
  .catch(error => {
    console.error(`Error changing ${loadType} status:`, error);
    // Revert UI if API call fails
    system.loads[loadType].status = !system.loads[loadType].status;
    updateLoadStatus(loadType);
  });
}

// Update fan speed display while slider is being moved
function updateFanSpeedDisplay() {
  if (!system.manualControl || !system.loads.fan.status) return;
  
  const speed = fanSpeedSlider.value;
  fanSpeedValue.textContent = `${speed}%`;
}

// Set fan speed when slider is released
function setFanSpeed() {
  if (!system.manualControl || !system.loads.fan.status) return;
  
  const speed = parseInt(fanSpeedSlider.value);
  system.loads.fan.speed = speed;
  console.log(`Fan speed set to ${speed}%`);
  
  // API Call: Send fan speed to ESP32
  fetch(`${endpoints.fanSpeed}=${speed}`)
    .then(res => res.text())
    .then(data => {
      console.log("Fan speed updated successfully:", data);
      // Refresh power values after setting speed
      fetchLoadPower();
    })
    .catch(error => {
      console.error('Error setting fan speed:', error);
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
    (system.loads.ac.status ? parseFloat(system.loads.ac.power) : 0) + 
    (system.loads.lighting.status ? parseFloat(system.loads.lighting.power) : 0) + 
    (system.loads.heater.status ? parseFloat(system.loads.heater.power) : 0) + 
    (system.loads.fan.status ? parseFloat(system.loads.fan.power) : 0);
  
  // Format total based on magnitude
  let formattedTotal = `${Math.round(totalPowerWatts)} kW`;

  totalLoadValue.textContent = formattedTotal;
}

// Start polling for load values
function startPolling() {
  setInterval(() => {
    // Always fetch current power values
    fetchLoadPower();
    
    // If not in manual mode, also fetch current status
    if (!system.manualControl) {
      fetchInitialState();
    }
  }, 5000); // Poll every 5 seconds
}

// Helper function to fetch power endpoints
async function fetchPowerEndpoints() {
  try {
    const acRes = await fetch(endpoints.acLoadValue);
    const heaterRes = await fetch(endpoints.heaterLoadValue);
    const lightingRes = await fetch(endpoints.lightingLoadValue);
    const fanRes = await fetch(endpoints.fanLoadValue);
    const fanSpeedRes = await fetch(endpoints.fanSpeedValue);

    const acLoadValue = await acRes.text();
    const heaterLoadValue = await heaterRes.text();
    const lightingLoadValue = await lightingRes.text();
    const fanLoadValue = await fanRes.text();
    const fanSpeedValue = await fanSpeedRes.text();

    return { acLoadValue, heaterLoadValue, lightingLoadValue, fanLoadValue, fanSpeedValue };
  } catch (err) {
    console.error("Failed to fetch one or more power values:", err);
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
      // Update fan speed UI
      updateFanSpeedUI(res.fanSpeedValue);
    })
    .catch(err => {
      console.error('Unexpected error in fetchLoadPower:', err);
    });
}

// Update power values in system state
function updatePowerValues(powerData) {
  // Parse values as floats to ensure calculations work properly
  system.loads.ac.power = parseFloat(powerData.acLoadValue) || 0;
  system.loads.lighting.power = parseFloat(powerData.lightingLoadValue) || 0;
  system.loads.heater.power = parseFloat(powerData.heaterLoadValue) || 0;
  system.loads.fan.power = parseFloat(powerData.fanLoadValue) || 0;
  system.loads.fan.speed = parseInt(powerData.fanSpeedValue) || 0;
}

// Update fan speed UI
function updateFanSpeedUI(speed) {
  // Update slider value and text display
  fanSpeedSlider.value = speed;
  fanSpeedValue.textContent = `${speed}%`;
}

// Update power display in UI
function updatePowerUI() {
  acLoadValue.textContent = `${system.loads.ac.power} ${system.loads.ac.unit}`;
  lightingLoadValue.textContent = `${system.loads.lighting.power} ${system.loads.lighting.unit}`;
  heaterLoadValue.textContent = `${system.loads.heater.power} ${system.loads.heater.unit}`;
  fanLoadValue.textContent = `${system.loads.fan.power} ${system.loads.fan.unit}`;
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
  fanToggle.disabled = !system.manualControl;
  fanSpeedSlider.disabled = !system.manualControl || !system.loads.fan.status;
  
  // Update status LEDs and toggles
  updateLoadStatus('ac');
  updateLoadStatus('lighting');
  updateLoadStatus('heater');
  updateLoadStatus('fan');
  
  // Update fan speed slider
  fanSpeedSlider.value = system.loads.fan.speed;
  fanSpeedValue.textContent = `${system.loads.fan.speed}%`;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);