import { useNavigate } from 'react-router-dom';
import ddImg from '../assets/images/fennec.jpg';
import heroBg from '../assets/images/LA.jpg';
import '../css/Profile.css';
import { useState, useEffect } from 'react';
import '../css/global.css';

const mockAtividade = [
  { id: 1, acao: 'Motorista registado', detalhe: 'Carlos Mendes adicionado à plataforma', data: '31 Mar 2026', hora: '10:12' },
  { id: 2, acao: 'Táxi adicionado',     detalhe: 'Toyota Corolla · AA-00-BB',             data: '30 Mar 2026', hora: '15:47' },
  { id: 3, acao: 'Relatório gerado',    detalhe: 'Resumo mensal de Março 2026',            data: '30 Mar 2026', hora: '09:00' },
];

export default function GestorProfile() {
  const navigate = useNavigate();

  const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'escuro');

  useEffect(() => {
    document.body.className = tema;
    localStorage.setItem('tema', tema);
  }, [tema]);

  const alternarTema = () => setTema(prev => prev === 'escuro' ? 'claro' : 'escuro');

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
              <h1>Admin Need4Rides</h1>
              <div className="profile-badges">
                <span className="profile-badge">Gestor</span>
                <span className="profile-badge">Membro desde Janeiro de 2024</span>
              </div>
            </div>
            <div className="profile-actions">
              <button className="gb-theme-btn" onClick={alternarTema}>
                {tema === 'escuro' ? '☀️ Claro' : '🌙 Escuro'}
              </button>
              <button className="profile-back-btn" onClick={() => navigate('/gestor')}>
                ← Voltar
              </button>
            </div>
          </div>

          <div className="profile-divider" />

          {/* Dados */}
          <div className="profile-details">
            <div className="profile-field">
              <label>Nome</label>
              <input type="text" defaultValue="Admin Need4Rides" />
            </div>
            <div className="profile-field">
              <label>Email</label>
              <input type="email" defaultValue="gestor@need4rides.com" />
            </div>
            <div className="profile-field">
              <label>Telefone</label>
              <input type="tel" defaultValue="+351 210 000 000" />
            </div>
          </div>

          <button className="profile-save-btn">Guardar Alterações</button>
        </div>

        {/* Atividade recente */}
        <div className="profile-trips">
          <h2>Atividade Recente</h2>
          <div className="trips-list">
            {mockAtividade.map(a => (
              <div className="trip-card" key={a.id}>
                <div className="trip-main">
                  <div className="trip-route">
                    <span className="trip-from">{a.acao}</span>
                    <span className="trip-arrow">·</span>
                    <span className="trip-to">{a.detalhe}</span>
                  </div>
                  <div className="trip-meta">
                    <span className="trip-date">{a.data} · {a.hora}</span>
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