import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/MotoristaHistorico.css';
import AvatarDropdown from '../components/AvatarDropdown';
import axios from 'axios';

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
    } catch (err) {
      console.error("Erro ao procurar dados na BD", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="mhist-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="mhist-overlay" />

      {/* Navbar */}
      <nav className="mhist-navbar">
        <span className="mhist-logo" onClick={() => navigate('/motorista')} style={{ cursor: 'pointer' }}>Need4Rides</span>
        <ul className="mhist-nav-links">
          <li><a onClick={() => navigate('/motorista')} style={{ cursor: 'pointer' }}>Dashboard</a></li>
          <li><a onClick={() => navigate('/motorista/reabastecimento')} style={{ cursor: 'pointer' }}>Registar Reabastecimento</a></li>
          <li><a className="active">Histórico</a></li>
          <li><a onClick={() => navigate('/motorista/suporte')} style={{ cursor: 'pointer' }}>Suporte</a></li>
          <li><a onClick={() => navigate('/motorista/viagem')} style={{ cursor: 'pointer' }}>Viagem</a></li>
          <li><AvatarDropdown profilePath="/motorista/perfil" avatarClass="mhist-avatar" /></li>
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
            <span className="mhist-stat-value">€{totalGanhos}</span>
          </div>
          <div className="mhist-stat">
            <span className="mhist-stat-label">Km Totais</span>
            <span className="mhist-stat-value">{totalKm} km</span>
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
                <div className="mhist-route">
                  <span className="mhist-from">{v.morada_inicial_viagem.morada}</span>
                  <span className="mhist-arrow">→</span>
                  <span className="mhist-to">{v.morada_final_viagem.morada}</span>
                </div>
                <div className="mhist-meta">
                  <span className="mhist-date">{formatarDataHora(v.hora_inicial_viagem).data} às {formatarDataHora(v.hora_inicial_viagem).hora}</span>
                  <span className="mhist-detail">{v.km_percorridos} km</span>
                  <span className="mhist-detail">{v.n_passageiros} pax</span>
                  <span className="mhist-detail">{(new Date(v.hora_final_viagem) - new Date(v.hora_inicial_viagem)) / (1000 * 60)} min</span>
                  <span className="mhist-status-badge">Concluída</span>
                  <span className="mhist-price">{v.preco_viagem?.toFixed(2)}€</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
