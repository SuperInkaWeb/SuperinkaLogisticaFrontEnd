import React, { useEffect, useState } from 'react';
import DashboardLayout from "@/frontend/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, MoreHorizontal, Copy, Pencil, Trash2, ChevronLeft, ChevronRight, Box, MapPin } from "lucide-react";
import StatusBadge from "@/frontend/components/ui/StatusBadge";
import { useApiData, Product, Warehouse } from "@/hooks/useApiData";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/context/CurrencyContext";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const Inventory: React.FC = () => {
    const { getProducts, getWarehouses, createProduct, updateProduct, deleteProduct } = useApiData();
    const { formatMoney } = useCurrency();
    const { toast } = useToast();

    const [products, setProducts] = useState<Product[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const [formData, setFormData] = useState<Partial<Product>>({
        name: '', sku: '', category: '', stock: 0, price: 0, status: 'normal', minStock: 5,
        volumeFactor: 1.0, warehouseId: ''
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [productsData, warehousesData] = await Promise.all([
                getProducts(),
                getWarehouses()
            ]);
            setProducts(Array.isArray(productsData) ? productsData : []);
            setWarehouses(Array.isArray(warehousesData) ? warehousesData : []);
        } catch (error) { setProducts([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    // Helper para convertir el factor numérico a string consistente para el Select
    const getVolumeFactorValue = (factor?: number) => {
        if (factor === 0.5) return "0.5";
        if (factor === 2.0) return "2.0";
        return "1.0"; // Default
    };

    const validateForm = () => {
        if (!formData.name?.trim()) { toast({ variant: "destructive", title: "Error", description: "Nombre requerido" }); return false; }
        if (!formData.sku?.replace('SKU-','').trim()) { toast({ variant: "destructive", title: "Error", description: "SKU requerido" }); return false; }
        if (!formData.warehouseId) { toast({ variant: "destructive", title: "Error", description: "Debes seleccionar un almacén" }); return false; }
        return true;
    };

    const preparePayload = (data: Partial<Product>) => {
        const payload: any = { ...data };
        if (data.warehouseId) { payload.warehouse = { id: data.warehouseId }; }
        delete payload.warehouseId;
        return payload;
    };

    const handleCreate = async () => {
        if (!validateForm()) return;
        try {
            const payload = preparePayload(formData);
            await createProduct(payload as Product);
            setIsCreateOpen(false);
            resetForm();
            loadData();
        } catch (e) { console.error(e); }
    };

    const handleUpdate = async () => {
        if (!selectedProduct?.id) return;
        if (!validateForm()) return;
        try {
            const payload = preparePayload(formData);
            await updateProduct(selectedProduct.id, payload as Product);
            setIsEditOpen(false);
            loadData();
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar este producto?")) {
            await deleteProduct(id);
            loadData();
        }
    };

    const openEdit = (product: Product) => {
        setSelectedProduct(product);
        setFormData({
            ...product,
            warehouseId: product.warehouse?.id || ''
        });
        setIsEditOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: '', sku: '', category: '', stock: 0, price: 0, status: 'normal', minStock: 5,
            volumeFactor: 1.0, warehouseId: ''
        });
    };

    const copySku = (sku: string) => {
        navigator.clipboard.writeText(sku);
        toast({ description: "SKU copiado" });
    };

    const handleSkuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setFormData({ ...formData, sku: `SKU-${value}` });
    };

    const getSkuNumber = (fullSku?: string) => fullSku ? fullSku.replace('SKU-', '') : '';

    const getSizeLabel = (factor?: number) => {
        if (factor === 0.5) return "Pequeño (0.5)";
        if (factor === 2.0) return "Grande (2.0)";
        return "Normal (1.0)";
    };

    const filteredProducts = products.filter(product => {
        if (!product) return false;
        const name = product.name ? product.name.toString() : '';
        const sku = product.sku ? product.sku.toString() : '';
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sku.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Inventario</h1>
                        <p className="text-muted-foreground">Gestión de productos y stock.</p>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if(!open) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90 shadow-lg"><Plus className="mr-2 h-4 w-4" /> Nuevo Producto</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Nuevo Producto</DialogTitle>
                                <DialogDescription>Ingresa los datos del producto. Asigna almacén y tamaño.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Nombre *</Label>
                                        <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Paleta Fresa" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>SKU *</Label>
                                        <div className="flex items-center">
                                            <span className="bg-muted px-3 py-2 border border-r-0 rounded-l-md text-muted-foreground text-sm h-10 flex items-center">SKU-</span>
                                            <Input className="rounded-l-none" placeholder="001" value={getSkuNumber(formData.sku)} onChange={handleSkuChange} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Categoría</Label>
                                        <Input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Ej: Helados" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Precio</Label>
                                        <Input type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Stock Inicial</Label>
                                        <Input type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Almacén *</Label>
                                        <Select onValueChange={(val) => setFormData({...formData, warehouseId: val})} value={formData.warehouseId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar Almacén" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {warehouses.map(w => (
                                                    <SelectItem key={w.id} value={w.id || 'err'}>
                                                        {w.name} ({w.city})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Tamaño / Volumen *</Label>
                                        {/* CORRECCIÓN AQUÍ: Usar getVolumeFactorValue para asegurar coincidencia */}
                                        <Select
                                            onValueChange={(val) => setFormData({...formData, volumeFactor: parseFloat(val)})}
                                            value={getVolumeFactorValue(formData.volumeFactor)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar Tamaño" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0.5">Pequeño (0.5 cajas)</SelectItem>
                                                <SelectItem value="1.0">Normal (1.0 caja)</SelectItem>
                                                <SelectItem value="2.0">Grande (2.0 cajas)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-muted-foreground">Define cuánto espacio ocupa en el almacén.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Estado Inicial</Label>
                                        <Select onValueChange={(val: any) => setFormData({...formData, status: val})} value={formData.status}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="normal">Normal</SelectItem>
                                                <SelectItem value="bajo">Bajo Stock</SelectItem>
                                                <SelectItem value="agotado">Agotado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreate}>Guardar Producto</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Editar Producto</DialogTitle>
                            <DialogDescription>Modifica los detalles del producto.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nombre</Label>
                                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>SKU</Label>
                                    <div className="flex items-center">
                                        <span className="bg-muted px-3 py-2 border border-r-0 rounded-l-md text-muted-foreground text-sm h-10 flex items-center">SKU-</span>
                                        <Input className="rounded-l-none" value={getSkuNumber(formData.sku)} onChange={handleSkuChange} />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Precio</Label>
                                    <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Stock</Label>
                                    <Input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Almacén</Label>
                                    <Select onValueChange={(val) => setFormData({...formData, warehouseId: val})} value={formData.warehouseId}>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar Almacén" /></SelectTrigger>
                                        <SelectContent>
                                            {warehouses.map(w => (
                                                <SelectItem key={w.id} value={w.id || 'err'}>{w.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Tamaño</Label>
                                    {/* CORRECCIÓN AQUÍ TAMBIÉN */}
                                    <Select
                                        onValueChange={(val) => setFormData({...formData, volumeFactor: parseFloat(val)})}
                                        value={getVolumeFactorValue(formData.volumeFactor)}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Tamaño" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0.5">Pequeño (0.5)</SelectItem>
                                            <SelectItem value="1.0">Normal (1.0)</SelectItem>
                                            <SelectItem value="2.0">Grande (2.0)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleUpdate}>Actualizar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* TABLA ... (El resto se mantiene igual) */}
                <Card className="shadow-sm border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div className="relative w-full sm:w-96">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Buscar por nombre o SKU..." className="pl-9 bg-white dark:bg-gray-900" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div> :
                            <div className="space-y-4">
                                <div className="rounded-md border bg-white dark:bg-gray-900">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50 dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-800">
                                                <TableHead>Producto</TableHead>
                                                <TableHead>SKU</TableHead>
                                                <TableHead>Almacén</TableHead>
                                                <TableHead>Tamaño</TableHead>
                                                <TableHead className="text-right">Stock</TableHead>
                                                <TableHead className="text-right">Precio</TableHead>
                                                <TableHead>Estado</TableHead>
                                                <TableHead className="text-right">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedProducts.map((product, index) => (
                                                <TableRow key={product?.id || index} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/50">
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-300 shadow-inner">
                                                                {(product?.name || '?').substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span>{product?.name || 'Sin Nombre'}</span>
                                                                <span className="text-[10px] text-muted-foreground">{product.category}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs">{product?.sku || '---'}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <MapPin className="h-3 w-3" />
                                                            {product.warehouse?.name || 'Sin Asignar'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1 text-xs font-medium">
                                                            <Box className="h-3 w-3 text-slate-400" />
                                                            {getSizeLabel(product.volumeFactor)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">{product?.stock ?? 0}</TableCell>
                                                    <TableCell className="text-right text-muted-foreground">{formatMoney(product?.price ?? 0)}</TableCell>
                                                    <TableCell><StatusBadge status={product?.status || 'normal'} /></TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Abrir menú</span><MoreHorizontal className="h-4 w-4" /></Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => copySku(product.sku)}><Copy className="mr-2 h-4 w-4" /> Copiar SKU</DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => openEdit(product)}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                                                <DropdownMenuItem className="text-red-600" onClick={() => product.id && handleDelete(product.id)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                {/* Paginador (igual que antes) */}
                                <div className="flex items-center justify-end space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                                    <div className="text-sm text-muted-foreground">Página {currentPage} de {totalPages || 1}</div>
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        }
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default Inventory;