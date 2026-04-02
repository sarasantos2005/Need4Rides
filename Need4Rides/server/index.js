const { loadEnvFile } = require('node:process');
loadEnvFile();

const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const bearer = require('express-bearer-token');

// Validação básica das variáveis de ambiente
const PORT = Number(process.env.PORT) || 3000;
const DB_URI = process.env.DB_URI;

if (!DB_URI) {
  console.error("❌ ERRO: DB_URI não definida no ficheiro .env");
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
    console.log("✅ Ligação bem sucedida ao MongoDB Atlas.");

    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor a correr em http://localhost:${PORT}`);
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
    console.log("❌ Erro ao ligar ao MongoDB:", error.message);
    // Explicação para o erro de DNS comum
    if (error.message.includes('ECONNREFUSED')) {
      console.log("DICA: Verifica se o teu IP está autorizado no Network Access do MongoDB Atlas.");
    }
  }
})();