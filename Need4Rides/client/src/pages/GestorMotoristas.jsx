import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/GestorHome.css';
import AvatarDropdown from '../components/AvatarDropdown';
import '../css/GestorMotoristas.css';
import '../css/MotoristaHome.css';
import { useState, useEffect } from 'react';
import useMinLoading from '../hooks/useMinLoading';

export default function GestorMotoristas() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [motoristas, setMotoristas] = useState([]);
  const [loading, setLoading] = useMinLoading();
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState(1);

  useEffect(() => {
    fetch('http://localhost:3000/api/user')
      .then(res => res.json())
      .then(data => {
        const apenasMotoristas = data
          .filter(u => u.tipo === 'Motorista')
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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

  const handleSort = (col) => {
    setSortDir(prev => sortCol === col ? prev * -1 : 1);
    setSortCol(col);
  };

  const getSortClass = (col) => {
    if (sortCol !== col) return '';
    return sortDir === 1 ? 'asc' : 'desc';
  };

  const sorted = [...motoristas].sort((a, b) => {
    if (!sortCol) return 0;
    const getVal = (m, col) => {
      switch (col) {
        case 'nome':       return m.nome ?? '';
        case 'nif':        return m.nif ?? '';
        case 'carta':      return m.motorista?.n_carta_conducao ?? '';
        case 'genero':     return m.genero === 'M' ? 'Masculino' : m.genero === 'F' ? 'Feminino' : m.genero ?? '';
        case 'localidade': return m.motorista?.morada?.texto ?? '';
        default:           return '';
      }
    };
    return String(getVal(a, sortCol)).localeCompare(String(getVal(b, sortCol)), 'pt') * sortDir;
  });

  const SortIcon = ({ col }) => (
    <span className="sort-icon">
      <span className={`up ${sortCol === col && sortDir === 1 ? 'active' : ''}`} />
      <span className={`dn ${sortCol === col && sortDir === -1 ? 'active' : ''}`} />
    </span>
  );

  return (
    <div className="gm-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="grm-overlay" />

      {/* NAVBAR */}
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
            <a onClick={() => navigate('/gestor/precos')}>Preços</a>
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

          {/* TABELA — desktop */}
          <div className="gm-table-wrap">
            <table className="gm-table">
              <thead>
                <tr>
                  <th className={getSortClass('nome')} onClick={() => handleSort('nome')}>
                    Nome <SortIcon col="nome" />
                  </th>
                  <th className={getSortClass('nif')} onClick={() => handleSort('nif')}>
                    NIF <SortIcon col="nif" />
                  </th>
                  <th className={getSortClass('carta')} onClick={() => handleSort('carta')}>
                    Carta <SortIcon col="carta" />
                  </th>
                  <th className={getSortClass('genero')} onClick={() => handleSort('genero')}>
                    Género <SortIcon col="genero" />
                  </th>
                  <th className={getSortClass('localidade')} onClick={() => handleSort('localidade')}>
                    Localidade <SortIcon col="localidade" />
                  </th>
                  <th>Estado</th>
                  <th>Viagens</th>
                  <th>Ganhos</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(m => (
                  <tr key={m._id} onClick={() => navigate(`/gestor/motoristas/${m._id}`)} style={{ cursor: 'pointer' }} className="gm-table-row-clickable">
                    <td className="gm-nome">{m.nome}</td>
                    <td className="gm-muted">{m.nif}</td>
                    <td className="gm-muted">{m.motorista?.n_carta_conducao ?? '—'}</td>
                    <td className="gm-muted">
                      {m.genero === 'M' ? 'Masculino' : m.genero === 'F' ? 'Feminino' : m.genero ?? '—'}
                    </td>
                    <td className="gm-muted">{m.motorista?.morada?.texto ?? '—'}</td>
                    <td><span className="gm-estado offline">○ —</span></td>
                    <td className="gm-muted">—</td>
                    <td className="gm-ganhos">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CARDS — mobile */}
          <div className="gm-mobile-list">
            {sorted.map(m => (
              <div key={m._id} className="gm-m-card" onClick={() => navigate(`/gestor/motoristas/${m._id}`)} style={{ cursor: 'pointer' }}>
                <div className="gm-m-header">
                  <span className="gm-nome">{m.nome}</span>
                  <span className="gm-estado offline">○ —</span>
                </div>
                <div className="gm-m-row">
                  <span className="gm-m-label">NIF</span>
                  <span className="gm-muted">{m.nif}</span>
                </div>
                <div className="gm-m-row">
                  <span className="gm-m-label">Carta</span>
                  <span className="gm-muted">{m.motorista?.n_carta_conducao ?? '—'}</span>
                </div>
                <div className="gm-m-row">
                  <span className="gm-m-label">Género</span>
                  <span className="gm-muted">
                    {m.genero === 'M' ? 'Masculino' : m.genero === 'F' ? 'Feminino' : m.genero ?? '—'}
                  </span>
                </div>
                <div className="gm-m-row">
                  <span className="gm-m-label">Localidade</span>
                  <span className="gm-muted">{m.motorista?.morada?.texto ?? '—'}</span>
                </div>
                <div className="gm-m-row">
                  <span className="gm-m-label">Viagens</span>
                  <span className="gm-muted">—</span>
                </div>
                <div className="gm-m-row">
                  <span className="gm-m-label">Ganhos</span>
                  <span className="gm-ganhos">—</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}