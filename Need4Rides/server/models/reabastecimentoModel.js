const mongoose = require('mongoose');

const reabastecimentoSchema = new mongoose.Schema({

    inicio_abastecimento: { 
        type: Date, 
        required: true 
    },

    fim_abastecimento: { 
        type: Date, 
        required: true 
    },

    quilometragem: { 
        type: Number, 
        required: true, 
        min: 0 
    },

    valor_pago: { 
        type: Number, 
        required: true, 
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
    }
});

module.exports = mongoose.model("Reabastecimento", reabastecimentoSchema, "Reabastecimentos");