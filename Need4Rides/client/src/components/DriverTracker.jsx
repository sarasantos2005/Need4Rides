import { startTransition, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { notificacaoViagem } from './toast';

const LOCATION_MAX_AGE = 10_000;  
const LOCATION_TIMEOUT = 10_000;
const TURNO_RETRY_INTERVAL = 30_000;

export default function DriverTracker() {
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);
  const turnoRetryRef = useRef(null);
  const isSendingRef = useRef(false);
  const turnoIdRef = useRef(null);

  const sendLocationViaSocket = useCallback((lat, long) => {
    if(!socketRef.current?.connected) return;
    if(isNaN(lat) || isNaN(lng)) {
      console.warn('[DriverTracker] Coordenadas inválidas:', lat, lng);
      return;
    }
    socketRef.current.emit('posicao_motorista', { lat, lng });
  }, []);

  const startWatchingPosition = useCallback(() => {
    if(!navigator.geolocation) {
      console.warn('[DriverTracker] Geolocalização não suportada neste browser');
      return;
    }

    if(watchIdRef.current !== null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if(isSendingRef.current) return;
        isSendingRef.current = true;

        sendLocationViaSocket(pos.coords.latitude, pos.coords.longitude);

        setTimeout(() => { isSendingRef.current = false; }, 1000);
      },
      (err) => console.error('[DriverTracker] Erro GPS:', err.message),
      {
        enableHighAccuracy: true,
        maximumAge: LOCATION_MAX_AGE,
        timeout: LOCATION_TIMEOUT,
      }
    );
  }, [sendLocationViaSocket]);

  const connectSocket = useCallback((token, turnoId) => {
    if(socketRef.current) return;

    const socket = io('http://localhost:3000', {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.info('[DriverTracker] Socket conectado');
      socket.emit('entrar_motorista', turnoId);
      startWatchingPosition();
    });

    socket.on('disconnect', (reason) => {
      console.warn('[DriverTracker] Socket desconectado:', reason);
      if(watchIdRef.current !== null){
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    });

    socket.on('reconnect', () => {
      console.info('[DriverTracker] Socket reconectado');
      if(turnoIdRef.current) {
        socket.emit('entrar_motorista', turnoIdRef.current);
      }
      startWatchingPosition();
    });

    socket.on('notificacao_viagem_confirmada', (data) => {
      notificacaoViagem(data.clienteNome).then((result) => {
        if(result.isConfirmed) {
          navigate('/motorista/viagem', { state: { viagemId: data.viagemId } });
        }
      });
    });
  }, [navigate, startWatchingPosition]);

  const fetchTurno = useCallback(async (token) => {
    try {
      const res = await axios.get('http://localhost:3000/api/turno/atual', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const turnoId = res.data?._id;
      if(!turnoId) return false;

      localStorage.setItem('turnoId', turnoId);
      turnoId.current = turnoId;
      connectSocket(token, turnoId);
      return true;
    } catch (error) {
      console.error("Erro ao procurar turno ativo:", error.message);
      return false;
    }
  }, [connectSocket]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetchTurno(token).then((found) => {
      if(!found) {
        turnoRetryRef.current = setInterval(async() => {
          const ok = await fetchTurno(token);
          if(ok && turnoRetryRef.current) {
            clearInterval(turnoRetryRef.current);
            turnoRetryRef.current = null;
          }
        }, TURNO_RETRY_INTERVAL);
      }
    });

    return() => {
      if(turnoRetryRef.current) {
        clearInterval(turnoRetryRef.current);
        turnoRetryRef.current = null;
      }

      if(watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      if(socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [fetchTurno]);

  return null;
}