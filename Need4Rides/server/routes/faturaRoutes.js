const express = require('express');
const faturaController = require('../controllers/faturaController');
const auth = require("../middlewares/auth");

const router = express.Router();
router.post('/emitir', faturaController.emitirFatura);
router.get("/:viagemId", auth, faturaController.getFatura);

module.exports = router;