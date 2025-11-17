const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LeadSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  name: String,
  email: String,
  phone: String,
  source: String,
  status: { type: String, default: 'new' },
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lead', LeadSchema);
