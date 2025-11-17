// backend/src/models/Invoice.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InvoiceItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product' },
  sku: String,
  name: String,
  qty: { type: Number, default: 1 },
  unitPrice: { type: Schema.Types.Decimal128, default: 0 },
  discount: { type: Schema.Types.Decimal128, default: 0 }, // absolute
  taxRate: { type: Number, default: 0 }, // percentage e.g., 17
  total: { type: Schema.Types.Decimal128, default: 0 } // computed line total after discount + tax
}, { _id: false });

const PaymentSchema = new Schema({
  method: { type: String }, // card, transfer, mpesa, paypal, cash
  reference: { type: String },
  amount: { type: Schema.Types.Decimal128, default: 0 },
  currency: { type: String, default: 'MZN' },
  paidAt: { type: Date, default: Date.now },
  receivedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

const InvoiceSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  invoiceNumber: { type: String, required: true, unique: true },
  customer: {
    name: String,
    email: String,
    phone: String,
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact' }
  },
  items: [InvoiceItemSchema],
  subtotal: { type: Schema.Types.Decimal128, default: 0 },
  totalTax: { type: Schema.Types.Decimal128, default: 0 },
  totalDiscount: { type: Schema.Types.Decimal128, default: 0 },
  total: { type: Schema.Types.Decimal128, default: 0 },
  currency: { type: String, default: 'MZN' },
  status: { type: String, enum: ['draft','pending','paid','cancelled','refunded'], default: 'draft' },
  payments: [PaymentSchema],
  notes: String,
  meta: { type: Object, default: {} }, // arbitrary extra data: billing address, terms
  attachments: [{ type: Schema.Types.ObjectId, ref: 'Attachment' }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

InvoiceSchema.pre('save', function(next){ this.updatedAt = Date.now(); next(); });

module.exports = mongoose.model('Invoice', InvoiceSchema);
