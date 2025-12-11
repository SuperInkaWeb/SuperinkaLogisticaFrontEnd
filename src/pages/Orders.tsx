import React, { useState } from 'react';
import { useOrders, useCarriers, Order, dataService } from '@/hooks/useSupabaseData';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Search, MoreHorizontal, Eye, Download, Truck, CheckCircle, RotateCcw, Filter, Plus, Package, MapPin, Calendar, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';
import jsPDF from 'jspdf';

const Orders: React.FC = () => {
  const { data: orders, loading: ordersLoading, refetch } = useOrders();
  const { data: carriers } = useCarriers();
  const { formatPrice } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isCarrierDialogOpen, setIsCarrierDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newCarrierId, setNewCarrierId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newOrder, setNewOrder] = useState({
    order_number: '',
    origin: '',
    destination: '',
    total: 0,
    products_count: 1,
    otn: '',
    carrier_id: '',
    status: 'pendiente' as Order['status'],
  });

  const generateOrderNumber = () => {
    const prefix = 'ORD';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  };

  const generateOTN = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let otn = '';
    for (let i = 0; i < 12; i++) {
      otn += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return otn;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.otn.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getCarrierName = (carrierId?: string | null) => {
    if (!carrierId) return '-';
    return carriers.find(c => c.id === carrierId)?.name || '-';
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await dataService.updateOrder(orderId, { status: newStatus });
      toast.success('Estado actualizado correctamente');
      refetch();
    } catch (error) {
      toast.error('Error al actualizar el estado');
    }
  };

  const handleOpenDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsDialogOpen(true);
  };

  const handleOpenChangeCarrier = (order: Order) => {
    setSelectedOrder(order);
    setNewCarrierId(order.carrier_id || '');
    setIsCarrierDialogOpen(true);
  };

  const handleChangeCarrier = async () => {
    if (!selectedOrder) return;

    setIsSubmitting(true);
    try {
      await dataService.updateOrder(selectedOrder.id, { carrier_id: newCarrierId || null });
      toast.success('Transportista actualizado correctamente');
      setIsCarrierDialogOpen(false);
      setSelectedOrder(null);
      refetch();
    } catch (error) {
      toast.error('Error al cambiar transportista');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadLabel = (order: Order) => {
    const doc = new jsPDF();
    const carrierName = getCarrierName(order.carrier_id);
    
    // Header
    doc.setFontSize(20);
    doc.text('ETIQUETA DE ENVÍO', 105, 25, { align: 'center' });
    doc.setFontSize(12);
    doc.text('SuperInka Logistics', 105, 35, { align: 'center' });
    
    // Order info box
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(15, 45, 180, 85);
    
    // Left column - From
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('REMITENTE:', 20, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(order.origin, 20, 62);
    
    // Right column - To
    doc.setFont('helvetica', 'bold');
    doc.text('DESTINATARIO:', 110, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(order.destination, 110, 62);
    
    // Horizontal line
    doc.line(15, 75, 195, 75);
    
    // Order details
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Nº Orden:', 20, 85);
    doc.setFont('helvetica', 'normal');
    doc.text(order.order_number, 55, 85);
    
    doc.setFont('helvetica', 'bold');
    doc.text('OTN:', 110, 85);
    doc.setFont('helvetica', 'normal');
    doc.text(order.otn, 125, 85);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha:', 20, 95);
    doc.setFont('helvetica', 'normal');
    doc.text(`${order.date} ${order.time}`, 45, 95);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Transportista:', 110, 95);
    doc.setFont('helvetica', 'normal');
    doc.text(carrierName, 145, 95);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Productos:', 20, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(String(order.products_count), 55, 105);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 110, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(formatPrice(order.total), 130, 105);
    
    // Barcode placeholder
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(order.otn, 105, 120, { align: 'center' });
    doc.setFontSize(8);
    doc.text('||| |||| || ||| |||| ||| || ||||', 105, 125, { align: 'center' });
    
    // Footer
    doc.setFontSize(8);
    doc.text(`Generado el ${new Date().toLocaleString()}`, 105, 145, { align: 'center' });
    
    doc.save(`etiqueta_${order.order_number}.pdf`);
    toast.success('Etiqueta descargada');
  };

  const handleCreateOrder = async () => {
    if (!newOrder.origin || !newOrder.destination) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const time = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

      await dataService.createOrder({
        order_number: newOrder.order_number || generateOrderNumber(),
        origin: newOrder.origin,
        destination: newOrder.destination,
        date,
        time,
        total: newOrder.total,
        products_count: newOrder.products_count,
        otn: newOrder.otn || generateOTN(),
        status: newOrder.status,
        carrier_id: newOrder.carrier_id || null,
      });
      toast.success('Orden creada correctamente');
      setIsDialogOpen(false);
      setNewOrder({
        order_number: '',
        origin: '',
        destination: '',
        total: 0,
        products_count: 1,
        otn: '',
        carrier_id: '',
        status: 'pendiente',
      });
      refetch();
    } catch (error) {
      toast.error('Error al crear la orden');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (ordersLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Órdenes y Envíos</h1>
            <p className="text-muted-foreground">Gestiona todas las órdenes del sistema</p>
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
          <h1 className="text-2xl font-bold text-foreground">Órdenes y Envíos</h1>
          <p className="text-muted-foreground">Gestiona todas las órdenes del sistema</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-inka text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Orden
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Nueva Orden</DialogTitle>
              <DialogDescription>
                Completa los datos de la nueva orden de envío.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="order_number">Nº Orden</Label>
                  <Input
                    id="order_number"
                    placeholder="Auto-generado"
                    value={newOrder.order_number}
                    onChange={(e) => setNewOrder({ ...newOrder, order_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otn">OTN</Label>
                  <Input
                    id="otn"
                    placeholder="Auto-generado"
                    value={newOrder.otn}
                    onChange={(e) => setNewOrder({ ...newOrder, otn: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin">Origen *</Label>
                  <Input
                    id="origin"
                    placeholder="Ciudad de origen"
                    value={newOrder.origin}
                    onChange={(e) => setNewOrder({ ...newOrder, origin: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destino *</Label>
                  <Input
                    id="destination"
                    placeholder="Ciudad de destino"
                    value={newOrder.destination}
                    onChange={(e) => setNewOrder({ ...newOrder, destination: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total">Total (€)</Label>
                  <Input
                    id="total"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newOrder.total}
                    onChange={(e) => setNewOrder({ ...newOrder, total: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="products_count">Cantidad de Productos</Label>
                  <Input
                    id="products_count"
                    type="number"
                    min="1"
                    value={newOrder.products_count}
                    onChange={(e) => setNewOrder({ ...newOrder, products_count: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carrier">Transportista</Label>
                  <Select
                    value={newOrder.carrier_id}
                    onValueChange={(value) => setNewOrder({ ...newOrder, carrier_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {carriers.filter(c => c.status === 'activo').map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={newOrder.status}
                    onValueChange={(value) => setNewOrder({ ...newOrder, status: value as Order['status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="en_transito">En Tránsito</SelectItem>
                      <SelectItem value="entregado">Entregado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateOrder} disabled={isSubmitting}>
                {isSubmitting ? 'Creando...' : 'Crear Orden'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar por número de orden, destino, OTN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_transito">En Tránsito</SelectItem>
                <SelectItem value="entregado">Entregado</SelectItem>
                <SelectItem value="devolucion">Devolución</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">
            {filteredOrders.length} órdenes encontradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Origen</TableHead>
                  <TableHead>Fecha / Hora</TableHead>
                  <TableHead>Nº Orden</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Productos</TableHead>
                  <TableHead>OTN</TableHead>
                  <TableHead>Transportista</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{order.origin}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="text-sm">{order.date}</div>
                      <div className="text-xs">{order.time}</div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                    <TableCell>{order.destination}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatPrice(Number(order.total))}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                        {order.products_count}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {order.otn}
                    </TableCell>
                    <TableCell>{getCarrierName(order.carrier_id)}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDetails(order)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadLabel(order)}>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar Etiqueta
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenChangeCarrier(order)}>
                            <Truck className="mr-2 h-4 w-4" />
                            Cambiar Transportista
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'entregado')}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Marcar Entregado
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleUpdateStatus(order.id, 'devolucion')}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Procesar Devolución
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

      {/* Order Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detalles de Orden
            </DialogTitle>
            <DialogDescription>
              Orden #{selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <MapPin size={14} />
                    Origen
                  </div>
                  <p className="font-semibold">{selectedOrder.origin}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <MapPin size={14} />
                    Destino
                  </div>
                  <p className="font-semibold">{selectedOrder.destination}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar size={14} />
                    Fecha
                  </div>
                  <p className="font-semibold">{selectedOrder.date}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Clock size={14} />
                    Hora
                  </div>
                  <p className="font-semibold">{selectedOrder.time}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">OTN</p>
                  <p className="font-mono font-semibold">{selectedOrder.otn}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">Transportista</p>
                  <p className="font-semibold">{getCarrierName(selectedOrder.carrier_id)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">Productos</p>
                  <p className="text-2xl font-bold">{selectedOrder.products_count}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{formatPrice(selectedOrder.total)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                <span className="text-sm text-muted-foreground">Estado</span>
                <StatusBadge status={selectedOrder.status} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>Cerrar</Button>
            <Button onClick={() => selectedOrder && handleDownloadLabel(selectedOrder)}>
              <Download className="mr-2 h-4 w-4" />
              Descargar Etiqueta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Carrier Dialog */}
      <Dialog open={isCarrierDialogOpen} onOpenChange={setIsCarrierDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Cambiar Transportista</DialogTitle>
            <DialogDescription>
              Orden #{selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Transportista Actual</Label>
              <div className="p-2 bg-muted rounded-md text-sm">
                {selectedOrder ? getCarrierName(selectedOrder.carrier_id) : '-'}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_carrier">Nuevo Transportista</Label>
              <Select value={newCarrierId} onValueChange={setNewCarrierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar transportista" />
                </SelectTrigger>
                <SelectContent>
                  {carriers.filter(c => c.status === 'activo').map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCarrierDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangeCarrier} disabled={isSubmitting}>
              {isSubmitting ? 'Actualizando...' : 'Cambiar Transportista'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
