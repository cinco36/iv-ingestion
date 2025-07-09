/**
 * IV Ingestion Main Application
 * 
 * This file wires together all components from the 6 increments:
 * - Increment 1: Core backend API with Express.js
 * - Increment 2: File processing and queue system with Redis/Bull
 * - Increment 3: Admin dashboard with React 18 and TypeScript
 * - Increment 4: User frontend with React 18 and TypeScript
 * - Increment 5: API integration, SDKs, and comprehensive documentation
 * - Increment 6: Real-time features and advanced integrations
 */

import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import knex from 'knex';
import Redis from 'ioredis';
import Bull from 'bull';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

// Import middleware
import rateLimiter from './middleware/rateLimiter.js';

// Import services
import webhookService from './services/webhookService.js';

// Import worker
import { setGlobalIO, startWorker } from './workers/processor.js';

// Import routes (these will be created in the full implementation)
// import authRoutes from './routes/auth.js';
// import fileRoutes from './routes/files.js';
// import inspectionRoutes from './routes/inspections.js';
// import adminRoutes from './routes/admin.js';
// import propertyRoutes from './routes/properties.js';
// import findingRoutes from './routes/findings.js';

// Import database configuration
import knexfile from '../knexfile.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load OpenAPI specification
const openApiSpec = YAML.load(join(__dirname, '../docs/openapi.yaml'));

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/iv_ingestion';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS configuration
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      'http://localhost:3001', // Admin dashboard
      'http://localhost:3002', // User frontend
      'http://localhost:3000'  // Backend API
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Make Socket.IO globally accessible
global.io = io;

// Set global Socket.IO instance for worker
setGlobalIO(io);

// Database connection
const db = knex(knexfile[NODE_ENV]);

// Redis connection
const redis = new Redis(REDIS_URL, {
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
});

// Bull queue setup
const fileProcessingQueue = new Bull('file-processing', REDIS_URL);
const emailQueue = new Bull('email-notifications', REDIS_URL);
const webhookQueue = new Bull('webhook-delivery', REDIS_URL);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3001', // Admin dashboard
    'http://localhost:3002', // User frontend
    'http://localhost:3000'  // Backend API
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: 500 // begin adding 500ms of delay per request above 50
});

app.use('/api/', limiter);
app.use('/api/', speedLimiter);

// Apply custom rate limiting for specific endpoints
app.use('/api/auth/', rateLimiter.authLimiter);
app.use('/api/files/upload', rateLimiter.fileUploadLimiter);
app.use('/api/admin/', rateLimiter.adminLimiter);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await db.raw('SELECT 1');
    
    // Check Redis connection
    await redis.ping();
    
    // Check queue health
    const queueHealth = await Promise.all([
      fileProcessingQueue.getJobCounts(),
      emailQueue.getJobCounts(),
      webhookQueue.getJobCounts()
    ]);
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'iv-ingestion-api',
        version: '1.0.0',
        environment: NODE_ENV,
        database: 'connected',
        redis: 'connected',
        queues: {
          fileProcessing: queueHealth[0],
          email: queueHealth[1],
          webhook: queueHealth[2]
        }
      }
    });
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    res.status(503).json({
      success: false,
      error: 'Service unhealthy',
      details: error.message
    });
  }
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'IV Ingestion API Documentation'
}));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'IV Ingestion API',
      version: '1.0.0',
      environment: NODE_ENV,
      endpoints: {
        health: '/health',
        apiDocs: '/api-docs',
        auth: '/api/auth',
        files: '/api/files',
        inspections: '/api/inspections',
        admin: '/api/admin'
      },
      message: 'Welcome to IV Ingestion API'
    }
  });
});

// API Routes (commented out until full implementation)
// app.use('/api/auth', authRoutes);
// app.use('/api/files', fileRoutes);
// app.use('/api/inspections', inspectionRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/properties', propertyRoutes);
// app.use('/api/findings', findingRoutes);

// Mock routes for testing (temporary)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@example.com' && password === 'admin123') {
    res.json({
      success: true,
      data: {
        user: {
          id: '1',
          email: 'admin@example.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          isEmailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        token: 'mock-jwt-token-admin-12345',
        refreshToken: 'mock-refresh-token-admin-12345'
      }
    });
  } else if (email === 'user@example.com' && password === 'password123') {
    res.json({
      success: true,
      data: {
        user: {
          id: '2',
          email: 'user@example.com',
          firstName: 'Regular',
          lastName: 'User',
          role: 'user',
          isEmailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        token: 'mock-jwt-token-user-12345',
        refreshToken: 'mock-refresh-token-user-12345'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS'
    });
  }
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'No token provided',
      code: 'NO_TOKEN'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (token === 'mock-jwt-token-admin-12345') {
    res.json({
      success: true,
      data: {
        id: '1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  } else if (token === 'mock-jwt-token-user-12345') {
    res.json({
      success: true,
      data: {
        id: '2',
        email: 'user@example.com',
        firstName: 'Regular',
        lastName: 'User',
        role: 'user',
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
});

// Admin endpoints
app.get('/api/admin/metrics', (req, res) => {
  res.json({
    success: true,
    data: {
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      queues: {
        fileProcessing: { active: 5, waiting: 10, completed: 150 },
        email: { active: 2, waiting: 3, completed: 45 },
        webhook: { active: 1, waiting: 2, completed: 25 }
      },
      database: {
        connections: 5,
        queries: 1250
      }
    }
  });
});

app.get('/api/admin/queues', (req, res) => {
  res.json({
    success: true,
    data: {
      queues: [
        {
          name: 'file-processing',
          status: 'active',
          jobCounts: { active: 5, waiting: 10, completed: 150, failed: 2 }
        },
        {
          name: 'email-notifications',
          status: 'active',
          jobCounts: { active: 2, waiting: 3, completed: 45, failed: 0 }
        },
        {
          name: 'webhook-delivery',
          status: 'active',
          jobCounts: { active: 1, waiting: 2, completed: 25, failed: 1 }
        }
      ]
    }
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  // Join admin room for admin dashboard updates
  socket.on('join-admin', () => {
    socket.join('admin');
    console.log(`👨‍💼 Admin joined: ${socket.id}`);
  });
  
  // Join user room for user frontend updates
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`👤 User ${userId} joined: ${socket.id}`);
  });
  
  // File processing updates
  socket.on('file-processing-update', (data) => {
    io.to('admin').emit('file-processing-update', data);
    if (data.userId) {
      io.to(`user-${data.userId}`).emit('file-processing-update', data);
    }
  });
  
  // Queue status updates
  socket.on('queue-status-update', (data) => {
    io.to('admin').emit('queue-status-update', data);
  });
  
  // System metrics updates
  socket.on('system-metrics-update', (data) => {
    io.to('admin').emit('system-metrics-update', data);
  });
  
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'ENDPOINT_NOT_FOUND',
    path: req.path
  });
});

app.use((error, req, res, next) => {
  console.error('❌ Error:', error);
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.message
    });
  }
  
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      code: 'UNAUTHORIZED'
    });
  }
  
  // Default error response
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(NODE_ENV === 'development' && { details: error.message })
  });
});

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  // Close HTTP server
  server.close(() => {
    console.log('✅ HTTP server closed');
  });
  
  // Close database connections
  try {
    await db.destroy();
    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
  }
  
  // Close Redis connections
  try {
    await redis.quit();
    console.log('✅ Redis connections closed');
  } catch (error) {
    console.error('❌ Error closing Redis connections:', error);
  }
  
  // Close Bull queues
  try {
    await Promise.all([
      fileProcessingQueue.close(),
      emailQueue.close(),
      webhookQueue.close()
    ]);
    console.log('✅ Bull queues closed');
  } catch (error) {
    console.error('❌ Error closing Bull queues:', error);
  }
  
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await db.raw('SELECT 1');
    console.log('✅ Database connected');
    
    // Test Redis connection
    await redis.ping();
    console.log('✅ Redis connected');
    
    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    IV Ingestion API Server                   ║
╠══════════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                                  ║
║  Environment: ${NODE_ENV}                                        ║
║  Health Check: http://localhost:${PORT}/health                     ║
║  API Docs: http://localhost:${PORT}/api-docs                   ║
║  Admin Dashboard: http://localhost:3001                        ║
║  User Frontend: http://localhost:3002                          ║
╚══════════════════════════════════════════════════════════════╝
      `);
    });
    
    // Initialize webhook service
    await webhookService.initialize();
    console.log('✅ Webhook service initialized');
    
    // Initialize file processing worker
    await startWorker();
    console.log('✅ File processing worker initialized');
    
    // Start periodic system metrics updates
    setInterval(async () => {
      try {
        const metrics = {
          timestamp: new Date().toISOString(),
          system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage()
          },
          queues: await Promise.all([
            fileProcessingQueue.getJobCounts(),
            emailQueue.getJobCounts(),
            webhookQueue.getJobCounts()
          ])
        };
        
        io.to('admin').emit('system-metrics-update', metrics);
      } catch (error) {
        console.error('❌ Error updating system metrics:', error);
      }
    }, 5000); // Update every 5 seconds
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Export for testing
export { app, server, io, db, redis, fileProcessingQueue, emailQueue, webhookQueue };

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
} 