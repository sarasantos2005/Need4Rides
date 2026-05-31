import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function useAuthGuard(requiredRole = null) {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) throw new Error('Token malformado');

      const payload = JSON.parse(atob(payloadBase64));

      const agora = Math.floor(Date.now() / 1000); 
      if (payload.exp && payload.exp < agora) {
        clearAuthStorage();
        navigate('/', { replace: true });
        return;
      }

      if (requiredRole && payload.role !== requiredRole) {
        navigate('/', { replace: true });
        return;
      }
    } catch {
      clearAuthStorage();
      navigate('/', { replace: true });
    }
  }, [navigate, requiredRole]);
}

function clearAuthStorage() {
  localStorage.removeItem('token');
  localStorage.removeItem('user_logado');
  localStorage.removeItem('viagemAtiva');
  localStorage.removeItem('pagamentoViagemId');
  localStorage.removeItem('motoristataxi');
  localStorage.removeItem('turnoId');
}