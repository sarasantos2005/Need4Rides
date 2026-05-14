import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';

const MotoristaViagemContext = createContext(null);
const SOCKET_URL = 'http://localhost:3000';

export function MotoristaViagemProvider({ children }) {
  const navigate = useNavigate();
  const [viagemAtiva, setViagemAtiva] = useState(() =>
    JSON.parse(localStorage.getItem('viagemAtivaMotorista')) || null
  );

  const limparViagem = () => {
    localStorage.removeItem('viagemAtivaMotorista');
    setViagemAtiva(null);
  };

  const atualizarViagem = (data) => {
    const payload = { 
        viagemId: data.viagemId, 
        status: data.status, 
        viagem: data.viagem, 
        cliente: data.cliente, 
        info: data.info 
    };
    localStorage.setItem('viagemAtivaMotorista', JSON.stringify(payload));
    setViagemAtiva(payload);
    navigate('/motorista/viagem');
  };

  useEffect(() => {
      try {
        const token = localStorage.getItem('token');
        const motorista = JSON.parse(localStorage.getItem('user_logado'));
        if (!motorista?.id) return;

        const socket = io(SOCKET_URL, {
          auth: { token},
          query: { userid: motorista.id }
        });

        const verificarEstadoInicial = async() => {
          try {
            const { data } = await axios.get(`${SOCKET_URL}/api/viagem/motorista/ativa`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if(data?.viagemId){
              atualizarViagem(data);
            } else {
              limparViagem();
            }
          } catch (error) {
            console.error("Erro na verificação inicial:", error.message);
          }
        }

        verificarEstadoInicial();

        socket.on('nova_viagem_atribuida', (data) => {
          console.log('Recebida nova viagem via Socket!');
          atualizarViagem(data);
        });

        socket.on('viagem_cancelada_ou_finalizada', () => {
          limparViagem();
          navigate('/motorista'); 
        });

        return () => {
          socket.disconnect();
        };
      } catch (err) {
        console.error('Polling viagem motorista:', err.message);
      }

  }, [navigate]);

  return (
    <MotoristaViagemContext.Provider value={{ viagemAtiva }}>
      {children}
    </MotoristaViagemContext.Provider>
  );
}

export function useMotoristaViagem() {
  return useContext(MotoristaViagemContext);
}