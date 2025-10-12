// Ultra-minimal serverless function for testing
const serverless = require('serverless-http');

// Simple Express app
const express = require('express');
const app = express();

// Basic middleware
app.use(express.json());

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'Serverless function is working',
    timestamp: new Date().toISOString()
  });
});

// Export handler
module.exports.handler = serverless(app);
