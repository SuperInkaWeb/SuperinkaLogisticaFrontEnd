import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Definimos la interfaz del usuario en sesión
interface User {
    id?: string;
    email: string;
    name: string;
    role: string; // 'admin', 'cliente', 'operador', etc.
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        // Al cargar, intentamos recuperar la sesión
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Error parsing user from storage", e);
                localStorage.removeItem('user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await api.post('/auth/login', { email, password });

            // Ahora la respuesta incluye accessToken, name, email, role, y posiblemente id
            const { accessToken, name, role, id } = response.data;

            const userData = { id, email, name, role };

            localStorage.setItem('token', accessToken);
            localStorage.setItem('user', JSON.stringify(userData)); // Guardamos datos básicos

            setUser(userData);

            toast({
                title: "Bienvenido",
                description: `Has iniciado sesión como ${role}`,
            });

        } catch (error: unknown) {
            console.error("Login error:", error);
            toast({
                variant: "destructive",
                title: "Error de acceso",
                description: "Credenciales inválidas o servidor no disponible",
            });
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        toast({
            title: "Sesión cerrada",
            description: "Hasta pronto",
        });
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            isLoading,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};