import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import stripeImg from '../assets/images/stripe.png';
import AvatarDropdown from '../components/AvatarDropdown';
import '../css/Pagamento.css';

function StripeForm() {
  const [num, setNum] = useState('');
  const fmt = v => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  return (
    <div className="pag-form">
      <div className="pag-stripe-badge">
        <img src={stripeImg} alt="Stripe" />
        <span>Pagamento seguro via Stripe</span>
      </div>

      <div className="pag-card-preview">
        <span className="pag-card-chip" />
        <span className="pag-card-number">{num || '•••• •••• •••• ••••'}</span>
        <div className="pag-card-bottom">
          <span className="pag-card-label-sm">Titular</span>
          <span className="pag-card-label-sm">Validade</span>
        </div>
      </div>

      <div className="pag-field">
        <label>Número do Cartão</label>
        <input
          type="text"
          placeholder="1234 5678 9012 3456"
          value={num}
          maxLength={19}
          onChange={e => setNum(fmt(e.target.value))}
        />
      </div>
      <div className="pag-field">
        <label>Nome do Titular</label>
        <input type="text" placeholder="Como aparece no cartão" />
      </div>
      <div className="pag-row">
        <div className="pag-field">
          <label>Data de Validade</label>
          <input type="text" placeholder="MM/AA" maxLength={5} />
        </div>
        <div className="pag-field">
          <label>CVV</label>
          <input type="password" placeholder="•••" maxLength={4} />
        </div>
      </div>
    </div>
  );
}

export default function Pagamento() {
  const navigate = useNavigate();
  const [paid, setPaid] = useState(false);
  const price = '€18.50';

  return (
    <div className="pag-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="pag-overlay" />

      {/* Navbar */}
      <nav className="pag-navbar">
        <span className="pag-logo" onClick={() => navigate('/')}>Need4Rides</span>
        <ul className="pag-nav-links">
          <li><a onClick={() => navigate('/')}>Home</a></li>
          <li><a onClick={() => navigate('/services')} style={{ cursor: 'pointer' }}>Serviços</a></li>
          <li><a onClick={() => navigate('/pedir-taxi')}>Pedir Táxi</a></li>
          <li><a onClick={() => navigate('/viagem')} style={{ cursor: 'pointer' }}>Viagem</a></li>
          <li><a className="active">Pagamento</a></li>
          <li><button className="pag-login-btn" onClick={() => navigate('/login')}>Login</button></li>
          <li><AvatarDropdown profilePath="/profile" avatarClass="pag-avatar" /></li>
        </ul>
      </nav>

      <div className="pag-wrapper">

        {!paid ? (
          <div className="pag-card">

            <div className="pag-header">
              <div>
                <h1>Pagamento</h1>
                <p>Paga a tua viagem em segurança</p>
              </div>
              <div className="pag-price-box">
                <span className="pag-price-label">Total</span>
                <span className="pag-price-value">{price}</span>
              </div>
            </div>

            <div className="pag-divider" />

            <StripeForm />

            <div className="pag-divider" />

            <div className="pag-actions">
              <button className="pag-btn-back" onClick={() => navigate(-1)}>← Voltar</button>
              <button className="pag-btn-pay" onClick={() => setPaid(true)}>
                Confirmar Pagamento · {price}
              </button>
            </div>

          </div>
        ) : (
          <div className="pag-card pag-success">
            <div className="pag-success-icon">✓</div>
            <h2>Pagamento Confirmado!</h2>
            <p>A tua viagem foi paga com sucesso.</p>
            <div className="pag-success-actions">
              <button className="pag-btn-pay" onClick={() => navigate('/profile')}>Ver Histórico</button>
              <button className="pag-btn-back" onClick={() => navigate('/')}>Voltar ao Início</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
