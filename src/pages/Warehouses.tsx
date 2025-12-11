import React, { useState } from 'react';
import { useWarehouses, useProducts, dataService } from '@/hooks/useSupabaseData';
import StatusBadge from '@/frontend/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Warehouse, MapPin, Package, Plus, Settings, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';

const Warehouses: React.FC = () => {
  const { data: warehouses, loading: warehousesLoading, refetch } = useWarehouses();
  const { data: products } = useProducts();
  const { formatPrice } = useCurrency();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState({
    name: '',
    city: '',
    capacity: 10000,
    current_stock: 0,
    status: 'activo' as 'activo' | 'inactivo',
  });
  const [editWarehouse, setEditWarehouse] = useState({
    id: '',
    name: '',
    city: '',
    capacity: 10000,
    status: 'activo' as 'activo' | 'inactivo',
  });

  const getWarehouseProducts = (warehouseId: string) => {
    return products.filter(p => p.warehouse_id === warehouseId);
  };

  const handleOpenDetails = (warehouse: any) => {
    setSelectedWarehouse(warehouse);
    setIsDetailsDialogOpen(true);
  };

  const handleOpenConfig = (warehouse: any) => {
    setEditWarehouse({
      id: warehouse.id,
      name: warehouse.name,
      city: warehouse.city,
      capacity: warehouse.capacity,
      status: warehouse.status,
    });
    setIsConfigDialogOpen(true);
  };

  const handleUpdateWarehouse = async () => {
    if (!editWarehouse.name || !editWarehouse.city) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    setIsSubmitting(true);
    try {
      await dataService.updateWarehouse(editWarehouse.id, {
        name: editWarehouse.name,
        city: editWarehouse.city,
        capacity: editWarehouse.capacity,
        status: editWarehouse.status,
      });
      toast.success('Almacén actualizado correctamente');
      setIsConfigDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error('Error al actualizar el almacén');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateWarehouse = async () => {
    if (!newWarehouse.name || !newWarehouse.city) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    setIsSubmitting(true);
    try {
      await dataService.createWarehouse({
        name: newWarehouse.name,
        city: newWarehouse.city,
        capacity: newWarehouse.capacity,
        current_stock: newWarehouse.current_stock,
        status: newWarehouse.status,
      });
      toast.success('Almacén creado correctamente');
      setIsDialogOpen(false);
      setNewWarehouse({
        name: '',
        city: '',
        capacity: 10000,
        current_stock: 0,
        status: 'activo',
      });
      refetch();
    } catch (error) {
      toast.error('Error al crear el almacén');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (warehousesLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Almacenes</h1>
            <p className="text-muted-foreground">Gestiona tus centros de distribución</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Almacenes</h1>
          <p className="text-muted-foreground">Gestiona tus centros de distribución</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-inka text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Almacén
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Almacén</DialogTitle>
              <DialogDescription>
                Configura un nuevo centro de distribución.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Almacén Central"
                  value={newWarehouse.name}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad *</Label>
                <Input
                  id="city"
                  placeholder="Ej: Madrid"
                  value={newWarehouse.city}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, city: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacidad (unidades)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="0"
                    value={newWarehouse.capacity}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, capacity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_stock">Stock Actual</Label>
                  <Input
                    id="current_stock"
                    type="number"
                    min="0"
                    value={newWarehouse.current_stock}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, current_stock: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={newWarehouse.status}
                  onValueChange={(value) => setNewWarehouse({ ...newWarehouse, status: value as 'activo' | 'inactivo' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateWarehouse} disabled={isSubmitting}>
                {isSubmitting ? 'Creando...' : 'Crear Almacén'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {warehouses.map((warehouse) => {
          const capacityPercentage = warehouse.capacity > 0 
            ? (warehouse.current_stock / warehouse.capacity) * 100 
            : 0;
          const warehouseProducts = getWarehouseProducts(warehouse.id);
          
          return (
            <Card key={warehouse.id} className="hover:shadow-card-hover transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Warehouse className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin size={14} />
                        {warehouse.city}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={warehouse.status} showIcon={false} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Capacity Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Capacidad utilizada</span>
                    <span className="font-medium">{capacityPercentage.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={capacityPercentage} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{warehouse.current_stock.toLocaleString()} unidades</span>
                    <span>de {warehouse.capacity.toLocaleString()}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Package size={14} />
                      <span className="text-xs">Productos</span>
                    </div>
                    <p className="text-xl font-bold">{warehouseProducts.length}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <span className="text-xs">Stock Total</span>
                    </div>
                    <p className="text-xl font-bold">
                      {warehouseProducts.reduce((acc, p) => acc + p.stock, 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" size="sm" onClick={() => handleOpenDetails(warehouse)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Detalles
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleOpenConfig(warehouse)}>
                    <Settings size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              {selectedWarehouse?.name}
            </DialogTitle>
            <DialogDescription>
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {selectedWarehouse?.city}
              </span>
            </DialogDescription>
          </DialogHeader>
          {selectedWarehouse && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Capacidad Total</p>
                  <p className="text-2xl font-bold">{selectedWarehouse.capacity.toLocaleString()}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Stock Actual</p>
                  <p className="text-2xl font-bold">{selectedWarehouse.current_stock.toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Productos en este almacén</h4>
                {getWarehouseProducts(selectedWarehouse.id).length === 0 ? (
                  <p className="text-muted-foreground text-sm">No hay productos en este almacén</p>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-right">Stock</TableHead>
                          <TableHead className="text-right">Precio</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getWarehouseProducts(selectedWarehouse.id).map(product => (
                          <TableRow key={product.id}>
                            <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                            <TableCell>{product.name}</TableCell>
                            <TableCell className="text-right">{product.stock}</TableCell>
                            <TableCell className="text-right">{formatPrice(product.price)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Config Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configurar Almacén</DialogTitle>
            <DialogDescription>
              Modifica la configuración del almacén.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Nombre *</Label>
              <Input
                id="edit_name"
                value={editWarehouse.name}
                onChange={(e) => setEditWarehouse({ ...editWarehouse, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_city">Ciudad *</Label>
              <Input
                id="edit_city"
                value={editWarehouse.city}
                onChange={(e) => setEditWarehouse({ ...editWarehouse, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_capacity">Capacidad (unidades)</Label>
              <Input
                id="edit_capacity"
                type="number"
                min="0"
                value={editWarehouse.capacity}
                onChange={(e) => setEditWarehouse({ ...editWarehouse, capacity: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_status">Estado</Label>
              <Select
                value={editWarehouse.status}
                onValueChange={(value) => setEditWarehouse({ ...editWarehouse, status: value as 'activo' | 'inactivo' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateWarehouse} disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Warehouses;
