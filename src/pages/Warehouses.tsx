import React, { useEffect, useState } from 'react';
import DashboardLayout from "@/frontend/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Box, Plus, Pencil, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useApiData, Warehouse } from "@/hooks/useApiData";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const Warehouses: React.FC = () => {
    const { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } = useApiData();
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
    const [formData, setFormData] = useState<Warehouse>({ name: '', city: '', capacity: 1000, currentStock: 0, status: 'activo' });

    const loadData = async () => {
        setLoading(true);
        const data = await getWarehouses();
        setWarehouses(data);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const validateForm = () => {
        if (!formData.name.trim()) {
            toast({ variant: "destructive", title: "Error", description: "El nombre es obligatorio" });
            return false;
        }
        if (formData.capacity <= 0) {
            toast({ variant: "destructive", title: "Error", description: "La capacidad debe ser mayor a 0" });
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        try {
            if (editingWarehouse && editingWarehouse.id) {
                await updateWarehouse(editingWarehouse.id, formData);
            } else {
                await createWarehouse(formData);
            }
            setIsDialogOpen(false);
            setEditingWarehouse(null);
            setFormData({ name: '', city: '', capacity: 1000, currentStock: 0, status: 'activo' });
            loadData();
        } catch (e) { console.error(e); }
    };

    const handleEdit = (w: Warehouse) => {
        setEditingWarehouse(w);
        setFormData(w);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if(confirm("¿Eliminar almacén?")) {
            await deleteWarehouse(id);
            loadData();
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Almacenes</h1>
                        <p className="text-muted-foreground">Gestión de centros de distribución.</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={open => { setIsDialogOpen(open); if(!open) setEditingWarehouse(null); }}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90 shadow-lg" onClick={() => setFormData({ name: '', city: '', capacity: 1000, currentStock: 0, status: 'activo' })}>
                                <Plus className="mr-2 h-4 w-4" /> Nuevo Almacén
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingWarehouse ? 'Editar' : 'Nuevo'} Almacén</DialogTitle>
                                <DialogDescription>Detalles de ubicación y capacidad.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>Nombre del Almacén *</Label>
                                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Almacén Norte" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Ciudad / Ubicación</Label>
                                    <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="Ej: Lima" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Capacidad Total</Label>
                                        <Input type="number" min="1" value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Stock Inicial</Label>
                                        <Input type="number" min="0" value={formData.currentStock} onChange={e => setFormData({...formData, currentStock: parseInt(e.target.value)})} />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSubmit}>Guardar</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {loading ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}</div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {warehouses.map((warehouse) => {
                            const occupancy = warehouse.capacity > 0 ? (warehouse.currentStock / warehouse.capacity) * 100 : 0;
                            const isFull = occupancy >= 90;

                            return (
                                <Card key={warehouse.id} className="shadow-sm hover:shadow-md transition-all duration-300 border-0 bg-white dark:bg-gray-800 group relative">
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(warehouse)}><Pencil className="h-3 w-3"/></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => warehouse.id && handleDelete(warehouse.id)}><Trash2 className="h-3 w-3"/></Button>
                                    </div>

                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                                        <Box className="h-5 w-5 text-primary" />
                                                    </div>
                                                    {warehouse.name}
                                                </CardTitle>
                                                <CardDescription className="flex items-center gap-1.5 text-xs font-medium">
                                                    <MapPin className="h-3 w-3" /> {warehouse.city}
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Ocupación</span>
                                                    <span className={`font-bold ${isFull ? 'text-red-600' : 'text-primary'}`}>
                            {occupancy.toFixed(1)}%
                          </span>
                                                </div>
                                                <Progress value={occupancy} className="h-2 bg-slate-100 dark:bg-gray-700" />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50 dark:border-gray-700">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Capacidad</p>
                                                    <p className="text-xl font-bold text-slate-700 dark:text-gray-200">{warehouse.capacity.toLocaleString()}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Stock Actual</p>
                                                    <p className="text-xl font-bold text-slate-700 dark:text-gray-200">{warehouse.currentStock.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Warehouses;