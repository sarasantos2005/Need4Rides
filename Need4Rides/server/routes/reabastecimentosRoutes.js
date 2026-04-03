const express = require('express');
const reabastecimentoController = require('../controllers/reabastecimentoController');

const router = express.Router();
router.post('/registrar', reabastecimentoController.registarReabastecimento);

module.exports = router;