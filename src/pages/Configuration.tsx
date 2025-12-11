import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Globe, Shield, Database, Save, DollarSign } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';

const Configuration: React.FC = () => {
  const { currency, setCurrency, currencies } = useCurrency();
  const [companyData, setCompanyData] = useState({
    name: 'SuperInka',
    email: 'info@superinka.com',
    phone: '+34 900 123 456',
    address: 'Calle Principal 123, Madrid',
  });

  const [notifications, setNotifications] = useState({
    email_notifications: true,
    low_stock_alerts: true,
    order_updates: true,
    daily_reports: false,
  });

  const [security, setSecurity] = useState({
    two_factor: false,
    session_timeout: true,
    ip_whitelist: false,
  });

  const handleSaveCompany = () => {
    localStorage.setItem('superinka_company', JSON.stringify(companyData));
    toast.success('Información de empresa guardada');
  };

  const handleSaveNotifications = () => {
    localStorage.setItem('superinka_notifications', JSON.stringify(notifications));
    toast.success('Preferencias de notificaciones guardadas');
  };

  const handleSaveSecurity = () => {
    localStorage.setItem('superinka_security', JSON.stringify(security));
    toast.success('Configuración de seguridad guardada');
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency as 'EUR' | 'USD' | 'PEN' | 'MXN');
    toast.success(`Moneda cambiada a ${currencies[newCurrency as keyof typeof currencies].name}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground">Administra las preferencias del sistema</p>
      </div>

      {/* Currency Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Moneda</CardTitle>
              <CardDescription>Configura la moneda para mostrar precios</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Moneda del Sistema</Label>
              <Select value={currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(currencies).map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.symbol} - {curr.name} ({curr.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Moneda Actual</Label>
              <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center">
                <span className="text-lg font-semibold mr-2">{currencies[currency].symbol}</span>
                <span className="text-muted-foreground">{currencies[currency].name}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Información de la Empresa</CardTitle>
              <CardDescription>Datos generales de SuperInka</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nombre de la empresa</Label>
              <Input 
                id="company_name" 
                value={companyData.name}
                onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_email">Email de contacto</Label>
              <Input 
                id="company_email" 
                type="email" 
                value={companyData.email}
                onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_phone">Teléfono</Label>
              <Input 
                id="company_phone" 
                value={companyData.phone}
                onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_address">Dirección</Label>
              <Input 
                id="company_address" 
                value={companyData.address}
                onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
              />
            </div>
          </div>
          <Button className="gradient-inka text-primary-foreground" onClick={handleSaveCompany}>
            <Save className="mr-2 h-4 w-4" />
            Guardar Cambios
          </Button>
        </CardContent>
      </Card>

      {/* Notifications & Security */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Notificaciones</CardTitle>
                <CardDescription>Configura las alertas del sistema</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email_notifications" className="cursor-pointer">Notificaciones por email</Label>
              <Switch id="email_notifications" checked={notifications.email_notifications}
                onCheckedChange={(checked) => setNotifications({ ...notifications, email_notifications: checked })} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="low_stock_alerts" className="cursor-pointer">Alertas de stock bajo</Label>
              <Switch id="low_stock_alerts" checked={notifications.low_stock_alerts}
                onCheckedChange={(checked) => setNotifications({ ...notifications, low_stock_alerts: checked })} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="order_updates" className="cursor-pointer">Actualizaciones de órdenes</Label>
              <Switch id="order_updates" checked={notifications.order_updates}
                onCheckedChange={(checked) => setNotifications({ ...notifications, order_updates: checked })} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="daily_reports" className="cursor-pointer">Reportes diarios</Label>
              <Switch id="daily_reports" checked={notifications.daily_reports}
                onCheckedChange={(checked) => setNotifications({ ...notifications, daily_reports: checked })} />
            </div>
            <Button variant="outline" className="w-full" onClick={handleSaveNotifications}>Guardar Notificaciones</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Seguridad</CardTitle>
                <CardDescription>Opciones de seguridad y acceso</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="two_factor" className="cursor-pointer">Autenticación de dos factores</Label>
              <Switch id="two_factor" checked={security.two_factor}
                onCheckedChange={(checked) => setSecurity({ ...security, two_factor: checked })} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="session_timeout" className="cursor-pointer">Timeout de sesión (30 min)</Label>
              <Switch id="session_timeout" checked={security.session_timeout}
                onCheckedChange={(checked) => setSecurity({ ...security, session_timeout: checked })} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="ip_whitelist" className="cursor-pointer">Lista blanca de IPs</Label>
              <Switch id="ip_whitelist" checked={security.ip_whitelist}
                onCheckedChange={(checked) => setSecurity({ ...security, ip_whitelist: checked })} />
            </div>
            <Button variant="outline" className="w-full" onClick={handleSaveSecurity}>Guardar Seguridad</Button>
          </CardContent>
        </Card>
      </div>

      {/* API & Integrations */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>API e Integraciones</CardTitle>
              <CardDescription>Conecta servicios externos</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">API de Transportistas</p>
                <p className="text-sm text-muted-foreground">Conecta con DHL, UPS, etc.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.info('Configuración próximamente')}>Configurar</Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Pasarela de Pagos</p>
                <p className="text-sm text-muted-foreground">Stripe, PayPal</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.info('Configuración próximamente')}>Configurar</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuration;
