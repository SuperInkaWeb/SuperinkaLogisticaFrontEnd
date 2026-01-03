import React, { useEffect, useState } from 'react';
import DashboardLayout from "@/frontend/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiData, Carrier } from "@/hooks/useApiData";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ExternalLink, Settings, Plus, Trash2, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const Carriers: React.FC = () => {
    const { getCarriers, createCarrier, updateCarrier, deleteCarrier } = useApiData();
    const [carriers, setCarriers] = useState<Carrier[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);
    const [formData, setFormData] = useState<Carrier>({ name: '', logo: '🚚', status: 'activo', trackingUrl: '' });

    const loadData = async () => {
        setLoading(true);
        const data = await getCarriers();
        setCarriers(data);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const validateForm = () => {
        if (!formData.name.trim()) {
            toast({ variant: "destructive", title: "Error", description: "El nombre es obligatorio" });
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        try {
            if (editingCarrier && editingCarrier.id) {
                await updateCarrier(editingCarrier.id, formData);
            } else {
                await createCarrier(formData);
            }
            setIsDialogOpen(false);
            setEditingCarrier(null);
            setFormData({ name: '', logo: '🚚', status: 'activo', trackingUrl: '' });
            loadData();
        } catch (e) { console.error(e); }
    };

    const handleConfigure = (carrier: Carrier) => {
        setEditingCarrier(carrier);
        setFormData(carrier);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if(confirm("¿Estás seguro de eliminar este transportista?")) {
            await deleteCarrier(id);
            loadData();
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Transportistas</h1>
                        <p className="text-muted-foreground">Gestión de proveedores logísticos.</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={open => { setIsDialogOpen(open); if(!open) setEditingCarrier(null); }}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setFormData({ name: '', logo: '🚚', status: 'activo', trackingUrl: '' })}>
                                <Plus className="mr-2 h-4 w-4"/> Nuevo
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingCarrier ? 'Configurar' : 'Nuevo'} Transportista</DialogTitle>
                                <DialogDescription>Ajusta los detalles del proveedor.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>Nombre *</Label>
                                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: DHL Express" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Emoji / Logo</Label>
                                    <Input value={formData.logo} onChange={e => setFormData({...formData, logo: e.target.value})} placeholder="🚚" />
                                </div>
                                <div className="space-y-2">
                                    <Label>URL de Tracking</Label>
                                    <Input value={formData.trackingUrl} onChange={e => setFormData({...formData, trackingUrl: e.target.value})} placeholder="https://..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Estado</Label>
                                    <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="activo">Activo</SelectItem>
                                            <SelectItem value="configurar">Por Configurar</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSubmit}>Guardar</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {loading ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}</div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {carriers.map((carrier) => (
                            <Card key={carrier.id} className="group hover:shadow-md transition-all duration-300 border-0 bg-white dark:bg-gray-800 relative">
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => carrier.id && handleDelete(carrier.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-lg bg-slate-50 dark:bg-gray-700 flex items-center justify-center text-2xl shadow-sm">
                                            {carrier.logo || '🚚'}
                                        </div>
                                        <div className="space-y-1">
                                            <CardTitle className="text-base font-bold">{carrier.name}</CardTitle>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                <span className={`w-2 h-2 rounded-full ${carrier.status === 'activo' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                                {carrier.status === 'activo' ? 'Operativo' : 'Configurar'}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-2 mt-4">
                                        <Button variant="outline" className="flex-1 bg-slate-50 border-slate-200 text-slate-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" size="sm" onClick={() => handleConfigure(carrier)}>
                                            <Settings className="w-4 h-4 mr-2" /> Configurar
                                        </Button>

                                        {carrier.trackingUrl && (
                                            <Button variant="secondary" className="flex-1 bg-primary/5 text-primary hover:bg-primary/10" size="sm" onClick={() => window.open(carrier.trackingUrl, '_blank')}>
                                                <ExternalLink className="w-4 h-4 mr-2" /> Tracking
                                            </Button>
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

export default Carriers;