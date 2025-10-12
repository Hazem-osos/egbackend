// Full-featured serverless function for Vercel
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const helmet = require('helmet');
const serverless = require('serverless-http');

// Load environment variables
dotenv.config();

// Get the correct paths for serverless deployment
const projectRoot = path.join(__dirname, '..');

const app = express();
const prisma = new PrismaClient();

// Trust proxy for Vercel
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const allowedOrigins = [
  'https://egseekersfrontend-97jl1ayeu-hazemosama2553-gmailcoms-projects.vercel.app',
  'http://localhost:3000',
  'https://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Import all routes with proper error handling
let userRoutes, authRoutes, jobRoutes, paymentRoutes, reviewRoutes, messageRoutes;
let portfolioRoutes, timeEntryRoutes, certificationRoutes, disputeRoutes, notificationRoutes;
let analyticsRoutes, adminAnalyticsRoutes, settingsRoutes, localizationRoutes, auditRoutes;
let healthRoutes, fileUploadRoutes, userAvatarRoutes, webhookRoutes, adminRoutes;
let supportRoutes, integrationRoutes, dashboardRoutes, connectRoutes, verificationRoutes;
let proposalRoutes, earningsRoutes, creditRoutes, connectPurchaseRoutes, contractRoutes;

try {
  // Import all routes
  userRoutes = require(path.join(projectRoot, 'routes/userRoutes'));
  authRoutes = require(path.join(projectRoot, 'routes/authRoutes'));
  jobRoutes = require(path.join(projectRoot, 'routes/jobRoutes'));
  paymentRoutes = require(path.join(projectRoot, 'routes/paymentRoutes'));
  reviewRoutes = require(path.join(projectRoot, 'routes/reviewRoutes'));
  messageRoutes = require(path.join(projectRoot, 'routes/messageRoutes'));
  portfolioRoutes = require(path.join(projectRoot, 'routes/portfolioRoutes'));
  timeEntryRoutes = require(path.join(projectRoot, 'routes/timeEntryRoutes'));
  certificationRoutes = require(path.join(projectRoot, 'routes/certificationRoutes'));
  disputeRoutes = require(path.join(projectRoot, 'routes/disputeRoutes'));
  notificationRoutes = require(path.join(projectRoot, 'routes/notificationRoutes'));
  analyticsRoutes = require(path.join(projectRoot, 'routes/analyticsRoutes'));
  adminAnalyticsRoutes = require(path.join(projectRoot, 'routes/adminAnalyticsRoutes'));
  settingsRoutes = require(path.join(projectRoot, 'routes/settingsRoutes'));
  localizationRoutes = require(path.join(projectRoot, 'routes/localizationRoutes'));
  auditRoutes = require(path.join(projectRoot, 'routes/auditRoutes'));
  healthRoutes = require(path.join(projectRoot, 'routes/healthRoutes'));
  fileUploadRoutes = require(path.join(projectRoot, 'routes/fileUploadRoutes'));
  userAvatarRoutes = require(path.join(projectRoot, 'routes/userAvatarRoutes'));
  webhookRoutes = require(path.join(projectRoot, 'routes/webhookRoutes')).router;
  adminRoutes = require(path.join(projectRoot, 'routes/adminRoutes'));
  supportRoutes = require(path.join(projectRoot, 'routes/supportRoutes'));
  integrationRoutes = require(path.join(projectRoot, 'routes/integrationRoutes'));
  dashboardRoutes = require(path.join(projectRoot, 'routes/dashboardRoutes'));
  connectRoutes = require(path.join(projectRoot, 'routes/connectRoutes'));
  verificationRoutes = require(path.join(projectRoot, 'routes/verificationRoutes'));
  proposalRoutes = require(path.join(projectRoot, 'routes/proposalRoutes'));
  earningsRoutes = require(path.join(projectRoot, 'routes/earningsRoutes'));
  creditRoutes = require(path.join(projectRoot, 'routes/creditRoutes'));
  connectPurchaseRoutes = require(path.join(projectRoot, 'routes/connectPurchaseRoutes'));
  contractRoutes = require(path.join(projectRoot, 'routes/contractRoutes'));
} catch (error) {
  console.error('Error loading routes:', error);
}

// Import middleware
let auth, adminAuth, errorHandler;
try {
  auth = require(path.join(projectRoot, 'middleware/auth'));
  adminAuth = require(path.join(projectRoot, 'middleware/adminAuth'));
  errorHandler = require(path.join(projectRoot, 'middleware/errorHandler'));
} catch (error) {
  console.error('Error loading middleware:', error);
}

// Routes (with error handling)
if (authRoutes) app.use('/api/auth', authRoutes);
if (userRoutes && auth) app.use('/api/users', auth, userRoutes);
if (jobRoutes && auth) app.use('/api/jobs', auth, jobRoutes);
if (paymentRoutes && auth) app.use('/api/payments', auth, paymentRoutes);
if (reviewRoutes && auth) app.use('/api/reviews', auth, reviewRoutes);
if (messageRoutes && auth) app.use('/api/messages', auth, messageRoutes);
if (portfolioRoutes && auth) app.use('/api/portfolio', auth, portfolioRoutes);
if (timeEntryRoutes && auth) app.use('/api/time-entries', auth, timeEntryRoutes);
if (certificationRoutes && auth) app.use('/api/certifications', auth, certificationRoutes);
if (disputeRoutes && auth) app.use('/api/disputes', auth, disputeRoutes);
if (notificationRoutes && auth) app.use('/api/notifications', auth, notificationRoutes);
if (analyticsRoutes && auth) app.use('/api/analytics', auth, analyticsRoutes);
if (adminAnalyticsRoutes && adminAuth) app.use('/api/admin/analytics', adminAuth, adminAnalyticsRoutes);
if (settingsRoutes && auth) app.use('/api/settings', auth, settingsRoutes);
if (localizationRoutes && auth) app.use('/api/localization', auth, localizationRoutes);
if (auditRoutes && auth) app.use('/api/audit', auth, auditRoutes);
if (healthRoutes) app.use('/api/health', healthRoutes);
if (fileUploadRoutes && auth) app.use('/api/files', auth, fileUploadRoutes);
if (userAvatarRoutes) app.use('/api/avatar', userAvatarRoutes);
if (webhookRoutes) app.use('/api/webhooks', webhookRoutes);
if (adminRoutes && adminAuth) app.use('/api/admin', adminAuth, adminRoutes);
if (supportRoutes && auth) app.use('/api/support', auth, supportRoutes);
if (integrationRoutes && auth) app.use('/api/integrations', auth, integrationRoutes);
if (dashboardRoutes && auth) app.use('/api/dashboard', auth, dashboardRoutes);
if (connectRoutes && auth) app.use('/api/connects', auth, connectRoutes);
if (verificationRoutes && auth) app.use('/api/verification', auth, verificationRoutes);
if (proposalRoutes && auth) app.use('/api/proposals', auth, proposalRoutes);
if (earningsRoutes && auth) app.use('/api/earnings', auth, earningsRoutes);
if (creditRoutes && auth) app.use('/api/credits', auth, creditRoutes);
if (connectPurchaseRoutes && auth) app.use('/api/connect-purchase', auth, connectPurchaseRoutes);
if (contractRoutes && auth) app.use('/api/contracts', auth, contractRoutes);

// Basic health check (fallback)
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    message: 'Full-featured serverless function is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Error handling middleware
if (errorHandler) {
  app.use(errorHandler);
} else {
  app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  });
}

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