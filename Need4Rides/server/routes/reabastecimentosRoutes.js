const express = require('express');
const reabastecimentoController = require('../controllers/reabastecimentoController');

const router = express.Router();
router.post('/', reabastecimentoController.registarReabastecimento);
router.get('/:id', reabastecimentoController.listarReabastecimentos);
router.patch('/:id', reabastecimentoController.finalizarReabastecimento);

module.exports = router;