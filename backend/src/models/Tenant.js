const mongoose = require('mongoose');

const TenantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    country: String,
    currency: String,
    plan: { type: String, default: "standard" },
    active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Tenant", TenantSchema);
