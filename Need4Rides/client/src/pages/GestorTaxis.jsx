import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/GestorHome.css';
import AvatarDropdown from '../components/AvatarDropdown';
import '../css/GestorMotoristas.css';
import '../css/MotoristaHome.css'; 
import { useState } from 'react'; 

const mockTaxis = [
  { id: 1, matricula: '00-AA-01', modelo: 'Toyota Corolla',  tipo: 'Combustão', conforto: 'Básico',   motorista: 'Carlos Mendes',  estado: 'Em serviço' },
  { id: 2, matricula: '00-BB-02', modelo: 'Tesla Model 3',   tipo: 'Elétrico',  conforto: 'Luxuoso',  motorista: 'Sara Costa',     estado: 'Em serviço' },
  { id: 3, matricula: '00-CC-03', modelo: 'Mercedes E-Class',tipo: 'Combustão', conforto: 'Luxuoso',  motorista: 'Pedro Lopes',    estado: 'Em serviço' },
  { id: 4, matricula: '00-DD-04', modelo: 'Renault Zoe',     tipo: 'Elétrico',  conforto: 'Básico',   motorista: '—',              estado: 'Disponível' },
  { id: 5, matricula: '00-EE-05', modelo: 'Volkswagen Passat',tipo: 'Combustão',conforto: 'Básico',   motorista: 'João Rodrigues', estado: 'Fora de serviço' },
  { id: 6, matricula: '00-FF-06', modelo: 'BMW i4',          tipo: 'Elétrico',  conforto: 'Luxuoso',  motorista: '—',              estado: 'Disponível' },
];

const estadoClass = estado => {
  if (estado === 'Em serviço')      return 'servico';
  if (estado === 'Disponível')      return 'disponivel';
  return 'inativo';
};

export default function GestorTaxis() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="gm-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="grm-overlay" />

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
                  <a onClick={() => navigate('/gestor')}>Dashboard</a>
                </li>
      
                <li>
                  <a onClick={() => navigate('/gestor/motoristas')}>Motoristas</a>
                </li>
      
                <li>
                  <a className="active" onClick={() => navigate('/gestor/taxis')}>Táxis</a>
                </li>
      
                <li>
                  <a onClick={() => navigate('/gestor/registar-motorista')}>Registar Motorista</a>
                </li>
      
                <li>
                  <AvatarDropdown profilePath="/gestor/perfil" avatarClass="mh-avatar" />
                </li>
              </ul>
            </nav>

      <div className="gm-wrapper">

        <div className="gm-header">
          <div>
            <h1 className="gm-title">Táxis</h1>
            <p className="gm-subtitle">{mockTaxis.length} táxis registados</p>
          </div>
        </div>

        <div className="gm-card">
          <table className="gm-table">
            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Modelo</th>
                <th>Tipo</th>
                <th>Conforto</th>
                <th>Motorista</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {mockTaxis.map(t => (
                <tr key={t.id}>
                  <td className="gm-nome">{t.matricula}</td>
                  <td className="gm-muted">{t.modelo}</td>
                  <td>
                    <span className={`gt-tipo ${t.tipo === 'Elétrico' ? 'eletrico' : 'combustao'}`}>
                      {t.tipo}
                    </span>
                  </td>
                  <td className="gm-muted">{t.conforto}</td>
                  <td className="gm-muted">{t.motorista}</td>
                  <td>
                    <span className={`gt-estado ${estadoClass(t.estado)}`}>
                      ● {t.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
