import React, { useEffect, useState } from 'react';
import DashboardLayout from "@/frontend/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiData, User, Order, Asset, IceCreamSeller, DailyLoad, LoadItem, AssetMovement } from "@/hooks/useApiData";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Bike, ShoppingCart, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCurrency } from "@/context/CurrencyContext";

interface DispatchItem {
    productId?: string;
    productName: string;
    quantityTotal: number;
    quantityDelivered: number;
    quantityOut: number;
    unitPrice: number;
}

const Dispatch: React.FC = () => {
    const { getSellers, getOrders, getAssets, createDailyLoad } = useApiData();
    const { formatMoney } = useCurrency();
    const { toast } = useToast();

    const [sellers, setSellers] = useState<IceCreamSeller[]>([]);
    const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
    const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);

    const [selectedSellerId, setSelectedSellerId] = useState("");
    const [selectedOrderId, setSelectedOrderId] = useState("");
    const [dispatchItems, setDispatchItems] = useState<DispatchItem[]>([]);
    const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
    const [tempAssetId, setTempAssetId] = useState("");

    const [creditInfo, setCreditInfo] = useState<{limit: number, debt: number, available: number} | null>(null);

    useEffect(() => {
        const init = async () => {
            const [sData, aData] = await Promise.all([getSellers(), getAssets('CLIENT')]);
            setSellers(sData);
            setAvailableAssets(aData.filter(a => a.status === 'disponible'));
        };
        init();
    }, [getSellers, getAssets]);

    useEffect(() => {
        if (selectedSellerId) {
            const seller = sellers.find(s => s.id === selectedSellerId);
            if (seller) {
                const limit = seller.creditLimit || 0;
                const debt = seller.currentDebt || 0;
                setCreditInfo({
                    limit,
                    debt,
                    available: limit - debt
                });
            }

            getOrders().then(orders => {
                const userOrders = orders.filter(o => {
                    const isPending = o.status === 'pendiente' || o.status === 'entregado_parcial';
                    const isOwner = (o.user && o.user.id === selectedSellerId) || (o as any).userId === selectedSellerId;
                    return isPending && isOwner;
                });
                setPendingOrders(userOrders);
                setSelectedOrderId("");
                setDispatchItems([]);
            });
        } else {
            setCreditInfo(null);
            setPendingOrders([]);
        }
    }, [selectedSellerId, getOrders, sellers]);

    useEffect(() => {
        if (selectedOrderId) {
            const order = pendingOrders.find(o => o.id === selectedOrderId);
            if (order && order.items) {
                const items: DispatchItem[] = order.items.map(oi => ({
                    productId: oi.productId,
                    productName: oi.productName,
                    quantityTotal: oi.quantity,
                    quantityDelivered: (oi as any).quantityDelivered || 0,
                    quantityOut: 0,
                    unitPrice: oi.price
                }));
                setDispatchItems(items);
            }
        }
    }, [selectedOrderId, pendingOrders]);

    const handleQuantityChange = (index: number, val: string) => {
        const items = [...dispatchItems];

        // Permitir borrar el valor (ponerlo en 0 internamente pero se verá vacío en input)
        if (val === "") {
            items[index].quantityOut = 0;
            setDispatchItems(items);
            return;
        }

        const qty = parseInt(val);
        const max = items[index].quantityTotal - items[index].quantityDelivered;

        if (!isNaN(qty) && qty >= 0) {
            if (qty > max) {
                toast({ variant: "destructive", title: "Exceso", description: `Máximo disponible: ${max}` });
            } else {
                items[index].quantityOut = qty;
                setDispatchItems(items);
            }
        }
    };

    const handleAddAsset = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!tempAssetId || selectedAssets.includes(tempAssetId)) return;
        setSelectedAssets(prev => [...prev, tempAssetId]);
        setTempAssetId("");
    };

    const handleRemoveAsset = (id: string) => {
        setSelectedAssets(prev => prev.filter(a => a !== id));
    };

    const handleSaveDispatch = async () => {
        const itemsToSend: LoadItem[] = dispatchItems
            .filter(i => i.quantityOut > 0)
            .map(i => ({
                productId: i.productId!,
                productName: i.productName,
                quantityOut: i.quantityOut,
                unitPrice: i.unitPrice
            } as LoadItem));

        if (itemsToSend.length === 0) {
            toast({ variant: "destructive", title: "Error", description: "Ingresa cantidades a despachar." });
            return;
        }

        const assetMovements: AssetMovement[] = selectedAssets.map(assetId => ({
            asset: { id: assetId } as Asset
        }));

        const dailyLoad: DailyLoad = {
            sellerId: selectedSellerId,
            date: new Date().toISOString().split('T')[0],
            status: 'open',
            order: { id: selectedOrderId },
            items: itemsToSend,
            assetMovements: assetMovements
        };

        try {
            await createDailyLoad(dailyLoad);
            setSelectedSellerId("");
            setSelectedOrderId("");
            setDispatchItems([]);
            setSelectedAssets([]);
            setTempAssetId("");
            const aData = await getAssets('CLIENT');
            setAvailableAssets(aData.filter(a => a.status === 'disponible'));
        } catch (e) { console.error(e); }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Nuevo Despacho</h1>
                    <p className="text-muted-foreground">Asignación de mercadería y activos según pedido.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="md:col-span-1 h-fit">
                        <CardHeader>
                            <CardTitle className="text-lg">Configuración</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>1. Heladero</Label>
                                <Select value={selectedSellerId} onValueChange={setSelectedSellerId}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                    <SelectContent>
                                        {sellers.map(s => <SelectItem key={s.id} value={s.id!}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>

                                {creditInfo && (
                                    <div className={`text-xs p-2 rounded border ${creditInfo.available < 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                                        <div className="flex justify-between">
                                            <span>Límite:</span>
                                            <span className="font-semibold">{formatMoney(creditInfo.limit)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Deuda:</span>
                                            <span className="font-semibold text-red-500">{formatMoney(creditInfo.debt)}</span>
                                        </div>
                                        <div className="border-t border-dashed my-1 pt-1 flex justify-between font-bold">
                                            <span>Disponible:</span>
                                            <span>{formatMoney(creditInfo.available)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>2. Pedido Pendiente</Label>
                                <Select value={selectedOrderId} onValueChange={setSelectedOrderId} disabled={!selectedSellerId}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar Pedido..." /></SelectTrigger>
                                    <SelectContent>
                                        {pendingOrders.map(o => (
                                            <SelectItem key={o.id} value={o.id!}>
                                                {o.orderNumber} - {o.date} ({formatMoney(o.total)})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 pt-4 border-t">
                                <Label>3. Asignar Activos</Label>
                                <div className="flex gap-2">
                                    <Select value={tempAssetId} onValueChange={setTempAssetId}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Triciclo / Batería" /></SelectTrigger>
                                        <SelectContent>
                                            {availableAssets.map(a => <SelectItem key={a.id} value={a.id!}>{a.code} - {a.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Button type="button" size="icon" variant="outline" onClick={handleAddAsset} disabled={!tempAssetId}><Plus className="h-4 w-4"/></Button>
                                </div>
                                <div className="space-y-1 mt-2">
                                    {selectedAssets.map(id => {
                                        const asset = availableAssets.find(a => a.id === id) || { code: 'ASSET', name: '?' };
                                        return (
                                            <div key={id} className="text-xs flex justify-between bg-slate-100 dark:bg-slate-800 p-2 rounded">
                                                <span>{asset.code} - {asset.name}</span>
                                                <Button type="button" variant="ghost" size="icon" className="h-4 w-4 text-red-500" onClick={() => handleRemoveAsset(id)}><X className="h-3 w-3"/></Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Detalle de Salida</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!selectedOrderId ? (
                                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                    <ShoppingCart className="h-10 w-10 mb-2 opacity-20"/>
                                    <p>Selecciona un pedido para cargar items</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Producto</TableHead>
                                                <TableHead className="text-center w-32">Progreso</TableHead>
                                                <TableHead className="w-24 text-right">Despachar</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {dispatchItems.map((item, idx) => {
                                                const pending = item.quantityTotal - item.quantityDelivered;
                                                const progress = (item.quantityDelivered / item.quantityTotal) * 100;
                                                const isCompleted = pending <= 0;

                                                return (
                                                    <TableRow key={idx} className={isCompleted ? "opacity-50" : ""}>
                                                        <TableCell>
                                                            <div className="font-medium">{item.productName}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Total: {item.quantityTotal} | Entregado: {item.quantityDelivered}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="space-y-1">
                                                                <Progress value={progress} className="h-2" />
                                                                <div className="text-[10px] text-center text-muted-foreground">
                                                                    Faltan: {pending}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max={pending}
                                                                disabled={isCompleted}
                                                                className="h-8 w-20 text-right ml-auto"
                                                                // Lógica de visualización limpia (0 -> vacío)
                                                                value={item.quantityOut === 0 ? "" : item.quantityOut}
                                                                onChange={(e) => handleQuantityChange(idx, e.target.value)}
                                                                placeholder="0"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>

                                    <Button
                                        className="w-full"
                                        size="lg"
                                        onClick={handleSaveDispatch}
                                        disabled={!dispatchItems.some(i => i.quantityOut > 0)}
                                    >
                                        Registrar Salida
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Dispatch;