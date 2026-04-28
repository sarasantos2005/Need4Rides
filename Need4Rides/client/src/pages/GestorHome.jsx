import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import heroBg from '../assets/images/LA.jpg';
import ddImg from '../assets/images/fennec.jpg';
import '../css/MotoristaHome.css';
import AvatarDropdown from '../components/AvatarDropdown';

export default function GestorHome() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userData, setUserData] = useState({ nome: 'Utilizador' });
  const [relatoriosData, setRelatoriosData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('hoje');
  const [exporting, setExporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user_logado');
    const token = localStorage.getItem('token');

    if (!token || !storedUser) {
      navigate('/login');
    } else {
      setUserData(JSON.parse(storedUser));
      fetchRelatorios();
    }
  }, [navigate, periodo]);

  const periodoOptions = [
    { value: 'hoje', label: 'Hoje' },
    { value: 'semana', label: '1 Semana' },
    { value: 'mes', label: '1 Mês' },
    { value: 'ano', label: '1 Ano' }

  ];

  const currentLabel = periodoOptions.find(opt => opt.value === periodo)?.label || 'Hoje';

  const fetchRelatorios = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/relatorios/taxis-motoristas?periodo=${periodo}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRelatoriosData(data);
      } else {
        console.error('Erro ao buscar relatórios');
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    } finally {
      setLoading(false);
    }
  };

  const [tema, setTema] = useState(() => {
    return localStorage.getItem('tema') || 'escuro';
  });

  useEffect(() => {
    document.body.className = tema;
    localStorage.setItem('tema', tema);
  }, [tema]);

  const alternarTema = () => {
    setTema(prev => (prev === 'escuro' ? 'claro' : 'escuro'));
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user_logado');
    const token = localStorage.getItem('token');

    if (!token || !storedUser) {
      navigate('/login');
    } else {
      setUserData(JSON.parse(storedUser));
      fetchRelatorios();
    }
  }, [navigate, periodo]);


  const openTripDetails = (trip) => {
    navigate('/gestor/viagem', { state: { trip } });
  };

  const exportarPDF = () => {
    try {
      setExporting(true);
      if (!relatoriosData) {
        throw new Error('Dados do relatório não disponíveis');
      }

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const margin = 40;
      const lineHeight = 18;
      let y = margin;

      doc.setFontSize(18);
      doc.text('Relatório Need4Rides', margin, y);
      y += lineHeight * 1.5;

      doc.setFontSize(11);
      doc.text(`Período: ${currentLabel}`, margin, y);
      y += lineHeight;
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-PT')}`, margin, y);
      y += lineHeight * 2;

      doc.setFontSize(12);
      doc.text('Resumo', margin, y);
      y += lineHeight;

      const resumo = relatoriosData.resumo;
      const resumoItens = [
        { label: 'Viagens', value: resumo.viagensHoje },
        { label: 'Receita', value: `€${resumo.receitaHoje}` },
        { label: 'Motoristas ativos', value: resumo.motoristasAtivos },
        { label: 'Táxis em serviço', value: resumo.taxisEmServico }
      ];

      resumoItens.forEach(item => {
        doc.text(`${item.label}: ${item.value}`, margin, y);
        y += lineHeight;
      });

      y += lineHeight;
      doc.text('Viagens em Curso', margin, y);
      y += lineHeight;

      if (relatoriosData.viagensEmCurso.length > 0) {
        relatoriosData.viagensEmCurso.forEach((v, index) => {
          if (y > 750) {
            doc.addPage();
            y = margin;
          }
          doc.text(`${index + 1}. ${v.cliente} → ${v.motorista}`, margin, y);
          y += lineHeight;
          doc.text(`Origem: ${v.origem}`, margin + 10, y);
          y += lineHeight;
          doc.text(`Destino: ${v.destino}`, margin + 10, y);
          y += lineHeight;
          doc.text(`Status: ${v.status}`, margin + 10, y);
          y += lineHeight;
        });
      } else {
        doc.text('Nenhuma viagem em curso', margin, y);
        y += lineHeight;
      }

      y += lineHeight;
      doc.text('Motoristas', margin, y);
      y += lineHeight;

      if (relatoriosData.motoristas.length > 0) {
        relatoriosData.motoristas.slice(0, 20).forEach((m, index) => {
          if (y > 750) {
            doc.addPage();
            y = margin;
          }
          doc.text(`${index + 1}. ${m.nome} — ${m.estado} — ${m.viagens} viagens — €${m.ganhos}`, margin, y);
          y += lineHeight;
        });
      } else {
        doc.text('Nenhum motorista encontrado', margin, y);
        y += lineHeight;
      }

      y += lineHeight;
      doc.text(`Viagens do Período (${currentLabel})`, margin, y);
      y += lineHeight;

      if (relatoriosData.viagensUltimaSemana.length > 0) {
        relatoriosData.viagensUltimaSemana.slice(0, 20).forEach((v, index) => {
          if (y > 750) {
            doc.addPage();
            y = margin;
          }
          doc.text(`${index + 1}. ${v.cliente} → ${v.motorista}`, margin, y);
          y += lineHeight;
          doc.text(`Rota: ${v.origem} → ${v.destino}`, margin + 10, y);
          y += lineHeight;
          doc.text(`Data/Hora: ${v.data} às ${v.hora}`, margin + 10, y);
          y += lineHeight;
          doc.text(`Preço: €${v.preco}`, margin + 10, y);
          y += lineHeight;
        });
      } else {
        doc.text('Nenhuma viagem na última semana', margin, y);
        y += lineHeight;
      }

      doc.save(`relatorio-${periodo}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Erro na exportação:', error);
      alert('Falha ao gerar o PDF. Verifica a consola do navegador.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="mh-page" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="mh-overlay" />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>
          Carregando relatórios...
        </div>
      </div>
    );
  }

  

  return (
    <div className="mh-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="mh-overlay" />

      {/* NAVBAR  */}
      <nav className="mh-navbar">
        <span className="mh-logo">Need4Rides</span>

        <div
          className={`mh-hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        <ul className={`mh-nav-links ${menuOpen ? 'active' : ''}`}>
          <li>
            <a className="active" onClick={() => navigate('/gestor')}>Dashboard</a>
          </li>

          <li>
            <a onClick={() => navigate('/gestor/motoristas')}>Motoristas</a>
          </li>

          <li>
            <a onClick={() => navigate('/gestor/taxis')}>Táxis</a>
          </li>

          <li>
            <a onClick={() => navigate('/gestor/registar-motorista')}>Registar Motorista</a>
          </li>

          <li>
            <button className="mh-theme-btn" onClick={alternarTema}>
              {tema === 'escuro' ? '☀️ Claro' : '🌙 Escuro'}
            </button>
          </li>
          <li>
            <AvatarDropdown profilePath="/gestor/perfil" avatarClass="mh-avatar" />
          </li>
        </ul>
      </nav>

      <div className="mh-wrapper">

        {/* WELCOME */}
        <div className="mh-welcome">
          <div className="mh-welcome-left">
            <div className="mh-welcome-avatar-ring">
              <img src={ddImg} alt="Gestor" />
            </div>

            <div>
              <p className="mh-welcome-sub">Bem-vindo de volta,</p>
              <h1 className="mh-welcome-name">
                {userData.nome.split(' ')[0]}
              </h1>

              <span className="mh-status-badge online">
                ● Gestor
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* FILTROS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '12px', color: '#ddd', textTransform: 'uppercase' }}>Período</label>
              <div className="custom-dropdown">
                <div
                  onClick={() => setIsOpen(!isOpen)}
                  className="custom-dropdown-button"
                >
                  {currentLabel}
                  <span style={{ marginLeft: '8px' }}>▼</span>
                </div>
                {isOpen && (
                  <div className="custom-dropdown-menu">
                    {periodoOptions.map(option => (
                      <div
                        key={option.value}
                        onClick={() => {
                          setPeriodo(option.value);
                          setIsOpen(false);
                        }}
                        className="custom-dropdown-option"
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* BOTÃO EXPORTAR PDF */}
            <button
              onClick={exportarPDF}
              disabled={exporting}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: exporting ? '#666' : 'linear-gradient(135deg, #f5a623, #f5c518)',
                color: '#111',
                fontSize: '14px',
                fontWeight: '600',
                cursor: exporting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {exporting ? '📄 Exportando...' : '📄 Exportar PDF'}
            </button>

            <button
              className="mh-turno-btn end"
              onClick={() => navigate('/login')}
            >
              Terminar Sessão
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="mh-stats-row">
          <div className="mh-stat-card">
            <span className="mh-stat-label">Viagens no período</span>
            <span className="mh-stat-value">{relatoriosData?.resumo?.viagensHoje || 0}</span>
          </div>

          <div className="mh-stat-card accent">
            <span className="mh-stat-label">Receita no período</span>
            <span className="mh-stat-value">€{relatoriosData?.resumo?.receitaHoje || '0.00'}</span>
          </div>

          <div className="mh-stat-card">
            <span className="mh-stat-label">Motoristas ativos</span>
            <span className="mh-stat-value">{relatoriosData?.resumo?.motoristasAtivos || '0 / 0'}</span>
          </div>

          <div className="mh-stat-card">
            <span className="mh-stat-label">Táxis em serviço</span>
            <span className="mh-stat-value">{relatoriosData?.resumo?.taxisEmServico || '0 / 0'}</span>
          </div>
        </div>

        {/* CONTEÚDO */}
        <div className="mh-middle-row">

          {/* VIAGENS */}
          <div className="mh-card">
            <div className="mh-section-header">
              <h3 className="mh-card-title">Viagens em Curso</h3>
              <span className="mh-badge">{relatoriosData?.viagensEmCurso?.length || 0}</span>
            </div>

            <div>
              {relatoriosData?.viagensEmCurso?.length > 0 ? (
                relatoriosData.viagensEmCurso.map(v => (
                  <div
                    className="mh-pedido-card"
                    key={v.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => openTripDetails(v)}
                  >
                    <div className="mh-pedido-route">
                      <span className="mh-dot origin" />
                      <span>{v.origem}</span>
                      <span className="mh-dot dest" />
                      <span>{v.destino}</span>
                    </div>

                    <div className="mh-pedido-meta">
                      <span>{v.cliente}</span>
                      <span>·</span>
                      <span>{v.motorista}</span>
                    </div>

                    <span className="mh-status-badge online">
                      {v.status}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                  Nenhuma viagem em curso
                </div>
              )}
            </div>
          </div>

          {/* MOTORISTAS */}
          <div className="mh-card">
            <div className="mh-section-header">
              <h3 className="mh-card-title">Motoristas</h3>
            </div>

            <div>
              {relatoriosData?.motoristas?.length > 0 ? (
                relatoriosData.motoristas.map(m => (
                  <div className="mh-hist-row" key={m.id}>
                    <div>
                      <div className="mh-car-value">{m.nome}</div>
                      <div className="mh-car-label">
                        {m.estado}
                      </div>
                    </div>

                    <div className="mh-hist-meta">
                      <span>{m.viagens} viagens</span>
                      <span className="mh-hist-price">€{m.ganhos}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                  Nenhum motorista encontrado
                </div>
              )}
            </div>
          </div>

        </div>

        {/* VIAGENS ÚLTIMA SEMANA */}
        <div className="mh-middle-row">
          <div className="mh-card full-width">
            <div className="mh-section-header">
              <h3 className="mh-card-title">Viagens do Período ({currentLabel})</h3>
              <span className="mh-badge">{relatoriosData?.viagensUltimaSemana?.length || 0}</span>
            </div>

            <div>
              {relatoriosData?.viagensUltimaSemana?.length > 0 ? (
                relatoriosData.viagensUltimaSemana.map(v => (
                  <div
                    className="mh-hist-row"
                    key={v.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => openTripDetails(v)}
                  >
                    <div>
                      <div className="mh-car-value">{v.cliente} → {v.motorista}</div>
                      <div className="mh-car-label">
                        {v.origem} → {v.destino}
                      </div>
                    </div>

                    <div className="mh-hist-meta">
                      <span>{v.data} às {v.hora}</span>
                      <span className="mh-hist-price">€{v.preco}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                  Nenhuma viagem na última semana
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}