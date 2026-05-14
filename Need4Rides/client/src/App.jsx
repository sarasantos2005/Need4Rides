import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
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
import GestorMotoristas from './pages/GestorMotoristas';
import GestorTaxis from './pages/GestorTaxis';
import GestorProfile from './pages/GestorProfile';
import GestorPrecos from './pages/GestorPrecos';
import GestorMotoristaProfile from './pages/GestorMotoristaProfile';
import MotoristaRequisitarTaxi from './pages/MotoristaRequisitarTaxi';
import MotoristaRelatorio from './pages/MotoristaRelatorio';
import MotoristaLayout from './layouts/MotoristaLayout';

//Método em que o sistema não pergunta se há motorista, é avisado quando houver - evitar sobrecarga com mts users
function ViagemPoller() {
  const navigate = useNavigate();
  const socketRef = useRef(null);

  useEffect(() => {
    const tentarLigar = () => {
      const token = localStorage.getItem('token');
      const viagemAtiva = JSON.parse(localStorage.getItem('viagemAtiva'));

      if (!token || !viagemAtiva?.viagemId || viagemAtiva?.motorista) return;
      if (socketRef.current?.connected) return;

      socketRef.current?.disconnect();

      const socket = io('http://localhost:3000', { auth: { token } });
      socketRef.current = socket;
      console.log('SOCKET CRIADO:', socket.id);

      socket.on('connect', () => {
        console.log('CONNECT DISPAROU:', socket.id);
        const viagemAtualizada = JSON.parse(localStorage.getItem('viagemAtiva'));
        if (viagemAtualizada?.viagemId) {
          console.log('A ENTRAR NA SALA:', viagemAtualizada.viagemId);
          socket.emit('entrar_viagem', viagemAtualizada.viagemId);
          window.dispatchEvent(new Event('sala_pronta'));
        }
      });

      socket.on('connect_error', (err) => {
        console.error('CONNECT_ERROR:', err.message, err);
      });

      socket.on('disconnect', (reason) => {
        console.log('DISCONNECT:', reason);
      });

      socket.on('motorista_encontrado', (data) => {
        const viagemAtual = JSON.parse(localStorage.getItem('viagemAtiva'));
        localStorage.setItem('viagemAtiva', JSON.stringify({
          ...viagemAtual,
          motorista: data.motorista,
          taxi: data.taxi
        }));
        window.dispatchEvent(new Event('storage'));
        console.log('Dispatch');
        socketRef.current?.disconnect();
      });
    };

    // Tenta imediatamente
    tentarLigar();

    // Ouve mudanças no localStorage
    window.addEventListener('storage', tentarLigar);

    return () => {
      window.removeEventListener('storage', tentarLigar);
      socketRef.current?.disconnect();
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
        <Route path="/home" element={<HomeLogado />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/fatura" element={<Fatura />} />
        <Route path="/pedir-taxi" element={<PedirTaxi />} />
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
        </Route>
        <Route path="/gestor" element={<GestorHome />} />
        <Route path="/gestor/registar-motorista" element={<GestorRegistarMotorista />} />
        <Route path="/gestor/motoristas" element={<GestorMotoristas />} />
        <Route path="/gestor/motoristas/:motorista_id" element={<GestorMotoristaProfile />} />
        <Route path="/gestor/taxis" element={<GestorTaxis />} />
        <Route path="/gestor/registar-taxi" element={<GestorRegistarTaxi />} />
        <Route path="/gestor/viagem" element={<GestorViagem />} />
        <Route path="/gestor/perfil" element={<GestorProfile />} />
        <Route path="/gestor/precos" element={<GestorPrecos />} />
        
      </Routes>
      </MotoristaViagemProvider>
    </BrowserRouter>
  );
}
