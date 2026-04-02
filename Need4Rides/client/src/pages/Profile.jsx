import { useNavigate } from 'react-router-dom';
import ddImg from '../assets/images/fennec.jpg';
import heroBg from '../assets/images/LA.jpg';
import '../css/Profile.css';

const mockTrips = [
  { id: 1, from: 'Aeroporto de Lisboa', to: 'Baixa-Chiado', date: '28 Mar 2026', time: '14:35', price: '€18.50', status: 'Concluída', payment: 'Cartão de Crédito', driver: 'Carlos Silva' },
  { id: 2, from: 'Parque das Nações', to: 'Cascais', date: '25 Mar 2026', time: '09:10', price: '€34.00', status: 'Concluída', payment: 'MB Way', driver: 'Ana Costa' },
  { id: 3, from: 'Benfica', to: 'Oriente', date: '20 Mar 2026', time: '18:55', price: '€12.80', status: 'Concluída', payment: 'Dinheiro', driver: 'Rui Santos' },
];

export default function Profile() {
  const navigate = useNavigate();

  return (
    <div
      className="profile-page"
      style={{ backgroundImage: `url(${heroBg})` }}
    >
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
              <h1>Guilherme Ribeiro</h1>
              <div className="profile-badges">
                <span className="profile-badge">Cliente Verificado</span>
                <span className="profile-badge">Membro desde Janeiro de 2025</span>
              </div>
            </div>
            <button className="profile-back-btn" onClick={() => navigate('/home')}>
              ← Voltar
            </button>
          </div>

          <div className="profile-divider" />

          {/* Dados */}
          <div className="profile-details">
            <div className="profile-field">
              <label>Email</label>
              <input type="email" defaultValue="gui.ribeiro@email.com" />
            </div>
            <div className="profile-field">
              <label>Telefone</label>
              <input type="tel" defaultValue="+351 912 345 678" />
            </div>
            <div className="profile-field">
              <label>Cidade</label>
              <input type="text" defaultValue="Lisboa, Portugal" />
            </div>
            <div className="profile-field">
              <label>NIF</label>
              <input type="text" defaultValue="123456789" maxLength={9} />
            </div>
            <div className="profile-field">
              <label>Género</label>
              <select className="profile-select" defaultValue="masculino">
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </select>
            </div>
          </div>

          <button className="profile-save-btn">Guardar Alterações</button>
        </div>

        {/* Histórico de viagens */}
        <div className="profile-trips">
          <h2>Histórico de Viagens</h2>
          <div className="trips-list">
            {mockTrips.map(trip => (
              <div className="trip-card" key={trip.id}>
                <div className="trip-main">
                  <div className="trip-route">
                    <span className="trip-from">{trip.from}</span>
                    <span className="trip-arrow">→</span>
                    <span className="trip-to">{trip.to}</span>
                  </div>
                  <div className="trip-meta">
                    <span className="trip-date">{trip.date} · {trip.time}</span>
                    <span className="trip-price">{trip.price}</span>
                    <span className="trip-status">{trip.status}</span>
                  </div>
                </div>
                <button
                  className="trip-invoice-btn"
                  onClick={() => navigate('/fatura', { state: { trip, client: 'Guilherme Ribeiro' } })}
                >
                  Fatura
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
