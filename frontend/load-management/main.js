// Main JavaScript for Load Shedding Control System

// DOM Elements
const manualToggle = document.getElementById('manual-toggle');
const themeToggle = document.getElementById('theme-toggle');
const acToggle = document.getElementById('ac-toggle');
const lightingToggle = document.getElementById('lighting-toggle');
const heaterToggle = document.getElementById('heater-toggle');
const fanToggle = document.getElementById('fan-toggle');
const fanSpeed = document.getElementById('fan-speed');
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

const token = "PV-SPH-oQ5F9hS4qcx9T9f0mP-nceiZH";
const endpoints = {
  values: {
    ac: `https://blynk.cloud/external/api/get?token=${token}&V0`,
    heater: `https://blynk.cloud/external/api/get?token=${token}&V1`,
    lighting: `https://blynk.cloud/external/api/get?token=${token}&V2`,
    fan: `https://blynk.cloud/external/api/get?token=${token}&V7`,
  },
  set: {
    manualMode: `https://blynk.cloud/external/api/update?token=${token}&V3`,
    ac: `https://blynk.cloud/external/api/update?token=${token}&V4`,
    heater: `https://blynk.cloud/external/api/update?token=${token}&V5`,
    lighting: `https://blynk.cloud/external/api/update?token=${token}&V6`,
    fan: `https://blynk.cloud/external/api/update?token=${token}&V7`,
  },
  status: {
    manualMode: `https://blynk.cloud/external/api/get?token=${token}&V3`,
    ac: `https://blynk.cloud/external/api/get?token=${token}&V4`,
    heater: `https://blynk.cloud/external/api/get?token=${token}&V5`,
    lighting: `https://blynk.cloud/external/api/get?token=${token}&V6`,
    fan: `https://blynk.cloud/external/api/get?token=${token}&V7`,
  }
}

// System state
const system = {
  manualControl: false,
  darkMode: false,
  loads: {
    ac: { status: false, power: 0, unit: 'kW' },
    lighting: { status: false, power: 0, unit: 'kW' },
    heater: { status: false, power: 0, unit: 'kW' },
    fan: { status: false, power: 0, unit: 'kW', speed: 0, rawSpeed: 0 }
  }
};

// Constants for fan speed conversion
const FAN_MAX_RAW = 255;

// Helper functions for fan speed conversion
function rawToPercent(rawValue) {
  return Math.round((rawValue / FAN_MAX_RAW) * 100);
}

function percentToRaw(percentValue) {
  return Math.round((percentValue / 100) * FAN_MAX_RAW);
}

// Event Listeners
manualToggle.addEventListener('click', toggleManualControl);
themeToggle.addEventListener('click', toggleTheme);
acToggle.addEventListener('click', () => toggleLoad('ac'));
lightingToggle.addEventListener('click', () => toggleLoad('lighting'));
heaterToggle.addEventListener('click', () => toggleLoad('heater'));
fanToggle.addEventListener('click', () => toggleLoad('fan'));
fanSpeed.addEventListener('input', updateFanSpeed);

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
    fetch(endpoints.status.manualMode).then(res => res.text()),
    fetch(endpoints.status.ac).then(res => res.text()),
    fetch(endpoints.status.lighting).then(res => res.text()),
    fetch(endpoints.status.heater).then(res => res.text()),
    fetch(endpoints.status.fan).then(res => res.text())
  ])
  .then(([manualMode, ac, lighting, heater, fan]) => {
    console.log(`initial status manual=${manualMode}, ac=${ac}, lighting=${lighting}, heater=${heater}, fan=${fan}`);
    system.manualControl = manualMode === "1";
    system.loads.ac.status = ac === "1";
    system.loads.lighting.status = lighting === "1";
    system.loads.heater.status = heater === "1";
    
    // Handle fan with 0-255 value
    const rawFanSpeed = parseInt(fan) || 0;
    system.loads.fan.rawSpeed = rawFanSpeed;
    system.loads.fan.speed = rawToPercent(rawFanSpeed);
    system.loads.fan.status = rawFanSpeed > 0;
    
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
  fanSpeed.disabled = !system.manualControl || !system.loads.fan.status;

  // API Call: Send manual control status to ESP32
  fetch(`${endpoints.set.manualMode}=${system.manualControl ? 1 : 0}`)
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
  
  let value = system.loads[loadType].status ? 1 : 0;
  
  // Special handling for fan - use raw speed value instead of just on/off
  if (loadType === 'fan') {
    if (system.loads[loadType].status) {
      // If turning on, use current raw speed or fetch it if zero
      if (system.loads[loadType].rawSpeed === 0) {
        // Fetch the current fan speed from the API instead of setting to default
        fetch(endpoints.values.fan)
          .then(res => res.text())
          .then(fanValue => {
            const rawSpeed = parseInt(fanValue) || 0;
            // If API also returns 0, use a minimum value to turn it on
            const finalRawSpeed = rawSpeed > 0 ? rawSpeed : FAN_MAX_RAW * 0.2; // 20% as minimum
            
            system.loads.fan.rawSpeed = finalRawSpeed;
            system.loads.fan.speed = rawToPercent(finalRawSpeed);
            
            // Update UI
            fanSpeed.value = system.loads.fan.speed;
            fanSpeedValue.textContent = `${system.loads.fan.speed}%`;
            
            // Send to API
            fetch(`${endpoints.set.fan}=${finalRawSpeed}`)
              .then(res => res.text())
              .then(data => {
                console.log(`Fan turned on with speed: ${finalRawSpeed} (${system.loads.fan.speed}%)`);
                fetchLoadPower();
              })
              .catch(error => console.error('Error setting fan speed:', error));
          })
          .catch(error => {
            console.error('Error fetching fan speed:', error);
            // Fallback to minimum value
            const fallbackRawSpeed = FAN_MAX_RAW * 0.2; // 20% as minimum fallback
            system.loads.fan.rawSpeed = fallbackRawSpeed;
            system.loads.fan.speed = rawToPercent(fallbackRawSpeed);
            
            // Update UI
            fanSpeed.value = system.loads.fan.speed;
            fanSpeedValue.textContent = `${system.loads.fan.speed}%`;
            
            // Send to API
            fetch(`${endpoints.set.fan}=${fallbackRawSpeed}`)
              .then(res => res.text())
              .then(data => {
                console.log(`Fan turned on with fallback speed: ${fallbackRawSpeed} (${system.loads.fan.speed}%)`);
                fetchLoadPower();
              })
              .catch(error => console.error('Error setting fan fallback speed:', error));
          });
        return; // Exit early as we'll handle the API call in the promise chain
      } else {
        // Use existing raw speed
        value = system.loads.fan.rawSpeed;
      }
    } else {
      // If turning off, set to 0
      value = 0;
      system.loads.fan.rawSpeed = 0;
      system.loads.fan.speed = 0;
    }
  }
  
  // API Call: Send load control command to ESP32
  fetch(`${endpoints.set[loadType]}=${value}`)
  .then(res => res.text())
  .then(data => {
    console.log(`${loadType} load toggled successfully status:`, data);
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

// Update fan speed
function updateFanSpeed() {
  if (!system.manualControl) return;
  
  const percentSpeed = parseInt(fanSpeed.value);
  const rawSpeed = percentToRaw(percentSpeed);
  
  system.loads.fan.speed = percentSpeed;
  system.loads.fan.rawSpeed = rawSpeed;
  fanSpeedValue.textContent = `${percentSpeed}%`;
  
  // Update fan status based on speed
  system.loads.fan.status = rawSpeed > 0;
  fanToggle.checked = system.loads.fan.status;
  updateLoadStatus('fan');
  
  console.log(`Fan speed set to: ${percentSpeed}% (raw: ${rawSpeed})`);
  
  // API Call: Send fan speed to ESP32 using raw value
  fetch(`${endpoints.set.fan}=${rawSpeed}`)
  .then(res => res.text())
  .then(data => {
    console.log(`Fan speed updated successfully:`, data);
    // Refresh power values after update
    fetchLoadPower();
  })
  .catch(error => {
    console.error('Error updating fan speed:', error);
  });
}

// Update load status in UI
function updateLoadStatus(loadType) {
  const statusLed = document.getElementById(`${loadType}-status-led`);
  statusLed.classList.toggle('active', system.loads[loadType].status);
  
  const toggle = document.getElementById(`${loadType}-toggle`);
  toggle.checked = system.loads[loadType].status;
  
  // Special handling for fan speed slider
  if (loadType === 'fan') {
    fanSpeed.disabled = !system.manualControl || !system.loads.fan.status;
  }
}

// Update total power consumption
function updateTotalLoad() {
  // Convert all powers to watts for consistent calculation
  const totalPowerWatts = 
    (system.loads.ac.status ? parseFloat(system.loads.ac.power) : 0) + 
    (system.loads.lighting.status ? parseFloat(system.loads.lighting.power) : 0) + 
    (system.loads.heater.status ? parseFloat(system.loads.heater.power) : 0);
  
  // Format total based on magnitude
  let formattedTotal = `${Math.round(totalPowerWatts)} kW`;

  totalLoadValue.textContent = formattedTotal;
}

// Start polling for load values
function startPolling() {
  setInterval(() => {
    // Always fetch current power values
    fetchLoadPower();
    // Also fetch fan speed value
    fetchFanSpeed();
    
    // If not in manual mode, also fetch current status
    if (!system.manualControl) {
      fetchInitialState();
    }
  }, 5000); // Poll every 5 seconds
}

// Helper function to fetch power endpoints
async function fetchPowerEndpoints() {
  try {
    const acRes = await fetch(endpoints.values.ac);
    const heaterRes = await fetch(endpoints.values.heater);
    const lightingRes = await fetch(endpoints.values.lighting);

    const acLoadValue = await acRes.text();
    const heaterLoadValue = await heaterRes.text();
    const lightingLoadValue = await lightingRes.text();

    return { acLoadValue, heaterLoadValue, lightingLoadValue };
  } catch (err) {
    console.error("Failed to fetch one or more power values:", err);
    return null;
  }
}

// Fetch fan speed from ESP32
function fetchFanSpeed() {
  console.log('Fetching fan speed value...');
  
  fetch(endpoints.values.fan)
    .then(res => res.text())
    .then(fanValue => {
      const rawFanSpeed = parseInt(fanValue) || 0;
      const percentFanSpeed = rawToPercent(rawFanSpeed);
      
      // Update fan status and speed in system state
      system.loads.fan.rawSpeed = rawFanSpeed;
      system.loads.fan.speed = percentFanSpeed;
      system.loads.fan.status = rawFanSpeed > 0;
      
      // Update UI elements
      fanSpeed.value = percentFanSpeed;
      fanSpeedValue.textContent = `${percentFanSpeed}%`;
      updateLoadStatus('fan');
      
      // Update the fan load display value
      fanLoadValue.textContent = `${percentFanSpeed}%`;
      
      console.log(`Fan speed updated to: ${percentFanSpeed}% (raw: ${rawFanSpeed})`);
    })
    .catch(error => {
      console.error('Error fetching fan speed:', error);
    });
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
  fanToggle.disabled = !system.manualControl;
  fanSpeed.disabled = !system.manualControl || !system.loads.fan.status;
  
  // Set fan speed slider and value
  fanSpeed.value = system.loads.fan.speed;
  fanSpeedValue.textContent = `${system.loads.fan.speed}%`;
  
  // Update status LEDs and toggles
  updateLoadStatus('ac');
  updateLoadStatus('lighting');
  updateLoadStatus('heater');
  updateLoadStatus('fan');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);