import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export function authenticate(roles = []) {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.substring(7) : null;
      if (!token) return res.status(401).json({ message: 'Missing token' });
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(payload.sub);
      if (!user || !user.isActive) return res.status(401).json({ message: 'Invalid user' });
      if (roles.length && !roles.includes(user.role)) return res.status(403).json({ message: 'Forbidden' });
      req.user = user;
      next();
    } catch (e) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  };
}

// Simple in-memory login attempts tracker (could be moved to Redis for scale)
const attempts = new Map(); // key: email, value: { count, lastAttempt, lockedUntil }

export function trackLoginAttempt(email, success) {
  if (!email) return;
  const now = Date.now();
  let rec = attempts.get(email) || { count:0, lockedUntil:0 };
  if (rec.lockedUntil && rec.lockedUntil > now) return rec; // still locked
  if (success) {
    rec = { count:0, lockedUntil:0 };
  } else {
    rec.count += 1;
    if (rec.count >= 5) {
      rec.lockedUntil = now + 15 * 60 * 1000; // 15 min lockout
      rec.count = 0;
    }
  }
  attempts.set(email, rec);
  return rec;
}

export function isLocked(email) {
  const rec = attempts.get(email);
  if (!rec) return false;
  return rec.lockedUntil && rec.lockedUntil > Date.now();
}
