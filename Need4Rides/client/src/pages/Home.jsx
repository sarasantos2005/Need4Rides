import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import taxiImg from '../assets/images/taxi.png';
import heroBg from '../assets/images/LA.jpg';
import '../css/Home.css';
import '../css/HomeNav.css';
import '../css/global.css';

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

export default function Home() {
  const navigate = useNavigate();
  const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'escuro');

  useEffect(() => {
    document.body.className = tema;
    localStorage.setItem('tema', tema);
  }, [tema]);

  const alternarTema = () => setTema(prev => (prev === 'escuro' ? 'claro' : 'escuro'));

  return (
    <div className="home">
      {/* Navbar */}
      <nav className="gb-navbar">
        <span className="gb-logo">Need4Rides</span>
        <ul className="gb-nav-links">
          <li>
            <button className="gb-theme-btn" onClick={alternarTema}>
              {tema === 'escuro' ? '☀️ Claro' : '🌙 Escuro'}
            </button>
          </li>
          <li>
            <button
              className="navbar-login-btn"
              onClick={() => navigate('/login', { state: { mode: 'login' } })}
            >
              Login
            </button>
          </li>
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
          <h1 className="hero-title">Need4Rides</h1>
          <p className="hero-slogan">A tua viagem, ao teu ritmo.</p>
          <div className="hero-auth-btns">
            <button className="hero-btn-register" onClick={() => navigate('/login', { state: { mode: 'register' } })}>
              Registar
            </button>
            <button className="hero-btn" onClick={() => navigate('/login', { state: { mode: 'login' } })}>
              Login
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
