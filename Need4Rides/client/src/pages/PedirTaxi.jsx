import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/PedirTaxi.css';
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

export default function PedirTaxi() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ origin: '', destination: '', passengers: 1, comfort: 'basic' });
  const [confirmed, setConfirmed] = useState(false);

  const estimate = calcEstimate(form.origin, form.destination, form.passengers);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setConfirmed(false);
  };

  const handleConfirm = e => {
    e.preventDefault();
    navigate('/aguardar-taxi', { state: { form, estimate } });
  };

  return (
    <div className="pt-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="pt-overlay" />

      {/* Navbar */}
      <nav className="pt-navbar">
        <span className="pt-logo" onClick={() => navigate('/home')}>Need4Rides</span>
        <ul className="pt-nav-links">
          <li><a onClick={() => navigate('/home')}>Home</a></li>
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
                name="origin"
                type="text"
                placeholder="De onde partes?"
                value={form.origin}
                onChange={handleChange}
                required
              />
            </div>

            <div className="pt-field">
              <label>Destino</label>
              <input
                name="destination"
                type="text"
                placeholder="Para onde vais?"
                value={form.destination}
                onChange={handleChange}
                required
              />
            </div>

            <div className="pt-field">
              <label>Número de Passageiros</label>
              <div className="pt-passengers">
                {[1, 2, 3, 4, 5, 6].map(n => (
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
                  { value: 'basic', label: 'Básico' },
                  { value: 'luxury', label: 'Luxuoso' },
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
                <button type="button" className="pt-btn-back" onClick={() => { setConfirmed(false); setForm({ origin: '', destination: '', passengers: 1 }); }}>
                  Nova Viagem
                </button>
              </div>
            )}

          </form>

        </div>
      </div>
    </div>
  );
}
