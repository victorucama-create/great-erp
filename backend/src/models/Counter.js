// backend/src/models/Counter.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Counter document stores sequence numbers for a given key (e.g. invoice_2025_tenantId)
 * We will use findOneAndUpdate({ key }, { $inc: { seq: 1 } }, { upsert:true, new:true }) to get next seq atomically.
 */
const CounterSchema = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  seq: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

CounterSchema.pre('save', function(next){ this.updatedAt = Date.now(); next(); });

module.exports = mongoose.model('Counter', CounterSchema);
