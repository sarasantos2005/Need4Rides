import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/Login.css';
import '../css/global.css';

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconEye({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function PasswordInput({ name, value, onChange, label }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="lp-field">
      <span className="lp-label">{label}</span>
      <div className="lp-input-wrap">
        <input
          name={name}
          type={visible ? 'text' : 'password'}
          className="lp-input lp-input-pass"
          value={value}
          onChange={onChange}
        />
        
        <span className="lp-eye" onClick={() => setVisible(v => !v)}>
          <IconEye open={visible} />
        </span>
      </div>
    </div>
  );
}

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();

  const [mode, setMode] = useState(location.state?.mode || 'login');
  const [role, setRole] = useState('Cliente');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [erro, setErro] = useState('');

  const [regData, setRegData] = useState({
    tipo: 'Cliente', email: '', nome: '', genero: '',
    nif: '', password: '', confirmPassword: '', ano_nascimento: ''
  });

  useEffect(() => {
    if (location.state?.mode) setMode(location.state.mode);
  }, [location.state]);

  const switchTo = (m) => { setMode(m); setErro(''); };
  const handleRegChange = (e) => setRegData({ ...regData, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    try {
      const res = await fetch('http://localhost:3000/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, nif: identifier, senha_acesso_web: password }),
      });
      const data = await res.json();
      if (!res.ok) return setErro(data.message);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user_logado', JSON.stringify(data.user));
      if (data.user.tipo === 'Motorista') navigate('/motorista');
      else if (data.user.tipo === 'Gestor') navigate('/gestor');
      else navigate('/home');
    } catch {
      setErro('Erro ao ligar ao servidor.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErro('');
    if (regData.password !== regData.confirmPassword) {
      setErro('As passwords não coincidem!');
      return;
    }
    try {
      const res = await fetch('http://localhost:3000/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'Cliente',
          email: regData.email,
          nome: regData.nome,
          genero: regData.genero === 'masculino' ? 'M' : 'F',
          nif: regData.nif,
          senha_acesso_web: regData.password,
          ano_nascimento: new Date(regData.ano_nascimento).getFullYear(),
        }),
      });
      const data = await res.json();
      if (!res.ok) return setErro(data.message);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user_logado', JSON.stringify(data.user));
      if (data.user.tipo === 'Motorista') navigate('/motorista');
      else if (data.user.tipo === 'Gestor') navigate('/gestor');
      else navigate('/home');
    } catch {
      setErro('Erro ao ligar ao servidor.');
    }
  };

  return (
    <div className="lp-page" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="lp-overlay" />

      <div className="lp-card">

        {mode === 'login' ? (
          <div className="lp-form">
            <h1 className="lp-title">Login</h1>

            <div className="lp-tabs">
              {['Cliente', 'Motorista', 'Gestor'].map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`lp-tab ${role === r ? 'active' : ''}`}
                  onClick={() => { setRole(r); setIdentifier(''); }}
                >
                  {r}
                </button>
              ))}
            </div>

            <form onSubmit={handleLogin} style={{ display: 'contents' }}>

              <div className="lp-field">
                <span className="lp-label">NIF</span>
                <div className="lp-input-wrap">
                  <input
                    className="lp-input"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    maxLength={9}
                  />
                  <span className="lp-icon"><IconUser /></span>
                </div>
              </div>

              <div className="lp-field">
                <span className="lp-label">Password</span>
                <div className="lp-input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="lp-input lp-input-pass"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  
                  <span className="lp-eye" onClick={() => setShowPassword(v => !v)}>
                    <IconEye open={showPassword} />
                  </span>
                </div>
              </div>

              {erro && <p className="lp-error">{erro}</p>}
              <button className="lp-btn">Entrar</button>
            </form>

            {role === 'Cliente' && (
              <p className="lp-switch">
                Não tens conta? <span onClick={() => switchTo('register')}>Criar conta</span>
              </p>
            )}
          </div>

        ) : (
          <div className="lp-form">
            <h1 className="lp-title">Criar Conta</h1>

            <div className="lp-grid-container">

              <div className="lp-field">
                <span className="lp-label">Nome</span>
                <div className="lp-input-wrap">
                  <input name="nome" className="lp-input" value={regData.nome} onChange={handleRegChange} />
                  <span className="lp-icon"><IconUser /></span>
                </div>
              </div>

              <div className="lp-field">
                <span className="lp-label">Email</span>
                <div className="lp-input-wrap">
                  <input name="email" type="email" className="lp-input" value={regData.email} onChange={handleRegChange} />
                  <span className="lp-icon"><IconMail /></span>
                </div>
              </div>

              <PasswordInput
                name="password"
                label="Password"
                value={regData.password}
                onChange={handleRegChange}
              />

              <PasswordInput
                name="confirmPassword"
                label="Confirmar"
                value={regData.confirmPassword}
                onChange={handleRegChange}
              />

              <div className="lp-field">
                <span className="lp-label">Nascimento</span>
                <div className="lp-input-wrap">
                  <input name="ano_nascimento" type="date" className="lp-input" value={regData.ano_nascimento} onChange={handleRegChange} />
                </div>
              </div>

              <div className="lp-field">
                <span className="lp-label">NIF</span>
                <div className="lp-input-wrap">
                  <input name="nif" className="lp-input" maxLength={9} value={regData.nif} onChange={handleRegChange} />
                </div>
              </div>

              <div className="lp-field full-width">
                <span className="lp-label">Género</span>
                <div className="lp-input-wrap">
                  <select name="genero" className="lp-input lp-select" value={regData.genero} onChange={handleRegChange}>
                    <option value="">Selecionar</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                  </select>
                </div>
              </div>

            </div>

            {erro && <p className="lp-error">{erro}</p>}

            <button className="lp-btn" onClick={handleRegister}>Registar</button>

            <p className="lp-switch">
              Já tens conta? <span onClick={() => switchTo('login')}>Login</span>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}