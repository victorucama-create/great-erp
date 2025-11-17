const express = require('express');
const router = express.Router();
const molaCtrl = require('../controllers/mola.controller');
const { verifyToken } = require('../middlewares/auth');

router.post('/invest', verifyToken, molaCtrl.invest);
router.get('/investments', verifyToken, molaCtrl.listInvestments);

module.exports = router;
