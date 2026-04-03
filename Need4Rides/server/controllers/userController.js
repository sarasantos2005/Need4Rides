const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS);
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION;

// Criar cliente ou motorista
//US2 / US17
exports.create = async (req, res) => {
  try {
    const { tipo, nome, genero, nif, senha_acesso_web, ano_nascimento, motorista, localizacao } = req.body;

    //RIA 12: NIF com 9 digitos
    if (!/^\d{9}$/.test(nif)) {
      return res.status(400).json({ success: false, message: "NIF deve ter exatamente 9 dígitos." });
    }

    const existing = await User.findOne({ nif });
    if (existing) {
      return res.status(409).json({ success: false, message: "NIF já registado." });
    }

    //RIA 4: Motorista >= 18 anos
    const anoAtual = new Date().getFullYear();
    if (tipo === 'motorista' && (anoAtual - ano_nascimento < 18)) {
      return res.status(400).json({ success: false, message: "Motorista deve ter 18 anos ou mais." });
    }

    //RIA 15: Senha >= 6 caracteres, letras e digitos
    const regexSenha = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    if (!regexSenha.test(senha_acesso_web)) {
      return res.status(400).json({ 
        success: false, 
        message: "A senha deve ter pelo menos 6 caracteres, incluindo letras e números." 
      });
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
      if (!n_carta_conducao) {
        return res.status(400).json({ success: false, message: "Número da carta de condução é obrigatório para motoristas." });
      }

      userData.n_carta_conducao = n_carta_conducao;

      if (localizacao && localizacao.long && localizacao.lat) {
        userData.morada = {
          type: "Point",
          coordenadas: [localizacao.long, localizacao.lat] 
        };
      }
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
//US ???
exports.list = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao obter utilizadores." });
  }
};


// Login
//US4 - Motorista e Gestor
//US18 
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
//US13 - Parte de remover
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

//US13 - Falta editar
