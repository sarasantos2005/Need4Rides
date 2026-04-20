import { useState,useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/PedirTaxi.css';
import AvatarDropdown from '../components/AvatarDropdown';
import axios from 'axios';

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
    const center = (coordsIniciais && coordsIniciais.length === 2) 
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
        <div className="map-modal-overlay">
            <div className="map-modal-content">
                <div className="map-modal-header">
                  <h3>Selecionar origem</h3>
                  <button className="map-close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="map-frame">
                  <MapContainer 
                    center={position} 
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
        <div className="map-modal-overlay">
            <div className="map-modal-content">
                <div className="map-modal-header">
                  <h3>Selecionar destino</h3>
                  <button className="map-close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="map-frame">
                  <MapContainer 
                    center={position} 
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
  const wait = calcularTempoOSRM(origem, destino);
  return { wait, km, price };
}

//Tempo estimado de um lugar a outro
function calcularTempoEstimado(coordsInicio, coordsFim) {
  if (!coordsFim) return 10; 
  
  const distancia = calcularDistancia(coordsInicio.coordinates, coordsFim.coordinates || coordsFim);
  const velocidadeMedia = 60; 
  const tempoHoras = distancia / velocidadeMedia;
  return Math.max(tempoHoras * 60, 5); 
}

const calcularTempoOSRM = async (origem, destino) => {
  try {
    const coordsOrigem = `${origem[1]},${origem[0]}`; // Long,Lat
    const coordsDestino = `${destino[1]},${destino[0]}`; // Long,Lat
    
    const url = `http://router.project-osrm.org/route/v1/driving/${coordsOrigem};${coordsDestino}?overview=false`;
    
    const response = await axios.get(url);
    
    if (response.data && response.data.routes.length > 0) {
      return Math.round(response.data.routes[0].duration / 60);
    }
    return calcularTempoEstimado(origem, destino);
  } catch (error) {
    console.error("Erro na API OSRM:", error.message);
    return calcularTempoEstimado(origem, destino);
  }
};

export default function PedirTaxi() {
  const navigate = useNavigate();
  const [showMapOrigem, setShowMapOrigem] = useState(false);
  const [showMapDestino, setShowMapDestino] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    axios.get('http://localhost:3000/api/preco')
    .then(res => setTabelaPrecos(res.data))
  }, []);

  useEffect(() => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        
        setForm(prev => ({
          ...prev,
          origem: { morada: data.display_name, localizacao: [lat, lng] }
        }));
      } catch (err) {
        console.error("Erro ao obter morada atual");
      }
    });
  }
}, []);

  const [estimate, setEstimate] = useState(null);
  useEffect(() => {
  const calcularTudo = async () => {
    if (form.origem.localizacao && form.destino.localizacao && tabelaPrecos) {
      const url = `https://router.project-osrm.org/route/v1/driving/${form.origem.localizacao[1]},${form.origem.localizacao[0]};${form.destino.localizacao[1]},${form.destino.localizacao[0]}?overview=false`;
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

      setEstimate({ km, price: preco.toFixed(2), wait: tempo });
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

      console.log("Estado atual do form:", form);

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
        custo_estimado: estimate.preco
      }

      console.log("Enviando para a API:", dadosViagem);

      const response = await axios.post('http://localhost:3000/api/viagem/pedir', dadosViagem, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if(response.data.success){
        setConfirmed(true);  
        navigate('/aguardar-taxi', { state: { form, estimate } });
      }
    } catch (err) {
      alert("Erro ao pedir o táxi: " + (err.response?.data?.message || "Erro desconhecido"));
    }

  };

  return (
    <div className="pt-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="pt-overlay" />

      {/* Navbar */}
      <nav className="pt-navbar">
        <span className="pt-logo" onClick={() => navigate('/home')}>Need4Rides</span>

        <div
          className={`pt-hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        <ul className={`pt-nav-links ${menuOpen ? 'active' : ''}`}>
          <li><a onClick={() => { navigate('/home'); setMenuOpen(false); }}>Home</a></li>
          <li>
            <button className="pt-theme-btn" onClick={alternarTema}>
              {tema === 'escuro' ? '🌙 Escuro' : '☀️ Claro'}
            </button>
          </li>
          <li><AvatarDropdown profilePath="/profile" avatarClass="pt-avatar" /></li>
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
              <input
                name="origem"
                type="text"
                placeholder="De onde partes?"
                value={form.origem.morada}
                readOnly
                onClick={() => setShowMapOrigem(true)}
                required
              />
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
                  <span className="pt-estimate-label">Tempo de viagem</span>
                  <span className="pt-estimate-value">{estimate.wait} min</span>
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
