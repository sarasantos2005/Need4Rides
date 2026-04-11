const express = require('express');
const turnoController = require('../controllers/turnoController');
const auth = require("../middlewares/auth");

const router = express.Router();
router.patch('/requisitar', turnoController.requisitarTaxiTurno);
router.get('/atual', auth, turnoController.turnoAtual);
router.post("/", turnoController.novoTurno);
router.patch('/devolver', turnoController.devolverTaxiTurno);

module.exports = router;