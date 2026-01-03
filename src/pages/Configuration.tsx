import React from 'react';
import DashboardLayout from "@/frontend/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, Globe } from 'lucide-react';
import { useTheme } from "@/components/theme/theme-provider";

const Configuration: React.FC = () => {
    const { theme, setTheme } = useTheme();
    const isDarkMode = theme === "dark";

    const handleThemeToggle = (checked: boolean) => {
        setTheme(checked ? "dark" : "light");
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Configuración</h1>
                    <p className="text-muted-foreground">Personaliza tus preferencias y ajustes del sistema.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="w-5 h-5 text-primary" />
                                General
                            </CardTitle>
                            <CardDescription>Ajustes de interfaz y visualización</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Modo Oscuro</Label>
                                    <p className="text-sm text-muted-foreground">Cambiar a interfaz de alto contraste</p>
                                </div>
                                <Switch checked={isDarkMode} onCheckedChange={handleThemeToggle} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Idioma</Label>
                                    <p className="text-sm text-muted-foreground">Español (Latinoamérica)</p>
                                </div>
                                <Button variant="outline" size="sm">Cambiar</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="w-5 h-5 text-primary" />
                                Notificaciones
                            </CardTitle>
                            <CardDescription>Gestión de alertas y correos</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Alertas de Stock</Label>
                                    <p className="text-sm text-muted-foreground">Notificar cuando el inventario sea bajo</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Resumen Semanal</Label>
                                    <p className="text-sm text-muted-foreground">Recibir reporte PDF por email</p>
                                </div>
                                <Switch />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end">
                    <Button size="lg" className="shadow-lg shadow-primary/20">Guardar Cambios</Button>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Configuration;