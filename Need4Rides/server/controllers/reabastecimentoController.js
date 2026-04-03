const Reabastecimento = require('../models/reabastecimentoModel');
const Turno = require('../models/turnoModel');

//US11
exports.registarReabastecimento = async (req, res) => {
  try {
    const { turnoId, quilometragem, valor_pago, litros, kWh, inicio, fim } = req.body;

    // Buscar Turno para saber o tipo de motor (US11)
    const turnoAtivo = await Turno.findById(turnoId).populate('taxi');
    if (!turnoAtivo) return res.status(404).json({ message: "Turno não encontrado." });

    const taxi = turnoAtivo.taxi;
    const tInicio = new Date(turnoAtivo.hora_inicio);
    const tFim = new Date(turnoAtivo.hora_fim);
    const rInicio = new Date(inicio);
    const rFim = new Date(fim);

    // RIA 9 e 10: Validar se o tempo coincide com o turno 
    // Combustão: Todo o período dentro do turno (RIA 9)
    if(taxi.tipo_motor === "Combustão"){
        if(rInicio < tInicio || rFim > tFim){
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
    
    // RIA 26: Quilómetros crescentes 
    const ultimoRegisto = await Reabastecimento.findOne({ taxi: taxi }).sort({ inicio_abastecimento: -1 });
    if(ultimoRegisto && quilometragem <= ultimoRegisto.quilometragem){
        return res.status(400).json({ 
            message: "A quilometragem deve ser superior ao último reabastecimento." 
        });
    }

    // RIA 25: Quilómetros positivos 
    if(quilometragem <= 0){
        return res.status(400).json({ 
            message: "A quilometragem deve ser positiva." 
        });
    }

    //RIA 24: Valor pago deve ser positivo
    if(valor_pago <= 0){
        return res.status(400).json({ 
            message: "O valor pago deve ser positivo." 
        });
    }

    const novoRegisto = new Reabastecimento({
      taxi: taxi._id,
      turno: turnoId,
      quilometragem,
      valor_pago, 
      inicio_abastecimento: inicio,
      fim_abastecimento: fim
    });

    // US11: Atribuir litros ou kWh conforme o motor
    if (taxi.tipo_motor === 'Combustão') {
      novoRegisto.litros = litros; // RIA 22
    } else {
      novoRegisto.kWh = kWh; // RIA 23
    }

    await novoRegisto.save();
    res.status(201).json({ success: true, registo: novoRegisto });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};