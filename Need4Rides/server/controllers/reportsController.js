const Viagem = require('../models/viagemModel');
const Turno = require('../models/turnoModel');
const Taxi = require('../models/taxiModel');
const Pessoa = require('../models/userModel');
const pdf = require('html-pdf');
const fs = require('fs');
const path = require('path');

// US14 - Relatórios táxis e motoristas
exports.getRelatorios = async (req, res) => {
  try {
    const { periodo = 'hoje' } = req.query;

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
        dataInicio = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
        dataFim = agora;
        break;
      case 'ano':
        dataInicio = new Date(agora.getTime() - 365 * 24 * 60 * 60 * 1000);
        dataFim = agora;
        break;
      default:
        dataInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
        dataFim = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
    }

    // 1. VIAGENS NO PERÍODO
    const viagensNoPeriodo = await Viagem.find({
      createdAt: { $gte: dataInicio, $lt: dataFim }
    }).populate('turno').populate('cliente');

    const viagensPeriodoAtivas = viagensNoPeriodo.filter(v => !v.hora_final_viagem);
    const viagensPeriodoCompletadas = viagensNoPeriodo.filter(v => v.hora_final_viagem);

    // 2. VIAGENS EM CURSO ATUAIS (independentes do filtro de período)
    const viagensEmCursoAtuais = await Viagem.find({
      hora_final_viagem: null,
      hora_inicial_viagem: { $lte: agora }
    }).populate('turno').populate('cliente');

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
    const viagensEmCursoDetalhadas = await Promise.all(
      viagensEmCursoAtuais.map(async (viagem) => {
        const turno = viagem.turno
          ? (viagem.turno._id ? viagem.turno : await Turno.findById(viagem.turno).populate('motorista').populate('taxi'))
          : null;
        return {
          id: viagem._id,
          cliente: viagem.cliente?.nome || 'Cliente',
          motorista: turno?.motorista?.nome || 'Motorista',
          origem: viagem.morada_inicial_viagem?.morada || 'Origem',
          destino: viagem.morada_final_viagem?.morada || 'Destino',
          status: 'Em curso'
        };
      })
    );

    // 6. MOTORISTAS COM ESTATÍSTICAS
    const motoristas = await Pessoa.find({ tipo: 'Motorista' });

    const motoristasComStats = await Promise.all(
      motoristas.map(async (motorista) => {
        // Viagens no período
        const viagensMotorista = await Viagem.find({
          turno: { $in: await Turno.find({ motorista: motorista._id }).distinct('_id') },
          createdAt: { $gte: dataInicio, $lt: dataFim }
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

    // 8. VIAGENS DO PERÍODO SELECIONADO (aplicar filtro atual)
    const viagensPeriodoSelecionadas = viagensPeriodoCompletadas
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20);

    const viagensPeriodoDetalhadas = await Promise.all(
      viagensPeriodoSelecionadas.map(async (viagem) => {
        const turno = viagem.turno
          ? (viagem.turno._id ? viagem.turno : await Turno.findById(viagem.turno).populate('motorista').populate('taxi'))
          : null;
        const rawDate = viagem.createdAt || viagem.hora_final_viagem || viagem.hora_inicial_viagem || new Date();
        const dataViagem = rawDate instanceof Date ? rawDate : new Date(rawDate);

        if (isNaN(dataViagem.getTime())) {
          console.error('Erro: dataViagem inválida para viagem:', viagem._id, rawDate);
          return null;
        }

        return {
          id: viagem._id,
          cliente: viagem.cliente?.nome || 'Cliente',
          motorista: turno?.motorista?.nome || 'Motorista',
          origem: viagem.morada_inicial_viagem?.morada || 'Origem',
          destino: viagem.morada_final_viagem?.morada || 'Destino',
          preco: viagem.preco_viagem || 0,
          data: dataViagem.toLocaleDateString('pt-PT'),
          hora: dataViagem.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
        };
      })
    ).then(results => results.filter(r => r !== null));

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
      periodo: {
        filtro: periodo,
        inicio: dataInicio,
        fim: dataFim
      },
      resumo: {
        viagensPeriodo: viagensNoPeriodo.length,
        receitaPeriodo: receitaTotal.toFixed(2),
        viagensHoje: viagensNoPeriodo.length,
        receitaHoje: receitaTotal.toFixed(2),
        motoristasAtivos: `${motoristasAtivos} / ${totalMotoristas}`,
        taxisEmServico: `${taxisEmServico} / ${totalTaxis}`
      },
      viagensEmCurso: viagensEmCursoDetalhadas,
      motoristas: motoristasComStats,
      viagensPeriodo: viagensPeriodoDetalhadas,
      viagensUltimaSemana: viagensPeriodoDetalhadas,
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