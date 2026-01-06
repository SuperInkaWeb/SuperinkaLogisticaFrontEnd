import React, { useEffect, useState } from 'react';
import DashboardLayout from "@/frontend/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApiData, Order, Carrier } from "@/hooks/useApiData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/frontend/context/AuthContext";
import { Eye, Truck, CheckCircle, Store, ArrowRight, XCircle, Search, Calendar, History, X } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const Orders: React.FC = () => {
    const { getOrders, updateOrderStatus, assignCarrierToOrder, getCarriers } = useApiData();
    const { user } = useAuth();
    const { formatMoney } = useCurrency();
    const { toast } = useToast();

    const [orders, setOrders] = useState<Order[]>([]);
    const [carriers, setCarriers] = useState<Carrier[]>([]);
    const [selectedCarrier, setSelectedCarrier] = useState("");

    // --- ESTADOS DE FILTROS ---
    const today = new Date().toISOString().split('T')[0];

    // Filtros Admin/Staff
    const [adminDateFilter, setAdminDateFilter] = useState<string>(today);
    const [showHistory, setShowHistory] = useState(false);

    // Filtros Cliente
    const [clientDateFilter, setClientDateFilter] = useState<string>(""); // Vacío = Ver todo el historial

    // Filtros Comunes
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("todos");

    // Modal Detalles
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [manualStatus, setManualStatus] = useState("");

    const role = user?.role?.toLowerCase().replace('role_', '') || 'operador';
    const isAdminOrStaff = ['admin', 'supervisor', 'operador'].includes(role);

    const loadData = async () => {
        try {
            const [ordersData, carriersData] = await Promise.all([
                getOrders(),
                getCarriers()
            ]);
            // Ordenar por fecha descendente (más reciente primero)
            setOrders(ordersData.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
            setCarriers(carriersData);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { loadData(); }, []);

    // --- LÓGICA DE FILTRADO ---
    const filteredOrders = orders.filter(order => {
        // 1. Filtro de Fecha (Diferenciado por Rol)
        let matchesDate = true;

        if (isAdminOrStaff) {
            // Admin: Por defecto HOY, a menos que active "Histórico"
            matchesDate = showHistory || (order.date === adminDateFilter);
        } else {
            // Cliente: Por defecto TODO (Histórico), a menos que elija una fecha específica
            matchesDate = clientDateFilter === "" || (order.date === clientDateFilter);
        }

        // 2. Filtro de Estado
        const matchesStatus = statusFilter === "todos" || order.status === statusFilter;

        // 3. Buscador (Nro Orden o Cliente)
        const searchLower = searchTerm.toLowerCase();
        const orderNum = order.orderNumber?.toLowerCase() || "";
        const clientName = order.user?.name?.toLowerCase() || "";

        const matchesSearch = orderNum.includes(searchLower) || clientName.includes(searchLower);

        return matchesDate && matchesStatus && matchesSearch;
    });

    // Métricas rápidas de la vista actual
    const totalFiltered = filteredOrders.length;
    const totalPending = filteredOrders.filter(o => o.status === 'pendiente').length;
    const totalAmount = filteredOrders.reduce((sum, o) => sum + o.total, 0);

    const handleStatusChange = async (id: string, newStatus: string) => {
        await updateOrderStatus(id, newStatus);
        toast({ title: "Estado Actualizado", description: `Pedido marcado como ${newStatus.replace('_', ' ')}` });
        loadData();
        if (selectedOrder?.id === id) {
            setIsDetailsOpen(false);
        }
    };

    const handleAssignCarrier = async (orderId: string) => {
        if (!selectedCarrier) {
            toast({ variant: "destructive", title: "Error", description: "Selecciona un transportista" });
            return;
        }
        await assignCarrierToOrder(orderId, selectedCarrier);
        setSelectedCarrier("");
        loadData();
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'pendiente': 'bg-yellow-500 hover:bg-yellow-600',
            'en_proceso': 'bg-blue-500 hover:bg-blue-600',
            'en_ruta': 'bg-purple-500 hover:bg-purple-600',
            'entregado': 'bg-green-500 hover:bg-green-600',
            'cancelado': 'bg-red-500 hover:bg-red-600',
            'entregado_parcial': 'bg-teal-500 hover:bg-teal-600'
        };
        return <Badge className={`${styles[status] || 'bg-gray-500'} capitalize border-0 shadow-sm`}>{status.replace('_', ' ')}</Badge>;
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                            {isAdminOrStaff ? "Gestión de Pedidos" : "Mis Pedidos"}
                        </h1>
                        <p className="text-muted-foreground">
                            {isAdminOrStaff ? "Administra el flujo de despacho y entrega." : "Historial completo de tus compras."}
                        </p>
                    </div>

                    {/* Tarjetas Resumen Rápidas (SOLO GESTIÓN) */}
                    {isAdminOrStaff && (
                        <div className="hidden md:flex gap-4">
                            <Card className="p-3 flex flex-col justify-center min-w-[120px] bg-slate-50 dark:bg-slate-900 border-none shadow-sm">
                                <span className="text-xs text-muted-foreground font-medium uppercase">Total</span>
                                <span className="text-xl font-bold">{totalFiltered}</span>
                            </Card>
                            <Card className="p-3 flex flex-col justify-center min-w-[120px] bg-yellow-50 dark:bg-yellow-900/20 border-none shadow-sm">
                                <span className="text-xs text-yellow-700 dark:text-yellow-500 font-medium uppercase">Pendientes</span>
                                <span className="text-xl font-bold text-yellow-800 dark:text-yellow-400">{totalPending}</span>
                            </Card>
                            <Card className="p-3 flex flex-col justify-center min-w-[120px] bg-green-50 dark:bg-green-900/20 border-none shadow-sm">
                                <span className="text-xs text-green-700 dark:text-green-500 font-medium uppercase">Monto</span>
                                <span className="text-xl font-bold text-green-800 dark:text-green-400">{formatMoney(totalAmount)}</span>
                            </Card>
                        </div>
                    )}
                </div>

                {/* BARRA DE FILTROS */}
                <Card className={`border-l-4 ${isAdminOrStaff ? 'border-l-primary' : 'border-l-blue-400'}`}>
                    <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end md:items-center">

                        {/* 1. Buscador (VISIBLE PARA TODOS) */}
                        <div className="w-full md:w-auto flex-1 space-y-1">
                            <Label htmlFor="search" className="text-xs font-semibold">Buscar</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="search"
                                    placeholder={isAdminOrStaff ? "Nro Orden o Cliente..." : "Buscar en mi historial..."}
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* 2. Filtro de Estado (VISIBLE PARA TODOS PERO SIMPLIFICADO VISUALMENTE) */}
                        <div className="w-full md:w-[180px] space-y-1">
                            <Label className="text-xs font-semibold">Estado</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos</SelectItem>
                                    <SelectItem value="pendiente">Pendientes</SelectItem>
                                    <SelectItem value="en_proceso">En Proceso</SelectItem>
                                    <SelectItem value="en_ruta">En Ruta</SelectItem>
                                    <SelectItem value="entregado">Entregados</SelectItem>
                                    <SelectItem value="cancelado">Cancelados</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 3. Filtro de Fecha (DIFERENCIADO) */}
                        <div className="w-full md:w-auto flex items-center gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="date" className={`text-xs font-semibold ${isAdminOrStaff && showHistory ? 'text-muted-foreground' : ''}`}>
                                    {isAdminOrStaff ? "Fecha Operativa" : "Filtrar por Fecha"}
                                </Label>
                                <div className="relative flex items-center gap-2">
                                    <div className="relative">
                                        <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="date"
                                            type="date"
                                            className="pl-9 w-[160px]"
                                            // Lógica condicional de valor y cambio según rol
                                            value={isAdminOrStaff ? adminDateFilter : clientDateFilter}
                                            onChange={(e) => {
                                                if (isAdminOrStaff) {
                                                    setAdminDateFilter(e.target.value);
                                                    setShowHistory(false); // Al cambiar fecha, salimos del modo histórico
                                                } else {
                                                    setClientDateFilter(e.target.value);
                                                }
                                            }}
                                            disabled={isAdminOrStaff && showHistory}
                                        />
                                    </div>
                                    {/* Botón para limpiar filtro de fecha (Solo Cliente) */}
                                    {!isAdminOrStaff && clientDateFilter && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9"
                                            onClick={() => setClientDateFilter("")}
                                            title="Ver todo el historial"
                                        >
                                            <X className="h-4 w-4 text-muted-foreground hover:text-red-500"/>
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Switch de Histórico (SOLO ADMIN) */}
                            {isAdminOrStaff && (
                                <div className="flex flex-col space-y-2 mt-5">
                                    <div className="flex items-center space-x-2">
                                        <Switch id="history-mode" checked={showHistory} onCheckedChange={setShowHistory} />
                                        <Label htmlFor="history-mode" className="text-sm font-medium cursor-pointer flex items-center gap-1">
                                            <History className="h-3 w-3" /> Histórico
                                        </Label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* TABLA DE PEDIDOS */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">
                            {/* Título dinámico */}
                            {isAdminOrStaff
                                ? (showHistory ? 'Historial Completo' : `Pedidos del ${adminDateFilter}`)
                                : (clientDateFilter ? `Pedidos del ${clientDateFilter}` : 'Mi Historial de Pedidos')
                            }
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Orden #</TableHead>
                                    <TableHead>Hora/Fecha</TableHead>
                                    {isAdminOrStaff && <TableHead>Cliente</TableHead>}
                                    <TableHead>Tipo Entrega</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={isAdminOrStaff ? 7 : 6} className="text-center h-24 text-muted-foreground">
                                            No se encontraron pedidos {clientDateFilter ? 'en esta fecha' : ''}.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono">{order.orderNumber}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{order.time?.substring(0, 5)}</span>
                                                    <span className="text-[10px] text-muted-foreground">{order.date}</span>
                                                </div>
                                            </TableCell>
                                            {isAdminOrStaff && <TableCell className="font-medium">{order.user?.name || 'Usuario'}</TableCell>}
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {order.deliveryType === 'warehouse' ? (
                                                        <>
                                                            <Store className="h-4 w-4 text-orange-500" />
                                                            <span className="text-xs">Recojo (Despacho)</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Truck className="h-4 w-4 text-blue-500" />
                                                            <span className="text-xs">Domicilio Cliente</span>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-bold">{formatMoney(order.total)}</TableCell>
                                            <TableCell>{getStatusBadge(order.status || 'pendiente')}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2 items-center">

                                                    {/* ASIGNAR TRANSPORTE (Solo Staff) */}
                                                    {isAdminOrStaff && order.deliveryType === 'delivery' && !['entregado', 'cancelado'].includes(order.status || '') && (
                                                        <div className="flex gap-1 items-center mr-2">
                                                            {!order.carrier ? (
                                                                <>
                                                                    <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
                                                                        <SelectTrigger className="w-[110px] h-8 text-xs">
                                                                            <SelectValue placeholder="Transporte" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {carriers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-600 hover:text-green-700" onClick={() => handleAssignCarrier(order.id!)}>
                                                                        <CheckCircle className="h-4 w-4"/>
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <Badge variant="outline" className="text-[10px] border-blue-200 bg-blue-50 text-blue-700 h-6 flex gap-1">
                                                                    <Truck className="h-3 w-3"/> {order.carrier.name}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* BOTONES DE FLUJO (Solo Staff) */}
                                                    {isAdminOrStaff && (
                                                        <>
                                                            {order.status === 'pendiente' && (
                                                                <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleStatusChange(order.id!, 'en_proceso')}>
                                                                    Procesar <ArrowRight className="ml-1 h-3 w-3" />
                                                                </Button>
                                                            )}
                                                            {order.status === 'en_proceso' && order.deliveryType === 'delivery' && (
                                                                <Button size="sm" className="h-8 bg-purple-600 hover:bg-purple-700 text-white" onClick={() => handleStatusChange(order.id!, 'en_ruta')}>
                                                                    En Ruta <Truck className="ml-1 h-3 w-3" />
                                                                </Button>
                                                            )}
                                                            {order.status === 'en_ruta' && (
                                                                <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusChange(order.id!, 'entregado')}>
                                                                    Entregar <CheckCircle className="ml-1 h-3 w-3" />
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}

                                                    <Button variant="ghost" size="sm" onClick={() => { setSelectedOrder(order); setManualStatus(order.status || ''); setIsDetailsOpen(true); }}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* DIALOGO DE DETALLES */}
                <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle className="flex justify-between items-center pr-8">
                                <span>Orden {selectedOrder?.orderNumber}</span>
                                {selectedOrder && getStatusBadge(selectedOrder.status || 'pendiente')}
                            </DialogTitle>
                        </DialogHeader>

                        {selectedOrder && (
                            <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground font-semibold">Cliente:</span>
                                        <p className="font-medium">{selectedOrder.user?.name}</p>
                                        <p className="text-xs text-muted-foreground">{selectedOrder.user?.email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground font-semibold">Entrega:</span>
                                        <div className="flex items-center gap-2">
                                            {selectedOrder.deliveryType === 'warehouse' ? <Store className="h-4 w-4"/> : <Truck className="h-4 w-4"/>}
                                            <p className="capitalize">{selectedOrder.deliveryType === 'warehouse' ? 'Recojo en Almacén' : 'Envío a Domicilio'}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{selectedOrder.destination}</p>
                                    </div>
                                </div>

                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50 dark:bg-slate-900">
                                                <TableHead>Producto</TableHead>
                                                <TableHead className="text-right">Precio</TableHead>
                                                <TableHead className="text-right">Cant.</TableHead>
                                                <TableHead className="text-right">Subtotal</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedOrder.items?.map((item, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>{item.productName}</TableCell>
                                                    <TableCell className="text-right">{formatMoney(item.price)}</TableCell>
                                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatMoney(item.price * item.quantity)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="flex justify-end gap-8 pt-2 items-center">
                                    <div className="text-sm">
                                        <span className="text-muted-foreground mr-2">Items:</span>
                                        <span className="font-bold">{selectedOrder.productsCount}</span>
                                    </div>
                                    <div className="text-xl">
                                        <span className="text-muted-foreground mr-2 font-light">Total:</span>
                                        <span className="font-bold text-primary">{formatMoney(selectedOrder.total)}</span>
                                    </div>
                                </div>

                                {isAdminOrStaff && (
                                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                                        <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">Gestión Manual</Label>
                                        <div className="flex gap-3 items-end">
                                            <div className="space-y-1 flex-1">
                                                <span className="text-sm text-slate-600 dark:text-slate-400">Forzar cambio de estado:</span>
                                                <Select value={manualStatus} onValueChange={setManualStatus}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pendiente">Pendiente</SelectItem>
                                                        <SelectItem value="en_proceso">En Proceso</SelectItem>
                                                        <SelectItem value="en_ruta">En Ruta</SelectItem>
                                                        <SelectItem value="entregado">Entregado</SelectItem>
                                                        <SelectItem value="cancelado">Cancelado</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button onClick={() => handleStatusChange(selectedOrder.id!, manualStatus)}>
                                                Actualizar
                                            </Button>
                                            {selectedOrder.status !== 'cancelado' && (
                                                <Button variant="destructive" onClick={() => handleStatusChange(selectedOrder.id!, 'cancelado')}>
                                                    <XCircle className="mr-2 h-4 w-4"/> Cancelar Orden
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default Orders;