const Taxi = require('../models/taxiModel');
const Turno = require("../models/turnoModel");


//US1
exports.create = async (req, res) => {
  try {
    const { matricula, marca, modelo, ano_compra, nivel_conforto, tipo_motor } = req.body;

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
      nivel_conforto
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