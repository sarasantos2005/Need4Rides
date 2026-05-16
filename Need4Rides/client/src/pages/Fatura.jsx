import { useLocation, useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/Fatura.css';
import { useState, useEffect } from "react";
import axios from 'axios';
import '../css/global.css';

export default function Fatura() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [fatura, setFaturaDados] = useState([]);
  const trip = state?.trip;
  const client = state?.client ?? 'Cliente';
  const [tema, setTema] = useState(() => {
    return localStorage.getItem('tema') || 'escuro';
  });

  useEffect(() => {
    document.body.className = tema;
    localStorage.setItem('tema', tema);
  }, [tema]);
  
  useEffect(() => {
    const carregarFatura = async() => {
      try {
        const res = await axios.get(`http://localhost:3000/api/fatura/${trip._id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        setFaturaDados(res.data.fatura);
      } catch (err) {
        console.error("Fatura não encontrada na BD");
      }
    };

    if (trip?._id) carregarFatura();
  }, [trip]);

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

  const nSequencial = fatura?.n_sequencial 
    ? String(fatura.n_sequencial).padStart(3, '0') 
    : '---';

  const invoiceNumber = fatura?.ano ? `N4R-${fatura.ano}/${nSequencial}` : `A processar...`;
  
  const dataEmissao = fatura?.data_emissao ? new Date(fatura.data_emissao).toLocaleDateString() : new Date(trip.hora_inicial_viagem).toLocaleDateString();

  const handleDownload = () => {
    const content = `
FATURA — Need4Rides
================================
Nº Fatura:        ${invoiceNumber}
Data:             ${dataEmissao}
================================
Cliente:          ${client}
Motorista:        ${trip.turno?.motorista?.nome ?? "Não atribuído"}
================================
Origem:           ${trip.morada_inicial_viagem?.morada}
Destino:          ${trip.morada_final_viagem?.morada}
================================
Método Pagamento: Stripe
Total:            ${trip.preco_viagem.toFixed(2)}
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
              <p>{trip.turno?.motorista?.nome ?? "Não atribuído"}</p>
            </div>
            <div className="fatura-section">
              <h3>Data</h3>
              <p>{new Date(trip.hora_inicial_viagem).toLocaleDateString()}</p>
            </div>
            <div className="fatura-section">
              <h3>Hora</h3>
              <p>{new Date(trip.hora_inicial_viagem).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
          </div>

          <div className="fatura-divider" />

          {/* Rota */}
          <div className="fatura-route">
            <div className="fatura-point">
              <span className="fatura-dot origin" />
              <div>
                <span className="fatura-point-label">Origem</span>
                <span className="fatura-point-value">{trip.morada_inicial_viagem?.morada}</span>
              </div>
            </div>
            <div className="fatura-line" />
            <div className="fatura-point">
              <span className="fatura-dot destination" />
              <div>
                <span className="fatura-point-label">Destino</span>
                <span className="fatura-point-value">{trip.morada_final_viagem?.morada}</span>
              </div>
            </div>
          </div>

          <div className="fatura-divider" />

          {/* Pagamento */}
          <div className="fatura-payment-row">
            <div className="fatura-section">
              <h3>Método de Pagamento</h3>
              <p>Stripe</p>
            </div>
            <div className="fatura-total-box">
              <span className="fatura-total-label">Total</span>
              <span className="fatura-total-value">{trip.preco_viagem?.toFixed(2)}€</span>
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
