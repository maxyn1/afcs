
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  User, 
  Bus, 
  Route,
  Clock,
  MessageSquare,
  Settings, 
  LogOut, 
  Menu,
  X
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface DriverLayoutProps {
  children: React.ReactNode;
}

const DriverLayout: React.FC<DriverLayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { path: "/driver", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { path: "/driver/profile", label: "My Profile", icon: <User size={20} /> },
    { path: "/driver/vehicle", label: "My Vehicle", icon: <Bus size={20} /> },
    { path: "/driver/routes", label: "Routes", icon: <Route size={20} /> },
    { path: "/driver/trips", label: "Trip History", icon: <Clock size={20} /> },
    { path: "/driver/messages", label: "Messages", icon: <MessageSquare size={20} /> },
    { path: "/driver/settings", label: "Settings", icon: <Settings size={20} /> },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/driver" className="flex items-center">
              <span className="font-bold text-xl text-primary hidden sm:inline">Driver Dashboard</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1 py-2 ${
                  location.pathname === item.path
                    ? "text-primary font-medium"
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
          
          <div className="hidden md:flex">
            <Button 
              variant="destructive" 
              className="flex items-center gap-2"
              onClick={logout}
            >
              <LogOut size={18} />
              <span>Logout</span>
            </Button>
          </div>
          
          <button 
            className="md:hidden p-2 rounded-md text-gray-600"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>
      
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 p-2 rounded ${
                    location.pathname === item.path
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
              <button 
                className="flex items-center space-x-3 p-2 rounded text-destructive hover:bg-destructive/10"
                onClick={logout}
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </div>
      )}
      
      <main className="flex-1 p-4">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      
      <footer className="bg-white border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Kenya Automatic Fare Collection System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default DriverLayout;
