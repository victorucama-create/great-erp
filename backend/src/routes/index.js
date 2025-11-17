const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/erp', require('./products.routes'));
router.use('/mola', require('./mola.routes'));
router.use('/erp/sales', require('./sales.routes'));

// TODO: add crm, mrp, hr, b2b, logistics routes

module.exports = router;
