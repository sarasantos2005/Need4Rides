const express = require('express');
const turnoController = require('../controllers/turnoController');
const auth = require("../middlewares/auth");

const router = express.Router();
router.patch('/requisitar', turnoController.requisitarTaxiTurno);
router.get('/atual', auth, turnoController.turnoAtual);
router.post("/", auth, turnoController.novoTurno);
router.patch('/devolver', turnoController.devolverTaxiTurno);
router.patch("/finalizar", turnoController.terminarTurno);
router.post("/posicao", auth, turnoController.atualizarPosicao);

module.exports = router;