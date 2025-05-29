// frontend/src/components/Admin/Layout/AdminLayout.tsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../../contexts/AuthContext';
import { useState, useEffect } from 'react';

const AdminLayout = () => {
  const { token } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es mobile/tablet
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // Cerrar sidebar cuando se redimensiona a desktop
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

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
      {/* Botón hamburguesa para mobile/tablet */}
      <div className="md:hidden fixed top-4 left-4 z-30">
        <button
          onClick={toggleSidebar}
          className="p-2 bg-primary text-white rounded-md shadow-lg hover:bg-primary-dark transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <Sidebar 
        isOpen={isMobile ? sidebarOpen : true} 
        onClose={closeSidebar}
      />
      
      {/* Contenido principal */}
      <div className={`
        flex-1 h-full overflow-y-auto transition-all duration-300 ease-in-out
        ${isMobile 
          ? 'ml-0' 
          : 'ml-64'
        }
      `}>
        {/* Espaciado superior en mobile para el botón hamburguesa */}
        <div className={`
          min-h-full bg-white
          ${isMobile ? 'pt-16 px-4 pb-6' : 'p-6'}
        `}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;