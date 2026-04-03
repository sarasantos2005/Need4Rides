const mongoose = require('mongoose');

const viagemSchema = new mongoose.Schema({
    morada_inicial_viagem: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] },
        required: true
    },

    morada_final_viagem: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
    },

    hora_inicial_viagem: { 
        type: Date
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
        ref: 'Turno'
    }
});

viagemSchema.index({ morada_inicial_viagem: "2dsphere" });
viagemSchema.index({ morada_final_viagem: "2dsphere" });
module.exports = mongoose.model("Viagem", viagemSchema, "Viagens");