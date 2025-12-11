import React, { useState } from 'react';
import { useCarriers, useOrders, dataService } from '@/hooks/useSupabaseData';
import StatusBadge from '@/frontend/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Truck, Plus, Settings, Package, CheckCircle, Power } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const Carriers: React.FC = () => {
  const { data: carriers, loading: carriersLoading, refetch } = useCarriers();
  const { data: orders } = useOrders();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCarrier, setNewCarrier] = useState({
    name: '',
    logo: '',
    status: 'activo' as 'activo' | 'configurar',
    tracking_url: '',
  });
  const [editCarrier, setEditCarrier] = useState({
    id: '',
    name: '',
    logo: '',
    tracking_url: '',
    status: 'activo' as 'activo' | 'configurar',
  });

  const getCarrierStats = (carrierId: string) => {
    const carrierOrders = orders.filter(o => o.carrier_id === carrierId);
    const delivered = carrierOrders.filter(o => o.status === 'entregado').length;
    return {
      total: carrierOrders.length,
      delivered,
      deliveryRate: carrierOrders.length > 0 ? (delivered / carrierOrders.length) * 100 : 0
    };
  };

  const handleToggleCarrier = async (carrierId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'activo' ? 'configurar' : 'activo';
      await dataService.updateCarrier(carrierId, { status: newStatus as 'activo' | 'configurar' });
      toast.success(newStatus === 'activo' ? 'Transportista activado' : 'Transportista desactivado');
      refetch();
    } catch (error) {
      toast.error('Error al actualizar el transportista');
    }
  };

  const handleOpenConfig = (carrier: any) => {
    setEditCarrier({
      id: carrier.id,
      name: carrier.name,
      logo: carrier.logo || '',
      tracking_url: carrier.tracking_url || '',
      status: carrier.status,
    });
    setIsConfigDialogOpen(true);
  };

  const handleUpdateCarrier = async () => {
    if (!editCarrier.name) {
      toast.error('El nombre es requerido');
      return;
    }

    setIsSubmitting(true);
    try {
      await dataService.updateCarrier(editCarrier.id, {
        name: editCarrier.name,
        logo: editCarrier.logo || null,
        tracking_url: editCarrier.tracking_url || null,
        status: editCarrier.status,
      });
      toast.success('Transportista actualizado correctamente');
      setIsConfigDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error('Error al actualizar el transportista');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCarrier = async () => {
    if (!newCarrier.name) {
      toast.error('Por favor ingresa el nombre del transportista');
      return;
    }

    setIsSubmitting(true);
    try {
      await dataService.createCarrier({
        name: newCarrier.name,
        logo: newCarrier.logo || null,
        status: newCarrier.status,
        tracking_url: newCarrier.tracking_url || null,
      });
      toast.success('Transportista creado correctamente');
      setIsDialogOpen(false);
      setNewCarrier({
        name: '',
        logo: '',
        status: 'activo',
        tracking_url: '',
      });
      refetch();
    } catch (error) {
      toast.error('Error al crear el transportista');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (carriersLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Transportistas</h1>
            <p className="text-muted-foreground">Gestiona las integraciones con transportistas</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
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
          <h1 className="text-2xl font-bold text-foreground">Transportistas</h1>
          <p className="text-muted-foreground">Gestiona las integraciones con transportistas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-inka text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Transportista
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Transportista</DialogTitle>
              <DialogDescription>
                Configura un nuevo transportista para tus envíos.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  placeholder="Ej: DHL, FedEx, UPS"
                  value={newCarrier.name}
                  onChange={(e) => setNewCarrier({ ...newCarrier, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">Emoji / Logo</Label>
                <Input
                  id="logo"
                  placeholder="📦 o URL de imagen"
                  value={newCarrier.logo}
                  onChange={(e) => setNewCarrier({ ...newCarrier, logo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tracking_url">URL de Seguimiento</Label>
                <Input
                  id="tracking_url"
                  placeholder="https://tracking.example.com/"
                  value={newCarrier.tracking_url}
                  onChange={(e) => setNewCarrier({ ...newCarrier, tracking_url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado Inicial</Label>
                <Select
                  value={newCarrier.status}
                  onValueChange={(value) => setNewCarrier({ ...newCarrier, status: value as 'activo' | 'configurar' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="configurar">Por Configurar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCarrier} disabled={isSubmitting}>
                {isSubmitting ? 'Creando...' : 'Crear Transportista'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <Card className="border-l-4 border-l-primary bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-primary" />
            <p className="text-sm text-foreground">
              <strong>{carriers.filter(c => c.status === 'activo').length}</strong> transportistas activos de{' '}
              <strong>{carriers.length}</strong> configurados
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Carriers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {carriers.map((carrier) => {
          const stats = getCarrierStats(carrier.id);
          const isActive = carrier.status === 'activo';
          
          return (
            <Card 
              key={carrier.id} 
              className={`hover:shadow-card-hover transition-all duration-300 ${
                !isActive ? 'opacity-75' : ''
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  {/* Carrier Icon */}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 ${
                    isActive ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    {carrier.logo || '📦'}
                  </div>

                  {/* Carrier Name */}
                  <h3 className="font-semibold text-lg mb-2">{carrier.name}</h3>

                  {/* Status Badge */}
                  <StatusBadge status={carrier.status} className="mb-4" />

                  {/* Stats (only for active carriers) */}
                  {isActive && stats.total > 0 && (
                    <div className="w-full grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-muted/50 rounded-lg p-2">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                          <Package size={12} />
                          <span className="text-xs">Envíos</span>
                        </div>
                        <p className="text-lg font-bold">{stats.total}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                          <CheckCircle size={12} />
                          <span className="text-xs">Entregados</span>
                        </div>
                        <p className="text-lg font-bold">{stats.delivered}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="w-full flex gap-2">
                    <Button 
                      variant="outline"
                      className="flex-1"
                      size="sm"
                      onClick={() => handleOpenConfig(carrier)}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Configurar
                    </Button>
                    <Button 
                      variant={isActive ? "ghost" : "default"}
                      className={`${!isActive ? 'gradient-inka text-primary-foreground' : ''}`}
                      size="sm"
                      onClick={() => handleToggleCarrier(carrier.id, carrier.status)}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Config Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configurar Transportista</DialogTitle>
            <DialogDescription>
              Modifica la configuración del transportista.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Nombre *</Label>
              <Input
                id="edit_name"
                value={editCarrier.name}
                onChange={(e) => setEditCarrier({ ...editCarrier, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_logo">Emoji / Logo</Label>
              <Input
                id="edit_logo"
                placeholder="📦 o URL de imagen"
                value={editCarrier.logo}
                onChange={(e) => setEditCarrier({ ...editCarrier, logo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_tracking_url">URL de Seguimiento</Label>
              <Input
                id="edit_tracking_url"
                placeholder="https://tracking.example.com/"
                value={editCarrier.tracking_url}
                onChange={(e) => setEditCarrier({ ...editCarrier, tracking_url: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit_status" className="cursor-pointer">Activo</Label>
              <Switch 
                id="edit_status" 
                checked={editCarrier.status === 'activo'}
                onCheckedChange={(checked) => setEditCarrier({ ...editCarrier, status: checked ? 'activo' : 'configurar' })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateCarrier} disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Carriers;
