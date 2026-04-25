const express = require('express');
const viagemController = require('../controllers/viagemController');
const auth = require('../middlewares/auth');

const router = express.Router();
router.post('/pedir', auth, viagemController.pedirTaxi); // US6 - Cliente pede táxi
router.post('/iniciar', viagemController.iniciarViagem); // US8 - Motorista inicia a viagem
router.post('/finalizar', viagemController.finalizarViagem); // US8 - Motorista finaliza a viagem
router.post('/confirmar', viagemController.confirmacaoCliente); // US6 - Cliente confirma ou rejeita motorista proposto
router.post('/cancelar-aceitacao', viagemController.cancelarAceitacaoMotorista); // US7 - Motorista cancela a sua própria aceitação
router.get('/disponiveis', auth, viagemController.listarPedidosParaMotorista); // US7 - Motorista lista pedidos disponíveis perto de si
router.patch('/aceitar', auth, viagemController.aceitarPedido); // US7 - Motorista aceita um pedido de viagem
router.get("/motorista/ativa", auth, viagemController.statusMotorista);
router.get('/motorista', auth, viagemController.historicoDeViagens); 
router.patch('/recusar', auth, viagemController.recusarCliente); // Motorista rejeita um pedido de viagem
router.get("/historico/cliente", auth, viagemController.historicoDeViagens_Cliente);
router.get("/status/:viagemId", auth, viagemController.fetchViagemStatus);
router.get("/espera", auth, viagemController.estimarTempoEspera);
router.post("/cancelar", auth, viagemController.cancelarViagem);

module.exports = router;
