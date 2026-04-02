import { useLocation, useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/Fatura.css';

export default function Fatura() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const trip = state?.trip;
  const client = state?.client ?? 'Cliente';

  if (!trip) {
    return (
      <div className="fatura-page" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="fatura-overlay" />
        <div className="fatura-wrapper">
          <p style={{ color: '#fff' }}>Fatura não encontrada.</p>
          <button onClick={() => navigate('/profile')}>Voltar</button>
        </div>
      </div>
    );
  }

  const invoiceNumber = `N4R-2026-00${trip.id}`;

  const handleDownload = () => {
    const content = `
FATURA — Need4Rides
================================
Nº Fatura:        ${invoiceNumber}
Data:             ${trip.date} às ${trip.time}
================================
Cliente:          ${client}
Motorista:        ${trip.driver}
================================
Origem:           ${trip.from}
Destino:          ${trip.to}
================================
Método Pagamento: ${trip.payment}
Total:            ${trip.price}
================================
Obrigado por viajar com Need4Rides!
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fatura-${invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Fatura Need4Rides — ${invoiceNumber}`);
    const body = encodeURIComponent(
      `Olá,\n\nSegue em anexo a fatura referente à sua viagem:\n\nNº Fatura: ${invoiceNumber}\nData: ${trip.date} às ${trip.time}\nOrigem: ${trip.from}\nDestino: ${trip.to}\nMétodo de Pagamento: ${trip.payment}\nTotal: ${trip.price}\n\nObrigado por viajar com Need4Rides!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fatura-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="fatura-overlay" />

      <div className="fatura-wrapper">
        <div className="fatura-card">

          {/* Cabeçalho */}
          <div className="fatura-header">
            <div>
              <h1 className="fatura-logo">Need4Rides</h1>
              <p className="fatura-doc">Fatura / Recibo</p>
            </div>
            <div className="fatura-number-box">
              <span className="fatura-label">Nº Fatura</span>
              <span className="fatura-number">{invoiceNumber}</span>
            </div>
          </div>

          <div className="fatura-divider" />

          {/* Info principal */}
          <div className="fatura-grid">
            <div className="fatura-section">
              <h3>Cliente</h3>
              <p>{client}</p>
            </div>
            <div className="fatura-section">
              <h3>Motorista</h3>
              <p>{trip.driver}</p>
            </div>
            <div className="fatura-section">
              <h3>Data</h3>
              <p>{trip.date}</p>
            </div>
            <div className="fatura-section">
              <h3>Hora</h3>
              <p>{trip.time}</p>
            </div>
          </div>

          <div className="fatura-divider" />

          {/* Rota */}
          <div className="fatura-route">
            <div className="fatura-point">
              <span className="fatura-dot origin" />
              <div>
                <span className="fatura-point-label">Origem</span>
                <span className="fatura-point-value">{trip.from}</span>
              </div>
            </div>
            <div className="fatura-line" />
            <div className="fatura-point">
              <span className="fatura-dot destination" />
              <div>
                <span className="fatura-point-label">Destino</span>
                <span className="fatura-point-value">{trip.to}</span>
              </div>
            </div>
          </div>

          <div className="fatura-divider" />

          {/* Pagamento */}
          <div className="fatura-payment-row">
            <div className="fatura-section">
              <h3>Método de Pagamento</h3>
              <p>{trip.payment}</p>
            </div>
            <div className="fatura-total-box">
              <span className="fatura-total-label">Total</span>
              <span className="fatura-total-value">{trip.price}</span>
            </div>
          </div>

          <div className="fatura-divider" />

          {/* Ações */}
          <div className="fatura-actions">
            <button className="fatura-btn secondary" onClick={() => navigate('/profile')}>
              ← Voltar
            </button>
            <button className="fatura-btn email" onClick={handleEmail}>
              ✉ Enviar por Email
            </button>
            <button className="fatura-btn download" onClick={handleDownload}>
              ↓ Download
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
