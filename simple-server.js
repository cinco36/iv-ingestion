import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'IV Ingestion API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      test: '/test',
      apiDocs: '/api-docs',
      admin: {
        health: '/api/admin/health',
        metrics: '/api/admin/metrics/dashboard',
        queues: '/api/admin/queues',
        users: '/api/admin/users'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Simple health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Simple test server is running!'
    }
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// Mock API endpoints for admin dashboard testing
app.get('/api/admin/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      database: { status: 'connected', responseTime: 15 },
      redis: { status: 'connected', responseTime: 5 },
      fileStorage: { status: 'connected', responseTime: 10 },
      queue: { status: 'healthy', responseTime: 8 },
      lastChecked: new Date().toISOString()
    }
  });
});

app.get('/api/admin/metrics/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      filesProcessed: {
        today: 45,
        yesterday: 38,
        total: 1234
      },
      queueDepth: {
        current: 12,
        average: 8,
        trend: 'stable'
      },
      errorRate: {
        current: 2.1,
        average: 1.8,
        trend: 'decreasing'
      },
      activeUsers: {
        current: 5,
        total: 25
      },
      processingRate: {
        perHour: 15,
        perDay: 360
      }
    }
  });
});

app.get('/api/admin/queues', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        name: 'file-processing',
        waiting: 8,
        active: 3,
        completed: 1234,
        failed: 12,
        delayed: 0,
        workers: [
          {
            id: 'worker-1',
            status: 'working',
            currentJob: 'job-123',
            processedJobs: 456,
            failedJobs: 3,
            uptime: 3600,
            lastHeartbeat: new Date().toISOString()
          }
        ]
      }
    ]
  });
});

app.get('/api/admin/users', (req, res) => {
  res.json({
    success: true,
    data: {
      users: [
        {
          id: '1',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
          isActive: true,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      total: 1
    }
  });
});

// Mock authentication endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Admin user
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
  }
  // Regular user
  else if (email === 'user@example.com' && password === 'password123') {
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
  
  // Determine user type based on token
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

// Mock file endpoints
app.get('/api/files', (req, res) => {
  res.json({
    success: true,
    data: {
      files: [
        {
          id: '1',
          filename: 'sample-inspection.pdf',
          originalName: 'sample-inspection.pdf',
          size: 1024000,
          mimeType: 'application/pdf',
          status: 'completed',
          uploadedBy: 'admin@example.com',
          uploadedAt: new Date().toISOString(),
          processedAt: new Date().toISOString(),
          processingTime: 5000
        }
      ],
      total: 1,
      page: 1,
      limit: 20
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    IV Ingestion API Server                   ║
╠══════════════════════════════════════════════════════════════╣
║  Port: ${PORT.toString().padEnd(53)} ║
║  Health Check: http://localhost:${PORT}/health${' '.repeat(20)} ║
║  API Docs: http://localhost:${PORT}/api-docs${' '.repeat(18)} ║
║  Admin Dashboard: http://localhost:${PORT}/admin${' '.repeat(15)} ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app; 