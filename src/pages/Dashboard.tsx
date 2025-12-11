import React from 'react';
import { 
  Package, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Truck, 
  CheckCircle, 
  RotateCcw,
  Warehouse,
  ClipboardList
} from 'lucide-react';
import KPICard from '@/frontend/components/ui/KPICard';
import { useKPIs } from '@/hooks/useSupabaseData';
import StatusBadge from '@/frontend/components/ui/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard: React.FC = () => {
  const { kpis, loading, products, orders } = useKPIs();
  const recentOrders = orders.slice(0, 5);
  const lowStockProducts = products.filter(p => p.status === 'bajo' || p.status === 'agotado');

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Vista general del sistema logístico</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Vista general del sistema logístico</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Inventario Total"
          value={kpis.totalInventory.toLocaleString()}
          icon={Package}
          trend={{ value: 5.2, isPositive: true }}
        />
        <KPICard
          title="Stock Bajo"
          value={kpis.lowStockProducts}
          icon={AlertTriangle}
          variant="warning"
        />
        <KPICard
          title="Sin Stock"
          value={kpis.outOfStockProducts}
          icon={XCircle}
          variant="danger"
        />
        <KPICard
          title="Almacenes Activos"
          value={kpis.activeWarehouses}
          icon={Warehouse}
          variant="success"
        />
      </div>

      {/* Order KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Órdenes Pendientes"
          value={kpis.pendingOrders}
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title="En Tránsito"
          value={kpis.inTransitOrders}
          icon={Truck}
        />
        <KPICard
          title="Entregadas"
          value={kpis.deliveredOrders}
          icon={CheckCircle}
          variant="success"
        />
        <KPICard
          title="Devoluciones"
          value={kpis.returns}
          icon={RotateCcw}
          variant="danger"
        />
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Órdenes Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orden</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell className="text-muted-foreground">{order.destination.split(',')[0]}</TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No hay órdenes recientes
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alertas de Inventario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">{product.stock} / {product.min_stock}</TableCell>
                      <TableCell>
                        <StatusBadge status={product.status} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No hay alertas de inventario
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
