const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const pagamentoController = require('../controllers/pagamentoController');

router.post('/criar-intent', auth, pagamentoController.criarIntent);
router.post('/confirmar',    auth, pagamentoController.confirmar);

module.exports = router;
