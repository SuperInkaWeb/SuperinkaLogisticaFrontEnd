import React, { useEffect, useState } from 'react';
import DashboardLayout from "@/frontend/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Phone, MapPin, Plus, Pencil, Trash2, Mail, Lock, DollarSign, HandCoins, Users } from "lucide-react";
import { useApiData, IceCreamSeller } from "@/hooks/useApiData";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/context/CurrencyContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const IceCreamSellers: React.FC = () => {
    const { getSellers, createSeller, updateSeller, deleteSeller, registerPayment } = useApiData();
    const { formatMoney } = useCurrency();
    const { toast } = useToast();

    const [sellers, setSellers] = useState<IceCreamSeller[]>([]);
    const [loading, setLoading] = useState(true);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSeller, setEditingSeller] = useState<IceCreamSeller | null>(null);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [paymentSeller, setPaymentSeller] = useState<IceCreamSeller | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);

    const initialFormState: IceCreamSeller = {
        name: '', dni: '', phone: '', address: '', email: '', password: '', creditLimit: 0, role: 'cliente'
    };
    const [formData, setFormData] = useState<IceCreamSeller>(initialFormState);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getSellers();
            setSellers(Array.isArray(data) ? data : []);
        } catch (e) { setSellers([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const validateForm = () => {
        if (!formData.name.trim()) { toast({title: "Error", description: "Nombre requerido", variant: "destructive"}); return false; }
        if (!formData.email?.trim()) { toast({title: "Error", description: "Email requerido", variant: "destructive"}); return false; }
        if (!formData.dni.trim()) { toast({title: "Error", description: "DNI requerido", variant: "destructive"}); return false; }
        if (!editingSeller && (!formData.password || formData.password.length < 6)) {
            toast({title: "Error", description: "Contraseña mín. 6 caracteres", variant: "destructive"}); return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        try {
            if (editingSeller && editingSeller.id) {
                await updateSeller(editingSeller.id, formData);
            } else {
                await createSeller(formData);
            }
            setIsDialogOpen(false);
            setEditingSeller(null);
            setFormData(initialFormState);
            loadData();
        } catch (e) { console.error(e); }
    };

    const handleEdit = (s: IceCreamSeller) => {
        setEditingSeller(s);
        setFormData({ ...s, password: '' });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if(confirm("¿Eliminar usuario? Se perderá el acceso.")) {
            await deleteSeller(id);
            loadData();
        }
    };

    const openPaymentDialog = (s: IceCreamSeller) => {
        setPaymentSeller(s);
        setPaymentAmount(0);
        setIsPaymentOpen(true);
    };

    const handlePaymentSubmit = async () => {
        if (!paymentSeller || !paymentSeller.id || paymentAmount <= 0) return;
        const success = await registerPayment(paymentSeller.id, paymentAmount);
        if (success) {
            setIsPaymentOpen(false);
            setPaymentSeller(null);
            setPaymentAmount(0);
            loadData();
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Cartera de Clientes</h1>
                        <p className="text-muted-foreground">Gestión de Heladeros y Clientes regulares.</p>
                    </div>

                    <Button className="bg-primary hover:bg-primary/90 shadow-lg" onClick={() => { setEditingSeller(null); setFormData(initialFormState); setIsDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente/Heladero
                    </Button>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={open => { setIsDialogOpen(open); if(!open) { setEditingSeller(null); setFormData(initialFormState); } }}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingSeller ? 'Editar' : 'Nuevo'} Usuario</DialogTitle>
                            <DialogDescription>Información personal y configuración de cuenta.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nombre Completo *</Label>
                                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>DNI *</Label>
                                    <Input value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} />
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md border space-y-3">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2"><User className="w-3 h-3"/> Configuración de Cuenta</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Email *</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input className="pl-9" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Rol de Usuario</Label>
                                        <Select
                                            value={formData.role || 'cliente'}
                                            onValueChange={val => setFormData({...formData, role: val})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cliente">Cliente (Solo Delivery)</SelectItem>
                                                <SelectItem value="heladero">Heladero (Despacho/Delivery)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>{editingSeller ? 'Nueva Contraseña' : 'Contraseña *'}</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-9" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="******" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Teléfono</Label>
                                    <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Dirección</Label>
                                    <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                                </div>
                            </div>

                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-100 dark:border-green-900 space-y-3">
                                <h4 className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase flex items-center gap-2">
                                    <DollarSign className="w-3 h-3"/> Información Financiera
                                </h4>
                                <div className="space-y-2">
                                    <Label>Línea de Crédito (S/)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={formData.creditLimit}
                                        onChange={e => setFormData({...formData, creditLimit: parseFloat(e.target.value)})}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSubmit}>{editingSeller ? 'Actualizar' : 'Crear Usuario'}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Dialogo de Pago */}
                <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Amortizar Deuda</DialogTitle>
                            <DialogDescription>Registrar pago para <strong>{paymentSeller?.name}</strong>.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="flex justify-between text-sm">
                                <span>Deuda Actual:</span>
                                <span className="font-bold text-red-500">{formatMoney(paymentSeller?.currentDebt || 0)}</span>
                            </div>
                            <div className="space-y-2">
                                <Label>Monto a Pagar</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input type="number" min="0" className="pl-9 text-lg font-bold" value={paymentAmount} onChange={e => setPaymentAmount(parseFloat(e.target.value))} />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handlePaymentSubmit} disabled={paymentAmount <= 0}>Confirmar Pago</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {loading ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}</div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {sellers.map((seller) => (
                            <Card key={seller.id} className="group hover:shadow-md transition-all border-0 bg-white dark:bg-gray-800 relative">
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(seller)}><Pencil className="h-3 w-3"/></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => seller.id && handleDelete(seller.id)}><Trash2 className="h-3 w-3"/></Button>
                                </div>

                                <CardHeader className="pb-3">
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-xl font-bold text-orange-600 border-2 border-white shadow-sm">
                                            {seller.name.substring(0, 1).toUpperCase()}
                                        </div>
                                        <div className="space-y-1">
                                            <CardTitle className="text-lg leading-none">{seller.name}</CardTitle>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">DNI: {seller.dni}</Badge>
                                                {/* Mostrar etiqueta del Rol */}
                                                <Badge variant="outline" className={`text-[10px] h-5 px-1.5 font-normal capitalize ${seller.role === 'heladero' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                                    {seller.role || 'cliente'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
                                            <div>
                                                <span className="block text-xs text-muted-foreground uppercase">Deuda</span>
                                                <span className={`font-bold ${seller.currentDebt && seller.currentDebt > 0 ? 'text-red-500' : 'text-slate-700'}`}>
                                                    {formatMoney(seller.currentDebt || 0)}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-xs text-muted-foreground uppercase">Límite</span>
                                                <span className="font-bold text-blue-600">
                                                    {formatMoney(seller.creditLimit || 0)}
                                                </span>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => openPaymentDialog(seller)} className="w-full text-green-600 border-green-200 hover:bg-green-50 mt-1 h-8">
                                            <HandCoins className="h-4 w-4 mr-1"/> Amortizar
                                        </Button>
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

export default IceCreamSellers;