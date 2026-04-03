const mongoose = require('mongoose');

const precoSchema = new mongoose.Schema({
    nivel_conforto: { 
        type: String, 
        enum: ["Básico", "Luxuoso"], 
        required: true 
    },
    valor_minuto: { 
        type: Number, 
        required: true 
    }, // RIA 20: deve ser positivo
    acrescimo_noturno: { 
        type: Number
    }, 
    data_definicao: { 
        type: Date, 
        default: Date.now 
    },
    gestor: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }
});

module.exports = mongoose.model('Preco', precoSchema, "Precos");