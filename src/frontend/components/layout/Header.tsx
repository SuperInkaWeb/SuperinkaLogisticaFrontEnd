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

interface AuthUser {
    id?: string;
    sub?: string;
    email?: string;
    name?: string;
    role?: string;
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

    // Estado para el tipo de entrega: 'delivery' o 'warehouse'
    const [deliveryType, setDeliveryType] = useState<'delivery' | 'warehouse'>('delivery');

    const role = user?.role?.toLowerCase().replace('role_', '') || 'operador';
    const isHeladero = role === 'heladero';
    const isCliente = role === 'cliente';

    // Generación de iniciales dinámica
    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : user?.email?.substring(0, 2).toUpperCase() || "US";

    useEffect(() => {
        const currentUser = user as unknown as AuthUser;
        const userId = currentUser?.id || currentUser?.sub;

        if ((isCliente || isHeladero) && userId) {
            getSellers().then(sellers => {
                const me = sellers.find(s =>
                    s.id === userId ||
                    s.email?.toLowerCase() === user?.email?.toLowerCase()
                );

                if (me) {
                    const limit = me.creditLimit || 0;
                    const debt = me.debt ?? me.currentDebt ?? 0;
                    setCreditInfo({
                        limit,
                        debt,
                        available: limit - debt
                    });
                }
            }).catch(() => {});
        }

        // Configurar default según rol
        if (isHeladero) {
            setDeliveryType('warehouse'); // Heladeros prefieren recoger por defecto
        } else {
            setDeliveryType('delivery'); // Clientes solo delivery
        }
    }, [user, role, isCartOpen, getSellers, isHeladero, isCliente]);

    const handleCheckout = async () => {
        if (items.length === 0) return;

        if (creditInfo && total > creditInfo.available) {
            toast({
                variant: "destructive",
                title: "Crédito Insuficiente",
                description: `Tu pedido (${formatMoney(total)}) excede tu disponible (${formatMoney(creditInfo.available)}).`
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const now = new Date();
            const timeString = now.toTimeString().split(' ')[0];
            const timestamp = Date.now();

            const orderItems: OrderItem[] = items.map(cartItem => ({
                productId: cartItem.id,
                productName: cartItem.name,
                quantity: cartItem.quantity,
                price: cartItem.price
            }));

            const newOrder: Order = {
                orderNumber: `ORD-${timestamp}`,
                origin: "Tienda Online",
                destination: deliveryType === 'delivery' ? "Domicilio Cliente" : "Recojo en Almacén",
                total: total,
                productsCount: itemCount,
                status: "pendiente",
                date: now.toISOString().split('T')[0],
                time: timeString,
                otn: `OTN-${timestamp}`,
                items: orderItems,
                deliveryType: deliveryType, // Enviar tipo seleccionado
                paymentStatus: 'pending'
            };

            await createOrder(newOrder);

            toast({
                title: "¡Pedido Enviado!",
                description: `Orden ${newOrder.orderNumber} creada (${deliveryType === 'delivery' ? 'Delivery' : 'Recojo'}).`,
            });

            clearCart();
            setIsCartOpen(false);

            if (creditInfo) {
                setCreditInfo(prev => prev ? ({
                    ...prev,
                    available: prev.available - total,
                    debt: prev.debt + total
                }) : null);
            }

        } catch (error) {
            console.error("Error al procesar pedido", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isCreditSufficient = !creditInfo || creditInfo.available >= total;

    return (
        <header className="flex items-center justify-between h-16 px-6 border-b bg-white dark:bg-gray-900 dark:border-gray-800 shrink-0 sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
                    <Menu className="h-5 w-5" />
                </Button>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 hidden md:block">
                    {isCliente || isHeladero ? `Hola, ${user?.name || 'Usuario'}` : 'Panel de Administración'}
                </h2>
            </div>

            <div className="flex items-center gap-4">

                {(isCliente || isHeladero) && creditInfo && (
                    <div className={`flex flex-col items-end text-xs mr-2 px-3 py-1.5 rounded-lg border-2 shadow-sm ${creditInfo.available < 50 ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800' : 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800'}`}>
                        <span className="font-semibold flex items-center gap-1">
                            <Wallet className="h-3 w-3" /> Crédito Disp.
                        </span>
                        <span className="font-bold text-base">{formatMoney(creditInfo.available)}</span>
                    </div>
                )}

                {(isCliente || isHeladero) && (
                    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors">
                                <ShoppingCart className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                {itemCount > 0 && (
                                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-orange-500 text-white text-[10px] font-bold rounded-full shadow-sm animate-in zoom-in">
                                        {itemCount}
                                    </Badge>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-full sm:max-w-md flex flex-col">
                            <SheetHeader className="space-y-2.5 pb-4 border-b">
                                <SheetTitle className="flex items-center gap-2 text-xl">
                                    <ShoppingCart className="h-5 w-5 text-primary" />
                                    Tu Carrito
                                </SheetTitle>
                                <SheetDescription>
                                    Revisa los productos antes de confirmar tu pedido.
                                </SheetDescription>
                            </SheetHeader>

                            <ScrollArea className="flex-1 -mx-6 px-6">
                                {items.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
                                        <div className="h-20 w-20 bg-slate-50 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                            <Package className="h-10 w-10 text-slate-300" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-lg font-medium text-slate-900 dark:text-slate-100">Tu carrito está vacío</p>
                                            <p className="text-sm text-slate-500">¡Agrega algunos deliciosos helados para empezar!</p>
                                        </div>
                                        <Button variant="outline" onClick={() => setIsCartOpen(false)}>
                                            Volver al Catálogo
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-0 divider-y divide-slate-100 dark:divide-gray-800 py-4">
                                        {items.map(item => (
                                            <div key={item.id} className="flex gap-4 py-4 first:pt-0">
                                                <div className="h-16 w-16 rounded-lg bg-slate-100 dark:bg-gray-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-gray-700">
                                                    <span className="text-xl font-bold text-slate-400">
                                                        {item.name.substring(0, 1).toUpperCase()}
                                                    </span>
                                                </div>

                                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                    <div>
                                                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                                                            {item.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500 truncate">{item.category}</p>
                                                    </div>

                                                    <div className="flex items-center justify-between mt-2">
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={() => item.id && updateQuantity && updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                            >
                                                                <Minus className="h-3 w-3" />
                                                            </Button>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                className="h-7 w-14 text-center px-1 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                value={item.quantity}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value);
                                                                    if (!isNaN(val) && val > 0 && item.id && updateQuantity) {
                                                                        updateQuantity(item.id, val);
                                                                    }
                                                                }}
                                                            />
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={() => item.id && updateQuantity && updateQuantity(item.id, item.quantity + 1)}
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </Button>
                                                        </div>

                                                        <p className="text-sm font-bold text-primary">
                                                            {formatMoney(item.price * item.quantity)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 self-start -mr-2"
                                                    onClick={() => item.id && removeFromCart(item.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Eliminar</span>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>

                            {items.length > 0 && (
                                <div className="space-y-4 pt-4 border-t mt-auto">

                                    {/* SELECCIÓN DE TIPO DE ENVÍO */}
                                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border">
                                        <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">Método de Entrega</Label>
                                        <RadioGroup
                                            value={deliveryType}
                                            onValueChange={(val: 'delivery' | 'warehouse') => setDeliveryType(val)}
                                            className="grid grid-cols-2 gap-2"
                                        >
                                            <div>
                                                <RadioGroupItem value="delivery" id="delivery" className="peer sr-only" />
                                                <Label
                                                    htmlFor="delivery"
                                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer text-center h-full"
                                                >
                                                    <Truck className="mb-1 h-5 w-5 text-primary" />
                                                    <span className="text-xs font-semibold">Delivery</span>
                                                </Label>
                                            </div>

                                            {/* Opción de Recojo: Solo habilitada para Heladeros (u otros roles staff) */}
                                            {isHeladero && (
                                                <div>
                                                    <RadioGroupItem value="warehouse" id="warehouse" className="peer sr-only" />
                                                    <Label
                                                        htmlFor="warehouse"
                                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer text-center h-full"
                                                    >
                                                        <Store className="mb-1 h-5 w-5 text-primary" />
                                                        <span className="text-xs font-semibold">Recojo Almacén</span>
                                                    </Label>
                                                </div>
                                            )}
                                        </RadioGroup>
                                        {isCliente && !isHeladero && (
                                            <p className="text-[10px] text-muted-foreground mt-2 text-center">
                                                * Los clientes solo tienen habilitado el envío a domicilio.
                                            </p>
                                        )}
                                    </div>

                                    {!isCreditSufficient && (
                                        <Alert variant="destructive" className="py-2">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertTitle className="text-xs font-bold ml-2">Crédito Insuficiente</AlertTitle>
                                            <AlertDescription className="text-xs ml-2">
                                                Dispones de {formatMoney(creditInfo?.available || 0)}. Te faltan {formatMoney(total - (creditInfo?.available || 0))}.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-sm text-slate-500">
                                            <span>Subtotal ({itemCount} productos)</span>
                                            <span>{formatMoney(total)}</span>
                                        </div>
                                        <Separator className="my-2" />
                                        <div className="flex justify-between items-center">
                                            <span className="text-base font-semibold text-slate-900 dark:text-slate-100">Total a Pagar</span>
                                            <span className={`text-2xl font-bold ${!isCreditSufficient ? 'text-red-500' : 'text-primary'}`}>
                                                {formatMoney(total)}
                                            </span>
                                        </div>
                                    </div>

                                    <SheetFooter>
                                        <Button
                                            className="w-full h-11 text-base shadow-lg shadow-primary/20"
                                            onClick={handleCheckout}
                                            disabled={isSubmitting || !isCreditSufficient}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...
                                                </>
                                            ) : (
                                                <>
                                                    Confirmar Pedido
                                                    <ShoppingCart className="ml-2 h-4 w-4" />
                                                </>
                                            )}
                                        </Button>
                                    </SheetFooter>
                                </div>
                            )}
                        </SheetContent>
                    </Sheet>
                )}

                {!isCliente && !isHeladero && (
                    <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors">
                        <Bell className="h-5 w-5 text-gray-500" />
                        <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
                    </Button>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all ml-1">
                            <Avatar className="h-9 w-9 border-2 border-white dark:border-gray-800 shadow-sm">
                                <AvatarImage src={""} alt={initials} />
                                <AvatarFallback className="bg-gradient-to-br from-primary to-orange-600 text-white font-bold text-xs">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none truncate">{user?.name || (isCliente || isHeladero ? "Usuario" : "Admin")}</p>
                                <p className="text-xs leading-none text-muted-foreground truncate">{user?.email}</p>
                                <Badge variant="secondary" className="w-fit mt-1 text-[10px] capitalize px-2 py-0 h-5">
                                    {role}
                                </Badge>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20" onClick={logout}>
                            <X className="mr-2 h-4 w-4" />
                            Cerrar Sesión
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
};

export default Header;