import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MotoristaViagemContext = createContext(null);

export function MotoristaViagemProvider({ children }) {
  const navigate = useNavigate();
  const pollingRef = useRef(null);
  const [viagemAtiva, setViagemAtiva] = useState(() =>
    JSON.parse(localStorage.getItem('viagemAtivaMotorista')) || null
  );

  useEffect(() => {
    const verificar = async () => {
      try {
        const token = localStorage.getItem('token');
        const motorista = JSON.parse(localStorage.getItem('user_logado'));
        if (!motorista?.id) return;

        const { data } = await axios.get(
          `http://localhost:3000/api/viagem/motorista/ativa`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data?.viagemId) {
          const jaGuardada = JSON.parse(localStorage.getItem('viagemAtivaMotorista'));

          if (jaGuardada?.viagemId !== data.viagemId) {
            const payload = { viagemId: data.viagemId, status: data.status, viagem: data.viagem, cliente: data.cliente, info: data.info };
            localStorage.setItem('viagemAtivaMotorista', JSON.stringify(payload));
            setViagemAtiva(payload);

            navigate('/motorista/viagem');
          }
        } else {
          if (localStorage.getItem('viagemAtivaMotorista')) {
            localStorage.removeItem('viagemAtivaMotorista');
            setViagemAtiva(null);
          }
        }
      } catch (err) {
        console.error('Polling viagem motorista:', err.message);
      }
    };

    verificar();
    pollingRef.current = setInterval(verificar, 4000);

    return () => clearInterval(pollingRef.current);
  }, []);

  return (
    <MotoristaViagemContext.Provider value={{ viagemAtiva }}>
      {children}
    </MotoristaViagemContext.Provider>
  );
}

export function useMotoristaViagem() {
  return useContext(MotoristaViagemContext);
}