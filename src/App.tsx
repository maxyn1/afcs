
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

// Driver pages
import DriverDashboard from "./pages/driver/DriverDashboard";

// SACCO Admin pages
import SaccoAdminDashboard from "./pages/sacco/SaccoAdminDashboard";

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
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/transactions" element={
              <ProtectedRoute>
                <Layout>
                  <TransactionHistory />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/support" element={
              <ProtectedRoute>
                <Layout>
                  <Support />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/wallet" element={
              <ProtectedRoute>
                <Layout>
                  <Wallet />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/payment-methods" element={
              <ProtectedRoute>
                <Layout>
                  <PaymentMethods />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Admin protected routes */}
            <Route path="/admin" element={
              <ProtectedRoute requireSystemAdmin>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requireSystemAdmin>
                <AdminLayout>
                  <Users />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/vehicles" element={
              <ProtectedRoute requireSystemAdmin>
                <AdminLayout>
                  <Vehicles />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/saccos" element={
              <ProtectedRoute requireSystemAdmin>
                <AdminLayout>
                  <Saccos />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute requireSystemAdmin>
                <AdminLayout>
                  <AdminSettings />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute requireSystemAdmin>
                <AdminLayout>
                  <TransactionAnalytics />
                </AdminLayout>
              </ProtectedRoute>
            } />
            
            {/* Driver protected routes */}
            <Route path="/driver" element={
              <ProtectedRoute requireDriver>
                <DriverLayout>
                  <DriverDashboard />
                </DriverLayout>
              </ProtectedRoute>
            } />
            
            {/* Add driver routes for the other sections */}
            <Route path="/driver/profile" element={
              <ProtectedRoute requireDriver>
                <DriverLayout>
                  <div className="space-y-6">
                    <h1 className="text-3xl font-bold">Driver Profile</h1>
                    <p className="text-muted-foreground">This page is under construction.</p>
                  </div>
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
            
            {/* Add SACCO Admin routes for the other sections */}
            <Route path="/sacco-admin/drivers" element={
              <ProtectedRoute requireSaccoAdmin>
                <SaccoAdminLayout>
                  <div className="space-y-6">
                    <h1 className="text-3xl font-bold">Drivers Management</h1>
                    <p className="text-muted-foreground">This page is under construction.</p>
                  </div>
                </SaccoAdminLayout>
              </ProtectedRoute>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
