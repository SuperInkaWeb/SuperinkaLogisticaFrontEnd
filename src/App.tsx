import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/theme-provider";

// Contextos
import { AuthProvider, useAuth } from "./frontend/context/AuthContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { CartProvider } from "./context/CartContext";

// Páginas Existentes
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Warehouses from "./pages/Warehouses";
import Orders from "./pages/Orders";
import Carriers from "./pages/Carriers";
import Users from "./pages/Users";
import Reports from "./pages/Reports";
import Configuration from "./pages/Configuration";
import NotFound from "./pages/NotFound";
import Shop from "./pages/Shop";
import Companies from "./pages/Companies";

// Páginas Nuevas (Módulo Heladeros & Activos)
import Dispatch from "./pages/Dispatch";
import Settlement from "./pages/Settlement";
import IceCreamSellers from "./pages/IceCreamSellers";
import MyLoad from "./pages/MyLoad";
import Assets from "./pages/Assets";

// Componente para proteger rutas privadas y por rol
const ProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element, allowedRoles?: string[] }) => {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="animate-pulse w-8 h-8 bg-primary rounded-full"></div>
        </div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Verificar Rol si se especifica
    if (allowedRoles && user) {
        const userRole = user.role.toLowerCase().replace('role_', '');
        if (!allowedRoles.includes(userRole)) {
            // Redirección inteligente si no tiene permiso
            // CORRECCIÓN: Si es cliente O heladero, lo mandamos a la tienda
            if (userRole === 'cliente' || userRole === 'heladero') return <Navigate to="/shop" replace />;
            if (userRole === 'operador') return <Navigate to="/inventory" replace />; // Operador no tiene dashboard
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
};

const App = () => (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <CurrencyProvider>
            <TooltipProvider>
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <AuthProvider>
                        <CartProvider>
                            <Toaster />
                            <Sonner />
                            <Routes>
                                {/* Rutas Públicas */}
                                <Route path="/" element={<Index />} />
                                <Route path="/login" element={<Login />} />

                                {/* --- ROL HELADERO / CLIENTE --- */}
                                <Route path="/shop" element={
                                    // CORRECCIÓN: Permitir 'heladero'
                                    <ProtectedRoute allowedRoles={['cliente', 'heladero']}>
                                        <Shop />
                                    </ProtectedRoute>
                                } />
                                <Route path="/my-load" element={
                                    // CORRECCIÓN: Permitir 'heladero'
                                    <ProtectedRoute allowedRoles={['cliente', 'heladero']}>
                                        <MyLoad />
                                    </ProtectedRoute>
                                } />

                                {/* --- STAFF (Super Admin, Admin, Supervisor, Operador) --- */}

                                {/* Dashboard: Solo Super Admin, Admin y Supervisor */}
                                <Route path="/dashboard" element={
                                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'supervisor']}>
                                        <Dashboard />
                                    </ProtectedRoute>
                                } />

                                {/* Inventario: Todos (Super Admin, Admin, Supervisor, Operador) */}
                                <Route path="/inventory" element={
                                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'supervisor', 'operador']}>
                                        <Inventory />
                                    </ProtectedRoute>
                                } />

                                {/* RUTAS DE ACTIVOS (Vinculadas al Inventario) */}
                                <Route path="/assets/client" element={
                                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'supervisor', 'operador']}>
                                        <Assets />
                                    </ProtectedRoute>
                                } />
                                <Route path="/assets/company" element={
                                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'supervisor', 'operador']}>
                                        <Assets />
                                    </ProtectedRoute>
                                } />

                                {/* Pedidos: Todos + Heladero + Cliente */}
                                <Route path="/orders" element={
                                    // CORRECCIÓN: Permitir 'heladero'
                                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'supervisor', 'operador', 'cliente', 'heladero']}>
                                        <Orders />
                                    </ProtectedRoute>
                                } />

                                <Route path="/reports" element={
                                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'supervisor', 'operador']}>
                                        <Reports />
                                    </ProtectedRoute>
                                } />

                                {/* Almacenes: Todos (según tu requerimiento: operador también ve almacenes) */}
                                <Route path="/warehouses" element={
                                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'supervisor', 'operador']}>
                                        <Warehouses />
                                    </ProtectedRoute>
                                } />

                                {/* Módulos Gestión de Heladeros (NUEVO) */}
                                <Route path="/dispatch" element={
                                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'supervisor', 'operador']}>
                                        <Dispatch />
                                    </ProtectedRoute>
                                } />
                                <Route path="/settlement" element={
                                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'supervisor', 'operador']}>
                                        <Settlement />
                                    </ProtectedRoute>
                                } />
                                <Route path="/sellers" element={
                                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'supervisor']}>
                                        <IceCreamSellers />
                                    </ProtectedRoute>
                                } />

                                {/* Transportistas: Solo Super Admin, Admin y Supervisor */}
                                <Route path="/carriers" element={
                                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'supervisor']}>
                                        <Carriers />
                                    </ProtectedRoute>
                                } />

                                {/* --- SOLO ADMIN Y SUPER ADMIN --- */}
                                <Route path="/users" element={
                                    <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                                        <Users />
                                    </ProtectedRoute>
                                } />

                                {/* --- SOLO SUPER ADMIN: GESTIÓN DE EMPRESAS --- */}
                                <Route path="/companies" element={
                                    <ProtectedRoute allowedRoles={['super_admin']}>
                                        <Companies />
                                    </ProtectedRoute>
                                } />

                                {/* Configuración: Accesible para todos los roles autenticados */}
                                <Route path="/configuration" element={
                                    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'supervisor', 'operador', 'cliente', 'heladero']}>
                                        <Configuration />
                                    </ProtectedRoute>
                                } />

                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </CartProvider>
                    </AuthProvider>
                </BrowserRouter>
            </TooltipProvider>
        </CurrencyProvider>
    </ThemeProvider>
);

export default App;