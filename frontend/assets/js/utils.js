/**
 * Utility functions for the application
 */

/**
 * Generates a SHA-256 hash of the provided string
 * @param {string} str - The string to hash
 * @returns {Promise<string>} - The hex-encoded hash
 */
async function sha256(str) {
  // Convert string to ArrayBuffer
  const buffer = new TextEncoder().encode(str);
  
  // Generate hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Formats a date to a readable string
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export {
  sha256,
  formatDate
}; 