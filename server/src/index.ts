import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { Server as SocketIOServer } from 'socket.io';
import { initDatabase, db } from './db/database.js';
import { setupSocketHandlers } from './socket/socketHandler.js';
import { createRateLimiter } from './middleware/rateLimiter.js';
import { authRouter } from './routes/authRoutes.js';
import { createRideRouter } from './routes/rideRoutes.js';
import { createDriverRouter } from './routes/driverRoutes.js';
import { createTelebirrRouter } from './routes/telebirrRoutes.js';
import { createAdminRouter } from './routes/adminRoutes.js';
import { geoRouter } from './routes/geoRoutes.js';
import { createSubscriptionRouter } from './routes/subscriptionRoutes.js';
import { createDeliveryRouter } from './routes/deliveryRoutes.js';
import { providerRouter } from './routes/providerRoutes.js';
import { createSafetyRouter } from './routes/safetyRoutes.js';
import { corporateRouter } from './routes/corporateRoutes.js';
import { developerRouter } from './routes/developerRoutes.js';

const app = express();
const server = http.createServer(app);

// Disable Express fingerprinting header for security
app.disable('x-powered-by');

// Production Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// CORS configuration supporting live production domains and local development
const allowedOrigins = [
  'https://chebelew.trustlotto.app',
  'https://chebelew.et',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.trustlotto.app')) {
        callback(null, true);
      } else {
        callback(null, true); // Fallback allow with headers
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));

// Global API Rate Limiter (600 requests per minute per IP)
const globalApiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 600,
  message: 'API rate limit exceeded. Please wait a moment before sending more requests.',
});

// Stricter Auth Rate Limiter (60 attempts per 15 minutes)
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 60,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
});

app.use('/api', globalApiLimiter);
app.use('/api/auth', authLimiter);

// Initialize SQLite database schema and seed data
initDatabase();

// Setup Socket.IO with WebSocket and Polling transports
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

setupSocketHandlers(io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Chebelew Mobility & Dispatch API',
    version: '1.0.0',
    uptimeSeconds: Math.floor(process.uptime()),
    time: new Date().toISOString(),
    addisTimezone: 'Africa/Addis_Ababa',
  });
});

// Mount modular API routers
app.use('/api/auth', authRouter);
app.use('/api/rides', createRideRouter(io));
app.use('/api/drivers', createDriverRouter(io));
app.use('/api/telebirr', createTelebirrRouter(io));
app.use('/api/admin', createAdminRouter(io));
app.use('/api/geo', geoRouter);
app.use('/api/subscriptions', createSubscriptionRouter(io));
app.use('/api/deliveries', createDeliveryRouter(io));
app.use('/api/providers', providerRouter);
app.use('/api/safety', createSafetyRouter(io));
app.use('/api/corporate', corporateRouter);
app.use('/api/developer', developerRouter);

// Serve frontend static build if available (production mode / unified server)
const possiblePaths = [
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'public'),
];

const foundDist = possiblePaths.find((p) => fs.existsSync(p));

if (foundDist) {
  // Static files with Cache-Control headers: hashed assets cached for 1 year, index.html always fresh
  app.use(
    express.static(foundDist, {
      maxAge: '1y',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else if (filePath.match(/\.(js|css|svg|png|jpg|jpeg|webp|woff2?)$/)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    })
  );

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(foundDist, 'index.html'));
  });
}

// Centralized error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[SERVER ERROR]', err);
  if (res.headersSent) {
    return next(err);
  }
  const isProd = process.env.NODE_ENV === 'production';
  return res.status(err.status || 500).json({
    error: isProd ? 'Internal Server Error' : err.message || 'Unknown Server Error',
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚕 Chebelew Ethiopia Ride-Hailing Backend Server`);
    console.log(`   Running at: http://localhost:${PORT}`);
    console.log(`   Health Check: http://localhost:${PORT}/api/health`);
    console.log(`   WebSockets ready for live GPS & dispatch events`);
    console.log(`=======================================================`);
  });

  // Graceful shutdown on SIGTERM / SIGINT for zero-downtime container rolling restarts
  const handleGracefulShutdown = (signal: string) => {
    console.log(`\nReceived ${signal}. Gracefully stopping Chebelew server...`);
    io.close(() => {
      console.log('Socket.IO connections closed.');
    });

    server.close(() => {
      console.log('HTTP server closed.');
      try {
        db.close();
        console.log('Database connection closed cleanly.');
      } catch (e) {
        console.error('Error closing database:', e);
      }
      process.exit(0);
    });

    // Hard fallback timeout after 10s if dangling sockets
    setTimeout(() => {
      console.error('Graceful shutdown timeout exceeded. Forcefully exiting.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
}

export { app, server, io };
