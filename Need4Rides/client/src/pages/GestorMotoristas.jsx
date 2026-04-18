import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/GestorHome.css';
import AvatarDropdown from '../components/AvatarDropdown';
import '../css/GestorMotoristas.css';
import '../css/MotoristaHome.css'; 
import { useState, useEffect } from 'react';

export default function GestorMotoristas() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [motoristas, setMotoristas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/user')
      .then(res => res.json())
      .then(data => {
        const apenasMotoristas = data.filter(u => u.tipo === 'Motorista');
        setMotoristas(apenasMotoristas);
      })
      .catch(err => console.error('Erro ao carregar motoristas:', err))
      .finally(() => setLoading(false));
  }, []);

  const [tema, setTema] = useState(() => {
      return localStorage.getItem('tema') || 'escuro';
    });
  
    useEffect(() => {
      document.body.className = tema;
      localStorage.setItem('tema', tema);
    }, [tema]);
  
    const alternarTema = () => {
      setTema(prev => (prev === 'escuro' ? 'claro' : 'escuro'));
    };

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
                  <button className="mh-theme-btn" onClick={alternarTema}>
                    {tema === 'escuro' ? '☀️ Claro' : '🌙 Escuro'}
                  </button>
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
            <p className="gm-subtitle">{motoristas.length} motoristas registados</p>
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
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center' }}>A carregar...</td></tr>
              ) : motoristas.map(m => (
                <tr key={m._id}>
                  <td className="gm-nome">{m.nome}</td>
                  <td className="gm-muted">{m.nif}</td>
                  <td className="gm-muted">{m.motorista?.n_carta_conducao ?? '—'}</td>
                  <td className="gm-muted">{m.genero === 'M' ? 'Masculino' : m.genero === 'F' ? 'Feminino' : m.genero ?? '—'}</td>
                  <td className="gm-muted">{m.motorista?.morada?.texto ?? '—'}</td>
                  <td><span className="gm-estado offline">○ —</span></td>
                  <td className="gm-muted">—</td>
                  <td className="gm-ganhos">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
