const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('../models/userModel');
const Fatura = require("../models/faturaModel");
const Reabastecimento = require("../models/reabastecimentoModel");
const Taxi = require("../models/taxiModel");
const Turno = require("../models/turnoModel");
const Viagem = require("../models/viagemModel");
const Preco = require("../models/precoModel");

async function runSeed() {
    try{
        console.log("A popular a base de dados...");
        await Promise.all([
            Fatura.deleteMany({}),
            Viagem.deleteMany({}),
            Reabastecimento.deleteMany({}),
            Turno.deleteMany({}),
            Taxi.deleteMany({}),
            Preco.deleteMany({}),
            User.deleteMany({})
        ]);
        console.log("Base de dados limpa.");

        const passwordHash = await bcrypt.hash("123ABC", 10);

        //Utilizadores (Pessoas)
        const users = await User.insertMany([
            { nome: "Guilherme", email: "gui@teste.com", tipo: "Cliente", nif: 111111111, senha_acesso_web: passwordHash, genero: "M", ano_nascimento: 2000 },
            { nome: "Leonor", email: "leonor@teste.com", tipo: "Cliente", nif: 222222222, senha_acesso_web: passwordHash, genero: "F", ano_nascimento: 1995 },
            { nome: "Maria", email: "maria@teste.com", tipo: "Motorista", nif: 333333333, senha_acesso_web: passwordHash, genero: "M", ano_nascimento: 1980, motorista: { n_carta_conducao: "ZA-12345 1", rating: 5, morada: { texto: "Rua Augusta, Lisboa", localizacao: { type: "Point", coordinates: [-9.1393, 38.7223] } }} },
            { nome: "Afonso", email: "afonso@teste.com", tipo: "Motorista", nif: 444444444, senha_acesso_web: passwordHash, genero: "F", ano_nascimento: 1988, motorista: { n_carta_conducao: "ZA-12345 2",  rating: 5, morada: { texto: "Rua Augusta, Lisboa", localizacao: { type: "Point", coordinates: [-9.1393, 38.7223] } }} },
            { nome: "Sara", email: "sara@teste.com", tipo: "Cliente", nif: 555555555, senha_acesso_web: passwordHash, genero: "M", ano_nascimento: 1995 },
            { nome: "Cliente", email: "pessoa@need4rides.com", genero: "M", tipo: "Cliente", nif: 999999999, senha_acesso_web: passwordHash, ano_nascimento: 2005 },
            { nome: "Admin", email: "pessoa@need4rides.com", genero: "M", tipo: "Gestor", nif: 999999999, senha_acesso_web: passwordHash, ano_nascimento: 2005 },
            { nome: "Motorista", email: "pessoa@need4rides.com", genero: "M", tipo: "Motorista", nif: 999999999, senha_acesso_web: passwordHash, ano_nascimento: 2005, motorista: {n_carta_conducao: "ZA-12345 6", rating: 5, morada: { texto: "Rua Augusta, Lisboa", localizacao: { type: "Point", coordinates: [-9.1393, 38.7223] } }} }
        ]);

        //Taxis
        const taxis = await Taxi.insertMany([
            { matricula: "AA-00-BB", marca: "tesla", modelo: "Model 3", tipo_motor: "Elétrico", nivel_conforto: "Luxuoso", ano_compra: 2023, cor: "#000000" },
            { matricula: "CC-11-DD", marca: "mercedes", modelo: "Classe E", tipo_motor: "Combustão", nivel_conforto: "Luxuoso", ano_compra: 2022, cor: "#000000"},
            { matricula: "EE-22-FF", marca: "skoda", modelo: "Octavia", tipo_motor: "Combustão", nivel_conforto: "Básico", ano_compra: 2021, cor: "#8B0000"},
            { matricula: "GG-33-HH", marca: "peugeot", modelo: "308", tipo_motor: "Combustão", nivel_conforto: "Básico", ano_compra: 2010, cor: "#FF0000"},
            { matricula: "II-44-JJ", marca: "volkswagen", modelo: "Golf", tipo_motor: "Combustão", nivel_conforto: "Básico", ano_compra: 2012, cor: "#F8F8FF"},
            { matricula: "KK-55-LL", marca: "renault", modelo: "Clio", tipo_motor: "Combustão", nivel_conforto: "Básico", ano_compra: 2021, cor: "#B0E0E6"},
            { matricula: "MM-66-NN", marca: "bmw", modelo: "X1", tipo_motor: "Combustão", nivel_conforto: "Luxuoso", ano_compra: 2025, cor: "#D8BFD8"},
            { matricula: "OO-77-PP", marca: "audi", modelo: "TT", tipo_motor: "Combustão", nivel_conforto: "Luxuoso", ano_compra: 2004, cor: "#8B008B"},
            { matricula: "QQ-88-RR", marca: "ford", modelo: "Fiesta", tipo_motor: "Combustão", nivel_conforto: "Básico", ano_compra: 2021, cor: "#FF1493"},
            { matricula: "SS-99-TT", marca: "tesla", modelo: "Cybertruck", tipo_motor: "Elétrico", nivel_conforto: "Luxuoso", ano_compra: 2020, cor: "#00FF00"},
            { matricula: "UU-00-VV", marca: "tesla", modelo: "Model S Plaid", tipo_motor: "Elétrico", nivel_conforto: "Luxuoso", ano_compra: 2022, cor: "#0000CD"},
            { matricula: "WW-22-XX", marca: "dacia", modelo: "Sandero", tipo_motor: "Combustão", nivel_conforto: "Básico", ano_compra: 2026, cor: "#363636"},
            { matricula: "YY-33-ZZ", marca: "dacia", modelo: "Sandero", tipo_motor: "Combustão", nivel_conforto: "Básico", ano_compra: 2024, cor: "#C0C0C0"}
        ]);

        //Preco
        const agora = new Date();
        let ontem = new Date();
        ontem.setDate(agora.getDate() - 1);

        await Preco.insertMany([
            { nivel_conforto: "Básico", valor_minuto: 0.18, acrescimo_noturno: 20, data_definicao: ontem, gestor: users[4]._id },
            { nivel_conforto: "Luxuoso", valor_minuto: 0.28, acrescimo_noturno: 20, data_definicao: ontem, gestor: users[4]._id },
            { nivel_conforto: "Básico", valor_minuto: 0.20, acrescimo_noturno: 20, data_definicao: new Date(), gestor: users[6]._id },
            { nivel_conforto: "Luxuoso", valor_minuto: 0.30, acrescimo_noturno: 20, data_definicao: new Date(), gestor: users[6]._id }
        ]);

        //Turno
        const daquiA2Horas = new Date(agora.getTime() + 2 * 60 * 60 * 1000);
        const daquiA8Horas = new Date(agora.getTime() + 8 * 60 * 60 * 1000);
        const daquiA10Horas = new Date(agora.getTime() + 8 * 60 * 60 * 1000);
        ontem = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
        const ontemFim = new Date(ontem.getTime() + 8 * 60 * 60 * 1000);

        const turno = await Turno.create(
            {
                motorista: users[2]._id, 
                taxi: taxis[0]._id,
                hora_inicio: agora.getTime() - 15 * 60000, 
                hora_fim: daquiA8Horas.getTime() - 15 * 60000, 
                estado: 'Ativo'
            },
            {
                motorista: users[3]._id,
                taxi: taxis[2]._id,      
                hora_inicio: daquiA2Horas, 
                hora_fim: daquiA10Horas,
                estado: 'Agendado'
            },
            {
                motorista: users[2]._id, 
                taxi: taxis[1]._id,      
                hora_inicio: ontem, 
                hora_fim: ontemFim, 
                estado: 'Terminado'
            },
            {
                motorista: users[2]._id, 
                taxi: taxis[3]._id,      
                hora_inicio: daquiA2Horas, 
                hora_fim: daquiA10Horas, 
                estado: 'Cancelado'    
            },
            {
                motorista: users[7]._id, 
                taxi: taxis[4]._id,      
                hora_inicio: daquiA2Horas, 
                hora_fim: daquiA10Horas, 
                estado: 'Cancelado'    
            },
            {
                motorista: users[7]._id, 
                taxi: taxis[5]._id,      
                hora_inicio: ontem, 
                hora_fim: ontemFim, 
                estado: 'Terminado'    
            },
            {
                motorista: users[7]._id, 
                taxi: taxis[6]._id,      
                hora_inicio: agora, 
                hora_fim: daquiA8Horas, 
                estado: 'Ativo'    
            }
        );

        //Reabastecimento
        const inicioDoTurno = agora; 
        const fimDoTurno = new Date(agora.getTime() + 8 * 60 * 60 * 1000);

        await Reabastecimento.insertMany([
            {
                // CENÁRIO 1: TAXI COMBUSTÃO (R9: Totalmente contido no turno)
                taxi: taxis[1]._id, 
                turno: turno[0]._id,
                inicio_abastecimento: new Date(inicioDoTurno.getTime() + 10 * 60000), // 10 min após início turno
                fim_abastecimento: new Date(inicioDoTurno.getTime() + 20 * 60000),   // 20 min após início turno
                quilometragem: 50000, // R25
                valor_pago: 65.50,    // R24
                litros: 40.5,         // R22
                estado: 'Concluído',
                posto: {
                    morada: "Estação de Carregamento GALP",
                    localizacao: {
                        type: "Point",
                        coordinates: [38.76717664396921, -9.1648639241786] 
                    }   
                }
            },
            {
                // CENÁRIO 2: TAXI ELÉTRICO (R10: Início dentro do turno, fim pode ser fora)
                taxi: taxis[0]._id, 
                turno: turno[1]._id,
                inicio_abastecimento: new Date(fimDoTurno.getTime() - 10 * 60000), // Começa 10 min antes de acabar turno
                fim_abastecimento: new Date(fimDoTurno.getTime() + 50 * 60000),    // Acaba 50 min DEPOIS do turno
                quilometragem: 12000, // R25
                valor_pago: 15.00,    // R24
                kWh: 35.0,            // R23 
                estado: 'Concluído',
                posto: {
                    morada: "Estação de Carregamento GALP",
                    localizacao: {
                        type: "Point",
                        coordinates: [38.76470539584935, -9.15820918715102] 
                    }   
                }
            },
            {
                // CENÁRIO 3: KM CRESCENTES (R26)
                taxi: taxis[1]._id, 
                turno: turno[0]._id,
                inicio_abastecimento: new Date(inicioDoTurno.getTime() + 30 * 60000),
                fim_abastecimento: new Date(inicioDoTurno.getTime() + 40 * 60000),
                quilometragem: 50150, // R26: Maior que os 50000 anteriores
                valor_pago: 20.00,
                litros: 12.0,
                estado: 'Concluído',
                posto: {
                    morada: "Estação de Carregamento GALP",
                    localizacao: {
                        type: "Point",
                        coordinates: [38.76717664396921, -9.1648639241786] 
                    }   
                }
            },
            {
                // CENÁRIO 4: Em curso
                taxi: taxis[1]._id, 
                turno: turno[0]._id,
                inicio_abastecimento: new Date(inicioDoTurno.getTime() + 30 * 60000),
                quilometragem: 50155, // R26: Maior que os 50150 anteriores
                estado: 'Em curso',
                posto: {
                    morada: "Estação de Carregamento GALP",
                    localizacao: {
                        type: "Point",
                        coordinates: [38.76717664396921, -9.1648639241786] 
                    }   
                }
            }
            
        ]);

        //Viagens
        const viagens = await Viagem.insertMany([
            {
                // Viagem Concluída (Para gerar fatura)
                cliente: users[0]._id, // Guilherme
                turno: turno[0]._id,   // Maria (Terminado)
                n_passageiros: 2,
                nivel_conforto: "Luxuoso",
                rating_motorista: 5,
                morada_inicial_viagem: { 
                    morada: "Rua Augusta, Lisboa", 
                    localizacao: { 
                        type: "Point",
                        coordinates: [38.7139, -9.1393] 
                    }
                },
                morada_final_viagem: { 
                    morada: "Saldanha, Lisboa", 
                    localizacao: { 
                        type: "Point",
                        coordinates: [38.7350, -9.1453] 
                    }
                },
                hora_inicial_viagem: new Date(agora.getTime() - 10 * 60000), // Há 10 min
                hora_final_viagem: new Date(agora.getTime() - 5 * 60000),   // Há 5 min
                km_percorridos: 4.5,
                preco_viagem: 6
            },
            {
                // Viagem Concluída (para histórico completo)
                cliente: users[0]._id, // Guilherme
                turno: turno[2]._id,   // Maria (Terminado)
                n_passageiros: 2,
                nivel_conforto: "Luxuoso",
                rating_motorista: 5,
                morada_inicial_viagem: { 
                    morada: "Av. Dom João II Lote 1.16, Parque das Nações, 1990-083 Lisboa", 
                    localizacao: { 
                        type: "Point",
                        coordinates: [38.76962002959662, -9.098032828203317] 
                    }
                },
                morada_final_viagem: { 
                    morada: "Escolas Gerais 38, 1100-216 Lisboa", 
                    localizacao: { 
                        type: "Point",
                        coordinates: [38.713937090210436, -9.128641312853786] 
                    }
                },
                hora_inicial_viagem: new Date(ontem.getTime() + 2 * 60000), 
                hora_final_viagem: new Date(ontem.getTime() + 25 * 60000), 
                km_percorridos: 9.1,
                preco_viagem: 10.92
            },
            {
                // Viagem Concluída (para histórico completo)
                cliente: users[0]._id, // Guilherme
                turno: turno[2]._id,   // Maria (Terminado)
                n_passageiros: 2,
                nivel_conforto: "Luxuoso",
                rating_motorista: 5,
                morada_inicial_viagem: { 
                    morada: "Saldanha Residence, Av. Fontes Pereira de Melo 42 E, 1050-250 Lisboa", 
                    localizacao: { 
                        type: "Point",
                        coordinates: [38.73254380161429, -9.145537215731492] 
                    }
                },
                morada_final_viagem: { 
                    morada: "Aeroporto Internacional de Lisboa Humberto Delgado", 
                    localizacao: { 
                        type: "Point",
                        coordinates: [38.779327804920236, -9.131926869721497] 
                    }
                },
                hora_inicial_viagem: new Date(ontem.getTime() + 30 * 60000), 
                hora_final_viagem: new Date(ontem.getTime() + 40 * 60000), 
                km_percorridos: 5,
                preco_viagem: 6
            },
            {
                // Viagem Concluída (para histórico completo)
                cliente: users[0]._id, // Guilherme
                turno: turno[2]._id,   // Maria (Terminado)
                n_passageiros: 2,
                nivel_conforto: "Luxuoso",
                rating_motorista: 5,
                morada_inicial_viagem: { 
                    morada: "Aeroporto Internacional de Lisboa Humberto Delgado", 
                    localizacao: { 
                        type: "Point",
                        coordinates: [38.779327804920236, -9.131926869721497] 
                    }
                },
                morada_final_viagem: { 
                    morada: "Alameda das Linhas de Torres, Lisboa", 
                    localizacao: { 
                        type: "Point",
                        coordinates: [38.77339117824467, -9.155801591039156] 
                    }
                },
                hora_inicial_viagem: new Date(ontem.getTime() + 45 * 60000), 
                hora_final_viagem: new Date(ontem.getTime() + 55 * 60000), 
                km_percorridos: 5,
                preco_viagem: 12
            },
            {
                // Viagem Concluída (para histórico completo)
                cliente: users[0]._id, // Guilherme
                turno: turno[2]._id,   // Maria (Terminado)
                n_passageiros: 2,
                nivel_conforto: "Luxuoso",
                rating_motorista: 5,
                morada_inicial_viagem: { 
                    morada: "Alameda das Linhas de Torres, Lisboa", 
                    localizacao: { 
                        type: "Point",
                        coordinates: [38.77339117824467, -9.155801591039156] 
                    }
                },
                morada_final_viagem: { 
                    morada: "Campo Grande 016, 1749-016 Lisboa", 
                    localizacao: { 
                        type: "Point",
                        coordinates: [38.756537778333794, -9.155319616979538] 
                    }
                },
                hora_inicial_viagem: new Date(ontem.getTime() + 60 * 60000), 
                hora_final_viagem: new Date(ontem.getTime() + 70 * 60000), 
                km_percorridos: 5,
                preco_viagem: 6
            },
            {
                // Viagem Concluída (para histórico completo)
                cliente: users[0]._id, // Guilherme
                turno: turno[2]._id,   // Maria (Terminado)
                n_passageiros: 2,
                nivel_conforto: "Luxuoso",
                rating_motorista: 5,
                morada_inicial_viagem: { 
                    morada: "Estr. de Telheiras, Lisboa", 
                    localizacao: { 
                        type: "Point",
                        coordinates: [38.75994598397486, -9.159915583957925] 
                    }
                },
                morada_final_viagem: { 
                    morada: "R. de Santa Cruz do Castelo, 1100-129 Lisboa", 
                    localizacao: { 
                        type: "Point",
                        coordinates: [38.71435039979026, -9.133196831734294] 
                    }
                },
                hora_inicial_viagem: new Date(ontem.getTime() + 80 * 60000), 
                hora_final_viagem: new Date(ontem.getTime() + 90 * 60000), 
                km_percorridos: 5,
                preco_viagem: 6
            },
            {
                // Pedido Pendente (Sem turno/motorista ainda) - Nivel de conforto errado (taxi é Luxuoso e cliente quer Básico)
                cliente: users[1]._id, // Leonor
                n_passageiros: 1,
                nivel_conforto: "Básico",
                morada_inicial_viagem: { 
                    morada: "Cais do Sodré, Lisboa", 
                    localizacao: {
                        type: "Point",
                        coordinates: [38.7061, -9.1445] 
                    }
                },
                morada_final_viagem: { 
                    morada: "Belém, Lisboa", 
                    localizacao: {
                        type: "Point",
                        coordinates: [38.6970, -9.2120] 
                    }
                }
            },
            {
                // Pedido Pendente (Sem turno/motorista ainda)
                cliente: users[0]._id, // Guilherme
                n_passageiros: 3,
                nivel_conforto: "Luxuoso",
                morada_inicial_viagem: { 
                    morada: "Cais do Sodré, Lisboa", 
                    localizacao: {
                        type: "Point",
                        coordinates: [38.7061, -9.1445] 
                    }
                },
                morada_final_viagem: { 
                    morada: "Belém, Lisboa", 
                    localizacao: {
                        type: "Point",
                        coordinates: [38.6970, -9.2120] 
                    }
                }
            },
            {
                // Pedido Pendente (Sem turno/motorista ainda) - Conforto correto, distância muito longe
                cliente: users[4]._id, // Sara
                n_passageiros: 3,
                nivel_conforto: "Luxuoso",
                morada_inicial_viagem: { 
                    morada: "R. Prof. Armindo Ayres de Carvalho 11, 2640-453 Mafra", 
                    localizacao: {
                        type: "Point",
                        coordinates: [38.94462824164272, -9.355216323661047] 
                    }
                },
                morada_final_viagem: { 
                    morada: "Belém, Lisboa", 
                    localizacao: {
                        type: "Point",
                        coordinates: [38.6970, -9.2120] 
                    }
                }
            },
            {
                // Viagem em Curso
                cliente: users[5]._id, // Cliente Need4Rides
                turno: turno[6]._id,   // Motorista Need4Rides (Ativo)
                n_passageiros: 3,
                nivel_conforto: "Luxuoso",
                morada_inicial_viagem: { 
                    morada: "Marquês de Pombal", 
                    localizacao: {
                        type: "Point",
                        coordinates: [38.7253, -9.1503]
                    }
                },
                morada_final_viagem: { 
                    morada: "Amadora", 
                    localizacao: {
                        type: "Point",
                        coordinates: [38.7588, -9.2302] 
                    }
                },
                hora_inicial_viagem: agora
            }
        ]);

        //Faturas
        await Fatura.insertMany([
            {
                n_sequencial: 1,
                ano: 2026,
                data_emissao: new Date(agora.getTime() - 5 * 60000), // Hora do fim da viagem
                viagem: viagens[0]._id
            }
        ]);

    } catch (error) {
        console.error("Erro durante o Seed:", error);
    }
}

module.exports = runSeed;