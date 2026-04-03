const Fatura = require('../models/faturaModel');

//US10
exports.emitirFatura = async (req, res) => {
  try {
    const { viagemId } = req.body;

    // US10: Uma fatura por viagem 
    const existe = await Fatura.findOne({ viagem: viagemId });
    if (existe) return res.status(400).json({ message: "Fatura já emitida para esta viagem." });

    const novaFatura = new Fatura({
      viagem: viagemId,
      n_sequencial: await gerarProximoNumeroSequencial(), // RIA21 
      ano: new Date().getFullYear(),
      data_emissao: new Date() // RIA8: Data posterior à viagem 
    });

    await novaFatura.save();
    res.status(201).json(novaFatura);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};