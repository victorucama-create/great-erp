// models/Product.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  sku: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  costPrice: { type: Schema.Types.Decimal128, default: 0.0 },
  salePrice: { type: Schema.Types.Decimal128, default: 0.0 },
  wholesalePrice: { type: Schema.Types.Decimal128, default: 0.0 },
  stockTotal: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 0 },
  archived: { type: Boolean, default: false },
  variants: { type: Array, default: [] }, // e.g., [{ name:'size', options: ['S','M'] }]
  attachments: [{ type: Schema.Types.ObjectId, ref: 'Attachment' }],
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ProductSchema.pre('save', function(next){ this.updatedAt = Date.now(); next(); });

module.exports = mongoose.model('Product', ProductSchema);
