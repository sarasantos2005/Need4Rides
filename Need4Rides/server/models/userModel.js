const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

  tipo: {
    type: String,
    required: true,
    enum: ["Cliente", "Motorista"]
  },

  nome: {
    type: String,
    required: true,
    trim: true
  },

  genero: {
    type: String,
    enum: ["M", "F"],
    required: true
  },

  nif: {
    type: String,
    required: true,
    unique: true, 
    minlength: 9, 
    maxlength: 9
  },

  senha_acesso_web: {
    type: String,
    required: true,
    minlength: 6
  },

  ano_nascimento: {
    type: Number,
    required: true
  },

  motorista: {
    n_carta_conducao: String,
    morada: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordenadas: { type: [Number], default: [0, 0] } 
    }
  }

}, { timestamps: true });

userSchema.index({ localizacao: "2dsphere" });
module.exports = mongoose.model("User", userSchema, "Pessoas");