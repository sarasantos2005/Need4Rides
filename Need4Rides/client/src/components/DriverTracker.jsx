import { useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

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
              toast((t) => (
                <div style={{ color: '#333' }}>
                  <p style={{ margin: 0 }}><b>{data.clienteNome}</b> confirmou a viagem!</p>
                  <p style={{ fontSize: '11px', color: '#666', margin: '4px 0' }}>
                    {data.origem} → {data.destino}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button 
                    onClick={() => {
                      toast.dismiss(t.id);
                      // Navega passando o ID da viagem
                      navigate('/motorista/viagem', { state: { viagemId: data.viagemId } });
                    }}
                    style={{ background: '#f5a623', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Ir para Viagem
                  </button>
                  <button onClick={() => toast.dismiss(t.id)} style={{ color: "black", background: 'transparent', border: '1px solid #ccc', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                    Fechar
                  </button>
                  </div>
                </div>
              ), { duration: 10000 });
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