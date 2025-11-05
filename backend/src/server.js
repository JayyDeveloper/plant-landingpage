const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const logger = require('./config/logger');
const { connectDatabase, connectRedis, connectMongoDB } = require('./config/database');
const { errorHandler, notFound } = require('./api/middleware/errorHandler');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO for real-time collaboration
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
const apiVersion = process.env.API_VERSION || 'v1';
app.use(`/api/${apiVersion}/auth`, require('./api/routes/auth'));
app.use(`/api/${apiVersion}/users`, require('./api/routes/users'));
app.use(`/api/${apiVersion}/newsletters`, require('./api/routes/newsletters'));
app.use(`/api/${apiVersion}/templates`, require('./api/routes/templates'));
app.use(`/api/${apiVersion}/content`, require('./api/routes/content'));
app.use(`/api/${apiVersion}/media`, require('./api/routes/media'));
app.use(`/api/${apiVersion}/subscribers`, require('./api/routes/subscribers'));
app.use(`/api/${apiVersion}/analytics`, require('./api/routes/analytics'));
app.use(`/api/${apiVersion}/plugins`, require('./api/routes/plugins'));
app.use(`/api/${apiVersion}/collaboration`, require('./api/routes/collaboration'));

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Join newsletter editing room
  socket.on('join-newsletter', (newsletterId) => {
    socket.join(`newsletter-${newsletterId}`);
    logger.info(`Socket ${socket.id} joined newsletter ${newsletterId}`);
  });

  // Handle content changes
  socket.on('content-change', (data) => {
    socket.to(`newsletter-${data.newsletterId}`).emit('content-update', data);
  });

  // Handle cursor position
  socket.on('cursor-move', (data) => {
    socket.to(`newsletter-${data.newsletterId}`).emit('cursor-update', data);
  });

  // Handle comments
  socket.on('comment-add', (data) => {
    socket.to(`newsletter-${data.newsletterId}`).emit('comment-new', data);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.set('io', io);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Database connections
const startServer = async () => {
  try {
    // Connect to databases
    await connectDatabase();
    await connectRedis();
    await connectMongoDB();

    // Start server
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 Vibe Newsletter Platform API Server              ║
║                                                       ║
║   Environment: ${process.env.NODE_ENV?.padEnd(37) || 'development'.padEnd(37)}║
║   Port: ${PORT.toString().padEnd(43)}║
║   API Version: ${apiVersion.padEnd(38)}║
║                                                       ║
║   📡 API: http://localhost:${PORT}/api/${apiVersion}              ║
║   🏥 Health: http://localhost:${PORT}/health             ║
║   🔌 WebSocket: http://localhost:${PORT}                  ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
    });

    // Initialize background job workers
    require('./services/jobs/newsletterScheduler');
    require('./services/jobs/analyticsProcessor');

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

startServer();

module.exports = { app, io };
