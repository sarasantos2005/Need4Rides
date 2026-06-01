const Viagem = require('../models/viagemModel');
const Turno = require('../models/turnoModel');
const Taxi = require('../models/taxiModel');
const Pessoa = require('../models/userModel');
const Reabastecimento = require('../models/reabastecimentoModel');
const pdf = require('html-pdf');
const fs = require('fs');
const path = require('path');

// Converte "YYYY-MM-DD" em Date local (início ou fim do dia)
function parseDia(str, fimDoDia = false) {
  const [y, m, d] = str.split('-').map(Number);
  return fimDoDia
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0, 0, 0, 0);
}

// US14 - Relatórios táxis e motoristas
exports.getRelatorios = async (req, res) => {
  try {
    const agora = new Date();
    const hojeStr = `${agora.getFullYear()}-${String(agora.getMonth()+1).padStart(2,'0')}-${String(agora.getDate()).padStart(2,'0')}`;

    const di = req.query.dataInicio || hojeStr;
    const df = req.query.dataFim   || hojeStr;

    const dataInicio = parseDia(di, false);
    const dataFim    = parseDia(df, true);

    console.log('[relatorios] di:', di, '→', dataInicio.toISOString());
    console.log('[relatorios] df:', df, '→', dataFim.toISOString());

    // 1. VIAGENS NO PERÍODO
    const viagensNoPeriodo = await Viagem.find({
      createdAt: { $gte: dataInicio, $lte: dataFim }
    }).populate({ path: 'turno', populate: [{ path: 'motorista' }, { path: 'taxi' }] }).populate('cliente');

    console.log('[relatorios] viagensNoPeriodo:', viagensNoPeriodo.length);
    if (viagensNoPeriodo.length > 0) {
      console.log('[relatorios] exemplo createdAt:', viagensNoPeriodo[0].createdAt);
    }

    const viagensPeriodoAtivas = viagensNoPeriodo.filter(v => !v.hora_final_viagem);
    const viagensPeriodoCompletadas = viagensNoPeriodo.filter(v => v.hora_final_viagem);

    // 2. VIAGENS EM CURSO ATUAIS (independentes do filtro de período)
    const viagensEmCursoAtuais = await Viagem.find({
      hora_final_viagem: null,
      hora_inicial_viagem: { $lte: agora }
    }).populate({ path: 'turno', populate: [{ path: 'motorista' }, { path: 'taxi' }] }).populate('cliente');

    // 3. RECEITA TOTAL DO PERÍODO
    const receitaTotal = viagensPeriodoCompletadas.reduce((total, v) => total + (v.preco_viagem || 0), 0);

    // 3. MOTORISTAS ATIVOS
    const turnosAtivos = await Turno.find({
      estado: { $in: ['Ativo', 'Agendado'] },
      hora_inicio: { $lte: agora },
      hora_fim: { $gte: agora }
    }).populate('motorista').populate('taxi');

    const motoristasAtivos = turnosAtivos.length;
    const totalMotoristas = await Pessoa.countDocuments({ tipo: 'Motorista' });

    // 4. TÁXIS EM SERVIÇO
    const taxisEmServico = turnosAtivos.length;
    const totalTaxis = await Taxi.countDocuments();

    // 5. VIAGENS EM CURSO DETALHADAS
    const viagensEmCursoDetalhadas = (await Promise.all(
      viagensEmCursoAtuais.map(async (viagem) => {
        let turno = viagem.turno?._id ? viagem.turno : null;
        if (turno && !turno.motorista?.nome) {
          turno = await Turno.findById(turno._id).populate('motorista').populate('taxi');
        }
        if (!viagem.cliente?.nome || !turno?.motorista?.nome) return null;
        return {
          id: viagem._id,
          cliente: viagem.cliente.nome,
          motorista: turno.motorista.nome,
          origem: viagem.morada_inicial_viagem?.morada || '—',
          destino: viagem.morada_final_viagem?.morada || '—',
          status: 'Em curso'
        };
      })
    )).filter(v => v !== null);

    // 6. MOTORISTAS COM ESTATÍSTICAS
    const motoristas = await Pessoa.find({ tipo: 'Motorista' });

    const motoristasComStats = await Promise.all(
      motoristas.map(async (motorista) => {
        // Viagens no período
        const viagensMotorista = await Viagem.find({
          turno: { $in: await Turno.find({ motorista: motorista._id }).distinct('_id') },
          createdAt: { $gte: dataInicio, $lte: dataFim }
        });

        const viagensCompletadas = viagensMotorista.filter(v => v.hora_final_viagem);
        const ganhos = viagensCompletadas.reduce((total, v) => total + (v.preco_viagem || 0), 0);

        // Verificar se está em turno ativo
        const turnoAtivo = await Turno.findOne({
          motorista: motorista._id,
          estado: { $in: ['Ativo', 'Agendado'] },
          hora_inicio: { $lte: agora },
          hora_fim: { $gte: agora }
        });

        return {
          id: motorista._id,
          nome: motorista.nome,
          estado: turnoAtivo ? 'Em turno' : 'Fora de turno',
          viagens: viagensMotorista.length,
          ganhos: ganhos.toFixed(2)
        };
      })
    );

    // 8. VIAGENS DO PERÍODO SELECIONADAS + TOTAIS HORAS/KM + DRILL-DOWN
    const viagensPeriodoSelecionadas = [...viagensPeriodoCompletadas]
      .sort((a, b) => new Date(b.hora_final_viagem) - new Date(a.hora_final_viagem));

    // Populate turno para todas as viagens completadas
    const viagensPopuladas = await Promise.all(
      viagensPeriodoSelecionadas.map(async (viagem) => {
        let turno = viagem.turno?._id ? viagem.turno : null;
        if (turno && !turno.motorista?.nome) {
          turno = await Turno.findById(turno._id).populate('motorista').populate('taxi');
        }
        if (!turno?.motorista?.nome) return null;
        const horas = viagem.hora_final_viagem && viagem.hora_inicial_viagem
          ? parseFloat(((new Date(viagem.hora_final_viagem) - new Date(viagem.hora_inicial_viagem)) / 3600000).toFixed(4))
          : 0;
        return { viagem, turno, horas };
      })
    ).then(r => r.filter(Boolean));

    const totalHoras = parseFloat(viagensPopuladas.reduce((s, { horas }) => s + horas, 0).toFixed(2));
    const totalKm    = parseFloat(viagensPopuladas.reduce((s, { viagem }) => s + (viagem.km_percorridos || 0), 0).toFixed(2));

    const viagensPeriodoDetalhadas = viagensPopuladas
      .filter(({ viagem }) => viagem.cliente?.nome)
      .map(({ viagem, turno, horas }) => ({
        id: viagem._id,
        cliente: viagem.cliente?.nome || '—',
        motorista: turno.motorista.nome,
        motoristaId: turno.motorista._id,
        taxiId: turno.taxi?._id,
        taxi: turno.taxi ? `${turno.taxi.matricula} ${turno.taxi.marca} ${turno.taxi.modelo}` : '—',
        origem: viagem.morada_inicial_viagem?.morada || '—',
        destino: viagem.morada_final_viagem?.morada || '—',
        preco: viagem.preco_viagem || 0,
        km: viagem.km_percorridos || 0,
        horas,
        inicio: viagem.hora_inicial_viagem ? new Date(viagem.hora_inicial_viagem).toLocaleString('pt-PT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—',
        fim:    viagem.hora_final_viagem   ? new Date(viagem.hora_final_viagem).toLocaleString('pt-PT',   { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—',
        data: new Date(viagem.hora_final_viagem || viagem.createdAt).toLocaleDateString('pt-PT'),
        hora: new Date(viagem.hora_final_viagem || viagem.createdAt).toLocaleTimeString('pt-PT', { hour:'2-digit', minute:'2-digit' }),
      }));

    // Drill-down por motorista
    const porMotorista = {};
    for (const { viagem, turno, horas } of viagensPopuladas) {
      const id = turno.motorista._id.toString();
      if (!porMotorista[id]) porMotorista[id] = { id, nome: turno.motorista.nome, viagens: 0, horas: 0, km: 0, detalhes: [] };
      porMotorista[id].viagens++;
      porMotorista[id].horas = parseFloat((porMotorista[id].horas + horas).toFixed(4));
      porMotorista[id].km    = parseFloat((porMotorista[id].km + (viagem.km_percorridos || 0)).toFixed(2));
      porMotorista[id].detalhes.push({
        id: viagem._id,
        origem: viagem.morada_inicial_viagem?.morada || '—',
        destino: viagem.morada_final_viagem?.morada || '—',
        km: viagem.km_percorridos || 0,
        horas,
        inicio: viagem.hora_inicial_viagem ? new Date(viagem.hora_inicial_viagem).toLocaleString('pt-PT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—',
        fim:    viagem.hora_final_viagem   ? new Date(viagem.hora_final_viagem).toLocaleString('pt-PT',   { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—',
      });
    }

    // Drill-down por táxi
    const porTaxi = {};
    for (const { viagem, turno, horas } of viagensPopuladas) {
      if (!turno.taxi) continue;
      const id = turno.taxi._id.toString();
      if (!porTaxi[id]) porTaxi[id] = { id, matricula: turno.taxi.matricula, marca: turno.taxi.marca, modelo: turno.taxi.modelo, tipo_motor: turno.taxi.tipo_motor, viagens: 0, horas: 0, km: 0, detalhes: [] };
      porTaxi[id].viagens++;
      porTaxi[id].horas = parseFloat((porTaxi[id].horas + horas).toFixed(4));
      porTaxi[id].km    = parseFloat((porTaxi[id].km + (viagem.km_percorridos || 0)).toFixed(2));
      porTaxi[id].detalhes.push({
        id: viagem._id,
        motorista: turno.motorista.nome,
        origem: viagem.morada_inicial_viagem?.morada || '—',
        destino: viagem.morada_final_viagem?.morada || '—',
        km: viagem.km_percorridos || 0,
        horas,
        inicio: viagem.hora_inicial_viagem ? new Date(viagem.hora_inicial_viagem).toLocaleString('pt-PT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—',
        fim:    viagem.hora_final_viagem   ? new Date(viagem.hora_final_viagem).toLocaleString('pt-PT',   { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—',
      });
    }

    const drillDown = {
      motoristas: Object.values(porMotorista).sort((a, b) => b.viagens - a.viagens),
      taxis: Object.values(porTaxi).sort((a, b) => b.viagens - a.viagens),
    };

    // US15 — Drill-down faturação por cliente
    const porCliente = {};
    for (const { viagem, turno } of viagensPopuladas) {
      if (!viagem.cliente?.nome) continue;
      const id = viagem.cliente._id.toString();
      if (!porCliente[id]) porCliente[id] = { id, nome: viagem.cliente.nome, euros: 0, viagens: [] };
      porCliente[id].euros += viagem.preco_viagem || 0;
      porCliente[id].viagens.push({
        id: viagem._id,
        origem: viagem.morada_inicial_viagem?.morada || '—',
        destino: viagem.morada_final_viagem?.morada || '—',
        preco: viagem.preco_viagem || 0,
        inicio: viagem.hora_inicial_viagem ? new Date(viagem.hora_inicial_viagem).toLocaleString('pt-PT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—',
        fim:    viagem.hora_final_viagem   ? new Date(viagem.hora_final_viagem).toLocaleString('pt-PT',   { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—',
        motorista: turno.motorista.nome,
      });
    }

    const faturacaoPorCliente = Object.values(porCliente)
      .map(c => ({ ...c, euros: parseFloat(c.euros.toFixed(2)), viagens: c.viagens.sort((a, b) => b.preco - a.preco) }))
      .sort((a, b) => b.euros - a.euros);

    // 7. ESTATÍSTICAS ADICIONAIS PARA RELATÓRIOS
    const statsAdicionais = {
      taxis: {
        total: totalTaxis,
        emServico: taxisEmServico,
        disponiveis: totalTaxis - taxisEmServico,
        porTipo: await Taxi.aggregate([
          { $group: { _id: '$tipo_motor', count: { $sum: 1 } } }
        ]),
        porConforto: await Taxi.aggregate([
          { $group: { _id: '$nivel_conforto', count: { $sum: 1 } } }
        ])
      },
      motoristas: {
        total: totalMotoristas,
        ativos: motoristasAtivos,
        inativos: totalMotoristas - motoristasAtivos,
        topPerformers: motoristasComStats
          .sort((a, b) => parseFloat(b.ganhos) - parseFloat(a.ganhos))
          .slice(0, 5)
      },
      viagens: {
        total: viagensNoPeriodo.length,
        ativas: viagensEmCursoAtuais.length,
        completadas: viagensPeriodoCompletadas.length,
        mediaPreco: viagensPeriodoCompletadas.length > 0 ?
          (receitaTotal / viagensPeriodoCompletadas.length).toFixed(2) : '0.00'
      }
    };

    res.status(200).json({
      success: true,
      periodo: { inicio: dataInicio, fim: dataFim },
      resumo: {
        viagensPeriodo: viagensPeriodoCompletadas.length,
        horasPeriodo: totalHoras,
        kmPeriodo: totalKm,
        receitaPeriodo: receitaTotal.toFixed(2),
        motoristasAtivos: `${motoristasAtivos} / ${totalMotoristas}`,
        taxisEmServico: `${taxisEmServico} / ${totalTaxis}`
      },
      viagensEmCurso: viagensEmCursoDetalhadas,
      motoristas: motoristasComStats,
      viagensPeriodo: viagensPeriodoDetalhadas,
      viagensUltimaSemana: viagensPeriodoDetalhadas,
      drillDown,
      faturacaoPorCliente,
      statsAdicionais
    });

  } catch (error) {
    console.error('Erro ao gerar relatórios:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatórios.',
      error: error.message
    });
  }
};

// US - Relatório pessoal do motorista
exports.getRelatoriosMotorista = async (req, res) => {
  try {
    const agora = new Date();
    const hojeStr = `${agora.getFullYear()}-${String(agora.getMonth()+1).padStart(2,'0')}-${String(agora.getDate()).padStart(2,'0')}`;
    const di = req.query.dataInicio || hojeStr;
    const df = req.query.dataFim   || hojeStr;
    const dataInicio = parseDia(di, false);
    const dataFim    = parseDia(df, true);

    const motoristaId = req.userId;

    const turnoIds = await Turno.find({ motorista: motoristaId }).distinct('_id');

    const viagens = await Viagem.find({
      turno: { $in: turnoIds },
      createdAt: { $gte: dataInicio, $lte: dataFim },
      hora_final_viagem: { $exists: true, $ne: null }
    }).populate('cliente');

    const totalGanhos = viagens.reduce((s, v) => s + (v.preco_viagem || 0), 0);
    const totalKm     = viagens.reduce((s, v) => s + (v.km_percorridos || 0), 0);
    const ratings     = viagens.map(v => v.rating_motorista).filter(r => r != null);
    const avgRating   = ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : null;

    const viagensDetalhadas = viagens
      .map(v => {
        const raw = v.createdAt || v.hora_inicial_viagem;
        const d   = raw instanceof Date ? raw : new Date(raw);
        const durMin = v.hora_final_viagem && v.hora_inicial_viagem
          ? Math.round((new Date(v.hora_final_viagem) - new Date(v.hora_inicial_viagem)) / 60000)
          : null;
        return {
          id:          v._id,
          cliente:     v.cliente?.nome || '—',
          origem:      v.morada_inicial_viagem?.morada || '—',
          destino:     v.morada_final_viagem?.morada   || '—',
          km:          v.km_percorridos  || 0,
          preco:       v.preco_viagem    || 0,
          rating:      v.rating_motorista ?? null,
          passageiros: v.n_passageiros   || 1,
          conforto:    v.nivel_conforto  || '—',
          duracao:     durMin,
          data:        d.toLocaleDateString('pt-PT'),
          hora:        d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
        };
      })
      .sort((a, b) => {
        const parse = str => { const [d,m,y] = str.split('/'); return new Date(`${y}-${m}-${d}`).getTime(); };
        return parse(b.data) - parse(a.data);
      });

    res.status(200).json({
      success: true,
      periodo: { inicio: dataInicio, fim: dataFim },
      resumo: {
        viagens:     viagens.length,
        ganhos:      totalGanhos.toFixed(2),
        km:          totalKm.toFixed(1),
        ratingMedio: avgRating ?? '—',
      },
      viagens: viagensDetalhadas,
    });
  } catch (error) {
    console.error('Erro ao gerar relatório do motorista:', error);
    res.status(500).json({ success: false, message: 'Erro ao gerar relatório.', error: error.message });
  }
};

// US16 - Relatório de reabastecimentos
exports.getRelatoriosReabastecimentos = async (req, res) => {
  try {
    const agora = new Date();
    const hojeStr = `${agora.getFullYear()}-${String(agora.getMonth()+1).padStart(2,'0')}-${String(agora.getDate()).padStart(2,'0')}`;
    const di = req.query.dataInicio || hojeStr;
    const df = req.query.dataFim   || hojeStr;
    const dataInicio = parseDia(di, false);
    const dataFim    = parseDia(df, true);

    const reabastecimentos = await Reabastecimento.find({
      estado: 'Concluído',
      inicio_abastecimento: { $gte: dataInicio, $lte: dataFim }
    }).populate('taxi');

    const totalEuros = reabastecimentos.reduce((s, r) => s + (r.valor_pago || 0), 0);
    const totalHoras = reabastecimentos.reduce((s, r) => {
      if (!r.fim_abastecimento || !r.inicio_abastecimento) return s;
      return s + (new Date(r.fim_abastecimento) - new Date(r.inicio_abastecimento)) / 3600000;
    }, 0);

    // Subtotais por tipo de motor
    const porTipo = {};
    for (const r of reabastecimentos) {
      const tipo = r.taxi?.tipo_motor || 'Desconhecido';
      if (!porTipo[tipo]) porTipo[tipo] = { euros: 0, horas: 0, taxis: {} };
      porTipo[tipo].euros += r.valor_pago || 0;
      if (r.fim_abastecimento && r.inicio_abastecimento) {
        porTipo[tipo].horas += (new Date(r.fim_abastecimento) - new Date(r.inicio_abastecimento)) / 3600000;
      }
      const taxiId = r.taxi?._id?.toString();
      if (taxiId) {
        if (!porTipo[tipo].taxis[taxiId]) {
          porTipo[tipo].taxis[taxiId] = {
            id: taxiId,
            matricula: r.taxi.matricula,
            marca: r.taxi.marca,
            modelo: r.taxi.modelo,
            tipo_motor: r.taxi.tipo_motor,
            euros: 0,
            horas: 0,
            registos: []
          };
        }
        porTipo[tipo].taxis[taxiId].euros += r.valor_pago || 0;
        if (r.fim_abastecimento && r.inicio_abastecimento) {
          porTipo[tipo].taxis[taxiId].horas += (new Date(r.fim_abastecimento) - new Date(r.inicio_abastecimento)) / 3600000;
        }
        porTipo[tipo].taxis[taxiId].registos.push({
          id: r._id,
          data: new Date(r.inicio_abastecimento).toLocaleDateString('pt-PT'),
          hora: new Date(r.inicio_abastecimento).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
          posto: r.posto?.morada || '—',
          valor: r.valor_pago || 0,
          litros: r.litros || null,
          kWh: r.kWh || null,
          duracao: r.fim_abastecimento ? ((new Date(r.fim_abastecimento) - new Date(r.inicio_abastecimento)) / 3600000).toFixed(2) : null
        });
      }
    }

    const subtotais = Object.entries(porTipo).map(([tipo, dados]) => ({
      tipo,
      euros: parseFloat(dados.euros.toFixed(2)),
      horas: parseFloat(dados.horas.toFixed(2)),
      taxis: Object.values(dados.taxis)
        .map(t => ({ ...t, euros: parseFloat(t.euros.toFixed(2)), horas: parseFloat(t.horas.toFixed(2)) }))
        .sort((a, b) => b.euros - a.euros)
    }));

    res.status(200).json({
      success: true,
      periodo: { inicio: dataInicio, fim: dataFim },
      totais: {
        euros: parseFloat(totalEuros.toFixed(2)),
        horas: parseFloat(totalHoras.toFixed(2)),
      },
      subtotais
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de reabastecimentos:', error);
    res.status(500).json({ success: false, message: 'Erro ao gerar relatório.', error: error.message });
  }
};

// Exportar relatório para PDF
exports.exportarPDF = async (req, res) => {
  try {
    const { periodo = 'hoje' } = req.query;

    // Buscar dados do relatório
    const dadosRelatorio = await getRelatoriosData(periodo);

    // Gerar HTML do relatório
    const html = gerarHTMLRelatorio(dadosRelatorio);

    // Configurações do PDF
    const options = {
      format: 'A4',
      orientation: 'portrait',
      border: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      }
    };

    // Gerar PDF
    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) {
        console.error('Erro ao gerar PDF:', err);
        return res.status(500).json({
          success: false,
          message: 'Erro ao gerar PDF.',
          error: err.message
        });
      }

      // Enviar PDF como resposta
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio-${periodo}-${new Date().toISOString().split('T')[0]}.pdf`);
      res.send(buffer);
    });

  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao exportar relatório.',
      error: error.message
    });
  }
};

// Função auxiliar para buscar dados do relatório
async function getRelatoriosData(periodo) {
  // Definir período baseado no filtro
  let dataInicio, dataFim;
  const agora = new Date();

  switch (periodo) {
    case 'hoje':
      dataInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
      dataFim = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
      break;
    case 'semana':
      dataInicio = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
      dataFim = agora;
      break;
    case 'mes':
      dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
      dataFim = agora;
      break;
    case 'ano':
      dataInicio = new Date(agora.getFullYear(), 0, 1);
      dataFim = agora;
      break;
    default:
      dataInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
      dataFim = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
  }

  // Buscar dados (lógica similar ao getRelatorios)
  const viagens = await Viagem.find({
    createdAt: { $gte: dataInicio, $lt: dataFim }
  }).populate('turno').populate('cliente');

  const viagensCompletadas = viagens.filter(v => v.hora_final_viagem);
  const receitaTotal = viagensCompletadas.reduce((total, v) => total + (v.preco_viagem || 0), 0);

  const turnosAtivos = await Turno.find({
    estado: { $in: ['Ativo', 'Agendado'] },
    hora_inicio: { $lte: agora },
    hora_fim: { $gte: agora }
  }).populate('motorista').populate('taxi');

  const motoristasAtivos = turnosAtivos.length;
  const totalMotoristas = await Pessoa.countDocuments({ tipo: 'Motorista' });
  const totalTaxis = await Taxi.countDocuments();

  return {
    periodo: { filtro: periodo, inicio: dataInicio, fim: dataFim },
    resumo: {
      viagens: viagens.length,
      receita: receitaTotal.toFixed(2),
      motoristasAtivos,
      totalMotoristas,
      taxisEmServico: turnosAtivos.length,
      totalTaxis
    },
    viagens,
    turnosAtivos,
    motoristas: await Pessoa.find({ tipo: 'Motorista' })
  };
}

// Gerar HTML do relatório
function gerarHTMLRelatorio(dados) {
  const { periodo, resumo, viagens, turnosAtivos, motoristas } = dados;

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Relatório Need4Rides - ${periodo.filtro}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #f5c518; }
            .periodo { margin: 10px 0; color: #666; }
            .resumo { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .resumo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
            .stat { text-align: center; padding: 10px; background: white; border-radius: 5px; }
            .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
            .stat-value { font-size: 24px; font-weight: bold; color: #333; }
            .section { margin: 30px 0; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; font-weight: bold; }
            .footer { margin-top: 50px; text-align: center; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">Need4Rides</div>
            <div class="periodo">Relatório de ${periodo.filtro} - ${new Date().toLocaleDateString('pt-PT')}</div>
        </div>

        <div class="resumo">
            <div class="section-title">Resumo</div>
            <div class="resumo-grid">
                <div class="stat">
                    <div class="stat-label">Viagens</div>
                    <div class="stat-value">${resumo.viagens}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Receita</div>
                    <div class="stat-value">€${resumo.receita}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Motoristas Ativos</div>
                    <div class="stat-value">${resumo.motoristasAtivos}/${resumo.totalMotoristas}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Táxis em Serviço</div>
                    <div class="stat-value">${resumo.taxisEmServico}/${resumo.totalTaxis}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Viagens em Curso</div>
            <table>
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Motorista</th>
                        <th>Origem</th>
                        <th>Destino</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${viagens.filter(v => !v.hora_final_viagem).map(v => `
                        <tr>
                            <td>${v.cliente?.nome || 'Cliente'}</td>
                            <td>${v.turno?.motorista?.nome || 'Motorista'}</td>
                            <td>${v.morada_inicial_viagem?.morada || 'Origem'}</td>
                            <td>${v.morada_final_viagem?.morada || 'Destino'}</td>
                            <td>Em curso</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <div class="section-title">Motoristas</div>
            <table>
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Estado</th>
                        <th>Viagens</th>
                        <th>Ganhos</th>
                    </tr>
                </thead>
                <tbody>
                    ${motoristas.map(m => `
                        <tr>
                            <td>${m.nome}</td>
                            <td>${turnosAtivos.some(t => t.motorista._id.toString() === m._id.toString()) ? 'Em turno' : 'Fora de turno'}</td>
                            <td>0</td>
                            <td>€0.00</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="footer">
            Relatório gerado em ${new Date().toLocaleString('pt-PT')}
        </div>
    </body>
    </html>
  `;
}