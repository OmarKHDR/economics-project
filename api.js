/**
 * API Module for interfacing with the Blynk Cloud API
 */
const API = (() => {
  const TOKEN = 'h-wpP2eYFG0bxHR3U0dik6jzsC_9xHDb';
  const BASE_URL = 'https://blynk.cloud/external/api';
  
  /**
   * Helper function to handle errors and return JSON response
   * @param {Response} response - The fetch response object
   * @returns {Promise} - Promise that resolves to JSON or rejects with error
   */
  const handleResponse = async (response) => {
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    // Try to parse as JSON if possible
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      // If not JSON, return the raw text
      return text;
    }
  };

  /**
   * Helper function to make a GET request to the API
   * @param {string} url - The full URL to fetch from
   * @returns {Promise} - Promise that resolves to the response data
   */
  const fetchWithRetry = async (url, retries = 3, delay = 1000) => {
    try {
      const response = await fetch(url);
      return await handleResponse(response);
    } catch (error) {
      if (retries > 0) {
        console.warn(`API request failed, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, retries - 1, delay * 1.5);
      }
      console.error('API request failed after multiple retries:', error);
      throw error;
    }
  };

  return {
    /**
     * Get AC power consumption value
     * @returns {Promise<number>} - Promise resolving to AC value
     */
    getACValue: async () => {
      const url = `${BASE_URL}/get?token=${TOKEN}&V0`;
      return fetchWithRetry(url);
    },
    
    /**
     * Get Light power consumption value
     * @returns {Promise<number>} - Promise resolving to Light value
     */
    getLightValue: async () => {
      const url = `${BASE_URL}/get?token=${TOKEN}&V2`;
      return fetchWithRetry(url);
    },
    
    /**
     * Get Heater power consumption value
     * @returns {Promise<number>} - Promise resolving to Heater value
     */
    getHeaterValue: async () => {
      const url = `${BASE_URL}/get?token=${TOKEN}&V1`;
      return fetchWithRetry(url);
    },
    
    /**
     * Toggle remote control mode
     * @param {number} value - 1 for remote control, 0 for automatic
     * @returns {Promise<string>} - Promise resolving to success message
     */
    toggleBlynkMode: async (value) => {
      const url = `${BASE_URL}/update?token=${TOKEN}&V0=${value}`;
      return fetchWithRetry(url);
    },
    
    /**
     * Toggle AC relay
     * @param {number} value - 1 for ON, 0 for OFF
     * @returns {Promise<string>} - Promise resolving to success message
     */
    toggleACRelay: async (value) => {
      const url = `${BASE_URL}/update?token=${TOKEN}&V4=${value}`;
      return fetchWithRetry(url);
    },
    
    /**
     * Toggle Lights relay
     * @param {number} value - 1 for ON, 0 for OFF
     * @returns {Promise<string>} - Promise resolving to success message
     */
    toggleLightsRelay: async (value) => {
      const url = `${BASE_URL}/update?token=${TOKEN}&V6=${value}`;
      return fetchWithRetry(url);
    },
    
    /**
     * Toggle Heater relay 
     * @param {number} value - 1 for ON, 0 for OFF
     * @returns {Promise<string>} - Promise resolving to success message
     */
    toggleHeaterRelay: async (value) => {
      const url = `${BASE_URL}/update?token=${TOKEN}&V5=${value}`;
      return fetchWithRetry(url);
    },
    
    /**
     * Fetch all sensor values at once
     * @returns {Promise<Object>} - Promise resolving to all values
     */
    getAllValues: async () => {
      try {
        const [acValue, lightValue, heaterValue] = await Promise.all([
          API.getACValue(),
          API.getLightValue(),
          API.getHeaterValue()
        ]);
        
        return {
          ac: parseFloat(acValue) || 0,
          light: parseFloat(lightValue) || 0,
          heater: parseFloat(heaterValue) || 0
        };
      } catch (error) {
        console.error('Failed to fetch all sensor values:', error);
        throw error;
      }
    }
  };
})();