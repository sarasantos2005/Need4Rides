const mongoose = require('mongoose');

const viagemSchema = new mongoose.Schema({
    morada_inicial_viagem: {
        type: String,
        required: true
    },

    morada_final_viagem: {
        type: String,
    },

    hora_inicial_viagem: { 
        type: Date, 
        required: true 
    },

    hora_final_viagem: { 
        type: Date 
    },

    n_passageiros: { 
        type: Number, 
        min: 1, 
        max: 4, 
        required: true 
    },

    km_percorridos: { 
        type: Number, 
        min: 0 
    }, 

    preco_viagem: { 
        type: Number, 
        min: 0 
    }, 

    nivel_conforto: {
        type: String,
        required: true,
        enum: ["Básico", "Luxuoso"]
    },

    cliente: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Pessoa', 
        required: true 
    },

    turno: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Turno', 
        required: true 
    }
});

module.exports = mongoose.model("Viagem", viagemSchema, "Viagens");