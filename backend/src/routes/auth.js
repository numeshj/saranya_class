import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { findUserByEmail, createUser, toSafe } from '../services/userRepo.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { verifyPassword, hashPassword } from '../utils/hash.js';
import { body, validationResult } from 'express-validator';
import { config } from '../config/env.js';
import crypto from 'crypto';
import { makeValidator, schemas } from '../utils/validate.js';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { trackLoginAttempt, isLocked } from '../middleware/auth.js';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import { prisma } from '../config/prisma.js';
import { createRefreshToken, revokeRefreshToken, validateRefreshToken, rotateRefreshToken, createPasswordResetToken, consumePasswordResetToken } from '../services/tokenRepo.js';

const router = Router();
const usePrisma = !!process.env.MYSQL_URL;

function signTokens(user) {
  const userId = usePrisma ? String(user.id) : user.id;
  const roles = usePrisma ? (user.roles?.map(r=>r.role.name) || []) : [user.role];
  const primaryRole = roles[0];
  const access = jwt.sign({ roles, role: primaryRole }, process.env.JWT_ACCESS_SECRET, { subject: userId, expiresIn: config.accessTokenTtl });
  const refresh = jwt.sign({ v: user.refreshTokenVersion || 0 }, process.env.JWT_REFRESH_SECRET, { subject: userId, expiresIn: config.refreshTokenTtl });
  return { access, refresh };
}

router.post('/register', makeValidator(schemas.register), async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  const exists = await findUserByEmail(email);
  if (exists) return res.status(409).json({ message: 'Email in use' });
  const user = await createUser({ email, password, firstName, lastName, role: 'student' });
  const tokens = signTokens(user);
  const refreshDoc = await createRefreshToken({ userId: usePrisma ? user.id : user.id, rawToken: tokens.refresh, userAgent: req.headers['user-agent'], ip: req.ip });
  res.status(201).json({ user: toSafe(user), access: tokens.access, refresh: refreshDoc.token });
});

router.post('/login', body('email').isEmail(), body('password').notEmpty(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, password } = req.body;
  if (isLocked(email)) return res.status(423).json({ message: 'Account temporarily locked' });
  const user = await findUserByEmail(email);
  if (!user) { trackLoginAttempt(email, false); return res.status(401).json({ message: 'Invalid credentials' }); }
  const passwordHash = usePrisma ? user.passwordHash : user.passwordHash;
  const valid = await verifyPassword(passwordHash, password);
  if (!valid) { const rec = trackLoginAttempt(email, false); return res.status(401).json({ message: 'Invalid credentials', lockedUntil: rec?.lockedUntil }); }
  trackLoginAttempt(email, true);
  // update lastLogin
  if (usePrisma) {
    await prisma.user.update({ where:{ id: user.id }, data:{ lastLoginAt: new Date() } });
  } else {
    user.lastLoginAt = new Date();
    await user.save();
  }
  const tokens = signTokens(user);
  const refreshDoc = await createRefreshToken({ userId: usePrisma ? user.id : user.id, rawToken: tokens.refresh, userAgent: req.headers['user-agent'], ip: req.ip });
  res.json({ user: toSafe(user), access: tokens.access, refresh: refreshDoc.token });
});

router.post('/refresh', async (req, res) => {
  const { refresh } = req.body;
  if (!refresh) return res.status(400).json({ message: 'Missing refresh token' });
  try {
    const payload = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET);
    const userId = payload.sub;
    let user;
    if (usePrisma) {
      user = await prisma.user.findUnique({ where:{ id: Number(userId) }, include:{ roles:{ include:{ role:true } } } });
    } else {
      user = await User.findById(userId);
    }
    if (!user) return res.status(401).json({ message: 'Invalid' });
    const ok = await validateRefreshToken(refresh, userId);
    if (!ok) return res.status(401).json({ message: 'Expired' });
    const tokens = signTokens(user);
    await rotateRefreshToken(refresh, tokens.refresh, userId, { userAgent: req.headers['user-agent'], ip: req.ip });
    res.json({ access: tokens.access, refresh: tokens.refresh });
  } catch (e) {
    return res.status(401).json({ message: 'Invalid' });
  }
});

router.post('/logout', async (req, res) => {
  const { refresh } = req.body;
  if (refresh) {
    await revokeRefreshToken(refresh);
  }
  res.json({ message: 'Logged out' });
});

// 2FA setup (Mongo only currently)
router.post('/2fa/setup', async (req,res) => {
  if (usePrisma) return res.status(501).json({ message: '2FA setup via Prisma not yet implemented' });
  const { refresh } = req.body;
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
  if (usePrisma) return res.status(501).json({ message: '2FA verify via Prisma not yet implemented' });
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

// Password reset request
router.post('/password/reset/request', body('email').isEmail(), async (req,res)=>{
  const { email } = req.body;
  const user = await findUserByEmail(email);
  if (!user) return res.json({ message: 'If that email exists, a reset link has been sent' });
  const raw = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
  await createPasswordResetToken(usePrisma ? user.id : user.id, raw, expiresAt);
  res.json({ message: 'Reset token generated', token: raw });
});

router.post('/password/reset/confirm', body('token').notEmpty(), body('password').isLength({ min:8 }), async (req,res)=>{
  const { token, password } = req.body;
  const userId = await consumePasswordResetToken(token);
  if (!userId) return res.status(400).json({ message: 'Invalid or expired reset token' });
  if (usePrisma) {
  const passwordHash = await hashPassword(password);
    await prisma.user.update({ where:{ id: Number(userId) }, data:{ passwordHash, refreshTokenVersion: { increment:1 } } });
  } else {
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ message: 'User not found' });
  user.passwordHash = await hashPassword(password);
    user.refreshTokenVersion += 1;
    await user.save();
  }
  res.json({ message: 'Password updated' });
});

export default router;
