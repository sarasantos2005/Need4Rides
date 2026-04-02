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
        ref: 'Taxi',
        required: true
    },
    

}, { timestamps: true });

module.exports = mongoose.model("Turno", turnoSchema, "Turnos");