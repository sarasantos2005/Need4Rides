const express = require('express');
const taxiController = require('../controllers/taxiController');

const router = express.Router();
router.post('/', taxiController.create);
router.get('/all', taxiController.listarTodos);
router.get('/', taxiController.listarDisponiveis);
router.get('/:id', taxiController.getOne);
router.put('/:id', taxiController.update);
router.delete('/:id', taxiController.delete);

module.exports = router;