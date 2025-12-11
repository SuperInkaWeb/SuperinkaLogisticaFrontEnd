import React from 'react';
import { cn } from '@/lib/utils';
import { Package, Truck, CheckCircle, RotateCcw, Clock, AlertTriangle, XCircle } from 'lucide-react';

type OrderStatus = 'pendiente' | 'en_transito' | 'entregado' | 'devolucion';
type StockStatus = 'normal' | 'bajo' | 'agotado';
type WarehouseStatus = 'activo' | 'inactivo';
type CarrierStatus = 'activo' | 'configurar';

type StatusType = OrderStatus | StockStatus | WarehouseStatus | CarrierStatus;

interface StatusBadgeProps {
  status: StatusType;
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; icon: React.ElementType; className: string }> = {
  // Order statuses
  pendiente: { label: 'Pendiente', icon: Clock, className: 'bg-warning/10 text-warning border-warning/20' },
  en_transito: { label: 'En Tránsito', icon: Truck, className: 'bg-info/10 text-info border-info/20' },
  entregado: { label: 'Entregado', icon: CheckCircle, className: 'bg-success/10 text-success border-success/20' },
  devolucion: { label: 'Devolución', icon: RotateCcw, className: 'bg-destructive/10 text-destructive border-destructive/20' },
  
  // Stock statuses
  normal: { label: 'Normal', icon: CheckCircle, className: 'bg-success/10 text-success border-success/20' },
  bajo: { label: 'Stock Bajo', icon: AlertTriangle, className: 'bg-warning/10 text-warning border-warning/20' },
  agotado: { label: 'Agotado', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/20' },
  
  // Warehouse & Carrier statuses
  activo: { label: 'Activo', icon: CheckCircle, className: 'bg-success/10 text-success border-success/20' },
  inactivo: { label: 'Inactivo', icon: XCircle, className: 'bg-muted text-muted-foreground border-muted-foreground/20' },
  configurar: { label: 'Configurar', icon: Package, className: 'bg-secondary/10 text-secondary border-secondary/20' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showIcon = true, className }) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
      config.className,
      className
    )}>
      {showIcon && <Icon size={12} />}
      {config.label}
    </span>
  );
};

export default StatusBadge;
