const express = require('express');
const userController = require('../controllers/userController');
const auth = require("../middlewares/auth");

const router = express.Router();
router.get('/', userController.list); 
router.post('/', userController.create);
router.post('/login', userController.login);
router.post('/preco', userController.definirPreco);
router.delete('/:id', userController.delete);
//router.put('/:id', userController.update);
router.get('/:id', auth, userController.get);
router.patch('/', auth, userController.editarPerfil);

module.exports = router;
