import { createContext, useContext, useState, useCallback } from 'react';
import api from '../utils/api';

const Ctx = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [loading] = useState(false); // Auth is synchronous from localStorage

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (localStorage.getItem('token')) {
        await api.post('/auth/logout');
      }
    } catch (e) {}
    localStorage.clear();
    setUser(null);
  }, []);

    const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'super_admin';
    const isAdmin = isSuperAdmin || user?.role === 'admin';
    const isManager = isAdmin || user?.role === 'manager';
    const isStaff = isManager || ['marketing', 'employee'].includes(user?.role);
    const isLimitedRole = ['employee', 'marketing'].includes(user?.role);

    return (
        <Ctx.Provider value={{ 
            user, login, logout, loading,
            isSuperAdmin, isAdmin, isManager, isStaff, isLimitedRole
        }}>
            {children}
        </Ctx.Provider>
    );
};

export const useAuth = () => useContext(Ctx);
