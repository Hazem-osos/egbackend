// Universal server file - works for both local and Vercel
const express = require('express');

const app = express();

// Basic middleware with error handling
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration - more permissive for Vercel
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    res.json({
      success: true,
      status: 'healthy',
      message: 'Universal server is working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      vercel: !!process.env.VERCEL
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
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

// Jobs endpoints
app.get('/api/jobs', (req, res) => {
  try {
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
  } catch (error) {
    console.error('Jobs error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling middleware (must be last)
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Export for both local and Vercel
try {
  if (process.env.VERCEL) {
    // Vercel serverless
    const serverless = require('serverless-http');
    module.exports = serverless(app);
  } else {
    // Local development
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
} catch (error) {
  console.error('Export error:', error);
  // Fallback export
  module.exports = app;
}