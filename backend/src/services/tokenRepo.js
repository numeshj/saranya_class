import crypto from 'crypto';
import { RefreshToken } from '../models/RefreshToken.js';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import { prisma } from '../config/prisma.js';

const usePrisma = !!process.env.MYSQL_URL;

// Refresh token persistence abstraction
export async function createRefreshToken({ userId, rawToken, userAgent, ip, replacedBy }) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  let expiresAt;
  try {
    const payload = JSON.parse(Buffer.from(rawToken.split('.')[1], 'base64').toString());
    if (payload.exp) expiresAt = new Date(payload.exp * 1000);
  } catch { /* ignore */ }
  if (usePrisma) {
    const rec = await prisma.userSession.create({ data:{ userId: Number(userId), tokenHash, userAgent, ip, expiresAt } });
    return { id: rec.id, token: rawToken };
  }
  const doc = await RefreshToken.create({ user: userId, tokenHash, userAgent, ip, expiresAt, replacedBy });
  return { id: doc.id, token: rawToken };
}

export async function revokeRefreshToken(rawToken) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  if (usePrisma) {
    await prisma.userSession.updateMany({ where:{ tokenHash }, data:{ revokedAt: new Date() } });
    return;
  }
  await RefreshToken.findOneAndUpdate({ tokenHash }, { revokedAt: new Date() });
}

export async function rotateRefreshToken(oldRaw, newRaw, userId, meta) {
  await revokeRefreshToken(oldRaw);
  return createRefreshToken({ userId, rawToken: newRaw, ...meta });
}

export async function validateRefreshToken(rawToken, userId) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  if (usePrisma) {
    const rec = await prisma.userSession.findFirst({ where:{ userId: Number(userId), tokenHash, revokedAt: null, expiresAt: { gt: new Date() } } });
    return !!rec;
  }
  const stored = await RefreshToken.findOne({ user: userId, tokenHash, revokedAt: null });
  if (!stored) return false;
  if (stored.expiresAt && stored.expiresAt < new Date()) return false;
  return true;
}

// Password reset tokens abstraction
export async function createPasswordResetToken(userId, rawToken, expiresAt) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  if (usePrisma) {
    await prisma.passwordResetToken.create({ data:{ userId: Number(userId), tokenHash, expiresAt } });
    return;
  }
  await PasswordResetToken.create({ user: userId, tokenHash, expiresAt });
}

export async function consumePasswordResetToken(rawToken) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  if (usePrisma) {
    const rec = await prisma.passwordResetToken.findFirst({ where:{ tokenHash, usedAt: null, expiresAt: { gt: new Date() } } });
    if (!rec) return null;
    await prisma.passwordResetToken.update({ where:{ id: rec.id }, data:{ usedAt: new Date() } });
    return rec.userId;
  }
  const rec = await PasswordResetToken.findOne({ tokenHash, usedAt: null, expiresAt: { $gt: new Date() } });
  if (!rec) return null;
  rec.usedAt = new Date();
  await rec.save();
  return rec.user;
}
