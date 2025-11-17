// src/routes/products.routes.js
const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const productsController = require('../controllers/products.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

// Public list (could be tenant-filtered)
router.get('/products', verifyToken, productsController.listProducts);
router.get('/products/:id', verifyToken, [ param('id').isUUID() ], productsController.getProduct);

// CRUD
router.post('/products',
  verifyToken,
  [
    body('sku').isString().notEmpty(),
    body('name').isString().notEmpty(),
    body('salePrice').isNumeric()
  ],
  productsController.createProduct
);

router.put('/products/:id',
  verifyToken,
  [ param('id').isUUID() ],
  productsController.updateProduct
);

router.delete('/products/:id',
  verifyToken,
  [ param('id').isUUID() ],
  productsController.deleteProduct
);

// Attachments
router.post('/products/:id/attachments', verifyToken, upload.single('file'), productsController.uploadAttachment);

// Stock movements / inventory
router.post('/stock-movements', verifyToken, productsController.createStockMovement);
router.get('/stock/:productId', verifyToken, productsController.getStockByProduct);

// export CSV
router.get('/products-export/csv', verifyToken, productsController.exportProductsCsv);

module.exports = router;
