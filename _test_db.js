const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.employee.count()
  .then(c => { console.log('DB ALIVE! Employee count:', c); return p["$disconnect"](); })
  .catch(e => { console.log('DB ERROR:', e.message); return p["$disconnect"](); });
