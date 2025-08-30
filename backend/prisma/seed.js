import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/hash.js';

const prisma = new PrismaClient();

async function run() {
  const roles = ['guest','student','parent','teacher','management','admin'];
  for (const name of roles) {
    await prisma.role.upsert({ where:{ name }, update:{}, create:{ name } });
  }
  const adminEmail = 'admin@center.test';
  const existing = await prisma.user.findUnique({ where:{ email: adminEmail } });
  if (!existing) {
  const passwordHash = await hashPassword('AdminPass123!');
    const adminRole = await prisma.role.findUnique({ where:{ name:'admin' } });
    await prisma.user.create({ data:{ firstName:'System', lastName:'Admin', email: adminEmail, passwordHash, roles:{ create:{ roleId: adminRole.id } } } });
    console.log('Prisma admin user created');
  } else {
    console.log('Prisma admin user exists');
  }
}
run().catch(e=>{ console.error(e); process.exit(1); }).finally(()=>prisma.$disconnect());