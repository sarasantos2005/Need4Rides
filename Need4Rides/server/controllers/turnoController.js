const Turno = require('../models/Turno');

//US5
exports.requisitarTurno = async (req, res) => {
  try {
    const { motoristaId, taxiId, hora_inicio, hora_fim } = req.body;

    const inicio = new Date(hora_inicio);
    const fim = new Date(hora_fim);

    // RIA1: Início antes do fim 
    if (inicio >= fim) {
      return res.status(400).json({ message: "A hora de início deve ser anterior ao fim." });
    }

    // RIA2: Turno máx. 8 horas 
    const duracaoHoras = (fim - inicio) / (1000 * 60 * 60);
    if (duracaoHoras > 8) {
      return res.status(400).json({ message: "O turno não pode exceder 8 horas." });
    }

    // RIA6: Sem sobreposição de turnos (Lógica simplificada) 
    const sobreposicao = await Turno.findOne({
      motorista: motoristaId,
      $or: [
        { hora_inicio: { $lt: fim, $gt: inicio } },
        { hora_fim: { $gt: inicio, $lt: fim } }
      ]
    });

    if (sobreposicao) {
      return res.status(400).json({ message: "Já existe um turno agendado para este período." });
    }

    const novoTurno = new Turno({ motorista: motoristaId, taxi: taxiId, hora_inicio: hora_inicio, hora_fim: hora_fim });
    await novoTurno.save();
    res.status(201).json(novoTurno);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};