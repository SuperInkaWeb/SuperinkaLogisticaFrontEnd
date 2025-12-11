import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  min_stock: number;
  warehouse_id: string | null;
  price: number;
  status: 'normal' | 'bajo' | 'agotado';
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  city: string;
  capacity: number;
  current_stock: number;
  status: 'activo' | 'inactivo';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Carrier {
  id: string;
  name: string;
  logo: string | null;
  status: 'activo' | 'configurar';
  is_active: boolean;
  tracking_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  total: number;
  products_count: number;
  otn: string;
  status: 'pendiente' | 'en_transito' | 'entregado' | 'devolucion' | 'delivered';
  carrier_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  message: string;
  type: 'warning' | 'info' | 'error' | 'success';
  read: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'supervisor' | 'operador';
}

export interface UserWithRole extends Profile {
  role: 'admin' | 'supervisor' | 'operador';
}

// Helper to bypass strict typing for dynamic table names
const fromTable = (tableName: string) => {
  return (supabase as any).from(tableName);
};

export function useProducts() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: result, error: fetchError } = await fromTable('products').select('*').order('name', { ascending: true });
      if (fetchError) throw fetchError;
      setData((result as unknown as Product[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  return { data, loading, error, refetch: fetchData };
}

export function useWarehouses() {
  const [data, setData] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: result, error: fetchError } = await fromTable('warehouses').select('*').order('name', { ascending: true });
      if (fetchError) throw fetchError;
      setData((result as unknown as Warehouse[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  return { data, loading, error, refetch: fetchData };
}

export function useCarriers() {
  const [data, setData] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: result, error: fetchError } = await fromTable('carriers').select('*').order('name', { ascending: true });
      if (fetchError) throw fetchError;
      setData((result as unknown as Carrier[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  return { data, loading, error, refetch: fetchData };
}

export function useOrders() {
  const [data, setData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: result, error: fetchError } = await fromTable('orders').select('*').order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setData((result as unknown as Order[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  return { data, loading, error, refetch: fetchData };
}

export function useNotifications(userId?: string) {
  const [data, setData] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      let query = fromTable('notifications').select('*').order('created_at', { ascending: false });
      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      }
      const { data: result, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setData((result as unknown as Notification[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [userId]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await fromTable('notifications').update({ read: true }).eq('id', notificationId);
    if (!error) setData(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
  };

  return { data, loading, error, refetch: fetchData, markAsRead };
}

export function useUsers() {
  const [data, setData] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: profiles, error: profilesError } = await fromTable('profiles').select('*').order('name', { ascending: true });
      if (profilesError) throw profilesError;
      const { data: roles, error: rolesError } = await fromTable('user_roles').select('*');
      if (rolesError) throw rolesError;
      
      const profilesTyped = (profiles as unknown as Profile[]) || [];
      const rolesTyped = (roles as unknown as UserRole[]) || [];
      
      const usersWithRoles: UserWithRole[] = profilesTyped.map(profile => {
        const userRole = rolesTyped.find(r => r.user_id === profile.id);
        return { ...profile, role: userRole?.role || 'operador' };
      });
      setData(usersWithRoles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  return { data, loading, error, refetch: fetchData };
}

export function useKPIs() {
  const { data: products, loading: productsLoading } = useProducts();
  const { data: orders, loading: ordersLoading } = useOrders();
  const { data: warehouses, loading: warehousesLoading } = useWarehouses();

  const loading = productsLoading || ordersLoading || warehousesLoading;

  const kpis = {
    totalInventory: products.reduce((acc, p) => acc + p.stock, 0),
    lowStockProducts: products.filter(p => p.status === 'bajo').length,
    outOfStockProducts: products.filter(p => p.status === 'agotado').length,
    pendingOrders: orders.filter(o => o.status === 'pendiente').length,
    inTransitOrders: orders.filter(o => o.status === 'en_transito').length,
    deliveredOrders: orders.filter(o => o.status === 'entregado').length,
    returns: orders.filter(o => o.status === 'devolucion').length,
    activeWarehouses: warehouses.filter(w => w.status === 'activo').length,
  };

  return { kpis, loading, products, orders, warehouses };
}

export const dataService = {
  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await fromTable('products').insert(product).select().single();
    if (error) throw error;
    return data;
  },
  async updateProduct(id: string, updates: Partial<Product>) {
    const { data, error } = await fromTable('products').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteProduct(id: string) {
    const { error } = await fromTable('products').delete().eq('id', id);
    if (error) throw error;
  },
  async createWarehouse(warehouse: Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await fromTable('warehouses').insert(warehouse).select().single();
    if (error) throw error;
    return data;
  },
  async updateWarehouse(id: string, updates: Partial<Warehouse>) {
    const { data, error } = await fromTable('warehouses').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteWarehouse(id: string) {
    const { error } = await fromTable('warehouses').delete().eq('id', id);
    if (error) throw error;
  },
  async createCarrier(carrier: Omit<Carrier, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await fromTable('carriers').insert(carrier).select().single();
    if (error) throw error;
    return data;
  },
  async updateCarrier(id: string, updates: Partial<Carrier>) {
    const { data, error } = await fromTable('carriers').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteCarrier(id: string) {
    const { error } = await fromTable('carriers').delete().eq('id', id);
    if (error) throw error;
  },
  async createOrder(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await fromTable('orders').insert(order).select().single();
    if (error) throw error;
    return data;
  },
  async updateOrder(id: string, updates: Partial<Order>) {
    const { data, error } = await fromTable('orders').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteOrder(id: string) {
    const { error } = await fromTable('orders').delete().eq('id', id);
    if (error) throw error;
  },
  async updateUserRole(userId: string, role: 'admin' | 'supervisor' | 'operador') {
    const { data, error } = await fromTable('user_roles').update({ role }).eq('user_id', userId).select().single();
    if (error) throw error;
    return data;
  },
  async createUserProfile(profile: { id: string; email: string; name: string; avatar_url?: string | null }) {
    const { data, error } = await fromTable('profiles').insert(profile).select().single();
    if (error) throw error;
    return data;
  },
  async createUserRole(userId: string, role: 'admin' | 'supervisor' | 'operador') {
    const { data, error } = await fromTable('user_roles').insert({ user_id: userId, role }).select().single();
    if (error) throw error;
    return data;
  },
};
