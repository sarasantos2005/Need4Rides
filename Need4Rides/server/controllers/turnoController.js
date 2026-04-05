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
    const { id } = req.query;

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

//AINDA TEM DE SER ALTERADO NA TOTALIDADE
exports.novoTurno = async (req, res) => {
  
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