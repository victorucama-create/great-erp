// models/StockMovement.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StockMovementSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
  type: { type: String, enum: ['IN','OUT','TRANSFER','ADJUSTMENT'], required: true },
  qty: { type: Number, required: true },
  reference: { type: String },
  reason: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StockMovement', StockMovementSchema);
