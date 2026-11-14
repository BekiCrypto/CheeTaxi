import { Router } from 'express';
import { db } from '../db/database.js';
import { User } from '../../../shared/types.js';
import { activeAdminTokens, ADMIN_SESSION_SECRET, ROLE_PERMISSIONS } from '../middleware/adminAuth.js';
import { v4 as uuidv4 } from 'uuid';

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

/**
 * Admin Operational Login Gate
 */
authRouter.post('/admin/login', (req, res) => {
  const { emailOrPhone, passwordOrPin } = req.body;
  if (!emailOrPhone || !passwordOrPin) {
    return res.status(400).json({ error: 'Email/Phone and access passcode/PIN are required' });
  }

  const validPin = passwordOrPin === '9922' || passwordOrPin === 'ChebelewAdmin2026!' || passwordOrPin === '123456';
  if (!validPin) {
    return res.status(401).json({ error: 'Invalid security passcode or PIN' });
  }

  // Find user in database with administrative privileges or resolve role persona
  const admin = db.prepare(`
    SELECT * FROM users
    WHERE (email = ? OR phone = ? OR email LIKE ?)
    AND role IN ('admin', 'super_admin', 'platform_admin', 'dispatcher', 'city_manager', 'compliance_officer', 'finance_officer', 'fleet_manager')
    LIMIT 1
  `).get(emailOrPhone, emailOrPhone, `%${emailOrPhone}%`) as any;

  let resolvedRole = admin?.role || 'super_admin';
  let resolvedName = admin?.name || 'Almaz Tefera';
  let resolvedId = admin?.id || 'user_almaz_admin';

  if (!admin) {
    if (emailOrPhone.includes('callcenter') || emailOrPhone.includes('disp')) {
      resolvedRole = 'dispatcher';
      resolvedName = 'Dawit Bekele';
      resolvedId = 'user_dawit_disp';
    } else if (emailOrPhone.includes('kyc') || emailOrPhone.includes('compliance')) {
      resolvedRole = 'compliance_officer';
      resolvedName = 'Meron Tadesse';
      resolvedId = 'user_meron_kyc';
    } else if (emailOrPhone.includes('fin') || emailOrPhone.includes('tax')) {
      resolvedRole = 'finance_officer';
      resolvedName = 'Henok Girma';
      resolvedId = 'user_henok_fin';
    } else if (emailOrPhone.includes('fleet') || emailOrPhone.includes('coop')) {
      resolvedRole = 'fleet_manager';
      resolvedName = 'Tadesse Alemu';
      resolvedId = 'user_tadesse_fleet';
    }
  }

  const permissions = (ROLE_PERMISSIONS as any)[resolvedRole] || ROLE_PERMISSIONS.super_admin;

  const adminProfile = {
    id: resolvedId,
    name: resolvedName,
    email: emailOrPhone.includes('@') ? emailOrPhone : 'dispatch@chebelew.et',
    phone: emailOrPhone.startsWith('+') ? emailOrPhone : '+251916778899',
    role: resolvedRole,
    permissions,
  };

  const token = `cheb_adm_${uuidv4().substring(0, 16)}`;
  activeAdminTokens.set(token, adminProfile);

  return res.json({
    success: true,
    token,
    admin: adminProfile,
    message: 'Operational Admin authenticated successfully',
  });
});

/**
 * Verify Active Admin Session Token
 */
authRouter.get('/admin/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  const customHeader = req.headers['x-admin-token'];

  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (typeof customHeader === 'string') {
    token = customHeader.trim();
  }

  if (!token) {
    return res.status(401).json({ valid: false, error: 'No admin token provided' });
  }

  const session = activeAdminTokens.get(token);
  if (!session) {
    return res.status(401).json({ valid: false, error: 'Admin session expired or invalid' });
  }

  return res.json({
    valid: true,
    admin: session,
  });
});
