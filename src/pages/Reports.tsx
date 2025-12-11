import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Download, FileSpreadsheet, FileText, TrendingUp, Package, Truck, DollarSign, Loader2 } from 'lucide-react';
import { useProducts, useOrders, useWarehouses, useCarriers } from '@/hooks/useSupabaseData';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

const Reports: React.FC = () => {
  const { data: products, isLoading: loadingProducts } = useProducts();
  const { data: orders, isLoading: loadingOrders } = useOrders();
  const { data: warehouses, isLoading: loadingWarehouses } = useWarehouses();
  const { data: carriers, isLoading: loadingCarriers } = useCarriers();
  const { formatPrice, currency } = useCurrency();

  const isLoading = loadingProducts || loadingOrders || loadingWarehouses || loadingCarriers;

  // Calculate KPIs from real data
  const totalOrders = orders?.length || 0;
  const totalRevenue = orders?.reduce((acc, o) => acc + (Number(o.total) || 0), 0) || 0;
  const deliveredOrders = orders?.filter(o => o.status === 'delivered').length || 0;
  const deliveryRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;
  const totalInventory = products?.reduce((acc, p) => acc + (p.stock || 0), 0) || 0;

  // CSV Export Functions
  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const key = h.toLowerCase().replace(/ /g, '_');
        const value = row[key] ?? row[h] ?? '';
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success(`${filename}.csv descargado`);
  };

  const exportInventoryCSV = () => {
    if (!products?.length) return toast.error('No hay productos para exportar');
    const headers = ['SKU', 'Nombre', 'Stock', 'Precio', 'Almacén'];
    const data = products.map(p => ({
      SKU: p.sku,
      Nombre: p.name,
      Stock: p.stock,
      Precio: p.price,
      Almacén: p.warehouse_id || 'N/A'
    }));
    exportToCSV(data, 'inventario', headers);
  };

  const exportOrdersCSV = () => {
    if (!orders?.length) return toast.error('No hay órdenes para exportar');
    const headers = ['ID', 'Cliente', 'Estado', 'Total', 'Fecha'];
    const data = orders.map(o => ({
      ID: o.id,
      Cliente: o.customer_name,
      Estado: o.status,
      Total: o.total,
      Fecha: new Date(o.created_at).toLocaleDateString()
    }));
    exportToCSV(data, 'ordenes', headers);
  };

  // PDF Export Functions
  const exportInventoryPDF = () => {
    if (!products?.length) return toast.error('No hay productos para exportar');
    
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Reporte de Inventario - SuperInka', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Moneda: ${currency}`, 14, 36);
    
    let y = 50;
    doc.setFontSize(12);
    doc.text('SKU', 14, y);
    doc.text('Producto', 50, y);
    doc.text('Stock', 120, y);
    doc.text('Precio', 150, y);
    
    y += 8;
    doc.setFontSize(10);
    products.forEach((p, i) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(p.sku || 'N/A', 14, y);
      doc.text((p.name || '').substring(0, 30), 50, y);
      doc.text(String(p.stock || 0), 120, y);
      doc.text(formatPrice(p.price || 0), 150, y);
      y += 7;
    });
    
    doc.text(`Total productos: ${products.length}`, 14, y + 10);
    doc.text(`Stock total: ${totalInventory}`, 14, y + 17);
    
    doc.save(`inventario_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Reporte de inventario PDF descargado');
  };

  const exportOrdersPDF = () => {
    if (!orders?.length) return toast.error('No hay órdenes para exportar');
    
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Reporte de Órdenes - SuperInka', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Moneda: ${currency}`, 14, 36);
    
    let y = 50;
    doc.setFontSize(12);
    doc.text('ID', 14, y);
    doc.text('Cliente', 40, y);
    doc.text('Estado', 100, y);
    doc.text('Total', 140, y);
    doc.text('Fecha', 170, y);
    
    y += 8;
    doc.setFontSize(10);
    orders.forEach((o) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(String(o.id).substring(0, 8), 14, y);
      doc.text((o.customer_name || '').substring(0, 25), 40, y);
      doc.text(o.status || 'N/A', 100, y);
      doc.text(formatPrice(o.total || 0), 140, y);
      doc.text(new Date(o.created_at).toLocaleDateString(), 170, y);
      y += 7;
    });
    
    doc.text(`Total órdenes: ${orders.length}`, 14, y + 10);
    doc.text(`Ingresos totales: ${formatPrice(totalRevenue)}`, 14, y + 17);
    
    doc.save(`ordenes_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Reporte de órdenes PDF descargado');
  };

  const exportFinancialPDF = () => {
    if (!orders?.length) return toast.error('No hay datos financieros para exportar');
    
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Reporte Financiero - SuperInka', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Moneda: ${currency}`, 14, 36);
    
    let y = 50;
    doc.setFontSize(14);
    doc.text('Resumen Financiero', 14, y);
    
    y += 15;
    doc.setFontSize(12);
    doc.text(`Ingresos Totales: ${formatPrice(totalRevenue)}`, 14, y);
    y += 10;
    doc.text(`Total de Órdenes: ${totalOrders}`, 14, y);
    y += 10;
    doc.text(`Órdenes Entregadas: ${deliveredOrders}`, 14, y);
    y += 10;
    doc.text(`Tasa de Entrega: ${deliveryRate.toFixed(1)}%`, 14, y);
    y += 10;
    doc.text(`Valor Promedio por Orden: ${formatPrice(totalOrders > 0 ? totalRevenue / totalOrders : 0)}`, 14, y);
    
    y += 25;
    doc.setFontSize(14);
    doc.text('Desglose por Estado', 14, y);
    
    y += 12;
    doc.setFontSize(10);
    const statusCounts: Record<string, { count: number; total: number }> = {};
    orders.forEach(o => {
      if (!statusCounts[o.status]) statusCounts[o.status] = { count: 0, total: 0 };
      statusCounts[o.status].count++;
      statusCounts[o.status].total += Number(o.total) || 0;
    });
    
    Object.entries(statusCounts).forEach(([status, data]) => {
      doc.text(`${status}: ${data.count} órdenes - ${formatPrice(data.total)}`, 14, y);
      y += 7;
    });
    
    doc.save(`financiero_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Reporte financiero PDF descargado');
  };

  const exportKPIsPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Reporte de Rendimiento - SuperInka', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 30);
    
    let y = 50;
    doc.setFontSize(14);
    doc.text('Indicadores Clave de Rendimiento (KPIs)', 14, y);
    
    y += 15;
    doc.setFontSize(12);
    doc.text(`Total de Órdenes: ${totalOrders}`, 14, y);
    y += 10;
    doc.text(`Ingresos Totales: ${formatPrice(totalRevenue)}`, 14, y);
    y += 10;
    doc.text(`Tasa de Entrega: ${deliveryRate.toFixed(1)}%`, 14, y);
    y += 10;
    doc.text(`Inventario Total: ${totalInventory.toLocaleString()} unidades`, 14, y);
    y += 10;
    doc.text(`Productos en Sistema: ${products?.length || 0}`, 14, y);
    y += 10;
    doc.text(`Almacenes Activos: ${warehouses?.filter(w => w.is_active).length || 0}`, 14, y);
    y += 10;
    doc.text(`Transportistas Activos: ${carriers?.filter(c => c.is_active).length || 0}`, 14, y);
    
    y += 25;
    doc.setFontSize(14);
    doc.text('Productos con Stock Bajo (< 10 unidades)', 14, y);
    
    y += 12;
    doc.setFontSize(10);
    const lowStock = products?.filter(p => (p.stock || 0) < 10) || [];
    if (lowStock.length === 0) {
      doc.text('No hay productos con stock bajo', 14, y);
    } else {
      lowStock.forEach(p => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(`${p.name}: ${p.stock} unidades`, 14, y);
        y += 7;
      });
    }
    
    doc.save(`rendimiento_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Reporte de rendimiento PDF descargado');
  };

  const reportTypes = [
    {
      title: 'Reporte de Inventario',
      description: 'Stock actual, movimientos y alertas de productos',
      icon: Package,
      actions: [
        { label: 'PDF', handler: exportInventoryPDF, icon: FileText },
        { label: 'CSV', handler: exportInventoryCSV, icon: FileSpreadsheet },
      ],
    },
    {
      title: 'Reporte de Órdenes',
      description: 'Análisis de órdenes por período, estado y transportista',
      icon: Truck,
      actions: [
        { label: 'PDF', handler: exportOrdersPDF, icon: FileText },
        { label: 'CSV', handler: exportOrdersCSV, icon: FileSpreadsheet },
      ],
    },
    {
      title: 'Reporte Financiero',
      description: 'Ingresos, costos de envío y márgenes',
      icon: DollarSign,
      actions: [
        { label: 'PDF', handler: exportFinancialPDF, icon: FileText },
      ],
    },
    {
      title: 'Reporte de Rendimiento',
      description: 'KPIs, tendencias y métricas de operación',
      icon: TrendingUp,
      actions: [
        { label: 'PDF', handler: exportKPIsPDF, icon: FileText },
      ],
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando datos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <p className="text-muted-foreground">Genera y descarga reportes del sistema</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Órdenes</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-secondary">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                <p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-secondary opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-success">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasa de Entrega</p>
                <p className="text-2xl font-bold">{deliveryRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-warning">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inventario Total</p>
                <p className="text-2xl font-bold">{totalInventory.toLocaleString()}</p>
              </div>
              <Package className="h-8 w-8 text-warning opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report, index) => {
          const Icon = report.icon;
          return (
            <Card key={index} className="hover:shadow-card-hover transition-all duration-300">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {report.actions.map((action) => {
                    const ActionIcon = action.icon;
                    return (
                      <Button 
                        key={action.label} 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={action.handler}
                      >
                        <ActionIcon size={14} />
                        <Download size={14} />
                        {action.label}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Reports;
