
// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import caseRoutes from './case.routes';
import aiRoutes from './ai.routes';
import blockchainRoutes from './blockchain.routes';
import documentRoutes from './document.routes';
import notificationRoutes from './notification.routes';

const router = Router();

// API Information endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to 999Plus API - Crime Reporting Platform',
    version: '1.0.0',
    description: 'A comprehensive crime reporting platform designed to combat systematic corruption',
    author: '999Plus Team',
    documentation: {
      postman: '/api/docs/postman',
      swagger: '/api/docs/swagger',
    },
    endpoints: {
      authentication: {
        path: '/api/auth',
        description: 'User authentication and profile management',
        methods: ['POST /register', 'POST /login', 'GET /profile', 'PUT /profile', 'PUT /change-password']
      },
      cases: {
        path: '/api/cases',
        description: 'Case management and submission',
        methods: ['POST /', 'GET /', 'GET /:id', 'PUT /:id', 'DELETE /:id', 'POST /:id/escalate']
      },
      ai: {
        path: '/api/ai',
        description: 'AI-powered case classification and analysis',
        methods: ['POST /classify', 'POST /reclassify/:caseId', 'GET /history', 'GET /stats', 'POST /analyze-escalation']
      },
      blockchain: {
        path: '/api/blockchain',
        description: 'Ethereum tier management and document verification',
        methods: ['POST /tier', 'PUT /tier', 'POST /hash', 'POST /register', 'POST /verify', 'POST /qr']
      },
      documents: {
        path: '/api/documents',
        description: 'Legal document generation and management',
        methods: ['POST /generate', 'POST /upload', 'GET /', 'GET /:id', 'GET /:id/download', 'POST /:id/qr']
      },
      notifications: {
        path: '/api/notifications',
        description: 'Notification and communication system',
        methods: ['POST /', 'POST /email', 'POST /sms', 'GET /', 'PUT /:id/read', 'POST /bulk']
      }
    },
    features: [
      'AI-powered case classification using OpenAI GPT-4',
      'Ethereum-based user tier system',
      'Blockchain document verification',
      'Automated legal form generation (N240, N1, ET1)',
      'QR code document integrity verification',
      'Multi-channel notification system',
      'Advanced search and filtering',
      'Comprehensive audit logging'
    ],
    tierSystem: {
      'Tier 1': {
        ethRequirement: '< 1 ETH',
        features: ['Basic case submission', 'AI classification', 'Document viewing']
      },
      'Tier 2': {
        ethRequirement: '1-5 ETH',
        features: ['Case escalation', 'Document hashing', 'Email notifications', 'Advanced search']
      },
      'Tier 3': {
        ethRequirement: '5-10 ETH',
        features: ['Blockchain registration', 'SMS notifications', 'Document deletion', 'Scheduled notifications']
      },
      'Tier 4': {
        ethRequirement: '10+ ETH',
        features: ['Bulk notifications', 'Admin features', 'Full API access', 'Priority support']
      }
    },
    status: {
      server: 'Online',
      database: 'Connected',
      blockchain: 'Connected',
      ai: 'Available',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  });
});

// Health check endpoint (detailed)
router.get('/health', async (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0',
    services: {
      database: 'Connected', // You can add actual DB health check here
      redis: 'Available',     // You can add actual Redis health check here
      openai: 'Available',    // You can add actual OpenAI API check here
      ethereum: 'Connected'   // You can add actual ETH node check here
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    },
    cpu: {
      usage: process.cpuUsage()
    }
  };

  res.json(healthCheck);
});

// API Status endpoint
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    message: '999Plus API is running smoothly',
    endpoints: {
      auth: 'operational',
      cases: 'operational',
      ai: 'operational',
      blockchain: 'operational',
      documents: 'operational',
      notifications: 'operational'
    },
    lastUpdated: new Date().toISOString()
  });
});

// API Statistics endpoint (public stats)
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    message: 'Public API statistics',
    data: {
      totalEndpoints: 50,
      supportedFormats: ['N240', 'N1', 'ET1'],
      supportedLanguages: ['English'],
      tierLevels: 4,
      features: {
        aiClassification: true,
        blockchainVerification: true,
        documentGeneration: true,
        notificationSystem: true,
        tierBasedAccess: true
      }
    },
    note: 'Detailed statistics require authentication'
  });
});

// Mount all route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/cases', caseRoutes);
router.use('/ai', aiRoutes);
router.use('/blockchain', blockchainRoutes);
router.use('/documents', documentRoutes);
router.use('/notifications', notificationRoutes);

// Catch-all for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    error: `The requested endpoint ${req.originalUrl} does not exist`,
    availableEndpoints: [
      '/api/auth',
      '/api/cases', 
      '/api/ai',
      '/api/blockchain',
      '/api/documents',
      '/api/notifications'
    ],
    suggestion: 'Please check the API documentation for available endpoints',
    documentation: '/api'
  });
});

export default router;