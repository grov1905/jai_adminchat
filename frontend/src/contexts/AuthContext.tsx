/* // src/contexts/AuthContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

type AuthContextType = {
  token: string | null;
  refreshToken: string | null;
  setAuth: (data: { token: string; refreshToken: string }) => void;
  clearAuth: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('refreshToken'));

  const setAuth = (data: { token: string; refreshToken: string }) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    setToken(data.token);
    setRefreshToken(data.refreshToken);
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setRefreshToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, refreshToken, setAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; */

import { createContext, useContext, useState, ReactNode } from 'react';
import { BusinessUser } from '../types/businessUser';
import api from '../api/axiosConfig';


type AuthContextType = {
  token: string | null;
  refreshToken: string | null;
  user: BusinessUser | null;
  isSuperuser: boolean;
  setAuth: (data: { token: string; refreshToken: string }) => Promise<void>;
  clearAuth: () => void;
  fetchUserData: (authToken: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('refreshToken'));
  const [user, setUser] = useState<BusinessUser | null>(null);

  const fetchUserData = async (authToken: string) => { // Recibir token como parámetro
    try {
      const response = await api.get('/users/me/', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.data) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = response.data;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      clearAuth();
      throw error; // Re-lanzar el error para manejarlo en setAuth
    }
  };

  const setAuth = async (data: { token: string; refreshToken: string }) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    setToken(data.token);
    setRefreshToken(data.refreshToken);
    
    try {
      // Usar el token recién recibido
      await fetchUserData(data.token);
    } catch (error) {
      console.error('Error setting auth:', error);
      clearAuth();
      throw error; // Re-lanzar el error para manejarlo en LoginPage
    }
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  // Check if user is superuser (business is null)
  const isSuperuser = user?.business === null;

  return (
    <AuthContext.Provider value={{ 
      token, 
      refreshToken, 
      user,
      isSuperuser,
      setAuth, 
      clearAuth,
      fetchUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};