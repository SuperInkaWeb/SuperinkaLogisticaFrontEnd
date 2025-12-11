// Mock Database - Local Data Storage
export type UserRole = 'admin' | 'operador' | 'supervisor';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  total: number;
  productsCount: number;
  otn: string;
  status: 'pendiente' | 'en_transito' | 'entregado' | 'devolucion';
  carrierId?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  warehouseId: string;
  price: number;
  status: 'normal' | 'bajo' | 'agotado';
  image?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  city: string;
  capacity: number;
  currentStock: number;
  status: 'activo' | 'inactivo';
}

export interface Carrier {
  id: string;
  name: string;
  logo: string;
  status: 'activo' | 'configurar';
  trackingUrl?: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'warning' | 'info' | 'error' | 'success';
  timestamp: string;
  read: boolean;
}

// Mock Users
export const users: User[] = [
  { id: '1', email: 'admin@superinka.com', password: 'admin123', name: 'Carlos Admin', role: 'admin' },
  { id: '2', email: 'operador@superinka.com', password: 'operador123', name: 'María Operadora', role: 'operador' },
  { id: '3', email: 'supervisor@superinka.com', password: 'supervisor123', name: 'Juan Supervisor', role: 'supervisor' },
];

// Mock Orders
export const orders: Order[] = [
  { id: '1', orderNumber: 'ORD-2024-001', origin: 'Amazon Store', destination: 'Madrid, España', date: '2024-01-15', time: '09:30', total: 245.99, productsCount: 3, otn: 'OTN-78451', status: 'en_transito', carrierId: '1' },
  { id: '2', orderNumber: 'ORD-2024-002', origin: 'MercadoLibre', destination: 'Barcelona, España', date: '2024-01-15', time: '10:15', total: 189.50, productsCount: 2, otn: 'OTN-78452', status: 'pendiente' },
  { id: '3', orderNumber: 'ORD-2024-003', origin: 'Shopify Store', destination: 'Valencia, España', date: '2024-01-14', time: '14:00', total: 567.00, productsCount: 5, otn: 'OTN-78453', status: 'entregado', carrierId: '2' },
  { id: '4', orderNumber: 'ORD-2024-004', origin: 'Amazon Store', destination: 'Sevilla, España', date: '2024-01-14', time: '16:45', total: 89.99, productsCount: 1, otn: 'OTN-78454', status: 'devolucion', carrierId: '3' },
  { id: '5', orderNumber: 'ORD-2024-005', origin: 'WooCommerce', destination: 'Bilbao, España', date: '2024-01-13', time: '11:20', total: 334.25, productsCount: 4, otn: 'OTN-78455', status: 'en_transito', carrierId: '1' },
  { id: '6', orderNumber: 'ORD-2024-006', origin: 'Etsy Shop', destination: 'Málaga, España', date: '2024-01-13', time: '08:00', total: 156.80, productsCount: 2, otn: 'OTN-78456', status: 'pendiente' },
  { id: '7', orderNumber: 'ORD-2024-007', origin: 'Amazon Store', destination: 'Zaragoza, España', date: '2024-01-12', time: '13:30', total: 423.00, productsCount: 6, otn: 'OTN-78457', status: 'entregado', carrierId: '4' },
  { id: '8', orderNumber: 'ORD-2024-008', origin: 'Shopify Store', destination: 'Murcia, España', date: '2024-01-12', time: '17:15', total: 78.50, productsCount: 1, otn: 'OTN-78458', status: 'en_transito', carrierId: '2' },
];

// Mock Products
export const products: Product[] = [
  { id: '1', sku: 'SKU-001', name: 'Laptop HP ProBook', category: 'Electrónica', stock: 45, minStock: 10, warehouseId: '1', price: 899.99, status: 'normal' },
  { id: '2', sku: 'SKU-002', name: 'Mouse Inalámbrico Logitech', category: 'Accesorios', stock: 8, minStock: 15, warehouseId: '1', price: 29.99, status: 'bajo' },
  { id: '3', sku: 'SKU-003', name: 'Monitor Samsung 27"', category: 'Electrónica', stock: 0, minStock: 5, warehouseId: '2', price: 349.99, status: 'agotado' },
  { id: '4', sku: 'SKU-004', name: 'Teclado Mecánico RGB', category: 'Accesorios', stock: 67, minStock: 20, warehouseId: '1', price: 89.99, status: 'normal' },
  { id: '5', sku: 'SKU-005', name: 'Webcam HD 1080p', category: 'Accesorios', stock: 23, minStock: 10, warehouseId: '2', price: 59.99, status: 'normal' },
  { id: '6', sku: 'SKU-006', name: 'Auriculares Bluetooth', category: 'Audio', stock: 3, minStock: 10, warehouseId: '1', price: 149.99, status: 'bajo' },
  { id: '7', sku: 'SKU-007', name: 'SSD 1TB Samsung', category: 'Almacenamiento', stock: 89, minStock: 25, warehouseId: '2', price: 119.99, status: 'normal' },
  { id: '8', sku: 'SKU-008', name: 'Cable HDMI 2m', category: 'Cables', stock: 156, minStock: 50, warehouseId: '1', price: 12.99, status: 'normal' },
];

// Mock Warehouses
export const warehouses: Warehouse[] = [
  { id: '1', name: 'Almacén Central Madrid', city: 'Madrid', capacity: 10000, currentStock: 7500, status: 'activo' },
  { id: '2', name: 'Centro Logístico Barcelona', city: 'Barcelona', capacity: 8000, currentStock: 5200, status: 'activo' },
  { id: '3', name: 'Depósito Valencia', city: 'Valencia', capacity: 5000, currentStock: 3100, status: 'activo' },
  { id: '4', name: 'Almacén Sevilla', city: 'Sevilla', capacity: 3000, currentStock: 0, status: 'inactivo' },
];

// Mock Carriers
export const carriers: Carrier[] = [
  { id: '1', name: 'DHL Express', logo: '📦', status: 'activo', trackingUrl: 'https://dhl.com/track' },
  { id: '2', name: 'UPS', logo: '🚚', status: 'activo', trackingUrl: 'https://ups.com/track' },
  { id: '3', name: 'Nacex', logo: '📮', status: 'activo' },
  { id: '4', name: 'GLS', logo: '🏷️', status: 'configurar' },
  { id: '5', name: 'MRW', logo: '📬', status: 'configurar' },
  { id: '6', name: 'Correos Express', logo: '✉️', status: 'activo' },
  { id: '7', name: 'Amazon Logistics', logo: '📦', status: 'activo' },
  { id: '8', name: 'FedEx', logo: '🛩️', status: 'configurar' },
];

// Mock Notifications
export const notifications: Notification[] = [
  { id: '1', message: 'La orden ORD-2024-002 está retrasada. El transportista no ha actualizado el estado.', type: 'warning', timestamp: '2024-01-15T10:30:00', read: false },
  { id: '2', message: 'El cliente ha procesado una devolución para la orden ORD-2024-004.', type: 'info', timestamp: '2024-01-15T09:15:00', read: false },
  { id: '3', message: 'Stock bajo detectado: Mouse Inalámbrico Logitech (8 unidades)', type: 'warning', timestamp: '2024-01-15T08:00:00', read: true },
  { id: '4', message: 'Nueva orden recibida: ORD-2024-008 de Shopify Store', type: 'success', timestamp: '2024-01-14T17:15:00', read: true },
];

// KPI calculations
export const getKPIs = () => ({
  totalInventory: products.reduce((acc, p) => acc + p.stock, 0),
  lowStockProducts: products.filter(p => p.status === 'bajo').length,
  outOfStockProducts: products.filter(p => p.status === 'agotado').length,
  pendingOrders: orders.filter(o => o.status === 'pendiente').length,
  inTransitOrders: orders.filter(o => o.status === 'en_transito').length,
  deliveredOrders: orders.filter(o => o.status === 'entregado').length,
  returns: orders.filter(o => o.status === 'devolucion').length,
  activeWarehouses: warehouses.filter(w => w.status === 'activo').length,
});
