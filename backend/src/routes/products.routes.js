const express = require('express');
const router = express.Router();
const productsCtrl = require('../controllers/products.controller');
const { verifyToken } = require('../middlewares/auth');
const { tenantFilter } = require('../middlewares/tenant');
const upload = require('../middlewares/upload');

router.get('/products', verifyToken, tenantFilter, productsCtrl.listProducts);
router.get('/products/:id', verifyToken, tenantFilter, productsCtrl.getProduct);
router.post('/products', verifyToken, tenantFilter, productsCtrl.createProduct);
router.put('/products/:id', verifyToken, tenantFilter, productsCtrl.updateProduct);
router.delete('/products/:id', verifyToken, tenantFilter, productsCtrl.deleteProduct);
router.post('/products/:id/attachments', verifyToken, tenantFilter, upload.single('file'), productsCtrl.uploadAttachment);

router.post('/stock-movements', verifyToken, tenantFilter, productsCtrl.createStockMovement);

module.exports = router;
