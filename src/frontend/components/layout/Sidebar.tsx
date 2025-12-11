import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Warehouse, 
  Truck, 
  ClipboardList, 
  BarChart3, 
  Users, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/frontend/context/AuthContext';
import superinkaLogo from '@/assets/superinka-logo.png';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  requiredPermission?: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Package, label: 'Inventarios', path: '/inventarios' },
  { icon: Warehouse, label: 'Almacenes', path: '/almacenes' },
  { icon: ClipboardList, label: 'Órdenes', path: '/ordenes' },
  { icon: Truck, label: 'Transportistas', path: '/transportistas' },
  { icon: BarChart3, label: 'Reportes', path: '/reportes', requiredPermission: 'canViewReports' },
  { icon: Users, label: 'Usuarios', path: '/usuarios', requiredPermission: 'canManageUsers' },
  { icon: Settings, label: 'Configuración', path: '/configuracion' },
];

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout, permissions } = useAuth();

  const filteredNavItems = navItems.filter(item => {
    if (!item.requiredPermission) return true;
    return permissions?.[item.requiredPermission as keyof typeof permissions];
  });

  return (
    <aside 
      className={cn(
        "h-screen gradient-sidebar flex flex-col transition-all duration-300 ease-in-out border-r border-sidebar-border",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
        {!collapsed && (
          <img 
            src={superinkaLogo} 
            alt="SuperInka" 
            className="h-10 object-contain"
          />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-inka" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon size={20} className={cn(isActive && "animate-pulse-inka")} />
              {!collapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-card text-card-foreground rounded-md text-sm font-medium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center gap-3",
          collapsed && "justify-center"
        )}>
          <div className="w-10 h-10 rounded-full gradient-inka flex items-center justify-center text-primary-foreground font-bold text-sm">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.role}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground hover:text-destructive"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
