const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ListingSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true }, // seller tenant
  productId: { type: Schema.Types.ObjectId, ref: 'Product' },
  title: String,
  description: String,
  price: { type: Schema.Types.Decimal128 },
  quantity: Number,
  shippingOptions: Array,
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Listing', ListingSchema);
