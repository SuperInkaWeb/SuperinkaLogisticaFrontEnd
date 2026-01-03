import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Definición del ítem del carrito
export interface CartItem {
    id?: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
}

interface CartContextType {
    items: CartItem[];
    itemCount: number;
    total: number;
    addToCart: (item: CartItem) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void; // <--- NUEVA FUNCIÓN
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [items, setItems] = useState<CartItem[]>([]);

    // Cargar carrito desde localStorage al inicio
    useEffect(() => {
        const savedCart = localStorage.getItem('shopping-cart');
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
            } catch (e) {
                console.error("Error parsing cart", e);
            }
        }
    }, []);

    // Guardar en localStorage cada vez que cambia
    useEffect(() => {
        localStorage.setItem('shopping-cart', JSON.stringify(items));
    }, [items]);

    const addToCart = (newItem: CartItem) => {
        setItems((currentItems) => {
            const existingItem = currentItems.find((item) => item.id === newItem.id);

            if (existingItem) {
                // Si ya existe, sumamos la cantidad nueva a la existente
                return currentItems.map((item) =>
                    item.id === newItem.id
                        ? { ...item, quantity: item.quantity + (newItem.quantity || 1) }
                        : item
                );
            } else {
                // Si no existe, lo agregamos
                return [...currentItems, { ...newItem, quantity: newItem.quantity || 1 }];
            }
        });
    };

    const removeFromCart = (id: string) => {
        setItems((currentItems) => currentItems.filter((item) => item.id !== id));
    };

    // NUEVO: Función para actualizar cantidad directamente (input o botones +/-)
    const updateQuantity = (id: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(id);
            return;
        }
        setItems((currentItems) =>
            currentItems.map((item) =>
                item.id === id ? { ...item, quantity: quantity } : item
            )
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ items, itemCount, total, addToCart, removeFromCart, updateQuantity, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};