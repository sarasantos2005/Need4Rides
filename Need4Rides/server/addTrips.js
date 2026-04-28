require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/userModel');
const Taxi = require('./models/taxiModel');
const Turno = require('./models/turnoModel');

async function run() {
  try {
    const uri = process.env.DB_URI;
    if (!uri) {
      throw new Error('DB_URI não definido em .env');
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    console.log('✅ Ligado ao MongoDB');

    let cliente = await User.findOne({ tipo: 'Cliente' });
    let motorista = await User.findOne({ tipo: 'Motorista' });
    let taxi = await Taxi.findOne();
    let turno = await Turno.findOne();

    if (!cliente) {
      console.log('📍 Criando cliente de teste...');
      cliente = await User.create({
        tipo: 'Cliente',
        email: 'cliente-teste@need4rides.com',
        nome: 'Cliente Teste',
        genero: 'M',
        nif: '123456780',
        senha_acesso_web: await bcrypt.hash('123456', 10),
        ano_nascimento: 1990
      });
    }

    if (!motorista) {
      console.log('📍 Criando motorista de teste...');
      motorista = await User.create({
        tipo: 'Motorista',
        email: 'motorista-teste@need4rides.com',
        nome: 'Motorista Teste',
        genero: 'M',
        nif: '123456781',
        senha_acesso_web: await bcrypt.hash('123456', 10),
        ano_nascimento: 1985,
        motorista: {
          n_carta_conducao: 'TEST-123',
          rating: 5,
          morada: {
            texto: 'Av. Teste, Lisboa',
            localizacao: { type: 'Point', coordinates: [-9.1393, 38.7223] }
          }
        }
      });
    }

    if (!taxi) {
      console.log('📍 Criando táxi de teste...');
      taxi = await Taxi.create({
        matricula: 'TT-00-01',
        marca: 'Test',
        modelo: 'Model X',
        tipo_motor: 'Combustão',
        nivel_conforto: 'Luxuoso',
        ano_compra: 2022,
        cor: '#000000',
        nivel_combustivel_carga: 75,
        autonomia_maxima: 400
      });
    }

    if (!turno) {
      console.log('📍 Criando turno de teste...');
      turno = await Turno.create({
        motorista: motorista._id,
        taxi: taxi._id,
        hora_inicio: new Date(Date.now() - 4 * 60 * 60 * 1000),
        hora_fim: new Date(Date.now() + 4 * 60 * 60 * 1000),
        estado: 'Ativo'
      });
    }

    const db = mongoose.connection.db;
    const now = new Date();
    const inserted = await db.collection('Viagens').insertMany([
      {
        cliente: cliente._id,
        turno: turno._id,
        n_passageiros: 2,
        nivel_conforto: 'Luxuoso',
        morada_inicial_viagem: {
          morada: 'Lisboa Centro',
          localizacao: { type: 'Point', coordinates: [-9.1393, 38.7223] }
        },
        morada_final_viagem: {
          morada: 'Cascais',
          localizacao: { type: 'Point', coordinates: [-9.4214, 38.6971] }
        },
        hora_inicial_viagem: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        preco_viagem: 25.50,
        createdAt: now
      },
      ...Array.from({ length: 4 }, (_, i) => {
        const createdAt = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
        return {
          cliente: cliente._id,
          turno: turno._id,
          n_passageiros: Math.floor(Math.random() * 4) + 1,
          nivel_conforto: i % 2 === 0 ? 'Luxuoso' : 'Básico',
          morada_inicial_viagem: {
            morada: 'Lisboa',
            localizacao: { type: 'Point', coordinates: [-9.1393, 38.7223] }
          },
          morada_final_viagem: {
            morada: 'Sintra',
            localizacao: { type: 'Point', coordinates: [-9.3789, 38.8029] }
          },
          hora_inicial_viagem: new Date(createdAt.getTime() - 15 * 60 * 1000),
          hora_final_viagem: new Date(createdAt.getTime() + 15 * 60 * 1000),
          km_percorridos: 12 + i * 3,
          preco_viagem: 15 + i * 5,
          createdAt
        };
      })
    ]);

    console.log('✅ Inserido com sucesso:', inserted.insertedCount, 'documentos.');
    console.log('🔑 Usuário de login gestor disponível em:', motorista.email, 'senha: 123456');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

run();