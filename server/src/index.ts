import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { Server as SocketIOServer } from 'socket.io';
import { initDatabase } from './db/database.js';
import { setupSocketHandlers } from './socket/socketHandler.js';
import { authRouter } from './routes/authRoutes.js';
import { createRideRouter } from './routes/rideRoutes.js';
import { createDriverRouter } from './routes/driverRoutes.js';
import { createTelebirrRouter } from './routes/telebirrRoutes.js';
import { createAdminRouter } from './routes/adminRoutes.js';
import { geoRouter } from './routes/geoRoutes.js';

const app = express();
const server = http.createServer(app);

// CORS configuration for local development & cross-port communication
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Initialize SQLite database schema and seed data
initDatabase();

// Setup Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

setupSocketHandlers(io);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Chebelew Mobility & Dispatch API',
    version: '1.0.0',
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

// Serve frontend static build if available (production mode / unified server)
const possiblePaths = [
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'public'),
];

const foundDist = possiblePaths.find((p) => fs.existsSync(p));

if (foundDist) {
  app.use(express.static(foundDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(foundDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚕 Chebelew Ethiopia Ride-Hailing Backend Server`);
  console.log(`   Running at: http://localhost:${PORT}`);
  console.log(`   Health Check: http://localhost:${PORT}/api/health`);
  console.log(`   WebSockets ready for live GPS & dispatch events`);
  console.log(`=======================================================`);
});

export { app, server, io };
