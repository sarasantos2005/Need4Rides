import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/MotoristaReabastecimento.css';
import AvatarDropdown from '../components/AvatarDropdown';
import '../css/global.css';
import axios from 'axios';
import VEICULOS from "../../../server/data/marcasEmodelos";

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';
import L from 'leaflet';
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

    const handleMove = (coords) => {
        setPosition(coords);
        updateAddress(coords[0], coords[1]);
    };

    return (
        <div className="map-modal-overlay" onClick={onClose}>
          <div className="map-modal-content" onClick={e => e.stopPropagation()}>
            <div className="map-inline-header">
                <h3>Selecionar Posto</h3>
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
                <button className="profile-save-btn" onClick={() => onConfirm("Posto", position, addressText)}>
                    Confirmar Posto
                </button>
            </div>
          </div>
        </div>
    );
}

//Busca o turno atual e pega o táxi
const fetchTaxis = async (token, setTaxi, setTurnoId) => {
  if (!token) { console.error("Token ausente"); return; }
  try {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const res = await axios.get(`http://localhost:3000/api/turno/atual`, config);
    if (res.data && res.data.taxi) {
      setTaxi(res.data.taxi);
      localStorage.setItem('motoristataxi', JSON.stringify(res.data.taxi));
    }

    if (res.data && res.data._id) {
      setTurnoId(res.data._id);
    }
  } catch (err) {
    console.error("Erro ao procurar turno atual", err.response?.data || err.message);
  }
};

const getDadosMarca = (idBD) => {
  const marcaEncontrada = VEICULOS.marcas.find(m => m.id === idBD);
  return marcaEncontrada ? marcaEncontrada.nome : idBD;
};

function FormFinalizar({ reab, tipoMotor, onFinalizado, onCancelar }) {
    const [fim, setFim] = useState('');
    const [valor, setValor] = useState('');
    const [litros, setLitros] = useState('');
    const [kWh, setKWh] = useState('');
    const [valorFocused, setValorFocused] = useState(false);
    const [litrosFocused, setLitrosFocused] = useState(false);
    const [kWhFocused, setKWhFocused] = useState(false);
 
    const handleFinalizar = async () => {
        if (!fim || !valor) { toastAviso("Preenche todos os parâmetros."); return; }
        if (tipoMotor === "Combustão" && !litros) { toastAviso("Preenche todos os parâmetros."); return; }
        if (tipoMotor === "Elétrico" && !kWh) { toastAviso("Preenche todos os parâmetros."); return; }
 
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.patch(`http://localhost:3000/api/reabastecimento/${reab._id}`, {
                reabastecimentoId: reab._id,
                fim,
                valor_pago: parseFloat(valor),
                litros: parseFloat(litros) || undefined,
                kWh: parseFloat(kWh) || undefined,
            }, config);
            onFinalizado();
        } catch (err) {
            toastErro(err.response?.data?.message || "Erro ao finalizar.");
        }
    };
 
    return (
        <div className="mreab-card mreab-form-card">
          <div className="mreab-form">
            {tipoMotor === "Combustão" && (
                <div className="mreab-field">
                    <label>Litros</label>
                    <input
                        type="text"
                        placeholder="0.00L"
                        value={litrosFocused ? litros : (litros ? litros + 'L' : '')}
                        onFocus={() => setLitrosFocused(true)}
                        onBlur={() => setLitrosFocused(false)}
                        onChange={e => { const r = e.target.value.replace(/L/gi,'').trim(); if (r==='' || /^\d*\.?\d*$/.test(r)) setLitros(r); }}
                    />
                </div>
            )}
            {tipoMotor === "Elétrico" && (
                <div className="mreab-field">
                    <label>kWh</label>
                    <input
                        type="text"
                        placeholder="0.00kWh"
                        value={kWhFocused ? kWh : (kWh ? kWh + 'kWh' : '')}
                        onFocus={() => setKWhFocused(true)}
                        onBlur={() => setKWhFocused(false)}
                        onChange={e => { const r = e.target.value.replace(/kWh/gi,'').trim(); if (r==='' || /^\d*\.?\d*$/.test(r)) setKWh(r); }}
                    />
                </div>
            )}
            <div className="mreab-field">
              <label>Valor (€)</label>
              <input
                  type="text"
                  placeholder="€0.00"
                  value={valorFocused ? valor : (valor ? '€' + valor : '')}
                  onFocus={() => setValorFocused(true)}
                  onBlur={() => setValorFocused(false)}
                  onChange={e => { const r = e.target.value.replace(/€/g,'').trim(); if (r==='' || /^\d*\.?\d*$/.test(r)) setValor(r); }}
              />
            </div>
            <div className="mreab-field">
                <label>Fim</label>
                <input type="datetime-local" value={fim} onChange={e => setFim(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="button" className="mreab-btn-submit" onClick={handleFinalizar}>
                    Finalizar
                </button>
                <button type="button" className="mreab-back-btn" onClick={onCancelar}>
                    Cancelar
                </button>
            </div>
          </div>
        </div>
    );
}

export default function MotoristaReabastecimento() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ litros: '', kWh: '', valor: '', inicio: '', fim: '', posto: '', obs: '', quilometragem: '' });
  const [submitted, setSubmitted] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [litrosFocused, setLitrosFocused] = useState(false);
  const [kWhFocused, setkWhFocused] = useState(false);
  const [valorFocused, setValorFocused] = useState(false);
  const [turnoId, setTurnoId] = useState(null);
  const [finalizandoId, setFinalizandoId] = useState(null);
  const [expandedObsId, setExpandedObsId] = useState(null);
  
  const [postoMorada, setPostoMorada] = useState('');
  const [postoCoords, setPostoCoords] = useState(null); // [lat, lng]
  const [mapaAberto, setMapaAberto] = useState(false);

  const [taxi, setTaxi] = useState(() => {
    const saved = localStorage.getItem('motoristataxi');
    return saved ? JSON.parse(saved) : null;
  });

  const fetchHistorico = async (taxiObj) => {
    const taxiAtual = taxiObj || taxi;
    if (!taxiAtual?._id) return;
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const resHistorico = await axios.get(`http://localhost:3000/api/reabastecimento/${taxiAtual._id}`, config);
      setHistorico(resHistorico.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setHistorico([]);
      } else {
        console.error("Erro ao carregar histórico de reabastecimentos", err.response?.data || err.message);
      }
    }
  }

  useEffect(() => {
      const token = localStorage.getItem('token');
  
      if (!token) {
        navigate('/login'); 
      } else {
        fetchTaxis(token, (taxiData, setTurnoId) => {
          setTaxi(taxiData);
          fetchHistorico(taxiData);
        }, setTurnoId);

        if(taxi) fetchHistorico(taxi);
      }
  }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();

    if (!turnoId) {
      toastErro("Não foi possível identificar o turno ativo. Tenta recarregar a página.");
      return;
    }

    if (!postoMorada) {
      toastErro("Seleciona o posto no mapa.");
      return;
    }

    if (temEmCurso) {
      toastErro("Tens um reabastecimento em curso. Finaliza-o antes de iniciar outro.");
      return;
    }

    if (!form.inicio) {
      toastErro("Preenche a hora de início.");
      return;
    }

    if (!form.quilometragem || Number(form.quilometragem) <= 0) {
      toastErro("Preenche a quilometragem com um valor positivo.");
      return;
    }

    if (temQualquerOpcional) {
        if (!form.fim) { toastErro("Se preencheste dados do fim, indica também a hora de fim."); return; }
        if (!form.valor || parseFloat(form.valor) <= 0) { toastErro("O valor pago deve ser positivo."); return; }
        if (taxi?.tipo_motor === "Combustão" && (!form.litros || parseFloat(form.litros) <= 0)) {
            toastErro("Os litros de combustível devem ser positivos."); return;
        }
        if (taxi?.tipo_motor === "Elétrico" && (!form.kWh || parseFloat(form.kWh) <= 0)) {
            toastErro("Os kWh devem ser positivos."); return;
        }
        if (new Date(form.fim) <= new Date(form.inicio)) {
            toastErro("O fim deve ser posterior ao início."); return;
        }
    }

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const novoRegisto = {
        turnoId,
        quilometragem: form.quilometragem,
        posto: {
          morada: postoMorada,
          localizacao: {
            type: 'Point',
            coordinates: postoCoords ? [postoCoords[1], postoCoords[0]] : [0, 0] // GeoJSON: [lng, lat]
          }
        },
        valor_pago: parseFloat(form.valor || 0).toFixed(2),
        inicio: form.inicio,
        fim: form.fim || undefined,
        litros: parseFloat(form.litros) || undefined,
        kWh: parseFloat(form.kWh) || undefined,
        obs: form.obs
      };

      const res = await axios.post(`http://localhost:3000/api/reabastecimento`, novoRegisto, config);
      
      if (res.data.success) {
        toastSucesso("Reabastecimento registado com sucesso!");
        setHistorico(h => [res.data.registo, ...h]);
        setSubmitted(true);
      }
 
      setTimeout(() => {
        setSubmitted(false);
        setPostoCoords(null);
        setPostoMorada('');
        setForm({ litros: '', kWh: '', valor: '', inicio: '', fim: '', posto: '', obs: '', quilometragem: '' });
      }, 2500);
    } catch (err) {
      toastErro("Erro ao registar o reabastecimento");
    }
  };

  const temFim = !!form.fim;
  const temQualquerOpcional = form.fim || form.valor || form.litros || form.kWh;
  
  const toggleObservacao = (id) => {
    setExpandedObsId(prevId => (prevId === id ? null : id));
  };

  const isValid = form.inicio && form.quilometragem && postoMorada && 
                  (!temQualquerOpcional || (
                    form.fim && form.valor && 
                    (taxi?.tipo_motor === "Combustão" ? form.litros : form.kWh)
                  ));
  const temEmCurso = historico.some(r => r.estado === "Em curso");

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
    <div className="mreab-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="mreab-overlay" />

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

          <li><a onClick={() => navigate('/motorista')}>Dashboard</a></li>

          <li><a className="active">Reabastecimento</a></li>
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

      <div className="mreab-wrapper">

        {/* Título */}
        <div className="mreab-header">
          <div>
            <h1 className="mreab-title">Registar Reabastecimento</h1>
            <div className="mreab-veiculo">
              <span className="mreab-veiculo-modelo">{taxi ? getDadosMarca(taxi.marca) + " " + taxi.modelo : "---" }</span>
              <span className="mreab-veiculo-sep">●</span>
              <span className="mreab-veiculo-matricula">{taxi ? taxi.matricula : "---"}</span>
            </div>
          </div>
          {!taxi && (
            <p className="mreab-aviso">⚠️ Não tens nenhum turno ativo. Requisita um táxi primeiro.</p>
          )}
          <button className="mreab-back-btn" onClick={() => navigate('/motorista')}>Voltar</button>
        </div>

        <div className="mreab-content">

          {/* Formulário */}
          <div className="mreab-card mreab-form-card">
            <h3 className="mreab-card-title">Novo Registo</h3>
              <form className="mreab-form" onSubmit={handleSubmit}>

                <div className="mreab-form-row">
                  {taxi?.tipo_motor === "Combustão" && (
                    <div className="mreab-field">
                      <label>Litros {!temQualquerOpcional && <span className="mreab-label-hint">(opcional)</span>}</label>
                      <input
                        type="text"
                        name="litros"
                        placeholder="0.00L"
                        value={litrosFocused ? form.litros : (form.litros ? form.litros + 'L' : '')}
                        onFocus={() => setLitrosFocused(true)}
                        onBlur={() => setLitrosFocused(false)}
                        onChange={e => {
                          const raw = e.target.value.replace(/L/gi, '').trim();
                          if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                            setForm(f => ({ ...f, litros: raw }));
                          }
                        }}
                        required={!!temQualquerOpcional}
                      />
                    </div>
                  )}

                  {taxi?.tipo_motor === "Elétrico" && (
                    <div className="mreab-field">
                      <label>kWh {!temQualquerOpcional && <span className="mreab-label-hint">(opcional)</span>}</label>
                      <input
                        type="text"
                        name="kWh"
                        placeholder="0.00kWh"
                        value={kWhFocused ? form.kWh : (form.kWh ? form.kWh + 'kWh' : '')}
                        onFocus={() => setkWhFocused(true)}
                        onBlur={() => setkWhFocused(false)}
                        onChange={e => {
                          const raw = e.target.value.replace(/L/gi, '').trim();
                          if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                            setForm(f => ({ ...f, kWh: raw }));
                          }
                        }}
                        required={!!temQualquerOpcional}
                      />
                    </div>
                  )}

                  <div className="mreab-field">
                    <label>Valor Total (€) {!temQualquerOpcional && <span className="mreab-label-hint">(opcional)</span>}</label>
                    <input
                      type="text"
                      name="valor"
                      placeholder="€0.00"
                      value={valorFocused ? form.valor : (form.valor ? '€' + form.valor : '')}
                      onFocus={() => setValorFocused(true)}
                      onBlur={() => setValorFocused(false)}
                      onChange={e => {
                        const raw = e.target.value.replace(/€/g, '').trim();
                        if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                          setForm(f => ({ ...f, valor: raw }));
                        }
                      }}
                      required={!!temQualquerOpcional}
                    />
                  </div>
                </div>

                {form.litros && form.valor && parseFloat(form.litros) > 0 && (
                  <div className="mreab-calc">
                    Preço por litro: <strong>€{(parseFloat(form.valor) / parseFloat(form.litros)).toFixed(3)}</strong>
                  </div>
                )}

                <div className="mreab-form-row">
                  <div className="mreab-field">
                    <label>Início</label>
                    <input
                      type="datetime-local"
                      name="inicio"
                      value={form.inicio}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mreab-field">
                    <label>Fim {!temQualquerOpcional && <span className="mreab-label-hint">(opcional)</span>}</label>
                    <input
                      type="datetime-local"
                      name="fim"
                      value={form.fim}
                      onChange={handleChange}
                      required={!!temQualquerOpcional}
                    />
                  </div>
                </div>

                <div className="mreab-field">
                  <label>Quilometragem Atual</label>
                  <input
                    type="number"
                    name="quilometragem"
                    placeholder="Ex: 142000"
                    value={form.quilometragem}
                    min="1"
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Posto — seletor de mapa */}
                  <div className="mreab-field">
                      <label>Posto de Combustível</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                          <input
                              type="text"
                              placeholder="Seleciona no mapa..."
                              value={postoMorada}
                              readOnly
                              required
                              style={{ flex: 1, cursor: 'default' }}
                          />
                          <button
                              type="button"
                              onClick={() => setMapaAberto(true)}
                              className="mreab-btn-submit"
                              style={{ width: 'auto', padding: '0 16px', margin: 0 }}
                          >
                              📍 Mapa
                          </button>
                      </div>
                  </div>
                {/* {postoCoords && (
                  <span className="mreab-coords-hint">
                    {postoCoords[0].toFixed(5)}, {postoCoords[1].toFixed(5)}
                  </span>
                )} */}

                {mapaAberto && (
                  <MapSelector
                    label="Posto"
                    coordsIniciais={postoCoords}
                    moradaInicial={postoMorada}
                    onConfirm={(_, coords, morada) => {
                      setPostoCoords(coords);
                      setPostoMorada(morada);
                      setMapaAberto(false);
                    }}
                    onClose={() => setMapaAberto(false)}
                  />
                )}

                <div className="mreab-field">
                  <label>Observações</label>
                  <textarea
                    name="obs"
                    placeholder="Notas opcionais..."
                    rows={3}
                    value={form.obs}
                    onChange={handleChange}
                  />
                </div>
                <button type="submit" className="mreab-btn-submit" disabled={!isValid || !taxi || !turnoId || temEmCurso}>
                    {temFim ? 'Registar Reabastecimento' : '⚡ Iniciar Reabastecimento'}
                </button>

              </form>
          </div>

          {/* Histórico de reabastecimentos */}
          <div className="mreab-card mreab-hist-card">
            <h3 className="mreab-card-title">Reabastecimentos Anteriores</h3>
            <div className="mreab-hist-list">
              {historico.length > 0 ? historico.map(r => (
                  <div className="mreab-hist-row" key={r._id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div className="mreab-hist-info">
                              <span className="mreab-hist-posto">{r.posto?.morada || '—'}</span>
                              <span className="mreab-hist-date">
                                  {new Date(r.inicio_abastecimento).toLocaleDateString('pt-PT')} às{" "}
                                  {new Date(r.inicio_abastecimento).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                                  {" "} • {r.quilometragem}km
                              </span>
                          </div>
                          <div className="mreab-hist-values">
                              {r.litros > 0 && <span className="mreab-hist-litros">{r.litros} L</span>}
                              {r.kWh > 0 && <span className="mreab-hist-litros">{r.kWh} kWh</span>}
                              {r.valor_pago > 0 && <span className="mreab-hist-valor">{r.valor_pago}€</span>}
                          </div>
                      </div>

                      {r.estado === "Em curso" && finalizandoId !== r._id && (
                          <button
                              type="button"
                              className="mreab-btn-submit"
                              style={{ margin: 0, padding: '6px 14px', fontSize: '0.85rem' }}
                              onClick={() => setFinalizandoId(r._id)}
                          >
                              Finalizar
                          </button>
                      )}

                      {r.estado === "Em curso" && finalizandoId === r._id && (
                          <FormFinalizar
                              reab={r}
                              tipoMotor={taxi?.tipo_motor}
                              onFinalizado={async () => {
                                  setFinalizandoId(null);
                                  await fetchHistorico(taxi);
                              }}
                              onCancelar={() => setFinalizandoId(null)}
                          />
                      )}
                      {r.obs && r.obs.trim() !== "" && (
                        <button
                          type="button"
                          className="mreab-back-btn"
                          style={{ margin: 0, padding: '4px 8px', fontSize: '0.75rem', height: 'fit-content' }}
                          onClick={() => toggleObservacao(r._id)}
                        >
                          {expandedObsId === r._id ? "Ocultar Notas" : "Ver Notas"}
                        </button>
                      )}
                      {expandedObsId === r._id && (
                        <div style={{
                          marginTop: '8px',
                          padding: '8px 12px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '6px',
                          borderLeft: '3px solid #f5c518',
                          fontSize: '0.85rem',
                          color: '#ddd',
                          fontStyle: 'italic'
                        }}>
                          <strong>Observações:</strong> {r.obs}
                        </div>
                      )}
                  </div>
              )) : (<p style={{color: '#aaa', textAlign: 'center', padding: '20px'}}>Não há reabastecimentos anteriores.</p>)}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
