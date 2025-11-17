// models/Shipment.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ShipmentSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  orderRef: String,
  carrier: String,
  trackingNumber: String,
  origin: String,
  destination: String,
  status: { type: String, enum: ['pending','shipped','in_transit','delivered','cancelled'], default: 'pending' },
  events: [{ time: Date, location: String, status: String, note: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Shipment', ShipmentSchema);
