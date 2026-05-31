import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/GestorRegistarMotorista.css';
import AvatarDropdown from '../components/AvatarDropdown';
import '../css/global.css';
import { toastSucesso, toastErro, toastAviso, toastInfo, confirmar } from '../components/toast';
import useAuthGuard from '../hooks/authGuard';

export default function GestorRegistarMotorista() {
  useAuthGuard();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: '', email: '', ano_nascimento: '', nif: '', genero: '',
    n_carta_conducao: '', senha_acesso_web: '', codigoPostal: '', morada: '', lat: '', long: '',
  });
  const [cpLoading, setCpLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'escuro');

  useEffect(() => {
    document.body.className = tema;
    localStorage.setItem('tema', tema);
  }, [tema]);

  const alternarTema = () => setTema(prev => prev === 'escuro' ? 'claro' : 'escuro');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleCodigoPostalChange = e => {
    const cp = e.target.value.trim();
    setForm(f => ({ ...f, codigoPostal: cp, morada: '', lat: '', long: '' }));
  };

  const handleCodigoPostalBlur = async e => {
    const cp = e.target.value.trim();
    if (!/^\d{4}-\d{3}$/.test(cp)) return;
    setCpLoading(true);
    try {
      const res = await fetch(`https://json.geoapi.pt/cp/${cp}`);
      if (!res.ok) throw new Error('não encontrado');
      const data = await res.json();
      const localidade = [data.Localidade, data.Concelho].filter(Boolean).join(', ');
      setForm(f => ({ ...f, morada: localidade, lat: String(data.centro[0]), long: String(data.centro[1]) }));
    } catch {
      toastErro('Código postal não encontrado. Verifique e tente novamente.');
    } finally {
      setCpLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.lat || !form.long) {
      toastAviso('Introduza um código postal válido para obter a localização.');
      return;
    }
    try {
      const res = await fetch('http://localhost:3000/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'Motorista',
          nome: form.nome,
          email: form.email,
          nif: form.nif,
          genero: form.genero,
          senha_acesso_web: form.senha_acesso_web,
          ano_nascimento: Number(form.ano_nascimento),
          n_carta_conducao: form.n_carta_conducao,
          morada: form.morada,
          localizacao: { lat: parseFloat(form.lat), long: parseFloat(form.long) },
        }),
      });
      const data = await res.json();
      if (!res.ok) { toastErro(data.message || 'Erro ao registar motorista.'); return; }
      navigate('/gestor/motoristas');
    } catch {
      toastErro('Não foi possível ligar ao servidor.');
    }
  };

  const USERNAME = JSON.parse(localStorage.getItem("user_logado")).nome;

  return (
    <div className="grm-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="grm-overlay" />

      {/* NAVBAR */}
      <nav className="gb-navbar">
        <span className="gb-logo">Need4Rides</span>

        <div
          className={`gb-hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        <ul className={`gb-nav-links ${menuOpen ? 'active' : ''}`}>
          <li className="gb-profile-li avatarHamburguer">
            <AvatarDropdown profilePath="/gestor/perfil" avatarClass="gb-avatar" />
            <span className="gb-profile-pill-name">{USERNAME}</span>
          </li>
          <li><a onClick={() => navigate('/gestor')}>Dashboard</a></li>
          <li><a onClick={() => navigate('/gestor/motoristas')}>Motoristas</a></li>
          <li><a onClick={() => navigate('/gestor/taxis')}>Táxis</a></li>
          <li><a onClick={() => navigate('/gestor/precos')}>Preços</a></li>
          <li><a className="active" onClick={() => navigate('/gestor/registar-motorista')}>Registar Motorista</a></li>
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

      <div className="grm-wrapper">
        <div className="grm-card">
          <h2 className="grm-title">Registar Motorista</h2>
          <p className="grm-subtitle">Preenche os dados para adicionar um novo motorista ao sistema</p>

          <form className="grm-form" onSubmit={handleSubmit}>

            <div className="grm-row">
              <div className="grm-field">
                <label>Nome</label>
                <input type="text" name="nome" placeholder="Nome completo" value={form.nome} onChange={handleChange} required />
              </div>
              <div className="grm-field">
                <label>Email</label>
                <input type="email" name="email" placeholder="email@exemplo.com" value={form.email} onChange={handleChange} required />
              </div>
            </div>

            <div className="grm-row">
              <div className="grm-field">
                <label>Ano de Nascimento</label>
                <input type="number" name="ano_nascimento" placeholder="Ex: 1990" min="1940" max="2006" value={form.ano_nascimento} onChange={handleChange} required />
              </div>
              <div className="grm-field">
                <label>NIF</label>
                <input type="text" name="nif" placeholder="9 dígitos" maxLength={9} value={form.nif} onChange={handleChange} required />
              </div>
            </div>

            <div className="grm-row">
              <div className="grm-field">
                <label>Género</label>
                <select name="genero" value={form.genero} onChange={handleChange} required>
                  <option value="" disabled>Selecionar...</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
              <div className="grm-field">
                <label>Nº Carta de Condução</label>
                <input type="text" name="n_carta_conducao" placeholder="Ex: ZA-12345 6" value={form.n_carta_conducao} onChange={handleChange} required />
              </div>
            </div>

            <div className="grm-row">
              <div className="grm-field">
                <label>Senha</label>
                <input type="password" name="senha_acesso_web" placeholder="Mínimo 6 caracteres" value={form.senha_acesso_web} onChange={handleChange} required />
              </div>
              <div className="grm-field">
                <label>Código Postal</label>
                <input type="text" name="codigoPostal" placeholder="0000-000" maxLength={8} value={form.codigoPostal} onChange={handleCodigoPostalChange} onBlur={handleCodigoPostalBlur} />
              </div>
            </div>

            <div className="grm-row">
              <div className="grm-field grm-field-wide">
                <label>
                  Morada {cpLoading && <span style={{ fontWeight: 'normal', fontSize: '0.8rem' }}>A procurar...</span>}
                </label>
                <input type="text" name="morada" placeholder="Preenchida automaticamente pelo código postal" value={form.morada} onChange={handleChange} required />
              </div>
            </div>

            <div className="grm-actions">
              <button type="button" className="grm-btn-cancel" onClick={() => navigate('/gestor')}>
                Cancelar
              </button>
              <button type="submit" className="grm-btn-submit">
                Registar Motorista
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}