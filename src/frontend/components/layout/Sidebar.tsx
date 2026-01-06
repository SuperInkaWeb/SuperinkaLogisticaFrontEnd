import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Truck,
    Users,
    Settings,
    FileText,
    Warehouse,
    LogOut,
    X,
    Store,
    Building2,
    ClipboardList,
    Bike,
    Sofa,
    ChevronDown,
    ChevronRight,
    LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/frontend/context/AuthContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface MenuChild {
    label: string;
    path: string;
    icon: LucideIcon;
}

interface MenuItem {
    type?: 'group';
    label: string;
    path?: string;
    icon: LucideIcon;
    children?: MenuChild[];
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const location = useLocation();
    const { logout, user } = useAuth();

    // Estado para el menú desplegable de inventario
    const [isInventoryOpen, setIsInventoryOpen] = useState(true);

    // Normalizar rol
    const role = user?.role?.toLowerCase().replace('role_', '') || 'operador';

    const getMenuItems = () => {
        const items: MenuItem[] = [];

        // --- 1. SUPER ADMIN (Gestión SaaS Exclusiva) ---
        if (role === 'super_admin') {
            return [
                { icon: LayoutDashboard, label: "Dashboard SaaS", path: "/dashboard" },
                { icon: Building2, label: "Empresas", path: "/companies" },
                { icon: Users, label: "Usuarios Globales", path: "/users" }, // Gestión de Admins
                { icon: Settings, label: "Configuración", path: "/configuration" }
            ];
        }

        // --- 2. VISTA CLIENTE O HELADERO ---
        if (role === 'cliente' || role === 'heladero') {
            return [
                { icon: Store, label: "Catálogo", path: "/shop" },
                { icon: ClipboardList, label: "Mi Carga Diaria", path: "/my-load" },
                { icon: ShoppingCart, label: "Mis Pedidos", path: "/orders" },
                { icon: Settings, label: "Configuración", path: "/configuration" }
            ];
        }

        // --- 3. VISTAS DE GESTIÓN OPERATIVA (Admin, Supervisor, Operador) ---

        // Dashboard
        items.push({ icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" });

        // GRUPO INVENTARIO (Desplegable) - Admin, Supervisor, Operador
        items.push({
            type: 'group',
            label: 'Inventario & Activos',
            icon: Package,
            children: [
                { label: "Productos", path: "/inventory", icon: Package },
                { label: "Activos Clientes", path: "/assets/client", icon: Bike },
                { label: "Activos Empresa", path: "/assets/company", icon: Sofa }
            ]
        });

        // OPERACIONES - Admin, Supervisor, Operador
        items.push({ icon: ClipboardList, label: "Despachos", path: "/dispatch" });
        items.push({ icon: FileText, label: "Liquidación", path: "/settlement" });
        items.push({ icon: ShoppingCart, label: "Gestión Pedidos", path: "/orders" });
        items.push({ icon: Warehouse, label: "Almacenes", path: "/warehouses" });

        // GESTIÓN DE PERSONAL - Solo Admin y Supervisor (No Operadores)
        if (['admin', 'supervisor'].includes(role)) {
            items.push({ icon: Truck, label: "Transportistas", path: "/carriers" });
            items.push({ icon: Users, label: "Heladeros/Clientes", path: "/sellers" });
        }

        // ADMINISTRACIÓN DE USUARIOS - Solo Admin (Crea supervisores/operadores)
        if (role === 'admin') {
            items.push({ icon: Users, label: "Usuarios Staff", path: "/users" });
        }

        // REPORTES - Todos los roles de gestión
        items.push({ icon: FileText, label: "Reportes", path: "/reports" });

        // CONFIGURACIÓN - Todos
        items.push({ icon: Settings, label: "Configuración", path: "/configuration" });

        return items;
    };

    const menuItems = getMenuItems();

    return (
        <>
            {/* Overlay para móviles */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r dark:border-gray-800 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex items-center justify-between h-16 px-6 border-b dark:border-gray-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <img src="/superinka-logo.png" alt="Logo" className="h-8 w-auto" />
                        <span className="font-bold text-lg text-primary">SuperInka</span>
                    </div>
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    {menuItems.map((item, idx) => {
                        // Renderizar Grupo Desplegable
                        if (item.type === 'group') {
                            return (
                                <Collapsible
                                    key={idx}
                                    open={isInventoryOpen}
                                    onOpenChange={setIsInventoryOpen}
                                    className="space-y-1"
                                >
                                    <CollapsibleTrigger asChild>
                                        <Button variant="ghost" className="w-full justify-between font-medium hover:bg-slate-100 dark:hover:bg-gray-800">
                                            <div className="flex items-center gap-3">
                                                <item.icon className="h-4 w-4" />
                                                {item.label}
                                            </div>
                                            {isInventoryOpen ? <ChevronDown className="h-4 w-4"/> : <ChevronRight className="h-4 w-4"/>}
                                        </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="pl-4 space-y-1 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                                        {item.children?.map((child: MenuChild) => (
                                            <Link
                                                key={child.path}
                                                to={child.path}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                                                    location.pathname === child.path
                                                        ? "bg-primary/10 text-primary font-medium"
                                                        : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-foreground"
                                                )}
                                                onClick={() => onClose()}
                                            >
                                                <child.icon className="h-4 w-4 opacity-70" />
                                                {child.label}
                                            </Link>
                                        ))}
                                    </CollapsibleContent>
                                </Collapsible>
                            );
                        }

                        // Renderizar Item Normal
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-foreground"
                                )}
                                onClick={() => onClose()}
                            >
                                <Icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t dark:border-gray-800 shrink-0">
                    <div className="mb-4 px-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rol Actual</p>
                        <p className="text-sm font-bold capitalize text-primary">{role.replace('_', ' ')}</p>
                    </div>
                    <Button
                        variant="outline"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50"
                        onClick={logout}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar Sesión
                    </Button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;