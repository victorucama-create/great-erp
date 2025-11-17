// controllers/mola.controller.js
const Investment = require('../models/Investment');
const mongoose = require('mongoose');

// rate: default 0.003 (0.3%), tax 20%
const DEFAULT_RATE = 0.003;
const DEFAULT_TAX = 0.20;

async function invest(req, res) {
  try {
    const { capital, days, rate } = req.body;
    const rateUsed = rate != null ? Number(rate) : DEFAULT_RATE;
    const gross = (Number(capital) * Number(days) * rateUsed);
    const tax = gross * DEFAULT_TAX;
    const net = gross - tax;

    const inv = await Investment.create({
      userId: req.user.id,
      tenantId: req.user.tenantId,
      capital: mongoose.Types.Decimal128.fromString(String(capital)),
      days,
      rate: mongoose.Types.Decimal128.fromString(String(rateUsed)),
      gross: mongoose.Types.Decimal128.fromString(String(gross)),
      tax: mongoose.Types.Decimal128.fromString(String(tax)),
      net: mongoose.Types.Decimal128.fromString(String(net)),
      status: 'active'
    });

    return res.json({ success:true, data: { id: inv._id, gross: String(gross), tax: String(tax), net: String(net) }});
  } catch (err) { console.error(err); return res.status(500).json({ success:false }); }
}

async function listInvestments(req, res) {
  try {
    const filter = req.user.role === 'super_admin' ? {} : { tenantId: req.user.tenantId };
    const invs = await Investment.find(filter).lean();
    return res.json({ success:true, data: invs });
  } catch (err) { console.error(err); return res.status(500).json({ success:false }); }
}

module.exports = { invest, listInvestments };
