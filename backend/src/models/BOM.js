const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BOMSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product' },
  components: [{ componentId: { type: Schema.Types.ObjectId, ref: 'Product' }, qty: Number }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BOM', BOMSchema);
