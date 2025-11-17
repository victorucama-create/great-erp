// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const pw = bcrypt.hashSync('admin123', 8);
  const user = await prisma.user.create({
    data: { email: 'admin@greatnexus.com', name: 'Super Admin', password: pw, role: 'super_admin' }
  });
  const tenant = await prisma.tenant.create({
    data: { name: 'Demo Tenant', country: 'MZ', currency: 'MZN', plan: 'starter' }
  });

  await prisma.product.createMany({
    data: [
      { tenantId: tenant.id, sku: 'PRD001', name:'Hambúrguer Frango', salePrice: 120, costPrice: 70, stockTotal:150, reorderLevel:10 },
      { tenantId: tenant.id, sku: 'PRD002', name:'Piri-Piri 500g', salePrice: 80, costPrice: 40, stockTotal:240, reorderLevel:20 }
    ]
  });
  console.log('Seed complete');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(()=> prisma.$disconnect());
