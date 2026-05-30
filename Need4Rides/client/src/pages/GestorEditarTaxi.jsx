import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/GestorRegistarTaxi.css';
import AvatarDropdown from '../components/AvatarDropdown';
import VEICULOS from '../data/marcasEmodelos.js';
import { toastAviso, toastErro, toastSucesso } from '../components/toast.js';
import '../css/global.css';

const MARCAS = VEICULOS?.marcas ?? [];
const anoAtual = new Date().getFullYear();
const regexMatricula = /^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{2}-[A-Z0-9]{2}-[A-Z0-9]{2}$/;

export default function GestorEditarTaxi() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState(null);
  const [temViagens, setTemViagens] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'escuro');

  useEffect(() => {
    document.body.className = tema;
    localStorage.setItem('tema', tema);
  }, [tema]);

  useEffect(() => {
    fetch(`http://localhost:3000/api/taxi/${id}`)
      .then(r => r.json())
      .then(data => {
        if (!data.success) { toastErro('Táxi não encontrado.'); navigate('/gestor/taxis'); return; }
        const t = data.taxi;
        setForm({
          matricula: (t.matricula ?? '').trim(),
          marca: (t.marca ?? '').trim(),
          modelo: (t.modelo ?? '').trim(),
          tipo_motor: (t.tipo_motor ?? '').trim(),
          ano_compra: t.ano_compra ?? '',
          nivel_conforto: (t.nivel_conforto ?? '').trim(),
          cor: t.cor ?? '#f5c518',
          nivel_combustivel_carga: t.nivel_combustivel_carga ?? 100,
          autonomia_maxima: t.autonomia_maxima ?? '',
        });
        setTemViagens(data.temViagens);
      })
      .catch(() => { toastErro('Erro ao carregar táxi.'); navigate('/gestor/taxis'); })
      .finally(() => setCarregando(false));
  }, [id]);

  const alternarTema = () => setTema(prev => prev === 'escuro' ? 'claro' : 'escuro');

  const marcaExiste = MARCAS.some(m => m.nome === form?.marca);
  const marcasDisponiveis = form?.marca && !marcaExiste
    ? [{ id: '__custom__', nome: form.marca }, ...MARCAS]
    : MARCAS;

  const modelosBase = MARCAS.find(m => m.nome === form?.marca)?.modelos ?? [];
  const modelosDisponiveis = form?.modelo && !modelosBase.includes(form.modelo)
    ? [form.modelo, ...modelosBase]
    : modelosBase;

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({
      ...f,
      [name]: value,
      ...(name === 'marca' ? { modelo: '' } : {}),
      ...(name === 'tipo_motor' && value !== 'Elétrico' ? { autonomia_maxima: '' } : {}),
    }));
  };

  const handleMatricula = e => {
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length > 2) val = val.slice(0, 2) + '-' + val.slice(2);
    if (val.length > 5) val = val.slice(0, 5) + '-' + val.slice(5);
    if (val.length > 8) val = val.slice(0, 8);
    setForm(f => ({ ...f, matricula: val }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!regexMatricula.test(form.matricula)) {
      toastAviso('Matrícula inválida. Formato XX-XX-XX com letras e dígitos (ex: AA-12-BB).');
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/api/taxi/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matricula: form.matricula,
          marca: form.marca,
          modelo: form.modelo,
          tipo_motor: form.tipo_motor,
          ano_compra: Number(form.ano_compra),
          nivel_conforto: form.nivel_conforto,
          cor: form.cor,
          nivel_combustivel_carga: Number(form.nivel_combustivel_carga),
          autonomia_maxima: Number(form.autonomia_maxima),
        }),
      });
      const data = await res.json();
      if (!res.ok) { toastErro(data.message || 'Erro ao guardar alterações.'); return; }
      toastSucesso('Táxi atualizado com sucesso.');
      navigate('/gestor/taxis');
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
          <li><a onClick={() => navigate('/gestor/motoristas')}>Motoristas</a></li>
          <li><a className="active" onClick={() => navigate('/gestor/taxis')}>Táxis</a></li>
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
          <h2 className="grm-title">Editar Táxi</h2>
          <p className="grm-subtitle">Altera os dados do táxi <strong>{form.matricula}</strong></p>

          <form className="grm-form" onSubmit={handleSubmit}>

            <div className="grm-row">
              <div className="grm-field">
                <label>Matrícula</label>
                <input
                  type="text"
                  name="matricula"
                  placeholder="Ex: AZ-12-BD"
                  value={form.matricula}
                  onChange={handleMatricula}
                  maxLength={8}
                  required
                />
              </div>
              <div className="grm-field">
                <label>Marca</label>
                <select name="marca" value={form.marca} onChange={handleChange} required>
                  <option value="" disabled>Selecionar...</option>
                  {marcasDisponiveis.map(m => (
                    <option key={m.id} value={m.nome}>{m.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grm-row">
              <div className="grm-field">
                <label>Modelo</label>
                <select name="modelo" value={form.modelo} onChange={handleChange} required disabled={!form.marca}>
                  <option value="" disabled>{form.marca ? 'Selecionar...' : 'Seleciona a marca primeiro'}</option>
                  {modelosDisponiveis.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="grm-field">
                <label>Ano de Compra</label>
                <input
                  type="number"
                  name="ano_compra"
                  placeholder={`Ex: ${anoAtual}`}
                  min="1990"
                  max={anoAtual}
                  value={form.ano_compra}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grm-row">
              <div className="grm-field">
                <label>Tipo de Motor</label>
                <select name="tipo_motor" value={form.tipo_motor} onChange={handleChange} required>
                  <option value="" disabled>Selecionar...</option>
                  <option value="Combustão">Combustão</option>
                  <option value="Elétrico">Elétrico</option>
                </select>
              </div>
              <div className="grm-field">
                <label>
                  Nível de Conforto
                  {temViagens && (
                    <span style={{ fontSize: '0.72rem', color: '#f5a623', marginLeft: '0.5rem', fontWeight: 400 }}>
                      (bloqueado — táxi já realizou viagens)
                    </span>
                  )}
                </label>
                <select
                  name="nivel_conforto"
                  value={form.nivel_conforto}
                  onChange={handleChange}
                  required
                  disabled={temViagens}
                  title={temViagens ? 'Não é possível alterar o nível de conforto após o táxi ter realizado viagens' : ''}
                >
                  <option value="" disabled>Selecionar...</option>
                  <option value="Básico">Básico</option>
                  <option value="Luxuoso">Luxuoso</option>
                </select>
              </div>
            </div>

            <div className="grm-row">
              <div className="grm-field">
                <label>Cor</label>
                <input
                  type="color"
                  name="cor"
                  value={form.cor}
                  onChange={handleChange}
                  className="grt-color-input"
                />
              </div>
              <div className="grm-field">
                <label>Nível de Combustível/Carga — {form.nivel_combustivel_carga}%</label>
                <input
                  type="range"
                  name="nivel_combustivel_carga"
                  min="0"
                  max="100"
                  value={form.nivel_combustivel_carga}
                  onChange={handleChange}
                  className="grt-range-input"
                />
              </div>
            </div>

            {form.tipo_motor === 'Elétrico' && (
              <div className="grm-row">
                <div className="grm-field">
                  <label>Autonomia Máxima (km)</label>
                  <input
                    type="number"
                    name="autonomia_maxima"
                    placeholder="Ex: 400"
                    min="1"
                    value={form.autonomia_maxima}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            <div className="grm-actions">
              <button type="button" className="grm-btn-cancel" onClick={() => navigate('/gestor/taxis')}>
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
