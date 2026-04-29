const Preco = require('../models/precoModel');
const axios = require('axios');

exports.preco = async(req, res) => {
    try {
        const precos = await Preco.aggregate([
            { $sort: { data_definicao: -1 }},
            { $group: { _id: "$nivel_conforto", doc: { $first: "$$ROOT" } } }
        ]);

        const precosMap = precos.reduce((acc, curr) => {
            acc[curr._id] = curr.doc;
            return acc;
        }, {});

        res.status(200).json(precosMap);
    } catch (error) {
        res.status(500).json({ success: false, message: "Erro ao obter preço." });
    }
}

exports.definirPreco = async (req, res) => {
    try {
        const { basico, luxuoso, acrescimo_noturno } = req.body;

        if (!basico || !luxuoso || acrescimo_noturno === undefined) {
            return res.status(400).json({ success: false, message: "Preenche todos os campos." });
        }
        if (basico <= 0 || luxuoso <= 0) {
            return res.status(400).json({ success: false, message: "Os preços por minuto devem ser positivos." });
        }
        if (acrescimo_noturno < 0) {
            return res.status(400).json({ success: false, message: "O acréscimo noturno não pode ser negativo." });
        }

        await Preco.create({ nivel_conforto: "Básico", valor_minuto: basico, acrescimo_noturno });
        await Preco.create({ nivel_conforto: "Luxuoso", valor_minuto: luxuoso, acrescimo_noturno });

        res.status(201).json({ success: true, message: "Preços definidos com sucesso." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}