import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import ddImg from '../assets/images/fennec.jpg';
import '../css/MotoristaHome.css';
import AvatarDropdown from '../components/AvatarDropdown';

const mockPendentes = [
  { id: 1, from: 'Aeroporto de Lisboa', to: 'Baixa-Chiado', dist: '14 km', price: '€18.50', passengers: 2, wait: '3 min' },
  { id: 2, from: 'Parque das Nações', to: 'Benfica', dist: '9 km', price: '€12.80', passengers: 1, wait: '6 min' },
  { id: 3, from: 'Cascais', to: 'Sintra', dist: '22 km', price: '€31.00', passengers: 4, wait: '11 min' },
];

const mockHistorico = [
  { id: 1, from: 'Oriente', to: 'Alfama', date: '31 Mar 2026', time: '09:42', price: '€09.20', status: 'Concluída' },
  { id: 2, from: 'Saldanha', to: 'Aeroporto', date: '31 Mar 2026', time: '08:15', price: '€22.00', status: 'Concluída' },
  { id: 3, from: 'Belém', to: 'Marquês de Pombal', date: '30 Mar 2026', time: '17:30', price: '€14.60', status: 'Concluída' },
  { id: 4, from: 'Campo Grande', to: 'Cascais', date: '30 Mar 2026', time: '14:05', price: '€38.90', status: 'Concluída' },
];

const TURNO_INICIO = 8 * 60;   // 08:00 em minutos
const TURNO_FIM   = 16 * 60;  // 16:00 em minutos
const TURNO_TOTAL = TURNO_FIM - TURNO_INICIO;

function minutosAgora() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function formatHora(minutos) {
  const h = String(Math.floor(minutos / 60)).padStart(2, '0');
  const m = String(minutos % 60).padStart(2, '0');
  return `${h}:${m}`;
}

export default function MotoristaHome() {
  const navigate = useNavigate();
  const [emTurno, setEmTurno] = useState(true);
  const [agora, setAgora] = useState(minutosAgora());
  const [taxi, setTaxi] = useState(() => {
    const saved = localStorage.getItem('motoristataxi');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const onStorage = () => {
      const saved = localStorage.getItem('motoristataxi');
      setTaxi(saved ? JSON.parse(saved) : null);
    };
    window.addEventListener('storage', onStorage);
    // também verifica ao montar (caso voltemos de outra página)
    onStorage();
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setAgora(minutosAgora()), 60000);
    return () => clearInterval(t);
  }, []);

  const minutosRestantes = Math.max(0, TURNO_FIM - agora);
  const progresso = Math.min(100, Math.max(0, ((agora - TURNO_INICIO) / TURNO_TOTAL) * 100));

  return (
    <div className="mh-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="mh-overlay" />

      {/* Navbar */}
      <nav className="mh-navbar">
        <span className="mh-logo">Need4Rides</span>
        <ul className="mh-nav-links">
          <li><a className="active">Dashboard</a></li>
          <li><a onClick={() => navigate('/motorista/reabastecimento')} style={{ cursor: 'pointer' }}>Registar Reabastecimento</a></li>
          <li><a onClick={() => navigate('/motorista/historico')} style={{ cursor: 'pointer' }}>Histórico</a></li>
          <li><a onClick={() => navigate('/motorista/suporte')} style={{ cursor: 'pointer' }}>Suporte</a></li>
          <li><a onClick={() => navigate('/motorista/viagem')} style={{ cursor: 'pointer' }}>Viagem</a></li>
          <li>
            <AvatarDropdown profilePath="/motorista/perfil" avatarClass="mh-avatar" />
          </li>
        </ul>
      </nav>

      <div className="mh-wrapper">

        {/* ── Cabeçalho de boas-vindas ── */}
        <div className="mh-welcome">
          <div className="mh-welcome-left">
            <div className="mh-welcome-avatar-ring">
              <img src={ddImg} alt="Motorista" />
            </div>
            <div>
              <p className="mh-welcome-sub">Bem-vindo de volta,</p>
              <h1 className="mh-welcome-name">Carlos Silva</h1>
              <span className={`mh-status-badge ${emTurno ? 'online' : 'offline'}`}>
                {emTurno ? '● Em turno' : '○ Fora de turno'}
              </span>
            </div>
          </div>
          <button
            className={`mh-turno-btn ${emTurno ? 'end' : 'start'}`}
            onClick={() => setEmTurno(t => !t)}
          >
            {emTurno ? 'Terminar Turno' : 'Entrar em Turno'}
          </button>
        </div>

        {/* ── Stats rápidos ── */}
        <div className="mh-stats-row">
          <div className="mh-stat-card">
            <span className="mh-stat-label">Turno</span>
            <span className="mh-stat-value">{formatHora(TURNO_INICIO)} – {formatHora(TURNO_FIM)}</span>
          </div>
          <div className="mh-stat-card">
            <span className="mh-stat-label">Viagens hoje</span>
            <span className="mh-stat-value">6</span>
          </div>
          <div className="mh-stat-card accent">
            <span className="mh-stat-label">Ganhos hoje</span>
            <span className="mh-stat-value">€97.70</span>
          </div>
          <div className="mh-stat-card">
            <span className="mh-stat-label">Km percorridos</span>
            <span className="mh-stat-value">138 km</span>
          </div>
        </div>

        <div className="mh-middle-row">

          {/* ── Info do carro ── */}
          <div className="mh-card mh-car-card">
            <h3 className="mh-card-title">Veículo</h3>
            {taxi ? (
              <>
                <div className="mh-car-grid">
                  <div className="mh-car-item">
                    <span className="mh-car-label">Matrícula</span>
                    <span className="mh-car-value">{taxi.matricula}</span>
                  </div>
                  <div className="mh-car-item">
                    <span className="mh-car-label">Modelo</span>
                    <span className="mh-car-value">{taxi.modelo}</span>
                  </div>
                  <div className="mh-car-item">
                    <span className="mh-car-label">Tipo</span>
                    <span className="mh-car-value">{taxi.tipo}</span>
                  </div>
                  <div className="mh-car-item">
                    <span className="mh-car-label">Conforto</span>
                    <span className="mh-car-value">{taxi.conforto}</span>
                  </div>
                </div>
                <div className="mh-fuel-row">
                  <span className="mh-car-label">Combustível</span>
                  <span className="mh-car-label">{taxi.combustivel}%</span>
                </div>
                <div className="mh-fuel-bar-bg">
                  <div className="mh-fuel-bar" style={{ width: `${taxi.combustivel}%` }} />
                </div>
                <div className="mh-reab-row">
                  <span className="mh-car-label">Próximo reabastecimento</span>
                  <span className="mh-reab-val">≈ {taxi.autonomia} km</span>
                </div>
                <button className="mh-btn-requisitar" style={{ marginTop: '1rem' }}
                  onClick={() => { localStorage.removeItem('motoristataxi'); setTaxi(null); }}>
                  Devolver Táxi
                </button>
              </>
            ) : (
              <div className="mh-no-taxi">
                <p>Nenhum táxi requisitado</p>
                <button className="mh-btn-requisitar" onClick={() => navigate('/motorista/requisitar-taxi')}>
                  Requisitar Táxi
                </button>
              </div>
            )}
          </div>

          {/* ── Tempo de turno ── */}
          <div className="mh-card mh-turno-card">
            <h3 className="mh-card-title">Tempo de Turno</h3>
            <div className="mh-turno-circle-wrap">
              <svg className="mh-turno-ring" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" className="mh-ring-bg" />
                <circle
                  cx="60" cy="60" r="50"
                  className="mh-ring-fill"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - progresso / 100)}`}
                />
              </svg>
              <div className="mh-turno-center">
                <span className="mh-turno-min">{minutosRestantes}</span>
                <span className="mh-turno-min-label">min restantes</span>
              </div>
            </div>
            <div className="mh-turno-times">
              <div className="mh-turno-time-item">
                <span className="mh-car-label">Início</span>
                <span className="mh-turno-time-val">{formatHora(TURNO_INICIO)}</span>
              </div>
              <div className="mh-turno-progress-pct">{Math.round(progresso)}% concluído</div>
              <div className="mh-turno-time-item right">
                <span className="mh-car-label">Fim</span>
                <span className="mh-turno-time-val">{formatHora(TURNO_FIM)}</span>
              </div>
            </div>
            <div className="mh-progress-bar-bg">
              <div className="mh-progress-bar" style={{ width: `${progresso}%` }} />
            </div>
          </div>

        </div>

        {/* ── Pedidos pendentes ── */}
        <div className="mh-card">
          <div className="mh-section-header">
            <h3 className="mh-card-title">Pedidos Pendentes</h3>
            <span className="mh-badge">{mockPendentes.length}</span>
          </div>
          <div className="mh-pendentes-list">
            {mockPendentes.map(p => (
              <div className="mh-pedido-card" key={p.id}>
                <div className="mh-pedido-route">
                  <div className="mh-pedido-point">
                    <span className="mh-dot origin" />
                    <span>{p.from}</span>
                  </div>
                  <div className="mh-pedido-line" />
                  <div className="mh-pedido-point">
                    <span className="mh-dot dest" />
                    <span>{p.to}</span>
                  </div>
                </div>
                <div className="mh-pedido-meta">
                  <span>{p.dist}</span>
                  <span>{p.passengers} pax</span>
                  <span className="mh-pedido-wait">⏱ {p.wait}</span>
                  <span className="mh-pedido-price">{p.price}</span>
                </div>
                <div className="mh-pedido-actions">
                  <button className="mh-btn-recusar">Recusar</button>
                  <button className="mh-btn-aceitar">Aceitar</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Histórico de viagens ── */}
        <div className="mh-card">
          <div className="mh-section-header">
            <h3 className="mh-card-title">Histórico de Viagens</h3>
            <button className="mh-ver-historico-btn" onClick={() => navigate('/motorista/historico')}>
              Ver Histórico Completo
            </button>
          </div>
          <div className="mh-historico-list">
            {mockHistorico.map(v => (
              <div className="mh-hist-row" key={v.id}>
                <div className="mh-hist-route">
                  <span className="mh-hist-from">{v.from}</span>
                  <span className="mh-hist-arrow">→</span>
                  <span className="mh-hist-to">{v.to}</span>
                </div>
                <div className="mh-hist-meta">
                  <span>{v.date} · {v.time}</span>
                  <span className="mh-hist-status">{v.status}</span>
                  <span className="mh-hist-price">{v.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
