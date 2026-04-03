const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();
router.get('/', userController.list); 
router.post('/', userController.create);
router.post('/login', userController.login);
router.post('/preco', userController.definirPreco);
router.delete('/:id', userController.delete);
router.put('/:id', userController.update);

module.exports = router;
