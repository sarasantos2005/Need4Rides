import { useNavigate } from 'react-router-dom';
import ddImg from '../assets/images/fennec.jpg';
import heroBg from '../assets/images/LA.jpg';
import '../css/Profile.css';

const mockViagens = [
  { id: 1, from: 'Aeroporto de Lisboa', to: 'Baixa-Chiado',  date: '31 Mar 2026', time: '09:42', price: '€18.50', km: '14 km', passengers: 2 },
  { id: 2, from: 'Parque das Nações',   to: 'Benfica',        date: '31 Mar 2026', time: '08:15', price: '€12.80', km: '9 km',  passengers: 1 },
  { id: 3, from: 'Cascais',             to: 'Sintra',         date: '30 Mar 2026', time: '17:30', price: '€31.00', km: '22 km', passengers: 3 },
];

export default function MotoristaProfile() {
  const navigate = useNavigate();

  return (
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
              <h1>João Motorista</h1>
              <div className="profile-badges">
                <span className="profile-badge">Motorista Verificado</span>
                <span className="profile-badge">Membro desde Janeiro de 2024</span>
              </div>
            </div>
            <button className="profile-back-btn" onClick={() => navigate('/motorista')}>
              ← Voltar
            </button>
          </div>

          <div className="profile-divider" />

          {/* Dados pessoais */}
          <div className="profile-details">
            <div className="profile-field">
              <label>Nome</label>
              <input type="text" defaultValue="João Motorista" />
            </div>
            <div className="profile-field">
              <label>Email</label>
              <input type="email" defaultValue="joao.motorista@email.com" />
            </div>
            <div className="profile-field">
              <label>Telefone</label>
              <input type="tel" defaultValue="+351 961 234 567" />
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
            <div className="profile-field">
              <label>Data de Nascimento</label>
              <input type="date" defaultValue="1990-05-15" />
            </div>
            <div className="profile-field">
              <label>Nº Carta de Condução</label>
              <input type="text" defaultValue="C-12345678" />
            </div>
            <div className="profile-field">
              <label>Morada</label>
              <input type="text" defaultValue="Rua das Flores, 12, Lisboa" />
            </div>
          </div>

          <button className="profile-save-btn">Guardar Alterações</button>
        </div>

        {/* Histórico de viagens */}
        <div className="profile-trips">
          <h2>Histórico de Viagens</h2>
          <div className="trips-list">
            {mockViagens.map(v => (
              <div className="trip-card" key={v.id}>
                <div className="trip-main">
                  <div className="trip-route">
                    <span className="trip-from">{v.from}</span>
                    <span className="trip-arrow">→</span>
                    <span className="trip-to">{v.to}</span>
                  </div>
                  <div className="trip-meta">
                    <span className="trip-date">{v.date} · {v.time}</span>
                    <span className="trip-date">{v.km} · {v.passengers} pax</span>
                    <span className="trip-price">{v.price}</span>
                    <span className="trip-status">Concluída</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
