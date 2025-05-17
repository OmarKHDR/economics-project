// Import required modules
const express = require('express');
const path = require('path');
const cors = require('cors');

// Initialize Express server for local development
const server = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
server.use(cors());

// Parse JSON request bodies
server.use(express.json());

// Serve static files from frontend directory
server.use(express.static('frontend'));


// Redirect all routes to the frontend application
server.get('*', (req, res) => {
  // For local development, we'll just serve the index.html
  // In production, Firebase Hosting will handle this with rewrites
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Load Management System is now available locally`);
});

