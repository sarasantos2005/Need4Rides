import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/GestorHome.css';
import AvatarDropdown from '../components/AvatarDropdown';
import '../css/GestorMotoristas.css';
import '../css/MotoristaHome.css'; 
import { useState } from 'react'; 
const mockMotoristas = [
  { id: 1, nome: 'Carlos Mendes',  nif: '123456789', carta: 'C-100001-1', genero: 'Masculino', localidade: 'Lisboa',  estado: 'Em turno',      viagens: 6,  ganhos: '€97.70' },
  { id: 2, nome: 'Pedro Lopes',    nif: '234567891', carta: 'C-100002-2', genero: 'Masculino', localidade: 'Sintra',  estado: 'Em turno',      viagens: 4,  ganhos: '€63.20' },
  { id: 3, nome: 'João Rodrigues', nif: '345678912', carta: 'C-100003-3', genero: 'Masculino', localidade: 'Cascais', estado: 'Fora de turno', viagens: 0,  ganhos: '€00.00' },
  { id: 4, nome: 'Sara Costa',     nif: '456789123', carta: 'C-100004-4', genero: 'Feminino',  localidade: 'Almada',  estado: 'Em turno',      viagens: 8,  ganhos: '€120.50' },
];

export default function GestorMotoristas() {
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
                  <a className="active" onClick={() => navigate('/gestor/motoristas')}>Motoristas</a>
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

      <div className="gm-wrapper">

        <div className="gm-header">
          <div>
            <h1 className="gm-title">Motoristas</h1>
            <p className="gm-subtitle">{mockMotoristas.length} motoristas registados</p>
          </div>
          <button className="gm-btn-registar" onClick={() => navigate('/gestor/registar-motorista')}>
            + Registar Motorista
          </button>
        </div>

        <div className="gm-card">
          <table className="gm-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>NIF</th>
                <th>Carta</th>
                <th>Género</th>
                <th>Localidade</th>
                <th>Estado</th>
                <th>Viagens</th>
                <th>Ganhos</th>
              </tr>
            </thead>
            <tbody>
              {mockMotoristas.map(m => (
                <tr key={m.id}>
                  <td className="gm-nome">{m.nome}</td>
                  <td className="gm-muted">{m.nif}</td>
                  <td className="gm-muted">{m.carta}</td>
                  <td className="gm-muted">{m.genero}</td>
                  <td className="gm-muted">{m.localidade}</td>
                  <td>
                    <span className={`gm-estado ${m.estado === 'Em turno' ? 'online' : 'offline'}`}>
                      {m.estado === 'Em turno' ? '●' : '○'} {m.estado}
                    </span>
                  </td>
                  <td className="gm-muted">{m.viagens}</td>
                  <td className="gm-ganhos">{m.ganhos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
