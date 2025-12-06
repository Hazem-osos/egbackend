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
// Clean and validate existing DATABASE_URL (remove quotes, trim whitespace)
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.trim().replace(/^["']|["']$/g, '');
}

// Check if DATABASE_URL is missing or invalid (doesn't start with mysql://)
const needsConstruction = !process.env.DATABASE_URL || 
                          !process.env.DATABASE_URL.trim() || 
                          !process.env.DATABASE_URL.startsWith('mysql://');

console.log('DATABASE_URL check:', {
  exists: !!process.env.DATABASE_URL,
  value: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'NOT SET',
  needsConstruction,
  hasDBHost: !!process.env.DB_HOST
});

// If DATABASE_URL is already set and valid, log it
if (!needsConstruction && process.env.DATABASE_URL) {
  try {
    const dbUrlObj = new URL(process.env.DATABASE_URL);
    console.log('✓ DATABASE_URL is already set and valid');
    console.log('  Database host:', dbUrlObj.hostname);
    console.log('  Database port:', dbUrlObj.port || '3306');
    console.log('  Database name:', dbUrlObj.pathname.substring(1)); // Remove leading /
  } catch (e) {
    // Will be caught in validation below
  }
}

if (needsConstruction && process.env.DB_HOST) {
  // Validate DB_HOST is not localhost in production
  const dbHost = process.env.DB_HOST.trim();
  if (process.env.NODE_ENV === 'production' && (dbHost === 'localhost' || dbHost === '127.0.0.1')) {
    console.error('✗ FATAL: DB_HOST is set to localhost in production environment!');
    console.error('  DB_HOST:', dbHost);
    console.error('  This will not work on Render or any cloud platform.');
    console.error('');
    console.error('Please set DB_HOST to your actual production database host in Render environment variables.');
    process.exit(1);
  }
  
  const sslCert = process.env.DB_SSL_CA_CERT;
  
  // URL encode user and password to handle special characters (but not database name in path)
  const dbUser = encodeURIComponent(process.env.DB_USER);
  const dbPassword = encodeURIComponent(process.env.DB_PASSWORD);
  
  // Build DATABASE_URL for Prisma with proper SSL configuration
  let dbUrl = `mysql://${dbUser}:${dbPassword}@${dbHost}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;
  
  // Add SSL parameters if SSL cert is provided
  if (sslCert) {
    const sslParams = new URLSearchParams();
    sslParams.set('ssl-mode', 'REQUIRED');
    sslParams.set('ssl-ca', sslCert.trim().replace(/^["']|["']$/g, ''));
    sslParams.set('ssl-reject-unauthorized', 'true');
    
    dbUrl += '?' + sslParams.toString();
  } else {
    // Still add ssl-mode even without cert
    dbUrl += '?ssl-mode=REQUIRED';
  }
  
  process.env.DATABASE_URL = dbUrl;
  console.log('✓ Constructed DATABASE_URL from Aiven variables');
  console.log('  Database host:', dbHost);
  console.log('  Database port:', process.env.DB_PORT);
  console.log('  Database name:', process.env.DB_DATABASE);
} else if (needsConstruction && !process.env.DB_HOST) {
  console.error('✗ ERROR: DATABASE_URL is missing or invalid, and individual DB variables are not set.');
  console.error('  Current DATABASE_URL value:', process.env.DATABASE_URL ? `"${process.env.DATABASE_URL.substring(0, 50)}..."` : 'NOT SET');
  console.error('  DB_HOST:', process.env.DB_HOST || 'NOT SET');
  console.error('  DB_USER:', process.env.DB_USER || 'NOT SET');
  console.error('  DB_PORT:', process.env.DB_PORT || 'NOT SET');
  console.error('  DB_DATABASE:', process.env.DB_DATABASE || 'NOT SET');
  console.error('');
  console.error('Please set in Render environment variables either:');
  console.error('  - DATABASE_URL=mysql://user:pass@host:port/db?ssl-mode=REQUIRED');
  console.error('  - OR DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, DB_DATABASE');
  process.exit(1);
}

// Final validation before PrismaClient instantiation
const finalDbUrl = process.env.DATABASE_URL ? process.env.DATABASE_URL.trim() : '';
if (!finalDbUrl || !finalDbUrl.startsWith('mysql://')) {
  console.error('✗ FATAL: DATABASE_URL is still invalid after construction attempt');
  console.error('  DATABASE_URL value:', finalDbUrl || 'NOT SET');
  console.error('  Length:', finalDbUrl ? finalDbUrl.length : 0);
  console.error('  Starts with mysql://:', finalDbUrl.startsWith('mysql://'));
  process.exit(1);
}

// Parse DATABASE_URL to extract host and validate
try {
  const dbUrlObj = new URL(finalDbUrl);
  const dbHost = dbUrlObj.hostname;
  const dbPort = dbUrlObj.port || '3306';
  
  console.log('✓ DATABASE_URL parsed successfully');
  console.log('  Database host:', dbHost);
  console.log('  Database port:', dbPort);
  
  // In production, reject localhost connections
  if (process.env.NODE_ENV === 'production' && (dbHost === 'localhost' || dbHost === '127.0.0.1')) {
    console.error('✗ FATAL: DATABASE_URL points to localhost in production environment!');
    console.error('  This will not work on Render or any cloud platform.');
    console.error('  Current host:', dbHost);
    console.error('  DATABASE_URL preview:', finalDbUrl.substring(0, 60) + '...');
    console.error('');
    console.error('Please set the correct database connection in Render environment variables:');
    console.error('  - Either set DATABASE_URL with your production database host');
    console.error('  - Or set DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, DB_DATABASE');
    console.error('  - Make sure DB_HOST is NOT localhost or 127.0.0.1');
    process.exit(1);
  }
} catch (error) {
  console.error('✗ FATAL: Failed to parse DATABASE_URL');
  console.error('  Error:', error.message);
  console.error('  DATABASE_URL value:', finalDbUrl.substring(0, 100));
  process.exit(1);
}

// Ensure clean DATABASE_URL
process.env.DATABASE_URL = finalDbUrl;
console.log('✓ DATABASE_URL is valid, starting Prisma client...');
console.log('  DATABASE_URL preview:', finalDbUrl.substring(0, 40) + '...');

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
  'https://egseekersfrontend.vercel.app',
  process.env.FRONTEND_URL,
  // Allow any Render frontend URL
  /^https:\/\/.*\.onrender\.com$/,
  // Allow any Vercel frontend URL (including preview deployments)
  /^https:\/\/.*\.vercel\.app$/,
  /^https:\/\/.*-.*\.vercel\.app$/,
  // Allow localhost in development
  /^http:\/\/localhost:\d+$/,
  /^https:\/\/localhost:\d+$/
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
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
      console.log('CORS: Allowing origin:', origin);
      callback(null, true);
    } else {
      console.log('CORS: Blocked origin:', origin);
      console.log('CORS: Allowed origins:', allowedOrigins);
      // In development, allow all origins for easier debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('CORS: Development mode - allowing origin');
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
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
  // Extract host info for better error messages
  let dbHostInfo = 'unknown';
  try {
    const dbUrlObj = new URL(process.env.DATABASE_URL);
    dbHostInfo = `${dbUrlObj.hostname}:${dbUrlObj.port || '3306'}`;
  } catch (e) {
    // Ignore parsing errors, we'll use the full URL
    dbHostInfo = process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) : 'NOT SET';
  }
  
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      console.log('Successfully connected to the database');
      console.log(`  Connected to: ${dbHostInfo}`);
      return;
    } catch (error) {
      console.error(`Failed to connect to the database (attempt ${i + 1}/${retries}):`);
      console.error(`  Trying to connect to: ${dbHostInfo}`);
      console.error(`  Error: ${error.message}`);
      
      // Check if error mentions localhost
      if (error.message && error.message.includes('localhost')) {
        console.error('');
        console.error('⚠️  WARNING: Connection error mentions localhost!');
        console.error('  This usually means DATABASE_URL is incorrectly configured.');
        console.error('  In production (Render), you must use your actual database host, not localhost.');
        console.error('  Please check your Render environment variables.');
      }
      
      if (i === retries - 1) {
        console.error('');
        console.error('Max retries reached. Exiting...');
        console.error('Please verify your database connection settings in Render:');
        console.error('  - DATABASE_URL should point to your production database');
        console.error('  - OR set DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, DB_DATABASE');
        process.exit(1);
      }
      // Wait for 5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'EgSeekers API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      docs: process.env.NODE_ENV !== 'production' ? '/api-docs' : null
    },
    timestamp: new Date().toISOString()
  });
});

// Routes
// Mount routes with /api prefix (primary)
app.use('/api/auth', authRoutes);
app.use('/api/users', auth, userRoutes);

// Also mount routes without /api prefix for compatibility
// (in case requests come through a proxy that strips /api)
app.use('/auth', authRoutes);
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