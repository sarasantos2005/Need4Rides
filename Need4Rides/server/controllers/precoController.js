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