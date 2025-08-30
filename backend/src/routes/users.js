import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { User, USER_ROLES } from '../models/User.js';

const router = Router();

router.get('/roles', authenticate(['admin','management']), (req, res) => {
  res.json({ roles: USER_ROLES });
});

router.get('/me', authenticate(), async (req, res) => {
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
  const users = await User.find().limit(200);
  res.json(users.map(u => u.toSafeObject()));
});

export default router;
