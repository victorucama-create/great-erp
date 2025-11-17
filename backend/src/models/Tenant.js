// models/Tenant.js
const mongoose = require('mongoose');

const TenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  country: { type: String, default: 'MZ' },
  currency: { type: String, default: 'MZN' },
  plan: { type: String, default: 'starter' },
  billingInfo: { type: Object, default: {} },
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

TenantSchema.pre('save', function(next) { this.updatedAt = Date.now(); next(); });

module.exports = mongoose.model('Tenant', TenantSchema);
