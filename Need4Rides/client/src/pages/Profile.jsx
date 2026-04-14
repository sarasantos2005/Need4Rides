import { useNavigate } from 'react-router-dom';
import ddImg from '../assets/images/fennec.jpg';
import heroBg from '../assets/images/LA.jpg';
import '../css/Profile.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Profile() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    nif: '',
    genero: '',
    nome: '',
    senha_acesso_web: ''
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user_logado');
    const token = localStorage.getItem('token');

    if (!token || !storedUser) {
      navigate('/login'); 
    } else {
      const user = JSON.parse(storedUser);
      setUserData(user);

      const userId = user._id || user.id; 
      if (userId && token) {
        fetchProfileData(token);
      }
    }
  }, [navigate]);

  const fetchProfileData = async (token) => {
    if (!token) {
      console.error("Token ausente");
      return;
    }

    try {
      setLoading(true);

      const userStored = JSON.parse(localStorage.getItem('user_logado'));
      const userId = userStored._id || userStored.id;

      const config = { headers: { Authorization: `Bearer ${token}` } };

      const resUser = await axios.get(`http://localhost:3000/api/user/${userId}`, config);
      const resTrips = await axios.get(`http://localhost:3000/api/viagem/historico/cliente`, config);

      setUserData(resUser.data);
      setHistorico(resTrips.data);
      setFormData({
        email: resUser.data.email || '',
        nif: resUser.data.nif || '',
        genero: resUser.data.genero || '',
        senha_acesso_web: '',
        nome: resUser.data.nome || ''
      });
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
    }
  }

  const handleInputChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  }

  const handleSave = async() => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(`http://localhost:3000/api/user/`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.setItem('user_logado', JSON.stringify(response.data.user));
      alert("Alterações guardadas!");
    } catch (err) {
      alert(err.response?.data?.message || "Erro ao salvar alterações");
    }
  }

  const formatarData = (dataISO) => {
    const data = new Date(dataISO);
    const meses = [ "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
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

  if(!userData) return <div className="mh-loading">A carregar perfil...</div>;

  return (
    <div
      className="profile-page"
      style={{ backgroundImage: `url(${heroBg})` }}
    >
      <div className="profile-overlay" />

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
              <button className="profile-back-btn" onClick={() => navigate(-1)}>
                Voltar
              </button>

              <button className="profile-theme-btn" onClick={alternarTema}>
                {tema === 'escuro' ? '☀️ Claro' : '🌙 Escuro'}
              </button>
            </div>
            
            </div>
          <div className="profile-divider" />

          {/* Dados */}
          <div className="profile-details">
            <div className="profile-field">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
            </div>
            <div className="profile-field">
              <label>Nome</label>
              <input type="text" name="nome" value={formData.nome} onChange={handleInputChange}/>
            </div>
            <div className="profile-field">
              <label>NIF</label>
              <input type="text" name="nif" value={formData.nif} minLength={9} maxLength={9} readOnly/>
            </div>
            <div className="profile-field">
              <label>Género</label>
              <select className="profile-select" name="genero" value={formData.genero} onChange={handleInputChange}>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
            <div className="profile-field">
              <label>Password</label>
              <input type="password" name="senha_acesso_web" value={formData.senha_acesso_web} onChange={handleInputChange}/>
            </div>
          </div>

          <button className="profile-save-btn" onClick={handleSave}>Guardar Alterações</button>
        </div>

        {/* Histórico de viagens */}
        <div className="profile-trips">
          <h2>Histórico de Viagens</h2>
          <div className="trips-list">
            {historico.length > 0 ? (
              historico.map(trip => (
                <div className="trip-card" key={trip._id}>
                  <div className="trip-main">
                    <div className="mh-pedido-route">
                      <div className="mh-pedido-point">
                        <span className="mh-dot origin" />
                        <span>{trip.morada_inicial_viagem?.morada}</span>
                      </div>
                      <div className="mh-pedido-line" />
                      <div className="mh-pedido-point">
                        <span className="mh-dot dest" />
                        <span>{trip.morada_final_viagem?.morada}</span>
                      </div>
                    </div>
                    <div className="trip-meta">
                      <span className="trip-date">{new Date(trip.hora_inicial_viagem).toLocaleDateString()} · {new Date(trip.hora_inicial_viagem).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      <span className="trip-price">{trip.preco_viagem?.toFixed(2)}€</span>
                      <span className="trip-status">Concluída</span>
                    </div>
                  </div>
                  {trip.temFatura ? (
                    <button
                      className="trip-invoice-btn"
                      onClick={() => navigate('/fatura', { state: { trip, client: formData.nome } })}
                    >
                      Fatura
                    </button>
                  ) : (
                    <span style={{ color: '#999', fontSize: '0.8rem' }}>Processando Fatura...</span>
                  )}
                </div>
              ))
            ) : (
              <p className="mh-no-data">Ainda não realizou viagens.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
} 
