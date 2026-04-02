import { useLocation, useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/MotoristaFaturaConf.css';
import AvatarDropdown from '../components/AvatarDropdown';

const DRIVER_NAME = 'Carlos Silva';

const DEFAULT_TRIP = {
  id: 42,
  from: 'Aeroporto de Lisboa',
  to: 'Baixa-Chiado',
  dist: '14 km',
  price: '€18.50',
  passengers: 2,
  clientName: 'João Ferreira',
};

function formatDuracao(s) {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export default function MotoristaFaturaConf() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const trip = state?.trip ?? DEFAULT_TRIP;
  const duracao = state?.duracao ?? 0;

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  const faturaNr = `N4R-2026-${String(trip.id).padStart(4, '0')}`;

  return (
    <div className="mfc-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="mfc-overlay" />

      {/* Navbar */}
      <nav className="mfc-navbar">
        <span className="mfc-logo" onClick={() => navigate('/motorista')} style={{ cursor: 'pointer' }}>Need4Rides</span>
        <ul className="mfc-nav-links">
          <li><a onClick={() => navigate('/motorista')} style={{ cursor: 'pointer' }}>Dashboard</a></li>
          <li><a onClick={() => navigate('/motorista/reabastecimento')} style={{ cursor: 'pointer' }}>Registar Reabastecimento</a></li>
          <li><a onClick={() => navigate('/motorista/historico')} style={{ cursor: 'pointer' }}>Histórico</a></li>
          <li><a onClick={() => navigate('/motorista/suporte')} style={{ cursor: 'pointer' }}>Suporte</a></li>
          <li><a onClick={() => navigate('/motorista/viagem')} style={{ cursor: 'pointer' }}>Viagem</a></li>
          <li><AvatarDropdown profilePath="/motorista/perfil" avatarClass="mfc-avatar" /></li>
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
            <div className="mfc-row">
              <span className="mfc-row-label">Motorista</span>
              <span className="mfc-row-val">{DRIVER_NAME}</span>
            </div>
            <div className="mfc-row">
              <span className="mfc-row-label">Cliente</span>
              <span className="mfc-row-val">{trip.clientName}</span>
            </div>
            <div className="mfc-row">
              <span className="mfc-row-label">Origem</span>
              <span className="mfc-row-val">{trip.from}</span>
            </div>
            <div className="mfc-row">
              <span className="mfc-row-label">Destino</span>
              <span className="mfc-row-val">{trip.to}</span>
            </div>
            <div className="mfc-row">
              <span className="mfc-row-label">Distância</span>
              <span className="mfc-row-val">{trip.dist}</span>
            </div>
            <div className="mfc-row">
              <span className="mfc-row-label">Duração</span>
              <span className="mfc-row-val">{formatDuracao(duracao)}</span>
            </div>
            <div className="mfc-row">
              <span className="mfc-row-label">Passageiros</span>
              <span className="mfc-row-val">{trip.passengers}</span>
            </div>
            <div className="mfc-row">
              <span className="mfc-row-label">Pagamento</span>
              <span className="mfc-row-val">Stripe</span>
            </div>
          </div>

          <div className="mfc-divider" />

          <div className="mfc-total-row">
            <span className="mfc-total-label">Total</span>
            <span className="mfc-total-val">{trip.price}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mfc-actions">
          <button className="mfc-btn confirm" onClick={() => navigate('/motorista')}>
            &nbsp; Confirmar e Enviar Fatura ao Cliente
          </button>
          <button className="mfc-btn problem" onClick={() => navigate('/motorista/suporte')}>
            ⚠&nbsp; Reportar Problema com a Fatura
          </button>
        </div>

      </div>
    </div>
  );
}
