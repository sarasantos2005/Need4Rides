import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/AguardarTaxi.css';
import AvatarDropdown from '../components/AvatarDropdown';

const DOTS = ['A procurar motoristas', 'A procurar motoristas.', 'A procurar motoristas..', 'A procurar motoristas...'];

export default function AguardarTaxi() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const form = state?.form ?? { origin: 'Ponto de Partida', destination: 'Destino', passengers: 1 };
  const estimate = state?.estimate ?? { km: '--', price: '--', wait: '--' };

  const [dotIdx, setDotIdx] = useState(0);
  const [found, setFound] = useState(false);
  const [seconds, setSeconds] = useState(0);

  /* animação do texto */
  useEffect(() => {
    const t = setInterval(() => setDotIdx(i => (i + 1) % DOTS.length), 500);
    return () => clearInterval(t);
  }, []);

  /* contador de tempo */
  useEffect(() => {
    if (found) return;
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [found]);

  /* simula motorista encontrado após 8s */
  useEffect(() => {
    const t = setTimeout(() => setFound(true), 8000);
    return () => clearTimeout(t);
  }, []);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="agt-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="agt-overlay" />

      {/* Navbar */}
      <nav className="agt-navbar">
        <span className="agt-logo" onClick={() => navigate('/home')}>Need4Rides</span>
        <ul className="agt-nav-links">
          <li><a onClick={() => navigate('/home')}>Home</a></li>
          <li><a onClick={() => navigate('/pedir-taxi')}>Pedir Táxi</a></li>
          <li><AvatarDropdown profilePath="/profile" avatarClass="agt-avatar" /></li>
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
              <p>Tempo de espera estimado: <strong>{estimate.wait} min</strong></p>
              <span className="agt-timer">{fmt(seconds)}</span>
            </div>
          ) : (
            <div className="agt-found">
              <div className="agt-found-icon">✓</div>
              <h2>Motorista Encontrado!</h2>
              <p>O teu táxi está a caminho</p>
              <button className="agt-btn-primary" onClick={() => navigate('/viagem', { state: { form, estimate } })}>
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
                <span className="agt-meta-label">Conforto</span>
                <span className="agt-meta-value">
                  {form.comfort === 'luxury' ? 'Luxuoso' : form.comfort === 'basic' ? 'Básico' : '--'}
                </span>
              </div>
              <div className="agt-meta-item">
                <span className="agt-meta-label">Distância</span>
                <span className="agt-meta-value">{estimate.km} km</span>
              </div>
              <div className="agt-meta-item">
                <span className="agt-meta-label">Preço Est.</span>
                <span className="agt-meta-value highlight">€{estimate.price}</span>
              </div>
              <div className="agt-meta-item">
                <span className="agt-meta-label">Espera Est.</span>
                <span className="agt-meta-value">{estimate.wait} min</span>
              </div>
            </div>

            <button className="agt-btn-cancel" onClick={() => navigate('/pedir-taxi')}>
              Cancelar Viagem
            </button>
          </div>

          {/* Mapa placeholder */}
          <div className="agt-map-placeholder">
            <div className="agt-map-inner">
              <div className="agt-map-icon">
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
