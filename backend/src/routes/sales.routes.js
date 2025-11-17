// backend/src/routes/sales.routes.js
const express = require('express');
const router = express.Router();
const salesCtrl = require('../controllers/sales.controller');
const { verifyToken } = require('../middlewares/auth');
const { tenantFilter } = require('../middlewares/tenant');

// List & get
router.get('/invoices', verifyToken, tenantFilter, salesCtrl.listInvoices);
router.get('/invoices/:id', verifyToken, tenantFilter, salesCtrl.getInvoice);

// Create invoice (detailed)
router.post('/invoices', verifyToken, tenantFilter, salesCtrl.createInvoice);

// POS quick sale (immediate payment)
router.post('/pos', verifyToken, tenantFilter, salesCtrl.createPosSale);

// payments
router.post('/invoices/:id/pay', verifyToken, tenantFilter, salesCtrl.payInvoice);

// cancel
router.post('/invoices/:id/cancel', verifyToken, tenantFilter, salesCtrl.cancelInvoice);

// exports
router.get('/export/invoices/csv', verifyToken, tenantFilter, salesCtrl.exportInvoicesCsv);
router.get('/export/invoices/:id/html', verifyToken, tenantFilter, salesCtrl.exportInvoiceHtml);

module.exports = router;
