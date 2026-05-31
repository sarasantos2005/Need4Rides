import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import ddImg from '../assets/images/fennec.jpg';
import '../css/MotoristaHome.css';
import '../css/GestorHome.css';
import '../css/global.css';
import AvatarDropdown from '../components/AvatarDropdown';
import useAuthGuard from '../hooks/authGuard';

export default function GestorViagem() {
  useAuthGuard();
  const navigate = useNavigate();
  const { state } = useLocation();
  const trip = state?.trip;
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user_logado');
  const userData = storedUser ? JSON.parse(storedUser) : { nome: 'Utilizador' };
  const [menuOpen, setMenuOpen] = useState(false);
  const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'escuro');

  useEffect(() => {
    document.body.className = tema;
    localStorage.setItem('tema', tema);
  }, [tema]);

  const alternarTema = () => setTema(prev => (prev === 'escuro' ? 'claro' : 'escuro'));

  useEffect(() => {
    if (!token || !storedUser) {
      navigate('/login');
    } else if (!trip) {
      navigate('/gestor');
    }
  }, [navigate, token, storedUser, trip]);

  const goBack = () => navigate('/gestor');

  if (!trip) {
    return null;
  }

  const USERNAME = JSON.parse(localStorage.getItem("user_logado")).nome;

  return (
    <div className="mh-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="mh-overlay" />

      <nav className="gb-navbar">
        <span className="gb-logo">Need4Rides</span>

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
            <AvatarDropdown profilePath="/gestor/perfil" avatarClass="gb-avatar" />
            <span className="gb-profile-pill-name">{USERNAME}</span>
          </li>
          <li><a onClick={() => navigate('/gestor')}>Dashboard</a></li>
          <li><a onClick={() => navigate('/gestor/motoristas')}>Motoristas</a></li>
          <li><a onClick={() => navigate('/gestor/taxis')}>Táxis</a></li>
          <li><a onClick={() => navigate('/gestor/precos')}>Preços</a></li>
          <li>
            <button className="gb-theme-btn" onClick={alternarTema}>
              {tema === 'escuro' ? '☀️ Claro' : '🌙 Escuro'}
            </button>
          </li>
          <li className="gb-profile-li avatarNormal">
            <div className="gb-profile-pill">
              <span className="gb-profile-pill-name">{USERNAME}</span>
              <AvatarDropdown profilePath="/gestor/perfil" avatarClass="gb-avatar" />
            </div>
          </li>
        </ul>
      </nav>

      <div className="mh-wrapper">
        <div className="mh-welcome">
          <div className="mh-welcome-left">
            <div className="mh-welcome-avatar-ring">
              <img src={ddImg} alt="Gestor" />
            </div>
            <div>
              <p className="mh-welcome-sub">Detalhes da viagem</p>
              <h1 className="mh-welcome-name">{userData.nome.split(' ')[0]}</h1>
              <span className="mh-status-badge online">● Gestor</span>
            </div>
          </div>

          <button className="mh-turno-btn start" onClick={goBack}>
            ← Voltar ao Dashboard
          </button>
        </div>

        <div className="mh-middle-row">
          <div className="mh-card full-width">
            <div className="mh-section-header">
              <h3 className="mh-card-title">Detalhes da Viagem</h3>
              <span className="mh-status-badge online">● {trip.status || 'Sem estado'}</span>
            </div>

            {/* Rota */}
            <div style={{ padding: '1rem 1.2rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingTop: '3px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f5c518', flexShrink: 0, display: 'block' }} />
                  <span style={{ width: 2, height: 32, background: 'rgba(255,255,255,0.15)', display: 'block' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff6b6b', flexShrink: 0, display: 'block' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Origem</div>
                    <div style={{ fontSize: '0.92rem', color: '#eee', fontWeight: 500 }}>{trip.origem || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Destino</div>
                    <div style={{ fontSize: '0.92rem', color: '#eee', fontWeight: 500 }}>{trip.destino || '—'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0.5rem 1.2rem' }} />

            {/* Grid de campos */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', padding: '0.8rem 1.2rem 1.2rem' }}>
              {[
                { label: 'Cliente',          value: trip.cliente },
                { label: 'Motorista',        value: trip.motorista },
                { label: 'Data',             value: trip.data },
                { label: 'Hora',             value: trip.hora },
                { label: 'Preço',            value: typeof trip.preco === 'number' ? `€${trip.preco.toFixed(2)}` : (trip.preco ?? null) },
                { label: 'Passageiros',      value: trip.passageiros },
                { label: 'Nível de Conforto',value: trip.nivel_conforto },
                { label: 'Observações',      value: trip.observacoes || 'Nenhuma' },
                { label: 'ID',               value: trip.id, mono: true },
              ].map(({ label, value, mono }) => (
                <div key={label}>
                  <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>{label}</div>
                  <div style={{ fontSize: mono ? '0.75rem' : '0.9rem', color: value != null ? '#eee' : '#555', fontWeight: 500, fontFamily: mono ? 'monospace' : undefined, wordBreak: 'break-all' }}>
                    {value ?? '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
