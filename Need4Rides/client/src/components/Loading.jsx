import { useState, useEffect } from 'react';
import animationGif from '../assets/images/animation2.gif';
import heroBg from '../assets/images/LA.jpg';
import './Loading.css';

export default function Loading({ tasks = [], onFinished }) {
  const [visualProgress, setVisualProgress] = useState(0);

  const completed = tasks.filter(t => t === true).length;
  const total = tasks.length;
  const apiProgress = total > 0 ? (completed / total) * 100 : 0;

  useEffect(() => {
    const interval = setInterval(() => {
      setVisualProgress(prev => {
        if (apiProgress === 100) return prev < 100 ? prev + 2 : 100;
        
        if (prev < apiProgress) return prev + 1;
        
        if (prev < 95) return prev + 0.2; 
        
        return prev;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [apiProgress]);

  useEffect(() => {
    if (visualProgress >= 100) {
      const timer = setTimeout(() => {
        if (onFinished) onFinished();
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [visualProgress, onFinished]);

  const label =
    visualProgress < 30 ? 'A iniciar...' :
    visualProgress < 70 ? 'A carregar...' :
    visualProgress < 100 ? 'Quase pronto...' :
    'Finalizado...';

  return (
    <div className="loading-overlay" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="loading-card">
        <div className="loading-gif-container">
          <img src={animationGif} alt="A carregar..." className="loading-gif" />
        </div>
        <div className="loading-bar-track">
          <div 
            className="loading-bar-fill" 
            style={{ 
                width: `${visualProgress}%`, 
                transition: visualProgress >= 100 ? 'none' : 'width 0.2s linear' 
            }} 
          />
        </div>
        <div className="loading-footer">
          <span className="loading-label">{label}</span>
          <span className="loading-percent">{Math.floor(visualProgress)}%</span>
        </div>
      </div>
    </div>
  );
}
