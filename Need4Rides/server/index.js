const { loadEnvFile } = require('node:process');
loadEnvFile();

const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const bearer = require('express-bearer-token');

const User = require('./models/userModel');
const Fatura = require("./models/faturaModel");
const Reabastecimento = require("./models/reabastecimentoModel");
const Taxi = require("./models/taxiModel");
const Turno = require("./models/turnoModel");
const Viagem = require("./models/viagemModel");
const Preco = require("./models/precoModel");

// Validação básica das variáveis de ambiente
const PORT = Number(process.env.PORT) || 3000;
const DB_URI = process.env.DB_URI;

if (!DB_URI) {
  console.error("ERRO: DB_URI não definida no ficheiro .env");
  process.exit(1);
}

const app = express();

// Middlewares existentes
app.use(morgan('tiny'));
app.use(cors());
app.use(helmet());
app.use(bearer());
app.use(express.json());

// Rota simples
app.get('/', (req, res) => {
  res.send('API do Need4Rides a funcionar!');
});

// Rotas de utilizadores
const userRoutes = require('./routes/userRoutes');
app.use('/api/user', userRoutes);

// Rotas de táxis
const taxiRoutes = require('./routes/taxiRoutes');
app.use('/api/taxi', taxiRoutes);

// --- MELHORIA: Tratamento de Rotas Não Encontradas (404) ---
app.use((req, res) => {
  res.status(404).json({ message: "Rota não encontrada." });
});

// --- MELHORIA: Gestor de Erros Global ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Ocorreu um erro interno no servidor." });
});

// Ligar ao MongoDB e arrancar servidor
(async () => {
  try {
    // Melhoria: Opções de timeout para evitar que o erro ECONNREFUSED demore muito a aparecer
    await mongoose.connect(DB_URI, {
      serverSelectionTimeoutMS: 5000 
    });
    console.log("Ligação bem sucedida ao MongoDB Atlas.");

    /*
    // --- APAGAR ABSOLUTAMENTE TUDO ---
    console.log("A fazer limpeza total da Base de Dados...");
    const collectionsInAtlas = await mongoose.connection.db.listCollections().toArray();
    
    for (const col of collectionsInAtlas) {
      await mongoose.connection.db.dropCollection(col.name);
      console.log(`Coleção antiga [${col.name}] eliminada.`);
    }

    // --- DEFINIR OS MODELS PARA RECONSTRUÇÃO ---
    const modelsToCreate = [
      { name: 'Pessoas', model: User },
      { name: 'Faturas', model: Fatura },
      { name: 'Reabastecimentos', model: Reabastecimento },
      { name: 'Taxis', model: Taxi },
      { name: 'Turnos', model: Turno },
      { name: 'Viagens', model: Viagem },
      { name: 'Precos', model: Preco }
    ];

    console.log("A criar novas coleções...");
    for (const item of modelsToCreate) {
      try {
        await mongoose.connection.db.createCollection(item.name);
        
        await item.model.createIndexes();
        
        console.log(`[${item.name}] criada e pronta.`);
      } catch (err) {
        console.log(`Erro ao criar [${item.name}]:`, err.message);
      }
    }

    console.log("A semear dados de teste...");
    await User.create({ nome: "Cliente", email: "pessoa@need4rides.com", genero: "M", tipo: "Cliente", nif: 999999999, senha_acesso_web: "123ABC", ano_nascimento: 2005 });
    await User.create({ nome: "Admin", email: "pessoa@need4rides.com", genero: "M", tipo: "Gestor", nif: 999999999, senha_acesso_web: "123ABC", ano_nascimento: 2005 });
    await User.create({ nome: "Motorista", email: "pessoa@need4rides.com", genero: "M", tipo: "Motorista", nif: 999999999, senha_acesso_web: "123ABC", ano_nascimento: 2005, motorista: {n_carta_conducao: "ZA-12345 6", morada: {type: "Point", coordenadas: [-9.1393, 38.7223]}}});

    console.log("Dados de teste inseridos.");
    */

    const server = app.listen(PORT, () => {
      console.log("Servidor a correr em http://localhost:" + PORT);
    });

    // --- MELHORIA: Graceful Shutdown (Fechar conexões limpas ao desligar) ---
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      server.close(() => {
        console.log('Servidor e MongoDB desligados.');
        process.exit(0);
      });
    });

  } catch (error) {
    console.log("Erro ao ligar ao MongoDB:", error.message);
    // Explicação para o erro de DNS comum
    if (error.message.includes('ECONNREFUSED')) {
      console.log("Verifique se o seu IP está autorizado no Network Access do MongoDB Atlas.");
    }
  }
})();