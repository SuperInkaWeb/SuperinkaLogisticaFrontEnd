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
import { BarChart3, TrendingUp, Warehouse as WarehouseIcon, FileSpreadsheet, Download, Filter, Columns } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as XLSX from 'xlsx';

type FilterType = 'month' | 'year' | 'historical';

// Interfaz auxiliar para la vista plana de ventas
interface SaleDetailRow {
    date: string;
    orderNumber: string;
    clientName: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    deliveryType: string;
    address: string;
}

// Configuración de columnas disponibles
const SALES_COLUMNS = [
    { id: 'date', label: 'Fecha' },
    { id: 'orderNumber', label: 'Nro Orden' },
    { id: 'productName', label: 'Producto' },
    { id: 'unitPrice', label: 'Precio Unit.' },
    { id: 'quantity', label: 'Cant.' },
    { id: 'subtotal', label: 'Subtotal' },
    { id: 'clientName', label: 'Cliente' },
    { id: 'deliveryType', label: 'Tipo Entrega' },
    { id: 'address', label: 'Dirección / Zona' }
];

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

    const [selectedSellers, setSelectedSellers] = useState<string[]>([]);

    // Estado para columnas visibles (por defecto todas)
    const [visibleSalesColumns, setVisibleSalesColumns] = useState<string[]>(SALES_COLUMNS.map(c => c.id));

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

    // --- HELPER: EXPORTAR A EXCEL ---
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

    // --- LÓGICA DE DATOS DE VENTAS (DETALLADA) ---
    const getDetailedSales = (): SaleDetailRow[] => {
        // 1. Filtrar Cabeceras de Orden
        let filteredOrders = filterOrdersByDate(orders, salesFilterType, salesDateValue, salesYearValue);

        // Filtrar por cliente
        filteredOrders = filteredOrders.filter(o => {
            const userId = o.user?.id || (o as any).userId;
            const matchSeller = selectedSellers.length === 0 || (userId && selectedSellers.includes(userId));
            // Excluir cancelados para reporte de ventas efectivo
            return matchSeller && o.status !== 'cancelado';
        });

        // 2. Aplanar a nivel de Producto (Detalle)
        const detailedRows: SaleDetailRow[] = [];

        filteredOrders.forEach(order => {
            if (!order.items || order.items.length === 0) return;

            order.items.forEach(item => {
                detailedRows.push({
                    date: order.date || '',
                    orderNumber: order.orderNumber || '',
                    clientName: (order.user as any)?.name || 'Cliente Genérico',
                    productName: item.productName,
                    unitPrice: item.price,
                    quantity: item.quantity,
                    subtotal: item.price * item.quantity,
                    deliveryType: order.deliveryType === 'warehouse' ? 'Despacho (Almacén)' : 'Delivery',
                    address: order.deliveryType === 'warehouse' ? 'RECOJO EN ALMACÉN' : (order.destination || 'Dirección no especificada')
                });
            });
        });

        // Ordenar por fecha y luego por número de orden
        return detailedRows.sort((a, b) => {
            if (a.date !== b.date) return b.date.localeCompare(a.date);
            return b.orderNumber.localeCompare(a.orderNumber);
        });
    };

    const detailedSalesData = getDetailedSales();
    const totalSalesAmount = detailedSalesData.reduce((sum, row) => sum + row.subtotal, 0);

    const handleExportSales = () => {
        const periodLabel = salesFilterType === 'historical' ? 'Historico' : salesFilterType === 'year' ? salesYearValue : salesDateValue;

        // Exportar solo columnas visibles
        const dataToExport = detailedSalesData.map(row => {
            const exportRow: any = {};
            if (visibleSalesColumns.includes('date')) exportRow["Fecha"] = row.date;
            if (visibleSalesColumns.includes('orderNumber')) exportRow["Nro Orden"] = row.orderNumber;
            if (visibleSalesColumns.includes('clientName')) exportRow["Cliente"] = row.clientName;
            if (visibleSalesColumns.includes('productName')) exportRow["Producto"] = row.productName;
            if (visibleSalesColumns.includes('unitPrice')) exportRow["Precio Unit."] = row.unitPrice;
            if (visibleSalesColumns.includes('quantity')) exportRow["Cantidad"] = row.quantity;
            if (visibleSalesColumns.includes('subtotal')) exportRow["Subtotal"] = row.subtotal;
            if (visibleSalesColumns.includes('deliveryType')) exportRow["Tipo Entrega"] = row.deliveryType;
            if (visibleSalesColumns.includes('address')) exportRow["Dirección / Zona"] = row.address;
            return exportRow;
        });

        exportToExcel(dataToExport, `Detalle_Ventas_${periodLabel}`);
    };

    // --- DATOS ROTACIÓN DE STOCK ---
    const getProductRotation = () => {
        const rotationMap: Record<string, number> = {};
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
            const baseStock = p.stock + sold;
            const rotationRate = baseStock > 0 ? (sold / baseStock) * 100 : 0;
            return { ...p, sold, rotationRate };
        }).sort((a, b) => b.sold - a.sold);
    };

    const productStats = getProductRotation();

    const handleExportInventory = () => {
        const periodLabel = inventoryFilterType === 'historical' ? 'Historico' : inventoryFilterType === 'year' ? inventoryYearValue : inventoryDateValue;
        const dataToExport = productStats.map(p => ({
            "SKU": p.sku, "Producto": p.name, "Categoría": p.category,
            "Stock Actual": p.stock, "Unidades Vendidas": p.sold,
            "Rotación": `${p.rotationRate.toFixed(2)}%`, "Precio": p.price
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
            "Almacén": w.name, "Ciudad": w.city, "Capacidad": w.capacity, "Ocupación": w.currentOccupancy,
            "% Uso": `${w.occupancyRate.toFixed(2)}%`, "Valor": w.inventoryValue, "Items": w.productCount
        }));
        exportToExcel(dataToExport, `Almacenes_${new Date().toISOString().slice(0,10)}`);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Reportes y Análisis</h1>
                    <p className="text-muted-foreground">Visualización detallada de operaciones.</p>
                </div>

                <Tabs defaultValue="sales" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                        <TabsTrigger value="sales" className="flex gap-2"><BarChart3 className="w-4 h-4"/> Ventas Detalle</TabsTrigger>
                        <TabsTrigger value="inventory" className="flex gap-2"><TrendingUp className="w-4 h-4"/> Rotación</TabsTrigger>
                        <TabsTrigger value="warehouses" className="flex gap-2"><WarehouseIcon className="w-4 h-4"/> Almacenes</TabsTrigger>
                    </TabsList>

                    {/* --- TAB 1: DETALLE DE VENTAS --- */}
                    <TabsContent value="sales" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col xl:flex-row justify-between gap-4 items-start xl:items-center">
                                    <div>
                                        <CardTitle>Detalle de Ventas</CardTitle>
                                        <CardDescription>Desglose por producto vendido.</CardDescription>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto flex-wrap">
                                        {/* Selector Periodo */}
                                        <Select value={salesFilterType} onValueChange={(v: FilterType) => setSalesFilterType(v)}>
                                            <SelectTrigger className="w-full sm:w-[130px]"><SelectValue placeholder="Periodo" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="month">Mensual</SelectItem>
                                                <SelectItem value="year">Anual</SelectItem>
                                                <SelectItem value="historical">Histórico</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {salesFilterType === 'month' && (
                                            <Input type="month" className="w-full sm:w-auto" value={salesDateValue} onChange={(e) => setSalesDateValue(e.target.value)} />
                                        )}
                                        {salesFilterType === 'year' && (
                                            <Input type="number" className="w-full sm:w-[100px]" placeholder="YYYY" min="2000" max="2100" value={salesYearValue} onChange={(e) => setSalesYearValue(e.target.value)} />
                                        )}

                                        {/* Selector Clientes */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full sm:w-[180px] justify-between font-normal">
                                                    <span className="truncate">{selectedSellers.length === 0 ? "Todos los Clientes" : `${selectedSellers.length} Seleccionados`}</span>
                                                    <Filter className="w-4 h-4 ml-2 opacity-50 shrink-0" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-[200px]" align="end">
                                                <DropdownMenuLabel>Filtrar por Cliente</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuCheckboxItem checked={selectedSellers.length === 0} onCheckedChange={() => setSelectedSellers([])}>Todos</DropdownMenuCheckboxItem>
                                                <DropdownMenuSeparator />
                                                <div className="max-h-[200px] overflow-y-auto">
                                                    {sellers.map(s => (
                                                        <DropdownMenuCheckboxItem key={s.id} checked={selectedSellers.includes(s.id!)} onCheckedChange={(checked) => {
                                                            setSelectedSellers(prev => checked ? [...prev, s.id!] : prev.filter(id => id !== s.id));
                                                        }}>
                                                            {s.name}
                                                        </DropdownMenuCheckboxItem>
                                                    ))}
                                                </div>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        {/* Selector Columnas */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="icon" title="Seleccionar Columnas">
                                                    <Columns className="w-4 h-4 text-slate-600" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-[200px]" align="end">
                                                <DropdownMenuLabel>Columnas Visibles</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                {SALES_COLUMNS.map(col => (
                                                    <DropdownMenuCheckboxItem
                                                        key={col.id}
                                                        checked={visibleSalesColumns.includes(col.id)}
                                                        onCheckedChange={(checked) => {
                                                            setVisibleSalesColumns(prev =>
                                                                checked ? [...prev, col.id] : prev.filter(id => id !== col.id)
                                                            );
                                                        }}
                                                    >
                                                        {col.label}
                                                    </DropdownMenuCheckboxItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        <Button variant="outline" onClick={handleExportSales} title="Exportar a Excel" className="w-full sm:w-auto">
                                            <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600"/> Exportar
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-4 mb-4 items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border">
                                    <span className="text-sm font-medium text-muted-foreground">Total Ventas en Periodo:</span>
                                    <span className="text-2xl font-bold text-primary">{formatMoney(totalSalesAmount)}</span>
                                </div>

                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                {visibleSalesColumns.includes('date') && <TableHead>Fecha</TableHead>}
                                                {visibleSalesColumns.includes('orderNumber') && <TableHead>Nro Orden</TableHead>}
                                                {visibleSalesColumns.includes('productName') && <TableHead>Producto</TableHead>}
                                                {visibleSalesColumns.includes('unitPrice') && <TableHead className="text-right">Precio Unit.</TableHead>}
                                                {visibleSalesColumns.includes('quantity') && <TableHead className="text-right">Cant.</TableHead>}
                                                {visibleSalesColumns.includes('subtotal') && <TableHead className="text-right">Subtotal</TableHead>}
                                                {visibleSalesColumns.includes('clientName') && <TableHead>Cliente</TableHead>}
                                                {visibleSalesColumns.includes('deliveryType') && <TableHead>Tipo Entrega</TableHead>}
                                                {visibleSalesColumns.includes('address') && <TableHead>Dirección / Zona</TableHead>}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {detailedSalesData.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={visibleSalesColumns.length} className="text-center h-24 text-muted-foreground">
                                                        No hay registros para el periodo seleccionado.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                detailedSalesData.map((row, idx) => (
                                                    <TableRow key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                                        {visibleSalesColumns.includes('date') && <TableCell className="text-xs whitespace-nowrap">{row.date}</TableCell>}
                                                        {visibleSalesColumns.includes('orderNumber') && <TableCell className="font-mono text-xs font-bold">{row.orderNumber}</TableCell>}
                                                        {visibleSalesColumns.includes('productName') && <TableCell className="font-medium text-sm">{row.productName}</TableCell>}
                                                        {visibleSalesColumns.includes('unitPrice') && <TableCell className="text-right text-xs">{formatMoney(row.unitPrice)}</TableCell>}
                                                        {visibleSalesColumns.includes('quantity') && <TableCell className="text-right font-bold text-xs">{row.quantity}</TableCell>}
                                                        {visibleSalesColumns.includes('subtotal') && <TableCell className="text-right font-bold text-sm text-green-600">{formatMoney(row.subtotal)}</TableCell>}
                                                        {visibleSalesColumns.includes('clientName') && <TableCell className="text-xs truncate max-w-[150px]" title={row.clientName}>{row.clientName}</TableCell>}
                                                        {visibleSalesColumns.includes('deliveryType') && <TableCell className="text-xs"><span className="font-semibold">{row.deliveryType}</span></TableCell>}
                                                        {visibleSalesColumns.includes('address') && <TableCell className="text-xs text-muted-foreground"><span className="truncate max-w-[200px]" title={row.address}>{row.address}</span></TableCell>}
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* --- TAB 2: ROTACIÓN --- */}
                    <TabsContent value="inventory" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <CardTitle>Rotación de Inventario</CardTitle>
                                        <CardDescription>Productos más vendidos vs estancados.</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Select value={inventoryFilterType} onValueChange={(v: FilterType) => setInventoryFilterType(v)}>
                                            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Periodo" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="month">Mensual</SelectItem>
                                                <SelectItem value="year">Anual</SelectItem>
                                                <SelectItem value="historical">Histórico</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {inventoryFilterType === 'month' && <Input type="month" value={inventoryDateValue} onChange={(e) => setInventoryDateValue(e.target.value)} />}
                                        {inventoryFilterType === 'year' && <Input type="number" className="w-[100px]" value={inventoryYearValue} onChange={(e) => setInventoryYearValue(e.target.value)} />}
                                        <Button variant="outline" onClick={handleExportInventory}><Download className="w-4 h-4 mr-2"/> Excel</Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Producto</TableHead>
                                                <TableHead className="text-center">Stock</TableHead>
                                                <TableHead className="text-center">Vendidos</TableHead>
                                                <TableHead className="text-center">Rotación</TableHead>
                                                <TableHead className="text-center">Estado</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {productStats.map(p => (
                                                <TableRow key={p.id}>
                                                    <TableCell className="font-medium">{p.name}<div className="text-xs text-muted-foreground">{p.sku}</div></TableCell>
                                                    <TableCell className="text-center">{p.stock}</TableCell>
                                                    <TableCell className="text-center font-bold text-blue-600">{p.sold}</TableCell>
                                                    <TableCell className="text-center">{p.rotationRate.toFixed(1)}%</TableCell>
                                                    <TableCell className="text-center">
                                                        {p.rotationRate > 50 ? <Badge className="bg-green-500">Alta</Badge> : p.rotationRate < 10 && p.stock > 0 ? <Badge variant="destructive">Baja</Badge> : <Badge variant="secondary">Normal</Badge>}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* --- TAB 3: ALMACENES --- */}
                    <TabsContent value="warehouses" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div><CardTitle>Almacenes</CardTitle><CardDescription>Ocupación y valorización.</CardDescription></div>
                                    <Button variant="outline" onClick={handleExportWarehouses}><FileSpreadsheet className="w-4 h-4 mr-2 text-green-600"/> Excel</Button>
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
                                                <TableHead className="text-right">Valor</TableHead>
                                                <TableHead className="text-center">Items</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {warehouseStats.map(w => (
                                                <TableRow key={w.id}>
                                                    <TableCell className="font-medium flex items-center gap-2"><WarehouseIcon className="h-4 w-4 text-slate-400" />{w.name}</TableCell>
                                                    <TableCell>{w.city}</TableCell>
                                                    <TableCell className="text-center"><div className="text-xs">{w.currentOccupancy.toLocaleString()} / {w.capacity.toLocaleString()}</div></TableCell>
                                                    <TableCell className="text-center w-48">
                                                        <div className="flex flex-col gap-1 items-center">
                                                            <span className={`text-xs font-bold ${w.occupancyRate > 90 ? 'text-red-600' : 'text-slate-600'}`}>{w.occupancyRate.toFixed(1)}%</span>
                                                            <Progress value={w.occupancyRate} className={`h-2 w-24 ${w.occupancyRate > 90 ? 'bg-red-100' : ''}`} />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-primary">{formatMoney(w.inventoryValue)}</TableCell>
                                                    <TableCell className="text-center"><Badge variant="outline">{w.productCount}</Badge></TableCell>
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