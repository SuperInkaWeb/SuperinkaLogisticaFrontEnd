import React, { useState } from 'react';
import { useProducts, useWarehouses, dataService } from '@/hooks/useSupabaseData';
import StatusBadge from '@/frontend/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, MoreHorizontal, Edit, ArrowRightLeft, Trash2, Plus, Filter, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';

const Inventory: React.FC = () => {
  const { data: products, loading: productsLoading, refetch } = useProducts();
  const { data: warehouses } = useWarehouses();
  const { formatPrice } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    category: '',
    stock: 0,
    min_stock: 10,
    warehouse_id: '',
    price: 0,
    status: 'normal' as 'normal' | 'bajo' | 'agotado',
    image_url: null as string | null,
  });
  const [editProduct, setEditProduct] = useState({
    id: '',
    sku: '',
    name: '',
    category: '',
    stock: 0,
    min_stock: 10,
    warehouse_id: '',
    price: 0,
  });
  const [moveToWarehouse, setMoveToWarehouse] = useState('');

  const categories = [...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesWarehouse = warehouseFilter === 'all' || product.warehouse_id === warehouseFilter;
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesWarehouse && matchesCategory;
  });

  const getWarehouseName = (warehouseId: string | null) => {
    if (!warehouseId) return '-';
    return warehouses.find(w => w.id === warehouseId)?.name || '-';
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await dataService.deleteProduct(productId);
      toast.success('Producto eliminado correctamente');
      refetch();
    } catch (error) {
      toast.error('Error al eliminar el producto');
    }
  };

  const handleOpenEdit = (product: any) => {
    setEditProduct({
      id: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      stock: product.stock,
      min_stock: product.min_stock,
      warehouse_id: product.warehouse_id || '',
      price: product.price,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateProduct = async () => {
    if (!editProduct.sku || !editProduct.name || !editProduct.category) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    setIsSubmitting(true);
    try {
      let status: 'normal' | 'bajo' | 'agotado' = 'normal';
      if (editProduct.stock === 0) {
        status = 'agotado';
      } else if (editProduct.stock < editProduct.min_stock) {
        status = 'bajo';
      }

      await dataService.updateProduct(editProduct.id, {
        sku: editProduct.sku,
        name: editProduct.name,
        category: editProduct.category,
        stock: editProduct.stock,
        min_stock: editProduct.min_stock,
        warehouse_id: editProduct.warehouse_id || null,
        price: editProduct.price,
        status,
      });
      toast.success('Producto actualizado correctamente');
      setIsEditDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error('Error al actualizar el producto');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenMove = (product: any) => {
    setSelectedProduct(product);
    setMoveToWarehouse('');
    setIsMoveDialogOpen(true);
  };

  const handleMoveProduct = async () => {
    if (!moveToWarehouse) {
      toast.error('Selecciona un almacén de destino');
      return;
    }

    if (moveToWarehouse === selectedProduct.warehouse_id) {
      toast.error('El producto ya está en este almacén');
      return;
    }

    setIsSubmitting(true);
    try {
      await dataService.updateProduct(selectedProduct.id, {
        warehouse_id: moveToWarehouse,
      });
      toast.success('Producto movido correctamente');
      setIsMoveDialogOpen(false);
      setSelectedProduct(null);
      refetch();
    } catch (error) {
      toast.error('Error al mover el producto');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.sku || !newProduct.name || !newProduct.category) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    setIsSubmitting(true);
    try {
      // Determinar el estado basado en el stock
      let status: 'normal' | 'bajo' | 'agotado' = 'normal';
      if (newProduct.stock === 0) {
        status = 'agotado';
      } else if (newProduct.stock < newProduct.min_stock) {
        status = 'bajo';
      }

      await dataService.createProduct({
        ...newProduct,
        status,
        warehouse_id: newProduct.warehouse_id || null,
      });
      toast.success('Producto creado correctamente');
      setIsDialogOpen(false);
      setNewProduct({
        sku: '',
        name: '',
        category: '',
        stock: 0,
        min_stock: 10,
        warehouse_id: '',
        price: 0,
        status: 'normal',
        image_url: null,
      });
      refetch();
    } catch (error) {
      toast.error('Error al crear el producto');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (productsLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventarios</h1>
            <p className="text-muted-foreground">Gestiona el inventario de productos</p>
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventarios</h1>
          <p className="text-muted-foreground">Gestiona el inventario de productos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-inka text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Producto</DialogTitle>
              <DialogDescription>
                Completa los datos del nuevo producto para agregarlo al inventario.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    placeholder="PRD-001"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    placeholder="Nombre del producto"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría *</Label>
                  <Input
                    id="category"
                    placeholder="Electrónica, Ropa, etc."
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Precio (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Actual</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_stock">Stock Mínimo</Label>
                  <Input
                    id="min_stock"
                    type="number"
                    min="0"
                    value={newProduct.min_stock}
                    onChange={(e) => setNewProduct({ ...newProduct, min_stock: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouse">Almacén</Label>
                <Select
                  value={newProduct.warehouse_id}
                  onValueChange={(value) => setNewProduct({ ...newProduct, warehouse_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar almacén" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} - {w.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateProduct} disabled={isSubmitting}>
                {isSubmitting ? 'Creando...' : 'Crear Producto'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar por nombre o SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Almacén" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los almacenes</SelectItem>
                {warehouses.map(w => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="bajo">Stock Bajo</SelectItem>
                <SelectItem value="agotado">Agotado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {filteredProducts.length} productos encontrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-center">Stock Actual</TableHead>
                  <TableHead className="text-center">Stock Mín.</TableHead>
                  <TableHead>Almacén</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {product.sku}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        {product.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-semibold ${
                        product.stock === 0 ? 'text-destructive' :
                        product.stock < product.min_stock ? 'text-warning' : 'text-foreground'
                      }`}>
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {product.min_stock}
                    </TableCell>
                    <TableCell className="text-sm">{getWarehouseName(product.warehouse_id)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatPrice(Number(product.price))}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={product.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEdit(product)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenMove(product)}>
                            <ArrowRightLeft className="mr-2 h-4 w-4" />
                            Mover a otro almacén
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>
              Modifica los datos del producto.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_sku">SKU *</Label>
                <Input
                  id="edit_sku"
                  value={editProduct.sku}
                  onChange={(e) => setEditProduct({ ...editProduct, sku: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_name">Nombre *</Label>
                <Input
                  id="edit_name"
                  value={editProduct.name}
                  onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_category">Categoría *</Label>
                <Input
                  id="edit_category"
                  value={editProduct.category}
                  onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_price">Precio</Label>
                <Input
                  id="edit_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editProduct.price}
                  onChange={(e) => setEditProduct({ ...editProduct, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_stock">Stock Actual</Label>
                <Input
                  id="edit_stock"
                  type="number"
                  min="0"
                  value={editProduct.stock}
                  onChange={(e) => setEditProduct({ ...editProduct, stock: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_min_stock">Stock Mínimo</Label>
                <Input
                  id="edit_min_stock"
                  type="number"
                  min="0"
                  value={editProduct.min_stock}
                  onChange={(e) => setEditProduct({ ...editProduct, min_stock: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_warehouse">Almacén</Label>
              <Select
                value={editProduct.warehouse_id}
                onValueChange={(value) => setEditProduct({ ...editProduct, warehouse_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar almacén" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} - {w.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateProduct} disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Product Dialog */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Mover Producto</DialogTitle>
            <DialogDescription>
              {selectedProduct && `Mover "${selectedProduct.name}" a otro almacén.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Almacén Actual</Label>
              <div className="p-2 bg-muted rounded-md text-sm">
                {selectedProduct ? getWarehouseName(selectedProduct.warehouse_id) : '-'}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="move_warehouse">Nuevo Almacén</Label>
              <Select value={moveToWarehouse} onValueChange={setMoveToWarehouse}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar almacén destino" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.filter(w => w.is_active).map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} - {w.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMoveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleMoveProduct} disabled={isSubmitting}>
              {isSubmitting ? 'Moviendo...' : 'Mover Producto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
