import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/MotoristaFaturaConf.css';
import AvatarDropdown from '../components/AvatarDropdown';
import '../css/global.css';

function formatDuracao(s) {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export default function MotoristaFaturaConf() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const trip = state?.trip;
  const duracao = state?.duracao ?? 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'escuro');
  const DRIVER_NAME = JSON.parse(localStorage.getItem('user_logado') || '{}').nome || 'Motorista';

  useEffect(() => {
    if (!trip) {
      navigate('/motorista', { replace: true });
    }
  }, [trip, navigate]);

  useEffect(() => {
    document.body.className = tema;
    localStorage.setItem('tema', tema);
  }, [tema]);

  const alternarTema = () => setTema(prev => prev === 'escuro' ? 'claro' : 'escuro');

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  const faturaNr = `N4R-2026`;

  const handleFinalize = () => {
    localStorage.removeItem('viagemAtivaMotorista');
    navigate('/motorista', { replace: true });
  };

  if (!trip) return null;

  const USERNAME = JSON.parse(localStorage.getItem("user_logado")).nome;

  return (
    <div className="mfc-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="mfc-overlay" />

      {/* Navbar — reutiliza classes mh- */}
      <nav className="gb-navbar">
        <span className="gb-logo" onClick={() => navigate('/motorista')} style={{ cursor: 'pointer' }}>
          Need4Rides
        </span>

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
            <AvatarDropdown profilePath="/profile" avatarClass="gb-avatar" />
            <span className="gb-profile-pill-name">{USERNAME}</span>
          </li>
          <li><a onClick={() => { navigate('/motorista'); setMenuOpen(false); }}>Dashboard</a></li>
          <li><a onClick={() => { navigate('/motorista/reabastecimento'); setMenuOpen(false); }}>Reabastecimento</a></li>
          <li><a onClick={() => { navigate('/motorista/historico'); setMenuOpen(false); }}>Histórico</a></li>
          <li><a onClick={() => { navigate('/motorista/relatorio'); setMenuOpen(false); }}>Relatório</a></li>
          <li><a onClick={() => { navigate('/motorista/suporte'); setMenuOpen(false); }}>Suporte</a></li>
          <li><a className="active" onClick={() => { navigate('/motorista/viagem'); setMenuOpen(false); }}>Viagem</a></li>
          <li>
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

      <div className="mfc-wrapper">

        {/* Thank you */}
        <div className="mfc-thanks">
          <span className="mfc-thanks-icon">🏁</span>
          <div>
            <h1 className="mfc-thanks-title">Viagem concluída!</h1>
            <p className="mfc-thanks-sub">
              Obrigado por trabalhar connosco, <strong>{DRIVER_NAME}</strong>.
              Confirme os detalhes da fatura antes de a enviar ao cliente.
            </p>
          </div>
        </div>

        {/* Invoice */}
        <div className="mfc-invoice-card">
          <div className="mfc-invoice-header">
            <div>
              <h2 className="mfc-invoice-title">Fatura</h2>
              <span className="mfc-invoice-nr">{faturaNr}</span>
            </div>
            <div className="mfc-invoice-date">
              <span>{dateStr}</span>
              <span>{timeStr}</span>
            </div>
          </div>

          <div className="mfc-divider" />
          <div className="mfc-rows">
            <div className="mfc-row"><span className="mfc-row-label">Motorista</span><span className="mfc-row-val">{DRIVER_NAME}</span></div>
            <div className="mfc-row"><span className="mfc-row-label">Cliente</span><span className="mfc-row-val">{trip.clientName}</span></div>
            <div className="mfc-row"><span className="mfc-row-label">Origem</span><span className="mfc-row-val">{trip.from?.morada}</span></div>
            <div className="mfc-row"><span className="mfc-row-label">Destino</span><span className="mfc-row-val">{trip.to?.morada}</span></div>
            <div className="mfc-row"><span className="mfc-row-label">Distância</span><span className="mfc-row-val">{trip.dist}</span></div>
            <div className="mfc-row"><span className="mfc-row-label">Duração</span><span className="mfc-row-val">{formatDuracao(duracao)}</span></div>
            <div className="mfc-row"><span className="mfc-row-label">Passageiros</span><span className="mfc-row-val">{trip.passengers}</span></div>
            <div className="mfc-row"><span className="mfc-row-label">Conforto</span><span className="mfc-row-val">{trip.conforto}</span></div>
            <div className="mfc-row"><span className="mfc-row-label">Pagamento</span><span className="mfc-row-val">Stripe</span></div>
          </div>

          <div className="mfc-divider" />

          <div className="mfc-total-row">
            <span className="mfc-total-label">Total</span>
            <span className="mfc-total-val">{trip.price}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mfc-actions">
          <button className="mfc-btn confirm" onClick={handleFinalize}>
            &nbsp; Confirmar e concluir
          </button>
          <button className="mfc-btn problem" onClick={() => navigate('/motorista/suporte')}>
            ⚠&nbsp; Reportar Problema com a Fatura
          </button>
        </div>

      </div>
    </div>
  );
}