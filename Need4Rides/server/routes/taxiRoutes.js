const express = require('express');
const taxiController = require('../controllers/taxiController');

const router = express.Router();
router.post('/', taxiController.create);
router.delete('/:id', taxiController.delete);
router.get('/all', taxiController.listarTodos);
router.get('/', taxiController.listarDisponiveis);

module.exports = router;