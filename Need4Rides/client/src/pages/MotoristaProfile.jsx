import { useNavigate } from 'react-router-dom';
import ddImg from '../assets/images/fennec.jpg';
import heroBg from '../assets/images/LA.jpg';
import '../css/Profile.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

const mockViagens = [
  { id: 1, from: 'Aeroporto de Lisboa', to: 'Baixa-Chiado',  date: '31 Mar 2026', time: '09:42', price: '€18.50', km: '14 km', passengers: 2 },
  { id: 2, from: 'Parque das Nações',   to: 'Benfica',        date: '31 Mar 2026', time: '08:15', price: '€12.80', km: '9 km',  passengers: 1 },
  { id: 3, from: 'Cascais',             to: 'Sintra',         date: '30 Mar 2026', time: '17:30', price: '€31.00', km: '22 km', passengers: 3 },
];

export default function MotoristaProfile() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    nif: '',
    genero: '',
    ano_nascimento: '',
    n_carta_conducao: '',
    morada: '',
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
      const resTrips = await axios.get(`http://localhost:3000/api/viagem/motorista`, config);

      setUserData(resUser.data);
      setHistorico(resTrips.data);
      setFormData({
        nome: resUser.data.nome || '',
        email: resUser.data.email || '',
        nif: resUser.data.nif || '',
        genero: resUser.data.genero || '',
        ano_nascimento: resUser.data.ano_nascimento || '',
        n_carta_conducao: resUser.data.motorista?.n_carta_conducao || '',
        morada: resUser.data.motorista?.morada?.texto || '',
        senha_acesso_web: resUser.data.senha_acesso_web || ''
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

      const dadosParaEnviar = {
        ...formData,
        ano_nascimento: formData.ano_nascimento ? Number(formData.ano_nascimento) : undefined
      };

      const response = await axios.patch(`http://localhost:3000/api/user/`, dadosParaEnviar, {
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

  const gerarFatura = async(viagemId) => {
    try {
      const token = localStorage.getItem('token');

      try {
          setLoading(true);

          await axios.post(`http://localhost:3000/api/fatura/emitir`, 
            { viagemId: viagemId },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          alert("Fatura gerada com sucesso");
          fetchProfileData(token);
        } catch (err) {
          alert("Erro ao gerar fatura no servidor.");
        } finally {
          setLoading(false);
        }
    } catch (err) {
      alert("Erro ao gerar fatura.");
    }
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
    <div className="profile-page" style={{ backgroundImage: `url(${heroBg})` }}>
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

          {/* Dados pessoais */}
          <div className="profile-details">
            <div className="profile-field">
              <label>Nome</label>
              <input type="text" name="nome" value={formData.nome} onChange={handleInputChange}/>
            </div>
            <div className="profile-field">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
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
            <div className="profile-field">
              <label>Ano de Nascimento</label>
              <input type="number" name="ano_nascimento" min={new Date().getFullYear()-80} max={new Date().getFullYear()-18} minLength={4} maxLength={4} value={formData.ano_nascimento} onChange={handleInputChange}/>
            </div>
            <div className="profile-field">
              <label>Nº Carta de Condução</label>
              <input type="text" name="n_carta_conducao" value={formData.n_carta_conducao} onChange={handleInputChange} />
            </div>
            <div className="profile-field">
              <label>Morada</label>
              <input type="text" name="morada" value={formData.morada} onChange={handleInputChange} />
            </div>
          </div>

          <button className="profile-save-btn" onClick={handleSave}>Guardar Alterações</button>
        </div>

        {/* Histórico de viagens */}
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
                    <span className="trip-date">{new Date(v.hora_inicial_viagem).toLocaleDateString()} · {new Date(v.hora_inicial_viagem).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span className="trip-date">{v.km_percorridos}km · {v.n_passageiros} pax</span>
                    <span className="trip-price">{v.preco_viagem?.toFixed(2)}€</span>
                    {v.temFatura ? (
                    <span className="mh-hist-status">Concluída</span>
                    ) : (
                      <button
                        className="trip-invoice-btn"
                        onClick={() => gerarFatura(v._id)}
                      >
                        Gerar Fatura
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
