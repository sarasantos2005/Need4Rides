import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ddImg from '../assets/images/fennec.jpg';
import './AvatarDropdown.css';

export default function AvatarDropdown({ profilePath = '/profile', avatarClass = 'avatar-img' }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('motoristataxi');
    localStorage.removeItem('token');
    localStorage.removeItem('user_logado');
    setOpen(false);
    navigate('/login');
  };

  return (
    <div className="av-wrap" ref={ref}>
      <img
        src={ddImg}
        alt="Perfil"
        className={avatarClass}
        onClick={() => setOpen(o => !o)}
      />
      {open && (
        <div className="av-dropdown">
          <button className="av-item" onClick={() => { setOpen(false); navigate(profilePath); }}>
            Ver Perfil
          </button>
          <button className="av-item av-item-logout" onClick={handleLogout}>
            Terminar Sessão
          </button>
        </div>
      )}
    </div>
  );
}
