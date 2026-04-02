import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import taxiImg from '../assets/images/taxi.png';
import heroBg from '../assets/images/LA.jpg';
import '../css/Home.css';
import AvatarDropdown from '../components/AvatarDropdown';

const BASE_PRICE = 3.5;
const PRICE_PER_KM = 1.8;
const WAIT_BASE = 4;

function calcEstimate(origin, destination, passengers) {
  if (!origin || !destination) return null;
  const seed = (origin.length + destination.length) * 1.3;
  const km = Math.max(2, Math.round(seed % 22) + 3);
  const price = (BASE_PRICE + km * PRICE_PER_KM * (passengers > 4 ? 1.2 : 1)).toFixed(2);
  const wait = WAIT_BASE + Math.round(km / 3);
  return { km, price, wait };
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

export default function HomeLogado() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ origin: '', destination: '', passengers: '', comfort: '' });

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleGetTaxi = () => {
    const estimate = calcEstimate(form.origin, form.destination, Number(form.passengers) || 1);
    navigate('/aguardar-taxi', { state: { form, estimate } });
  };

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
      <section
        className="hero"
        id="hero"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">Vamos viajar, Gui?</h1>
          <div className="hero-form-block">
            <form className="hero-form" onSubmit={e => e.preventDefault()}>
              <input
                type="text"
                name="origin"
                placeholder="Ponto de Partida..."
                value={form.origin}
                onChange={handleChange}
              />
              <input
                type="text"
                name="destination"
                placeholder="Ponto de Chegada..."
                value={form.destination}
                onChange={handleChange}
              />
              <select name="passengers" value={form.passengers} onChange={handleChange}>
                <option value="" disabled>Nº de Passageiros</option>
                <option value="1">1 Passageiro</option>
                <option value="2">2 Passageiros</option>
                <option value="3">3 Passageiros</option>
                <option value="4">4 Passageiros</option>
                <option value="5">5 Passageiros</option>
                <option value="6">6 Passageiros</option>
              </select>
              <select name="comfort" value={form.comfort} onChange={handleChange}>
                <option value="" disabled>Conforto do Carro</option>
                <option value="basic">Básico</option>
                <option value="luxury">Luxuoso</option>
              </select>
            </form>
            <button className="hero-btn" onClick={handleGetTaxi}>
              GET TAXI
            </button>
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
