const Turno = require('../models/turnoModel');
const Taxi = require("../models/taxiModel");

//US5
exports.requisitarTaxiTurno = async (req, res) => {
  try {
    const { turnoId, taxiId} = req.body;
    
    const veiculo = await Taxi.findById(taxiId);

    if (!turnoId) {
      return res.status(404).json({ message: "Turno não encontrado." });
    }

    if (!veiculo) {
      return res.status(404).json({ message: "O veículo selecionado não existe na base de dados." });
    }

    const turnoAtualizado = await Turno.findByIdAndUpdate(
      turnoId,
      { taxi: taxiId }, 
      { new: true }  
    );

    if (!turnoAtualizado) {
      return res.status(404).json({ message: "Turno não encontrado." });
    }

    res.status(200).json(turnoAtualizado);
  } catch (error) {
    console.error("ERRO REAL:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.turnoAtual = async (req, res) => {
  try{
    const id = req.userId;
    const agora = new Date();

    let turno = await Turno.findOne({ 
      motorista: id, 
      estado: 'Ativo' 
    }).populate('taxi');

    if (!turno) {
      const turnoAgendadoJaIniciou = await Turno.findOne({
        motorista: id,
        estado: 'Agendado',
        hora_inicio: { $lte: agora } 
      });

      if (turnoAgendadoJaIniciou) {
        turnoAgendadoJaIniciou.estado = 'Ativo';
        await turnoAgendadoJaIniciou.save();
        
        turno = await Turno.findById(turnoAgendadoJaIniciou._id).populate('taxi');
      }
    }

    if(!turno) {
      return res.status(200).json(null);
    }

    res.status(200).json(turno);
  } catch (error){
    res.status(500).json({ error: error.message });
  }
};

exports.novoTurno = async (req, res) => {
  try {
    const motoristaId = req.userId;
    const { hora_inicio, hora_fim, taxiId } = req.body;

    if (!hora_inicio || !hora_fim || !taxiId) {
      return res.status(400).json({ message: "Faltam dados obrigatórios: início, fim ou veículo." });
    }

    const dataInicio = new Date(hora_inicio);
    const dataFim = new Date(hora_fim);
    const agora = new Date();

    if (dataInicio >= dataFim) {
      return res.status(400).json({ message: "A hora de início deve ser anterior à hora de fim." });
    }
    const diffHoras = (dataFim - dataInicio) / (1000 * 60 * 60);
    if (diffHoras > 8) {
      return res.status(400).json({ message: "O turno não pode ter uma duração superior a 8 horas." });
    }

    const motoristaOcupado = await Turno.findOne({
      motorista: motoristaId,
      estado: { $in: ["Ativo", "Agendado"] },
      $or: [
        { hora_inicio: { $lt: dataFim }, hora_fim: { $gt: dataInicio } }
      ]
    });

    if (motoristaOcupado) {
      return res.status(400).json({ message: "Já tens um turno agendado/ativo que se sobrepõe a este período." });
    }
    const taxiOcupado = await Turno.findOne({
      taxi: taxiId,
      estado: { $in: ["Ativo", "Agendado"] },
      $or: [
        { hora_inicio: { $lt: dataFim }, hora_fim: { $gt: dataInicio } }
      ]
    });

    if (taxiOcupado) {
      return res.status(400).json({ message: "Este veículo já foi requisitado por outro motorista para este período." });
    }

    const estadoTurno = agora >= dataInicio ? "Ativo" : "Agendado";

    const turno = await Turno.create({
      motorista: motoristaId,
      taxi: taxiId,
      hora_inicio: dataInicio,
      hora_fim: dataFim,
      estado: estadoTurno,
    });

    if (estadoTurno === "Agendado") {
      const msParaComecar = dataInicio.getTime() - agora.getTime();

      setTimeout(async () => {
        try {
          const turnoAtivado = await Turno.findByIdAndUpdate(
            turno._id,
            { estado: "Ativo" },
            { new: true }
          ).populate('taxi');

          const io = req.app.get('io'); 
          if (io) {
            io.to(`user_motorista_${motoristaId}`).emit('turno_iniciado_automatico', turnoAtivado);
          }
        } catch (err) {
          console.error("Erro ao ativar turno agendado via socket:", err);
        }
      }, msParaComecar);
    }

    res.status(201).json(turno);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};  

exports.devolverTaxiTurno = async (req, res) => {
  try {
    const { turnoId } = req.body;

    if (!turnoId) {
      return res.status(404).json({ message: "Turno não encontrado." });
    }
    
    const turnoAtualizado = await Turno.findByIdAndUpdate(
      turnoId,
      { taxi: null },
      { new: true }
    );

    if (!turnoAtualizado) {
      return res.status(404).json({ message: "Turno não encontrado." });
    }

    res.status(200).json({ message: "Táxi devolvido com sucesso", turno: turnoAtualizado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.terminarTurno = async (req, res) => {
  try {
    const { turnoId } = req.body;
    const agora = new Date();

    if (!turnoId) {
      return res.status(404).json({ message: "Turno não encontrado." });
    }

    const turnoOriginal = await Turno.findById(turnoId);
    
    if (!turnoOriginal) {
      return res.status(404).json({ message: "Turno não encontrado na base de dados." });
    }

    if(agora <= turnoOriginal.hora_inicio){
      return res.status(400).json({ message: "Não pode terminar antes de começar." });
    }
    
    const turnoAtualizado = await Turno.findByIdAndUpdate(
      turnoId,
      {
        hora_fim: agora,
        estado: "Terminado"
      },
      { new: true }
    )

    res.status(200).json({ message: "Turno terminado com sucesso", turno: turnoAtualizado });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

//Posição do motorista
exports.atualizarPosicao = async(req, res) => {
  try {
    const motoristaId = req.userId;
    const {lat, lng} = req.body;

    const nLat = parseFloat(lat);
    const nLng = parseFloat(lng);

    if (isNaN(nLat) || isNaN(nLng)) {
        return res.status(400).json({ message: "Coordenadas inválidas recebidas." });
    }

    const turno = await Turno.findOneAndUpdate(
      { motorista: motoristaId, estado: 'Ativo' },
      { 
          $set: { 
              localizacao_atual: { 
                  type: "Point", 
                  coordinates: [nLng, nLat] 
              },
              last_updated: new Date()
          }
      },
      { returnDocument: 'after' }
    );

    if (!turno) {
      return res.status(404).json({ message: "Nenhum turno ativo encontrado para este motorista." });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("ERRO NO POST POSIÇÃO:", err);
    res.status(500).json({ err: "Erro ao atualizar posição." });
  }
};

exports.turnosFuturos = async(req, res) => {
  try {
    const motoristaId = req.userId;

    const turnosAgendados = await Turno.find({
      motorista: motoristaId,
      estado: "Agendado"
    })
    .populate('taxi')
    .sort({hora_inicio: 1});

    res.status(200).json(turnosAgendados);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
}