import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/GestorPrecos.css';
import AvatarDropdown from '../components/AvatarDropdown';
import '../css/MotoristaHome.css';
import '../css/global.css';
import { toastSucesso, toastErro, toastAviso, toastInfo, confirmar } from '../components/toast';

function calcularCusto(horaInicio, horaFim, valorMinuto, acrescimoNoturno) {
  const [hI, mI] = horaInicio.split(':').map(Number);
  const [hF, mF] = horaFim.split(':').map(Number);
  let inicioMin = hI * 60 + mI;
  let fimMin = hF * 60 + mF;
  if (fimMin <= inicioMin) fimMin += 24 * 60;

  let custo = 0;
  for (let i = 0; i < fimMin - inicioMin; i++) {
    const hora = Math.floor(((inicioMin + i) % (24 * 60)) / 60);
    const eNoturno = hora >= 21 || hora < 6;
    custo += eNoturno ? valorMinuto * (1 + acrescimoNoturno / 100) : valorMinuto;
  }
  return custo;
}

export default function GestorPrecos() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'escuro');

  const [precos, setPrecos] = useState({ basico: '', luxuoso: '', acrescimo_noturno: '' });
  const [precosAtuais, setPrecosAtuais] = useState(null);

  const [calc, setCalc] = useState({ horaInicio: '', horaFim: '', nivel: 'Básico' });
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    document.body.className = tema;
    localStorage.setItem('tema', tema);
  }, [tema]);

  useEffect(() => {
    fetch('http://localhost:3000/api/preco')
      .then(r => r.json())
      .then(data => setPrecosAtuais(data))
      .catch(() => {});
  }, []);

  const alternarTema = () => setTema(prev => prev === 'escuro' ? 'claro' : 'escuro');

  const handleSubmitPrecos = async e => {
    e.preventDefault();
    const basico = parseFloat(precos.basico);
    const luxuoso = parseFloat(precos.luxuoso);
    const acrescimo = parseFloat(precos.acrescimo_noturno);
    if (isNaN(basico) || isNaN(luxuoso) || isNaN(acrescimo)) {
      toastAviso('Preenche todos os campos corretamente.'); return;
    }
    try {
      const res = await fetch('http://localhost:3000/api/preco', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basico, luxuoso, acrescimo_noturno: acrescimo }),
      });
      const data = await res.json();
      if (!res.ok) { toastErro(data.message || 'Erro ao definir preços.'); return; }
      toastSucesso('Preços definidos com sucesso!');
      setPrecosAtuais({
        Básico: { valor_minuto: basico, acrescimo_noturno: acrescimo },
        Luxuoso: { valor_minuto: luxuoso, acrescimo_noturno: acrescimo },
      });
      setPrecos({ basico: '', luxuoso: '', acrescimo_noturno: '' });
    } catch {
      toastErro('Não foi possível ligar ao servidor.');
    }
  };

  const handleCalc = e => {
    e.preventDefault();
    if (!calc.horaInicio || !calc.horaFim) { toastAviso('Introduz as horas de início e fim.'); return; }
    const nivel = precosAtuais?.[calc.nivel];
    if (!nivel) { toastErro('Não existem preços definidos para este nível de conforto.'); return; }
    setResultado(calcularCusto(calc.horaInicio, calc.horaFim, nivel.valor_minuto, nivel.acrescimo_noturno ?? 0));
  };

  const temPrecos = precosAtuais && Object.keys(precosAtuais).length > 0;

  const USERNAME = JSON.parse(localStorage.getItem("user_logado")).nome;
  
  return (
    <div className="gp-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="gp-overlay" />

      <nav className="gb-navbar">
        <span className="gb-logo">Need4Rides</span>
        <div className={`gb-hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span /><span />
        </div>
        <ul className={`gb-nav-links ${menuOpen ? 'active' : ''}`}>
          <li className="gb-profile-li avatarHamburguer">
            <AvatarDropdown profilePath="/gestor/perfil" avatarClass="gb-avatar" />
            <span className="gb-profile-pill-name">{USERNAME}</span>
          </li>
          <li><a onClick={() => navigate('/gestor')}>Dashboard</a></li>
          <li><a onClick={() => navigate('/gestor/motoristas')}>Motoristas</a></li>
          <li><a onClick={() => navigate('/gestor/taxis')}>Táxis</a></li>
          <li><a className="active" onClick={() => navigate('/gestor/precos')}>Preços</a></li>
          <li>
            <button className="gb-theme-btn" onClick={alternarTema}>
              {tema === 'escuro' ? '☀️ Claro' : '🌙 Escuro'}
            </button>
          </li>
          <li className="gb-profile-li avatarNormal">
            <div className="gb-profile-pill">
              <span className="gb-profile-pill-name">{USERNAME}</span>
              <AvatarDropdown profilePath="/gestor/perfil" avatarClass="gb-avatar" />
            </div>
          </li>
        </ul>
      </nav>

      <div className="gp-content">

        {/* CABEÇALHO */}
        <div>
          <h1 className="gp-page-title">Preços</h1>
          <p className="gp-page-sub">Gestão de tarifas por nível de conforto e período</p>
        </div>

        {/* PREÇOS EM VIGOR */}
        {temPrecos && (
          <div className="gp-atuais-card">
            <div>
              <p className="gp-atuais-label">Em vigor</p>
              <div className="gp-atuais-items">
                {['Básico', 'Luxuoso'].map(n => precosAtuais[n] && (
                  <div key={n} className="gp-atuais-item">
                    <span className="gp-nivel">{n}</span>
                    <span className="gp-valor">€{precosAtuais[n].valor_minuto.toFixed(4)}<small>/min</small></span>
                    <span className="gp-noturno">+{precosAtuais[n].acrescimo_noturno ?? 0}% noturno (21h–6h)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DOIS CARDS LADO A LADO */}
        <div className="gp-row">

          {/* DEFINIR PREÇOS */}
          <div className="gp-card">
            <div>
              <h2 className="gp-card-title">Definir Preços</h2>
              <p className="gp-card-sub">Preço por minuto para cada nível de conforto e acréscimo noturno (21h–6h)</p>
            </div>
            <form className="gp-form" onSubmit={handleSubmitPrecos}>
              <div className="gp-fields">
                <div className="gp-field">
                  <label>Básico (€/min)</label>
                  <input type="number" step="0.0001" min="0.0001" placeholder="Ex: 0.25"
                    value={precos.basico} onChange={e => setPrecos(p => ({ ...p, basico: e.target.value }))} required />
                </div>
                <div className="gp-field">
                  <label>Luxuoso (€/min)</label>
                  <input type="number" step="0.0001" min="0.0001" placeholder="Ex: 0.45"
                    value={precos.luxuoso} onChange={e => setPrecos(p => ({ ...p, luxuoso: e.target.value }))} required />
                </div>
                <div className="gp-field">
                  <label>Acréscimo noturno (%)</label>
                  <input type="number" step="0.1" min="0" placeholder="Ex: 20"
                    value={precos.acrescimo_noturno} onChange={e => setPrecos(p => ({ ...p, acrescimo_noturno: e.target.value }))} required />
                </div>
              </div>
              <button type="submit" className="gp-btn">Guardar Preços</button>
            </form>
          </div>

          {/* CALCULADORA */}
          <div className="gp-card">
            <div>
              <h2 className="gp-card-title">Calculadora de Viagem</h2>
              <p className="gp-card-sub">Estima o custo de uma viagem fictícia, incluindo dias consecutivos</p>
            </div>
            <form className="gp-form" onSubmit={handleCalc}>
              <div className="gp-fields">
                <div className="gp-field">
                  <label>Nível de Conforto</label>
                  <select value={calc.nivel} onChange={e => { setCalc(c => ({ ...c, nivel: e.target.value })); setResultado(null); }}>
                    <option value="Básico">Básico</option>
                    <option value="Luxuoso">Luxuoso</option>
                  </select>
                </div>
                <div className="gp-field">
                  <label>Hora de Início</label>
                  <input type="time" value={calc.horaInicio}
                    onChange={e => { setCalc(c => ({ ...c, horaInicio: e.target.value })); setResultado(null); }} required />
                </div>
                <div className="gp-field">
                  <label>Hora de Fim</label>
                  <input type="time" value={calc.horaFim}
                    onChange={e => { setCalc(c => ({ ...c, horaFim: e.target.value })); setResultado(null); }} required />
                </div>
              </div>
              {resultado !== null && (
                <div className="gp-resultado">
                  Custo estimado:
                  <strong>€{resultado.toFixed(2)}</strong>
                  {calc.horaFim <= calc.horaInicio && <span className="gp-nextday">(dia seguinte)</span>}
                </div>
              )}
              <button type="submit" className="gp-btn">Calcular</button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
