// src/context/AuthContext.jsx (VERSÃO FINAL E CORRIGIDA)

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();

  useEffect(() => {
    // Este efeito é ótimo para o carregamento inicial da página e para manter o estado sincronizado
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      try {
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);
      } catch (error) {
        console.error("Token inválido:", error);
        // Se o token for inválido (expirado, etc.), limpamos tudo
        setToken(null); 
      }
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    }
  }, [token]);

  async function login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      const newToken = response.data.token;

      // --- A CORREÇÃO ESTÁ AQUI ---
      // 1. Guardamos o token no localStorage imediatamente.
      localStorage.setItem('token', newToken);
      // 2. Colocamos o "crachá" (header) no nosso cliente de API imediatamente.
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      // 3. Agora, atualizamos o estado do React.
      setToken(newToken);
      
      navigate('/');
    } catch (error) {
      console.error("Erro no login:", error);
      alert('Falha no login. Verifique suas credenciais.');
    }
  }

  async function register(data) {
    try {
      await api.post('/auth/register', data);
      alert('Registo realizado com sucesso! Por favor, faça o login.');
      navigate('/login');
    } catch (error) {
      console.error("Erro no registo:", error);
      alert('Falha no registo. Verifique os dados e tente novamente.');
    }
  }

  function logout() {
    setToken(null);
    navigate('/login');
  }

  const value = { token, user, login, logout, register };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}