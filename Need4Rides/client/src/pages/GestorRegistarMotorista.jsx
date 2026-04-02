import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/GestorRegistarMotorista.css';
import AvatarDropdown from '../components/AvatarDropdown';

export default function GestorRegistarMotorista() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    anaNascimento: '',
    nif: '',
    genero: '',
    numeroCarta: '',
    senha: '',
    localidade: '',
    morada: '',
    codigoPostal: '',
  });
  const [sucesso, setSucesso] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = e => {
    e.preventDefault();
    setSucesso(true);
    setForm({ anaNascimento: '', nif: '', genero: '', numeroCarta: '', senha: '', localidade: '', morada: '', codigoPostal: '' });
  };

  return (
    <div className="grm-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="grm-overlay" />

      {/* Navbar */}
      <nav className="gh-navbar">
        <span className="gh-logo">Need4Rides</span>
        <ul className="gh-nav-links">
          <li><a style={{ cursor: 'pointer' }} onClick={() => navigate('/gestor')}>Dashboard</a></li>
          <li><a style={{ cursor: 'pointer' }} onClick={() => navigate('/gestor/motoristas')}>Motoristas</a></li>
          <li><a style={{ cursor: 'pointer' }} onClick={() => navigate('/gestor/taxis')}>Táxis</a></li>
          <li><a className="active" style={{ cursor: 'pointer' }} onClick={() => navigate('/gestor/registar-motorista')}>Registar Motorista</a></li>
          <li>
            <AvatarDropdown profilePath="/gestor" avatarClass="gh-avatar" />
          </li>
        </ul>
      </nav>

      <div className="grm-wrapper">
        <div className="grm-card">
          <h2 className="grm-title">Registar Motorista</h2>
          <p className="grm-subtitle">Preenche os dados para adicionar um novo motorista ao sistema</p>

          {sucesso && (
            <div className="grm-sucesso">
              Motorista registado com sucesso!
            </div>
          )}

          <form className="grm-form" onSubmit={handleSubmit}>

            <div className="grm-row">
              <div className="grm-field">
                <label>Ano de Nascimento</label>
                <input
                  type="number"
                  name="anaNascimento"
                  placeholder="Ex: 1990"
                  min="1940"
                  max="2006"
                  value={form.anaNascimento}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grm-field">
                <label>NIF</label>
                <input
                  type="text"
                  name="nif"
                  placeholder="9 dígitos"
                  maxLength={9}
                  value={form.nif}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grm-row">
              <div className="grm-field">
                <label>Género</label>
                <select name="genero" value={form.genero} onChange={handleChange} required>
                  <option value="" disabled>Selecionar...</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                </select>
              </div>
              <div className="grm-field">
                <label>Nº Carta de Condução</label>
                <input
                  type="text"
                  name="numeroCarta"
                  placeholder="Ex: C-123456-7"
                  value={form.numeroCarta}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grm-row">
              <div className="grm-field">
                <label>Senha</label>
                <input
                  type="password"
                  name="senha"
                  placeholder="Senha de acesso"
                  value={form.senha}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grm-field">
                <label>Localidade</label>
                <input
                  type="text"
                  name="localidade"
                  placeholder="Ex: Lisboa"
                  value={form.localidade}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grm-row">
              <div className="grm-field grm-field-wide">
                <label>Morada</label>
                <input
                  type="text"
                  name="morada"
                  placeholder="Ex: Rua das Flores, 12"
                  value={form.morada}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grm-field">
                <label>Código Postal</label>
                <input
                  type="text"
                  name="codigoPostal"
                  placeholder="0000-000"
                  maxLength={8}
                  value={form.codigoPostal}
                  onChange={handleChange}
                  required
                />
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
