import { useState, useEffect } from 'react';
import animationGif from '../assets/images/animation.gif';
import heroBg from '../assets/images/LA.jpg';
import './Loading.css';

const GIF_DURATION = 8000;

export default function Loading() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const t = Math.min((Date.now() - start) / GIF_DURATION, 1);
      // ease-out: fast start, slows towards the end
      const eased = 1 - Math.pow(1 - t, 2.2);
      setProgress(eased * 100);
      if (t >= 1) clearInterval(id);
    }, 50);
    return () => clearInterval(id);
  }, []);

  const label =
    progress < 25 ? 'A iniciar...' :
    progress < 60 ? 'A carregar...' :
    progress < 88 ? 'Quase pronto...' :
    'A finalizar...';

  return (
    <div className="loading-overlay" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="loading-card">
        <img src={animationGif} alt="A carregar..." className="loading-gif" />
        <div className="loading-bar-track">
          <div className="loading-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="loading-footer">
          <span className="loading-label">{label}</span>
          <span className="loading-percent">{Math.floor(progress)}%</span>
        </div>
      </div>
    </div>
  );
}
