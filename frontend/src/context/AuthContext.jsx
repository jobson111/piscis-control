import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext(null);

const setAuthToken = token => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const reauthenticate = async () => {
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
            try {
                setAuthToken(currentToken);
                const decoded = jwtDecode(currentToken);
                if (decoded.exp * 1000 > Date.now()) {
                    const pisciculturaRes = await api.get(`/pisciculturas/${decoded.pisciculturaId}`);
                    setUser({ 
                        userId: decoded.userId, 
                        nome: decoded.nome, 
                        pisciculturaId: decoded.pisciculturaId,
                        permissoes: decoded.permissoes || [],
                        piscicultura: pisciculturaRes.data
                    });
                    setToken(currentToken);
                } else {
                    logout(); // Token expirado
                }
            } catch (error) {
                console.error("Falha ao re-autenticar com token do localStorage", error);
                logout();
            }
        }
    };

    useEffect(() => {
        const loadUserFromToken = async () => {
            await reauthenticate();
            setLoading(false);
        };
        loadUserFromToken();
    }, []);

    const login = async (credentials) => {
        try {
            const response = await api.post('/auth/login', credentials);
            const newToken = response.data.token;
            localStorage.setItem('token', newToken);
            await reauthenticate();
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

    const value = { user, token, loading, login, logout, register, can, reauthenticate };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    return useContext(AuthContext);
};