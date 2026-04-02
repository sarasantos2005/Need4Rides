const mongoose = require('mongoose');

const taxiSchema = new mongoose.Schema({
    matricula: {
        type: String, 
        required: true, 
        unique: true 
    },
  
    marca: {
        type: String,
        required: true
    },

    modelo: {
        type: String,
        required: true
    },

    tipo_motor: {
        type: String, 
        required: true,
        enum: ["Combustão", "Elétrico"] 
    },

    ano_compra: {
        type: Number,
        required: true
    },

    nivel_conforto: {
        type: String,
        required: true,
        enum: ["Básico", "Luxuoso"]
    }

}, { timestamps: true });

module.exports = mongoose.model("Taxi", taxiSchema, "Taxis");