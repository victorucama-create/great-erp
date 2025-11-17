// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  password: { type: String, required: true }, // hashed
  role: { type: String, enum: ['super_admin','tenant_admin','manager','accountant','staff','customer','partner'], default: 'staff' },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null },
  phone: { type: String },
  active: { type: Boolean, default: true },
  locale: { type: String, default: 'pt' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
