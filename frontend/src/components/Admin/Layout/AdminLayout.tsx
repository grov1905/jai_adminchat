// frontend/src/components/Admin/Layout/AdminLayout.tsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../../contexts/AuthContext';

const AdminLayout = () => {
  const { token } = useAuth();

  if (!token) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-light-bg">
        <div className="p-6 bg-white rounded-lg shadow-md">
          No autorizado
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-light-bg font-roboto">
      {/* Sidebar - Columna izquierda */}
      <div className="w-64 fixed left-0 top-0 h-full z-10">
        <Sidebar />
      </div>
      
      {/* Contenido principal - Columna derecha */}
      <div className="flex-1 ml-64 h-full overflow-y-auto">
        <div className="p-6 min-h-full bg-white">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;