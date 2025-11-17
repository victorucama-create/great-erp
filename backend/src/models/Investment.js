// models/Investment.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InvestmentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  capital: { type: Schema.Types.Decimal128, required: true },
  days: { type: Number, required: true },
  rate: { type: Schema.Types.Decimal128, required: true }, // e.g., 0.003 (0.3%)
  gross: { type: Schema.Types.Decimal128 },
  tax: { type: Schema.Types.Decimal128 }, // IRPS
  net: { type: Schema.Types.Decimal128 },
  status: { type: String, enum:['active','completed','cancelled'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date }
});

module.exports = mongoose.model('Investment', InvestmentSchema);
