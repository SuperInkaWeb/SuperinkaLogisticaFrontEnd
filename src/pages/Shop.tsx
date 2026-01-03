import React, { useEffect, useState } from 'react';
import DashboardLayout from "@/frontend/components/layout/DashboardLayout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useApiData, Product } from "@/hooks/useApiData";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { ShoppingCart, Plus, Minus, Search, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const Shop: React.FC = () => {
    const { getProducts } = useApiData();
    const { addToCart } = useCart();
    const { formatMoney } = useCurrency();
    const { toast } = useToast();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Todos");

    // Estado para manejar las cantidades individuales de cada producto en el catálogo
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true);
            const data = await getProducts();
            setProducts(Array.isArray(data) ? data : []);
            setLoading(false);
        };
        loadProducts();
    }, [getProducts]);

    // Manejar cambio de cantidad local
    const handleQuantityChange = (productId: string, val: string) => {
        // Si el valor está vacío (usuario borró todo), guardamos 0 para mostrar input vacío
        if (val === "") {
            setQuantities(prev => ({ ...prev, [productId]: 0 }));
            return;
        }

        const qty = parseInt(val);
        if (!isNaN(qty) && qty >= 0) {
            setQuantities(prev => ({ ...prev, [productId]: qty }));
        }
    };

    const adjustQuantity = (productId: string, delta: number) => {
        setQuantities(prev => {
            // Si es undefined, asumimos que empieza en 1. Si es 0 (borrado), empezamos de 0.
            const current = prev[productId] !== undefined ? prev[productId] : 1;
            const newValue = Math.max(1, current + delta); // Mínimo 1 al usar botones
            return { ...prev, [productId]: newValue };
        });
    };

    const handleAddToCart = (product: Product) => {
        if (!product.id) return;

        // Obtener cantidad actual, default a 1 si no se ha tocado
        const qtyState = quantities[product.id];
        const qty = qtyState !== undefined ? qtyState : 1;

        if (qty <= 0) {
            toast({ variant: "destructive", title: "Cantidad inválida", description: "Debes agregar al menos 1 unidad." });
            return;
        }

        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: qty,
            category: product.category
        });

        toast({
            title: "Agregado al carrito",
            description: `${qty} x ${product.name}`,
        });

        // Resetear a 1 después de agregar para facilitar siguiente compra
        setQuantities(prev => ({ ...prev, [product.id!]: 1 }));
    };

    const filteredProducts = products.filter(p =>
        (selectedCategory === "Todos" || p.category === selectedCategory) &&
        (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const categories = ["Todos", ...Array.from(new Set(products.map(p => p.category)))];

    if (loading) {
        return (
            <DashboardLayout>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
                    {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-xl" />)}
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Catálogo</h1>
                        <p className="text-muted-foreground">Realiza tus pedidos para el día.</p>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar producto..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Categorías */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {categories.map(cat => (
                        <Badge
                            key={cat}
                            variant={selectedCategory === cat ? "default" : "outline"}
                            className="cursor-pointer px-4 py-1.5 text-sm hover:bg-primary/90 hover:text-primary-foreground"
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </Badge>
                    ))}
                </div>

                {/* Grid de Productos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map((product) => {
                        // CORRECCIÓN CLAVE: Usar !== undefined para respetar el 0 cuando el usuario borra
                        const qtyState = quantities[product.id!];
                        const qty = qtyState !== undefined ? qtyState : 1;

                        return (
                            <Card key={product.id} className="flex flex-col border-0 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden">
                                <div className="aspect-square bg-slate-50 dark:bg-slate-900 relative flex items-center justify-center">
                                    {product.stock <= 0 && (
                                        <div className="absolute inset-0 bg-white/60 dark:bg-black/60 z-10 flex items-center justify-center">
                                            <Badge variant="destructive" className="text-lg px-4 py-1">AGOTADO</Badge>
                                        </div>
                                    )}
                                    <div className="text-6xl select-none opacity-20">
                                        {product.name.charAt(0).toUpperCase()}
                                    </div>
                                    <Badge className="absolute top-2 right-2 bg-white/90 text-black hover:bg-white shadow-sm backdrop-blur-sm">
                                        Stock: {product.stock}
                                    </Badge>
                                </div>

                                <CardHeader className="p-4 pb-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg line-clamp-1" title={product.name}>{product.name}</CardTitle>
                                            <CardDescription className="text-xs font-mono mt-1">{product.sku}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-4 flex-1">
                                    <div className="flex justify-between items-baseline mb-4">
                                        <span className="text-2xl font-bold text-primary">{formatMoney(product.price)}</span>
                                        <span className="text-xs text-muted-foreground capitalize">{product.category}</span>
                                    </div>
                                </CardContent>

                                <CardFooter className="p-4 pt-0 flex flex-col gap-3">
                                    <div className="flex items-center w-full gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-9 w-9 shrink-0"
                                            onClick={() => product.id && adjustQuantity(product.id, -1)}
                                            disabled={product.stock <= 0}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>

                                        <Input
                                            type="number"
                                            min="1"
                                            max={product.stock}
                                            className="h-9 text-center font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            // Si es 0, mostramos cadena vacía para que se vea limpio
                                            value={qty === 0 ? "" : qty}
                                            onChange={(e) => product.id && handleQuantityChange(product.id, e.target.value)}
                                            disabled={product.stock <= 0}
                                            placeholder="1"
                                        />

                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-9 w-9 shrink-0"
                                            onClick={() => product.id && adjustQuantity(product.id, 1)}
                                            disabled={product.stock <= 0}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    <Button
                                        className="w-full font-semibold shadow-sm hover:shadow-md transition-all active:scale-95"
                                        onClick={() => handleAddToCart(product)}
                                        // Deshabilitar si no hay stock o si el usuario dejó el campo vacío/0
                                        disabled={product.stock <= 0 || qty <= 0}
                                    >
                                        <ShoppingCart className="mr-2 h-4 w-4" /> Agregar al Carrito
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}

                    {filteredProducts.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Package className="h-16 w-16 opacity-20 mb-4" />
                            <p className="text-lg">No se encontraron productos.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Shop;