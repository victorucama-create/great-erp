const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProdOrderSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product' },
  qty: { type: Number, required: true },
  status: { type: String, enum:['planned','in_progress','done','cancelled'], default:'planned' },
  operations: [{ name: String, duration: Number, machine: String }],
  startDate: Date,
  endDate: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ProductionOrder', ProdOrderSchema);
