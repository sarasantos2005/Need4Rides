import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import ddImg from '../assets/images/fennec.jpg';
import '../css/Viagem.css';
import AvatarDropdown from '../components/AvatarDropdown';

const STAGES = ['A aguardar motorista', 'Motorista a caminho', 'Em viagem', 'Concluída'];

export default function Viagem() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [stage, setStage] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'escuro');

  useEffect(() => {
    document.body.className = tema;
    localStorage.setItem('tema', tema);
  }, [tema]);

  const alternarTema = () => setTema(prev => prev === 'escuro' ? 'claro' : 'escuro');

  const form = state?.form ?? {};
  const estimate = state?.estimate ?? {};
  const comfort = form.comfort === 'luxury' ? 'Luxuoso' : form.comfort === 'basic' ? 'Básico' : '--';

  const trip = {
    from: form.origin || 'Aeroporto de Lisboa',
    to: form.destination || 'Baixa-Chiado',
    eta: estimate.wait ?? 12,
    driver: { name: 'Carlos Silva', rating: 4.8, plate: '00-AA-00', car: 'Toyota Corolla' },
  };

  return (
    <div className="viagem-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="viagem-overlay" />

      {/* Navbar */}
      <nav className="viagem-navbar">
        <span className="viagem-logo" onClick={() => navigate('/home')}>Need4Rides</span>

        <div
          className={`viagem-hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        <ul className={`viagem-nav-links ${menuOpen ? 'active' : ''}`}>
          <li><a onClick={() => { navigate('/home'); setMenuOpen(false); }}>Home</a></li>
          <li><a onClick={() => { navigate('/services'); setMenuOpen(false); }}>Serviços</a></li>
          <li><a onClick={() => { navigate('/pedir-taxi'); setMenuOpen(false); }}>Pedir Táxi</a></li>
          <li><a className="active">Viagem</a></li>
          <li>
            <button className="viagem-theme-btn" onClick={alternarTema}>
              {tema === 'escuro' ? '☀️ Claro' : '🌙 Escuro'}
            </button>
          </li>
          <li><AvatarDropdown profilePath="/profile" avatarClass="viagem-avatar" /></li>
        </ul>
      </nav>

      <div className="viagem-wrapper">

        {/* Estado — progress bar */}
        <div className="viagem-status-card">
          <div className="viagem-status-header">
            <span className="viagem-status-label">Estado da Viagem</span>
            <span className={`viagem-status-badge ${stage === 3 ? 'done' : 'active'}`}>
              {STAGES[stage]}
            </span>
          </div>

          <div className="viagem-progress">
            {STAGES.map((s, i) => (
              <div key={i} className="viagem-step">
                <div className={`viagem-step-dot ${i <= stage ? 'filled' : ''}`}>
                  {i < stage && <span>✓</span>}
                  {i === stage && <span className="viagem-pulse" />}
                </div>
                <span className={`viagem-step-label ${i === stage ? 'current' : ''}`}>{s}</span>
                {i < STAGES.length - 1 && (
                  <div className={`viagem-step-line ${i < stage ? 'filled' : ''}`} />
                )}
              </div>
            ))}
          </div>

          {/* Dev helper — remover em produção */}
          <div className="viagem-stage-btns">
            {STAGES.map((_, i) => (
              <button key={i} className={`viagem-stage-btn ${stage === i ? 'active' : ''}`} onClick={() => setStage(i)}>
                Etapa {i + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="viagem-bottom">

          {/* Info viagem + motorista */}
          <div className="viagem-left">

            {/* Rota + ETA */}
            <div className="viagem-info-card">
              <div className="viagem-route">
                <div className="viagem-point">
                  <span className="viagem-dot origin" />
                  <div>
                    <span className="viagem-point-label">Origem</span>
                    <span className="viagem-point-value">{trip.from}</span>
                  </div>
                </div>
                <div className="viagem-route-line" />
                <div className="viagem-point">
                  <span className="viagem-dot dest" />
                  <div>
                    <span className="viagem-point-label">Destino</span>
                    <span className="viagem-point-value">{trip.to}</span>
                  </div>
                </div>
              </div>

              <div className="viagem-eta-box">
                <span className="viagem-eta-label">Tempo estimado</span>
                <span className="viagem-eta-value">{trip.eta} min</span>
              </div>

              <div className="viagem-eta-box">
                <span className="viagem-eta-label">Nível de Conforto</span>
                <span className="viagem-eta-value">{comfort}</span>
              </div>
            </div>

            {/* Motorista */}
            <div className="viagem-driver-card">
              <div className="viagem-driver-avatar-ring">
                <img src={ddImg} alt="Cliente" />
              </div>
              <div className="viagem-driver-info">
                <span className="viagem-driver-name">{trip.driver.name}</span>
                <span className="viagem-driver-sub">{trip.driver.car} · {trip.driver.plate}</span>
                <div className="viagem-driver-rating">
                  {'★'.repeat(Math.floor(trip.driver.rating))}
                  <span>{trip.driver.rating}</span>
                </div>
              </div>
              <button className="viagem-call-btn">Contactar</button>
            </div>

          </div>

          {/* Mapa placeholder */}
          <div className="viagem-map-placeholder">
            <div className="viagem-map-inner">
              <div className="viagem-map-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  <circle cx="12" cy="9" r="2.5"/>
                </svg>
              </div>
              <span>Mapa em tempo real</span>
              <p>Integração com API de mapas em breve</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
