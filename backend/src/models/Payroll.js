const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PayrollSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  periodStart: Date,
  periodEnd: Date,
  items: [{ employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' }, gross: Schema.Types.Decimal128, net: Schema.Types.Decimal128, deductions: Array }],
  status: { type: String, enum:['draft','processed','paid'], default:'draft' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payroll', PayrollSchema);
