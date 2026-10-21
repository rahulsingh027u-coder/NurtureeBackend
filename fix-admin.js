const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  try {
    const hash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'changeme-' + Date.now(), 10);
    const admin = await prisma.admin.upsert({
      where: { email: 'admin@nurturee.in' },
      update: { password: hash, name: 'Super Admin', role: 'super_admin', isActive: true },
      create: {
        email: 'admin@nurturee.in',
        password: hash,
        name: 'Super Admin',
        role: 'super_admin',
        permissions: '{"all": true}',
        activeBranches: '["all"]',
        isActive: true,
      },
    });
    console.log('SUCCESS: Admin user ready ->', admin.email, admin.id);
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
