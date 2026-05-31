import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import heroBg from '../assets/images/LA.jpg';
import stripeImg from '../assets/images/stripe.png';
import AvatarDropdown from '../components/AvatarDropdown';
import { toastAviso } from '../components/toast';
import '../css/Pagamento.css';
import '../css/global.css';
import useAuthGuard from '../hooks/authGuard';

useAuthGuard();

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// ── Formulário real do Stripe ────────────────────────────────────────────────
function CheckoutForm({ viagemId, preco, onSuccess }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [erro, setErro]             = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setErro(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (error) {
      setErro(error.message);
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      try {
        const token = localStorage.getItem('token');
        await fetch('http://localhost:3000/api/pagamento/confirmar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ viagemId, paymentIntentId: paymentIntent.id }),
        });
      } catch {
        // pagamento confirmado no Stripe mesmo que o backend falhe
      }
      onSuccess();
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="pag-form">
      <div className="pag-stripe-badge">
        <img src={stripeImg} alt="Stripe" />
        <span>Pagamento seguro via Stripe</span>
      </div>

      <PaymentElement options={{ layout: 'tabs' }} />

      {erro && (
        <p style={{ color: '#ff6b6b', fontSize: '0.85rem', margin: 0 }}>{erro}</p>
      )}

      <div className="pag-actions">
        <button type="submit" className="pag-btn-pay" disabled={!stripe || processing}>
          {processing ? 'A processar...' : `Pagar €${preco}`}
        </button>
      </div>
    </form>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function Pagamento() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen]       = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [preco, setPreco]             = useState(null);
  const [paid, setPaid]               = useState(false);
  const [erro, setErro]               = useState(null);

  const viagemId = location.state?.viagemId || localStorage.getItem('pagamentoViagemId');

  useEffect(() => {
    if (location.state?.aviso) toastAviso('Tem uma viagem por pagar. Conclua o pagamento para continuar.');
  }, []);

  useEffect(() => {
    if (paid) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [paid]);

  const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'escuro');
  useEffect(() => { document.body.className = tema; localStorage.setItem('tema', tema); }, [tema]);
  const alternarTema = () => setTema(prev => prev === 'escuro' ? 'claro' : 'escuro');

  useEffect(() => {
    if (!viagemId) { setErro('Nenhuma viagem encontrada.'); return; }

    const token = localStorage.getItem('token');
    fetch('http://localhost:3000/api/pagamento/criar-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ viagemId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          setPreco((data.amount / 100).toFixed(2));
        } else {
          setErro(data.message || 'Erro ao iniciar pagamento.');
        }
      })
      .catch(() => setErro('Erro de ligação ao servidor.'));
  }, [viagemId]);

  const stripeOptions = {
    clientSecret,
    appearance: {
      theme: 'night',
      variables: {
        colorPrimary: '#f5c518',
        colorBackground: 'rgba(18,18,26,0)',
        colorText: '#f0f0f0',
        colorDanger: '#ff6b6b',
        borderRadius: '12px',
        fontFamily: 'Segoe UI, system-ui, sans-serif',
      },
    },
  };

  const USERNAME = JSON.parse(localStorage.getItem("user_logado")).nome;

  return (
    <div className="pag-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="pag-overlay" />

      <nav className="gb-navbar">
        <span className="gb-logo" onClick={() => navigate('/')}>Need4Rides</span>

        <div className={`gb-hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span /><span />
        </div>

        <ul className={`gb-nav-links ${menuOpen ? 'active' : ''}`}>
          <li className="gb-profile-li avatarHamburguer">
            <AvatarDropdown profilePath="/profile" avatarClass="gb-avatar" />
            <span className="gb-profile-pill-name">{USERNAME}</span>
          </li>
          <li><a onClick={() => { navigate('/home'); setMenuOpen(false); }}>Home</a></li>
          <li><a onClick={() => { navigate('/pedir-taxi'); setMenuOpen(false); }}>Pedir Táxi</a></li>
          <li><a className="active">Pagamento</a></li>
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

      <div className="pag-wrapper">

        {paid ? (
          <div className="pag-card pag-success">
            <div className="pag-success-icon">✓</div>
            <h2>Pagamento Confirmado!</h2>
            <p>A tua viagem foi paga com sucesso.</p>
            <div className="pag-success-actions">
              <button className="pag-btn-pay" onClick={() => navigate('/home', { state: { avaliarViagemId: viagemId } })}>Voltar ao Início</button>
            </div>
          </div>

        ) : erro ? (
          <div className="pag-card pag-success">
            <div className="pag-success-icon" style={{ background: 'linear-gradient(135deg,#ff6b6b,#ee5a24)' }}>✕</div>
            <h2>Erro</h2>
            <p>{erro}</p>
            <div className="pag-success-actions">
              <button className="pag-btn-back" onClick={() => navigate(-1)}>← Voltar</button>
            </div>
          </div>

        ) : !clientSecret ? (
          <div className="pag-card" style={{ alignItems: 'center', gap: '1rem' }}>
            <p style={{ color: '#e9e9e9' }}>A preparar pagamento...</p>
          </div>

        ) : (
          <div className="pag-card">
            <div className="pag-header">
              <div>
                <h1>Pagamento</h1>
                <p>Paga a tua viagem em segurança</p>
              </div>
              <div className="pag-price-box">
                <span className="pag-price-label">Total</span>
                <span className="pag-price-value">€{preco}</span>
              </div>
            </div>

            <div className="pag-divider" />

            <Elements stripe={stripePromise} options={stripeOptions}>
              <CheckoutForm viagemId={viagemId} preco={preco} onSuccess={() => { localStorage.removeItem('pagamentoViagemId'); setPaid(true); }} />
            </Elements>
          </div>
        )}

      </div>
    </div>
  );
}
