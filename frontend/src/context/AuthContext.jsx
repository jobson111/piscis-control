// src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token')); // Lê o token do armazenamento local
  const navigate = useNavigate();

  // Efeito que roda sempre que o token muda
  useEffect(() => {
    if (token) {
      // Se temos um token, guardamo-lo para sessões futuras
      localStorage.setItem('token', token);
      // E configuramos o Axios para enviar este token em todas as requisições
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      // Se não há token, removemos do armazenamento e do Axios
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  async function login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      setToken(response.data.token); // Guarda o token no state (e no localStorage via useEffect)
      navigate('/'); // Leva o usuário para a página inicial
    } catch (error) {
      console.error("Erro no login:", error);
      alert('Falha no login. Verifique suas credenciais.');
    }
  }

  async function register(data) {
    try {
      await api.post('/auth/register', data);
      alert('Registo realizado com sucesso! Por favor, faça o login.');
      navigate('/login'); // Leva o usuário para a página de login após o registo
    } catch (error) {
      console.error("Erro no registo:", error);
      alert('Falha no registo. Verifique os dados e tente novamente.');
    }
  }

  function logout() {
    setToken(null); // Limpa o token do state (e do localStorage via useEffect)
    navigate('/login'); // Leva o usuário para a página de login
  }

  const value = { token, login, logout, register };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook personalizado para facilitar o uso do contexto
export function useAuth() {
  return useContext(AuthContext);
}