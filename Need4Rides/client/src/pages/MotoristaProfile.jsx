import { useNavigate } from 'react-router-dom';
import ddImg from '../assets/images/fennec.jpg';
import heroBg from '../assets/images/LA.jpg';
import '../css/Profile.css';
import { useState, useEffect, useRef } from 'react';
import Loading from '../components/Loading';
import useMinLoading from '../hooks/useMinLoading';
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

function MapSelector({ coordsIniciais, moradaInicial, onConfirm, onClose }) {
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
        <div className="map-inline-container">
            <div className="map-inline-header">
                <h3>Selecionar Morada</h3>
            </div>

            <div className="map-frame" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <MapContainer
                    center={position}
                    zoom={13}
                    style={{ height: '380px', width: '100%' }}
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
                <button className="profile-save-btn" onClick={() => onConfirm(position, addressText)}>
                    Confirmar Localização
                </button>
            </div>
        </div>
    );
}


export default function MotoristaProfile() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [apiStatus, setApiStatus] = useState({
    user: false,
    trips: false
  });
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    nif: '',
    genero: '',
    ano_nascimento: '',
    n_carta_conducao: '',
    morada: '',
    senha_acesso_web: '',
    localizacao: ''
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
      setUserData(resUser.data);
      setFormData({
        nome: resUser.data.nome || '',
        email: resUser.data.email || '',
        nif: resUser.data.nif || '',
        genero: resUser.data.genero || '',
        ano_nascimento: resUser.data.ano_nascimento || '',
        n_carta_conducao: resUser.data.motorista?.n_carta_conducao || '',
        morada: resUser.data.motorista?.morada?.texto || '',
        senha_acesso_web: resUser.data.senha_acesso_web || '',
        localizacao: resUser.data.motorista?.morada?.localizacao?.coordinates ? [resUser.data.motorista.morada.localizacao.coordinates[1], resUser.data.motorista.morada.localizacao.coordinates[0]] : ''
      });
      setApiStatus(prev => ({ ...prev, user: true }));

      const resTrips = await axios.get(`http://localhost:3000/api/viagem/motorista`, config);
      setHistorico(resTrips.data);
      setApiStatus({ user: true, trips: true });
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


  return (
    <>
    {loading && (
      <Loading 
        tasks={Object.values(apiStatus)} 
        onFinished={() => setLoading(false)} 
      />
    )}
    {(!loading && userData) && (
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
              <select className="profile-select" name="ano_nascimento" value={formData.ano_nascimento} onChange={handleInputChange}>
                <option value="">Selecionar ano</option>
                {Array.from({ length: 63 }, (_, i) => new Date().getFullYear() - 18 - i).map(ano => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
            </div>
            <div className="profile-field">
              <label>Nº Carta de Condução</label>
              <input type="text" name="n_carta_conducao" value={formData.n_carta_conducao} onChange={handleInputChange} />
            </div>
            <div className="profile-field">
              <label>Morada</label>
              <div className="lp-input-wrap" onClick={() => setShowMap(true)} style={{ cursor: 'pointer' }}>
                <input type="text" className="lp-input" value={formData.morada} readOnly placeholder="Clique para selecionar no mapa"/>
                {!formData.morada && <span className="lp-icon">📍</span>}
              </div>
            </div>
          </div>

          {showMap && (
            <MapSelector
              coordsIniciais={formData.localizacao}
              moradaInicial={formData.morada}
              onClose={() => setShowMap(false)}
              onConfirm={(coords, address) => {
                try {
                  setFormData({ ...formData, morada: address, localizacao: [coords[0], coords[1]] });
                  setShowMap(false);
                } catch (err) {
                  alert("Erro ao obter morada.");
                }
              }}
            />
          )}

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
    )};
    </>
  );
}
