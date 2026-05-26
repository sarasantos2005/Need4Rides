import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/MotoristaHistorico.css';
import AvatarDropdown from '../components/AvatarDropdown';
import Loading from '../components/Loading';
import useMinLoading from '../hooks/useMinLoading';
import axios from 'axios';
import '../css/global.css';
import { toastSucesso, toastErro, toastAviso, toastInfo, confirmar } from '../components/toast';

const formatarDataHora = (isoString) => {
  if (!isoString) return { data: '---', hora: '---' };
  const d = new Date(isoString);
  return {
    data: d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }),
    hora: d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  };
};

export default function MotoristaHistorico() {
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState('todas');
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState({
    historico: false
  });

  /*Tema */
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
        const user = JSON.parse(storedUser);
        setUserData(user);
  
        const userId = user._id || user.id; 
        if (userId && token) {
          fetchDadosIniciais(token);
        }
      }
    }, [navigate]);

    const fetchDadosIniciais = async (token) => {
    if (!token) {
      console.error("Token ausente em fetchDadosIniciais");
      return;
    }
    try {
      setLoading(true);
      
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
     const resHistorico = await axios.get(`http://localhost:3000/api/viagem/motorista`, config);

      setHistorico(resHistorico.data);
      setApiStatus({historico: true});
    } catch (err) {
      console.error("Erro ao procurar dados na BD", err.response?.data || err.message);
      setApiStatus({historico: true});
    } 
  };

  const gerarFatura = async(viagemId) => {
    try {
      const token = localStorage.getItem('token');

      try {
          setLoading(true);

          await axios.post(`http://localhost:3000/api/fatura/emitir`, 
            { viagemId: viagemId },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          toastSucesso("Fatura gerada com sucesso");
          fetchDadosIniciais(token);
        } catch (err) {
          toastErro("Erro ao gerar fatura no servidor.");
        } finally {
          setLoading(false);
        }
    } catch (err) {
      toastErro("Erro ao gerar fatura.");
    }
  }

  const viagensFiltradas = historico.filter(v => {
    if (filtro === 'todas') return true;
    const dataViagem = new Date(v.hora_inicial_viagem).toLocaleDateString('pt-PT', { 
      day: '2-digit', month: 'short', year: 'numeric' 
    });
    return dataViagem.includes(filtro); 
  });

  //Estatisticas

  const totalGanhos = historico.reduce((acc, v) => acc + (v.preco_viagem || 0), 0);

  const totalKm = historico.reduce((acc, v) => acc + (v.km_percorridos || 0), 0);

  const datasUnicas = [...new Set(historico.map(v => 
    formatarDataHora(v.hora_inicial_viagem).data
  ))];

  const filtroDatas = ["todas", ...new Set(datasUnicas)];
  const USERNAME = JSON.parse(localStorage.getItem("user_logado")).nome;

  return (
    <>
    {loading && (
      <Loading 
        tasks={Object.values(apiStatus)} 
        onFinished={() => setLoading(false)} 
      />
    )}
    <div className="mhist-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="mhist-overlay" />

     <nav className="gb-navbar">
        
        <span className="gb-logo">Need4Rides</span>

        {/* BOTÃO HAMBURGUER */}
        <div 
          className={`gb-hamburger ${menuOpen ? 'open' : ''}`} 
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        <ul className={`gb-nav-links ${menuOpen ? 'active' : ''}`}>
          <li className="gb-profile-li avatarHamburguer">
            <AvatarDropdown profilePath="/motorista/perfil" avatarClass="gb-avatar" />
            <span className="gb-profile-pill-name">{USERNAME}</span>
          </li>

          <li><a onClick={() => navigate('/motorista')}>Dashboard</a></li>

          <li><a onClick={() => navigate('/motorista/reabastecimento')}>Reabastecimento</a></li>
          <li><a className="active">Histórico</a></li>
          <li><a onClick={() => navigate('/motorista/relatorio')}>Relatório</a></li>
          <li><a onClick={() => navigate('/motorista/suporte')}>Suporte</a></li>
          <li><a onClick={() => navigate('/motorista/viagem')}>Viagem</a></li>

          <li className="gb-theme-li-hamburger">
            <button className="gb-theme-btn" onClick={alternarTema}>
              {tema === 'escuro' ? '☀️ Claro' : '🌙 Escuro'}
            </button>
          </li>

          <li className="gb-profile-li avatarNormal">
            <div className="gb-profile-pill">
              <span className="gb-profile-pill-name">{USERNAME}</span>
              <AvatarDropdown profilePath="/motorista/perfil" avatarClass="gb-avatar" />
            </div>
          </li>
        </ul>
      </nav>

      <div className="mhist-wrapper">

        {/* Header */}
        <div className="mhist-header">
          <div>
            <h1 className="mhist-title">Histórico de Viagens</h1>
            <p className="mhist-sub">Todas as tuas viagens concluídas</p>
          </div>
          <button className="mhist-back-btn" onClick={() => navigate('/motorista')}>← Voltar</button>
        </div>

        {/* Stats */}
        <div className="mhist-stats">
          <div className="mhist-stat">
            <span className="mhist-stat-label">Total de Viagens</span>
            <span className="mhist-stat-value">{historico.length}</span>
          </div>
          <div className="mhist-stat accent">
            <span className="mhist-stat-label">Total Ganho</span>
            <span className="mhist-stat-value">€{totalGanhos.toFixed(2)}</span>
          </div>
          <div className="mhist-stat">
            <span className="mhist-stat-label">Km Totais</span>
            <span className="mhist-stat-value">{totalKm.toFixed(1)} km</span>
          </div>
          <div className="mhist-stat">
            <span className="mhist-stat-label">Média por Viagem</span>
            <span className="mhist-stat-value">{(totalGanhos / historico.length).toFixed(2)}€</span>
          </div>
        </div>

        {/* Filtros */}
        <div className="mhist-filters">
          {filtroDatas.map(f => (
            <button
              key={f}
              className={`mhist-filter-btn ${filtro === f ? 'active' : ''}`}
              onClick={() => setFiltro(f)}
            >
              {f === 'todas' ? 'Todas' : f}
            </button>
          ))}
        </div>

        {/* Tabela */}
        <div className="mhist-card">
          <div className="mhist-list">
            {viagensFiltradas.map(v => (
              <div className="mhist-row" key={v.id}>
                <div className="mh-pedido-route">
                  <div className="mh-pedido-point">
                    <span className="mh-dot origin" />
                    <span>{v.morada_inicial_viagem?.morada}</span>
                  </div>
                  <div className="mh-pedido-line" />
                  <div className="mh-pedido-point">
                    <span className="mh-dot dest" />
                    <span>{v.morada_final_viagem?.morada}</span>
                  </div>
                </div>
                <div className="mhist-meta">
                  <span className="mhist-date">{formatarDataHora(v.hora_inicial_viagem).data} às {formatarDataHora(v.hora_inicial_viagem).hora}</span>
                  <span className="mhist-detail">{v.km_percorridos} km</span>
                  <span className="mhist-detail">{v.n_passageiros} pax</span>
                  <span className="mhist-detail">{Math.max(1, Math.round((new Date(v.hora_final_viagem) - new Date(v.hora_inicial_viagem)) / (1000 * 60)))} min</span>
                  {v.temFatura ? (
                    <span className="mh-hist-status">Concluída</span>
                    ) : (
                      <button
                        className="trip-invoice-btn"
                        onClick={() => gerarFatura(v._id)}
                      >
                        Gerar Fatura
                      </button>
                    )}
                  <span className="mhist-price">{v.preco_viagem?.toFixed(2)}€</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
    </>
  );
}
