import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/LA.jpg';
import '../css/Login.css';

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

export default function Login() {
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('Cliente');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const switchTo = (newMode) => { setMode(newMode); setErro(''); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    const body = { role, nif: identifier, senha_acesso_web: password };

    try {
      const res = await fetch('http://localhost:3000/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.message); return; }

      //Guardar o login no localstorage
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
          <div className="lp-form" key="login">
            <h1 className="lp-title">Login</h1>

            {/* Selector de perfil */}
            <div className="lp-tabs">
              {['Cliente', 'Motorista', 'Gestor'].map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`lp-tab ${role === r ? 'active' : ''}`}
                  onClick={() => { setRole(r); setIdentifier(''); setErro(''); }}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>

            <form onSubmit={handleLogin} style={{ display: 'contents' }}>
              
              <div className="lp-input-wrap">
                <input type="text" placeholder="NIF" className="lp-input" maxLength={9}
                  value={identifier} onChange={e => setIdentifier(e.target.value)} />
                <span className="lp-icon"><IconUser /></span>
              </div>

              <div className="lp-input-wrap">
                <input type="password" placeholder="Password" className="lp-input"
                  value={password} onChange={e => setPassword(e.target.value)} />
                <span className="lp-icon"><IconLock /></span>
              </div>

              {erro && <p className="lp-error">{erro}</p>}

              <div className="lp-row">
                <label className="lp-remember">
                  <input type="checkbox" />
                  <span>Lembrar-me</span>
                </label>
                <a href="#" className="lp-forgot">Esqueci-me da password</a>
              </div>

              <button type="submit" className="lp-btn">Entrar</button>
            </form>

            {role === 'Cliente' && (
              <p className="lp-switch">
                Não tens conta?{' '}
                <span onClick={() => switchTo('register')}>Criar conta</span>
              </p>
            )}
          </div>
        ) : (
          <div className="lp-form" key="register">
            <h1 className="lp-title">Criar Conta</h1>

            <div className="lp-input-wrap">
              <input type="text" placeholder="Nome" className="lp-input" />
              <span className="lp-icon"><IconUser /></span>
            </div>

            <div className="lp-input-wrap">
              <input type="email" placeholder="Email" className="lp-input" />
              <span className="lp-icon"><IconMail /></span>
            </div>

            <div className="lp-input-wrap">
              <input type="password" placeholder="Password" className="lp-input" />
              <span className="lp-icon"><IconLock /></span>
            </div>

            <div className="lp-input-wrap">
              <input type="password" placeholder="Confirmar Password" className="lp-input" />
              <span className="lp-icon"><IconLock /></span>
            </div>

            <div className="lp-input-wrap">
              <input type="date" placeholder="Data de Nascimento" className="lp-input" />
            </div>

            <div className="lp-input-wrap">
              <input type="text" placeholder="NIF" className="lp-input" maxLength={9} />
            </div>

            <div className="lp-input-wrap">
              <select className="lp-input lp-select" defaultValue="">
                <option value="" disabled>Género</option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </select>
            </div>

            <button className="lp-btn">Registar</button>

            <p className="lp-switch">
              Já tens conta?{' '}
              <span onClick={() => switchTo('login')}>Login</span>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
