import React, { useEffect, useState } from 'react';
import DashboardLayout from "@/frontend/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useApiData, Order, Product, Warehouse, IceCreamSeller } from "@/hooks/useApiData";
import { useCurrency } from "@/context/CurrencyContext";
import { BarChart3, TrendingUp, Warehouse as WarehouseIcon, FileSpreadsheet, Download, Calendar, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as XLSX from 'xlsx';

type FilterType = 'month' | 'year' | 'historical';

const Reports: React.FC = () => {
    const { getOrders, getProducts, getWarehouses, getSellers } = useApiData();
    const { formatMoney } = useCurrency();

    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [sellers, setSellers] = useState<IceCreamSeller[]>([]);

    // --- ESTADOS PARA FILTROS DE VENTAS ---
    const [salesFilterType, setSalesFilterType] = useState<FilterType>('month');
    const [salesDateValue, setSalesDateValue] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [salesYearValue, setSalesYearValue] = useState<string>(new Date().getFullYear().toString()); // YYYY

    // Estado para selección múltiple de clientes (Array de IDs)
    // Si está vacío [], significa "Todos"
    const [selectedSellers, setSelectedSellers] = useState<string[]>([]);

    // --- ESTADOS PARA FILTROS DE ROTACIÓN ---
    const [inventoryFilterType, setInventoryFilterType] = useState<FilterType>('month');
    const [inventoryDateValue, setInventoryDateValue] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [inventoryYearValue, setInventoryYearValue] = useState<string>(new Date().getFullYear().toString()); // YYYY

    useEffect(() => {
        const loadData = async () => {
            const [o, p, w, s] = await Promise.all([getOrders(), getProducts(), getWarehouses(), getSellers()]);
            setOrders(o);
            setProducts(p);
            setWarehouses(w);
            setSellers(s);
        };
        loadData();
    }, [getOrders, getProducts, getWarehouses, getSellers]);

    // --- LÓGICA DE EXPORTACIÓN EXCEL ---
    const exportToExcel = (data: any[], fileName: string) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    };

    // --- HELPER: FILTRAR ÓRDENES POR FECHA ---
    const filterOrdersByDate = (ordersList: Order[], type: FilterType, monthValue: string, yearValue: string) => {
        return ordersList.filter(o => {
            if (!o.date) return false;
            if (type === 'historical') return true;
            if (type === 'month') return o.date.substring(0, 7) === monthValue;
            if (type === 'year') return o.date.substring(0, 4) === yearValue;
            return true;
        });
    };

    // --- DATOS REPORTE DE VENTAS ---
    const getSalesData = () => {
        // Primero filtrar por fecha
        let filtered = filterOrdersByDate(orders, salesFilterType, salesDateValue, salesYearValue);

        // Luego filtrar por cliente/heladero (Múltiple Selección)
        return filtered.filter(o => {
            const userId = o.user?.id || (o as any).userId;
            // Si el array está vacío, mostrar todos. Si tiene IDs, verificar inclusión.
            const matchSeller = selectedSellers.length === 0 || (userId && selectedSellers.includes(userId));
            return matchSeller && o.status !== 'cancelado';
        });
    };

    const filteredSales = getSalesData();
    const totalSales = filteredSales.reduce((sum, o) => sum + o.total, 0);

    const handleExportSales = () => {
        const periodLabel = salesFilterType === 'historical' ? 'Historico' : salesFilterType === 'year' ? salesYearValue : salesDateValue;

        const dataToExport = filteredSales.map(o => ({
            "Fecha": o.date,
            "Orden": o.orderNumber,
            "Cliente/Heladero": (o.user as any)?.name || 'Cliente',
            "Estado": o.status,
            "Tipo Entrega": o.deliveryType,
            "Total": o.total
        }));
        exportToExcel(dataToExport, `Ventas_${periodLabel}`);
    };

    // --- DATOS ROTACIÓN DE STOCK ---
    const getProductRotation = () => {
        const rotationMap: Record<string, number> = {};

        // Filtrar órdenes según el periodo seleccionado en la pestaña de inventario
        const inventoryOrders = filterOrdersByDate(orders, inventoryFilterType, inventoryDateValue, inventoryYearValue);

        inventoryOrders.forEach(order => {
            if (order.status !== 'cancelado') {
                order.items?.forEach(item => {
                    if (item.productId) {
                        rotationMap[item.productId] = (rotationMap[item.productId] || 0) + item.quantity;
                    }
                });
            }
        });

        return products.map(p => {
            const sold = rotationMap[p.id!] || 0;
            // Si es histórico, comparamos con stock actual + vendido. Si es periodo corto, la rotación puede ser > 100%
            // Para simplificar, usamos stock actual + vendido como base teórica disponible en ese periodo
            const baseStock = p.stock + sold;
            const rotationRate = baseStock > 0 ? (sold / baseStock) * 100 : 0;

            return { ...p, sold, rotationRate };
        }).sort((a, b) => b.sold - a.sold);
    };

    const productStats = getProductRotation();

    const handleExportInventory = () => {
        const periodLabel = inventoryFilterType === 'historical' ? 'Historico' : inventoryFilterType === 'year' ? inventoryYearValue : inventoryDateValue;

        const dataToExport = productStats.map(p => ({
            "SKU": p.sku,
            "Producto": p.name,
            "Categoría": p.category,
            "Stock Actual": p.stock,
            "Unidades Vendidas": p.sold,
            "Tasa Rotación (%)": `${p.rotationRate.toFixed(2)}%`,
            "Precio Unit.": p.price
        }));
        exportToExcel(dataToExport, `Rotacion_Inventario_${periodLabel}`);
    };

    // --- DATOS RENDIMIENTO ALMACENES ---
    const getWarehouseStats = () => {
        return warehouses.map(w => {
            const productsInWarehouse = products.filter(p => p.warehouse?.id === w.id || (p as any).warehouseId === w.id);

            const currentOccupancy = productsInWarehouse.reduce((sum, p) => sum + (p.stock * (p.volumeFactor || 1)), 0);
            const occupancyRate = w.capacity > 0 ? (currentOccupancy / w.capacity) * 100 : 0;
            const inventoryValue = productsInWarehouse.reduce((sum, p) => sum + (p.stock * p.price), 0);

            return { ...w, currentOccupancy, occupancyRate, inventoryValue, productCount: productsInWarehouse.length };
        });
    };

    const warehouseStats = getWarehouseStats();

    const handleExportWarehouses = () => {
        const dataToExport = warehouseStats.map(w => ({
            "Almacén": w.name,
            "Ciudad": w.city,
            "Capacidad Total": w.capacity,
            "Ocupación Actual": w.currentOccupancy,
            "% Ocupación": `${w.occupancyRate.toFixed(2)}%`,
            "Valor Inventario": w.inventoryValue,
            "Cant. Productos": w.productCount
        }));
        exportToExcel(dataToExport, `Rendimiento_Almacenes_${new Date().toISOString().slice(0,10)}`);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Reportes y Análisis</h1>
                    <p className="text-muted-foreground">Visualización interactiva del rendimiento del negocio.</p>
                </div>

                <Tabs defaultValue="sales" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                        <TabsTrigger value="sales" className="flex gap-2"><BarChart3 className="w-4 h-4"/> Ventas</TabsTrigger>
                        <TabsTrigger value="inventory" className="flex gap-2"><TrendingUp className="w-4 h-4"/> Rotación</TabsTrigger>
                        <TabsTrigger value="warehouses" className="flex gap-2"><WarehouseIcon className="w-4 h-4"/> Almacenes</TabsTrigger>
                    </TabsList>

                    {/* --- TAB 1: VENTAS MENSUALES/ANUALES --- */}
                    <TabsContent value="sales" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col xl:flex-row justify-between gap-4 items-start xl:items-center">
                                    <div>
                                        <CardTitle>Reporte de Ventas</CardTitle>
                                        <CardDescription>Resumen de pedidos facturados por cliente y periodo.</CardDescription>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
                                        {/* Selector Tipo Periodo */}
                                        <Select value={salesFilterType} onValueChange={(v: FilterType) => setSalesFilterType(v)}>
                                            <SelectTrigger className="w-full sm:w-[130px]">
                                                <SelectValue placeholder="Periodo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="month">Mensual</SelectItem>
                                                <SelectItem value="year">Anual</SelectItem>
                                                <SelectItem value="historical">Histórico</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {/* Input Fecha Dinámico */}
                                        {salesFilterType === 'month' && (
                                            <Input
                                                type="month"
                                                className="w-full sm:w-auto"
                                                value={salesDateValue}
                                                onChange={(e) => setSalesDateValue(e.target.value)}
                                            />
                                        )}
                                        {salesFilterType === 'year' && (
                                            <Input
                                                type="number"
                                                className="w-full sm:w-[100px]"
                                                placeholder="YYYY"
                                                min="2000"
                                                max="2100"
                                                value={salesYearValue}
                                                onChange={(e) => setSalesYearValue(e.target.value)}
                                            />
                                        )}

                                        {/* Selector de Clientes Múltiple */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full sm:w-[180px] justify-between font-normal">
                                        <span className="truncate">
                                            {selectedSellers.length === 0 ? "Todos los Clientes" :
                                                selectedSellers.length === 1 ? sellers.find(s => s.id === selectedSellers[0])?.name :
                                                    `${selectedSellers.length} Seleccionados`}
                                        </span>
                                                    <Filter className="w-4 h-4 ml-2 opacity-50 shrink-0" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-[200px]" align="end">
                                                <DropdownMenuLabel>Filtrar por Cliente</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuCheckboxItem
                                                    checked={selectedSellers.length === 0}
                                                    onCheckedChange={() => setSelectedSellers([])}
                                                >
                                                    Todos
                                                </DropdownMenuCheckboxItem>
                                                <DropdownMenuSeparator />
                                                <div className="max-h-[200px] overflow-y-auto">
                                                    {sellers.map(s => (
                                                        <DropdownMenuCheckboxItem
                                                            key={s.id}
                                                            checked={selectedSellers.includes(s.id!)}
                                                            onCheckedChange={(checked) => {
                                                                setSelectedSellers(prev => {
                                                                    if (checked) return [...prev, s.id!];
                                                                    return prev.filter(id => id !== s.id);
                                                                });
                                                            }}
                                                        >
                                                            {s.name}
                                                        </DropdownMenuCheckboxItem>
                                                    ))}
                                                </div>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        <Button variant="outline" onClick={handleExportSales} title="Exportar a Excel" className="w-full sm:w-auto">
                                            <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600"/> Exportar
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-3 mb-6">
                                    <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
                                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-blue-600">Total Vendido</CardTitle></CardHeader>
                                        <CardContent><div className="text-2xl font-bold">{formatMoney(totalSales)}</div></CardContent>
                                    </Card>
                                    <Card className="bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800">
                                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-green-600">Pedidos Exitosos</CardTitle></CardHeader>
                                        <CardContent><div className="text-2xl font-bold">{filteredSales.filter(o => o.status === 'entregado').length}</div></CardContent>
                                    </Card>
                                    <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800">
                                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-orange-600">Ticket Promedio</CardTitle></CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {filteredSales.length > 0 ? formatMoney(totalSales / filteredSales.length) : formatMoney(0)}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Fecha</TableHead>
                                                <TableHead>Nro Orden</TableHead>
                                                <TableHead>Cliente / Heladero</TableHead>
                                                <TableHead>Estado</TableHead>
                                                <TableHead className="text-right">Monto</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredSales.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                        No se encontraron ventas para el periodo seleccionado.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredSales.map(order => (
                                                    <TableRow key={order.id}>
                                                        <TableCell>{order.date}</TableCell>
                                                        <TableCell className="font-mono text-xs">{order.orderNumber}</TableCell>
                                                        <TableCell className="font-medium">{(order.user as any)?.name || 'Cliente'}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="capitalize">{order.status?.replace('_', ' ')}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold">{formatMoney(order.total)}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* --- TAB 2: ROTACIÓN DE STOCK --- */}
                    <TabsContent value="inventory" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <CardTitle>Análisis de Rotación</CardTitle>
                                        <CardDescription>
                                            Identifica tus productos estrella (más vendidos) y los estancados por periodo.
                                        </CardDescription>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                        {/* Selector Tipo Periodo Rotación */}
                                        <Select value={inventoryFilterType} onValueChange={(v: FilterType) => setInventoryFilterType(v)}>
                                            <SelectTrigger className="w-full sm:w-[130px]">
                                                <SelectValue placeholder="Periodo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="month">Mensual</SelectItem>
                                                <SelectItem value="year">Anual</SelectItem>
                                                <SelectItem value="historical">Histórico</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {/* Input Fecha Dinámico */}
                                        {inventoryFilterType === 'month' && (
                                            <Input
                                                type="month"
                                                className="w-full sm:w-auto"
                                                value={inventoryDateValue}
                                                onChange={(e) => setInventoryDateValue(e.target.value)}
                                            />
                                        )}
                                        {inventoryFilterType === 'year' && (
                                            <Input
                                                type="number"
                                                className="w-full sm:w-[100px]"
                                                placeholder="YYYY"
                                                min="2000"
                                                max="2100"
                                                value={inventoryYearValue}
                                                onChange={(e) => setInventoryYearValue(e.target.value)}
                                            />
                                        )}

                                        <Button variant="outline" onClick={handleExportInventory} className="w-full sm:w-auto">
                                            <Download className="w-4 h-4 mr-2"/> Exportar Excel
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Producto</TableHead>
                                                <TableHead className="text-center">Stock Actual</TableHead>
                                                <TableHead className="text-center">Vendidos ({inventoryFilterType === 'historical' ? 'Histórico' : inventoryFilterType === 'year' ? inventoryYearValue : inventoryDateValue})</TableHead>
                                                <TableHead className="text-center">Rotación</TableHead>
                                                <TableHead className="text-center">Estado</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {productStats.map(p => (
                                                <TableRow key={p.id}>
                                                    <TableCell className="font-medium">
                                                        {p.name}
                                                        <div className="text-xs text-muted-foreground">{p.sku}</div>
                                                    </TableCell>
                                                    <TableCell className="text-center">{p.stock}</TableCell>
                                                    <TableCell className="text-center font-bold text-blue-600">{p.sold}</TableCell>
                                                    <TableCell className="text-center">
                                                        {p.rotationRate.toFixed(1)}%
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {p.rotationRate > 50 ? (
                                                            <Badge className="bg-green-500 hover:bg-green-600">Alta</Badge>
                                                        ) : p.rotationRate < 10 && p.stock > 0 ? (
                                                            <Badge variant="destructive">Baja</Badge>
                                                        ) : (
                                                            <Badge variant="secondary">Normal</Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* --- TAB 3: ALMACENES (TABLA) --- */}
                    <TabsContent value="warehouses" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Rendimiento de Almacenes</CardTitle>
                                        <CardDescription>Estado de ocupación y valorización de inventarios.</CardDescription>
                                    </div>
                                    <Button variant="outline" onClick={handleExportWarehouses}>
                                        <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600"/> Exportar Excel
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Almacén</TableHead>
                                                <TableHead>Ubicación</TableHead>
                                                <TableHead className="text-center">Ocupación</TableHead>
                                                <TableHead className="text-center">% Uso</TableHead>
                                                <TableHead className="text-right">Valor Inventario</TableHead>
                                                <TableHead className="text-center">Items</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {warehouseStats.map(w => (
                                                <TableRow key={w.id}>
                                                    <TableCell className="font-medium flex items-center gap-2">
                                                        <WarehouseIcon className="h-4 w-4 text-slate-400" />
                                                        {w.name}
                                                    </TableCell>
                                                    <TableCell>{w.city}</TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="text-xs">
                                                            {w.currentOccupancy.toLocaleString()} / {w.capacity.toLocaleString()} m³
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center w-48">
                                                        <div className="flex flex-col gap-1 items-center">
                                                 <span className={`text-xs font-bold ${w.occupancyRate > 90 ? 'text-red-600' : 'text-slate-600'}`}>
                                                     {w.occupancyRate.toFixed(1)}%
                                                 </span>
                                                            <Progress value={w.occupancyRate} className={`h-2 w-24 ${w.occupancyRate > 90 ? 'bg-red-100' : ''}`} />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-primary">
                                                        {formatMoney(w.inventoryValue)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline">{w.productCount}</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default Reports;