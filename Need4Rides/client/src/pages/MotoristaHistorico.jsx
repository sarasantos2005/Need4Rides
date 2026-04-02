import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/MotoristaHistorico.css';
import AvatarDropdown from '../components/AvatarDropdown';

const allViagens = [
  { id: 1,  from: 'Oriente',           to: 'Alfama',              date: '31 Mar 2026', time: '09:42', price: '€09.20',  km: 6,  passengers: 1, payment: 'Stripe',         status: 'Concluída' },
  { id: 2,  from: 'Saldanha',          to: 'Aeroporto',           date: '31 Mar 2026', time: '08:15', price: '€22.00', km: 14, passengers: 2, payment: 'Stripe',         status: 'Concluída' },
  { id: 3,  from: 'Belém',             to: 'Marquês de Pombal',   date: '30 Mar 2026', time: '17:30', price: '€14.60', km: 9,  passengers: 1, payment: 'Stripe',       status: 'Concluída' },
  { id: 4,  from: 'Campo Grande',      to: 'Cascais',             date: '30 Mar 2026', time: '14:05', price: '€38.90', km: 28, passengers: 3, payment: 'Stripe',         status: 'Concluída' },
  { id: 5,  from: 'Baixa-Chiado',      to: 'Parque das Nações',   date: '29 Mar 2026', time: '11:20', price: '€16.40', km: 11, passengers: 2, payment: 'Stripe',         status: 'Concluída' },
  { id: 6,  from: 'Aeroporto',         to: 'Sintra',              date: '29 Mar 2026', time: '09:55', price: '€44.10', km: 32, passengers: 4, payment: 'Stripe',         status: 'Concluída' },
  { id: 7,  from: 'Intendente',        to: 'Belém',               date: '28 Mar 2026', time: '16:40', price: '€12.30', km: 8,  passengers: 1, payment: 'Stripe',       status: 'Concluída' },
  { id: 8,  from: 'Benfica',           to: 'Baixa-Chiado',        date: '28 Mar 2026', time: '13:10', price: '€10.80', km: 7,  passengers: 2, payment: 'Stripe',         status: 'Concluída' },
  { id: 9,  from: 'Cascais',           to: 'Aeroporto',           date: '27 Mar 2026', time: '06:30', price: '€51.20', km: 37, passengers: 1, payment: 'Stripe',         status: 'Concluída' },
  { id: 10, from: 'Rossio',            to: 'Campo Grande',        date: '27 Mar 2026', time: '19:50', price: '€11.60', km: 7,  passengers: 3, payment: 'Stripe',       status: 'Concluída' },
];

const totalGanhos = allViagens.reduce((acc, v) => acc + parseFloat(v.price.replace('€', '')), 0).toFixed(2);
const totalKm     = allViagens.reduce((acc, v) => acc + v.km, 0);

export default function MotoristaHistorico() {
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState('todas');

  const viagens = filtro === 'todas' ? allViagens : allViagens.filter(v => v.date.includes(filtro));

  return (
    <div className="mhist-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="mhist-overlay" />

      {/* Navbar */}
      <nav className="mhist-navbar">
        <span className="mhist-logo" onClick={() => navigate('/motorista')} style={{ cursor: 'pointer' }}>Need4Rides</span>
        <ul className="mhist-nav-links">
          <li><a onClick={() => navigate('/motorista')} style={{ cursor: 'pointer' }}>Dashboard</a></li>
          <li><a onClick={() => navigate('/motorista/reabastecimento')} style={{ cursor: 'pointer' }}>Registar Reabastecimento</a></li>
          <li><a className="active">Histórico</a></li>
          <li><a onClick={() => navigate('/motorista/suporte')} style={{ cursor: 'pointer' }}>Suporte</a></li>
          <li><a onClick={() => navigate('/motorista/viagem')} style={{ cursor: 'pointer' }}>Viagem</a></li>
          <li><AvatarDropdown profilePath="/motorista/perfil" avatarClass="mhist-avatar" /></li>
        </ul>
      </nav>

      <div className="mhist-wrapper">

        {/* Header */}
        <div className="mhist-header">
          <div>
            <h1 className="mhist-title">Histórico de Viagens</h1>
            <p className="mhist-sub">Todas as tuas viagens concluídas</p>
          </div>
          <button className="mhist-back-btn" onClick={() => navigate('/motorista')}>← Voltar</button>
        </div>

        {/* Stats */}
        <div className="mhist-stats">
          <div className="mhist-stat">
            <span className="mhist-stat-label">Total de Viagens</span>
            <span className="mhist-stat-value">{allViagens.length}</span>
          </div>
          <div className="mhist-stat accent">
            <span className="mhist-stat-label">Total Ganho</span>
            <span className="mhist-stat-value">€{totalGanhos}</span>
          </div>
          <div className="mhist-stat">
            <span className="mhist-stat-label">Km Totais</span>
            <span className="mhist-stat-value">{totalKm} km</span>
          </div>
          <div className="mhist-stat">
            <span className="mhist-stat-label">Média por Viagem</span>
            <span className="mhist-stat-value">€{(totalGanhos / allViagens.length).toFixed(2)}</span>
          </div>
        </div>

        {/* Filtros */}
        <div className="mhist-filters">
          {['todas', '31 Mar 2026', '30 Mar 2026', '29 Mar 2026', '28 Mar 2026', '27 Mar 2026'].map(f => (
            <button
              key={f}
              className={`mhist-filter-btn ${filtro === f ? 'active' : ''}`}
              onClick={() => setFiltro(f)}
            >
              {f === 'todas' ? 'Todas' : f}
            </button>
          ))}
        </div>

        {/* Tabela */}
        <div className="mhist-card">
          <div className="mhist-list">
            {viagens.map(v => (
              <div className="mhist-row" key={v.id}>
                <div className="mhist-route">
                  <span className="mhist-from">{v.from}</span>
                  <span className="mhist-arrow">→</span>
                  <span className="mhist-to">{v.to}</span>
                </div>
                <div className="mhist-meta">
                  <span className="mhist-date">{v.date} · {v.time}</span>
                  <span className="mhist-detail">{v.km} km</span>
                  <span className="mhist-detail">{v.passengers} pax</span>
                  <span className="mhist-detail">{v.payment}</span>
                  <span className="mhist-status-badge">{v.status}</span>
                  <span className="mhist-price">{v.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
