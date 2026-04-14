import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import heroBg from '../assets/images/LA.jpg';
import ddImg from '../assets/images/fennec.jpg';
import '../css/MotoristaHome.css'; 
import AvatarDropdown from '../components/AvatarDropdown';

const mockViagensAtivas = [
  { id: 1, cliente: 'Ana Silva', motorista: 'Carlos M.', from: 'Aeroporto', to: 'Baixa-Chiado', status: 'Em curso' },
  { id: 2, cliente: 'Rui Fonseca', motorista: 'Pedro L.', from: 'Parque Nações', to: 'Benfica', status: 'Em curso' },
  { id: 3, cliente: 'Marta Gomes', motorista: 'João R.', from: 'Cascais', to: 'Sintra', status: 'A aguardar' },
];

const mockMotoristas = [
  { id: 1, nome: 'Carlos Mendes', estado: 'Em turno', viagens: 6, ganhos: '€97.70' },
  { id: 2, nome: 'Pedro Lopes', estado: 'Em turno', viagens: 4, ganhos: '€63.20' },
  { id: 3, nome: 'João Rodrigues', estado: 'Fora de turno', viagens: 0, ganhos: '€00.00' },
  { id: 4, nome: 'Sara Costa', estado: 'Em turno', viagens: 8, ganhos: '€120.50' },
];

export default function GestorHome() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const [userData, setUserData] = useState({ nome: 'Utilizador' });

  useEffect(() => {
    const storedUser = localStorage.getItem('user_logado');
    const token = localStorage.getItem('token');

    if (!token || !storedUser) {
      navigate('/login');
    } else {
      setUserData(JSON.parse(storedUser));
    }
  }, [navigate]);

  return (
    <div className="mh-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="mh-overlay" />

      {/* NAVBAR  */}
      <nav className="mh-navbar">
        <span className="mh-logo">Need4Rides</span>

        <div
          className={`mh-hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        <ul className={`mh-nav-links ${menuOpen ? 'active' : ''}`}>
          <li>
            <a className="active" onClick={() => navigate('/gestor')}>Dashboard</a>
          </li>

          <li>
            <a onClick={() => navigate('/gestor/motoristas')}>Motoristas</a>
          </li>

          <li>
            <a onClick={() => navigate('/gestor/taxis')}>Táxis</a>
          </li>

          <li>
            <a onClick={() => navigate('/gestor/registar-motorista')}>Registar Motorista</a>
          </li>

          <li>
            <AvatarDropdown profilePath="/gestor/perfil" avatarClass="mh-avatar" />
          </li>
        </ul>
      </nav>

      <div className="mh-wrapper">

        {/* WELCOME */}
        <div className="mh-welcome">
          <div className="mh-welcome-left">
            <div className="mh-welcome-avatar-ring">
              <img src={ddImg} alt="Gestor" />
            </div>

            <div>
              <p className="mh-welcome-sub">Bem-vindo de volta,</p>
              <h1 className="mh-welcome-name">
                {userData.nome.split(' ')[0]}
              </h1>

              <span className="mh-status-badge online">
                ● Gestor
              </span>
            </div>
          </div>

          <button
            className="mh-turno-btn end"
            onClick={() => navigate('/login')}
          >
            Terminar Sessão
          </button>
        </div>

        {/* STATS */}
        <div className="mh-stats-row">
          <div className="mh-stat-card">
            <span className="mh-stat-label">Viagens hoje</span>
            <span className="mh-stat-value">24</span>
          </div>

          <div className="mh-stat-card accent">
            <span className="mh-stat-label">Receita hoje</span>
            <span className="mh-stat-value">€381.40</span>
          </div>

          <div className="mh-stat-card">
            <span className="mh-stat-label">Motoristas ativos</span>
            <span className="mh-stat-value">3 / 4</span>
          </div>

          <div className="mh-stat-card">
            <span className="mh-stat-label">Táxis em serviço</span>
            <span className="mh-stat-value">3 / 6</span>
          </div>
        </div>

        {/* CONTEÚDO */}
        <div className="mh-middle-row">

          {/* VIAGENS */}
          <div className="mh-card">
            <div className="mh-section-header">
              <h3 className="mh-card-title">Viagens em Curso</h3>
              <span className="mh-badge">{mockViagensAtivas.length}</span>
            </div>

            <div>
              {mockViagensAtivas.map(v => (
                <div className="mh-pedido-card" key={v.id}>
                  <div className="mh-pedido-route">
                    <span className="mh-dot origin" />
                    <span>{v.from}</span>
                    <span className="mh-dot dest" />
                    <span>{v.to}</span>
                  </div>

                  <div className="mh-pedido-meta">
                    <span>{v.cliente}</span>
                    <span>·</span>
                    <span>{v.motorista}</span>
                  </div>

                  <span className="mh-status-badge online">
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* MOTORISTAS */}
          <div className="mh-card">
            <div className="mh-section-header">
              <h3 className="mh-card-title">Motoristas</h3>
            </div>

            <div>
              {mockMotoristas.map(m => (
                <div className="mh-hist-row" key={m.id}>
                  <div>
                    <div className="mh-car-value">{m.nome}</div>
                    <div className="mh-car-label">
                      {m.estado}
                    </div>
                  </div>

                  <div className="mh-hist-meta">
                    <span>{m.viagens} viagens</span>
                    <span className="mh-hist-price">{m.ganhos}</span>
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