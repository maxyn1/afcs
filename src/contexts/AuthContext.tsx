
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

type UserRole = "user" | "admin";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Check for stored user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("user"); // Clean up invalid data
      }
    }
  }, []);

  
  const login = async (email: string, password: string) => {
    // In a real app, this would validate credentials against a backend
    // For now, we'll simulate with mock users
    
    // Mock users - in a real app, this would come from a backend
    const mockUsers = [
      {
        id: "1",
        name: "Admin User",
        email: "admin@example.com",
        password: "admin123",
        role: "admin" as UserRole
      },
      {
        id: "2",
        name: "Regular User",
        email: "user@example.com",
        password: "user123",
        role: "user" as UserRole
      }
    ];

    const matchedUser = mockUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (!matchedUser) {
      throw new Error("Invalid email or password");
    }

    // Remove password before storing
    const { password: _, ...userWithoutPassword } = matchedUser;
    setUser(userWithoutPassword);
    
    // Store user in localStorage
    localStorage.setItem("user", JSON.stringify(userWithoutPassword));

    // Redirect based on role
    if (userWithoutPassword.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};