import { useNavigate, useParams } from 'react-router-dom';
import ddImg from '../assets/images/fennec.jpg';
import heroBg from '../assets/images/LA.jpg';
import '../css/Profile.css';
import { useState, useEffect } from 'react';
import Loading from '../components/Loading';
import useMinLoading from '../hooks/useMinLoading';
import axios from 'axios';
import AvatarDropdown from '../components/AvatarDropdown';

export default function GestorMotoristaProfile() {
  const navigate = useNavigate();
  const { motorista_id } = useParams();
  const [userData, setUserData] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useMinLoading();
  const [apiStatus, setApiStatus] = useState({
    user: false,
    historico: false
  });

  useEffect(() => {
    if (!motorista_id) {
      navigate('/gestor/motoristas');
      return;
    }
    fetchProfileData();
  }, [motorista_id, navigate]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const resUser = await axios.get(`http://localhost:3000/api/user/${motorista_id}`, config);
      setUserData(resUser.data);
      setApiStatus(prev => ({ ...prev, user: true }));
      
      // Tentar buscar viagens do motorista (se houver endpoint)
      try {
        const resTrips = await axios.get(`http://localhost:3000/api/viagem/motorista/${motorista_id}`, config);
        setHistorico(resTrips.data);
      } catch (err) {
        console.log("Não foi possível carregar viagens");
        setHistorico([]);
      }

      setApiStatus(prev => ({ ...prev, historico: true }));
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
      alert("Erro ao carregar perfil do motorista");
      navigate('/gestor/motoristas');
    }
  }

  const formatarData = (dataISO) => {
    const data = new Date(dataISO);
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    const mes = meses[data.getMonth()];
    const ano = data.getFullYear();

    return `${mes} de ${ano}`;
  }

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

  if (loading || !userData) {
    return (
      <Loading 
        tasks={Object.values(apiStatus)} 
        onFinished={() => setLoading(false)} 
      />
    );
  }
  
  return (
    <>
    <div className="profile-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="profile-overlay" />

      {/* NAVBAR */}
      <nav className="mh-navbar">
        <span className="mh-logo">Need4Rides</span>

        <ul className="mh-nav-links">
          <li>
            <a onClick={() => navigate('/gestor')}>Dashboard</a>
          </li>
          <li>
            <a onClick={() => navigate('/gestor/motoristas')}>Motoristas</a>
          </li>
          <li>
            <a onClick={() => navigate('/gestor/taxis')}>Táxis</a>
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

      <div className="profile-wrapper">

        {/* Card principal */}
        <div className="profile-card">

          {/* Avatar + nome */}
          <div className="profile-header">
            <div className="profile-avatar-ring">
              <img src={ddImg} alt="Avatar" className="profile-avatar" />
            </div>
            <div className="profile-info">
              <h1>{userData.nome}</h1>
              <div className="profile-badges">
                <span className="profile-badge">{userData.tipo} Verificado</span>
                <span className="profile-badge">Membro desde {formatarData(userData.createdAt)}</span>
              </div>
            </div>
            <div className="profile-actions">
              <button className="profile-back-btn" onClick={() => navigate('/gestor/motoristas')}>
                ← Voltar
              </button>

             
            </div>
          </div>

          <div className="profile-divider" />

          {/* Dados pessoais - Apenas leitura */}
          <div className="profile-details">
            <div className="profile-field">
              <label>Nome</label>
              <input type="text" value={userData.nome} readOnly />
            </div>
            <div className="profile-field">
              <label>Email</label>
              <input type="email" value={userData.email} readOnly />
            </div>
            <div className="profile-field">
              <label>NIF</label>
              <input type="text" value={userData.nif} readOnly />
            </div>
            <div className="profile-field">
              <label>Género</label>
              <input type="text" value={userData.genero === 'M' ? 'Masculino' : userData.genero === 'F' ? 'Feminino' : userData.genero} readOnly />
            </div>
            <div className="profile-field">
              <label>Ano de Nascimento</label>
              <input type="text" value={userData.ano_nascimento || '—'} readOnly />
            </div>
            <div className="profile-field">
              <label>Nº Carta de Condução</label>
              <input type="text" value={userData.motorista?.n_carta_conducao || '—'} readOnly />
            </div>
            <div className="profile-field">
              <label>Morada</label>
              <input type="text" value={userData.motorista?.morada?.texto || '—'} readOnly />
            </div>
          </div>
        </div>

        {/* Histórico de viagens */}
        {historico.length > 0 && (
          <div className="profile-trips">
            <h2>Histórico de Viagens</h2>
            <div className="trips-list">
              {historico.map(v => (
                <div className="trip-card" key={v._id}>
                  <div className="trip-main">
                    <div className="mh-pedido-route">
                      <div className="mh-pedido-point">
                        <span className="mh-dot origin" />
                        <span>{v.morada_inicial_viagem?.morada}</span>
                      </div>
                      <div className="mh-pedido-line" />
                      <div className="mh-pedido-point">
                        <span className="mh-dot dest" />
                        <span>{v.morada_final_viagem?.morada}</span>
                      </div>
                    </div>
                    <div className="trip-meta">
                      <span className="trip-date">{new Date(v.hora_inicial_viagem).toLocaleDateString()} · {new Date(v.hora_inicial_viagem).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="trip-date">{v.km_percorridos}km · {v.n_passageiros} pax</span>
                      <span className="trip-price">{v.preco_viagem?.toFixed(2)}€</span>
                      <span className="mh-hist-status">{v.status || 'Concluída'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
