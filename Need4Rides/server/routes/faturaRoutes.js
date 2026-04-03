const express = require('express');
const faturaController = require('../controllers/faturaController');

const router = express.Router();
router.post('/emitir', faturaController.emitirFatura);

module.exports = router;