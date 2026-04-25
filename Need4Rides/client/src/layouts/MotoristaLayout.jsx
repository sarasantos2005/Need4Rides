import { Outlet } from 'react-router-dom';
import DriverTracker from '../components/DriverTracker';
import { MotoristaViagemProvider } from '../components/MotoristaViagemContext';


export default function MotoristaLayout() {
  return (
    <MotoristaViagemProvider>
      <DriverTracker /> {/* Ativo apenas para rotas dentro de MotoristaLayout */}
      <Outlet />
    </MotoristaViagemProvider>
  );
}