import React, { useEffect, useState } from 'react';
import DashboardLayout from "@/frontend/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import { useApiData, Company } from "@/hooks/useApiData";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Companies: React.FC = () => {
    const { getCompanies, createCompany, updateCompany, deleteCompany } = useApiData();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [formData, setFormData] = useState<Company>({ name: '', ruc: '', address: '' });

    const loadData = async () => {
        setLoading(true);
        const data = await getCompanies();
        setCompanies(data);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async () => {
        try {
            if (editingCompany && editingCompany.id) {
                await updateCompany(editingCompany.id, formData);
            } else {
                await createCompany(formData);
            }
            setIsDialogOpen(false);
            setEditingCompany(null);
            setFormData({ name: '', ruc: '', address: '' });
            loadData();
        } catch (e) { console.error(e); }
    };

    const handleEdit = (c: Company) => {
        setEditingCompany(c);
        setFormData(c);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if(confirm("¿Eliminar empresa? Esto podría afectar a todos sus usuarios.")) {
            await deleteCompany(id);
            loadData();
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Empresas (Tenants)</h1>
                        <p className="text-muted-foreground">Gestión de clientes SaaS.</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={open => { setIsDialogOpen(open); if(!open) setEditingCompany(null); }}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90 shadow-lg" onClick={() => setFormData({ name: '', ruc: '', address: '' })}>
                                <Plus className="mr-2 h-4 w-4" /> Nueva Empresa
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingCompany ? 'Editar' : 'Nueva'} Empresa</DialogTitle>
                                <DialogDescription>Datos fiscales y generales.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>Razón Social *</Label>
                                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Molitalia S.A." />
                                </div>
                                <div className="space-y-2">
                                    <Label>RUC / NIT</Label>
                                    <Input value={formData.ruc} onChange={e => setFormData({...formData, ruc: e.target.value})} placeholder="20100..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Dirección</Label>
                                    <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
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
                        {companies.map((company) => (
                            <Card key={company.id} className="group hover:shadow-md transition-all duration-300 border-0 bg-white dark:bg-gray-800 relative">
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(company)}><Pencil className="h-3 w-3"/></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => company.id && handleDelete(company.id)}><Trash2 className="h-3 w-3"/></Button>
                                </div>

                                <CardHeader className="pb-3">
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-2xl">
                                            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{company.name}</CardTitle>
                                            <CardDescription className="font-mono text-xs mt-1">RUC: {company.ruc || 'N/A'}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
                                        <MapPin className="h-4 w-4 shrink-0" />
                                        <span className="truncate">{company.address || 'Sin dirección registrada'}</span>
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

export default Companies;