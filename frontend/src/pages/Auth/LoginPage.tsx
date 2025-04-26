// src/pages/Auth/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { loginUser } from '../../api/admin/auth';
import logo from '../../assets/logo.png';
const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { access, refresh } = await loginUser(credentials);
      setAuth({ token: access, refreshToken: refresh });
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Credenciales incorrectas. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <img src={logo} alt="Logo" className="w-15 h-15 mb-4" />
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Iniciar Sesión</h1>
        <p className="text-gray-600 mb-6">Ingresa tus credenciales para acceder al panel</p>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ backgroundColor: 'white !important', color: '#1E2A47 !important' }}
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-1">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ backgroundColor: 'white !important', color: '#1E2A47 !important' }}
              required
            />
          </div>
          
          <button
  type="submit"
  disabled={loading}
  className={`
    w-full py-2 px-4 rounded-md text-white font-medium
    transition-all duration-200 ease-in-out
    font-roboto  // Usa la fuente Roboto configurada
    ${loading 
      ? 'bg-primary-light cursor-not-allowed shadow-sm' 
      : `
        bg-primary 
        hover:bg-[#2a3a5f]  // Versión 10% más clara del primary
        active:bg-[#17233d]  // Versión 15% más oscura
        shadow-sm hover:shadow-md
      `
    }
    focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2
  `}
>
  {loading ? (
    <span className="animate-fadeIn">Procesando...</span>
  ) : (
    <span className="hover:scale-[1.02] transition-transform">Enviar</span>
  )}
</button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;