import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/frontend/context/AuthContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import DashboardLayout from "@/frontend/components/layout/DashboardLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Inventory from "./pages/Inventory";
import Warehouses from "./pages/Warehouses";
import Carriers from "./pages/Carriers";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Configuration from "./pages/Configuration";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CurrencyProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              
              {/* Protected Routes */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/ordenes" element={<Orders />} />
                <Route path="/inventarios" element={<Inventory />} />
                <Route path="/almacenes" element={<Warehouses />} />
                <Route path="/transportistas" element={<Carriers />} />
                <Route path="/reportes" element={<Reports />} />
                <Route path="/usuarios" element={<Users />} />
                <Route path="/configuracion" element={<Configuration />} />
              </Route>
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CurrencyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
