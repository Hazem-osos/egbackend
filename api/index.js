const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');

// Create Express app
const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS configuration
app.use(cors({
  origin: [
    'https://egseekersfrontend-97jl1ayeu-hazemosama2553-gmailcoms-projects.vercel.app',
    'http://localhost:3000',
    'https://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    message: 'Express API is running on Vercel',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Mock authentication for now
    res.json({
      success: true,
      user: {
        id: '1',
        email: email,
        name: 'Test User',
        role: 'USER'
      },
      token: 'mock-jwt-token'
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required'
      });
    }

    // Mock registration
    res.json({
      success: true,
      user: {
        id: '2',
        email: email,
        name: name,
        role: 'USER'
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Jobs endpoints
app.get('/api/jobs', (req, res) => {
  res.json({
    success: true,
    jobs: [
      {
        id: '1',
        title: 'Sample Job',
        description: 'This is a sample job',
        budget: 1000,
        status: 'open'
      }
    ]
  });
});

app.post('/api/jobs', (req, res) => {
  try {
    const { title, description, budget } = req.body;
    
    if (!title || !description || !budget) {
      return res.status(400).json({
        success: false,
        error: 'Title, description, and budget are required'
      });
    }

    res.json({
      success: true,
      job: {
        id: Date.now().toString(),
        title,
        description,
        budget,
        status: 'open'
      },
      message: 'Job created successfully'
    });
  } catch (error) {
    console.error('Job creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Express error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Export the serverless function
module.exports.handler = serverless(app);