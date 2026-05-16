import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/AguardarTaxi.css';
import ddImg from '../assets/images/fennec.jpg';
import AvatarDropdown from '../components/AvatarDropdown';
import axios from "axios";
import '../css/global.css';
const DOTS = [
  'A procurar motoristas',
  'A procurar motoristas.',
  'A procurar motoristas..',
  'A procurar motoristas...'
];

export default function AguardarTaxi() {
  const navigate = useNavigate();
  const [viagemId, setViagemId] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('viagemAtiva'));
    if (!stored?.viagemId) { navigate('/pedir-taxi'); return; }

    setViagemId(stored.viagemId);

    const onStorage = () => {
      const atualizada = JSON.parse(localStorage.getItem('viagemAtiva'));
      if (atualizada?.motorista) {
        setDriver(atualizada.motorista);
        setStatus('aguardandoConfirmacao');
      }
    };

    console.log(status);

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  
  const viagemAtiva = JSON.parse(localStorage.getItem('viagemAtiva')); 

  const form = viagemAtiva?.form ?? {
    origem: { morada: '', localizacao: null },
    destino: { morada: '', localizacao: null },
    passengers: 1,
    comfort: ''
  };

  const estimate = viagemAtiva?.estimate ?? {
    km: '--',
    price: '--',
    wait: '--'
  };
  
  const tripAtiva = JSON.parse(localStorage.getItem('viagemAtiva'));
  const [dotIdx, setDotIdx] = useState(0);
  const [status, setStatus] = useState(tripAtiva ? tripAtiva.status : "procurando");
  const [condutor, setDriver] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [userData, setUserData] = useState(null);
  

  const [tema, setTema] = useState(() => {
    return localStorage.getItem('tema') || 'escuro';
  });

  useEffect(() => {
    document.body.className = tema;
  }, [tema]);
  const [menuOpen, setMenuOpen] = useState(false);
  const alternarTema = () => {
    setTema(prev => (prev === 'escuro' ? 'claro' : 'escuro'));
  };

  /* buscar user */
  useEffect(() => {
    const storedUser = localStorage.getItem('user_logado');
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }
  }, []);

  /* animação dots */
  useEffect(() => {
    const t = setInterval(() => setDotIdx(i => (i + 1) % DOTS.length), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (status !== 'procurando') return;
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  // /* simulação */
  // useEffect(() => {
  //   const t = setTimeout(() => setFound(true), 8000);
  //   return () => clearTimeout(t);
  // }, []);

  useEffect(() => {
    const onStorage = () => {
      const atualizada = JSON.parse(localStorage.getItem('viagemAtiva'));
      if (atualizada) {
        if (atualizada.motorista) setDriver(atualizada.motorista);
        if (atualizada.status) setStatus(atualizada.status);
        
        if (atualizada.status === 'emCurso' || atualizada.status === 'aguardandoInicio') {
          navigate("/viagem");
        }
      }
    };

    window.addEventListener('storage', onStorage);
    onStorage(); 

    return () => window.removeEventListener('storage', onStorage);
  }, [navigate]);

  useEffect(() => {
  const checkStatus = () => {
    const ativa = JSON.parse(localStorage.getItem('viagemAtiva'));
    if (ativa?.motorista) {
      setDriver(ativa.motorista); 
      setStatus('aguardandoConfirmacao');
    }
  };

  window.addEventListener('storage', checkStatus);
  checkStatus(); 
  return () => window.removeEventListener('storage', checkStatus);
}, []);

  const handleConfirmacao = async(aceite) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:3000/api/viagem/confirmar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          viagemId: viagemId, 
          confirma: aceite,
          motoristaId: condutor?._id
        })
      });

      if(aceite) {
        setStatus("aguardandoInicio");
      } else {
        setStatus("procurando");
        setDriver(null);
        const ativa = JSON.parse(localStorage.getItem('viagemAtiva'));
        localStorage.setItem('viagemAtiva', JSON.stringify({ ...ativa, motorista: null }))
      }
    } catch (err) {
      console.error("Erro ao confirmar:", err);
    }
  }

  const handleCancelar = async() => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:3000/api/viagem/cancelar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          viagemId: viagemId
        })
      });

      if(response.ok) {
        localStorage.removeItem("viagemAtiva");
        setViagemId(null);
        navigate('/pedir-taxi');
      }

    }  catch (err) {
      console.error("Erro ao cancelar viagem:", err);
    }
  }

  const fmt = s =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const USERNAME = JSON.parse(localStorage.getItem("user_logado")).nome;

  return (
    <div className="agt-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="agt-overlay" />

      <nav className="agt-navbar">
        <span className="agt-logo" onClick={() => navigate('/home')}>
          Need4Rides
        </span>

        {/* HAMBURGER */}
        <div 
          className={`agt-hamburger ${menuOpen ? 'open' : ''}`} 
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* LINKS */}
        <ul className={`agt-nav-links ${menuOpen ? 'active' : ''}`}>
          <li className="mh-profile-li avatarHamburguer">
            <AvatarDropdown profilePath="/gestor/perfil" avatarClass="mh-avatar" />
            <span className="mh-profile-pill-name">{USERNAME}</span>
          </li>
          <li><a onClick={() => navigate('/home')}>Home</a></li>
          <li><a onClick={() => navigate('/pedir-taxi')}>Pedir Táxi</a></li>

          <li>
            <button className="agt-theme-btn" onClick={alternarTema}>
              {tema === 'escuro' ? '☀️ Claro' : '🌙 Escuro'}
            </button>
          </li>

          <li className="mh-profile-li avatarNormal">
            <div className="mh-profile-pill">
              <span className="mh-profile-pill-name">{USERNAME}</span>
              <AvatarDropdown profilePath="/gestor/perfil" avatarClass="mh-avatar" />
            </div>
          </li>
        </ul>
      </nav>

      <div className="agt-wrapper">

        {/* Status */}
        <div className="agt-status-card">
          {status === "procurando" && (
            <div className="agt-searching">
              <div className="agt-spinner-ring">
                <div className="agt-spinner" />
                <div className="agt-spinner-icon">🚖</div>
              </div>

              <h2>{DOTS[dotIdx]}</h2>
              <p>
                Tempo de espera estimado: <strong>{estimate.tempoMedio} min</strong>
              </p>
              <span className="agt-timer">{fmt(seconds)}</span>
            </div>
          )}

          {status === "aguardandoConfirmacao" && (
            <div className="agt-found">
              <div className="agt-found-icon">✓</div>
              <h2>Motorista Encontrado!</h2>
              <p>O motorista <strong>{condutor?.nome}</strong> aceitou o pedido.</p>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button className="agt-btn-primary" onClick={() => handleConfirmacao(true)}>
                  Aceitar
                </button>
                <button className="agt-btn-cancel" onClick={() => handleConfirmacao(false)}>
                  Rejeitar
                </button>
              </div>
            </div>
          )}

          {status === "aguardandoInicio" && (
            <div className="agt-found">
              <div className="agt-found-icon">✓</div>
                <h2>Viagem Confirmada!</h2>
                <p>O teu táxi está a caminho</p>
                <button
                  className="agt-btn-primary"
                  onClick={() =>
                    navigate('/viagem')
                  }
                >
                  Ver Viagem
                </button>
              </div>
          )}
        </div>

        <div className="agt-bottom">

          {/* Detalhes */}
          <div className="agt-details-card">
            <h3>Detalhes da Viagem</h3>

            <div className="agt-route">
              <div className="agt-point">
                <span className="agt-dot origin" />
                <div>
                  <span className="agt-point-label">Origem</span>
                  <span className="agt-point-value">{form.origem.morada}</span>
                </div>
              </div>

              <div className="agt-route-line" />

              <div className="agt-point">
                <span className="agt-dot dest" />
                <div>
                  <span className="agt-point-label">Destino</span>
                  <span className="agt-point-value">{form.destino.morada}</span>
                </div>
              </div>
            </div>

            <div className="agt-divider" />

            <div className="agt-meta-grid">
              <div className="agt-meta-item">
                <span className="agt-meta-label">Passageiros</span>
                <span className="agt-meta-value">{form.passengers}</span>
              </div>

              <div className="agt-meta-item">
                <span className="agt-meta-label">Distância</span>
                <span className="agt-meta-value">{estimate.km} km</span>
              </div>

              <div className="agt-meta-item">
                <span className="agt-meta-label">Preço Est.</span>
                <span className="agt-meta-value highlight">
                  €{estimate.price}
                </span>
              </div>

              <div className="agt-meta-item">
                <span className="agt-meta-label">Tempo de viagem</span>
                <span className="agt-meta-value">{estimate.wait} min</span>
              </div>
            </div>

            <button
              className="agt-btn-cancel"
              onClick={handleCancelar}
            >
              Cancelar Viagem
            </button>
          </div>

          {/* Mapa */}
          <div className="agt-map-placeholder">
            <div className="agt-map-inner">
              <span>Mapa em tempo real</span>
              <p>Integração em breve</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}