import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('access');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUser({
                    id: decoded.user_id,
                    username: decoded.username,
                    role: decoded.role
                });
            } catch (err) {
                console.error("Invalid token");
                logout();
            }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const res = await api.post('auth/login/', { username, password });
        localStorage.setItem('access', res.data.access);
        localStorage.setItem('refresh', res.data.refresh);
        
        const decoded = jwtDecode(res.data.access);
        setUser({
            id: decoded.user_id,
            username: decoded.username,
            role: decoded.role
        });
        return res.data;
    };

    const register = async (userData) => {
        const res = await api.post('auth/register/', userData);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
