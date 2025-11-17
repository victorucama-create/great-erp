// seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Tenant = require('./models/Tenant');
const User = require('./models/User');
const Warehouse = require('./models/Warehouse');
const Product = require('./models/Product');
const Stock = require('./models/Stock');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('connected to mongodb');

  const tenant = await Tenant.create({ name: 'Demo Tenant', country: 'MZ', currency: 'MZN', plan: 'starter' });
  const pw = bcrypt.hashSync('admin123', 8);
  await User.create({ email:'admin@greatnexus.com', name:'Super Admin', password: pw, role:'super_admin' });
  const tenantAdminPw = bcrypt.hashSync('demo123', 8);
  const tenantUser = await User.create({ email:'demo@greatnexus.com', name:'Demo Admin', password: tenantAdminPw, role: 'tenant_admin', tenantId: tenant._id });

  const wh = await Warehouse.create({ tenantId: tenant._id, name: 'Main Warehouse' });

  const p1 = await Product.create({ tenantId: tenant._id, sku: 'PRD001', name: 'Hambúrguer Frango', salePrice: mongoose.Types.Decimal128.fromString('120'), costPrice: mongoose.Types.Decimal128.fromString('70'), stockTotal: 150 });
  const p2 = await Product.create({ tenantId: tenant._id, sku: 'PRD002', name: 'Piri-Piri 500g', salePrice: mongoose.Types.Decimal128.fromString('80'), costPrice: mongoose.Types.Decimal128.fromString('40'), stockTotal: 240 });

  await Stock.create({ productId: p1._id, warehouseId: wh._id, qty: 150 });
  await Stock.create({ productId: p2._id, warehouseId: wh._id, qty: 240 });

  console.log('seed done');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
