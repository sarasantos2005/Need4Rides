import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/GestorHome.css';
import AvatarDropdown from '../components/AvatarDropdown';
import '../css/GestorMotoristas.css';
import '../css/MotoristaHome.css';
import { useState, useEffect } from 'react';

const estadoClass = estado => {
  if (estado === 'Em serviço')  return 'servico';
  if (estado === 'Disponível')  return 'disponivel';
  return 'inativo';
};

export default function GestorTaxis() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState(1);
  const [taxis, setTaxis] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'escuro');

  useEffect(() => {
    document.body.className = tema;
    localStorage.setItem('tema', tema);
  }, [tema]);

  useEffect(() => {
    fetch('http://localhost:3000/api/taxi/all')
      .then(r => r.json())
      .then(data => setTaxis(data.taxis ?? []))
      .catch(() => setTaxis([]))
      .finally(() => setLoading(false));
  }, []);

  const alternarTema = () => setTema(prev => prev === 'escuro' ? 'claro' : 'escuro');

  const handleSort = (col) => {
    setSortDir(prev => sortCol === col ? prev * -1 : 1);
    setSortCol(col);
  };

  const getSortClass = (col) => {
    if (sortCol !== col) return '';
    return sortDir === 1 ? 'asc' : 'desc';
  };

  const sorted = [...taxis].sort((a, b) => {
    if (!sortCol) return 0;
    return String(a[sortCol]).localeCompare(String(b[sortCol]), 'pt') * sortDir;
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
          <li><a onClick={() => navigate('/gestor')}>Dashboard</a></li>
          <li><a onClick={() => navigate('/gestor/motoristas')}>Motoristas</a></li>
          <li><a className="active" onClick={() => navigate('/gestor/taxis')}>Táxis</a></li>
          <li><a onClick={() => navigate('/gestor/precos')}>Preços</a></li>
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
            <h1 className="gm-title">Táxis</h1>
            <p className="gm-subtitle">
              {loading ? 'A carregar...' : `${taxis.length} táxi${taxis.length !== 1 ? 's' : ''} registado${taxis.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button className="gm-btn-registar" onClick={() => navigate('/gestor/registar-taxi')}>
            + Registar Táxi
          </button>
        </div>

        <div className="gm-card">

          {/* TABELA — desktop */}
          <div className="gm-table-wrap">
            <table className="gm-table">
              <thead>
                <tr>
                  <th className={getSortClass('matricula')} onClick={() => handleSort('matricula')}>
                    Matrícula <SortIcon col="matricula" />
                  </th>
                  <th className={getSortClass('marca')} onClick={() => handleSort('marca')}>
                    Marca <SortIcon col="marca" />
                  </th>
                  <th className={getSortClass('modelo')} onClick={() => handleSort('modelo')}>
                    Modelo <SortIcon col="modelo" />
                  </th>
                  <th className={getSortClass('tipo_motor')} onClick={() => handleSort('tipo_motor')}>
                    Tipo <SortIcon col="tipo_motor" />
                  </th>
                  <th className={getSortClass('nivel_conforto')} onClick={() => handleSort('nivel_conforto')}>
                    Conforto <SortIcon col="nivel_conforto" />
                  </th>
                  <th className={getSortClass('ano_compra')} onClick={() => handleSort('ano_compra')}>
                    Ano <SortIcon col="ano_compra" />
                  </th>
                  <th>Cor</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>A carregar táxis...</td></tr>
                ) : sorted.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>Nenhum táxi registado.</td></tr>
                ) : sorted.map(t => (
                  <tr key={t._id}>
                    <td className="gm-nome">{t.matricula}</td>
                    <td className="gm-muted">{t.marca}</td>
                    <td className="gm-muted">{t.modelo}</td>
                    <td>
                      <span className={`gt-tipo ${t.tipo_motor === 'Elétrico' ? 'eletrico' : 'combustao'}`}>
                        {t.tipo_motor}
                      </span>
                    </td>
                    <td className="gm-muted">{t.nivel_conforto}</td>
                    <td className="gm-muted">{t.ano_compra}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: t.cor,
                          border: '2px solid rgba(255,255,255,0.2)',
                          verticalAlign: 'middle',
                        }}
                        title={t.cor}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CARDS — mobile */}
          <div className="gm-mobile-list">
            {loading ? (
              <p style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>A carregar táxis...</p>
            ) : sorted.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>Nenhum táxi registado.</p>
            ) : sorted.map(t => (
              <div key={t._id} className="gm-m-card">
                <div className="gm-m-header">
                  <span className="gm-nome">{t.matricula}</span>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: t.cor,
                      border: '2px solid rgba(255,255,255,0.2)',
                    }}
                    title={t.cor}
                  />
                </div>
                <div className="gm-m-row">
                  <span className="gm-m-label">Marca</span>
                  <span className="gm-muted">{t.marca}</span>
                </div>
                <div className="gm-m-row">
                  <span className="gm-m-label">Modelo</span>
                  <span className="gm-muted">{t.modelo}</span>
                </div>
                <div className="gm-m-row">
                  <span className="gm-m-label">Tipo</span>
                  <span className={`gt-tipo ${t.tipo_motor === 'Elétrico' ? 'eletrico' : 'combustao'}`}>{t.tipo_motor}</span>
                </div>
                <div className="gm-m-row">
                  <span className="gm-m-label">Conforto</span>
                  <span className="gm-muted">{t.nivel_conforto}</span>
                </div>
                <div className="gm-m-row">
                  <span className="gm-m-label">Ano</span>
                  <span className="gm-muted">{t.ano_compra}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
