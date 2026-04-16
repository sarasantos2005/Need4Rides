const express = require('express');
const reportsController = require('../controllers/reportsController');
const auth = require("../middlewares/auth");

const router = express.Router();

// US14 - Relatórios táxis e motoristas
router.get('/taxis-motoristas', auth, reportsController.getRelatorios);
router.get('/exportar-pdf', auth, reportsController.exportarPDF);

module.exports = router;