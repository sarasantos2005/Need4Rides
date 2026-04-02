const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

  tipo: {
    type: String,
    required: true,
    enum: ["cliente", "motorista"]
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
    latitude_motorista: String,
    longitude_motorista: String
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema, "Pessoas");