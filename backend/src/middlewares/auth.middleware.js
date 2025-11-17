// src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret';

function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ success:false, error:'Token missing' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // payload: { id, role, iat, exp }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success:false, error:'Invalid token' });
  }
}

module.exports = { verifyToken };
