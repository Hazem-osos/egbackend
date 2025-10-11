const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger.json');
const serverless = require('serverless-http');

// Import all routes
const userRoutes = require('../routes/userRoutes');
const authRoutes = require('../routes/authRoutes');
const jobRoutes = require('../routes/jobRoutes');
const paymentRoutes = require('../routes/paymentRoutes');
const reviewRoutes = require('../routes/reviewRoutes');
const messageRoutes = require('../routes/messageRoutes');
const portfolioRoutes = require('../routes/portfolioRoutes');
const timeEntryRoutes = require('../routes/timeEntryRoutes');
const certificationRoutes = require('../routes/certificationRoutes');
const disputeRoutes = require('../routes/disputeRoutes');
const notificationRoutes = require('../routes/notificationRoutes');
const analyticsRoutes = require('../routes/analyticsRoutes');
const adminAnalyticsRoutes = require('../routes/adminAnalyticsRoutes');
const settingsRoutes = require('../routes/settingsRoutes');
const localizationRoutes = require('../routes/localizationRoutes');
const auditRoutes = require('../routes/auditRoutes');
const healthRoutes = require('../routes/healthRoutes');
const fileUploadRoutes = require('../routes/fileUploadRoutes');
const userAvatarRoutes = require('../routes/userAvatarRoutes');
const webhookRoutes = require('../routes/webhookRoutes').router;
const adminRoutes = require('../routes/adminRoutes');
const supportRoutes = require('../routes/supportRoutes');
const integrationRoutes = require('../routes/integrationRoutes');
const dashboardRoutes = require('../routes/dashboardRoutes');
const connectRoutes = require('../routes/connectRoutes');
const verificationRoutes = require('../routes/verificationRoutes');
const proposalRoutes = require('../routes/proposalRoutes');
const earningsRoutes = require('../routes/earningsRoutes');
const creditRoutes = require('../routes/creditRoutes');
const connectPurchaseRoutes = require('../routes/connectPurchaseRoutes');
const contractRoutes = require('../routes/contractRoutes');

// Import middleware
const { apiLimiter, authLimiter } = require('../middleware/rateLimiter');
const errorHandler = require('../middleware/errorHandler');
const { loggingMiddleware } = require('../middleware/logger');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Trust proxy for Vercel
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "https:", "blob:"],
      "media-src": ["'self'", "data:", "https:", "blob:"],
    },
  },
}));
app.use(compression());

// Logging middleware
app.use(morgan('dev'));
app.use(loggingMiddleware);

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'ngrok-skip-browser-warning']
}));

// Body parsing middleware with increased limits
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb',
  parameterLimit: 100000
}));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Documentation
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', auth, userRoutes);
app.use('/api/jobs', auth, jobRoutes);
app.use('/api/payments', auth, paymentRoutes);
app.use('/api/reviews', auth, reviewRoutes);
app.use('/api/messages', auth, messageRoutes);
app.use('/api/portfolio', auth, portfolioRoutes);
app.use('/api/time-entries', auth, timeEntryRoutes);
app.use('/api/certifications', auth, certificationRoutes);
app.use('/api/disputes', auth, disputeRoutes);
app.use('/api/notifications', auth, notificationRoutes);
app.use('/api/analytics', auth, analyticsRoutes);
app.use('/api/admin/analytics', adminAuth, adminAnalyticsRoutes);
app.use('/api/settings', auth, settingsRoutes);
app.use('/api/localization', auth, localizationRoutes);
app.use('/api/audit', auth, auditRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/files', auth, fileUploadRoutes);
app.use('/api/avatar', userAvatarRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminAuth, adminRoutes);
app.use('/api/support', auth, supportRoutes);
app.use('/api/integrations', auth, integrationRoutes);
app.use('/api/dashboard', auth, dashboardRoutes);
app.use('/api/connects', auth, connectRoutes);
app.use('/api/verification', auth, verificationRoutes);
app.use('/api/proposals', auth, proposalRoutes);
app.use('/api/earnings', auth, earningsRoutes);
app.use('/api/credits', auth, creditRoutes);
app.use('/api/connect-purchase', auth, connectPurchaseRoutes);
app.use('/api/contracts', auth, contractRoutes);

// Error handling middleware
app.use(errorHandler);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'healthy',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Export the serverless function
module.exports.handler = serverless(app);
