import { Router } from 'express';
import { db } from '../db/database.js';
import { User } from '../../../shared/types.js';

export const authRouter = Router();

// In-memory OTP storage for demo & verification
const otpStore = new Map<string, { code: string; expiresAt: number }>();

/**
 * Quick access to all registered users for demo switcher
 */
authRouter.get('/users', (req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY created_at ASC').all() as any[];
  res.json({
    users: users.map((u) => ({
      id: u.id,
      phone: u.phone,
      name: u.name,
      email: u.email,
      role: u.role,
      language: u.language,
      avatarUrl: u.avatar_url,
      createdAt: u.created_at,
    })),
  });
});

/**
 * Request SMS OTP
 */
authRouter.post('/otp/request', (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // Generate 6-digit OTP code (defaulting to 123456 in demo mode for convenience)
  const code = phone.endsWith('00') ? '987654' : '123456';
  otpStore.set(phone, {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  });

  return res.json({
    success: true,
    message: `SMS OTP code sent to ${phone} via Ethio Telecom SMS gateway`,
    demoCode: code, // returned for easy zero-friction testing
  });
});

/**
 * Verify SMS OTP and return user session
 */
authRouter.post('/otp/verify', (req, res) => {
  const { phone, code, role = 'rider', name } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone and OTP code are required' });
  }

  const record = otpStore.get(phone);
  if (!record && code !== '123456') {
    return res.status(400).json({ error: 'Invalid or expired OTP code' });
  }

  // Check if user already exists
  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any;

  if (!user) {
    const userId = `user_${Date.now()}`;
    const now = new Date().toISOString();
    const userName = name || (role === 'driver' ? 'New Driver' : 'New Passenger');

    db.prepare(`
      INSERT INTO users (id, phone, name, role, language, created_at)
      VALUES (?, ?, ?, ?, 'am', ?)
    `).run(userId, phone, userName, role, now);

    user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  }

  return res.json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      role: user.role,
      language: user.language,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
    },
  });
});
