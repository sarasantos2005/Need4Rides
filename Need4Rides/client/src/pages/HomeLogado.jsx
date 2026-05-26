import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import taxiImg from '../assets/images/taxi.png';
import heroBg from '../assets/images/LA.jpg';
import '../css/Home.css';
import AvatarDropdown from '../components/AvatarDropdown';
import axios from 'axios';
import { io } from 'socket.io-client';

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';
import L from 'leaflet';
import '../css/global.css';
import { toastSucesso, toastErro, toastAviso, toastInfo, confirmar } from '../components/toast';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function SearchField({ onLocationSelected, searchText }) {
    const map = useMap(); 
    const searchControlRef = useRef(null);

    useEffect(() => {
        const provider = new OpenStreetMapProvider();
        const searchControl = new GeoSearchControl({
            provider,
            style: "bar",
            showMarker: false,
            autoClose: true,
            retainZoomLevel: false,
        });

        map.addControl(searchControl);
        searchControlRef.current = searchControl;

        map.on("geosearch/showlocation", (result) => {
            onLocationSelected([result.location.y, result.location.x]);
        });

        return () => map.removeControl(searchControl);
    }, [map, onLocationSelected]);

    useEffect(() => {
      if (searchText) {
        setTimeout(() => {
          const input = document.querySelector('.leaflet-geosearch-bar input, .glass');
          if (input) input.value = searchText;
        }, 100);
      }
    }, [searchText]);

    return null;
}

function MapEventsHandler({ onMove }) {
    useMapEvents({
        click(e) {
            onMove([e.latlng.lat, e.latlng.lng]);
        },
    });
    return null;
}

function MapSelector({ label, coordsIniciais, moradaInicial, onConfirm, onClose }) {
    const center = Array.isArray(coordsIniciais) && coordsIniciais.length === 2 
        ? coordsIniciais 
        : [38.7223, -9.1393];

    const [position, setPosition] = useState(center);
    const [addressText, setAddressText] = useState(moradaInicial || "");

    const updateAddress = async (lat, lng) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            setAddressText(data.display_name);
        } catch (err) {
            console.error("Erro no reverse geocoding");
        }
    };

    return (
        <div className="map-modal-overlay" onClick={onClose}>
          <div className="map-modal-content" onClick={e => e.stopPropagation()}>
            <div className="map-inline-header">
                <h3>Selecionar {label}</h3>
                <button onClick={onClose} >X</button>
            </div>

            <div className="map-frame" style={{ height: "100%", width:"100%" }}>
                <MapContainer
                    center={position}
                    zoom={13}
                    style={{ height: '400px', width: '100%' }}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <SearchField onLocationSelected={(coords) => {
                        setPosition(coords);
                        updateAddress(coords[0], coords[1]);
                    }} searchText={addressText} />
                    <Marker position={position} />
                    <MapEventsHandler onMove={(coords) => {
                        setPosition(coords);
                        updateAddress(coords[0], coords[1]);
                    }} />
                </MapContainer>
            </div>

            <div className="map-inline-actions">
                <button className="profile-back-btn" onClick={onClose}>Cancelar</button>
                <button className="profile-save-btn" onClick={() => onConfirm(label, position, addressText)}>
                    Confirmar {label}
                </button>
            </div>
          </div>
        </div>
    );
}


const services = [
  { title: 'Transporte de Passageiros', desc: 'Viagens rápidas e seguras para qualquer destino.', accent: '#6c63ff' },
  { title: 'Níveis de Conforto', desc: 'Escolha entre táxis básicos ou luxuosos.', accent: '#f5a623' },
  { title: 'Táxis a Combustão e Elétricos', desc: 'Frota moderna com motores a combustão ou elétricos.', accent: '#00c9a7' },
  { title: 'Pedido em Tempo Real', desc: 'Peça um táxi e aguarde a resposta de um motorista.', accent: '#ff6b6b' },
  { title: 'Estimativa de Preço', desc: 'Cálculo automático do custo e tempo de chegada.', accent: '#43e97b' },
  { title: 'Emissão de Faturas', desc: 'Faturas automáticas após cada viagem.', accent: '#4facfe' },
  { title: 'Reabastecimento e Carregamento', desc: 'Gestão de combustível e energia elétrica.', accent: '#fa709a' },
  { title: 'Relatórios e Estatísticas', desc: 'Análises completas sobre viagens, motoristas e clientes.', accent: '#a18cd1' },
];

// ── Helpers ────────────────────────────────────────────────
function ProgressBar({ value, max, color = '#f5c518' }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function HomeLogado() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ origin: '', destination: '', passengers: '', comfort: '' });
  const [activeTrip, setActiveTrip]   = useState(null);
  const [recentTrips, setRecentTrips]  = useState([]);
  const [savedPlaces, setSavedPlaces]  = useState([]);
  const [showMap, setShowMap] = useState(null);
  const [userData, setUserData] = useState({ nome: 'Utilizador' });
  const [userLocation, setUserLocation] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'escuro');
  useEffect(() => {
    document.body.className = tema;
    localStorage.setItem('tema', tema);
  }, [tema]);
  const alternarTema = () => setTema(prev => prev === 'escuro' ? 'claro' : 'escuro');
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const ativa = JSON.parse(localStorage.getItem('viagemAtiva'));

    if (token && ativa?.viagemId) {
      setActiveTrip(ativa);

      const onStorage = () => {
        const atualizada = JSON.parse(localStorage.getItem("viagemAtiva"));
        if(atualizada?.viagemId) setActiveTrip(atualizada);
      };

      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    }
  }, []);

  useEffect(() => {
    carregarDados();
    carregarLocais();

    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => setUserLocation(null) 
    );
  }, []);
  
  const carregarDados = async () => {
    const storedUser = localStorage.getItem('user_logado');
    const token = localStorage.getItem('token');

    if (!token || !storedUser) {
      navigate('/login'); 
    } else {
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const resViagens = await axios.get('http://localhost:3000/api/viagem/historico/cliente', config);

      setRecentTrips(resViagens.data);

      const ativa = JSON.parse(localStorage.getItem('viagemAtiva'));
      if (ativa && ativa.viagemId !== null) setActiveTrip(ativa);

      setUserData(JSON.parse(storedUser));
    }
  };

  const carregarLocais = async() => {
    try {
      const storedUser = localStorage.getItem('user_logado');
      const token = localStorage.getItem('token');

      if (!token || !storedUser) {
        navigate('/login'); 
      } else {
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const resSitios = await axios.get('http://localhost:3000/api/user/sitios', config);

        setSavedPlaces(resSitios.data);

        const ativa = JSON.parse(localStorage.getItem('viagemAtiva'));
        if (ativa && ativa.viagemId !== null) setActiveTrip(ativa);

        setUserData(JSON.parse(storedUser));
      }
    } catch (err) {
        console.error("Erro ao buscar locais:", err.resSitios?.data || err);
    }
  }
 
  const repeatTrip = (trip) => {
    const tripData = {
      origem: { 
        morada: trip.morada_inicial_viagem.morada, 
        localizacao: trip.morada_inicial_viagem.localizacao.coordinates 
      },
      destino: { 
        morada: trip.morada_final_viagem.morada, 
        localizacao: trip.morada_final_viagem.localizacao.coordinates 
      },
      passengers: trip.n_passageiros || 1,
      comfort: trip.nivel_conforto || 'Básico'
    };

    localStorage.setItem('viagemAtiva', JSON.stringify({
      form: tripData,
      viagemId: null 
    }));

    navigate('/pedir-taxi');
  };

  const pedidoNovo = () => {
    const tripData = {
      origem: { morada: '', localizacao: null },
      destino: { morada: '', localizacao: null },
      passengers: 1,
      comfort: ''
    };

    localStorage.setItem('viagemAtiva', JSON.stringify({
      form: tripData,
      viagemId: null 
    }));

    navigate('/pedir-taxi');
  }
 
  const goToSavedPlace = (place) => {
    navigate('/pedir-taxi', { 
      state: { 
        destino: { 
          morada: place.address, 
          localizacao: [place.lat, place.lng] 
        } 
      } 
    });
  };

  const handleConfirmLocal = async (label, coords, address) => {
    const token = localStorage.getItem('token');
    try {
      await axios.patch('http://localhost:3000/api/user/sitios', 
          { label, address, lat: coords[0], lng: coords[1] },
          { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowMap(null);
      carregarLocais();
    } catch (err) {
        toastErro("Erro ao guardar local");
    }
  };

  const firstName = userData.nome.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 19 ? 'Boa tarde' : 'Boa noite';

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const USERNAME = JSON.parse(localStorage.getItem("user_logado")).nome;

  return (
    <div className="home">
      {/* Navbar */}
      <nav className="gb-navbar">
        <span className="gb-navbar-logo">Need4Rides</span>

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
            <AvatarDropdown profilePath="/profile" avatarClass="gb-avatar" />
            <span className="gb-profile-pill-name">{USERNAME}</span>
          </li>

          <li><a className="active">Home</a></li>
          <li><a onClick={() => { navigate('/services'); setMenuOpen(false); }}>Serviços</a></li>
          <li><a onClick={() => { navigate('/pedir-taxi'); setMenuOpen(false); }}>Pedir Táxi</a></li>
          <li><a onClick={() => { navigate('/viagem'); setMenuOpen(false); }}>Viagem</a></li>
          <li>
            <button className="pt-theme-btn" onClick={alternarTema}>
              {tema === 'escuro' ? '☀️ Claro' : '🌙 Escuro'}
            </button>
          </li>

          <li className="gb-profile-li avatarNormal">
            <div className="gb-profile-pill">
              <span className="gb-profile-pill-name">{USERNAME}</span>
              <AvatarDropdown profilePath="/profile" avatarClass="gb-avatar" />
            </div>
          </li>
        </ul>
      </nav>

      {/* Hero */}
      <section className="hero" id="hero" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="hero-overlay" />
          <div className="hero-content">
            <h1 className="hero-title">Vamos viajar, {userData.nome.split(' ')[0]}?</h1>
            <div className="hero-form-block">
              {/* ── Dashboard Cards ── */}
            <div className="dashboard-grid">
  
              {/* Card: Viagem Ativa ou CTA */}
              {activeTrip ? (
                <div className="dash-card dash-card--active">
                  <div className="dash-card-badge">🚕 Em curso</div>
                  <h3 className="dash-card-title">A caminho de <strong>{activeTrip.form?.destino?.morada ?? "..."}</strong></h3>
                  <p className="dash-card-sub">
                    {activeTrip.motorista
                    ? `Motorista: ${activeTrip.motorista.nome} · Tempo de espera: ${activeTrip.estimate?.wait} min`
                    : 'A aguardar motorista...'}
                  </p>
                  <button className="dash-btn dash-btn--primary" onClick={() => navigate('/aguardar-taxi')}>
                    Ver viagem
                  </button>
                </div>
              ) : (
                <div className="dash-card dash-card--cta">
                  <div className="dash-card-badge">✨ Rápido</div>
                  <h3 className="dash-card-title">Precisas de um táxi?</h3>
                  <p className="dash-card-sub">Pede-o aqui, de maneira rápida</p>
                  <button className="dash-btn dash-btn--primary" onClick={pedidoNovo}>
                    Novo Pedido
                  </button>
                </div>
              )}
  
              {/* Card: Atalhos guardados */}
              <div className="dash-card dash-card--places">
                <div className="dash-card-badge">📍 Os Teus Sítios</div>
                  <div className="saved-places-list">
                    {['Casa', 'Trabalho'].map((label) => {
                      const place = savedPlaces.find(p => p.label === label);
                      
                      return (
                        <div key={label} className="saved-place-item">
                          {place ? (
                            <button className="saved-place-btn" onClick={() => goToSavedPlace(place)}>
                              <span>{label === 'Casa' ? '🏠' : '💼'}</span>
                              <div className="saved-place-info">
                                <span className="saved-place-label">{label}</span>
                                <span className="saved-place-addr" title={place.address}>{place.address}</span>
                              </div>
                              <span className="edit-icon" onClick={(e) => { e.stopPropagation(); setShowMap( {label, place: savedPlaces.find(p => p.label === label) || null}); }}>✏️</span>
                            </button>
                          ) : (
                            <button className="saved-place-btn empty" onClick={() => setShowMap( { label, place: savedPlaces.find(p => p.label === label) || null} )}>
                              <span>{label === 'Casa' ? '🏠' : '💼'}</span>
                              <span onClick={() => setShowMap(label)} className="saved-place-label">Definir {label}</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
              </div>

              {/* Card: Últimas viagens */}
              <div className="dash-card dash-card--history">
                <div className="dash-card-badge">🕒 Últimas Viagens</div>
                <ul className="trips-list">
                  {recentTrips.length > 0 ? (
                  recentTrips.slice(0,3).map(trip => (
                    <li key={trip.id || trip._id} className="trip-item">
                      <div className="trip-route">
                        <span className="trip-origin">{trip.morada_inicial_viagem.morada}</span>
                        <span className="trip-arrow">→</span>
                        <span className="trip-dest">{trip.morada_final_viagem.morada}</span>
                      </div>
                      <div className="trip-meta">
                        <span className="trip-date">{new Date(trip.hora_inicial_viagem).toLocaleDateString()} · {new Date(trip.hora_inicial_viagem).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <span className="trip-price">{trip.preco_viagem.toFixed(2)}€</span>
                        <button className="trip-repeat-btn" onClick={() => repeatTrip(trip)} title="Repetir viagem">
                          ↻
                        </button>
                      </div>
                    </li>
                  ))
                  ) : (
                    <p className="mh-no-data">Ainda não realizou viagens.</p>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-car">
          <img src={taxiImg} alt="Taxi" />
        </div>
        <div className="hero-wave" />
      </section>

      {/* Services */}
      <section className="services" id="services" style={{ backgroundImage: `url(${heroBg})` }}>
        <h2 className="services-title">Nossos Serviços</h2>
        <p className="services-subtitle">Tudo o que precisas para uma viagem perfeita</p>
        <div className="services-grid">
          {services.map((s, i) => (
            <div className="service-card" key={i} style={{ '--accent': s.accent }}>
              <div className="service-index">
                <span>{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <span>© 2026 Need4Rides. Todos os direitos reservados.</span>
      </footer>
      {showMap && (
        <MapSelector 
          label={showMap.label}
          coordsIniciais={
            showMap.place 
              ? [showMap.place.lat, showMap.place.lng] 
              : userLocation                            
          }
          moradaInicial={showMap.place?.address || ""}
          onClose={() => setShowMap(null)}
          onConfirm={handleConfirmLocal}
        />
      )}
    </div>
  );
}
