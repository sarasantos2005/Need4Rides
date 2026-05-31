import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import ddImg from '../assets/images/fennec.jpg';
import '../css/MotoristaHome.css';
import '../css/global.css';
import AvatarDropdown from '../components/AvatarDropdown';

export default function GestorViagem() {
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

          <button className="mh-turno-btn end" onClick={goBack}>
            Voltar ao Dashboard
          </button>
        </div>

        <div className="mh-middle-row">
          <div className="mh-card full-width">
            <div className="mh-section-header">
              <h3 className="mh-card-title">Dados da Viagem</h3>
              <span className="mh-badge">{trip.status || 'Sem estado'}</span>
            </div>

            <div className="mh-pedido-card" style={{ cursor: 'default' }}>
              <div className="mh-pedido-route" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <strong>Cliente:</strong>
                  <span>{trip.cliente || 'Não disponível'}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                  <strong>Motorista:</strong>
                  <span>{trip.motorista || 'Não disponível'}</span>
                </div>
              </div>

              <div className="mh-pedido-meta" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                <div>
                  <strong>Origem:</strong> {trip.origem || 'Não disponível'}
                </div>
                <div>
                  <strong>Destino:</strong> {trip.destino || 'Não disponível'}
                </div>
                <div>
                  <strong>Data:</strong> {trip.data || 'Não disponível'}
                </div>
                <div>
                  <strong>Hora:</strong> {trip.hora || 'Não disponível'}
                </div>
                <div>
                  <strong>Preço:</strong> {typeof trip.preco === 'number' ? `€${trip.preco.toFixed(2)}` : (trip.preco ?? 'Não disponível')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mh-middle-row">
          <div className="mh-card full-width">
            <div className="mh-section-header">
              <h3 className="mh-card-title">Informações adicionais</h3>
            </div>

            <div style={{ padding: '20px', color: '#ddd' }}>
              <p><strong>ID da viagem:</strong> {trip.id}</p>
              <p><strong>Status:</strong> {trip.status || 'Sem estado'}</p>
              <p><strong>Origem:</strong> {trip.origem}</p>
              <p><strong>Destino:</strong> {trip.destino}</p>
              <p><strong>Passageiros:</strong> {trip.passageiros ?? 'Não disponível'}</p>
              <p><strong>Nível de conforto:</strong> {trip.nivel_conforto ?? 'Não disponível'}</p>
              <p><strong>Observações:</strong> {trip.observacoes ?? 'Nenhuma'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
