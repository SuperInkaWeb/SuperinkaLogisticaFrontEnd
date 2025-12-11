-- Insert seed data for warehouses
INSERT INTO public.warehouses (id, name, city, capacity, current_stock, status) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Almacén Central Madrid', 'Madrid', 10000, 7500, 'activo'),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Centro Logístico Barcelona', 'Barcelona', 8000, 5200, 'activo'),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Depósito Valencia', 'Valencia', 5000, 3100, 'activo'),
('d4e5f6a7-b8c9-0123-def0-234567890123', 'Almacén Sevilla', 'Sevilla', 3000, 0, 'inactivo');

-- Insert seed data for carriers
INSERT INTO public.carriers (id, name, logo, status, tracking_url) VALUES
('e5f6a7b8-c9d0-1234-ef01-345678901234', 'DHL Express', '📦', 'activo', 'https://dhl.com/track'),
('f6a7b8c9-d0e1-2345-f012-456789012345', 'UPS', '🚚', 'activo', 'https://ups.com/track'),
('a7b8c9d0-e1f2-3456-0123-567890123456', 'Nacex', '📮', 'activo', NULL),
('b8c9d0e1-f2a3-4567-1234-678901234567', 'GLS', '🏷️', 'configurar', NULL),
('c9d0e1f2-a3b4-5678-2345-789012345678', 'MRW', '📬', 'configurar', NULL),
('d0e1f2a3-b4c5-6789-3456-890123456789', 'Correos Express', '✉️', 'activo', NULL),
('e1f2a3b4-c5d6-7890-4567-901234567890', 'Amazon Logistics', '📦', 'activo', NULL),
('f2a3b4c5-d6e7-8901-5678-012345678901', 'FedEx', '🛩️', 'configurar', NULL);

-- Insert seed data for products
INSERT INTO public.products (sku, name, category, stock, min_stock, warehouse_id, price, status) VALUES
('SKU-001', 'Laptop HP ProBook', 'Electrónica', 45, 10, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 899.99, 'normal'),
('SKU-002', 'Mouse Inalámbrico Logitech', 'Accesorios', 8, 15, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 29.99, 'bajo'),
('SKU-003', 'Monitor Samsung 27"', 'Electrónica', 0, 5, 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 349.99, 'agotado'),
('SKU-004', 'Teclado Mecánico RGB', 'Accesorios', 67, 20, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 89.99, 'normal'),
('SKU-005', 'Webcam HD 1080p', 'Accesorios', 23, 10, 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 59.99, 'normal'),
('SKU-006', 'Auriculares Bluetooth', 'Audio', 3, 10, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 149.99, 'bajo'),
('SKU-007', 'SSD 1TB Samsung', 'Almacenamiento', 89, 25, 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 119.99, 'normal'),
('SKU-008', 'Cable HDMI 2m', 'Cables', 156, 50, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 12.99, 'normal');

-- Insert seed data for orders
INSERT INTO public.orders (order_number, origin, destination, date, time, total, products_count, otn, status, carrier_id) VALUES
('ORD-2024-001', 'Amazon Store', 'Madrid, España', '2024-01-15', '09:30', 245.99, 3, 'OTN-78451', 'en_transito', 'e5f6a7b8-c9d0-1234-ef01-345678901234'),
('ORD-2024-002', 'MercadoLibre', 'Barcelona, España', '2024-01-15', '10:15', 189.50, 2, 'OTN-78452', 'pendiente', NULL),
('ORD-2024-003', 'Shopify Store', 'Valencia, España', '2024-01-14', '14:00', 567.00, 5, 'OTN-78453', 'entregado', 'f6a7b8c9-d0e1-2345-f012-456789012345'),
('ORD-2024-004', 'Amazon Store', 'Sevilla, España', '2024-01-14', '16:45', 89.99, 1, 'OTN-78454', 'devolucion', 'a7b8c9d0-e1f2-3456-0123-567890123456'),
('ORD-2024-005', 'WooCommerce', 'Bilbao, España', '2024-01-13', '11:20', 334.25, 4, 'OTN-78455', 'en_transito', 'e5f6a7b8-c9d0-1234-ef01-345678901234'),
('ORD-2024-006', 'Etsy Shop', 'Málaga, España', '2024-01-13', '08:00', 156.80, 2, 'OTN-78456', 'pendiente', NULL),
('ORD-2024-007', 'Amazon Store', 'Zaragoza, España', '2024-01-12', '13:30', 423.00, 6, 'OTN-78457', 'entregado', 'b8c9d0e1-f2a3-4567-1234-678901234567'),
('ORD-2024-008', 'Shopify Store', 'Murcia, España', '2024-01-12', '17:15', 78.50, 1, 'OTN-78458', 'en_transito', 'f6a7b8c9-d0e1-2345-f012-456789012345');