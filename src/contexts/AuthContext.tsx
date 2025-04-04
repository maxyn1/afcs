
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'passenger' | 'driver' | 'sacco_admin' | 'system_admin';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDriver: boolean;
  isSaccoAdmin: boolean;
  isSystemAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: () => {},
  isAuthenticated: false,
  isAdmin: false,
  isDriver: false,
  isSaccoAdmin: false,
  isSystemAdmin: false
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = authService.getCurrentUser();
        const token = localStorage.getItem('token');
        
        if (storedUser && token) {
          setUser(storedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const userData = await authService.login(email, password);
    setUser(userData);
    setIsAuthenticated(true);
    
    // Redirect based on user role
    if (userData.role === 'system_admin') {
      navigate('/admin');
    } else if (userData.role === 'sacco_admin') {
      navigate('/sacco-admin');
    } else if (userData.role === 'driver') {
      navigate('/driver');
    } else {
      navigate('/dashboard');
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Role-based flags
  const isAdmin = user?.role === 'system_admin' || user?.role === 'sacco_admin';
  const isDriver = user?.role === 'driver';
  const isSaccoAdmin = user?.role === 'sacco_admin';
  const isSystemAdmin = user?.role === 'system_admin';

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated,
      isAdmin,
      isDriver,
      isSaccoAdmin,
      isSystemAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
