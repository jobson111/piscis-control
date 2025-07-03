// frontend/src/services/api.js (VERSÃO DE PRODUÇÃO)
import axios from 'axios';

const api = axios.create({
  // A Vercel injeta esta variável de ambiente automaticamente
  baseURL: import.meta.env.VITE_API_URL 
});

export default api;