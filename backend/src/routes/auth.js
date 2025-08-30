import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import argon2 from 'argon2';
import { body, validationResult } from 'express-validator';
import { config } from '../config/env.js';
import crypto from 'crypto';
import { makeValidator, schemas } from '../utils/validate.js';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { trackLoginAttempt, isLocked } from '../middleware/auth.js';

const router = Router();

function signTokens(user) {
  const access = jwt.sign({ role: user.role }, process.env.JWT_ACCESS_SECRET, { subject: user.id, expiresIn: config.accessTokenTtl });
  const refresh = jwt.sign({ v: user.refreshTokenVersion }, process.env.JWT_REFRESH_SECRET, { subject: user.id, expiresIn: config.refreshTokenTtl });
  return { access, refresh };
}

router.post('/register', makeValidator(schemas.register), async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email in use' });
  const passwordHash = await argon2.hash(password);
  const user = await User.create({ email, passwordHash, firstName, lastName, role: 'student' });
  const tokens = signTokens(user);
  const refreshDoc = await persistRefresh(user, tokens.refresh, req);
  res.status(201).json({ user: user.toSafeObject(), access: tokens.access, refresh: refreshDoc.token });
});

router.post('/login', body('email').isEmail(), body('password').notEmpty(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, password } = req.body;
  if (isLocked(email)) return res.status(423).json({ message: 'Account temporarily locked' });
  const user = await User.findOne({ email });
  if (!user) { trackLoginAttempt(email, false); return res.status(401).json({ message: 'Invalid credentials' }); }
  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) { const rec = trackLoginAttempt(email, false); return res.status(401).json({ message: 'Invalid credentials', lockedUntil: rec?.lockedUntil }); }
  trackLoginAttempt(email, true);
  user.lastLoginAt = new Date();
  await user.save();
  const tokens = signTokens(user);
  const refreshDoc = await persistRefresh(user, tokens.refresh, req);
  res.json({ user: user.toSafeObject(), access: tokens.access, refresh: refreshDoc.token });
});

router.post('/refresh', async (req, res) => {
  const { refresh } = req.body;
  if (!refresh) return res.status(400).json({ message: 'Missing refresh token' });
  try {
    const payload = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: 'Invalid' });
    const tokenHash = crypto.createHash('sha256').update(refresh).digest('hex');
    const stored = await RefreshToken.findOne({ user: user.id, tokenHash, revokedAt: null });
    if (!stored || stored.expiresAt < new Date()) return res.status(401).json({ message: 'Expired' });
    // rotate
    stored.revokedAt = new Date();
    await stored.save();
    const tokens = signTokens(user);
    const newDoc = await persistRefresh(user, tokens.refresh, req, stored.id);
    res.json({ access: tokens.access, refresh: newDoc.token });
  } catch (e) {
    return res.status(401).json({ message: 'Invalid' });
  }
});

router.post('/logout', async (req, res) => {
  const { refresh } = req.body;
  if (refresh) {
    const tokenHash = crypto.createHash('sha256').update(refresh).digest('hex');
    await RefreshToken.findOneAndUpdate({ tokenHash }, { revokedAt: new Date() });
  }
  res.json({ message: 'Logged out' });
});

// 2FA setup for admin/management users
router.post('/2fa/setup', async (req,res) => {
  const { refresh } = req.body; // require authentication via refresh for simplicity (could use access token + authenticate middleware)
  if (!refresh) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const payload = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || !['admin','management'].includes(user.role)) return res.status(403).json({ message: 'Forbidden' });
    const secret = speakeasy.generateSecret({ length: 20, name: `TuitionCenter:${user.email}` });
    user.twoFactorSecret = secret.base32;
    await user.save();
    const qr = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ qr, secret: secret.base32 });
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
});

router.post('/2fa/verify', async (req,res)=>{
  const { refresh, token } = req.body;
  if (!refresh || !token) return res.status(400).json({ message: 'Missing token' });
  try {
    const payload = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || !user.twoFactorSecret) return res.status(400).json({ message: '2FA not enabled' });
    const ok = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding:'base32', token, window:1 });
    if (!ok) return res.status(401).json({ message: 'Invalid 2FA token' });
    res.json({ message: '2FA verified' });
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
});

async function persistRefresh(user, refresh, req, replacedBy) {
  const tokenHash = crypto.createHash('sha256').update(refresh).digest('hex');
  const decoded = jwt.decode(refresh);
  const expiresAt = new Date(decoded.exp * 1000);
  const doc = await RefreshToken.create({ user: user.id, tokenHash, userAgent: req.headers['user-agent'], ip: req.ip, expiresAt, replacedBy });
  return { id: doc.id, token: refresh };
}

export default router;
