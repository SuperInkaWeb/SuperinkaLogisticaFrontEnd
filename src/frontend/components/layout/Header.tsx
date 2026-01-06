import {
    Bell,
    Menu,
    ShoppingCart,
    Loader2,
    Package,
    X,
    Wallet,
    AlertCircle,
    Minus,
    Plus,
    Truck,
    Store,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/frontend/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { useCurrency } from "@/context/CurrencyContext";
import { useApiData, Order, OrderItem } from "@/hooks/useApiData";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface HeaderProps {
    onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
    const { user, logout } = useAuth();
    const { items, itemCount, total, removeFromCart, clearCart, updateQuantity } = useCart();
    const { formatMoney } = useCurrency();
    const { createOrder, getSellers } = useApiData();
    const { toast } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [creditInfo, setCreditInfo] = useState<{ limit: number, debt: number, available: number } | null>(null);
    const [deliveryType, setDeliveryType] = useState<'delivery' | 'warehouse'>('delivery');

    const role = user?.role?.toLowerCase().replace('role_', '') || 'operador';
    const isHeladero = role === 'heladero';
    const isCliente = role === 'cliente';

    // Generación de iniciales dinámica para Avatar
    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : user?.email?.substring(0, 2).toUpperCase() || "US";

    useEffect(() => {
        if ((isCliente || isHeladero) && user?.id) {
            getSellers().then(sellers => {
                const me = sellers.find(s => s.id === user.id || s.email?.toLowerCase() === user.email?.toLowerCase());
                if (me) {
                    const limit = me.creditLimit || 0;
                    const debt = me.debt ?? me.currentDebt ?? 0;
                    setCreditInfo({ limit, debt, available: limit - debt });
                }
            }).catch(() => {});
        }
        if (isHeladero) setDeliveryType('warehouse');
    }, [user, isCartOpen, getSellers, isHeladero, isCliente]);

    const handleCheckout = async () => {
        if (items.length === 0) return;

        // Validación de crédito
        if (creditInfo && total > creditInfo.available) {
            toast({
                variant: "destructive",
                title: "Crédito Insuficiente",
                description: `Tu pedido (${formatMoney(total)}) excede tu saldo disponible (${formatMoney(creditInfo.available)}).`
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const now = new Date();
            const orderItems: OrderItem[] = items.map(ci => ({
                productId: ci.id,
                productName: ci.name,
                quantity: ci.quantity,
                price: ci.price
            }));

            const newOrder: Order = {
                orderNumber: `ORD-${Date.now()}`,
                origin: "Tienda Online",
                destination: deliveryType === 'delivery' ? "Domicilio Cliente" : "Recojo en Almacén",
                total: total,
                productsCount: itemCount,
                status: "pendiente",
                date: now.toISOString().split('T')[0],
                time: now.toTimeString().split(' ')[0],
                items: orderItems,
                deliveryType: deliveryType,
                paymentStatus: 'pending'
            };

            await createOrder(newOrder);

            toast({
                title: "¡Pedido Confirmado!",
                description: `Orden ${newOrder.orderNumber} registrada exitosamente.`
            });

            clearCart();
            setIsCartOpen(false);

            // Actualización optimista del crédito local
            if (creditInfo) {
                setCreditInfo(prev => prev ? ({ ...prev, available: prev.available - total, debt: prev.debt + total }) : null);
            }
        } catch (error) {
            console.error("Error procesando pedido", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <header className="flex items-center justify-between h-16 px-6 border-b bg-white dark:bg-gray-900 shrink-0 sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
                    <Menu className="h-5 w-5" />
                </Button>
                <h2 className="text-lg font-semibold hidden md:block text-gray-800 dark:text-gray-200">
                    {isCliente || isHeladero ? `Hola, ${user?.name || 'Usuario'}` : 'Panel Administrativo'}
                </h2>
            </div>

            <div className="flex items-center gap-4">
                {(isCliente || isHeladero) && creditInfo && (
                    <div className={`flex flex-col items-end px-3 py-1 rounded-lg border-2 shadow-sm ${creditInfo.available < 50 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                        <span className="text-[10px] font-bold uppercase flex items-center gap-1"><Wallet className="h-3 w-3"/> Crédito Disp.</span>
                        <span className="text-sm font-black">{formatMoney(creditInfo.available)}</span>
                    </div>
                )}

                {(isCliente || isHeladero) && (
                    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 dark:hover:bg-gray-800">
                                <ShoppingCart className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                {itemCount > 0 && (
                                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-orange-600 text-white rounded-full animate-in zoom-in">
                                        {itemCount}
                                    </Badge>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-full sm:max-w-md flex flex-col">
                            <SheetHeader className="pb-4 border-b">
                                <SheetTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary" /> Mi Carrito</SheetTitle>
                                <SheetDescription>Gestiona tus productos antes de finalizar el pedido.</SheetDescription>
                            </SheetHeader>

                            <ScrollArea className="flex-1 -mx-6 px-6">
                                {items.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                                        <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center"><Package className="h-10 w-10 opacity-30" /></div>
                                        <p>Tu carrito está vacío</p>
                                        <Button variant="outline" onClick={() => setIsCartOpen(false)}>Ir a Comprar</Button>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800 py-4">
                                        {items.map(item => (
                                            <div key={item.id} className="py-4 space-y-2 first:pt-0">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-bold text-sm truncate">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">{item.category}</p>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => item.id && removeFromCart(item.id)}><Trash2 className="h-4 w-4"/></Button>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => item.id && updateQuantity?.(item.id, Math.max(1, item.quantity - 1))}><Minus className="h-3 w-3"/></Button>
                                                        <span className="font-bold text-sm w-6 text-center">{item.quantity}</span>
                                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => item.id && updateQuantity?.(item.id, item.quantity + 1)}><Plus className="h-3 w-3"/></Button>
                                                    </div>
                                                    <p className="font-bold text-primary">{formatMoney(item.price * item.quantity)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>

                            {items.length > 0 && (
                                <div className="pt-4 border-t space-y-4 mt-auto">
                                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border">
                                        <Label className="text-xs font-bold uppercase mb-2 block text-muted-foreground">Método de Entrega</Label>
                                        <RadioGroup value={deliveryType} onValueChange={(v: 'delivery'|'warehouse') => setDeliveryType(v)} className="grid grid-cols-2 gap-2">
                                            <div>
                                                <RadioGroupItem value="delivery" id="r1" className="peer sr-only"/>
                                                <Label htmlFor="r1" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer text-center h-full">
                                                    <Truck className="mb-1 h-4 w-4" /><span className="text-xs font-bold">Envío</span>
                                                </Label>
                                            </div>
                                            {isHeladero && (
                                                <div>
                                                    <RadioGroupItem value="warehouse" id="r2" className="peer sr-only"/>
                                                    <Label htmlFor="r2" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer text-center h-full">
                                                        <Store className="mb-1 h-4 w-4" /><span className="text-xs font-bold">Recojo</span>
                                                    </Label>
                                                </div>
                                            )}
                                        </RadioGroup>
                                        {isCliente && !isHeladero && <p className="text-[10px] text-center mt-2 text-muted-foreground">* Solo envío a domicilio disponible.</p>}
                                    </div>

                                    {!isCreditSufficient && (
                                        <Alert variant="destructive" className="py-2">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertTitle className="text-xs font-bold ml-2">Saldo Insuficiente</AlertTitle>
                                            <AlertDescription className="text-xs ml-2">Necesitas {formatMoney(total - (creditInfo?.available || 0))} más de crédito.</AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>{formatMoney(total)}</span></div>
                                        <Separator className="my-2"/>
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold">Total a Pagar</span>
                                            <span className="text-2xl font-black text-primary">{formatMoney(total)}</span>
                                        </div>
                                    </div>

                                    <SheetFooter>
                                        <Button className="w-full h-12 text-lg shadow-lg shadow-primary/20" onClick={handleCheckout} disabled={isSubmitting || !isCreditSufficient}>
                                            {isSubmitting ? <><Loader2 className="animate-spin mr-2"/> Procesando...</> : "Finalizar Compra"}
                                        </Button>
                                    </SheetFooter>
                                </div>
                            )}
                        </SheetContent>
                    </Sheet>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full ml-2">
                            <Avatar className="h-10 w-10 border-2 border-white dark:border-gray-800 shadow-sm">
                                <AvatarImage src="" /> {/* Sin src para usar fallback */}
                                <AvatarFallback className="bg-gradient-to-tr from-orange-600 to-primary text-white font-black text-xs">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                        <DropdownMenuLabel>
                            <p className="font-bold truncate">{user?.name || "Usuario"}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                            <Badge variant="secondary" className="mt-1 text-[9px] uppercase">{role}</Badge>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 cursor-pointer focus:text-red-700 focus:bg-red-50" onClick={logout}>
                            <X className="mr-2 h-4 w-4" /> Cerrar Sesión
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
};

export default Header;