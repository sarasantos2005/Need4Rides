const mongoose = require('mongoose');

const faturaSchema = new mongoose.Schema({
    n_sequencial: { 
        type: Number, 
        required: true 
    }, 

    ano: { 
        type: Number, 
        required: true 
    },

    data_emissao: { 
        type: Date, 
        default: Date.now 
    },
    
    // Chave Estrangeira
    viagem: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Viagem', 
        required: true, 
        unique: true 
    }
});

faturaSchema.index({ n_sequencial: 1, ano: 1 }, { unique: true });

module.exports = mongoose.model("Fatura", faturaSchema, "Faturas");