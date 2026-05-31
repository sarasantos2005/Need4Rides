import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/GestorRegistarTaxi.css';
import AvatarDropdown from '../components/AvatarDropdown';
import VEICULOS from '../data/marcasEmodelos.js';
import { toastAviso, toastErro } from '../components/toast.js';
import '../css/global.css';
import useAuthGuard from '../hooks/authGuard';

const MARCAS = VEICULOS?.marcas ?? [];

const anoAtual = new Date().getFullYear();

const regexMatricula = /^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{2}-[A-Z0-9]{2}-[A-Z0-9]{2}$/;

export default function GestorRegistarTaxi() {
  useAuthGuard();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    matricula: '',
    marca: '',
    modelo: '',
    tipo_motor: '',
    ano_compra: '',
    nivel_conforto: '',
    cor: '#f5c518',
    nivel_combustivel_carga: 100,
    autonomia_maxima: '',
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'escuro');

  useEffect(() => {
    document.body.className = tema;
    localStorage.setItem('tema', tema);
  }, [tema]);

  const alternarTema = () => setTema(prev => prev === 'escuro' ? 'claro' : 'escuro');

  const modelosDisponiveis = MARCAS.find(m => m.nome === form.marca)?.modelos ?? [];

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
      const res = await fetch('http://localhost:3000/api/taxi', {
        method: 'POST',
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
      if (!res.ok) { toastErro(data.message || 'Erro ao registar táxi.'); return; }
      navigate('/gestor/taxis');
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
          <li><a className="active" onClick={() => navigate('/gestor/registar-taxi')}>Registar Táxi</a></li>
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
          <h2 className="grm-title">Registar Táxi</h2>
          <p className="grm-subtitle">Preenche os dados para adicionar um novo táxi ao sistema</p>

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
                  {MARCAS.map(m => (
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
                <label>Nível de Conforto</label>
                <select name="nivel_conforto" value={form.nivel_conforto} onChange={handleChange} required>
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

            <div className="grm-actions">
              <button type="button" className="grm-btn-cancel" onClick={() => navigate('/gestor/taxis')}>
                Cancelar
              </button>
              
              <button type="submit" className="grm-btn-submit">
                Registar Táxi
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
