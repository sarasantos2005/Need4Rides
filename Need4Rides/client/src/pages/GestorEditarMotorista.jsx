import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/GestorRegistarMotorista.css';
import AvatarDropdown from '../components/AvatarDropdown';
import { toastAviso, toastErro, toastSucesso } from '../components/toast.js';
import '../css/global.css';

export default function GestorEditarMotorista() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [cpLoading, setCpLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'escuro');

  useEffect(() => {
    document.body.className = tema;
    localStorage.setItem('tema', tema);
  }, [tema]);

  useEffect(() => {
    fetch(`http://localhost:3000/api/user/motorista/${id}`)
      .then(r => r.json())
      .then(data => {
        if (!data.success) { toastErro('Motorista não encontrado.'); navigate('/gestor/motoristas'); return; }
        const m = data.motorista;
        const coords = m.motorista?.morada?.localizacao?.coordinates;
        setForm({
          nome: (m.nome ?? '').trim(),
          email: (m.email ?? '').trim(),
          nif: (m.nif ?? '').trim(),
          genero: m.genero ?? '',
          ano_nascimento: m.ano_nascimento ?? '',
          n_carta_conducao: (m.motorista?.n_carta_conducao ?? '').trim(),
          nova_senha: '',
          codigoPostal: '',
          morada: (m.motorista?.morada?.texto ?? '').trim(),
          lat: coords ? String(coords[1]) : '',
          long: coords ? String(coords[0]) : '',
        });
      })
      .catch(() => { toastErro('Erro ao carregar motorista.'); navigate('/gestor/motoristas'); })
      .finally(() => setCarregando(false));
  }, [id]);

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
      toastAviso('A morada não tem localização. Introduza um código postal válido ou recarregue a morada existente.');
      return;
    }
    try {
      const body = {
        nome: form.nome,
        email: form.email,
        genero: form.genero,
        ano_nascimento: Number(form.ano_nascimento),
        n_carta_conducao: form.n_carta_conducao,
        morada: form.morada,
        localizacao: { lat: parseFloat(form.lat), long: parseFloat(form.long) },
      };
      if (form.nova_senha) body.nova_senha = form.nova_senha;

      const res = await fetch(`http://localhost:3000/api/user/motorista/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { toastErro(data.message || 'Erro ao guardar alterações.'); return; }
      toastSucesso('Motorista atualizado com sucesso.');
      navigate('/gestor/motoristas');
    } catch {
      toastErro('Não foi possível ligar ao servidor.');
    }
  };

  const USERNAME = JSON.parse(localStorage.getItem("user_logado")).nome;

  if (carregando) return null;

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
          <li><a className="active" onClick={() => navigate('/gestor/motoristas')}>Motoristas</a></li>
          <li><a onClick={() => navigate('/gestor/taxis')}>Táxis</a></li>
          <li><a onClick={() => navigate('/gestor/precos')}>Preços</a></li>
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
          <h2 className="grm-title">Editar Motorista</h2>
          <p className="grm-subtitle">Altera os dados do motorista <strong>{form.nome}</strong></p>

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
                <input type="text" name="nif" value={form.nif} readOnly style={{ opacity: 0.5, cursor: 'not-allowed' }} title="O NIF não pode ser alterado" />
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
                <label>Nova Senha <span style={{ fontWeight: 400, fontSize: '0.72rem', color: '#999' }}>(deixar em branco para não alterar)</span></label>
                <input type="password" name="nova_senha" placeholder="Mínimo 6 caracteres" value={form.nova_senha} onChange={handleChange} />
              </div>
              <div className="grm-field">
                <label>Código Postal <span style={{ fontWeight: 400, fontSize: '0.72rem', color: '#999' }}>(preencher para atualizar morada)</span></label>
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
              <button type="button" className="grm-btn-cancel" onClick={() => navigate('/gestor/motoristas')}>
                Cancelar
              </button>
              <button type="submit" className="grm-btn-submit">
                Guardar Alterações
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
