import { useCallback } from 'react';
import { api } from '@/lib/api';
import { useToast } from './use-toast';

// --- Interfaces Base ---

export interface Product {
    id?: string;
    name: string;
    sku: string;
    stock: number;
    minStock?: number;
    category: string;
    price: number;
    status?: 'normal' | 'bajo' | 'agotado';
    volumeFactor?: number;
    warehouseId?: string;
    warehouse?: { id: string; name: string };
    active?: boolean;
}

export interface Warehouse {
    id?: string;
    name: string;
    city: string;
    currentStock: number;
    capacity: number;
    status?: string;
    active?: boolean;
}

export interface Carrier {
    id?: string;
    name: string;
    logo?: string;
    status: string;
    trackingUrl?: string;
}

export interface User {
    id?: string;
    name: string;
    email: string;
    password?: string;
    role?: string;
    enabled?: boolean;
    companyId?: string;
    companyName?: string;
}

export interface Company {
    id?: string;
    name: string;
    ruc?: string;
    address?: string;
    logoUrl?: string;
    active?: boolean;
}

// --- Interfaces de Activos (Triciclos, etc.) ---

export interface Asset {
    id?: string;
    code: string;
    name: string;
    type: string;
    scope: 'CLIENT' | 'COMPANY';
    status: 'disponible' | 'en_uso' | 'mantenimiento' | 'baja';
    active?: boolean;
}

export interface AssetMovement {
    id?: string;
    asset: Asset;
    checkOutTime?: string;
    checkInTime?: string;
    statusIn?: string;
}

// --- Interfaces de Pedidos y Heladeros ---

export interface IceCreamSeller {
    id?: string;
    name: string;
    email?: string;
    password?: string;
    dni: string;
    phone?: string;
    address?: string;
    active?: boolean;
    currentDebt?: number;
    debt?: number; // Alias para compatibilidad con frontend
    code?: string; // Código del heladero
    creditLimit?: number;
    role?: string;
}

export interface OrderItem {
    id?: string;
    productId?: string;
    productName: string;
    quantity: number;
    quantityDelivered?: number;
    price: number;
}

export interface Order {
    id?: string;
    orderNumber?: string;
    origin: string;
    destination: string;
    status?: string;
    total: number;
    productsCount: number;
    date?: string;
    time?: string;
    otn?: string;
    carrier?: { id: string; name: string; logo?: string };
    carrierId?: string;
    items?: OrderItem[];
    deliveryType?: 'delivery' | 'warehouse';
    paymentStatus?: 'pending' | 'partial' | 'paid';
    user?: User;
    userId?: string;
}

export interface LoadItem {
    id?: string;
    productId: string;
    productName?: string;
    quantityOut: number;
    quantityIn?: number;
    quantityBad?: number;
    quantitySold?: number;
    unitPrice: number;
}

export interface DailyLoad {
    id?: string;
    sellerId: string;
    seller?: User;
    order?: { id: string };
    date: string;
    status: 'open' | 'closed';
    items?: LoadItem[];
    assetMovements?: AssetMovement[];
    totalLoadValue?: number;
    totalReturnValue?: number;
    totalSalesValue?: number;
    paymentAmount?: number;
}

// --- Hook Principal ---

export const useApiData = () => {
    const { toast } = useToast();

    const handleError = useCallback((error: unknown, context: string) => {
        console.error(`Error en ${context}:`, error);
        let message = `No se pudo completar la acción en ${context}.`;

        if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
            if (axiosError.response?.data?.message) {
                message = axiosError.response.data.message;
            } else if (axiosError.response?.status === 403) {
                message = "No tienes permisos para realizar esta acción.";
            }
        }

        toast({
            variant: "destructive",
            title: "Error",
            description: message,
        });
    }, [toast]);

    // --- GETTERS (Lectura) ---
    const getProducts = useCallback(async () => {
        try { return (await api.get<Product[]>('/v1/products')).data; }
        catch (e) { handleError(e, 'productos'); return []; }
    }, [handleError]);

    const getWarehouses = useCallback(async () => {
        try { return (await api.get<Warehouse[]>('/v1/warehouses')).data; }
        catch (e) { handleError(e, 'almacenes'); return []; }
    }, [handleError]);

    const getOrders = useCallback(async () => {
        try { return (await api.get<Order[]>('/v1/orders')).data; }
        catch (e) { handleError(e, 'pedidos'); return []; }
    }, [handleError]);

    const getCarriers = useCallback(async () => {
        try { return (await api.get<Carrier[]>('/v1/carriers')).data; }
        catch (e) { handleError(e, 'transportistas'); return []; }
    }, [handleError]);

    const getUsers = useCallback(async () => {
        try { return (await api.get<User[]>('/v1/users')).data; }
        catch (e) { handleError(e, 'usuarios'); return []; }
    }, [handleError]);

    const getCompanies = useCallback(async () => {
        try { return (await api.get<Company[]>('/v1/companies')).data; }
        catch (e) { handleError(e, 'empresas'); return []; }
    }, [handleError]);

    const getSellers = useCallback(async () => {
        try { return (await api.get<IceCreamSeller[]>('/v1/sellers')).data; }
        catch (e) { handleError(e, 'heladeros'); return []; }
    }, [handleError]);

    const getDailyLoads = useCallback(async () => {
        try { return (await api.get<DailyLoad[]>('/v1/daily-loads')).data; }
        catch (e) { handleError(e, 'cargas diarias'); return []; }
    }, [handleError]);

    const getAssets = useCallback(async (scope?: string) => {
        try {
            const url = scope ? `/v1/assets?scope=${scope}` : '/v1/assets';
            return (await api.get<Asset[]>(url)).data;
        }
        catch (e) { handleError(e, 'activos'); return []; }
    }, [handleError]);

    // --- ACTIONS (Escritura) ---

    // Productos
    const createProduct = async (data: Product) => {
        try { return (await api.post('/v1/products', data)).data; }
        catch (e) { handleError(e, 'crear producto'); throw e; }
    };
    const updateProduct = async (id: string, data: Product) => {
        try { return (await api.put(`/v1/products/${id}`, data)).data; }
        catch (e) { handleError(e, 'actualizar producto'); throw e; }
    };
    const deleteProduct = async (id: string) => {
        try { await api.delete(`/v1/products/${id}`); return true; }
        catch (e) { handleError(e, 'eliminar producto'); return false; }
    };

    // Pedidos
    const createOrder = async (data: Order) => {
        try {
            const res = await api.post('/v1/orders', data);
            toast({ title: "Pedido Enviado", description: `Orden ${res.data?.orderNumber || 'creada'} con éxito.` });
            return res.data;
        } catch (e) { handleError(e, 'crear pedido'); throw e; }
    };
    const updateOrderStatus = async (id: string, status: string) => {
        try {
            const res = await api.put(`/v1/orders/${id}/status`, status, {
                headers: { 'Content-Type': 'text/plain' }
            });
            toast({ title: "Estado Actualizado", description: `El pedido ahora está ${status}` });
            return res.data;
        } catch (e) { handleError(e, 'actualizar estado'); throw e; }
    };
    const assignCarrierToOrder = async (orderId: string, carrierId: string) => {
        try {
            const res = await api.put(`/v1/orders/${orderId}/carrier`, carrierId, {
                headers: { 'Content-Type': 'text/plain' }
            });
            toast({ title: "Transportista Asignado", description: "Se ha vinculado el transporte correctamente." });
            return res.data;
        } catch (e) { handleError(e, 'asignar transportista'); throw e; }
    };

    // Activos
    const createAsset = async (data: Asset) => { try { const res = await api.post('/v1/assets', data); toast({ title: "Éxito", description: "Activo registrado" }); return res.data; } catch (e) { handleError(e, 'crear activo'); throw e; } };
    const updateAsset = async (id: string, data: Asset) => { try { const res = await api.put(`/v1/assets/${id}`, data); toast({ title: "Éxito", description: "Activo actualizado" }); return res.data; } catch (e) { handleError(e, 'actualizar activo'); throw e; } };
    const deleteAsset = async (id: string) => { try { await api.delete(`/v1/assets/${id}`); toast({ title: "Éxito", description: "Eliminado" }); return true; } catch (e) { handleError(e, 'eliminar activo'); return false; } };

    // Otros CRUDs
    const createWarehouse = async (data: Warehouse) => { try { await api.post('/v1/warehouses', data); toast({ title: "Éxito", description: "Creado" }); } catch (e) { handleError(e, 'crear almacén'); } };
    const updateWarehouse = async (id: string, data: Warehouse) => { try { await api.put(`/v1/warehouses/${id}`, data); toast({ title: "Éxito", description: "Actualizado" }); } catch (e) { handleError(e, 'actualizar almacén'); } };
    const deleteWarehouse = async (id: string) => { try { await api.delete(`/v1/warehouses/${id}`); return true; } catch (e) { handleError(e, 'eliminar almacén'); return false; } };

    const createCarrier = async (data: Carrier) => { try { await api.post('/v1/carriers', data); toast({ title: "Éxito", description: "Creado" }); } catch (e) { handleError(e, 'crear transportista'); } };
    const updateCarrier = async (id: string, data: Carrier) => { try { await api.put(`/v1/carriers/${id}`, data); toast({ title: "Éxito", description: "Actualizado" }); } catch (e) { handleError(e, 'actualizar transportista'); } };
    const deleteCarrier = async (id: string) => { try { await api.delete(`/v1/carriers/${id}`); return true; } catch (e) { handleError(e, 'eliminar transportista'); return false; } };

    const createUser = async (data: User) => { try { await api.post('/v1/users', data); toast({ title: "Éxito", description: "Creado" }); } catch (e) { handleError(e, 'crear usuario'); } };
    const updateUser = async (id: string, data: User) => { try { await api.put(`/v1/users/${id}`, data); toast({ title: "Éxito", description: "Actualizado" }); } catch (e) { handleError(e, 'actualizar usuario'); } };
    const deleteUser = async (id: string) => { try { await api.delete(`/v1/users/${id}`); return true; } catch (e) { handleError(e, 'eliminar usuario'); return false; } };

    const createCompany = async (data: Company) => { try { await api.post('/v1/companies', data); toast({ title: "Éxito", description: "Creada" }); } catch (e) { handleError(e, 'crear empresa'); } };
    const updateCompany = async (id: string, data: Company) => { try { await api.put(`/v1/companies/${id}`, data); toast({ title: "Éxito", description: "Actualizada" }); } catch (e) { handleError(e, 'actualizar empresa'); } };
    const deleteCompany = async (id: string) => { try { await api.delete(`/v1/companies/${id}`); return true; } catch (e) { handleError(e, 'eliminar empresa'); return false; } };

    const createSeller = async (data: IceCreamSeller) => { try { const res = await api.post('/v1/sellers', data); toast({ title: "Éxito", description: "Heladero registrado" }); return res.data; } catch (e) { handleError(e, 'crear heladero'); throw e; } };
    const updateSeller = async (id: string, data: IceCreamSeller) => { try { const res = await api.put(`/v1/sellers/${id}`, data); toast({ title: "Éxito", description: "Heladero actualizado" }); return res.data; } catch (e) { handleError(e, 'actualizar heladero'); throw e; } };
    const deleteSeller = async (id: string) => { try { await api.delete(`/v1/sellers/${id}`); return true; } catch (e) { handleError(e, 'eliminar heladero'); return false; } };

    // --- FUNCIÓN DE DEUDA/PAGOS (REAL) ---
    const updateUserDebt = async (sellerId: string, amount: number, note?: string) => {
        try {
            // Llamada al endpoint real del backend
            await api.post(`/v1/sellers/${sellerId}/payment`, { amount, note });
            toast({ title: "Pago Registrado", description: `Se procesaron S/ ${amount}` });
            return true;
        } catch (e) {
            handleError(e, 'registrar pago');
            return false;
        }
    };

    const createDailyLoad = async (data: DailyLoad) => { try { const res = await api.post('/v1/daily-loads', data); toast({ title: "Despacho Registrado", description: "Carga creada exitosamente." }); return res.data; } catch (e) { handleError(e, 'crear despacho'); throw e; } };
    const closeDailyLoad = async (id: string, data: DailyLoad) => { try { const res = await api.put(`/v1/daily-loads/${id}/close`, data); toast({ title: "Cierre Exitoso", description: "Liquidación procesada." }); return res.data; } catch (e) { handleError(e, 'cerrar liquidación'); throw e; } };

    return {
        getProducts, getWarehouses, getOrders, getCarriers, getUsers, getCompanies,
        getSellers, getDailyLoads, getAssets,
        createProduct, updateProduct, deleteProduct,
        createWarehouse, updateWarehouse, deleteWarehouse,
        createCarrier, updateCarrier, deleteCarrier,
        createUser, updateUser, deleteUser,
        createCompany, updateCompany, deleteCompany,
        createOrder, updateOrderStatus, assignCarrierToOrder,
        createSeller, updateSeller, deleteSeller,
        createDailyLoad, closeDailyLoad,
        createAsset, updateAsset, deleteAsset,
        updateUserDebt
    };
};