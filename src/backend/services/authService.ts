import { users, User, UserRole } from '../data/mockData';

export interface AuthResponse {
  success: boolean;
  user?: Omit<User, 'password'>;
  error?: string;
}

export const authenticateUser = (email: string, password: string): AuthResponse => {
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return { success: false, error: 'Credenciales inválidas' };
  }

  const { password: _, ...userWithoutPassword } = user;
  return { success: true, user: userWithoutPassword };
};

export const getUserById = (id: string): Omit<User, 'password'> | null => {
  const user = users.find(u => u.id === id);
  if (!user) return null;
  
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const getRolePermissions = (role: UserRole) => {
  const permissions = {
    admin: {
      canManageUsers: true,
      canManageInventory: true,
      canManageOrders: true,
      canManageWarehouses: true,
      canManageCarriers: true,
      canViewReports: true,
      canExportData: true,
    },
    supervisor: {
      canManageUsers: false,
      canManageInventory: true,
      canManageOrders: true,
      canManageWarehouses: true,
      canManageCarriers: true,
      canViewReports: true,
      canExportData: true,
    },
    operador: {
      canManageUsers: false,
      canManageInventory: false,
      canManageOrders: true,
      canManageWarehouses: false,
      canManageCarriers: false,
      canViewReports: false,
      canExportData: false,
    },
  };

  return permissions[role];
};
