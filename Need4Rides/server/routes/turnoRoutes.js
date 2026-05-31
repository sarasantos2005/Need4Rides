const express = require('express');
const turnoController = require('../controllers/turnoController');
const auth = require("../middlewares/auth");

const router = express.Router();
router.patch('/requisitar', auth, turnoController.requisitarTaxiTurno);
router.get('/atual', auth, turnoController.turnoAtual);
router.post("/", auth, turnoController.novoTurno);
router.patch('/devolver', auth, turnoController.devolverTaxiTurno);
router.patch("/finalizar", auth, turnoController.terminarTurno);
router.post("/posicao", auth, turnoController.atualizarPosicao);
router.get("/futuros", auth, turnoController.turnosFuturos);

module.exports = router;