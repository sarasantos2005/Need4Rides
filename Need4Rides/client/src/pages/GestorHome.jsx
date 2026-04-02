import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import ddImg from '../assets/images/fennec.jpg';
import '../css/GestorHome.css';
import AvatarDropdown from '../components/AvatarDropdown';

const mockViagensAtivas = [
  { id: 1, cliente: 'Ana Silva',    motorista: 'Carlos M.', from: 'Aeroporto',      to: 'Baixa-Chiado', status: 'Em curso' },
  { id: 2, cliente: 'Rui Fonseca',  motorista: 'Pedro L.',  from: 'Parque Nações',  to: 'Benfica',       status: 'Em curso' },
  { id: 3, cliente: 'Marta Gomes',  motorista: 'João R.',   from: 'Cascais',        to: 'Sintra',        status: 'A aguardar' },
];

const mockMotoristas = [
  { id: 1, nome: 'Carlos Mendes',  estado: 'Em turno',      viagens: 6,  ganhos: '€97.70' },
  { id: 2, nome: 'Pedro Lopes',    estado: 'Em turno',      viagens: 4,  ganhos: '€63.20' },
  { id: 3, nome: 'João Rodrigues', estado: 'Fora de turno', viagens: 0,  ganhos: '€00.00' },
  { id: 4, nome: 'Sara Costa',     estado: 'Em turno',      viagens: 8,  ganhos: '€120.50' },
];

export default function GestorHome() {
  const navigate = useNavigate();

  return (
    <div className="gh-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="gh-overlay" />

      {/* Navbar */}
      <nav className="gh-navbar">
        <span className="gh-logo">Need4Rides</span>
        <ul className="gh-nav-links">
          <li><a className="active">Dashboard</a></li>
          <li><a style={{ cursor: 'pointer' }} onClick={() => navigate('/gestor/motoristas')}>Motoristas</a></li>
          <li><a style={{ cursor: 'pointer' }} onClick={() => navigate('/gestor/taxis')}>Táxis</a></li>
          <li><a style={{ cursor: 'pointer' }} onClick={() => navigate('/gestor/registar-motorista')}>Registar Motorista</a></li>
          <li>
            <AvatarDropdown profilePath="/gestor/perfil" avatarClass="gh-avatar" />
          </li>
        </ul>
      </nav>

      <div className="gh-wrapper">

        {/* Boas-vindas */}
        <div className="gh-welcome">
          <div className="gh-welcome-left">
            <div className="gh-welcome-avatar-ring">
              <img src={ddImg} alt="Gestor" />
            </div>
            <div>
              <p className="gh-welcome-sub">Bem-vindo de volta,</p>
              <h1 className="gh-welcome-name">Admin Need4Rides</h1>
              <span className="gh-role-badge">Gestor</span>
            </div>
          </div>
          <button className="gh-logout-btn" onClick={() => navigate('/login')}>
            Terminar Sessão
          </button>
        </div>

        {/* Stats */}
        <div className="gh-stats-row">
          <div className="gh-stat-card">
            <span className="gh-stat-label">Viagens hoje</span>
            <span className="gh-stat-value">24</span>
          </div>
          <div className="gh-stat-card accent">
            <span className="gh-stat-label">Receita hoje</span>
            <span className="gh-stat-value">€381.40</span>
          </div>
          <div className="gh-stat-card">
            <span className="gh-stat-label">Motoristas ativos</span>
            <span className="gh-stat-value">3 / 4</span>
          </div>
          <div className="gh-stat-card">
            <span className="gh-stat-label">Táxis em serviço</span>
            <span className="gh-stat-value">3 / 6</span>
          </div>
        </div>

        <div className="gh-middle-row">

          {/* Viagens ativas */}
          <div className="gh-card">
            <div className="gh-section-header">
              <h3 className="gh-card-title">Viagens em Curso</h3>
              <span className="gh-badge">{mockViagensAtivas.length}</span>
            </div>
            <div className="gh-viagens-list">
              {mockViagensAtivas.map(v => (
                <div className="gh-viagem-row" key={v.id}>
                  <div className="gh-viagem-route">
                    <span className="gh-dot origin" />
                    <span>{v.from}</span>
                    <span className="gh-arrow">→</span>
                    <span className="gh-dot dest" />
                    <span>{v.to}</span>
                  </div>
                  <div className="gh-viagem-meta">
                    <span>{v.cliente}</span>
                    <span className="gh-sep">·</span>
                    <span>{v.motorista}</span>
                  </div>
                  <span className={`gh-status-badge ${v.status === 'Em curso' ? 'active' : 'waiting'}`}>
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Motoristas */}
          <div className="gh-card">
            <div className="gh-section-header">
              <h3 className="gh-card-title">Motoristas</h3>
            </div>
            <div className="gh-motoristas-list">
              {mockMotoristas.map(m => (
                <div className="gh-motorista-row" key={m.id}>
                  <div className="gh-motorista-info">
                    <span className="gh-motorista-nome">{m.nome}</span>
                    <span className={`gh-motorista-estado ${m.estado === 'Em turno' ? 'online' : 'offline'}`}>
                      {m.estado === 'Em turno' ? '●' : '○'} {m.estado}
                    </span>
                  </div>
                  <div className="gh-motorista-stats">
                    <span>{m.viagens} viagens</span>
                    <span className="gh-motorista-ganhos">{m.ganhos}</span>
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
