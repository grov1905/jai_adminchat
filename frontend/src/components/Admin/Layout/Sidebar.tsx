import { NavLink } from 'react-router-dom';
import logo from '../../../assets/logo.png';

const Sidebar = () => {
  return (
    <div className="w-full h-full bg-primary text-white flex flex-col">
      {/* Encabezado con logo */}
      <div className="p-4 border-b border-primary-light flex items-center">
        <div className="bg-white p-1 rounded-md mr-3">
          <img 
            src={logo} 
            alt="Logo" 
            className="w-12 h-12 object-contain"
          />
        </div>
        <h1 className="text-lg font-semibold">Admin Panel</h1>
      </div>

      {/* Menú de navegación */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-2">
          {[
            { to: "/admin/dashboard", text: "Dashboard" },
            { to: "/admin/business", text: "Negocios" }, 
            { to: "/admin/users", text: "Usuarios" },
            { to: "/admin/roles", text: "Roles" }
          ].map((item) => (
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
    </div>
  );
};

export default Sidebar;