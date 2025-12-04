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
const swaggerDocument = require('./swagger.json');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const messageRoutes = require('./routes/messageRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const timeEntryRoutes = require('./routes/timeEntryRoutes');
const certificationRoutes = require('./routes/certificationRoutes');
const disputeRoutes = require('./routes/disputeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminAnalyticsRoutes = require('./routes/adminAnalyticsRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const localizationRoutes = require('./routes/localizationRoutes');
const auditRoutes = require('./routes/auditRoutes');
const healthRoutes = require('./routes/healthRoutes');
const fileUploadRoutes = require('./routes/fileUploadRoutes');
const userAvatarRoutes = require('./routes/userAvatarRoutes');
const webhookRoutes = require('./routes/webhookRoutes').router;
const adminRoutes = require('./routes/adminRoutes');
const supportRoutes = require('./routes/supportRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const connectRoutes = require('./routes/connectRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const proposalRoutes = require('./routes/proposalRoutes');
const earningsRoutes = require('./routes/earningsRoutes');
const creditRoutes = require('./routes/creditRoutes');
const connectPurchaseRoutes = require('./routes/connectPurchaseRoutes');
const contractRoutes = require('./routes/contractRoutes');
const http = require('http');
const setupWebSocket = require('./websocket');
const rateLimit = require('express-rate-limit');
const adminAuth = require('./middleware/adminAuth');

// Import middleware
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const { loggingMiddleware } = require('./middleware/logger');
const auth = require('./middleware/auth');

// Load environment variables
dotenv.config();

// Construct DATABASE_URL for Prisma using Aiven individual variables
// Check if DATABASE_URL is missing or invalid (doesn't start with mysql://)
const needsConstruction = !process.env.DATABASE_URL || 
                          !process.env.DATABASE_URL.trim() || 
                          !process.env.DATABASE_URL.startsWith('mysql://');

if (needsConstruction && process.env.DB_HOST) {
  const sslCert = process.env.DB_SSL_CA_CERT;
  
  // Build DATABASE_URL for Prisma with proper SSL configuration
  let dbUrl = `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;
  
  // Add SSL parameters if SSL cert is provided
  if (sslCert) {
    const sslParams = new URLSearchParams();
    sslParams.set('ssl-mode', 'REQUIRED');
    sslParams.set('ssl-ca', sslCert);
    sslParams.set('ssl-reject-unauthorized', 'true');
    
    dbUrl += '?' + sslParams.toString();
  } else {
    // Still add ssl-mode even without cert
    dbUrl += '?ssl-mode=REQUIRED';
  }
  
  process.env.DATABASE_URL = dbUrl;
  console.log('Constructed DATABASE_URL from Aiven variables');
  console.log('Database host:', process.env.DB_HOST);
  console.log('Database port:', process.env.DB_PORT);
  console.log('Database name:', process.env.DB_DATABASE);
} else if (needsConstruction && !process.env.DB_HOST) {
  console.error('ERROR: DATABASE_URL is missing or invalid, and individual DB variables are not set.');
  console.error('Current DATABASE_URL value:', process.env.DATABASE_URL ? `"${process.env.DATABASE_URL.substring(0, 20)}..."` : 'NOT SET');
  console.error('DB_HOST:', process.env.DB_HOST || 'NOT SET');
  console.error('Please set either:');
  console.error('  - DATABASE_URL (must start with mysql://)');
  console.error('  - OR DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, DB_DATABASE (and optionally DB_SSL_CA_CERT)');
  process.exit(1);
}

// Final validation before PrismaClient instantiation
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim() || !process.env.DATABASE_URL.startsWith('mysql://')) {
  console.error('FATAL: DATABASE_URL is still invalid after construction attempt');
  console.error('DATABASE_URL value:', process.env.DATABASE_URL ? `"${process.env.DATABASE_URL}"` : 'NOT SET');
  process.exit(1);
}

console.log('DATABASE_URL is valid, starting Prisma client...');
console.log('DATABASE_URL preview:', process.env.DATABASE_URL.substring(0, 30) + '...');

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 5001;

// Trust proxy for rate limiting behind ngrok
app.set('trust proxy', 1);

// Create HTTP server with timeout settings
const server = http.createServer({
  timeout: 120000, // 2 minutes
  keepAliveTimeout: 120000
}, app);

// Setup WebSocket server with path
const wss = setupWebSocket(server, '/ws');

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
  process.env.FRONTEND_URL,
  // Allow any Render frontend URL
  /^https:\/\/.*\.onrender\.com$/,
  // Allow any Vercel frontend URL
  /^https:\/\/.*\.vercel\.app$/
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin matches any allowed origin (string or regex)
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Documentation
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

// Database connection with retry logic
const connectWithRetry = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      console.log('Successfully connected to the database');
      return;
    } catch (error) {
      console.error(`Failed to connect to the database (attempt ${i + 1}/${retries}):`, error);
      if (i === retries - 1) {
        console.error('Max retries reached. Exiting...');
        process.exit(1);
      }
      // Wait for 5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

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

// Start server
const startServer = async () => {
  try {
    await connectWithRetry();
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`API Documentation: http://localhost:${port}/api-docs`);
      console.log('WebSocket server is running');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing HTTP server and database connection...');
  await prisma.$disconnect();
  process.exit(0);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter); 