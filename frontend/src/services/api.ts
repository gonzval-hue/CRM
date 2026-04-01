import axios from 'axios';

const api = axios.create({
  // En producción: URL relativa ('') → misma URL del servidor (Hostinger)
  // En desarrollo: el proxy de Vite redirige /api → localhost:3000
  // Para sobreescribir, define VITE_API_URL en el .env del frontend
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error?.message || 'Error en la petición';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

export default api;
