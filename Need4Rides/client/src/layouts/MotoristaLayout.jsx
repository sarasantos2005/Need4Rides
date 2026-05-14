import { Outlet } from 'react-router-dom';
import DriverTracker from '../components/DriverTracker';
import { MotoristaViagemProvider } from '../components/MotoristaViagemContext';
import { Toaster } from 'react-hot-toast'; 

export default function MotoristaLayout() {
  return (
    <MotoristaViagemProvider>
      <Toaster position="top-right" reverseOrder={false} />
      <DriverTracker /> {/* Ativo apenas para rotas dentro de MotoristaLayout */}
      <Outlet />
    </MotoristaViagemProvider>
  );
}