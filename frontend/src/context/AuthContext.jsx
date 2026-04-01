/**
 * ── Authentication Context ──────────────────────────────────────
 * 
 * Provides authentication state and methods to all components via
 * React Context. Manages JWT token storage and user session.
 * 
 * Features:
 *   - Login/logout with API integration
 *   - Persistent session via localStorage
 *   - Role-based access helpers (isSuperAdmin, isAdmin, isManager, etc.)
 *   - Safe localStorage access (handles incognito/full storage)
 * 
 * Usage:
 *   const { user, login, logout, isAdmin } = useAuth();
 */

import { createContext, useContext, useState, useCallback } from 'react';
import api from '../utils/api';

const Ctx = createContext(null);

export const AuthProvider = ({ children }) => {
  // ── Initialize user from localStorage (if available) ────────
  // Wrapped in try/catch because localStorage can throw in:
  //   - Incognito mode (some browsers)
  //   - Storage full scenarios
  //   - Restricted iframe contexts
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading] = useState(false); // Auth is synchronous from localStorage

  /**
   * Authenticates user via API and stores session in localStorage.
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object} User object { id, name, email, role }
   */
  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    try {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch {
      // Storage full or restricted — session will be lost on refresh
      console.warn('Failed to persist session to localStorage');
    }
    setUser(data.user);
    return data.user;
  }, []);

  /**
   * Logs out the user by clearing session data.
   * Makes a best-effort API call to log the logout action.
   */
  const logout = useCallback(async () => {
    try {
      if (localStorage.getItem('token')) {
        await api.post('/auth/logout');
      }
    } catch (e) {}
    try {
      localStorage.clear();
    } catch {}
    setUser(null);
  }, []);

  // ── Role-based access helpers ───────────────────────────────
  // Used by Guard component and throughout the app to check permissions.
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
