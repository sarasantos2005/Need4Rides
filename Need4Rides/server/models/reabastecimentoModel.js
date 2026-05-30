const mongoose = require('mongoose');

const reabastecimentoSchema = new mongoose.Schema({

    inicio_abastecimento: { 
        type: Date, 
        required: true 
    },

    fim_abastecimento: { 
        type: Date, 
        required: false 
    },

    quilometragem: { 
        type: Number, 
        required: true, 
        min: 1
    },

    posto: {
        morada: { 
            type: String, 
            required: true 
        },

        localizacao: {
            type: { type: String, default: 'Point' },
            coordinates: { type: [Number], required: true }
        }
    },

    valor_pago: { 
        type: Number, 
        required: false, 
        min: 0 
    },    
    
    litros: { 
        type: Number, 
        min: 0 
    },

    kWh: { 
        type: Number, 
        min: 0 
    },

    taxi: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Taxi', 
        required: true 
    },

    turno: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Turno', 
        required: true 
    },

    estado: {
        type: String, 
        enum: ['Em curso', 'Concluído'], 
        required: true
    },

    obs: {
        type: String,
        required: false
    }
});

module.exports = mongoose.model("Reabastecimento", reabastecimentoSchema, "Reabastecimentos");