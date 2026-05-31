import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useEffect, useRef } from 'react';
import { MotoristaViagemProvider } from './components/MotoristaViagemContext';

import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Fatura from './pages/Fatura';
import PedirTaxi from './pages/PedirTaxi';
import Viagem from './pages/Viagem';
import Pagamento from './pages/Pagamento';
import AguardarTaxi from './pages/AguardarTaxi';
import MotoristaHome from './pages/MotoristaHome';
import MotoristaProfile from './pages/MotoristaProfile';
import GestorHome from './pages/GestorHome';
import GestorViagem from './pages/GestorViagem';
import MotoristaHistorico from './pages/MotoristaHistorico';
import MotoristaReabastecimento from './pages/MotoristaReabastecimento';
import MotoristaSuporte from './pages/MotoristaSuporte';
import MotoristaViagem from './pages/MotoristaViagem';
import MotoristaFaturaConf from './pages/MotoristaFaturaConf';
import HomeLogado from './pages/HomeLogado';
import GestorRegistarMotorista from './pages/GestorRegistarMotorista';
import GestorRegistarTaxi from './pages/GestorRegistarTaxi';
import GestorEditarTaxi from './pages/GestorEditarTaxi';
import GestorEditarMotorista from './pages/GestorEditarMotorista';
import GestorMotoristas from './pages/GestorMotoristas';
import GestorTaxis from './pages/GestorTaxis';
import GestorProfile from './pages/GestorProfile';
import GestorPrecos from './pages/GestorPrecos';
import GestorMotoristaProfile from './pages/GestorMotoristaProfile';
import MotoristaRequisitarTaxi from './pages/MotoristaRequisitarTaxi';
import MotoristaRelatorio from './pages/MotoristaRelatorio';
import MotoristaTurno from './pages/MotoristaTurno';
import MotoristaLayout from './layouts/MotoristaLayout';

function PagamentoRedirect({ children }) {
  if (localStorage.getItem('pagamentoViagemId')) return <Navigate to="/pagamento" replace state={{ aviso: true }} />;
  return children;
}

//Método em que o sistema não pergunta se há motorista, é avisado quando houver - evitar sobrecarga com mts users
function ViagemPoller() {
  const navigate = useNavigate();
  const socketRef = useRef(null);

  useEffect(() => {
    const setupSocket = () => {
      const token = localStorage.getItem('token');
      const viagemAtiva = JSON.parse(localStorage.getItem('viagemAtiva'));

      if (!token || !viagemAtiva?.viagemId) {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        return;
      }
      if (socketRef.current?.connected) return;  

      const socket = io('http://localhost:3000', { auth: { token }, reconnection: true });
      socketRef.current = socket;

      socket.on('connect', () => {
        const viagemAtualizada = JSON.parse(localStorage.getItem('viagemAtiva'));
        if (viagemAtualizada?.viagemId) {
          socket.emit('entrar_viagem', viagemAtualizada.viagemId);
          console.log('A ENTRAR NA SALA:', "viagem_" + viagemAtualizada.viagemId);
        }
      });

      socket.onAny((event, ...args) => {
        console.log(`📩 EVENTO GLOBAL: ${event}`, args);
      });

      socket.on('motorista_encontrado', (data) => {
        const viagemAtual = JSON.parse(localStorage.getItem('viagemAtiva'));
        
        const novaViagem = {
          ...viagemAtual,
          motorista: data.motorista,
          taxi: data.taxi,
          status: 'aguardandoConfirmacao'
        };
        
        localStorage.setItem('viagemAtiva', JSON.stringify(novaViagem));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('viagem_atualizada'));
      });

      socket.on('viagem_iniciada', (data) => {
        const viagemAtual = JSON.parse(localStorage.getItem('viagemAtiva'));
        localStorage.setItem('viagemAtiva', JSON.stringify({
          ...viagemAtual,
          status: 'emCurso'
        }));
        window.dispatchEvent(new Event('storage'));
      });

      socket.on('viagem_finalizada', (data) => {
        localStorage.setItem('pagamentoViagemId', data.viagemId);
        localStorage.removeItem('viagemAtiva');
        socket.disconnect();
        navigate('/pagamento', { state: { viagemId: data.viagemId } });
      });

      socket.on('viagem_cancelada', () => {
        localStorage.removeItem('viagemAtiva');
        
        socket.disconnect();
        navigate('/pedir-taxi');
      });

      socket.on('cliente_confirmou', (data) => {
        const viagemAtual = JSON.parse(localStorage.getItem('viagemAtiva'));
        localStorage.setItem('viagemAtiva', JSON.stringify({
          ...viagemAtual,
          status: 'aguardandoInicio'
        }));
        
        navigate('/viagem'); 
      });

      socket.on('cliente_rejeitou', () => {
        const viagemAtual = JSON.parse(localStorage.getItem('viagemAtiva'));
        localStorage.setItem('viagemAtiva', JSON.stringify({
          ...viagemAtual,
          motorista: null,
          status: 'procurando'
        }));
      });
    };

    setupSocket();
      
    const handleStorageChange = () => setupSocket();
    window.addEventListener('storage', handleStorageChange);

    window.addEventListener('viagem_atualizada', setupSocket);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('viagem_atualizada', setupSocket);
    };
  }, []);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ViagemPoller />
      <MotoristaViagemProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<PagamentoRedirect><HomeLogado /></PagamentoRedirect>} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<PagamentoRedirect><Profile /></PagamentoRedirect>} />
        <Route path="/fatura" element={<PagamentoRedirect><Fatura /></PagamentoRedirect>} />
        <Route path="/pedir-taxi" element={<PagamentoRedirect><PedirTaxi /></PagamentoRedirect>} />
        <Route path="/viagem" element={<Viagem />} />
        <Route path="/pagamento" element={<Pagamento />} />
        <Route path="/aguardar-taxi" element={<AguardarTaxi />} />
        <Route element={<MotoristaLayout />}>
          <Route path="/motorista" element={<MotoristaHome />} />
          <Route path="/motorista/perfil" element={<MotoristaProfile />} />
          <Route path="/motorista/requisitar-taxi" element={<MotoristaRequisitarTaxi />} />
          <Route path="/motorista/historico" element={<MotoristaHistorico />} />
          <Route path="/motorista/reabastecimento" element={<MotoristaReabastecimento />} />
          <Route path="/motorista/suporte" element={<MotoristaSuporte />} />
          <Route path="/motorista/viagem" element={<MotoristaViagem />} />
          <Route path="/motorista/fatura-conf" element={<MotoristaFaturaConf />} />
          <Route path="/motorista/relatorio" element={<MotoristaRelatorio />} />
          <Route path="/motorista/turno" element={<MotoristaTurno />} />
        </Route>
        <Route path="/gestor" element={<GestorHome />} />
        <Route path="/gestor/registar-motorista" element={<GestorRegistarMotorista />} />
        <Route path="/gestor/editar-motorista/:id" element={<GestorEditarMotorista />} />
        <Route path="/gestor/motoristas" element={<GestorMotoristas />} />
        <Route path="/gestor/motoristas/:motorista_id" element={<GestorMotoristaProfile />} />
        <Route path="/gestor/taxis" element={<GestorTaxis />} />
        <Route path="/gestor/registar-taxi" element={<GestorRegistarTaxi />} />
        <Route path="/gestor/editar-taxi/:id" element={<GestorEditarTaxi />} />
        <Route path="/gestor/viagem" element={<GestorViagem />} />
        <Route path="/gestor/perfil" element={<GestorProfile />} />
        <Route path="/gestor/precos" element={<GestorPrecos />} />
        
      </Routes>
      </MotoristaViagemProvider>
    </BrowserRouter>
  );
}
