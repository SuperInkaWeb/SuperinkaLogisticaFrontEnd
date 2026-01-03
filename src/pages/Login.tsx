import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/frontend/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import superinkaLogo from '@/assets/superinka-logo.png';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated, isLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Si está cargando el estado de autenticación inicial, mostramos el loader
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 animate-pulse" />
            </div>
        );
    }

    // Si ya está autenticado, redirigir al dashboard
    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            // Intentamos hacer login con el nuevo backend
            await login(email, password);
            // Si no lanza error, el login fue exitoso y el AuthContext redirigirá o actualizará el estado
            navigate('/dashboard');
        } catch (err: unknown) {
            console.error("Login error:", err);
            // Mostramos mensaje de error genérico o el que venga del backend si es posible
            setError('Credenciales incorrectas o error de conexión');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-background dark:bg-gray-900">
            {/* Left Panel - Decorative */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 dark:from-orange-600 dark:via-orange-700 dark:to-red-700">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/90 via-orange-500/80 to-red-600/90 dark:from-orange-600/90 dark:via-orange-700/80 dark:to-red-800/90" />
                <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-center">
                    <img src={superinkaLogo} alt="SuperInka" className="h-24 mb-8" />
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Sistema Logístico
                    </h1>
                    <p className="text-lg text-white/80 max-w-md">
                        Gestiona tu inventario, órdenes y envíos desde una plataforma centralizada y eficiente.
                    </p>

                    {/* Decorative elements */}
                    <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-20 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
                <Card className="w-full max-w-md shadow-xl border-0 dark:bg-gray-800">
                    <CardHeader className="text-center pb-2">
                        <div className="lg:hidden mb-4">
                            <img src={superinkaLogo} alt="SuperInka" className="h-12 mx-auto" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Iniciar Sesión</CardTitle>
                        <CardDescription>
                            Ingresa tus credenciales para acceder al sistema
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-100 dark:border-red-800">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email" className="dark:text-gray-200">Correo Electrónico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="tu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-11 dark:bg-gray-700 dark:text-gray-100"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="dark:text-gray-200">Contraseña</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-11 pr-10 dark:bg-gray-700 dark:text-gray-100"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold transition-all shadow-lg hover:shadow-xl"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span className="animate-pulse">Ingresando...</span>
                                ) : (
                                    <>
                                        <LogIn className="mr-2" size={18} />
                                        Ingresar
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Login;