const Reabastecimento = require('../models/reabastecimentoModel');
const Turno = require('../models/turnoModel');

//US11
exports.registarReabastecimento = async (req, res) => {
  try {
    const { turnoId, quilometragem, posto, valor_pago, litros, kWh, inicio, fim, obs } = req.body;

    // Buscar Turno para saber o tipo de motor (US11)
    const turnoAtivo = await Turno.findById(turnoId).populate('taxi');
    if (!turnoAtivo) return res.status(404).json({ message: "Turno não encontrado." });

    const taxi = turnoAtivo.taxi;
    const tInicio = new Date(turnoAtivo.hora_inicio);
    const tFim = new Date(turnoAtivo.hora_fim);
    const rInicio = new Date(inicio);
   
    //RIA 1: inicio antes do fim
    const estaAberto = !fim; 
    const rFim = estaAberto ? null : new Date(fim);

    if (!estaAberto && rInicio >= rFim) {
      return res.status(400).json({
        success: false,
        message: "O início do reabastecimento deve ser anterior ao seu fim."
      });
    }

    // RIA 9 e 10: Validar se o tempo coincide com o turno 
    // Combustão: Todo o período dentro do turno (RIA 9)
    if(taxi.tipo_motor === "Combustão"){
        if(rInicio < tInicio || (!estaAberto && rFim > tFim)){
            return res.status(400).json({ 
                success: false, 
                message: "Reabastecimento a combustão deve estar totalmente contido no período do turno. " 
            });
        }
    // Elétrico: Apenas o início dentro do turno  (RIA 10)
    } else if(taxi.tipo_motor === "Elétrico"){
        if(rInicio < tInicio || rInicio > tFim){
            return res.status(400).json({ 
                success: false, 
                message: "O início do carregamento elétrico deve estar contido no período do turno. " 
            });
        }
    }
    
    
    // RIA 25: Quilómetros positivos 
    if(Number(quilometragem <= 0)){
        return res.status(400).json({ 
            message: "A quilometragem deve ser positiva." 
        });
    }

    // RIA 26: Quilómetros crescentes 
    const ultimoRegisto = await Reabastecimento.findOne({ taxi: taxi._id }).sort({ inicio_abastecimento: -1 });
    if(ultimoRegisto && Number(quilometragem) <= ultimoRegisto.quilometragem){
        return res.status(400).json({ 
            message: "A quilometragem deve ser superior ao último reabastecimento." 
        });
    }

    //RIA 24: Valor pago deve ser positivo
    if(!estaAberto && Number(valor_pago) <= 0){
        return res.status(400).json({ 
            message: "O valor pago deve ser positivo." 
        });
    }

     // RIA 22: Litros positivos (combustão, quando concluído)
    if (!estaAberto && taxi.tipo_motor === "Combustão" && Number(litros) <= 0) {
      return res.status(400).json({
        message: "Os litros de combustível devem ser positivos. (RIA 22)"
      });
    }
 
    // RIA 23: kWh positivos (elétrico, quando concluído)
    if (!estaAberto && taxi.tipo_motor === "Elétrico" && Number(kWh) <= 0) {
      return res.status(400).json({
        message: "Os valores de kWh devem ser positivos. (RIA 23)"
      });
    }

    const novoRegisto = new Reabastecimento({
        taxi: taxi._id,
        turno: turnoId,
        quilometragem,
        valor_pago: estaAberto ? 0 : Number(valor_pago), 
        inicio_abastecimento: rInicio,
        fim_abastecimento: rFim,
        estado: estaAberto ? "Em curso" : "Concluído",
        posto: posto,
        obs: obs ? obs : ""
    });

    // US11: Atribuir litros ou kWh conforme o motor    
    if (!estaAberto) {
        if (taxi.tipo_motor === 'Combustão') novoRegisto.litros = Number(litros);
        else novoRegisto.kWh = Number(kWh);
    }

    await novoRegisto.save();
    res.status(201).json({ success: true, registo: novoRegisto });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.finalizarReabastecimento = async(req, res) => {
    try {
        const { reabastecimentoId, fim, valor_pago, litros, kWh, obs} = req.body;

        const reab = await Reabastecimento.findById(reabastecimentoId).populate('taxi');
        if (!reab) return res.status(404).json({ message: "Reabastecimento não encontrado." });

        if(reab.estado !== "Em curso") return res.status(400).json({ message: "Reabastecimento já concluído." });

        if(Number(valor_pago <= 0)) return res.status(400).json({ message: "O valor pago deve ser positivo." });

        const rFim = new Date(fim);
        if (rFim <= reab.inicio_abastecimento) {
            return res.status(400).json({ message: "O fim deve ser posterior ao início do reabastecimento." });
        }

        // RIA 22/23: litros ou kWh positivos
        if(reab.taxi.tipo_motor === "Combustão" && Number(litros) <= 0){
            return res.status(400).json({ message: "Os litros de combustível devem ser positivos." });
        } 
        
        if(reab.taxi.tipo_motor === "Elétrico" && Number(kWh) <= 0) {
            return res.status(400).json({ message: "Os valores de kWh devem ser positivos." });
        }

        reab.fim_abastecimento = rFim;
        reab.valor_pago = Number(valor_pago);
        reab.estado = "Concluído";

        if (reab.taxi.tipo_motor === "Combustão") {
            reab.litros = Number(litros);
        } else {
            reab.kWh = Number(kWh);
        }

        if(obs) {
            reab.obs = obs;
        }

        await reab.save();
        res.status(200).json({ success: true, reabastecimento: reab });
    } catch (err) {
        res.status(500).json({ err: "Erro ao finalizar reabastecimento." });
    }
}

exports.listarReabastecimentos = async (req, res) => {
  try { 
    const taxi = req.params.id;

    if (!taxi) {
      return res.status(400).json({ message: "O ID do táxi é obrigatório" });
    }

    const reabastecimentos = await Reabastecimento.find({ taxi: taxi }).sort({ inicio_abastecimento: -1 });
    if (reabastecimentos.length === 0) return res.status(404).json({ message: "Reabastecimentos não encontrados" });

    return(res.status(200).json(reabastecimentos));
  } catch (err) {
    console.log(err);
    res.status(500).json({ err: "Erro ao listar reabastecimentos." });
  }
}