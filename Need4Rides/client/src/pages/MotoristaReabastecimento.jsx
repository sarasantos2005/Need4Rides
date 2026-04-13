import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/MotoristaReabastecimento.css';
import AvatarDropdown from '../components/AvatarDropdown';

const mockHistReab = [
  { id: 1, data: '28 Mar 2026', hora: '12:30', litros: 42, valor: '€63.00', posto: 'Galp — Marquês de Pombal' },
  { id: 2, data: '24 Mar 2026', hora: '08:15', litros: 38, valor: '€57.00', posto: 'BP — Aeroporto' },
  { id: 3, data: '19 Mar 2026', hora: '17:45', litros: 45, valor: '€67.50', posto: 'Repsol — Cascais' },
];

export default function MotoristaReabastecimento() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ litros: '', valor: '', data: '', hora: '', posto: '', obs: '' });
  const [submitted, setSubmitted] = useState(false);
  const [historico, setHistorico] = useState(mockHistReab);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = e => {
    e.preventDefault();
    const novoRegisto = {
      id: historico.length + 1,
      data: form.data || '—',
      hora: form.hora || '—',
      litros: parseFloat(form.litros) || 0,
      valor: `€${parseFloat(form.valor || 0).toFixed(2)}`,
      posto: form.posto || '—',
    };
    setHistorico(h => [novoRegisto, ...h]);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setForm({ litros: '', valor: '', data: '', hora: '', posto: '', obs: '' });
    }, 2500);
  };

  const isValid = form.litros && form.valor && form.data;

  return (
    <div className="mreab-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="mreab-overlay" />

     <nav className="mh-navbar">
  <span className="mh-logo">Need4Rides</span>

  {/* BOTÃO HAMBURGUER */}
  <div 
    className={`mh-hamburger ${menuOpen ? 'open' : ''}`} 
    onClick={() => setMenuOpen(!menuOpen)}
  >
    <span></span>
    <span></span>
    <span></span>
  </div>

  <ul className={`mh-nav-links ${menuOpen ? 'active' : ''}`}>
    <li>
      <a onClick={() => {
        navigate('/motorista');
        setMenuOpen(false);
      }}>
        Dashboard
      </a>
    </li>

    <li>
      <a className="active" onClick={() => setMenuOpen(false)}>
        Registar Reabastecimento
      </a>
    </li>

    <li>
      <a onClick={() => {
        navigate('/motorista/historico');
        setMenuOpen(false);
      }}>
        Histórico
      </a>
    </li>

    <li>
      <a onClick={() => {
        navigate('/motorista/suporte');
        setMenuOpen(false);
      }}>
        Suporte
      </a>
    </li>

    <li>
      <a onClick={() => {
        navigate('/motorista/viagem');
        setMenuOpen(false);
      }}>
        Viagem
      </a>
    </li>

    <li onClick={() => setMenuOpen(false)}>
      <AvatarDropdown profilePath="/motorista/perfil" avatarClass="mh-avatar" />
    </li>
  </ul>
</nav>

      <div className="mreab-wrapper">

        {/* Título */}
        <div className="mreab-header">
          <div>
            <h1 className="mreab-title">Registar Reabastecimento</h1>
            <div className="mreab-veiculo">
              <span className="mreab-veiculo-modelo">Toyota Corolla</span>
              <span className="mreab-veiculo-sep">●</span>
              <span className="mreab-veiculo-matricula">00-AA-00</span>
            </div>
          </div>
          <button className="mreab-back-btn" onClick={() => navigate('/motorista')}>← Voltar</button>
        </div>

        <div className="mreab-content">

          {/* Formulário */}
          <div className="mreab-card mreab-form-card">
            <h3 className="mreab-card-title">Novo Registo</h3>

            {submitted ? (
              <div className="mreab-success">
                <div className="mreab-success-icon">✓</div>
                <p>Reabastecimento registado!</p>
              </div>
            ) : (
              <form className="mreab-form" onSubmit={handleSubmit}>

                <div className="mreab-form-row">
                  <div className="mreab-field">
                    <label>Litros *</label>
                    <div className="mreab-input-wrap">
                      <input
                        type="number"
                        name="litros"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        value={form.litros}
                        onChange={handleChange}
                        required
                      />
                      <span className="mreab-unit">L</span>
                    </div>
                  </div>

                  <div className="mreab-field">
                    <label>Valor Total *</label>
                    <div className="mreab-input-wrap">
                      <span className="mreab-unit left">€</span>
                      <input
                        type="number"
                        name="valor"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        value={form.valor}
                        onChange={handleChange}
                        className="has-left"
                        required
                      />
                    </div>
                  </div>
                </div>

                {form.litros && form.valor && parseFloat(form.litros) > 0 && (
                  <div className="mreab-calc">
                    Preço por litro: <strong>€{(parseFloat(form.valor) / parseFloat(form.litros)).toFixed(3)}</strong>
                  </div>
                )}

                <div className="mreab-form-row">
                  <div className="mreab-field">
                    <label>Data *</label>
                    <input
                      type="date"
                      name="data"
                      value={form.data}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mreab-field">
                    <label>Hora</label>
                    <input
                      type="time"
                      name="hora"
                      value={form.hora}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="mreab-field">
                  <label>Posto de Combustível</label>
                  <input
                    type="text"
                    name="posto"
                    placeholder="Ex: Galp — Marquês de Pombal"
                    value={form.posto}
                    onChange={handleChange}
                  />
                </div>

                <div className="mreab-field">
                  <label>Observações</label>
                  <textarea
                    name="obs"
                    placeholder="Notas opcionais..."
                    rows={3}
                    value={form.obs}
                    onChange={handleChange}
                  />
                </div>

                <button type="submit" className="mreab-btn-submit" disabled={!isValid}>
                  Registar Reabastecimento
                </button>

              </form>
            )}
          </div>

          {/* Histórico de reabastecimentos */}
          <div className="mreab-card mreab-hist-card">
            <h3 className="mreab-card-title">Reabastecimentos Anteriores</h3>
            <div className="mreab-hist-list">
              {historico.map(r => (
                <div className="mreab-hist-row" key={r.id}>
                  <div className="mreab-hist-info">
                    <span className="mreab-hist-posto">{r.posto}</span>
                    <span className="mreab-hist-date">{r.data} · {r.hora}</span>
                  </div>
                  <div className="mreab-hist-values">
                    <span className="mreab-hist-litros">{r.litros} L</span>
                    <span className="mreab-hist-valor">{r.valor}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
