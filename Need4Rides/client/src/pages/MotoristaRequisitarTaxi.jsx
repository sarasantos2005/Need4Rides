import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/MotoristaHome.css';
import AvatarDropdown from '../components/AvatarDropdown';
import '../css/MotoristaRequisitarTaxi.css';

const taxisDisponiveis = [
  { id: 1, matricula: '00-DD-04', modelo: 'Renault Zoe',  tipo: 'Elétrico',  conforto: 'Básico',  combustivel: 91, autonomia: 280, turno: '08:00 – 16:00' },
  { id: 2, matricula: '00-FF-06', modelo: 'BMW i4',       tipo: 'Elétrico',  conforto: 'Luxuoso', combustivel: 74, autonomia: 410, turno: '16:00 – 00:00' },
  { id: 3, matricula: '00-GG-07', modelo: 'Seat León',    tipo: 'Combustão', conforto: 'Básico',  combustivel: 55, autonomia: 390, turno: '00:00 – 08:00' },
  { id: 4, matricula: '00-HH-08', modelo: 'Audi A6',      tipo: 'Combustão', conforto: 'Luxuoso', combustivel: 82, autonomia: 620, turno: '08:00 – 16:00' },
];

export default function MotoristaRequisitarTaxi() {
  const navigate = useNavigate();
  const [selecionado, setSelecionado] = useState(null);

  const handleConfirmar = () => {
    if (!selecionado) return;
    localStorage.setItem('motoristataxi', JSON.stringify(selecionado));
    navigate('/motorista');
  };

  return (
    <div className="mrt-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="mh-overlay" />

      {/* Navbar */}
      <nav className="mh-navbar">
        <span className="mh-logo">Need4Rides</span>
        <ul className="mh-nav-links">
          <li><a style={{ cursor: 'pointer' }} onClick={() => navigate('/motorista')}>Dashboard</a></li>
          <li><a onClick={() => navigate('/motorista/historico')} style={{ cursor: 'pointer' }}>Histórico</a></li>
          <li><a onClick={() => navigate('/motorista/suporte')} style={{ cursor: 'pointer' }}>Suporte</a></li>
          <li>
            <AvatarDropdown profilePath="/motorista/perfil" avatarClass="mh-avatar" />
          </li>
        </ul>
      </nav>

      <div className="mrt-wrapper">
        <div className="mrt-header">
          <div>
            <h1 className="mrt-title">Requisitar Táxi</h1>
            <p className="mrt-subtitle">Seleciona um veículo disponível para o teu turno</p>
          </div>
          <button className="mrt-btn-cancel" onClick={() => navigate('/motorista')}>
            Cancelar
          </button>
        </div>

        <div className="mrt-grid">
          {taxisDisponiveis.map(t => (
            <div
              key={t.id}
              className={`mrt-card ${selecionado?.id === t.id ? 'selected' : ''}`}
              onClick={() => setSelecionado(t)}
            >
              <div className="mrt-card-top">
                <div>
                  <span className="mrt-matricula">{t.matricula}</span>
                  <span className="mrt-modelo">{t.modelo}</span>
                </div>
                <div className="mrt-badges">
                  <span className={`mrt-tipo ${t.tipo === 'Elétrico' ? 'eletrico' : 'combustao'}`}>{t.tipo}</span>
                  <span className="mrt-conforto">{t.conforto}</span>
                </div>
              </div>

              <div className="mrt-fuel-row">
                <span className="mrt-fuel-label">Combustível / Carga</span>
                <span className="mrt-fuel-pct">{t.combustivel}%</span>
              </div>
              <div className="mrt-fuel-bar-bg">
                <div className="mrt-fuel-bar" style={{ width: `${t.combustivel}%` }} />
              </div>
              <div className="mrt-autonomia">≈ {t.autonomia} km de autonomia</div>
              <div className="mrt-turno">⏱ Turno: {t.turno}</div>

              {selecionado?.id === t.id && (
                <div className="mrt-check">✓ Selecionado</div>
              )}
            </div>
          ))}
        </div>

        <div className="mrt-actions">
          <button
            className="mrt-btn-confirmar"
            disabled={!selecionado}
            onClick={handleConfirmar}
          >
            Confirmar Requisição
          </button>
        </div>
      </div>
    </div>
  );
}
