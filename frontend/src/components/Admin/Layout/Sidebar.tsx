import { NavLink } from 'react-router-dom';
import logo from '../../../assets/logo.png';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const { user, isSuperuser, clearAuth } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { to: "/admin/dashboard", text: "Dashboard" },
    { to: "/admin/business", text: "Negocios", visible: isSuperuser },
    { to: "/admin/bot-settings", text: "Config. del Bot", visible: isSuperuser },
    { to: "/admin/bot-templates", text: "Plantillas del Bot" },
    { to: "/admin/users", text: "Usuarios", visible: isSuperuser },
    { to: "/admin/roles", text: "Roles", visible: isSuperuser }
  ].filter(item => item.visible !== false);

  const handleLogout = () => {
    clearAuth();
    navigate('/login'); // Redirigir a la página de login
  };

  return (
    <div className="w-full h-full bg-primary text-white flex flex-col">
      {/* Encabezado con logo */}
      <div className="p-4 border-b border-primary-light flex items-center">
        <div className="bg-white p-1 rounded-md mr-3">
          <img 
            src={logo} 
            alt="Logo" 
            className="w-24 h-24 object-contain"
          />
        </div>
        <h1 className="text-lg font-semibold">Admin Panel</h1>
      </div>

      {/* Información del usuario */}
      {user && (
        <div className="p-4 border-b border-primary-light">
          <div className="flex items-center">
            <div className="bg-white text-primary rounded-full w-10 h-10 flex items-center justify-center font-bold mr-3">
              {user.full_name.charAt(0)}
            </div>
            <div>
              <p className="font-medium">{user.full_name}</p>
              <p className="text-xs text-primary-light">{user.email}</p>
              {user.business && (
                <p className="text-xs text-primary-light">{user.business.name}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Menú de navegación */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-md text-sm transition-all duration-200 no-underline ${
                    isActive 
                      ? 'bg-white text-primary font-medium shadow-sm' 
                      : 'text-primary-light hover:bg-primary-light hover:bg-opacity-10 hover:text-white'
                  }`
                }
              >
                {item.text}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Botón de cerrar sesión */}
      <div className="p-4 border-t border-primary-light">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-4 py-2.5 rounded-md text-sm text-white bg-red-600 hover:bg-red-700 transition-colors duration-200"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
            />
          </svg>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;