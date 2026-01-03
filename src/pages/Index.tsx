import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/frontend/context/AuthContext";
import superinkaLogo from '@/assets/superinka-logo.png';

const Index: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading) {
            if (isAuthenticated) {
                navigate("/dashboard");
            } else {
                navigate("/login");
            }
        }
    }, [isAuthenticated, isLoading, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col items-center animate-pulse">
                <img src={superinkaLogo} alt="Logo" className="h-20 mb-6 opacity-80" />
                <div className="h-2 w-32 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-progress origin-left"></div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 font-medium">Iniciando sistema...</p>
            </div>
        </div>
    );
};

export default Index;