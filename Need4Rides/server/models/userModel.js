const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

  tipo: {
    type: String,
    required: true,
    enum: ["Cliente", "Motorista", "Gestor"]
  },

  email: {
    type: String,
    required: true,
    lowercase: true
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
    n_carta_conducao: {
      type: String
    },

    morada: {
      type: { type: String, enum: ['Point'] },
      coordenadas: { type: [Number] } 
    }
  }

});

const bcrypt = require('bcrypt');

userSchema.pre('save', async function() {
  if (!this.isModified('senha_acesso_web')) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.senha_acesso_web = await bcrypt.hash(this.senha_acesso_web, salt);
  } catch (error){
    throw error;
  }
});

// Garante que não existam dois "Motoristas" com o mesmo NIF ou dois "Clientes" com o mesmo NIF
userSchema.index({ tipo: 1, nif: 1 }, { unique: true });

// Garante que não existam dois "Motoristas" com o mesmo email ou dois "Clientes" com o mesmo email
userSchema.index({ email: 1, tipo: 1 }, { unique: true });

userSchema.index({ "motorista.morada.coordenadas": "2dsphere" }, { sparse: true });
module.exports = mongoose.model("User", userSchema, "Pessoas");