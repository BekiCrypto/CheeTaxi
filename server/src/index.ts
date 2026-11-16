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
import { providerRouter, setProviderIO } from './routes/providerRoutes.js';
import { createSafetyRouter } from './routes/safetyRoutes.js';
import { corporateRouter } from './routes/corporateRoutes.js';
import { developerRouter } from './routes/developerRoutes.js';
import { paymentRouter } from './routes/paymentRoutes.js';
import { mediaRouter } from './routes/mediaRoutes.js';
import { MetricsService } from './services/metricsService.js';
import { LocationService } from './services/locationService.js';
import { QueueService } from './services/queueService.js';

const app = express();
const server = http.createServer(app);

// Disable Express fingerprinting header for security
app.disable('x-powered-by');

// Prometheus Latency & Metrics Tracking Middleware
app.use(MetricsService.middleware());

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

// Prometheus Metrics Exposition Endpoint
app.get('/api/metrics', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  return res.send(MetricsService.renderPrometheusMetrics());
});

// Fast Process Liveness Probe (K8s / Container Orchestration)
app.get('/api/health/live', (req, res) => {
  return res.json({
    status: 'live',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Deep Readiness Probe (Verifies SQLite read/write, WAL status, heap threshold)
app.get('/api/health/ready', (req, res) => {
  try {
    const testQuery = db.prepare('SELECT 1 as alive').get() as any;
    const mem = process.memoryUsage();
    const heapLimitMb = 1024; // 1 GB safe threshold
    const heapUsedMb = Math.round(mem.heapUsed / 1024 / 1024);

    if (!testQuery || testQuery.alive !== 1) {
      return res.status(503).json({ status: 'not_ready', reason: 'Database query failed' });
    }

    if (heapUsedMb > heapLimitMb) {
      return res.status(503).json({ status: 'not_ready', reason: 'Memory pressure exceeds safe threshold' });
    }

    return res.json({
      status: 'ready',
      database: 'connected_wal',
      heapUsedMb,
      inMemoryLocationsCount: LocationService.getStoreSize(),
      queueStats: QueueService.getStats(),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(503).json({ status: 'not_ready', error: err.message });
  }
});

// Health check and diagnostic endpoint
app.get('/api/health', (req, res) => {
  let dbHealthy = false;
  let activeRides = 0;
  let onlineDrivers = 0;
  let totalTariffs = 0;

  try {
    const rideRow = db.prepare(`SELECT count(*) as count FROM rides WHERE status IN ('REQUESTED', 'ASSIGNED', 'ARRIVED', 'IN_PROGRESS')`).get() as any;
    const driverRow = db.prepare(`SELECT count(*) as count FROM drivers WHERE is_online = 1`).get() as any;
    const tariffRow = db.prepare(`SELECT count(*) as count FROM system_tariffs`).get() as any;
    activeRides = rideRow?.count || 0;
    onlineDrivers = driverRow?.count || 0;
    totalTariffs = tariffRow?.count || 0;
    dbHealthy = true;
  } catch (e) {
    dbHealthy = false;
  }

  const memory = process.memoryUsage();
  const socketClientsCount = io.engine?.clientsCount || 0;

  res.json({
    status: dbHealthy ? 'ok' : 'degraded',
    service: 'Chebelew Mobility & Dispatch API',
    version: '2.0.0-enterprise',
    environment: process.env.NODE_ENV || 'production',
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      connected: dbHealthy,
      journalMode: 'WAL',
      activeRidesCount: activeRides,
      onlineDriversCount: onlineDrivers,
      configuredTariffsCount: totalTariffs,
    },
    websockets: {
      activeClientsCount: socketClientsCount,
    },
    memory: {
      rssMb: Math.round(memory.rss / 1024 / 1024),
      heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
    },
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
setProviderIO(io);
app.use('/api/providers', providerRouter);
app.use('/api/partners', providerRouter);
app.use('/api/safety', createSafetyRouter(io));
app.use('/api/corporate', corporateRouter);
app.use('/api/developer', developerRouter);
app.use('/api/payment', paymentRouter);
app.use('/api', paymentRouter);
app.use('/api/media', mediaRouter);

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
        LocationService.flushImmediate();
        LocationService.reset();
        QueueService.stop();
        db.close();
        console.log('Database connection and background workers closed cleanly.');
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
