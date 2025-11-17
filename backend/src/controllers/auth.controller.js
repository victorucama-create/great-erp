// controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const { signToken } = require('../middlewares/auth');

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(401).json({ success:false, error:'invalid_credentials' });

    const ok = bcrypt.compareSync(password, user.password);
    if (!ok) return res.status(401).json({ success:false, error:'invalid_credentials' });

    const token = signToken({ id: user._id, role: user.role, tenantId: user.tenantId });
    const tenant = user.tenantId ? await Tenant.findById(user.tenantId).lean() : null;

    return res.json({ success:true, data: { user: { id: user._id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId }, tenant, accessToken: token }});
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success:false, error:'server_error' });
  }
}

module.exports = { login };
