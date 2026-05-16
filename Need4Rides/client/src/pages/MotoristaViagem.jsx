import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/MotoristaViagem.css';
import AvatarDropdown from '../components/AvatarDropdown';
import axios from 'axios';
import React from 'react';
import L from "leaflet";
import "leaflet-routing-machine";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import '../css/global.css';
import { toastSucesso, toastErro, toastAviso, toastInfo, confirmar } from '../components/toast';

const STAGES = ['A aguardar motorista', 'Motorista a caminho', 'Em viagem', 'Concluída'];

const getDadosMarca = (idBD) => {
  const marcaEncontrada = VEICULOS.marcas.find(m => m.id === idBD);
  return marcaEncontrada ? marcaEncontrada.nome : idBD;
};

function MapController() {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.invalidateSize();
    }
  }, [map]);
  return null;
}

function RoutingMachine({ origin, destination }) {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map || !origin || !destination) return;

    if (!routingControlRef.current) {
      const control = L.Routing.control({
        waypoints: [
          L.latLng(origin[0], origin[1]),
          L.latLng(destination[0], destination[1])
        ],
        lineOptions: { styles: [{ color: "#3388ff", weight: 4 }] },
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        show: false
      });
      
      control.addTo(map);
      routingControlRef.current = control;
    } else {
      routingControlRef.current.setWaypoints([
        L.latLng(origin[0], origin[1]),
        L.latLng(destination[0], destination[1])
      ]);
    }

    return () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
    };
  }, [map, origin, destination]);

  return null;
}

const StaticMap = React.memo(({origin, destination}) => {
  return (
    <MapContainer center={origin} zoom={13} style={{ height: "100%", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapController />
      <Marker position={origin} />
      <Marker position={destination} />
      <RoutingMachine origin={origin} destination={destination} />
    </MapContainer>
  );
  }, (prevProps, nextProps) => {
  return prevProps.origin[0] === nextProps.origin[0] && 
         prevProps.origin[1] === nextProps.origin[1] &&
         prevProps.destination[0] === nextProps.destination[0] &&
         prevProps.destination[1] === nextProps.destination[1];
});

const STATUSES_PERMITIDOS = ['aguardandoInicio', 'emCurso'];

function formatTime(s) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}


export default function MotoristaViagem() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState('aguardandoInicio'); 
  const [segundos, setSegundos] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [tripAtiva, setTripAtiva] = useState(null);

  const pollingRef = useRef(null);
  const timerRef = useRef(null);
  const [estimate, setEstimate] = useState(null);
  const [tabelaPrecos, setTabelaPrecos] = useState(null);

  const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'escuro');

  useEffect(() => {
    document.body.className = tema;
    localStorage.setItem('tema', tema);
  }, [tema]);

  const alternarTema = () => setTema(prev => (prev === 'escuro' ? 'claro' : 'escuro'));

  useEffect(() => {
    axios.get('http://localhost:3000/api/preco')
    .then(res => setTabelaPrecos(res.data))
  }, []);

  useEffect(() => {
    const armazenado = JSON.parse(localStorage.getItem('viagemAtivaMotorista'));
 
    if (!armazenado?.viagemId) {
      navigate('/motorista');
      return;
    }
 
    const { viagemId } = armazenado;
    
    setTripAtiva({
      id:          armazenado.viagemId,
      from:        armazenado.viagem.origem,
      to:          armazenado.viagem.destino,
      dist:        `${armazenado.viagem.km ?? '—'} km`,
      price:       `€${armazenado.viagem.preco ?? '—'}`,
      passengers:  armazenado.viagem.passageiros ?? '—',
      clientName:  armazenado.cliente?.nome ?? '—',
    });

    const verificarStatus = async () => {
      try {
        const token = localStorage.getItem('token');

        const { data } = await axios.get(
          `http://localhost:3000/api/viagem/status/${viagemId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!STATUSES_PERMITIDOS.includes(data.status)) {
          clearInterval(pollingRef.current);
          navigate('/motorista'); 
          return;
        }

        if (data.status === 'emCurso' && estado !== 'emCurso') {
          setEstado('emCurso');
          if (!timerRef.current) {
            timerRef.current = setInterval(() => setSegundos(s => s + 1), 1000);
          }
        }

        if (data.status === 'finalizada') {
          clearInterval(pollingRef.current);
          clearInterval(timerRef.current);
          localStorage.removeItem('viagemAtivaMotorista');
          navigate('/motorista/fatura-conf', {
            state: { trip: tripAtiva, duracao: segundos },
          });
        }

        setCarregando(false);
      } catch (err) {
        console.error('Erro ao verificar status da viagem:', err.message);
        setCarregando(false);
      }
    };

    verificarStatus();
    pollingRef.current = setInterval(verificarStatus, 3000);

    return () => {
      clearInterval(pollingRef.current);
      clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
  if (!tripAtiva || !tripAtiva.from || !tripAtiva.to || !tabelaPrecos) {
    return;
  }

  const calcularTudo = async () => {
    if (tripAtiva.from.localizacao && tripAtiva.to.localizacao && tabelaPrecos) {
        const url = `https://router.project-osrm.org/route/v1/driving/${tripAtiva.from.localizacao.coordinates[1]},${tripAtiva.from.localizacao.coordinates[0]};${tripAtiva.to.localizacao.coordinates[1]},${tripAtiva.to.localizacao.coordinates[0]}?overview=false`;
        const res = await axios.get(url);
        const km = (res.data.routes[0].distance / 1000).toFixed(1);
        const tempo = Math.round(res.data.routes[0].duration / 60);

        const precoConfig = tabelaPrecos[tripAtiva.comfort] || tabelaPrecos["Básico"];

        const horaAtual = new Date().getHours();
        const eNoturno = horaAtual >= 21 || horaAtual < 6;
        
        let preco = tempo * precoConfig.valor_minuto;
        
        if(eNoturno && precoConfig.acrescimo_noturno){
          preco += (preco * precoConfig.acrescimo_noturno);
        }

        let tempoMedio = "--";
        try {
          const token = localStorage.getItem('token');
          const respEsp = await axios.get(`http://localhost:3000/api/viagem/espera`, {
            params: { lat: tripAtiva.from.localizacao.coordinates[0], lng: tripAtiva.from.localizacao.coordinates[1] },
            headers: { Authorization: `Bearer ${token}` }
          });
          tempoMedio = respEsp.data.media;
        } catch (err) {
          console.log(err);
          console.error("Erro ao buscar tempo médio");
        }

      setEstimate({ km, price: preco.toFixed(2),wait: tempo, tempoMedio: tempoMedio });
    }
  };
  calcularTudo();
  }, [tripAtiva, tabelaPrecos]);

  async function iniciarViagem() {
    try {
      const token = localStorage.getItem('token');
      const viagemAtiva = JSON.parse(localStorage.getItem('viagemAtivaMotorista'));

      await axios.post(
        'http://localhost:3000/api/viagem/iniciar',
        { viagemId: viagemAtiva?.viagemId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEstado('emCurso');
      timerRef.current = setInterval(() => setSegundos(s => s + 1), 1000);
    } catch (err) {
      console.error('Erro ao iniciar viagem:', err.message);
    }
  }

  async function terminarViagem() {
    try {
      const token = localStorage.getItem('token');
      const viagemAtiva = JSON.parse(localStorage.getItem('viagemAtivaMotorista'));

      if (!viagemAtiva?.viagemId) {
        navigate('/motorista');
        return;
      }

      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;

        try{
          const resGeo = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const dataGeo = await resGeo.json();
          const moradaCompleta = dataGeo.display_name || "Localização desconhecida";

          const response = await axios.post(
            'http://localhost:3000/api/viagem/finalizar',
            { 
              viagemId: viagemAtiva?.viagemId,
              destino: {
                lat: latitude,
                long: longitude,
                morada: moradaCompleta
              }
            },
            { headers: { Authorization: `Bearer ${token}` } }
          ); 

          if (response.data.success) {
            const viagemFinal = response.data.viagem;

            if (pollingRef.current) clearInterval(pollingRef.current);
            if (timerRef.current) clearInterval(timerRef.current);
            localStorage.removeItem('viagemAtivaMotorista');

            const tripDadosFinais = {
              id:          viagemFinal._id,
              from:        viagemFinal.morada_inicial_viagem,
              to:          viagemFinal.morada_final_viagem,
              dist:        `${viagemFinal.km_percorridos ?? '—'} km`,
              price:       `€${viagemFinal.preco_viagem ?? '—'}`,
              passengers:  viagemFinal.n_passageiros || '—',
              clientName:  tripAtiva?.clientName ?? '—',
              conforto:    viagemFinal.nivel_conforto
            };

            navigate('/motorista/fatura-conf', { state: { trip: tripDadosFinais, duracao: segundos } });
          } 
        } catch (err) {
          console.error("Erro ao finalizar viagem no servidor:", err);
          toastErro("Erro ao processar o fim da viagem.");
        }

      }, (error) => {
        console.error("Erro ao obter geolocalização:", error);
        toastErro("Não foi possível obter a sua localização atual para finalizar a viagem.");
      });

    } catch (err) {
      console.error('Erro ao terminar viagem:', err.message);
    }
  }

  const originCoord = useMemo(() => tripAtiva?.from?.localizacao?.coordinates, [tripAtiva?.from?.localizacao?.coordinates]);
  const destCoord = useMemo(() => tripAtiva?.to?.localizacao?.coordinates, [tripAtiva?.to?.localizacao?.coordinates]);

  if (carregando) {
    return (
      <div className="mvg-page" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="mvg-overlay" />
        <div className="mvg-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#fff', fontSize: '1.2rem' }}>A verificar estado da viagem…</p>
        </div>
      </div>
    );
  }

  const USERNAME = JSON.parse(localStorage.getItem("user_logado")).nome;

  return (
    <div className="mvg-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="mvg-overlay" />

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
          <li className="mh-profile-li avatarHamburguer">
            <AvatarDropdown profilePath="/motorista/perfil" avatarClass="mh-avatar" />
            <span className="mh-profile-pill-name">{USERNAME}</span>
          </li>
          
          <li><a onClick={() => navigate('/motorista')}>Dashboard</a></li>
          <li><a onClick={() => navigate('/motorista/reabastecimento')}>Reabastecimento</a></li>
          <li><a onClick={() => navigate('/motorista/historico')}>Histórico</a></li>
          <li><a onClick={() => navigate('/motorista/relatorio')}>Relatório</a></li>
          <li><a onClick={() => navigate('/motorista/suporte')}>Suporte</a></li>
          <li><a className="active">Viagem</a></li>
          <li>
            <button className="mh-theme-btn" onClick={alternarTema}>
              {tema === 'escuro' ? '☀️ Claro' : '🌙 Escuro'}
            </button>
          </li>
          <li className="mh-profile-li avatarNormal">
            <div className="mh-profile-pill">
              <span className="mh-profile-pill-name">{USERNAME}</span>
              <AvatarDropdown profilePath="/motorista/perfil" avatarClass="mh-avatar" />
            </div>
          </li>
        </ul>
      </nav>

      <div className="mvg-wrapper">

        {/* Header */}
        <div className="mvg-header">
          <div>
            <h1 className="mvg-title">Viagem Atual</h1>
            <p className="mvg-sub">Gerir o progresso da viagem em curso</p>
          </div>
          {estado === 'em_curso' && (
            <div className="mvg-header-timer">
              <span className="mvg-header-timer-label">Tempo de viagem</span>
              <span className="mvg-header-timer-val">{formatTime(segundos)}</span>
            </div>
          )}
          <div className={`mvg-status-pill ${estado}`}>
            {estado === 'aguardandoInicio' ? '○ Aguarda Início' : '● Em Viagem'}
          </div>
        </div>

        <div className="mvg-layout">

          {/* ── Left: trip info + controls ── */}
          <div className="mvg-left">

            <div className="mvg-card mvg-trip-card">
              <h3 className="mvg-card-title">Detalhes da Viagem</h3>

              <div className="mvg-route-visual">
                <div className="mvg-route-point">
                  <span className="mvg-dot origin" />
                  <div>
                    <span className="mvg-point-label">Origem</span>
                    <span className="mvg-point-name">{tripAtiva?.from?.morada ?? '—'}</span>
                  </div>
                </div>
                <div className="mvg-route-line" />
                <div className="mvg-route-point">
                  <span className="mvg-dot dest" />
                  <div>
                    <span className="mvg-point-label">Destino</span>
                    <span className="mvg-point-name">{tripAtiva?.to?.morada ?? '—'}</span>
                  </div>
                </div>
              </div>

              <div className="mvg-trip-meta">
                <div className="mvg-meta-item">
                  <span className="mvg-meta-label">Passageiros</span>
                  <span className="mvg-meta-val">{tripAtiva?.passengers ?? '—'}</span>
                </div>
                <div className="mvg-meta-item">
                  <span className="mvg-meta-label">Distância</span>
                  <span className="mvg-meta-val">{estimate?.km ?? '—'}km</span>
                </div>
                <div className="mvg-meta-item">
                  <span className="mvg-meta-label">Valor estimado</span>
                  <span className="mvg-meta-val accent">{estimate?.price ?? '—'}€</span>
                </div>
                <div className="mvg-meta-item">
                  <span className="mvg-meta-label">Cliente</span>
                  <span className="mvg-meta-val">{tripAtiva?.clientName ?? '—'}</span>
                </div>
              </div>
            </div>

            {estado === 'aguardandoInicio' ? (
              <button className="mvg-btn start" onClick={iniciarViagem}>
                ▶&nbsp; Iniciar Viagem
              </button>
            ) : (
              <button className="mvg-btn end" onClick={terminarViagem}>
                ■&nbsp; Terminar Viagem
              </button>
            )}

          </div>

          {/* ── Right: map placeholder ── */}
          <div className="viagem-map-placeholder">
            <div className="viagem-map-inner">
              {/* <div className="viagem-map-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  <circle cx="12" cy="9" r="2.5"/>
                </svg>
              </div> */}
              <StaticMap origin={originCoord} destination={destCoord} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}