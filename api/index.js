const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration - Allow all origins for now
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    success: true,
    status: 'healthy',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Simple auth endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('Login request received');
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('Missing credentials');
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    console.log('Login successful for:', email);
    // Simple mock response for testing
    res.json({
      success: true,
      user: {
        id: '1',
        email: email,
        name: 'Test User',
        role: 'USER'
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Catch-all route for testing
app.get('*', (req, res) => {
  console.log('Catch-all route hit:', req.path);
  res.json({
    success: true,
    message: 'Serverless function is working',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// Export the serverless function
module.exports.handler = serverless(app);