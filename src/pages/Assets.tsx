import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from "@/frontend/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useApiData, Asset } from "@/hooks/useApiData";
import { Bike, Sofa, Plus, Pencil, Trash2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const Assets: React.FC = () => {
    const location = useLocation();
    // Determinar modo según la URL
    const isClientAssets = location.pathname.includes('client');
    const scope = isClientAssets ? 'CLIENT' : 'COMPANY';

    const { getAssets, createAsset, updateAsset, deleteAsset } = useApiData();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

    const [formData, setFormData] = useState<Asset>({
        code: '', name: '', type: 'triciclo', scope: scope, status: 'disponible'
    });

    const loadData = async () => {
        setLoading(true);
        const data = await getAssets(scope);
        setAssets(data);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
        // Resetear form al cambiar de página
        setFormData(prev => ({ ...prev, scope: scope, type: isClientAssets ? 'triciclo' : 'mueble' }));
    }, [scope]);

    const handleSubmit = async () => {
        try {
            if (editingAsset && editingAsset.id) {
                await updateAsset(editingAsset.id, formData);
            } else {
                await createAsset(formData);
            }
            setIsDialogOpen(false);
            setEditingAsset(null);
            setFormData({ code: '', name: '', type: isClientAssets ? 'triciclo' : 'mueble', scope: scope, status: 'disponible' });
            loadData();
        } catch (e) { console.error(e); }
    };

    const handleEdit = (asset: Asset) => {
        setEditingAsset(asset);
        setFormData(asset);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if(confirm("¿Eliminar este activo?")) {
            await deleteAsset(id);
            loadData();
        }
    };

    const filteredAssets = assets.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                            {isClientAssets ? 'Activos para Clientes' : 'Activos de la Empresa'}
                        </h1>
                        <p className="text-muted-foreground">
                            {isClientAssets ? 'Gestión de triciclos, baterías y congeladoras.' : 'Mobiliario, equipos de oficina y otros.'}
                        </p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={open => { setIsDialogOpen(open); if(!open) setEditingAsset(null); }}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90 shadow-lg" onClick={() => setFormData(prev => ({...prev, scope: scope}))}>
                                <Plus className="mr-2 h-4 w-4" /> Nuevo Activo
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingAsset ? 'Editar' : 'Registrar'} Activo</DialogTitle>
                                <DialogDescription>Información del bien patrimonial.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Código *</Label>
                                        <Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="Ej: TRI-001" />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label>Nombre / Descripción *</Label>
                                        <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Tipo</Label>
                                        <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {isClientAssets ? (
                                                    <>
                                                        <SelectItem value="triciclo">Triciclo</SelectItem>
                                                        <SelectItem value="congeladora">Congeladora</SelectItem>
                                                        <SelectItem value="bateria">Batería</SelectItem>
                                                    </>
                                                ) : (
                                                    <>
                                                        <SelectItem value="mueble">Mueble</SelectItem>
                                                        <SelectItem value="equipo">Equipo Informático</SelectItem>
                                                        <SelectItem value="vehiculo">Vehículo Interno</SelectItem>
                                                        <SelectItem value="otro">Otro</SelectItem>
                                                    </>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Estado</Label>
                                        <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v as any})}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="disponible">Disponible</SelectItem>
                                                <SelectItem value="en_uso">En Uso</SelectItem>
                                                <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                                                <SelectItem value="baja">De Baja</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSubmit}>Guardar</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Buscador */}
                <div className="relative max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar por código o nombre..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>

                {/* Lista */}
                {loading ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}</div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredAssets.map((asset) => (
                            <Card key={asset.id} className="group hover:shadow-md transition-all border-0 bg-white dark:bg-gray-800 relative">
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(asset)}><Pencil className="h-3 w-3"/></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => asset.id && handleDelete(asset.id)}><Trash2 className="h-3 w-3"/></Button>
                                </div>

                                <CardHeader className="pb-3">
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xl text-primary">
                                            {isClientAssets ? <Bike /> : <Sofa />}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{asset.name}</CardTitle>
                                            <CardDescription className="font-mono text-xs mt-1 bg-slate-200 dark:bg-slate-900 px-2 py-0.5 rounded w-fit">
                                                {asset.code}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center mt-2">
                                        <Badge variant="outline" className="capitalize">{asset.type}</Badge>
                                        <Badge className={`capitalize ${
                                            asset.status === 'disponible' ? 'bg-green-500' :
                                                asset.status === 'en_uso' ? 'bg-blue-500' : 'bg-red-500'
                                        }`}>
                                            {asset.status.replace('_', ' ')}
                                        </Badge>
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

export default Assets;