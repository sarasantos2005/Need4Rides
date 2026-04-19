import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/AguardarTaxi.css';
import ddImg from '../assets/images/fennec.jpg';
import AvatarDropdown from '../components/AvatarDropdown';
const DOTS = [
  'A procurar motoristas',
  'A procurar motoristas.',
  'A procurar motoristas..',
  'A procurar motoristas...'
];

export default function AguardarTaxi() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const form = state?.form ?? {
    origin: 'Ponto de Partida',
    destination: 'Destino',
    passengers: 1
  };

  const estimate = state?.estimate ?? {
    km: '--',
    price: '--',
    wait: '--'
  };

  const [dotIdx, setDotIdx] = useState(0);
  const [found, setFound] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [userData, setUserData] = useState(null);

  const [tema, setTema] = useState(() => {
    return localStorage.getItem('tema') || 'escuro';
  });

  useEffect(() => {
    document.body.className = tema;
  }, [tema]);
  const [menuOpen, setMenuOpen] = useState(false);
  const alternarTema = () => {
    setTema(prev => (prev === 'escuro' ? 'claro' : 'escuro'));
  };

  /* buscar user */
  useEffect(() => {
    const storedUser = localStorage.getItem('user_logado');
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }
  }, []);

  /* animação dots */
  useEffect(() => {
    const t = setInterval(() => setDotIdx(i => (i + 1) % DOTS.length), 500);
    return () => clearInterval(t);
  }, []);

  /* timer */
  useEffect(() => {
    if (found) return;
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [found]);

  /* simulação */
  useEffect(() => {
    const t = setTimeout(() => setFound(true), 8000);
    return () => clearTimeout(t);
  }, []);

  const fmt = s =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="agt-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="agt-overlay" />

      <nav className="agt-navbar">
        <span className="agt-logo" onClick={() => navigate('/home')}>
          Need4Rides
        </span>

        {/* HAMBURGER */}
        <div 
          className={`agt-hamburger ${menuOpen ? 'open' : ''}`} 
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* LINKS */}
        <ul className={`agt-nav-links ${menuOpen ? 'active' : ''}`}>
          <li><a onClick={() => navigate('/home')}>Home</a></li>
          <li><a onClick={() => navigate('/pedir-taxi')}>Pedir Táxi</a></li>

          <li>
            <button className="agt-theme-btn" onClick={alternarTema}>
              {tema === 'escuro' ? '☀️ Claro' : '🌙 Escuro'}
            </button>
          </li>

          <li>
            <AvatarDropdown profilePath="/profile" avatarClass="agt-avatar" />
          </li>
        </ul>
      </nav>

      <div className="agt-wrapper">

        {/* Status */}
        <div className="agt-status-card">
          {!found ? (
            <div className="agt-searching">
              <div className="agt-spinner-ring">
                <div className="agt-spinner" />
                <div className="agt-spinner-icon">🚖</div>
              </div>

              <h2>{DOTS[dotIdx]}</h2>
              <p>
                Tempo de espera estimado: <strong>{estimate.wait} min</strong>
              </p>
              <span className="agt-timer">{fmt(seconds)}</span>
            </div>
          ) : (
            <div className="agt-found">
              <div className="agt-found-icon">✓</div>
              <h2>Motorista Encontrado!</h2>
              <p>O teu táxi está a caminho</p>

              <button
                className="agt-btn-primary"
                onClick={() =>
                  navigate('/viagem', { state: { form, estimate } })
                }
              >
                Ver Viagem
              </button>
            </div>
          )}
        </div>

        <div className="agt-bottom">

          {/* Detalhes */}
          <div className="agt-details-card">
            <h3>Detalhes da Viagem</h3>

            <div className="agt-route">
              <div className="agt-point">
                <span className="agt-dot origin" />
                <div>
                  <span className="agt-point-label">Origem</span>
                  <span className="agt-point-value">{form.origin}</span>
                </div>
              </div>

              <div className="agt-route-line" />

              <div className="agt-point">
                <span className="agt-dot dest" />
                <div>
                  <span className="agt-point-label">Destino</span>
                  <span className="agt-point-value">{form.destination}</span>
                </div>
              </div>
            </div>

            <div className="agt-divider" />

            <div className="agt-meta-grid">
              <div className="agt-meta-item">
                <span className="agt-meta-label">Passageiros</span>
                <span className="agt-meta-value">{form.passengers}</span>
              </div>

              <div className="agt-meta-item">
                <span className="agt-meta-label">Distância</span>
                <span className="agt-meta-value">{estimate.km} km</span>
              </div>

              <div className="agt-meta-item">
                <span className="agt-meta-label">Preço Est.</span>
                <span className="agt-meta-value highlight">
                  €{estimate.price}
                </span>
              </div>

              <div className="agt-meta-item">
                <span className="agt-meta-label">Espera</span>
                <span className="agt-meta-value">{estimate.wait} min</span>
              </div>
            </div>

            <button
              className="agt-btn-cancel"
              onClick={() => navigate('/pedir-taxi')}
            >
              Cancelar Viagem
            </button>
          </div>

          {/* Mapa */}
          <div className="agt-map-placeholder">
            <div className="agt-map-inner">
              <span>Mapa em tempo real</span>
              <p>Integração em breve</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}