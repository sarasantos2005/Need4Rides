const mongoose = require('mongoose');

const viagemSchema = new mongoose.Schema({
    morada_inicial_viagem: {
        morada: { 
            type: String, 
            required: true 
        },

        localizacao: {
            type: { type: String, default: 'Point' },
            coordinates: { type: [Number], required: true }
        }
    },

    morada_final_viagem: {
        morada: { 
            type: String, 
            required: true 
        },

        localizacao: {
            type: { type: String, default: 'Point' },
            coordinates: { type: [Number], required: true }
        }
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
        ref: 'User',
        required: true 
    },

    turno: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Turno'
    },

    motoristas_rejeitados: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User",
        select: false,
        default: []
    },

    motorista_proposto: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Turno' 
    }
});

viagemSchema.index({ "morada_inicial_viagem.localizacao": "2dsphere" });
viagemSchema.index({ "morada_final_viagem.localizacao": "2dsphere" });
module.exports = mongoose.model("Viagem", viagemSchema, "Viagens");