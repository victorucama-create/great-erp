const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContractSchema = new Schema({
  tenantSeller: { type: Schema.Types.ObjectId, ref: 'Tenant' },
  tenantBuyer: { type: Schema.Types.ObjectId, ref: 'Tenant' },
  title: String,
  terms: String,
  status: { type: String, enum: ['draft','active','terminated'], default: 'draft' },
  attachments: [{ type: Schema.Types.ObjectId, ref: 'Attachment' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contract', ContractSchema);
