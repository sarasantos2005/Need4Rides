const express = require('express');
const turnoController = require('../controllers/turnoController');

const router = express.Router();
router.post('/requisitar', turnoController.requisitarTurno);
router.get('/atual', turnoController.turnoAtual);

module.exports = router;