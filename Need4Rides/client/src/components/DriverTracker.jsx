import { useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { notificacaoViagem } from './toast';

export default function DriverTracker() {
  const navigate = useNavigate();
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchTurno = async() => {
      try {
        const res = await axios.get('http://localhost:3000/api/turno/atual', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const turnoId = res.data?._id;
        if (turnoId) {
          localStorage.setItem('turnoId', turnoId);

          if (!socketRef.current) {
            const socket = io('http://localhost:3000', { auth: { token } });
            socketRef.current = socket;

            socket.on('connect', () => {
              socket.emit('entrar_motorista', turnoId);
            });

            socket.on('notificacao_viagem_confirmada', (data) => {
              notificacaoViagem(data.clienteNome).then((result) => {
                if (result.isConfirmed) {
                  navigate('/motorista/viagem', { state: { viagemId: data.viagemId } });
                }
              });
            });
          }
        }
      } catch (error) {
        console.error("Erro ao procurar turno ativo:", error.message);
      }
    };
    
    const sendLocation = async () => {
      try {
        if (!navigator.geolocation) return;
        
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
       
            if (isNaN(lat) || isNaN(lng)) {
              console.warn("Geolocalização retornou valores inválidos.");
              return;
            }

            try {
              await axios.post('http://localhost:3000/api/turno/posicao', 
                { lat: lat, lng: lng },
                { headers: { 'Authorization': `Bearer ${token}` } }
              );
            } catch (err) {
              console.error("Erro ao enviar localização:", err.message);
            }
          },
          
          (err) => console.error("Erro de GPS:", err)
        );
      } catch (err) {
        console.error("Erro ao enviar localização:", err);
      }
    };

    fetchTurno(); 

    const interval = setInterval(sendLocation, 15000); 

    return () => {
      clearInterval(interval);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [navigate]);

  return null;
}