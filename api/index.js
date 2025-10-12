// Conservative serverless function - loads routes on-demand
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const serverless = require('serverless-http');

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Trust proxy for Vercel
app.set('trust proxy', 1);

// CORS configuration
const allowedOrigins = [
  'https://egseekersfrontend-97jl1ayeu-hazemosama2553-gmailcoms-projects.vercel.app',
  'http://localhost:3000',
  'https://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cache for loaded routes
const routeCache = {};

// Function to load routes on-demand
const loadRoute = (routeName) => {
  if (routeCache[routeName]) {
    return routeCache[routeName];
  }
  
  try {
    const projectRoot = path.join(__dirname, '..');
    const route = require(path.join(projectRoot, 'routes', routeName));
    routeCache[routeName] = route;
    return route;
  } catch (error) {
    console.error(`Error loading route ${routeName}:`, error);
    return null;
  }
};

// Function to load middleware on-demand
const loadMiddleware = (middlewareName) => {
  if (routeCache[middlewareName]) {
    return routeCache[middlewareName];
  }
  
  try {
    const projectRoot = path.join(__dirname, '..');
    const middleware = require(path.join(projectRoot, 'middleware', middlewareName));
    routeCache[middlewareName] = middleware;
    return middleware;
  } catch (error) {
    console.error(`Error loading middleware ${middlewareName}:`, error);
    return null;
  }
};

// Essential routes that are always loaded
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    message: 'Conservative serverless function is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Auth routes (essential for frontend)
app.use('/api/auth', (req, res, next) => {
  const authRoutes = loadRoute('authRoutes');
  if (authRoutes) {
    authRoutes(req, res, next);
  } else {
    res.status(500).json({ success: false, error: 'Auth routes not available' });
  }
});

// User routes (essential for frontend)
app.use('/api/users', (req, res, next) => {
  const auth = loadMiddleware('auth');
  const userRoutes = loadRoute('userRoutes');
  
  if (auth && userRoutes) {
    auth(req, res, (err) => {
      if (err) return res.status(401).json({ success: false, error: 'Unauthorized' });
      userRoutes(req, res, next);
    });
  } else {
    res.status(500).json({ success: false, error: 'User routes not available' });
  }
});

// Jobs routes (essential for frontend)
app.use('/api/jobs', (req, res, next) => {
  const auth = loadMiddleware('auth');
  const jobRoutes = loadRoute('jobRoutes');
  
  if (auth && jobRoutes) {
    auth(req, res, (err) => {
      if (err) return res.status(401).json({ success: false, error: 'Unauthorized' });
      jobRoutes(req, res, next);
    });
  } else {
    res.status(500).json({ success: false, error: 'Job routes not available' });
  }
});

// Dashboard routes (essential for frontend)
app.use('/api/dashboard', (req, res, next) => {
  const auth = loadMiddleware('auth');
  const dashboardRoutes = loadRoute('dashboardRoutes');
  
  if (auth && dashboardRoutes) {
    auth(req, res, (err) => {
      if (err) return res.status(401).json({ success: false, error: 'Unauthorized' });
      dashboardRoutes(req, res, next);
    });
  } else {
    res.status(500).json({ success: false, error: 'Dashboard routes not available' });
  }
});

// Proposals routes (essential for frontend)
app.use('/api/proposals', (req, res, next) => {
  const auth = loadMiddleware('auth');
  const proposalRoutes = loadRoute('proposalRoutes');
  
  if (auth && proposalRoutes) {
    auth(req, res, (err) => {
      if (err) return res.status(401).json({ success: false, error: 'Unauthorized' });
      proposalRoutes(req, res, next);
    });
  } else {
    res.status(500).json({ success: false, error: 'Proposal routes not available' });
  }
});

// Contracts routes (essential for frontend)
app.use('/api/contracts', (req, res, next) => {
  const auth = loadMiddleware('auth');
  const contractRoutes = loadRoute('contractRoutes');
  
  if (auth && contractRoutes) {
    auth(req, res, (err) => {
      if (err) return res.status(401).json({ success: false, error: 'Unauthorized' });
      contractRoutes(req, res, next);
    });
  } else {
    res.status(500).json({ success: false, error: 'Contract routes not available' });
  }
});

// Avatar routes (no auth required)
app.use('/api/avatar', (req, res, next) => {
  const userAvatarRoutes = loadRoute('userAvatarRoutes');
  if (userAvatarRoutes) {
    userAvatarRoutes(req, res, next);
  } else {
    res.status(500).json({ success: false, error: 'Avatar routes not available' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
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

// Export for Vercel
module.exports.handler = serverless(app);