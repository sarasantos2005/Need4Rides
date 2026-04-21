const mongoose = require('mongoose');

const turnoSchema = new mongoose.Schema({
    hora_inicio: {
        type: Date, 
        required: true
    },
  
    hora_fim: {
        type: Date
    },

    motorista: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },

    taxi: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Taxi'
    },

    estado: { 
        type: String, 
        enum: ['Agendado', 'Ativo', 'Terminado', 'Cancelado'], 
        default: 'Agendado' 
    },
    
    localizacao_atual: {
        type: { type: String, enum: ['Point'] },
        coordinates: { type: [Number], default: undefined }
    },

    last_updated: { 
        type: Date, 
        default: Date.now 
    }
});

turnoSchema.index({ localizacao_atual: "2dsphere" }, { sparse: true });
module.exports = mongoose.model("Turno", turnoSchema, "Turnos");