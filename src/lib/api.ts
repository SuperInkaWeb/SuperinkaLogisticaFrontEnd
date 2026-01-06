import axios from 'axios';

/**
 * Usamos variables de entorno de Vite.
 * En Local: Usará http://localhost:8080/api/v1 (vía fallback)
 * En Producción (Vercel): Usará el valor de la variable VITE_API_URL definida en el dashboard.
 */
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: Antes de cada petición, inyecta el Token si existe
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor: Manejo de errores globales
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Si el token expira o es inválido (401)
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Evitar bucles infinitos de redirección si ya estamos en login
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);