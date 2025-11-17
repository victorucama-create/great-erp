const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authCtrl = require('../controllers/auth.controller');

router.post('/login', [ body('email').isEmail(), body('password').isString().notEmpty() ], authCtrl.login);

module.exports = router;
