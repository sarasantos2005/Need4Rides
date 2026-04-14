import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/MotoristaViagem.css';
import AvatarDropdown from '../components/AvatarDropdown';

const tripAtiva = {
  id: 42,
  from: 'Aeroporto de Lisboa',
  to: 'Baixa-Chiado',
  dist: '14 km',
  price: '€18.50',
  passengers: 2,
  clientName: 'João Ferreira',
};

function formatTime(s) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export default function MotoristaViagem() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState('pendente'); // 'pendente' | 'em_curso'
  const [segundos, setSegundos] = useState(0);
  const intervalRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  useEffect(() => () => clearInterval(intervalRef.current), []);

  function iniciarViagem() {
    setEstado('em_curso');
    intervalRef.current = setInterval(() => setSegundos(s => s + 1), 1000);
  }

  function terminarViagem() {
    clearInterval(intervalRef.current);
    navigate('/motorista/fatura-conf', { state: { trip: tripAtiva, duracao: segundos } });
  }

  return (
    <div className="mvg-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="mvg-overlay" />

      <nav className="mh-navbar">
                   <span className="mh-logo">Need4Rides</span>
                 
                   {/* BOTÃO HAMBURGUER */}
                            <div 
                              className={`mh-hamburger ${menuOpen ? 'open' : ''}`} 
                              onClick={() => setMenuOpen(!menuOpen)}
                            >
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                          
                            <ul className={`mh-nav-links ${menuOpen ? 'active' : ''}`}>
                              <li><a onClick={() => navigate('/motorista')}>Dashboard</a></li>
                          
                              <li><a onClick={() => navigate('/motorista/reabastecimento')}>Registar Reabastecimento</a></li>
                              <li><a onClick={() => navigate('/motorista/historico')}>Histórico</a></li>
                              <li><a onClick={() => navigate('/motorista/suporte')}>Suporte</a></li>
                              <li><a className="active">Viagem</a></li>
                          
                              <li>
                                <button className="mh-theme-btn" onClick={alternarTema}>
                                  {tema === 'escuro' ? '☀️ Claro' : '🌙 Escuro'}
                                </button>
                              </li>
                          
                              <li>
                                <AvatarDropdown profilePath="/motorista/perfil" avatarClass="mh-avatar" />
                              </li>
                            </ul>
                          </nav>

      <div className="mvg-wrapper">

        {/* Header */}
        <div className="mvg-header">
          <div>
            <h1 className="mvg-title">Viagem Atual</h1>
            <p className="mvg-sub">Gerir o progresso da viagem em curso</p>
          </div>
          {estado === 'em_curso' && (
            <div className="mvg-header-timer">
              <span className="mvg-header-timer-label">Tempo de viagem</span>
              <span className="mvg-header-timer-val">{formatTime(segundos)}</span>
            </div>
          )}
          <div className={`mvg-status-pill ${estado}`}>
            {estado === 'pendente' ? '○ Aguarda Início' : '● Em Viagem'}
          </div>
        </div>

        <div className="mvg-layout">

          {/* ── Left: trip info + controls ── */}
          <div className="mvg-left">

            <div className="mvg-card mvg-trip-card">
              <h3 className="mvg-card-title">Detalhes da Viagem</h3>

              <div className="mvg-route-visual">
                <div className="mvg-route-point">
                  <span className="mvg-dot origin" />
                  <div>
                    <span className="mvg-point-label">Origem</span>
                    <span className="mvg-point-name">{tripAtiva.from}</span>
                  </div>
                </div>
                <div className="mvg-route-line" />
                <div className="mvg-route-point">
                  <span className="mvg-dot dest" />
                  <div>
                    <span className="mvg-point-label">Destino</span>
                    <span className="mvg-point-name">{tripAtiva.to}</span>
                  </div>
                </div>
              </div>

              <div className="mvg-trip-meta">
                <div className="mvg-meta-item">
                  <span className="mvg-meta-label">Passageiros</span>
                  <span className="mvg-meta-val">{tripAtiva.passengers}</span>
                </div>
                <div className="mvg-meta-item">
                  <span className="mvg-meta-label">Distância</span>
                  <span className="mvg-meta-val">{tripAtiva.dist}</span>
                </div>
                <div className="mvg-meta-item">
                  <span className="mvg-meta-label">Valor estimado</span>
                  <span className="mvg-meta-val accent">{tripAtiva.price}</span>
                </div>
                <div className="mvg-meta-item">
                  <span className="mvg-meta-label">Cliente</span>
                  <span className="mvg-meta-val">{tripAtiva.clientName}</span>
                </div>
              </div>
            </div>

            {estado === 'pendente' ? (
              <button className="mvg-btn start" onClick={iniciarViagem}>
                ▶&nbsp; Iniciar Viagem
              </button>
            ) : (
              <button className="mvg-btn end" onClick={terminarViagem}>
                ■&nbsp; Terminar Viagem
              </button>
            )}

          </div>

          {/* ── Right: map placeholder ── */}
          <div className="mvg-map-wrap">
            <span className="mvg-map-label">Mapa — Lisboa</span>
            <div className="mvg-map-placeholder">
              <svg className="mvg-map-pin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#f5c518" strokeWidth="1.5" fill="none"/>
                <circle cx="12" cy="9" r="2.5" stroke="#f5c518" strokeWidth="1.5" fill="none"/>
              </svg>
              <span className="mvg-map-placeholder-title">Mapa em tempo real</span>
              <span className="mvg-map-placeholder-sub">Integração com API de mapas em breve</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
