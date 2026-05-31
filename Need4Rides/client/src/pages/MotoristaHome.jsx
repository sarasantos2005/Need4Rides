import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import ddImg from '../assets/images/fennec.jpg';
import '../css/global.css';
import '../css/MotoristaHome.css';
import AvatarDropdown from '../components/AvatarDropdown';
import Loading from '../components/Loading';
import useMinLoading from '../hooks/useMinLoading';
import axios from 'axios';
import VEICULOS from "../../../server/data/marcasEmodelos";
import { io } from 'socket.io-client';
import { toastSucesso, toastErro, toastAviso, toastInfo, confirmar } from '../components/toast';
import useAuthGuard from '../hooks/authGuard';

function minutosAgora() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function formatHora(minutos) {
  const h = String(Math.floor(minutos / 60)).padStart(2, '0');
  const m = String(minutos % 60).padStart(2, '0');
  return `${h}:${m}`;
}

let coordsCache = null;
let coordsCacheTime = 0;
const COORDS_TTL = 30_000;

const getCoords = () =>
  new Promise((resolve, reject) => {
    const now = Date.now();
    if(coordsCache && now - coordsCacheTime < COORDS_TTL){
      return resolve(coordsCache);
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        coordsCache = pos.coords;
        coordsCacheTime = Date.now();
        resolve(pos.coords);
      },
      reject,
      {maximumAge: COORDS_TTL, timeout: 10_000}
    );
});

const apiFecthViagensPendentes = async(token, coords) => {
  const res = await axios.get(`http://localhost:3000/api/viagem/disponiveis`, {
    headers: { Authorization: `Bearer ${token}` }, 
    params: { lat: coords.latitude, lng: coords.longitude }, 
  });
  return res.data;
};

const apiFetchHistorico = async (token) => {
  const res = await axios.get(`http://localhost:3000/api/viagem/motorista`, config);
}

const fetchViagensPendentes = async (token, setViagensPendentes, setApiStatus) => {
  if (!token) { console.error("Token ausente"); return; }
  try {
    const { latitude, longitude } = await getCoords();
    const config = { headers: { Authorization: `Bearer ${token}` }, params: { lat: latitude, lng: longitude } };
    const res = await axios.get(`http://localhost:3000/api/viagem/disponiveis`, config);
    setViagensPendentes(res.data);
    setApiStatus(prev => ({ ...prev, trips: true }));
  } catch (err) {
    console.error("Erro ao procurar viagens pendentes", err.response?.data || err.message);
    setApiStatus(prev => ({ ...prev, trips: true }));
  }
};

const fetchHistorico = async (token, setHistorico, setApiStatus) => {
  if (!token) { console.error("Token ausente"); return; }
  try {
    const { latitude, longitude } = await getCoords();
    const config = { headers: { Authorization: `Bearer ${token}` }, params: { lat: latitude, lng: longitude } };
    const res = await axios.get(`http://localhost:3000/api/viagem/motorista`, config);
    setHistorico(res.data);
    setApiStatus(prev => ({ ...prev, historico: true }));
  } catch (err) {
    console.error("Erro ao procurar histórico", err.response?.data || err.message);
    setApiStatus(prev => ({ ...prev, historico: true }));
  }
};

const fetchTurnoAtual = async (token, setTurnoAtivo, setTaxi, setApiStatus) => {
  if (!token) { console.error("Token ausente"); return; }
  try {
    const { latitude, longitude } = await getCoords();
    const config = { headers: { Authorization: `Bearer ${token}` }, params: { lat: latitude, lng: longitude } };
    const res = await axios.get(`http://localhost:3000/api/turno/atual`, config);
    setTurnoAtivo(res.data);
    setApiStatus(prev => ({ ...prev, turno: true }));

    if (res.data && res.data.taxi) {
      setTaxi(res.data.taxi);
    }
    setApiStatus(prev => ({ ...prev, taxi: true, turno: true }));
  } catch (err) {
    console.error("Erro ao procurar turno atual", err.response?.data || err.message);
    setApiStatus(prev => ({ ...prev, taxi: true, turno: true }));
  }
};

const fetchTurnosAgendados = async (token, setTurnosAgendados) => {
    try {
      const res = await axios.get('http://localhost:3000/api/turno/futuros', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTurnosAgendados(res.data || []);
    } catch (err) {
      console.error("Erro ao carregar turnos agendados:", err);
    }
  };

export default function MotoristaHome() {
  useAuthGuard();
  const navigate = useNavigate();

  const [viagensPendentes, setViagensPendentes] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [turnoAtivo, setTurnoAtivo] = useState(null);
  const [loading, setLoading] = useMinLoading();
  const [menuOpen, setMenuOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState({
    user: false,
    taxi: false,
    turno: false,
    historico: false
  });
  const [agora, setAgora] = useState(minutosAgora());
  const [taxi, setTaxi] = useState(() => {
    const saved = localStorage.getItem('motoristataxi');
    return saved ? JSON.parse(saved) : null;
  });

  const [turnosAgendados, setTurnosAgendados] = useState([]);

  const [userData, setUserData] = useState(null);
  useEffect(() => {
    const storedUser = localStorage.getItem('user_logado');
    const token = localStorage.getItem('token');

    if (!token || !storedUser) {
      navigate('/login'); 
    } else {
      const user = JSON.parse(storedUser);
      setUserData(user);
      setApiStatus(prev => ({ ...prev, user: true }));

      const userId = user._id || user.id;
      if (userId && token) {
        Promise.all([
          fetchViagensPendentes(token, setViagensPendentes, setApiStatus),
          fetchHistorico(token, setHistorico, setApiStatus),
          fetchTurnoAtual(token, setTurnoAtivo, setTaxi, setApiStatus),
          fetchTurnosAgendados(token, setTurnosAgendados),
        ]);
      }
    }
  }, [navigate]);

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
      
      await Promise.all([
        fetchViagensPendentes(token, setViagensPendentes, setApiStatus),
        fetchHistorico(token, setHistorico, setApiStatus),
        fetchTurnoAtual(token, setTurnoAtivo, setTaxi, setApiStatus),
        fetchTurnosAgendados(token, setTurnosAgendados),
      ]);

      toastSucesso("Táxi devolvido com sucesso!");
    } catch (err) {
      console.error("Erro ao devolver táxi:", err);
      toastErro("Erro ao devolver o táxi na base de dados.");
    }
  };

  const aceitarViagem = async (viagemId) => {
    try {
      const token = localStorage.getItem('token');

      if(!turnoAtivo || !turnoAtivo._id){
        toastErro("Não podes aceitar viagens sem um turno ativo");
        return;
      }

      const response = await axios.patch(`http://localhost:3000/api/viagem/aceitar`, 
        { 
          viagemId: viagemId,
          turnoId: turnoAtivo._id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response) {
        setViagensPendentes(prev => prev.filter(p => p._id !== viagemId));
      }

      toastSucesso(response.data.message);

      // Refresh aos dados
      await Promise.all([
        fetchViagensPendentes(token, setViagensPendentes, setApiStatus),
        fetchHistorico(token, setHistorico, setApiStatus),
        fetchTurnoAtual(token, setTurnoAtivo, setTaxi, setApiStatus),
        fetchTurnosAgendados(token, setTurnosAgendados),
      ]);
    } catch (err) {
      toastErro("Erro ao aceitar viagem");
    }
  };

  const recusarViagem = async (viagemId) => {
    try {
      const token = localStorage.getItem('token');

      if(!turnoAtivo || !turnoAtivo._id){
        toastErro("Não podes aceitar viagens sem um turno ativo");
        return;
      }

      const response = await axios.patch(`http://localhost:3000/api/viagem/recusar`, 
        { 
          viagemId: viagemId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toastSucesso(response.data.message);

      setViagensPendentes(prev => prev.filter(p => p._id !== viagemId));

      // Refresh aos dados
      await Promise.all([
        fetchViagensPendentes(token, setViagensPendentes, setApiStatus),
        fetchHistorico(token, setHistorico, setApiStatus),
        fetchTurnoAtual(token, setTurnoAtivo, setTaxi, setApiStatus),
        fetchTurnosAgendados(token, setTurnosAgendados),
      ]);
    } catch (err) {
      toastErro("Erro ao aceitar viagem");
    }
  };

  const handleAlterarTurno = async() => {
    try {
      const token = localStorage.getItem('token');

      if(turnoAtivo && turnoAtivo.estado === "Ativo"){
         const result = await confirmar(
          "Deseja encerrar o seu turno agora?",
          "Esta ação é irreversível."
        );

        if (!result.isConfirmed) return;

        try {

          await axios.patch(`http://localhost:3000/api/turno/finalizar`, 
            { turnoId: turnoAtivo._id },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          setTurnoAtivo(null);
          devolverTaxi();
          setViagensPendentes([]);
          localStorage.removeItem('motoristataxi');
        
          toastSucesso("Turno encerrado com sucesso. Bom descanso!");
        } catch (err) {
          console.error("Erro ao finalizar turno:", err);
          toastErro("Erro ao encerrar o turno no servidor.");
        } finally {
          setLoading(false);
        }
      } else {
        navigate("/motorista/turno");
      }
    } catch (err) {
      toastErro("Erro ao alterar estado do turno.");
    }
  }

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
  });

  useEffect(() => {
    if (!turnoAtivo || !restanteMs) return;

    if (restanteMs <= 0) {
      localStorage.removeItem('motoristataxi');
      setTaxi(null);
      setTurnoAtivo(null);
      setViagensPendentes([]);
      toastAviso("O teu turno expirou. Bom descanso!");
      return;
    }

    const timer = setTimeout(() => {
      localStorage.removeItem('motoristataxi');
      setTaxi(null);
      setTurnoAtivo(null);
      setViagensPendentes([]);
      toastAviso("O teu turno terminou automaticamente. Bom descanso!");
    }, restanteMs);

    return () => clearTimeout(timer);
  }, [turnoAtivo, restanteMs]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !userData) return;

    const socket = io('http://localhost:3000', { auth: { token } });

    socket.on('connect', () => {
      const userId = userData._id || userData.id;

      socket.emit('registar_motorista_user', userId);
    });

    if (turnoAtivo?._id) {
      socket.emit('entrar_motorista', turnoAtivo._id);
    }

    socket.on('turno_iniciado_automatico', (turnoAtualizado) => {
      toastSucesso("O teu turno agendado começou! Estás em serviço.");
      setTurnoAtivo(turnoAtualizado);
      if (turnoAtualizado.taxi) {
        setTaxi(turnoAtualizado.taxi);
        localStorage.setItem('motoristataxi', JSON.stringify(turnoAtualizado.taxi));
      }

      setTurnosAgendados(prev => prev.filter(t => t._id !== turnoAtualizado._id));
    });

    socket.on('novo_pedido', (pedido) => {
      setViagensPendentes(prev => {
        const jaExiste = prev.some(p => p._id === pedido._id);
        if (jaExiste) return prev;
        return [pedido, ...prev].slice(0, 5);
      });
    });
    
    socket.on('pedido_removido', (viagemId) => {
      setViagensPendentes(prev => prev.filter(p => p._id !== viagemId));
    });

    return () => socket.disconnect();
  }, [turnoAtivo?._id, userData]);

  //Encontrar os dados da marca (id no marcasEModelos = marca na BD)
  const getDadosMarca = (idBD) => {
    const marcaEncontrada = VEICULOS.marcas.find(m => m.id === idBD);
    return marcaEncontrada ? marcaEncontrada.nome : idBD;
  };

  const gerarFatura = async(viagemId) => {
    try {
      const token = localStorage.getItem('token');

      try {

          await axios.post(`http://localhost:3000/api/fatura/emitir`, 
            { viagemId: viagemId },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          toastSucesso("Fatura gerada com sucesso");
          await Promise.all([
            fetchViagensPendentes(token, setViagensPendentes, setApiStatus),
            fetchHistorico(token, setHistorico, setApiStatus),
            fetchTurnoAtual(token, setTurnoAtivo, setTaxi, setApiStatus),
            fetchTurnosAgendados(token, setTurnosAgendados),
          ]);
        } catch (err) {
          toastErro("Erro ao gerar fatura no servidor.");
        } finally {
          setLoading(false);
        }
    } catch (err) {
      toastErro("Erro ao gerar fatura.");
    }
  }

  /*Tema */
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


  const USERNAME = JSON.parse(localStorage.getItem("user_logado")).nome;
  
  return (
    <>
    {loading && (
          <Loading 
            tasks={Object.values(apiStatus)} 
            onFinished={() => setLoading(false)} 
          />
        )}
    {userData && (
    <div className="mh-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="mh-overlay" />

      <nav className="gb-navbar">
        
        <span className="gb-logo">Need4Rides</span>

        {/* BOTÃO HAMBURGUER */}
        <div 
          className={`gb-hamburger ${menuOpen ? 'open' : ''}`} 
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        <ul className={`gb-nav-links ${menuOpen ? 'active' : ''}`}>
          <li className="gb-profile-li avatarHamburguer">
            <AvatarDropdown profilePath="/motorista/perfil" avatarClass="gb-avatar" />
            <span className="gb-profile-pill-name">{USERNAME}</span>
          </li>

          <li><a className="active">Dashboard</a></li>

          <li><a onClick={() => navigate('/motorista/reabastecimento')}>Reabastecimento</a></li>
          <li><a onClick={() => navigate('/motorista/historico')}>Histórico</a></li>
          <li><a onClick={() => navigate('/motorista/relatorio')}>Relatório</a></li>
          <li><a onClick={() => navigate('/motorista/suporte')}>Suporte</a></li>
          <li><a onClick={() => navigate('/motorista/viagem')}>Viagem</a></li>

          <li>
            <button className="gb-theme-btn" onClick={alternarTema}>
              {tema === 'escuro' ? '☀️ Claro' : '🌙 Escuro'}
            </button>
          </li>

          <li className="gb-profile-li avatarNormal">
            <div className="gb-profile-pill">
              <span className="gb-profile-pill-name">{USERNAME}</span>
              <AvatarDropdown profilePath="/motorista/perfil" avatarClass="gb-avatar" />
            </div>
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
              <span className={`mh-status-badge ${turnoAtivo ? 'online' : 'offline'}`}>
                {turnoAtivo ? '● Em turno' : '○ Fora de turno'}
              </span>
            </div>
          </div>
          <button
            className={`mh-turno-btn ${turnoAtivo ? 'end' : 'start'}`}
            onClick={handleAlterarTurno}
          >
            {turnoAtivo ? 'Terminar Turno' : 'Iniciar Novo Turno'}
          </button>

          {turnoAtivo && turnoAtivo.estado === "Ativo" && (
            <button 
              className="mh-turno-btn schedule"
              onClick={() => navigate("/motorista/turno")}
            >
              📅 Agendar turno futuro
            </button>
          )}
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
          {turnoAtivo && (
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
          )}

          {/* ── Tempo de turno ── */}
          {turnoAtivo  && (
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
          )}

        </div>

        <div className="mh-card">
          <div className="mh-historico-section" style={{ marginBottom: '20px' }}>
            <div className="mh-historico-header">
              <h3>Próximos Turnos Agendados</h3>
            </div>
            
            <div className="mh-historico-list mh-agendados-list">
              {turnosAgendados.length > 0 ? (
                turnosAgendados.map(turno => (
                  <div className="mh-pedido-card mh-agendado-card-row" key={turno._id}>
                    
                    <div className="mh-agendado-tempo-block">
                      <span className="mh-agendado-date-txt">
                        {new Date(turno.hora_inicio).toLocaleDateString('pt-PT')}
                      </span>
                      <div className="mh-agendado-hours-txt">
                        <span>{new Date(turno.hora_inicio).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="mh-text-ate-split"> até </span>
                        <span>{new Date(turno.hora_fim).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {turno?.taxi ? (
                      <>
                        <div className="mh-pedido-meta mh-agendado-meta-car">
                          <span className="mh-agendado-car-name">
                            {getDadosMarca(turno.taxi.marca)} {turno.taxi.modelo}
                          </span>
                          <span className="mh-agendado-car-plate">
                            {turno.taxi.matricula}
                          </span>
                        </div>

                        <div className="mh-pedido-actions mh-agendado-actions-badges">
                          <span className={`mh-badge-pill ${turno.taxi.tipo_motor === 'Elétrico' ? 'eletrico' : 'combustao'}`}>
                            {turno.taxi.tipo_motor}
                          </span>
                          <span className="mh-badge-pill conforto">
                            {turno.taxi.nivel_conforto}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="mh-pedido-meta mh-no-car-allocated">
                        Sem veículo alocado
                      </div>
                    )}

                  </div>
                ))
              ) : (
                <p className="mh-no-data">Não tens nenhum turno agendado para os próximos tempos.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Pedidos pendentes ── */}
        {(taxi && turnoAtivo) && (
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
                  <span className="mh-pedido-wait">{p.duracao_calculada && "⏱ " + p.duracao_calculada + " min"}</span>
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
        )}

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
                  {v.temFatura ? (
                    <span className="mh-hist-status">Concluída</span>
                  ) : (
                    <span
                      className="trip-invoice-btn"
                      onClick={() => gerarFatura(v._id)}
                    >
                      Gerar Fatura
                    </span>
                  )}
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
    )};
    </>
  );
}