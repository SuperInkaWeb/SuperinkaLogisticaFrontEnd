import React, { createContext, useContext, ReactNode } from 'react';

// Simplificamos la interfaz para solo exponer lo que usamos
interface CurrencyContextType {
    formatMoney: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
    const formatMoney = (amount: number) => {
        // Configuración estricta para Perú:
        // 1. style: 'currency' -> Agrega símbolo
        // 2. currency: 'PEN' -> Código internacional para Nuevos Soles
        // 3. 'es-PE' -> Formato de miles y decimales peruano (1,000.00)
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <CurrencyContext.Provider value={{ formatMoney }}>
            {children}
        </CurrencyContext.Provider>
    );
};