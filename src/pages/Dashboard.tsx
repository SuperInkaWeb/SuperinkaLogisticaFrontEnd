import React, { useEffect, useState } from 'react';
import DashboardLayout from "@/frontend/components/layout/DashboardLayout";
import KPICard from "@/frontend/components/ui/KPICard";
import { Package, Truck, AlertTriangle, DollarSign, Clock, Building2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiData, Order } from "@/hooks/useApiData";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/context/CurrencyContext";
import { useAuth } from "@/frontend/context/AuthContext";

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const { getProducts, getOrders, getWarehouses, getCompanies, getUsers } = useApiData();
    const { formatMoney } = useCurrency();

    // Normalizar rol
    const role = user?.role?.toLowerCase().replace('role_', '') || 'operador';
    const isSuperAdmin = role === 'super_admin';

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalStock: 0,
        lowStock: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        // Métricas SaaS
        totalCompanies: 0,
        totalUsers: 0
    });

    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [warehousesCount, setWarehousesCount] = useState(0);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                if (isSuperAdmin) {
                    // Lógica para Super Admin: Cargar Empresas y Usuarios
                    const [companiesData, usersData, ordersData] = await Promise.all([
                        getCompanies(),
                        getUsers(),
                        getOrders()
                    ]);

                    setStats({
                        totalStock: 0,
                        lowStock: 0,
                        pendingOrders: 0,
                        totalRevenue: 0, // Podrías sumar revenue de todas las empresas si quisieras
                        totalCompanies: Array.isArray(companiesData) ? companiesData.length : 0,
                        totalUsers: Array.isArray(usersData) ? usersData.length : 0
                    });

                    // Mostrar órdenes globales recientes si se desea
                    setRecentOrders(Array.isArray(ordersData) ? ordersData.slice(0, 5) : []);

                } else {
                    // Lógica para Admin/Supervisor de Empresa
                    const [productsData, ordersData, warehousesData] = await Promise.all([
                        getProducts(),
                        getOrders(),
                        getWarehouses()
                    ]);

                    const safeProducts = Array.isArray(productsData) ? productsData : [];
                    const safeOrders = Array.isArray(ordersData) ? ordersData : [];
                    const safeWarehouses = Array.isArray(warehousesData) ? warehousesData : [];

                    setRecentOrders(safeOrders.slice(0, 5));
                    setWarehousesCount(safeWarehouses.length);

                    const totalStock = safeProducts.reduce((acc, p) => acc + p.stock, 0);
                    const lowStock = safeProducts.filter(p => p.status === 'bajo' || p.status === 'agotado').length;
                    const pendingOrders = safeOrders.filter(o => o.status === 'pendiente' || o.status === 'en_transito').length;
                    const totalRevenue = safeOrders.reduce((acc, o) => acc + o.total, 0);

                    setStats({
                        totalStock,
                        lowStock,
                        pendingOrders,
                        totalRevenue,
                        totalCompanies: 0,
                        totalUsers: 0
                    });
                }
            } catch (error) {
                console.error("Error cargando dashboard", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [getProducts, getOrders, getWarehouses, getCompanies, getUsers, isSuperAdmin]);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Dashboard</h1>
                    <p className="text-muted-foreground">
                        {isSuperAdmin ? 'Visión Global del Sistema SaaS' : 'Resumen general de operaciones logísticas.'}
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {isSuperAdmin ? (
                        // KPIS PARA SUPER ADMIN
                        <>
                            <KPICard
                                title="Empresas Registradas"
                                value={stats.totalCompanies.toString()}
                                icon={Building2}
                                trend="Activas"
                                trendUp={true}
                                description="Tenants en la plataforma"
                            />
                            <KPICard
                                title="Usuarios Totales"
                                value={stats.totalUsers.toString()}
                                icon={Users}
                                trend="+1"
                                trendUp={true}
                                description="Usuarios en todas las empresas"
                            />
                            {/* Puedes agregar más métricas globales aquí */}
                        </>
                    ) : (
                        // KPIS PARA ADMIN DE EMPRESA
                        <>
                            <KPICard
                                title="Stock Total"
                                value={stats.totalStock.toString()}
                                icon={Package}
                                trend="+12%"
                                trendUp={true}
                                description="Productos en almacenes"
                            />
                            <KPICard
                                title="Pedidos Activos"
                                value={stats.pendingOrders.toString()}
                                icon={Truck}
                                trend="+5%"
                                trendUp={true}
                                description="En tránsito o pendientes"
                            />
                            <KPICard
                                title="Alertas de Stock"
                                value={stats.lowStock.toString()}
                                icon={AlertTriangle}
                                trend="-2%"
                                trendUp={false}
                                description="Productos con stock bajo"
                            />
                            <KPICard
                                title="Ingresos Totales"
                                value={formatMoney(stats.totalRevenue)}
                                icon={DollarSign}
                                trend="+8.5%"
                                trendUp={true}
                                description="Total facturado"
                            />
                        </>
                    )}
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4 shadow-sm border-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Actividad Reciente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                {recentOrders.map((order) => (
                                    <div key={order.id} className="flex items-center">
                                        <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                                        </div>
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                Nuevo pedido #{order.orderNumber}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {order.origin} ➔ {order.destination}
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium">
                                            {formatMoney(order.total)}
                                        </div>
                                    </div>
                                ))}
                                {recentOrders.length === 0 && (
                                    <p className="text-center text-muted-foreground py-4">No hay actividad reciente</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {!isSuperAdmin && (
                        <Card className="col-span-3 shadow-sm border-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Estado de Almacenes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Almacenes Operativos</span>
                                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{warehousesCount}</span>
                                    </div>
                                    {/* Gráfico Placeholder */}
                                    <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-200 dark:border-gray-700">
                                        <span className="text-sm">Gráfico de Ocupación</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Dashboard;