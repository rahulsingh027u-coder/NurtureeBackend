const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();
const hash = bcrypt.hashSync(process.env.SEED_ADMIN_PASSWORD || 'changeme-' + Date.now(), 10);
p.admin.update({ where: { email: 'admin@nurturee.in' }, data: { password: hash } })
  .then(r => console.log('OK', r.email))
  .catch(e => console.error(e))
  .finally(() => p.$disconnect());
