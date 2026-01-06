import React, { useEffect, useState } from 'react';
import DashboardLayout from "@/frontend/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useApiData, IceCreamSeller } from "@/hooks/useApiData";
import { useCurrency } from "@/context/CurrencyContext";
import { useToast } from "@/hooks/use-toast";
import {
    Search,
    Wallet,
    Truck,
    ArrowDownCircle,
    AlertCircle,
    Banknote,
    Edit,
    User,
    Phone,
    MapPin,
    Mail
} from "lucide-react";

const IceCreamSellers: React.FC = () => {
    const { getSellers, updateUserDebt, updateSeller } = useApiData();

    const { formatMoney } = useCurrency();
    const { toast } = useToast();

    const [sellers, setSellers] = useState<IceCreamSeller[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Estados para Modales
    const [isAmortizeOpen, setIsAmortizeOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedSeller, setSelectedSeller] = useState<IceCreamSeller | null>(null);
    const [editingSeller, setEditingSeller] = useState<Partial<IceCreamSeller>>({});

    const [amountToPay, setAmountToPay] = useState<string>("");
    const [paymentNote, setPaymentNote] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    // Cálculos de validación
    const currentDebt = selectedSeller?.debt ?? selectedSeller?.currentDebt ?? 0;
    const numericAmount = parseFloat(amountToPay || "0");
    const isAmountExcessive = numericAmount > currentDebt;
    const isAmountInvalid = isNaN(numericAmount) || numericAmount <= 0;

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getSellers();
            // Normalización de datos para asegurar compatibilidad
            const normalizedData = data.map(s => ({
                ...s,
                debt: s.debt ?? s.currentDebt ?? 0
            }));
            setSellers(normalizedData);
        } catch (error) {
            console.error("Error cargando heladeros", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredSellers = sellers.filter(seller => {
        const search = searchTerm.toLowerCase();
        return (
            seller.name?.toLowerCase().includes(search) ||
            seller.email?.toLowerCase().includes(search) ||
            seller.dni?.includes(search)
        );
    });

    // --- LÓGICA DE AMORTIZACIÓN (COBRANZA) ---
    const handleOpenAmortize = (seller: IceCreamSeller) => {
        setSelectedSeller(seller);
        setAmountToPay("");
        setPaymentNote("");
        setIsAmortizeOpen(true);
    };

    const handleConfirmPayment = async () => {
        if (!selectedSeller?.id || isAmountInvalid || isAmountExcessive) return;
        setIsProcessing(true);
        try {
            const success = await updateUserDebt(selectedSeller.id, numericAmount, paymentNote);
            if (success) {
                // Actualización optimista de la tabla
                setSellers(prev => prev.map(s =>
                    s.id === selectedSeller.id
                        ? { ...s, debt: (s.debt || 0) - numericAmount, currentDebt: (s.currentDebt || 0) - numericAmount }
                        : s
                ));
                setIsAmortizeOpen(false);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    // --- LÓGICA DE EDICIÓN DE PERFIL ---
    const handleOpenEdit = (seller: IceCreamSeller) => {
        setEditingSeller({ ...seller });
        setIsEditOpen(true);
    };

    const handleSaveSellerChanges = async () => {
        if (!editingSeller.id || !editingSeller.name) return;
        setIsProcessing(true);
        try {
            await updateSeller(editingSeller.id, editingSeller as IceCreamSeller);
            setSellers(prev => prev.map(s => s.id === editingSeller.id ? { ...s, ...editingSeller } as IceCreamSeller : s));
            setIsEditOpen(false);
            toast({ title: "Cambios guardados", description: `Se actualizó el perfil de ${editingSeller.name}.` });
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[50vh]">
                    <p className="text-muted-foreground animate-pulse">Cargando información de cartera...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Cartera de Heladeros</h1>
                        <p className="text-muted-foreground">Administración de límites de crédito y cobranzas en tiempo real.</p>
                    </div>
                    <div className="relative w-full md:w-auto">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar heladero..."
                            className="pl-9 w-full md:w-[300px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="bg-red-50 dark:bg-red-900/10 border-red-100">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-red-600 mb-1">Deuda Total Cartera</p>
                                <h2 className="text-3xl font-bold text-red-700">
                                    {formatMoney(sellers.reduce((acc, curr) => acc + (curr.debt || 0), 0))}
                                </h2>
                            </div>
                            <Banknote className="h-12 w-12 text-red-200" />
                        </CardContent>
                    </Card>
                    <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600 mb-1">Crédito Global Asignado</p>
                                <h2 className="text-3xl font-bold text-blue-700">
                                    {formatMoney(sellers.reduce((acc, curr) => acc + (curr.creditLimit || 0), 0))}
                                </h2>
                            </div>
                            <Wallet className="h-12 w-12 text-blue-200" />
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Listado de Cuentas Corrientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Heladero</TableHead>
                                        <TableHead>Estado de Crédito</TableHead>
                                        <TableHead className="text-right">Deuda Pendiente</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSellers.map((seller) => (
                                        <TableRow key={seller.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center">
                                                        <User className="h-4 w-4 text-slate-500"/>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-sm">{seller.name}</span>
                                                        <span className="text-[10px] text-muted-foreground">{seller.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-bold text-blue-600">
                                                        Disp: {formatMoney((seller.creditLimit || 0) - (seller.debt || 0))}
                                                    </span>
                                                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500"
                                                            style={{ width: `${Math.min(100, ((seller.debt || 0) / (seller.creditLimit || 1)) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-red-600">
                                                {formatMoney(seller.debt || 0)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => handleOpenEdit(seller)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700"
                                                        disabled={(seller.debt || 0) <= 0}
                                                        onClick={() => handleOpenAmortize(seller)}
                                                    >
                                                        <ArrowDownCircle className="h-4 w-4 mr-2" />
                                                        Cobrar
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* MODAL EDITAR PERFIL Y CRÉDITO */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2"><Edit className="w-5 h-5"/> Editar Perfil</DialogTitle>
                            <DialogDescription>Actualiza los datos personales y el límite de compra del heladero.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Nombre</Label>
                                    <Input value={editingSeller.name || ''} onChange={e => setEditingSeller({...editingSeller, name: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">DNI</Label>
                                    <Input value={editingSeller.dni || ''} onChange={e => setEditingSeller({...editingSeller, dni: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Email</Label>
                                    <Input value={editingSeller.email || ''} onChange={e => setEditingSeller({...editingSeller, email: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Teléfono</Label>
                                    <Input value={editingSeller.phone || ''} onChange={e => setEditingSeller({...editingSeller, phone: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Dirección</Label>
                                <Input value={editingSeller.address || ''} onChange={e => setEditingSeller({...editingSeller, address: e.target.value})} />
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <Label className="text-blue-700 font-bold mb-2 block">Límite de Crédito (S/)</Label>
                                <Input
                                    type="number"
                                    className="text-lg font-bold"
                                    value={editingSeller.creditLimit || 0}
                                    onChange={e => setEditingSeller({...editingSeller, creditLimit: parseFloat(e.target.value) || 0})}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSaveSellerChanges} disabled={isProcessing}>Guardar Cambios</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* MODAL COBRANZA */}
                <Dialog open={isAmortizeOpen} onOpenChange={setIsAmortizeOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Registrar Pago</DialogTitle>
                            <DialogDescription>Ingresa el monto recibido de {selectedSeller?.name}.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="p-4 bg-slate-50 rounded-lg flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Deuda actual:</span>
                                <span className="text-xl font-bold text-red-600">{formatMoney(currentDebt)}</span>
                            </div>
                            <div className="space-y-2">
                                <Label>Monto a Amortizar</Label>
                                <Input
                                    type="number"
                                    className="text-xl h-12 font-bold"
                                    value={amountToPay}
                                    onChange={e => setAmountToPay(e.target.value)}
                                />
                                {isAmountExcessive && <p className="text-xs text-red-600">El monto no puede superar la deuda.</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="note">Concepto / Nota (Opcional)</Label>
                                <Input
                                    id="note"
                                    placeholder="Ej. Pago parcial efectivo..."
                                    value={paymentNote}
                                    onChange={(e) => setPaymentNote(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAmortizeOpen(false)}>Cancelar</Button>
                            <Button
                                className="bg-green-600 hover:bg-green-700"
                                disabled={isProcessing || isAmountInvalid || isAmountExcessive}
                                onClick={handleConfirmPayment}
                            >
                                Confirmar Pago
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default IceCreamSellers;