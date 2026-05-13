require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const Pessoa  = require('../models/userModel');
const Taxi    = require('../models/taxiModel');
const Turno   = require('../models/turnoModel');
const Viagem  = require('../models/viagemModel');

// ── Endereços de Lisboa para variedade ──────────────────────────────────────
const MORADAS = [
  { morada: 'Marquês de Pombal, Lisboa',           coordinates: [-9.1503, 38.7253] },
  { morada: 'Praça do Comércio, Lisboa',            coordinates: [-9.1369, 38.7075] },
  { morada: 'Saldanha, Lisboa',                     coordinates: [-9.1453, 38.7350] },
  { morada: 'Parque das Nações, Lisboa',            coordinates: [-9.0980, 38.7696] },
  { morada: 'Belém, Lisboa',                        coordinates: [-9.2057, 38.6971] },
  { morada: 'Aeroporto Humberto Delgado, Lisboa',   coordinates: [-9.1319, 38.7793] },
  { morada: 'Cais do Sodré, Lisboa',                coordinates: [-9.1445, 38.7061] },
  { morada: 'Campo Grande, Lisboa',                 coordinates: [-9.1553, 38.7565] },
  { morada: 'Oriente, Lisboa',                      coordinates: [-9.1024, 38.7673] },
  { morada: 'Benfica, Lisboa',                      coordinates: [-9.1918, 38.7397] },
  { morada: 'Chiado, Lisboa',                       coordinates: [-9.1427, 38.7104] },
  { morada: 'Intendente, Lisboa',                   coordinates: [-9.1353, 38.7188] },
  { morada: 'Telheiras, Lisboa',                    coordinates: [-9.1599, 38.7599] },
  { morada: 'Alameda, Lisboa',                      coordinates: [-9.1353, 38.7280] },
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// devolve duas moradas diferentes
const duasMoradas = () => {
  const origem = pick(MORADAS);
  let destino;
  do { destino = pick(MORADAS); } while (destino === origem);
  return [origem, destino];
};

// ── Gera data com offset em dias + horas aleatórias dentro do dia ────────────
const dataComOffset = (diasAtras, horasOffset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  d.setHours(Math.floor(Math.random() * 20) + 2, Math.floor(Math.random() * 60), 0, 0);
  d.setTime(d.getTime() + horasOffset * 60 * 1000);
  return d;
};

// ── Cria um turno "Terminado" para um motorista + taxi numa data passada ─────
const criarTurno = async (motoristaId, taxiId, dataBase) => {
  const inicio = new Date(dataBase);
  inicio.setHours(6, 0, 0, 0);
  const fim = new Date(inicio.getTime() + 10 * 60 * 60 * 1000); // 10h de turno
  return Turno.create({ motorista: motoristaId, taxi: taxiId, hora_inicio: inicio, hora_fim: fim, estado: 'Terminado' });
};

// ── Gera um documento de viagem (sem _id, para collection.insertMany) ────────
const gerarViagem = (clienteId, turnoId, dataBase, duracaoMin = 15) => {
  const [origem, destino] = duasMoradas();
  const inicio = new Date(dataBase);
  const fim    = new Date(inicio.getTime() + duracaoMin * 60 * 1000);
  const km     = +(Math.random() * 18 + 2).toFixed(1);
  const preco  = +(duracaoMin * (Math.random() > 0.5 ? 1.20 : 0.80)).toFixed(2);

  return {
    cliente: clienteId,
    turno:   turnoId,
    n_passageiros:         Math.ceil(Math.random() * 4),
    nivel_conforto:        Math.random() > 0.5 ? 'Luxuoso' : 'Básico',
    rating_motorista:      +(Math.random() * 2 + 3).toFixed(1),
    morada_inicial_viagem: { morada: origem.morada,  localizacao: { type: 'Point', coordinates: origem.coordinates  } },
    morada_final_viagem:   { morada: destino.morada, localizacao: { type: 'Point', coordinates: destino.coordinates } },
    hora_inicial_viagem:   inicio,
    hora_final_viagem:     fim,
    km_percorridos:        km,
    preco_viagem:          preco,
    createdAt:             dataBase,   // necessário para os filtros por período
    updatedAt:             fim,
  };
};

async function main() {
  await mongoose.connect(process.env.DB_URI);
  console.log('Ligado à BD.');

  const clientes   = await Pessoa.find({ tipo: 'Cliente'   }).select('_id nome');
  const motoristas = await Pessoa.find({ tipo: 'Motorista' }).select('_id nome');
  const taxis      = await Taxi.find({}).select('_id matricula');

  if (!clientes.length || !motoristas.length || !taxis.length) {
    console.error('A BD precisa de ter clientes, motoristas e taxis. Corre o seed principal primeiro.');
    process.exit(1);
  }

  console.log(`Encontrados: ${clientes.length} clientes, ${motoristas.length} motoristas, ${taxis.length} taxis`);

  // ── Cria um turno por motorista para cada "era" de dados ────────────────────
  // Hoje, esta semana, este mês, este ano — cada motorista tem 1 turno por era
  const eras = [
    { label: 'hoje',    diasMin: 0,   diasMax: 0   },
    { label: 'semana',  diasMin: 1,   diasMax: 6   },
    { label: 'mês',     diasMin: 7,   diasMax: 29  },
    { label: 'ano',     diasMin: 30,  diasMax: 180 },
  ];

  // Quantas viagens por era
  const viagensPorEra = { hoje: 6, semana: 12, mês: 20, ano: 30 };

  const todasViagens = [];

  for (const era of eras) {
    const count = viagensPorEra[era.label];
    console.log(`\n→ A criar ${count} viagens para "${era.label}"...`);

    // Um turno partilhado por motorista para esta era
    const turnosPorMotorista = {};
    for (const motorista of motoristas) {
      const diasAtras = Math.floor(Math.random() * (era.diasMax - era.diasMin + 1)) + era.diasMin;
      const taxi = pick(taxis);
      const turno = await criarTurno(motorista._id, taxi._id, dataComOffset(diasAtras));
      turnosPorMotorista[motorista._id.toString()] = turno._id;
    }

    for (let i = 0; i < count; i++) {
      const diasAtras  = Math.floor(Math.random() * (era.diasMax - era.diasMin + 1)) + era.diasMin;
      const dataBase   = dataComOffset(diasAtras);
      const duracaoMin = Math.floor(Math.random() * 40) + 8; // 8-48 min
      const cliente    = pick(clientes);
      const motorista  = pick(motoristas);
      const turnoId    = turnosPorMotorista[motorista._id.toString()];

      todasViagens.push(gerarViagem(cliente._id, turnoId, dataBase, duracaoMin));
    }
  }

  // Usa collection.insertMany para preservar o createdAt personalizado
  // (Mongoose com timestamps:true ignora createdAt fornecido manualmente)
  const result = await Viagem.collection.insertMany(todasViagens);
  console.log(`\n✓ ${result.insertedCount} viagens inseridas com sucesso.`);
  console.log('  Hoje:    6  |  Semana: 12  |  Mês: 20  |  Ano: 30');

  await mongoose.disconnect();
  console.log('Ligação encerrada.');
}

main().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
