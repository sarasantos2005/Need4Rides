const Taxi = require('../models/taxiModel');
const Turno = require("../models/turnoModel");
const Viagem = require("../models/viagemModel");


//US1
exports.create = async (req, res) => {
  try {
    const { matricula, marca, modelo, ano_compra, nivel_conforto, tipo_motor, cor, nivel_combustivel_carga, autonomia_maxima } = req.body;

    // RIA 5: Ano de compra <= ano atual 
    const anoAtual = new Date().getFullYear();
    if (ano_compra > anoAtual) {
      return res.status(400).json({ message: "Ano de compra não posterior ao atual." });
    }

    //validar formato da matricula
    const regexMatricula = /^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{2}-[A-Z0-9]{2}-[A-Z0-9]{2}$/;

    if (!regexMatricula.test(matricula.toUpperCase())) {
        return res.status(400).json({ 
            success: false,
            message: "Formato de matrícula inválida (XX-XX-XX)." 
        });
    }

    // RIA 16 e 17: Enums de conforto e motor 
    const novoTaxi = new Taxi({
      matricula, 
      marca,
      modelo,
      tipo_motor,
      ano_compra,
      nivel_conforto,
      cor,
      nivel_combustivel_carga,
      autonomia_maxima
    });

    await novoTaxi.save();
    res.status(201).json({ success: true, taxi: novoTaxi });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// US12: Remoção apenas se nunca foi requisitado 
exports.delete = async (req, res) => {
  try {
    const taxiId = req.params.id;

    const taxi = await Taxi.findById(taxiId);
    if(!taxi){
        return res.status(404).json({ message: "Táxi não encontrado." });
    }

    const jaUsado = await Turno.findOne({taxi: taxiId});

    if(jaUsado){
        return res.status(403).json({ 
        success: false, 
        message: "Não é possível remover: este táxi já foi requisitado para um turno." 
      });
    }

    await Taxi.findByIdAndDelete(taxiId);

    res.status(200).json({ message: "Táxi removido com sucesso." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.listarTodos = async (req, res) => {
  try {
    const taxis = await Taxi.find().sort({ updatedAt: -1 });
    res.json({ success: true, taxis });
  } catch (error) {
    res.status(500).json({ message: "Erro ao procurar táxis." });
  }
};

// US12: Obter um táxi pelo id (inclui flag se já fez viagens)
exports.getOne = async (req, res) => {
  try {
    const taxi = await Taxi.findById(req.params.id);
    if (!taxi) return res.status(404).json({ message: "Táxi não encontrado." });

    const turnosDoTaxi = await Turno.find({ taxi: req.params.id }).select('_id');
    const turnoIds = turnosDoTaxi.map(t => t._id);
    const temViagens = !!(await Viagem.exists({ turno: { $in: turnoIds } }));

    res.json({ success: true, taxi, temViagens });
  } catch (error) {
    res.status(500).json({ message: "Erro ao procurar táxi." });
  }
};

// US12: Editar um táxi
exports.update = async (req, res) => {
  try {
    const taxiId = req.params.id;
    const taxi = await Taxi.findById(taxiId);
    if (!taxi) return res.status(404).json({ message: "Táxi não encontrado." });

    const { matricula, marca, modelo, ano_compra, nivel_conforto, tipo_motor, cor, nivel_combustivel_carga, autonomia_maxima } = req.body;

    // Verificar se o táxi já fez viagens (restrição ao nível de conforto)
    const turnosDoTaxi = await Turno.find({ taxi: taxiId }).select('_id');
    const turnoIds = turnosDoTaxi.map(t => t._id);
    const temViagens = await Viagem.exists({ turno: { $in: turnoIds } });

    if (temViagens && nivel_conforto !== taxi.nivel_conforto) {
      return res.status(403).json({
        success: false,
        message: "Não é possível alterar o nível de conforto: este táxi já realizou viagens com clientes."
      });
    }

    const anoAtual = new Date().getFullYear();
    if (ano_compra > anoAtual) {
      return res.status(400).json({ message: "Ano de compra não pode ser posterior ao atual." });
    }

    const regexMatricula = /^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{2}-[A-Z0-9]{2}-[A-Z0-9]{2}$/;
    if (!regexMatricula.test(matricula.toUpperCase())) {
      return res.status(400).json({ success: false, message: "Formato de matrícula inválida (XX-XX-XX)." });
    }

    const updated = await Taxi.findByIdAndUpdate(
      taxiId,
      { matricula, marca, modelo, tipo_motor, ano_compra, nivel_conforto, cor, nivel_combustivel_carga, autonomia_maxima },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, taxi: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.listarDisponiveis = async (req, res) => {
  try {
    const turnosOcupados = await Turno.find({
      estado: {$in: ["Ativo", "Agendado"]}
    }).distinct("taxi");

    const taxis = await Taxi.find({_id: {$nin: turnosOcupados}});
    res.json(taxis);
  } catch (error) {
    res.status(500).json({ message: "Erro ao procurar táxis." });
  }
}