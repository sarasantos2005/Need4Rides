import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import taxiImg from '../assets/images/taxi.png';
import heroBg from '../assets/images/LA.jpg';
import '../css/Home.css';
import AvatarDropdown from '../components/AvatarDropdown';
import axios from 'axios';

const MOCK_SAVED_PLACES = [
  { label: 'Casa',      address: 'Rua das Flores, 12, Lisboa',     icon: '🏠' },
  { label: 'Trabalho',  address: 'Av. da Liberdade, 245, Lisboa',  icon: '💼' },
];

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
  const [savedPlaces, setSavedPlaces]  = useState(MOCK_SAVED_PLACES);
  const [userData, setUserData] = useState({ nome: 'Utilizador' });
  
  useEffect(() => {
    carregarDados();
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
      // setSavedPlaces(resLocais.data || []);

      const ativa = JSON.parse(localStorage.getItem('viagemAtiva'));
      if (ativa && ativa.viagemId !== null) setActiveTrip(ativa);

      setUserData(JSON.parse(storedUser));
    }
  };
 
  const repeatTrip = (trip) => {
    const tripData = {
      origem: trip.morada_inicial_viagem,
      destino: trip.morada_final_viagem,
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
    navigate('/pedir-taxi', { state: { destination: place.address } });
  };

  const firstName = userData.nome.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 19 ? 'Boa tarde' : 'Boa noite';

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div className="home">
      {/* Navbar */}
      <nav className="navbar">
        <span className="navbar-logo">Need4Rides</span>
        <ul className="navbar-links">
          <li><a onClick={() => navigate('/pedir-taxi')} style={{ cursor: 'pointer' }}>Pedir Táxi</a></li>
          <li><AvatarDropdown profilePath="/profile" avatarClass="navbar-avatar" /></li>
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
                  <h3 className="dash-card-title">A caminho de <strong>{activeTrip.destino.morada}</strong></h3>
                  <p className="dash-card-sub">Motorista: {activeTrip.driver.nome} · Tempo de espera: {activeTrip.eta.wait}</p>
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
                  {savedPlaces.map((p, i) => (
                    <button key={i} className="saved-place-btn" onClick={() => goToSavedPlace(p)}>
                      <span className="saved-place-icon">{p.icon}</span>
                      <span className="saved-place-info">
                        <span className="saved-place-label">{p.label}</span>
                        <span className="saved-place-addr">{p.address}</span>
                      </span>
                      <span className="saved-place-arrow">→</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Card: Últimas viagens */}
              <div className="dash-card dash-card--history">
                <div className="dash-card-badge">🕒 Últimas Viagens</div>
                <ul className="trips-list">
                  {recentTrips.length > 0 ? (
                  recentTrips.slice(0,3).map(trip => (
                    <li key={trip.id} className="trip-item">
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
    </div>
  );
}
