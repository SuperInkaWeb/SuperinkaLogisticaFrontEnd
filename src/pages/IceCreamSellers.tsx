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
import { Search, Wallet, Truck, ArrowDownCircle, AlertCircle, Banknote } from "lucide-react";

const IceCreamSellers: React.FC = () => {
    const { getSellers, updateUserDebt } = useApiData();

    const { formatMoney } = useCurrency();
    const { toast } = useToast();

    const [sellers, setSellers] = useState<IceCreamSeller[]>([]);
    const [loading, setLoading] = useState(true);

    // Estado para Buscador
    const [searchTerm, setSearchTerm] = useState("");

    // Estados para Modal de Amortización
    const [isAmortizeOpen, setIsAmortizeOpen] = useState(false);
    const [selectedSeller, setSelectedSeller] = useState<IceCreamSeller | null>(null);
    const [amountToPay, setAmountToPay] = useState<string>("");
    const [paymentNote, setPaymentNote] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    // ESTADO DERIVADO PARA VALIDACIÓN PREVENTIVA
    // Calculamos si el monto es inválido en tiempo real
    const currentDebt = selectedSeller?.debt || 0;
    const numericAmount = parseFloat(amountToPay || "0");
    const isAmountExcessive = numericAmount > currentDebt;
    const isAmountInvalid = isNaN(numericAmount) || numericAmount <= 0;

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getSellers();

            // NORMALIZACIÓN DE DATOS
            const normalizedData = data.map(seller => ({
                ...seller,
                debt: seller.debt ?? seller.currentDebt ?? 0
            }));

            const filtered = normalizedData.filter(u =>
                (u.role?.toLowerCase().includes('heladero')) || ((u.debt || 0) > 0)
            );

            setSellers(filtered.sort((a, b) => (b.debt || 0) - (a.debt || 0)));
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
        const nameMatch = seller.name?.toLowerCase().includes(search);
        const codeMatch = seller.code?.toLowerCase().includes(search);
        return nameMatch || codeMatch;
    });

    const handleOpenAmortize = (seller: IceCreamSeller) => {
        setSelectedSeller(seller);
        setAmountToPay("");
        setPaymentNote("");
        setIsAmortizeOpen(true);
    };

    const handleConfirmPayment = async () => {
        if (!selectedSeller || !amountToPay || !selectedSeller.id) return;

        // Validación final antes de enviar (redundante con el botón disabled, pero segura)
        if (isAmountInvalid || isAmountExcessive) {
            toast({ variant: "destructive", title: "Error", description: "Monto inválido o excede la deuda." });
            return;
        }

        setIsProcessing(true);

        try {
            const success = await updateUserDebt(selectedSeller.id, numericAmount, paymentNote);

            if (success) {
                const updatedSellers = sellers.map(s => {
                    if (s.id === selectedSeller.id) {
                        return { ...s, debt: (s.debt || 0) - numericAmount };
                    }
                    return s;
                });

                setSellers(updatedSellers);
                setIsAmortizeOpen(false);
            } else {
                // El hook useApiData ya mostró el toast de error genérico,
                // pero aquí podríamos mostrar algo específico si el backend devuelve el mensaje.
                // Por ahora confiamos en que el hook maneja el mensaje.
            }
        } catch (error) {
            console.error("Error al amortizar", error);
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[50vh]">
                    <p className="text-muted-foreground">Cargando cartera...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">

                {/* CABECERA */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Cartera de Heladeros</h1>
                        <p className="text-muted-foreground">Control de cuentas corrientes y recaudación.</p>
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

                {/* RESUMEN RÁPIDO */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-slate-50 dark:bg-slate-900/50">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Deuda Total Cartera</p>
                                <h2 className="text-2xl font-bold text-red-600">
                                    {formatMoney(sellers.reduce((acc, curr) => acc + (curr.debt || 0), 0))}
                                </h2>
                            </div>
                            <Banknote className="h-8 w-8 text-red-200" />
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50 dark:bg-slate-900/50">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Heladeros con Deuda</p>
                                <h2 className="text-2xl font-bold">
                                    {sellers.filter(s => (s.debt || 0) > 0).length}
                                </h2>
                            </div>
                            <Truck className="h-8 w-8 text-slate-200" />
                        </CardContent>
                    </Card>
                </div>

                {/* TABLA DE HELADEROS */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>Listado de Deudores</CardTitle>
                        <CardDescription>Gestión de pagos fuera de liquidación.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Heladero</TableHead>
                                        <TableHead>Contacto</TableHead>
                                        <TableHead className="text-right">Deuda Actual</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSellers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                                No se encontraron heladeros con los criterios actuales.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredSellers.map((seller) => (
                                            <TableRow key={seller.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                                                            <Truck className="h-4 w-4"/>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{seller.name}</span>
                                                            {seller.code && <span className="text-xs text-muted-foreground">COD: {seller.code}</span>}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">{seller.email}</div>
                                                    <div className="text-xs text-muted-foreground">{seller.phone || 'Sin teléfono'}</div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {(seller.debt || 0) > 0 ? (
                                                        <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 text-sm py-1 px-2">
                                                            {formatMoney(seller.debt || 0)}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100">
                                                            Solvente
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        className={`
                                                    ${(seller.debt || 0) > 0
                                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}
                                                `}
                                                        disabled={(seller.debt || 0) <= 0}
                                                        onClick={() => handleOpenAmortize(seller)}
                                                    >
                                                        <Wallet className="h-4 w-4 mr-2" />
                                                        Amortizar
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* MODAL DE AMORTIZACIÓN */}
                <Dialog open={isAmortizeOpen} onOpenChange={setIsAmortizeOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-green-700">
                                <ArrowDownCircle className="h-5 w-5" />
                                Registrar Amortización
                            </DialogTitle>
                            <DialogDescription>
                                Ingresa el pago en efectivo recibido de <strong>{selectedSeller?.name}</strong>.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-6 py-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border flex justify-between items-center">
                                <div className="flex gap-2 items-center text-muted-foreground">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="text-sm font-medium">Deuda Pendiente:</span>
                                </div>
                                <span className="text-2xl font-bold text-red-600">{formatMoney(currentDebt)}</span>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="amount" className="text-base">Monto a Pagar</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-slate-500 font-bold text-lg">$</span>
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder="0.00"
                                        className={`pl-8 text-xl font-bold h-12 ${isAmountExcessive ? 'border-red-500 bg-red-50 text-red-700' : ''}`}
                                        value={amountToPay}
                                        onChange={(e) => setAmountToPay(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                {/* Mensaje de Error en Tiempo Real */}
                                {isAmountExcessive && (
                                    <p className="text-xs text-red-600 font-semibold flex items-center gap-1 animate-pulse">
                                        <AlertCircle className="h-3 w-3"/> El monto no puede ser mayor a la deuda ({formatMoney(currentDebt)})
                                    </p>
                                )}
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
                            <Button variant="outline" onClick={() => setIsAmortizeOpen(false)} disabled={isProcessing}>
                                Cancelar
                            </Button>
                            {/* Botón condicionalmente deshabilitado si el monto es erróneo */}
                            <Button
                                onClick={handleConfirmPayment}
                                className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
                                disabled={isProcessing || isAmountInvalid || isAmountExcessive}
                            >
                                {isProcessing ? "Procesando..." : "Confirmar Pago"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </DashboardLayout>
    );
};

export default IceCreamSellers;