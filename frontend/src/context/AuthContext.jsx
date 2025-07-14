// frontend/src/context/AuthContext.jsx (VERSÃO COM EXPORTS CORRIGIDOS)

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

// Cria o contexto
const AuthContext = createContext(null);

// Função auxiliar para configurar o header do Axios
const setAuthToken = token => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

// Componente Provedor
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            try {
                const decodedUser = jwtDecode(storedToken);
                if (decodedUser.exp * 1000 > Date.now()) {
                    setToken(storedToken);
                    setUser(decodedUser);
                    setAuthToken(storedToken);
                } else {
                    localStorage.removeItem('token');
                }
            } catch (error) {
                console.error("Token inválido no localStorage", error);
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    const login = async (credentials) => {
        try {
            const response = await api.post('/auth/login', credentials);
            const newToken = response.data.token;
            
            localStorage.setItem('token', newToken);
            setAuthToken(newToken);
            
            const decodedUser = jwtDecode(newToken);
            setUser(decodedUser);
            setToken(newToken);
            
            navigate('/');
        } catch (error) {
            console.error("Erro no login:", error);
            alert('Falha no login. Verifique suas credenciais.');
        }
    };

    const register = async (data) => {
        try {
            await api.post('/auth/register', data);
            alert('Registo realizado com sucesso! Por favor, faça o login.');
            navigate('/login');
        } catch (error) {
            console.error("Erro no registo:", error);
            alert('Falha no registo. Verifique os dados e tente novamente.');
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setAuthToken(null);
        setUser(null);
        setToken(null);
        navigate('/login');
    };

    const can = (permission) => {
        return user?.permissoes.includes(permission) ?? false;
    };

    const value = { user, token, loading, login, logout, register, can };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

// Hook personalizado para usar o contexto
export const useAuth = () => {
    return useContext(AuthContext);
};