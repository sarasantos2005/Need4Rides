import { useState,useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/PedirTaxi.css';
import AvatarDropdown from '../components/AvatarDropdown';
import axios from 'axios';
import '../css/global.css';
import { toastSucesso, toastErro, toastAviso, toastInfo, confirmar } from '../components/toast';

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';
import L from 'leaflet';

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
        if (searchText && searchControlRef.current) {
            const input = document.querySelector('.glass'); 
            if (input) {
                input.value = searchText;
            }
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

function MapSelectorOrigem({ coordsIniciais, moradaInicial, onConfirm, onClose }) {
    const normalizeCoords = (c) => {
        if (!c) return null;
        if (Array.isArray(c) && c.length === 2) return [parseFloat(c[0]), parseFloat(c[1])]; // [ALTERADO] Bug 2: array interno já é sempre [lat, lng], passa direto
        if (c.coordinates && c.coordinates.length >= 2) return [parseFloat(c.coordinates[0]), parseFloat(c.coordinates[1])]; // [ALTERADO] Bug 2: backend guarda coordinates=[lat,lng], passa direto
        return null;
    };
    const coords = normalizeCoords(coordsIniciais);
    const center = coords || [38.7223, -9.1393];

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
        <div className="map-modal-overlay">
            <div className="map-modal-content">
                <div className="map-modal-header">
                  <h3>Selecionar origem</h3>
                  <button className="map-close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="map-frame" style={{ 
                    borderRadius: '16px', 
                    border: '2px solid rgba(245, 166, 35, 0.3)',
                    overflow: 'hidden' 
                }}>
                  <MapContainer 
                    key={coords ? coords.join(',') : 'default'}
                    center={center}
                    zoom={13} 
                    style={{ height: '400px', width: '100%' }}
                  >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <SearchField onLocationSelected={(coords) => {
                            setPosition(coords);
                            updateAddress(coords[0], coords[1]);
                        }} 
                        searchText={addressText} />
                      <Marker position={position} />
                      <MapEventsHandler onMove={(coords) => {
                          setPosition(coords);
                          updateAddress(coords[0], coords[1]);
                      }} />
                  </MapContainer>
                </div>
                
                <div className="map-modal-actions">
                  <button className="confirm-map-btn" onClick={() => onConfirm(position, addressText)}>
                      Confirmar origem
                  </button>
                </div>
            </div>
        </div>
    );
}

function MapSelectorDestino({ coordsIniciais, moradaInicial, onConfirm, onClose }) {
    const normalizeCoords = (c) => {
        if (!c) return null;
        if (Array.isArray(c) && c.length === 2) return [parseFloat(c[0]), parseFloat(c[1])]; // [ALTERADO] Bug 2: array interno já é sempre [lat, lng], passa direto
        if (c.coordinates && c.coordinates.length >= 2) return [parseFloat(c.coordinates[0]), parseFloat(c.coordinates[1])]; // [ALTERADO] Bug 2: backend guarda coordinates=[lat,lng], passa direto
        return null;
    };
    const coords = normalizeCoords(coordsIniciais);
    const center = coords || [38.7223, -9.1393];

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
        <div className="map-modal-overlay">
            <div className="map-modal-content">
                <div className="map-modal-header">
                  <h3>Selecionar destino</h3>
                  <button className="map-close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="map-frame">
                  <MapContainer 
                    key={coords ? coords.join(',') : 'default'}
                    center={center}
                    zoom={13} 
                    style={{ height: '400px', width: '100%' }}
                  >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <SearchField onLocationSelected={(coords) => {
                            setPosition(coords);
                            updateAddress(coords[0], coords[1]);
                        }} 
                        searchText={addressText} />
                      <Marker position={position} />
                      <MapEventsHandler onMove={(coords) => {
                          setPosition(coords);
                          updateAddress(coords[0], coords[1]);
                      }} />
                  </MapContainer>
                </div>
                
                <div className="map-modal-actions">
                  <button className="confirm-map-btn" onClick={() => onConfirm(position, addressText)}>
                      Confirmar destino
                  </button>
                </div>
            </div>
        </div>
    );
}

const BASE_PRICE = 3.5;
const PRICE_PER_KM = 1.8;

function calcEstimate(origem, destino, passengers) {
  if (!origem || !destino) return null;
  const seed = (origem.length + destino.length) * 1.3;
  const km = Math.max(2, Math.round(seed % 22) + 3);
  const price = (BASE_PRICE + km * PRICE_PER_KM * (passengers > 4 ? 1.2 : 1)).toFixed(2);
  return { wait, km, price };
}

export default function PedirTaxi() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [showMapOrigem, setShowMapOrigem] = useState(false);
  const [showMapDestino, setShowMapDestino] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [viagemId, setViagemId] = useState(state?.viagemId);

  const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'escuro');
  useEffect(() => {
    document.body.className = tema;
    localStorage.setItem('tema', tema);
  }, [tema]);
  const alternarTema = () => setTema(prev => prev === 'escuro' ? 'claro' : 'escuro');
  const [confirmed, setConfirmed] = useState(false);
  const [tabelaPrecos, setTabelaPrecos] = useState(null);
  const [form, setForm] = useState({
    origem: { morada: '', localizacao: null },
    destino: { morada: '', localizacao: null },
    passengers: 1,
    comfort: ''
  });

  useEffect(() => {
    const savedTrip = JSON.parse(localStorage.getItem('viagemAtiva'));
    if (savedTrip && savedTrip.form) {
      setForm(savedTrip.form);
    }
  }, []);

  useEffect(() => {
    axios.get('http://localhost:3000/api/preco')
    .then(res => setTabelaPrecos(res.data))
  }, []);

  useEffect(() => {
    if (state && state.origem) {
      setForm(prev => ({
          ...prev,
          origem: { morada: state.origem.morada, localizacao: state.origem.localizacao } 
        }));
    }

    if (state && state.destino) {
      setForm(prev => ({
        ...prev,
        destino: { morada: state.destino.morada, localizacao: state.destino.localizacao }
      }));
    }

    const obterLocalizacaoAtual = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            
            setForm(prev => {
              if (prev.origem.morada === "") {
                return {
                  ...prev,
                  origem: { morada: data.display_name, localizacao: [lat, lng] }  
                }
              }
              return prev;
            });
          } catch (err) {
            console.error("Erro ao obter morada atual");
          }
        });
      }
    }

    if(!state?.origem && form.origem.morada === ""){
      obterLocalizacaoAtual();  
    }
  }, [state]);

  const usarLocalizacaoAtual = () => {
    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        setForm(prev => ({
            ...prev,
            origem: { morada: data.display_name, localizacao: [latitude, longitude] }
        }));
    });
  };

  useEffect(() => {
    
    if (!viagemId) {
      return;
    }

    const buscarStatus = async() => {
      try {
        const token = localStorage.getItem('token');

        const response = await axios.get(`http://localhost:3000/api/viagem/status/${viagemId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

      if(response.data.status){
        navigate('/aguardar-taxi', { 
          state: { viagemId: response.data.viagemAtiva._id } 
        });
      }
      } catch (err) {
        console.error("Erro ao buscar status:", err.message);
      }
    };

    buscarStatus();
  }, [navigate]);

  const [estimate, setEstimate] = useState(null);

  const toLatLng = (loc) => {
    if (!loc) return null;
    if (Array.isArray(loc) && loc.length === 2) return [parseFloat(loc[0]), parseFloat(loc[1])];
    if (loc.coordinates && loc.coordinates.length >= 2) return [parseFloat(loc.coordinates[0]), parseFloat(loc.coordinates[1])];
    return null;
  };

  useEffect(() => {
  const calcularTudo = async () => {
    const origemCoords = toLatLng(form.origem.localizacao);
    const destinoCoords = toLatLng(form.destino.localizacao);
    if (origemCoords && destinoCoords && tabelaPrecos) {
        const url = `https://router.project-osrm.org/route/v1/driving/${origemCoords[1]},${origemCoords[0]};${destinoCoords[1]},${destinoCoords[0]}?overview=false`;
        const res = await axios.get(url);
        const km = (res.data.routes[0].distance / 1000).toFixed(1);
        const tempo = Math.round(res.data.routes[0].duration / 60);

        const precoConfig = tabelaPrecos[form.comfort] || tabelaPrecos["Básico"];

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
            params: { lat: origemCoords[0], lng: origemCoords[1] },
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
}, [form.origem.localizacao, form.destino.localizacao, form.passengers, form.comfort, tabelaPrecos]);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setConfirmed(false);
  };

  const handleConfirm = async(e) => {
    e.preventDefault();

    try{

      const token = localStorage.getItem("token");

      const dadosViagem = {
        n_passageiros: form.passengers,
        nivel_conforto: form.comfort,
        origem: {
          morada: form.origem.morada,
          localizacao: { type: "Point", coordinates: [parseFloat(form.origem.localizacao[1]), parseFloat(form.origem.localizacao[0])] }
        },
        destino: {
          morada: form.destino.morada,
          localizacao: { type: "Point", coordinates: [parseFloat(form.destino.localizacao[1]), parseFloat(form.destino.localizacao[0])] }
        },
        custo_estimado: estimate.price
      }

      const response = await axios.post('http://localhost:3000/api/viagem/pedir', dadosViagem, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if(response.data.success){
        const novaViagem = {
          viagemId: response.data.pedido.id,
          form, 
          estimate,
          status: 'procurando'
        }

        setConfirmed(true);  
        localStorage.setItem('viagemAtiva', JSON.stringify(novaViagem));
        window.dispatchEvent(new Event('viagem_atualizada'));
        
        navigate('/aguardar-taxi');
      }
    } catch (err) {
      toastErro("Erro ao pedir o táxi: " + (err.response?.data?.message || "Erro desconhecido"));
    }

  };

  useEffect(() => {
    const viagemAtiva = JSON.parse(localStorage.getItem('viagemAtiva'));
    if (viagemAtiva?.viagemId) {
      if(viagemAtiva.status === "emCurso"){
        navigate("/viagem");
      } else {
        navigate('/aguardar-taxi');   
      }
    }
  }, []);

  const USERNAME = JSON.parse(localStorage.getItem("user_logado")).nome;

  return (
    <div className="pt-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="pt-overlay" />

      {/* Navbar */}
      <nav className="gb-navbar">
        <span className="gb-logo" onClick={() => navigate('/home')}>Need4Rides</span>

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

          <li><a onClick={() => { navigate('/home'); setMenuOpen(false); }}>Home</a></li>
          <li><a onClick={() => { navigate('/services'); setMenuOpen(false); }}>Serviços</a></li>
          <li><a className="active">Pedir Táxi</a></li>
          <li><a onClick={() => { navigate('/viagem'); setMenuOpen(false); }}>Viagem</a></li>
          <li>
            <button className="gb-theme-btn" onClick={alternarTema}>
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

      <div className="pt-wrapper">

        {/* Título */}
        <div className="pt-heading">
          <h1>Pedir Táxi</h1>
          <p>Preenche os dados abaixo e vê o preço antes de confirmar</p>
        </div>

        <div className="pt-content">

          {/* Formulário */}
          <form className="pt-form" onSubmit={handleConfirm}>

            <div className="pt-field">
              <label>Origem</label>
              <div className="pt-input-wrapper">
                <input
                  name="origem"
                  type="text"
                  placeholder="De onde partes?"
                  value={form.origem.morada}
                  readOnly
                  onClick={() => setShowMapOrigem(true)}
                  required
                />
                <button type="button" className="pt-btn-loc" onClick={usarLocalizacaoAtual} title="Usar localização atual">📍</button>  
              </div>
            </div>

            <div className="pt-field">
              <label>Destino</label>
              <input
                name="destino"
                type="text"
                placeholder="Para onde vais?"
                value={form.destino.morada}
                readOnly
                onClick={() => setShowMapDestino(true)}
                required
              />
            </div>

            <div className="pt-field">
              <label>Número de Passageiros</label>
              <div className="pt-passengers">
                {[1, 2, 3, 4].map(n => (
                  <button
                    type="button"
                    key={n}
                    className={`pt-pass-btn ${form.passengers == n ? 'active' : ''}`}
                    onClick={() => { setForm(f => ({ ...f, passengers: n })); setConfirmed(false); }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-field">
              <label>Conforto do Carro</label>
              <div className="pt-passengers">
                {[
                  { value: 'Básico', label: 'Básico' },
                  { value: 'Luxuoso', label: 'Luxuoso' },
                ].map(opt => (
                  <button
                    type="button"
                    key={opt.value}
                    className={`pt-pass-btn ${form.comfort === opt.value ? 'active' : ''}`}
                    onClick={() => { setForm(f => ({ ...f, comfort: opt.value })); setConfirmed(false); }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Estimativa */}
            {estimate && (
              <div className="pt-estimate">
                <div className="pt-estimate-item">
                  <span className="pt-estimate-label">Distância estimada</span>
                  <span className="pt-estimate-value">{estimate.km} km</span>
                </div>
                <div className="pt-estimate-divider" />
                <div className="pt-estimate-item">
                  <span className="pt-estimate-label">Tempo de espera</span>
                  <span className="pt-estimate-value">{estimate.tempoMedio} min</span>
                </div>
                <div className="pt-estimate-divider" />
                <div className="pt-estimate-item highlight">
                  <span className="pt-estimate-label">Preço estimado</span>
                  <span className="pt-estimate-value">€{estimate.price}</span>
                </div>
              </div>
            )}

            {!confirmed ? (
              <button type="submit" className="pt-btn-confirm" disabled={!estimate}>
                Confirmar
              </button>
            ) : (
              <div className="pt-confirmed">
                <div className="pt-confirmed-icon">✓</div>
                <p>Táxi solicitado com sucesso!</p>
                <span>Um motorista irá aceitar a tua viagem em breve.</span>
                <button type="button" className="pt-btn-back" onClick={() => { setConfirmed(false); setForm({ origem: { morada: '', localizacao: null }, destino: { morada: '', localizacao: null }, passengers: 1, comfort: '' }); }}>
                  Nova Viagem
                </button>
              </div>
            )}

          </form>

        </div>
      </div>
      {showMapOrigem && (
        <MapSelectorOrigem 
          coordsIniciais={form.origem.localizacao} 
          moradaInicial={form.origem.morada}
          onClose={() => setShowMapOrigem(false)}
          onConfirm={(coords, address) => {
            setForm(prev => ({ ...prev, origem: { morada: address, localizacao: coords } }));
            setShowMapOrigem(false);
          }} 
        />
      )}
      {showMapDestino && (
        <MapSelectorDestino 
          coordsIniciais={form.destino.localizacao} 
          moradaInicial={form.destino.morada}
          onClose={() => setShowMapDestino(false)}
          onConfirm={(coords, address) => {
            setForm(prev => ({ ...prev, destino: { morada: address, localizacao: coords } }));
            setShowMapDestino(false);
          }}
        />
      )}
    </div>
  );
}
