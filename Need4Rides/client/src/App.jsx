import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import MotoristaRequisitarTaxi from './pages/MotoristaRequisitarTaxi';
import MotoristaLayout from './layouts/MotoristaLayout';

export default function App() {
  return (
    <BrowserRouter>
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
        </Route>
        <Route path="/gestor" element={<GestorHome />} />
        <Route path="/gestor/registar-motorista" element={<GestorRegistarMotorista />} />
        <Route path="/gestor/motoristas" element={<GestorMotoristas />} />
        <Route path="/gestor/taxis" element={<GestorTaxis />} />
        <Route path="/gestor/registar-taxi" element={<GestorRegistarTaxi />} />
        <Route path="/gestor/viagem" element={<GestorViagem />} />
        <Route path="/gestor/perfil" element={<GestorProfile />} />
        
      </Routes>
    </BrowserRouter>
  );
}
