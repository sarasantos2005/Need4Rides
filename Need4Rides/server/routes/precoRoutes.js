const express = require('express');
const precoController = require('../controllers/precoController');

const router = express.Router();
router.get('/', precoController.preco);

module.exports = router;