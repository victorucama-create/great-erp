// models/SEOProfile.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SEOProfileSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  siteUrl: String,
  metaTitle: String,
  metaDescription: String,
  sitemapStatus: { type: String, default: 'not_generated' },
  analyticsConnected: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SEOProfile', SEOProfileSchema);
