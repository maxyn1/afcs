
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import DriverLayout from "./components/DriverLayout";
import SaccoAdminLayout from "./components/SaccoAdminLayout";
import LandingPage from "./pages/landingpage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import TransactionHistory from "./pages/TransactionHistory";
import Profile from "./pages/Profile";
import Support from "./pages/Support";
import Wallet from "./pages/Wallet";
import PaymentMethods from "./pages/PaymentMethods";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import Users from "./pages/admin/Users";
import Vehicles from "./pages/admin/Vehicles";
import Saccos from "./pages/admin/Saccos";
import AdminSettings from "./pages/admin/AdminSettings";
import TransactionAnalytics from "./pages/admin/TransactionAnalytics";
import Drivers from "./pages/admin/Drivers";

// Driver pages
import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverProfile from "./pages/driver/DriverProfile";
import DriverTrips from "./pages/driver/DriverTrips";
import DriverVehicle from "./pages/driver/DriverVehicle";
import DriverRoute from "./pages/driver/DriverRoute"; 
import DriverMessages from "./pages/driver/DriverMessages";
import DriverSettings from "./pages/driver/DriverSettings";

// SACCO Admin pages
import SaccoAdminDashboard from "./pages/sacco/SaccoAdminDashboard";
import SaccoDrivers from "./pages/sacco/SaccoDrivers";
import SaccoVehicles from "./pages/sacco/SaccoVehicles";
import SaccoRoutes from "./pages/sacco/SaccoRoutes";
import SaccoAnalytics from "./pages/sacco/SaccoAnalytics";
import SaccoPayments from "./pages/sacco/SaccoPayments";
import SaccoSettings from "./pages/sacco/SaccoSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* User protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TransactionHistory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/support"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Support />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/wallet"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Wallet />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-methods"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PaymentMethods />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Admin protected routes */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout><></></AdminLayout></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="saccos" element={<Saccos />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="analytics" element={<TransactionAnalytics />} />
              <Route path="drivers" element={<Drivers />} />
            </Route>
            
            {/* Driver protected routes */}
            <Route path="/driver" element={
              <ProtectedRoute requireDriver>
                <DriverLayout>
                  <DriverDashboard />
                </DriverLayout>
              </ProtectedRoute>
            } />
            <Route path="/driver/profile" element={
              <ProtectedRoute requireDriver>
                <DriverLayout>
                  <DriverProfile />
                </DriverLayout>
              </ProtectedRoute>
            } />

            <Route path='/driver/routes' element={
              <ProtectedRoute requireDriver>
                <DriverLayout>
                  <DriverRoute />
                </DriverLayout>
              </ProtectedRoute>
            } />
            <Route path="/driver/messages" element={
              <ProtectedRoute requireDriver>
                <DriverLayout>
                  <DriverMessages />
                </DriverLayout>
              </ProtectedRoute>
            } />
            <Route path="/driver/settings" element={
              <ProtectedRoute requireDriver>
                <DriverLayout>
                  <DriverSettings />
                </DriverLayout>
              </ProtectedRoute>
            } />
            

            <Route path="/driver/trips" element={
              <ProtectedRoute requireDriver>
                <DriverLayout>
                  <DriverTrips />
                </DriverLayout>
              </ProtectedRoute>
            } />
            <Route path="/driver/vehicle" element={
              <ProtectedRoute requireDriver>
                <DriverLayout>
                  <DriverVehicle />
                </DriverLayout>
              </ProtectedRoute>
            } />
            
            {/* SACCO Admin protected routes */}
            <Route path="/sacco-admin" element={
              <ProtectedRoute requireSaccoAdmin>
                <SaccoAdminLayout>
                  <SaccoAdminDashboard />
                </SaccoAdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/sacco-admin/drivers" element={
              <ProtectedRoute requireSaccoAdmin>
                <SaccoAdminLayout>
                  <SaccoDrivers />
                </SaccoAdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/sacco-admin/vehicles" element={
              <ProtectedRoute requireSaccoAdmin>
                <SaccoAdminLayout>
                  <SaccoVehicles />
                </SaccoAdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/sacco-admin/routes" element={
              <ProtectedRoute requireSaccoAdmin>
                <SaccoAdminLayout>
                  <SaccoRoutes />
                </SaccoAdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/sacco-admin/analytics" element={
              <ProtectedRoute requireSaccoAdmin>
                <SaccoAdminLayout>
                  <SaccoAnalytics />
                </SaccoAdminLayout>
              </ProtectedRoute>
            } />

            <Route path="/sacco-admin/payments" element={
              <ProtectedRoute requireSaccoAdmin>
                <SaccoAdminLayout>
                  <SaccoPayments />
                </SaccoAdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/sacco-admin/settings" element={
              <ProtectedRoute requireSaccoAdmin>
                <SaccoAdminLayout>
                  <SaccoSettings />
                </SaccoAdminLayout>
              </ProtectedRoute>
            } />

            {/* Catch-all route for 404 */}
            
            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
