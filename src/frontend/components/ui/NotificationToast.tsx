import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { notifications, Notification } from '@/backend/data/mockData';
import { cn } from '@/lib/utils';

const NotificationToast: React.FC = () => {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Show unread notifications on mount
    const unread = notifications.filter(n => !n.read).slice(0, 2);
    setVisibleNotifications(unread);
  }, []);

  const dismissNotification = (id: string) => {
    setVisibleNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="text-warning" size={18} />;
      case 'error': return <AlertCircle className="text-destructive" size={18} />;
      case 'success': return <CheckCircle className="text-success" size={18} />;
      default: return <Info className="text-info" size={18} />;
    }
  };

  const getBorderColor = (type: Notification['type']) => {
    switch (type) {
      case 'warning': return 'border-l-warning';
      case 'error': return 'border-l-destructive';
      case 'success': return 'border-l-success';
      default: return 'border-l-info';
    }
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className={cn(
            "bg-card rounded-lg shadow-lg border border-border p-4 animate-slide-in-right border-l-4",
            getBorderColor(notification.type)
          )}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start gap-3">
            {getIcon(notification.type)}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-card-foreground leading-relaxed">
                {notification.message}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(notification.timestamp).toLocaleString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: 'short'
                })}
              </p>
            </div>
            <button
              onClick={() => dismissNotification(notification.id)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
