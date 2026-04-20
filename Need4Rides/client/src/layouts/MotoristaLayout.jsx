import { Outlet } from 'react-router-dom';
import DriverTracker from '../components/DriverTracker';

export default function MotoristaLayout() {
  return (
    <>
      <DriverTracker /> {/* Ativo apenas para rotas dentro de MotoristaLayout */}
      <Outlet />
    </>
  );
}