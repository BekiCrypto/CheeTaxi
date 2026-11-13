import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';

export const developerRouter = Router();

/**
 * List active developer API keys
 */
developerRouter.get('/keys', (req, res) => {
  const keys = db.prepare('SELECT id, name, key_prefix, environment, rate_limit_per_min, is_active, created_at, last_used_at FROM developer_api_keys').all();
  return res.json({ keys });
});

/**
 * Generate a new developer API key
 */
developerRouter.post('/keys', (req, res) => {
  const { name = 'Developer Integration Key', environment = 'test' } = req.body;
  const keyId = `key_${uuidv4().substring(0, 8)}`;
  const keyPrefix = environment === 'live' ? 'chb_live' : 'chb_test';
  const secretRandom = uuidv4().replace(/-/g, '');
  const rawKey = `${keyPrefix}_${secretRandom}`;
  const hashedSecret = `sha256_${rawKey.slice(-16)}`;

  db.prepare(`
    INSERT INTO developer_api_keys (
      id, name, key_prefix, hashed_secret, environment, rate_limit_per_min, is_active, created_at
    ) VALUES (?, ?, ?, ?, ?, 120, 1, ?)
  `).run(keyId, name, keyPrefix, hashedSecret, environment, new Date().toISOString());

  return res.status(201).json({
    success: true,
    key: {
      id: keyId,
      name,
      apiKey: rawKey,
      environment,
      rateLimitPerMinute: 120,
      note: 'Store this key securely. It cannot be retrieved again in raw form.',
    },
  });
});

/**
 * OpenAPI v3 specification documentation endpoint
 */
developerRouter.get('/openapi.json', (req, res) => {
  res.json({
    openapi: '3.0.3',
    info: {
      title: 'Chebelew Mobility & Delivery Platform API',
      version: '2.0.0',
      description:
        'Official REST API for Chebelew Multi-Provider Ride-Hailing, Logistics, Driver Subscription, and Enterprise Mobility Platform.',
      contact: {
        name: 'Chebelew Developer Relations',
        email: 'developer@chebelew.et',
        url: 'https://chebelew.et/developers',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Local Development & Staging Server',
      },
      {
        url: 'https://api.chebelew.et',
        description: 'Production African Cloud Server',
      },
    ],
    paths: {
      '/api/rides/estimate': {
        post: {
          summary: 'Calculate fare estimates across categories and aggregators',
          responses: { 200: { description: 'Fare estimate breakdown with VAT 15%' } },
        },
      },
      '/api/rides': {
        post: {
          summary: 'Create a ride request',
          responses: { 201: { description: 'Ride booking created and dispatched' } },
        },
      },
      '/api/subscriptions/plans': {
        get: {
          summary: 'List available driver subscription plans (0% commission model)',
          responses: { 200: { description: 'Plans list' } },
        },
      },
      '/api/deliveries': {
        post: {
          summary: 'Create on-demand parcel/document delivery request with dual OTPs',
          responses: { 201: { description: 'Delivery order created' } },
        },
      },
      '/api/safety/sos': {
        post: {
          summary: 'Trigger emergency SOS with coordinates',
          responses: { 201: { description: 'SOS incident alerted to safety desk and police' } },
        },
      },
    },
  });
});
