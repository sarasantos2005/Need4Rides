import axios from 'axios';

export function setupAxiosInterceptor(navigate) {
  if (axios._authInterceptorRegistered) return;
  axios._authInterceptorRegistered = true;

  axios.interceptors.response.use(
    (response) => response, 
    (error) => {
      const status = error?.response?.status;

      if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user_logado');
        localStorage.removeItem('viagemAtiva');
        localStorage.removeItem('pagamentoViagemId');
        localStorage.removeItem('motoristataxi');
        localStorage.removeItem('turnoId');
        navigate('/', { replace: true });
      }

      return Promise.reject(error);
    }
  );
}