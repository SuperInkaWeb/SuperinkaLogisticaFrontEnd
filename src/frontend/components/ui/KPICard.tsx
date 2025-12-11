import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'warning' | 'danger' | 'success';
  className?: string;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  variant = 'default',
  className
}) => {
  const variantStyles = {
    default: 'border-l-primary',
    warning: 'border-l-warning',
    danger: 'border-l-destructive',
    success: 'border-l-success',
  };

  const iconBgStyles = {
    default: 'bg-primary/10 text-primary',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-destructive/10 text-destructive',
    success: 'bg-success/10 text-success',
  };

  return (
    <div
      className={cn(
        "bg-card rounded-lg p-5 border border-border shadow-card hover:shadow-card-hover transition-all duration-300 border-l-4",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-card-foreground">{value}</p>
          {trend && (
            <p className={cn(
              "text-sm mt-2 font-medium",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% vs ayer
            </p>
          )}
        </div>
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center",
          iconBgStyles[variant]
        )}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

export default KPICard;
