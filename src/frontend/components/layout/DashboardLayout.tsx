import { useState, ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface DashboardLayoutProps {
    children: ReactNode; // Agregamos explícitamente esta propiedad
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
            {/* Sidebar para Desktop y Mobile */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header con botón para abrir sidebar en mobile */}
                <Header onMenuClick={() => setSidebarOpen(true)} />

                {/* Contenido principal scrolleable */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;