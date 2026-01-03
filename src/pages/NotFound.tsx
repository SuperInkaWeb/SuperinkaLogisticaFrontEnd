import React from 'react';
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home } from 'lucide-react';

const NotFound: React.FC = () => {
    const location = useLocation();

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="text-center space-y-8 max-w-lg w-full">
                <div className="relative">
                    <h1 className="text-9xl font-black text-slate-200 select-none">404</h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="p-4 bg-orange-100 rounded-full animate-bounce">
                            <AlertTriangle className="w-12 h-12 text-orange-500" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-900">Página no encontrada</h2>
                    <p className="text-slate-600">
                        Lo sentimos, la ruta <code className="bg-slate-200 px-2 py-0.5 rounded font-mono text-sm">{location.pathname}</code> no existe en el sistema.
                    </p>
                </div>

                <Button asChild size="lg" className="shadow-lg">
                    <Link to="/dashboard">
                        <Home className="mr-2 h-4 w-4" />
                        Volver al Dashboard
                    </Link>
                </Button>
            </div>
        </div>
    );
};

export default NotFound;