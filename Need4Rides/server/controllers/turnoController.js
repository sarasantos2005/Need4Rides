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

    const turno = await Turno.findOne({ 
      motorista: id, 
      estado: 'Ativo' 
    }).populate('taxi');

    if (!turno) {
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

    const turnoExistente = await Turno.findOne({ motorista: motoristaId, estado: 'Ativo' });
    if (turnoExistente) {
      return res.status(400).json({ message: "Já tens um turno ativo." });
    }

    const agora = new Date();
    const horaFim = new Date(agora.getTime() + 8 * 60 * 60 * 1000);

    const turno = await Turno.create({
      motorista: motoristaId,
      hora_inicio: agora,
      hora_fim: horaFim,
      estado: 'Ativo',
    });

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

    if(agora <= turnoOriginal.hora_inicio){
      return res.status(400).json({ message: "Não pode terminar antes de começar." });
    }
    
    await Turno.findByIdAndUpdate(
      turnoId,
      {
        hora_fim: agora,
        estado: "Terminado"
      }
    )

    res.status(200).json({ message: "Turno terminado com sucesso", turno: turnoAtualizado });
  } catch (error) {
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