import React, { useEffect, useState } from 'react';
import DashboardLayout from "@/frontend/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApiData, DailyLoad, IceCreamSeller, Order } from "@/hooks/useApiData";
import { useCurrency } from "@/context/CurrencyContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Bike, DollarSign, AlertTriangle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Settlement: React.FC = () => {
    const { getDailyLoads, getSellers, getOrders, closeDailyLoad } = useApiData();
    const { formatMoney } = useCurrency();

    const [loads, setLoads] = useState<DailyLoad[]>([]);
    const [sellers, setSellers] = useState<IceCreamSeller[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);

    const [selectedLoadId, setSelectedLoadId] = useState("");
    const [currentLoad, setCurrentLoad] = useState<DailyLoad | null>(null);
    const [currentSeller, setCurrentSeller] = useState<IceCreamSeller | null>(null);

    const [assetReturns, setAssetReturns] = useState<{ [moveId: string]: string }>({});
    const [paymentAmount, setPaymentAmount] = useState<number>(0);

    // Estado tipado para retornos: Record<string, { in: number, bad: number }>
    const [returns, setReturns] = useState<Record<string, { in: number, bad: number }>>({});

    useEffect(() => {
        const fetchData = async () => {
            const [loadsData, sellersData, ordersData] = await Promise.all([
                getDailyLoads(),
                getSellers(),
                getOrders()
            ]);
            setLoads(loadsData.filter(l => l.status === 'open'));
            setSellers(sellersData);
            setOrders(ordersData);
        };
        fetchData();
    }, [getDailyLoads, getSellers, getOrders]);

    useEffect(() => {
        if (selectedLoadId) {
            const load = loads.find(l => l.id === selectedLoadId);
            setCurrentLoad(load || null);

            if (load) {
                // El backend puede devolver seller como objeto completo o solo sellerId
                const sellerId = load.sellerId || (typeof load.seller === 'object' && load.seller !== null ? (load.seller as IceCreamSeller).id : undefined);
                const sellerInfo = sellers.find(s => s.id === sellerId);
                setCurrentSeller(sellerInfo || null);
            }

            // Reset inputs
            const initReturns: Record<string, { in: number, bad: number }> = {};
            load?.items?.forEach(item => {
                if (item.id) initReturns[item.id] = { in: 0, bad: 0 };
            });
            setReturns(initReturns);

            const initAssets: Record<string, string> = {};
            load?.assetMovements?.forEach(m => {
                if (m.id) initAssets[m.id] = 'bueno';
            });
            setAssetReturns(initAssets);
            setPaymentAmount(0);
        } else {
            setCurrentLoad(null);
            setCurrentSeller(null);
        }
    }, [selectedLoadId, loads, sellers]);


    const handlePaymentChange = (value: string) => {
        if (value === "") {
            setPaymentAmount(0);
            return;
        }
        const val = parseFloat(value);
        if (!isNaN(val) && val >= 0) {
            setPaymentAmount(val);
        }
    };

    const handleCloseDay = async () => {
        if (!currentLoad) return;

        const updatedAssets = currentLoad.assetMovements?.map(m => ({
            id: m.id,
            asset: m.asset,
            statusIn: (m.id && assetReturns[m.id]) || 'bueno'
        }));

        const updatedItems = currentLoad.items!.map(item => {
            if (!item.id) return item;
            const r = returns[item.id] || { in: 0, bad: 0 };
            return { ...item, quantityIn: r.in, quantityBad: r.bad };
        });

        const payload: DailyLoad = {
            ...currentLoad,
            items: updatedItems,
            assetMovements: updatedAssets,
            paymentAmount: paymentAmount
        };

        try {
            await closeDailyLoad(currentLoad.id!, payload);
            setSelectedLoadId("");
            setCurrentLoad(null);
            setCurrentSeller(null);
            const data = await getDailyLoads();
            setLoads(data.filter(l => l.status === 'open'));
        } catch (e) { console.error(e); }
    };

    const totalLoadValue = currentLoad?.totalLoadValue || 0;
    const currentGlobalDebt = currentSeller?.currentDebt || 0;

    const maxPayable = currentGlobalDebt;
    const isOverpaying = paymentAmount > maxPayable;

    const linkedOrder = currentLoad?.order?.id ? orders.find(o => o.id === currentLoad.order!.id) : null;
    const isOrderFullyDelivered = linkedOrder?.status === 'entregado';
    const isUnderpayingFinal = isOrderFullyDelivered && (currentGlobalDebt - paymentAmount) > 0.01;

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Liquidación Diaria</h1>
                    <p className="text-muted-foreground">Recepción de activos y cierre de caja.</p>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>1. Seleccionar Despacho Pendiente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select value={selectedLoadId} onValueChange={setSelectedLoadId}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar heladero..." /></SelectTrigger>
                            <SelectContent>
                                {loads.length === 0 ? (
                                    <SelectItem value="none" disabled>No hay despachos abiertos</SelectItem>
                                ) : (
                                    loads.map(l => {
                                        // Obtener el nombre del seller de forma segura
                                        const sellerName = typeof l.seller === 'object' && l.seller !== null
                                            ? (l.seller as IceCreamSeller).name
                                            : sellers.find(s => s.id === l.sellerId)?.name || 'Desconocido';

                                        return (
                                            <SelectItem key={l.id} value={l.id!}>
                                                {sellerName} {' - '}{l.date} ({formatMoney(l.totalLoadValue || 0)})
                                            </SelectItem>
                                        );
                                    })
                                )}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {currentLoad && (
                    <>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2"><Bike className="h-5 w-5"/> 2. Retorno de Activos</CardTitle>
                                <CardDescription>Confirma el estado de los equipos devueltos.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {currentLoad.assetMovements && currentLoad.assetMovements.length > 0 ? (
                                    <div className="space-y-2">
                                        {currentLoad.assetMovements.map(m => (
                                            <div key={m.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-3 rounded-md border">
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline" className="bg-white">{m.asset.code}</Badge>
                                                    <span className="font-medium text-sm">{m.asset.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Label className="text-xs text-muted-foreground">Estado:</Label>
                                                    <Select
                                                        value={(m.id && assetReturns[m.id]) || 'bueno'}
                                                        onValueChange={v => { if (m.id) setAssetReturns({...assetReturns, [m.id]: v}) }}
                                                    >
                                                        <SelectTrigger className="w-32 h-8">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="bueno">Bueno (OK)</SelectItem>
                                                            <SelectItem value="dañado">Dañado</SelectItem>
                                                            <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic pl-2">No se asignaron activos (Triciclo propio).</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-green-200 dark:border-green-900 bg-green-50/30 dark:bg-green-900/10">
                            <CardHeader className="pb-3">
                                <CardTitle>3. Cierre Financiero</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-6 border rounded-md bg-white dark:bg-gray-900 overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50 dark:bg-gray-800">
                                                <TableHead>Producto Retirado</TableHead>
                                                <TableHead className="text-right">Cant.</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {currentLoad.items?.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">{item.productName}</TableCell>
                                                    <TableCell className="text-right font-bold">{item.quantityOut}</TableCell>
                                                    <TableCell className="text-right">{formatMoney(item.quantityOut * item.unitPrice)}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="font-bold border-t-2">
                                                <TableCell colSpan={2} className="text-right">Total del Día:</TableCell>
                                                <TableCell className="text-right text-lg">{formatMoney(totalLoadValue)}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>

                                {isOrderFullyDelivered && (
                                    <Alert className="mb-4 bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-200">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle className="font-bold text-sm">Entrega Finalizada</AlertTitle>
                                        <AlertDescription className="text-xs">
                                            Este despacho completó la entrega del pedido. <strong>Se requiere la cancelación total de la deuda</strong>.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                                    <div className="space-y-4 w-full md:w-1/2">
                                        <h3 className="font-semibold flex items-center gap-2 text-green-700 dark:text-green-400">
                                            <DollarSign className="w-5 h-5"/> Registro de Pago
                                        </h3>

                                        {currentSeller && (
                                            <div className="text-sm bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                                                <span className="text-muted-foreground">Deuda Total Acumulada:</span>
                                                <span className="font-bold ml-2 text-red-500">{formatMoney(currentGlobalDebt)}</span>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label>Monto Recibido (Amortización)</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-muted-foreground font-bold">S/</span>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max={maxPayable}
                                                    className={`pl-8 text-xl font-bold h-12 ${isOverpaying || isUnderpayingFinal ? 'border-red-500 text-red-500 focus-visible:ring-red-500' : ''}`}
                                                    placeholder="0.00"
                                                    value={paymentAmount === 0 ? "" : paymentAmount}
                                                    onChange={e => handlePaymentChange(e.target.value)}
                                                />
                                            </div>

                                            {isOverpaying ? (
                                                <div className="text-xs text-red-600 flex items-center gap-1 font-medium animate-pulse">
                                                    <AlertTriangle className="h-3 w-3"/>
                                                    El pago excede la deuda total ({formatMoney(currentGlobalDebt)}).
                                                </div>
                                            ) : isUnderpayingFinal ? (
                                                <div className="text-xs text-red-600 flex items-center gap-1 font-medium animate-pulse">
                                                    <AlertTriangle className="h-3 w-3"/>
                                                    Debe cancelar el saldo restante ({formatMoney(currentGlobalDebt)}).
                                                </div>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">
                                                    Nuevo Saldo Deuda: <span className="font-medium text-foreground">{formatMoney(Math.max(0, currentGlobalDebt - paymentAmount))}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right space-y-2">
                                        <Button
                                            size="lg"
                                            onClick={handleCloseDay}
                                            className="w-full md:w-auto shadow-lg shadow-green-900/20"
                                            disabled={isOverpaying || isUnderpayingFinal}
                                        >
                                            Confirmar y Cerrar Día
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Settlement;