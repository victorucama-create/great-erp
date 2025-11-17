const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", default: null },
    name: String,
    email: { type: String, required: true, unique: true },
    password: String,
    role: { type: String, enum: ["super_admin", "tenant_admin", "staff", "viewer"], default: "staff" },
    status: { type: String, default: "active" }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
