// backend/src/routes/sales.routes.js
const express = require('express');
const router = express.Router();
const salesCtrl = require('../controllers/sales.controller');
const { verifyToken } = require('../middlewares/auth');
const { tenantFilter } = require('../middlewares/tenant');

router.get('/invoices', verifyToken, tenantFilter, salesCtrl.listInvoices);
router.get('/invoices/:id', verifyToken, tenantFilter, salesCtrl.getInvoice);
router.post('/invoices', verifyToken, tenantFilter, salesCtrl.createInvoice);
router.post('/pos', verifyToken, tenantFilter, salesCtrl.createPosSale);
router.post('/invoices/:id/pay', verifyToken, tenantFilter, salesCtrl.payInvoice);
router.post('/invoices/:id/cancel', verifyToken, tenantFilter, salesCtrl.cancelInvoice);
router.get('/export/invoices/csv', verifyToken, tenantFilter, salesCtrl.exportInvoicesCsv);
router.get('/export/invoices/:id/html', verifyToken, tenantFilter, salesCtrl.exportInvoiceHtml);
router.get('/export/invoices/:id/pdf', verifyToken, tenantFilter, salesCtrl.exportInvoicePdf);

module.exports = router;
