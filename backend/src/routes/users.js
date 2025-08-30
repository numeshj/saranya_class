import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { User, USER_ROLES } from '../models/User.js';
import { prisma } from '../config/prisma.js';

const router = Router();
const usePrisma = !!process.env.MYSQL_URL;

router.get('/roles', authenticate(['admin','management']), async (req, res) => {
  if (usePrisma) {
    const roles = await prisma.role.findMany({ select:{ name:true } });
    return res.json({ roles: roles.map(r=>r.name) });
  }
  res.json({ roles: USER_ROLES });
});

router.get('/me', authenticate(), async (req, res) => {
  if (usePrisma) {
    const user = await prisma.user.findUnique({ where:{ id: Number(req.user.id) }, include:{ roles:{ include:{ role:true } } } });
    if (!user) return res.status(404).json({ message: 'Not found' });
    const { passwordHash, twoFactorSecret, ...safe } = user;
    return res.json({ user: { ...safe, roles: user.roles.map(r=>r.role.name) } });
  }
  let extra = {};
  if (req.user.role === 'parent') {
    await req.user.populate('children');
    extra.children = req.user.children.map(c => c.toSafeObject());
  }
  if (req.user.role === 'student' && req.user.parent) {
    await req.user.populate('parent');
    extra.parent = req.user.parent.toSafeObject();
  }
  res.json({ user: req.user.toSafeObject(), ...extra });
});

router.get('/', authenticate(['admin','management']), async (req, res) => {
  if (usePrisma) {
    const users = await prisma.user.findMany({ take:200, include:{ roles:{ include:{ role:true } } } });
    return res.json(users.map(u => { const { passwordHash, twoFactorSecret, ...rest } = u; return { ...rest, roles: u.roles.map(r=>r.role.name) }; }));
  }
  const users = await User.find().limit(200);
  res.json(users.map(u => u.toSafeObject()));
});

export default router;
