// models/Attachment.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AttachmentSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  refType: { type: String }, // product, invoice, user, etc.
  refId: { type: Schema.Types.ObjectId }, 
  filename: { type: String },
  url: { type: String },
  mimeType: { type: String },
  size: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Attachment', AttachmentSchema);
