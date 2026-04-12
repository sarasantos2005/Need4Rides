import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import ddImg from '../assets/images/fennec.jpg';
import '../css/MotoristaHome.css';
import AvatarDropdown from '../components/AvatarDropdown';
import axios from 'axios';
import VEICULOS from "../../../server/data/marcasEmodelos";

function minutosAgora() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function formatHora(minutos) {
  const h = String(Math.floor(minutos / 60)).padStart(2, '0');
  const m = String(minutos % 60).padStart(2, '0');
  return `${h}:${m}`;
}

export default function MotoristaHome() {
  const navigate = useNavigate();

  const [viagensPendentes, setViagensPendentes] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [turnoAtivo, setTurnoAtivo] = useState(null);
  const [loading, setLoading] = useState(true);

  const [emTurno, setEmTurno] = useState(true);
  const [agora, setAgora] = useState(minutosAgora());
  const [taxi, setTaxi] = useState(() => {
    const saved = localStorage.getItem('motoristataxi');
    return saved ? JSON.parse(saved) : null;
  });

  const [userData, setUserData] = useState(null);
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
        fetchDadosIniciais(token);
      }
    }
  }, [navigate]);

  const fetchDadosIniciais = async (token) => {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      if (!token) {
        console.error("Token ausente");
        return;
      }
      try {
        setLoading(true);
        
        const config = { headers: { Authorization: `Bearer ${token}` }, params: { lat: latitude, lng: longitude } };
        
      const [resPendentes, resHistorico, resTurno] = await Promise.all([
        axios.get(`http://localhost:3000/api/viagem/disponiveis`, config),
        axios.get(`http://localhost:3000/api/viagem/motorista`, config),
        axios.get(`http://localhost:3000/api/turno/atual`, config)
      ]);

        setViagensPendentes(resPendentes.data);
        setHistorico(resHistorico.data);
        setTurnoAtivo(resTurno.data);
        if (resTurno.data && resTurno.data.taxi) {
          setTaxi(resTurno.data.taxi);
        }
      } catch (err) {
        console.error("Erro ao procurar dados na BD", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error("Erro ao obter GPS:", error);
    });
  };

  //Estatisticas diarias
  const viagensHoje = historico.filter(v => {
    const dataViagem = new Date(v.hora_inicial_viagem).toDateString();
    const hoje = new Date().toDateString();
    return dataViagem === hoje;
  });

  const ganhosHoje = viagensHoje.reduce((acc, v) => acc + (v.preco_viagem || 0), 0);

  const kmHoje = viagensHoje.reduce((acc, v) => acc + (v.km_percorridos || 0), 0);

  //---------------------------------------------------------------------------------------
  //Parte do turno
  const agoraDate = new Date();

  const fimTurno = turnoAtivo ? new Date(turnoAtivo.hora_fim) : null;
  const inicioTurno = turnoAtivo ? new Date(turnoAtivo.hora_inicio) : null;

  const temTurnoValido = inicioTurno && !isNaN(inicioTurno) && fimTurno && !isNaN(fimTurno);

  const totalMs = temTurnoValido ? (fimTurno - inicioTurno) : 0;
  const decorridoMs = temTurnoValido ? (agoraDate - inicioTurno) : 0;
  const restanteMs = temTurnoValido ? (fimTurno - agoraDate) : 0;

  const minutosRestantesReal = Math.max(0, Math.floor(restanteMs / (1000 * 60)));
  const progressoReal = (temTurnoValido && totalMs > 0) ? Math.min(100, Math.max(0, (decorridoMs/totalMs) * 100)) : 0;

  const formatarParaExibicao = (date) => {
    if (!date) return "00:00";
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  //---------------------------------------------------------------------------------------

  const devolverTaxi = async () => {
    if (!turnoAtivo) return;

    try {
      const token = localStorage.getItem('token');
      
      // Chamada ao backend para limpar o taxi no turno
      await axios.patch('http://localhost:3000/api/turno/devolver', 
        { turnoId: turnoAtivo._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.removeItem('motoristataxi');
      setTaxi(null);
      
      const userId = userData._id || userData.id;
      fetchDadosIniciais(userId, token);

      alert("Táxi devolvido com sucesso!");
    } catch (err) {
      console.error("Erro ao devolver táxi:", err);
      alert("Erro ao devolver o táxi na base de dados.");
    }
  };

  const aceitarViagem = async (viagemId) => {
    try {
      const token = localStorage.getItem('token');

      if(!turnoAtivo || !turnoAtivo._id){
        alert("Não podes aceitar viagens sem um turno ativo");
        return;
      }

      const response = await axios.patch(`http://localhost:3000/api/viagem/aceitar`, 
        { 
          viagemId: viagemId,
          turnoId: turnoAtivo._id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(response.data.message);

      // Refresh aos dados
      fetchDadosIniciais(token);
    } catch (err) {
      alert("Erro ao aceitar viagem");
    }
  };

  const recusarViagem = async (viagemId) => {
    try {
      const token = localStorage.getItem('token');

      if(!turnoAtivo || !turnoAtivo._id){
        alert("Não podes aceitar viagens sem um turno ativo");
        return;
      }

      const response = await axios.patch(`http://localhost:3000/api/viagem/recusar`, 
        { 
          viagemId: viagemId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(response.data.message);

      // Refresh aos dados
      fetchDadosIniciais(token);
    } catch (err) {
      alert("Erro ao aceitar viagem");
    }
  };

  useEffect(() => {
    const onStorage = () => {
      const saved = localStorage.getItem('motoristataxi');
      setTaxi(saved ? JSON.parse(saved) : null);
    };
    window.addEventListener('storage', onStorage);
    onStorage();
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setAgora(minutosAgora()), 60000);
    return () => clearInterval(t);
  }, []);

  //Encontrar os dados da marca (id no marcasEModelos = marca na BD)
  const getDadosMarca = (idBD) => {
    const marcaEncontrada = VEICULOS.marcas.find(m => m.id === idBD);
    return marcaEncontrada ? marcaEncontrada.nome : idBD;
  };

  if (loading || !userData) return <div className="mh-loading">A carregar...</div>;

  return (
    <div className="mh-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="mh-overlay" />

      {/* Navbar */}
      <nav className="mh-navbar">
        <span className="mh-logo">Need4Rides</span>
        <ul className="mh-nav-links">
          <li><a className="active">Dashboard</a></li>
          <li><a onClick={() => navigate('/motorista/reabastecimento')} style={{ cursor: 'pointer' }}>Registar Reabastecimento</a></li>
          <li><a onClick={() => navigate('/motorista/historico')} style={{ cursor: 'pointer' }}>Histórico</a></li>
          <li><a onClick={() => navigate('/motorista/suporte')} style={{ cursor: 'pointer' }}>Suporte</a></li>
          <li><a onClick={() => navigate('/motorista/viagem')} style={{ cursor: 'pointer' }}>Viagem</a></li>
          <li>
            <AvatarDropdown profilePath="/motorista/perfil" avatarClass="mh-avatar" />
          </li>
        </ul>
      </nav>

      <div className="mh-wrapper">

        {/* ── Cabeçalho de boas-vindas ── */}
        <div className="mh-welcome">
          <div className="mh-welcome-left">
            <div className="mh-welcome-avatar-ring">
              <img src={ddImg} alt="Motorista" />
            </div>
            <div>
              <p className="mh-welcome-sub">Bem-vindo de volta,</p>
              <h1 className="mh-welcome-name">{userData.nome.split(' ')[0]}</h1>
              <span className={`mh-status-badge ${emTurno ? 'online' : 'offline'}`}>
                {emTurno ? '● Em turno' : '○ Fora de turno'}
              </span>
            </div>
          </div>
          <button
            className={`mh-turno-btn ${emTurno ? 'end' : 'start'}`}
            onClick={() => setEmTurno(t => !t)}
          >
            {emTurno ? 'Terminar Turno' : 'Entrar em Turno'}
          </button>
        </div>

        {/* ── Stats rápidos ── */}
        <div className="mh-stats-row">
          <div className="mh-stat-card">
            <span className="mh-stat-label">Turno</span>
            <span className="mh-stat-value">{turnoAtivo 
        ? `${new Date(turnoAtivo.hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} – ${new Date(turnoAtivo.hora_fim).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
        : "Sem turno"}</span>
          </div>
          <div className="mh-stat-card">
            <span className="mh-stat-label">Viagens hoje</span>
            <span className="mh-stat-value">{viagensHoje.length}</span>
          </div>
          <div className="mh-stat-card accent">
            <span className="mh-stat-label">Ganhos hoje</span>
            <span className="mh-stat-value">{ganhosHoje.toFixed(2)}€</span>
          </div>
          <div className="mh-stat-card">
            <span className="mh-stat-label">Km percorridos</span>
            <span className="mh-stat-value">{kmHoje.toFixed(1)}km</span>
          </div>
        </div>

        <div className="mh-middle-row">

          {/* ── Info do carro ── */}
          <div className="mh-card mh-car-card">
            <h3 className="mh-card-title">Veículo</h3>
            {taxi ? (
              <>
                <div className="mh-car-grid">
                  <div className="mh-car-item">
                    <span className="mh-car-label">Matrícula</span>
                    <span className="mh-car-value">{taxi.matricula}</span>
                  </div>
                  <div className="mh-car-item">
                    <span className="mh-car-label">Marca e Modelo</span>
                    <span className="mh-car-value">{getDadosMarca(taxi.marca)} {taxi.modelo}</span>
                  </div>
                  <div className="mh-car-item">
                    <span className="mh-car-label">Tipo</span>
                    <span className="mh-car-value">{taxi.tipo_motor}</span>
                  </div>
                  <div className="mh-car-item">
                    <span className="mh-car-label">Conforto</span>
                    <span className="mh-car-value">{taxi.nivel_conforto}</span>
                  </div>
                </div>
                <div className="mh-fuel-row">
                  <span className="mh-car-label">Combustível / Carga</span>
                  <span className="mh-car-label">{taxi.nivel_combustivel_carga}%</span>
                </div>
                <div className="mh-fuel-bar-bg">
                  <div className="mh-fuel-bar" style={{ width: `${taxi.nivel_combustivel_carga}%` }} />
                </div>
                <div className="mh-reab-row">
                  <span className="mh-car-label">Autonomia Máxima</span>
                  <span className="mh-reab-val">≈ {taxi.autonomia_maxima} km</span>
                </div>
                <button className="mh-btn-requisitar" style={{ marginTop: '1rem' }}
                  onClick={devolverTaxi}>
                  Devolver Táxi
                </button>
              </>
            ) : (
              <div className="mh-no-taxi">
                <p>Nenhum táxi requisitado</p>
                <button className="mh-btn-requisitar" onClick={() => navigate('/motorista/requisitar-taxi')}>
                  Requisitar Táxi
                </button>
              </div>
            )}
          </div>

          {/* ── Tempo de turno ── */}
          <div className="mh-card mh-turno-card">
            <h3 className="mh-card-title">Tempo de Turno</h3>
            <div className="mh-turno-circle-wrap">
              <svg className="mh-turno-ring" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" className="mh-ring-bg" />
                <circle
                  cx="60" cy="60" r="50"
                  className="mh-ring-fill"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - progressoReal / 100)}`}
                />
              </svg>
              <div className="mh-turno-center">
                <span className="mh-turno-min">{minutosRestantesReal}</span>
                <span className="mh-turno-min-label">min restantes</span>
              </div>
            </div>
            <div className="mh-turno-times">
              <div className="mh-turno-time-item">
                <span className="mh-car-label">Início</span>
                <span className="mh-turno-time-val">{formatarParaExibicao(inicioTurno)}</span>
              </div>
              <div className="mh-turno-progress-pct">{Math.round(progressoReal)}% concluído</div>
              <div className="mh-turno-time-item right">
                <span className="mh-car-label">Fim</span>
                <span className="mh-turno-time-val">{formatarParaExibicao(fimTurno)}</span>
              </div>
            </div>
            <div className="mh-progress-bar-bg">
              <div className="mh-progress-bar" style={{ width: `${progressoReal}%` }} />
            </div>
          </div>

        </div>

        {/* ── Pedidos pendentes ── */}
        <div className="mh-card">
          <div className="mh-section-header">
            <h3 className="mh-card-title">Pedidos Pendentes</h3>
            <span className="mh-badge">{viagensPendentes.length}</span>
          </div>
          <div className="mh-pendentes-list">
            {viagensPendentes.length > 0 ? (
              viagensPendentes.map(p => (
              <div className="mh-pedido-card" key={p._id}>
                <div className="mh-pedido-route">
                  <div className="mh-pedido-point">
                    <span className="mh-dot origin" />
                    <span>{p.morada_inicial_viagem?.morada}</span>
                  </div>
                  <div className="mh-pedido-line" />
                  <div className="mh-pedido-point">
                    <span className="mh-dot dest" />
                    <span>{p.morada_final_viagem?.morada}</span>
                  </div>
                </div>
                <div className="mh-pedido-meta">
                  <span>{p.dist}</span>
                  <span>{p.n_passageiros} pax</span>
                  <span className="mh-pedido-wait">⏱ {p.duracao_calculada} min</span>
                  <span className="mh-pedido-price">{p.preco_viagem?.toFixed(2)}</span>
                </div>
                <div className="mh-pedido-actions">
                  <button className="mh-btn-recusar" onClick={() => recusarViagem(p._id)}>Recusar</button>
                  <button className="mh-btn-aceitar" onClick={() => aceitarViagem(p._id)}>Aceitar</button>
                </div>
              </div>
            ))
          ) : (
            <p className="mh-no-data">Não há pedidos na sua zona.</p>
          )}
          </div>
        </div>

        {/* ── Histórico de viagens ── */}
        <div className="mh-card">
          <div className="mh-section-header">
            <h3 className="mh-card-title">Histórico de Viagens</h3>
            {historico.length > 5 && (
            <button className="mh-ver-historico-btn" onClick={() => navigate('/motorista/historico')}>
              Ver Histórico Completo
            </button>
            )}
          </div>
          <div className="mh-historico-list">
            {historico.length > 0 ? (
            historico.slice(0,5).map(v => (
              <div className="mh-hist-row" key={v._id}>
                <div className="mh-hist-route">
                  <span className="mh-hist-from">{v.morada_inicial_viagem.morada}</span>
                  <span className="mh-hist-arrow">→</span>
                  <span className="mh-hist-to">{v.morada_final_viagem.morada}</span>
                </div>
                <div className="mh-hist-meta">
                  <span>{v.hora_inicial_viagem ? new Date(v.hora_inicial_viagem).toLocaleTimeString() : 'Sem data'}</span>
                  <span className="mh-hist-status">Concluída</span>
                  <span className="mh-hist-price">{v.preco_viagem?.toFixed(2)}€</span>
                </div>
              </div>
            ))
            ) : (
              <p className="mh-no-data">Ainda não realizou nenhuma viagem.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
