const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OpportunitySchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  contactId: { type: Schema.Types.ObjectId, ref: 'Contact' },
  title: String,
  value: { type: Schema.Types.Decimal128, default: 0 },
  probability: { type: Number, default: 0 },
  stage: { type: String, default: 'qualification' },
  expectedClose: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Opportunity', OpportunitySchema);
