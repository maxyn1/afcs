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
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDriver: boolean;
  isSaccoAdmin: boolean;
  isSystemAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {
    return { id: '', name: '', email: '', role: 'passenger' };
  },
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
        } else {
          console.warn("No valid user or token found during initialization");
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const userData = await authService.login(email, password);

      if (!userData || !userData.role) {
        console.error("Invalid user data received:", userData); // Debug log
        throw new Error("Invalid user data received");
      }

      setUser(userData);
      setIsAuthenticated(true);

      const redirectPath = authService.getRedirectPath(userData.role || "passenger"); // Fallback to "passenger"
      navigate(redirectPath, { replace: true });
      return userData; // Return the user object
    } catch (error) {
      console.error("Login error:", error);
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
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
