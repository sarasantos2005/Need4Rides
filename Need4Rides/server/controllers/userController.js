const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS);
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION;

// Criar cliente ou motorista
exports.create = async (req, res) => {
  try {
    const { tipo, nome, genero, nif, senha_acesso_web, ano_nascimento, motorista } = req.body;

    const existing = await User.findOne({ nif });
    if (existing) {
      return res.status(409).json({ success: false, message: "NIF já registado." });
    }

    const anoAtual = new Date().getFullYear();
    if (tipo === 'motorista' && (anoAtual - ano_nascimento < 18)) {
      return res.status(400).json({ success: false, message: "Motorista deve ter 18 anos ou mais." });
    }

    const passwordHash = await bcrypt.hash(senha_acesso_web, SALT_ROUNDS);

    const userData = {
      tipo,
      nome,
      genero,
      nif,
      senha_acesso_web: passwordHash,
      ano_nascimento
    };

    if (tipo === 'motorista') {
      userData.n_carta_conducao = n_carta_conducao;
      userData.morada_motorista = morada_motorista;
    }

    const newUser = new User(userData);
    await newUser.save();

    res.status(201).json({
      success: true,
      message: "Registo criado com sucesso.",
      user: newUser
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao criar registo." });
    console.error(error);
  }
};

// Listar todos os utilizadores
exports.list = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao obter utilizadores." });
  }
};


// Login
exports.login = async (req, res) => {
  try {
    const { nif, senha_acesso_web } = req.body;

    const user = await User.findOne({ nif });
    if (!user) {
      return res.status(401).json({ success: false, message: "Credenciais inválidas." });
    }

    const match = await bcrypt.compare(senha_acesso_web, user.senha_acesso_web);
    if (!match) {
      return res.status(401).json({ success: false, message: "Credenciais inválidas." });
    }

    const payload = { id: user._id, tipo: user.tipo };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });

    res.status(200).json({
      success: true,
      message: "Login bem sucedido.",
      user: { id: user._id, nome: user.nome, tipo: user.tipo },
      token
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro no login." });
    console.error(error);
  }
};

// Remover utilizador
exports.delete = async (req, res) => {
  try {
    const userId = req.params.id;
    const token = req.token;

    if (!token) {
      return res.status(401).json({ success: false, message: "Login necessário." });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: "Token inválido." });
    }

    if (payload.id !== userId) {
      return res.status(403).json({ success: false, message: "Não pode remover outro utilizador." });
    }

    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Utilizador não encontrado." });
    }

    res.status(200).json({ success: true, message: "Removido com sucesso.", deleted });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao remover utilizador." });
    console.error(error);
  }
};
