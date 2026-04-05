const express = require('express');
const turnoController = require('../controllers/turnoController');

const router = express.Router();
router.patch('/requisitar', turnoController.requisitarTaxiTurno);
router.get('/atual', turnoController.turnoAtual);
router.post("/", turnoController.novoTurno);
router.patch('/devolver', turnoController.devolverTaxiTurno);

module.exports = router;