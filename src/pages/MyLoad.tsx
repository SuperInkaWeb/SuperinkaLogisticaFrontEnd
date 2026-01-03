import React, { useEffect, useState } from 'react';
import DashboardLayout from "@/frontend/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiData, DailyLoad } from "@/hooks/useApiData";
import { useAuth } from "@/frontend/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Package, Calendar, AlertCircle, Truck, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MyLoad: React.FC = () => {
    const { user } = useAuth();
    const { getDailyLoads } = useApiData();
    const { formatMoney } = useCurrency();

    const [allLoads, setAllLoads] = useState<DailyLoad[]>([]);
    const [filteredLoads, setFilteredLoads] = useState<DailyLoad[]>([]);
    const [loading, setLoading] = useState(true);

    // Estado para el filtro de fecha (Inicializado con la fecha de hoy)
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState<string>(today);

    useEffect(() => {
        const fetchMyLoads = async () => {
            setLoading(true);
            try {
                const data = await getDailyLoads();

                // Obtener ID de usuario de forma segura
                const userId = (user as any)?.id || (user as any)?.sub;

                // 1. Obtener TODAS las cargas históricas del usuario
                const userLoads = data.filter(l =>
                    l.seller?.id === userId || l.sellerId === userId
                );

                // Ordenar: Más recientes primero
                userLoads.sort((a, b) => b.date.localeCompare(a.date));

                setAllLoads(userLoads);
            } catch (error) {
                console.error("Error al cargar despachos", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchMyLoads();
        }
    }, [user, getDailyLoads]);

    // Efecto para aplicar el filtro cuando cambia la fecha o la data
    useEffect(() => {
        if (selectedDate) {
            const filtered = allLoads.filter(l => l.date === selectedDate);
            setFilteredLoads(filtered);
        } else {
            // Si por alguna razón se borra la fecha, mostrar todo (opcional)
            setFilteredLoads(allLoads);
        }
    }, [selectedDate, allLoads]);

    // Calcular fechas que tienen actividad para mostrar sugerencias si está vacío
    const activityDates = Array.from(new Set(allLoads.map(l => l.date))).sort().reverse();

    if (loading) {
        return (
            <DashboardLayout>
                <div className="space-y-4 p-4">
                    <Skeleton className="h-10 w-1/3" />
                    <div className="grid gap-4 md:grid-cols-2">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">

                {/* Cabecera con Filtro */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Mis Cargas</h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            Historial de despachos y mercadería asignada.
                        </p>
                    </div>

                    <div className="w-full md:w-auto flex flex-col gap-1.5">
                        <Label htmlFor="date-filter" className="text-xs font-semibold text-muted-foreground">Filtrar por Fecha</Label>
                        <div className="flex gap-2 items-center">
                            <Calendar className="h-4 w-4 text-slate-500" />
                            <Input
                                id="date-filter"
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full md:w-[160px]"
                            />
                        </div>
                    </div>
                </div>

                {/* LISTA DE CARGAS */}
                {filteredLoads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[40vh] text-center space-y-4 border rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border-dashed">
                        <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                            <Search className="h-8 w-8 text-slate-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Sin despachos para esta fecha</h2>
                            <p className="text-sm text-muted-foreground">
                                No se encontraron registros para el día <strong>{selectedDate}</strong>.
                            </p>
                        </div>

                        {/* Sugerencias de días con actividad */}
                        {activityDates.length > 0 && (
                            <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-md">
                                <span className="font-semibold text-blue-700 dark:text-blue-400">Días con actividad reciente:</span>
                                <div className="flex gap-2 justify-center mt-1 flex-wrap">
                                    {activityDates.slice(0, 3).map(date => (
                                        <Badge
                                            key={date}
                                            variant="outline"
                                            className="cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
                                            onClick={() => setSelectedDate(date)}
                                        >
                                            {date}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
                        {filteredLoads.map((load, index) => (
                            <Card key={load.id || index} className={`border-l-4 ${load.status === 'open' ? 'border-l-green-500 shadow-md' : 'border-l-slate-300 opacity-90'}`}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Truck className="h-5 w-5 text-primary" />
                                                Despacho
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-2 mt-1">
                                                <Calendar className="h-3 w-3" /> {load.date}
                                            </CardDescription>
                                        </div>
                                        <Badge variant={load.status === 'open' ? 'default' : 'secondary'} className="capitalize">
                                            {load.status === 'open' ? 'En Ruta' : 'Liquidado'}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent>
                                    <ScrollArea className="h-[200px] pr-4 border rounded-md mb-4 bg-slate-50 dark:bg-slate-900/50">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent">
                                                    <TableHead className="h-8 text-xs">Producto</TableHead>
                                                    <TableHead className="h-8 text-xs text-right">Cant.</TableHead>
                                                    <TableHead className="h-8 text-xs text-right">Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {load.items?.map((item, idx) => (
                                                    <TableRow key={idx} className="hover:bg-transparent">
                                                        <TableCell className="py-2 text-sm font-medium">{item.productName}</TableCell>
                                                        <TableCell className="py-2 text-sm text-right font-bold">{item.quantityOut}</TableCell>
                                                        <TableCell className="py-2 text-sm text-right">{formatMoney(item.quantityOut * item.unitPrice)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>

                                    <div className="flex flex-col gap-2 pt-2 border-t">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Valor Total:</span>
                                            <span className="text-lg font-bold text-primary">{formatMoney(load.totalLoadValue || 0)}</span>
                                        </div>

                                        {load.assetMovements && load.assetMovements.length > 0 && (
                                            <div className="text-xs text-muted-foreground flex gap-1 items-center mt-1">
                                                <strong>Activos:</strong>
                                                {load.assetMovements.map(m => m.asset?.code).join(', ')}
                                            </div>
                                        )}

                                        {load.status === 'open' && (
                                            <div className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-xs p-2 rounded flex gap-2 items-center">
                                                <AlertCircle className="h-3 w-3 shrink-0"/>
                                                <span>Pendiente de liquidación.</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default MyLoad;