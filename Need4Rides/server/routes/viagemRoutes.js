const express = require('express');
const viagemController = require('../controllers/viagemController');

const router = express.Router();
router.post('/pedir', viagemController.pedirTaxi); // US6 - Cliente pede táxi
router.post('/iniciar', viagemController.iniciarViagem); // US8 - Motorista inicia a viagem
router.post('/finalizar', viagemController.finalizarViagem); // US8 - Motorista finaliza a viagem
router.post('/confirmar', viagemController.confirmacaoCliente); // US6 - Cliente confirma ou rejeita motorista proposto
router.post('/rejeitar', viagemController.rejeitarMotorista); // US6/US7 - Cliente rejeita motorista proposto
router.post('/cancelar-aceitacao', viagemController.cancelarAceitacaoMotorista); // US7 - Motorista cancela a sua própria aceitação
router.get('/disponiveis', viagemController.listarPedidosParaMotorista); // US7 - Motorista lista pedidos disponíveis perto de si
router.post('/aceitar', viagemController.aceitarPedido); // US7 - Motorista aceita um pedido de viagem


module.exports = router;
