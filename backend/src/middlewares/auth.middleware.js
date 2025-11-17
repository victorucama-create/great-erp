// middlewares/auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret';

// Middleware to verify JWT and attach user payload to req.user
function verifyToken(req, res, next) {
  const auth = req.headers.authorization || req.headers.Authorization;
  if (!auth) return res.status(401).json({ success:false, error: 'token_missing' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, role, tenantId, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ success:false, error:'invalid_token' });
  }
}

// Helper to sign token (used in auth controller)
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.TOKEN_EXPIRES_IN || '8h' });
}

module.exports = { verifyToken, signToken };
