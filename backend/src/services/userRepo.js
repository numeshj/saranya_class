import { User as MongoUser } from '../models/User.js';
import { prisma } from '../config/prisma.js';
import { hashPassword } from '../utils/hash.js';

const usePrisma = !!process.env.MYSQL_URL;

export async function findUserByEmail(email) {
  if (usePrisma) return prisma.user.findUnique({ where: { email }, include:{ roles:{ include:{ role:true } } } });
  return MongoUser.findOne({ email });
}

export async function createUser({ firstName, lastName, email, password, role='student' }) {
  const passwordHash = await hashPassword(password);
  if (usePrisma) {
    // ensure role exists
    let r = await prisma.role.findUnique({ where:{ name: role } });
    if (!r) r = await prisma.role.create({ data:{ name: role } });
    const user = await prisma.user.create({ data:{ firstName, lastName, email, passwordHash, roles:{ create:{ roleId: r.id } } } , include:{ roles:{ include:{ role:true } } }});
    return user;
  }
  return MongoUser.create({ firstName, lastName, email, passwordHash, role });
}

export function toSafe(user) {
  if (!user) return null;
  if (usePrisma) {
    const { passwordHash, twoFactorSecret, ...rest } = user;
    return { ...rest, roles: user.roles?.map(r=>r.role.name) };
  }
  return user.toSafeObject();
}