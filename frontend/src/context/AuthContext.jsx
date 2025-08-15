import { createContext, useMemo, useState } from 'react';
import api from '../api/axiosInstance';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('token'));
  const [busy, setBusy] = useState(false);

  const login = async (email, password) => {
    setBusy(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      sessionStorage.setItem('token', res.data.token);
      setToken(res.data.token);
    } finally {
      setBusy(false);
    }
  };

  const register = async (payload) => {
    setBusy(true);
    try {
      await api.post('/auth/register', payload);
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    setToken(null);
  };

  const value = useMemo(
    () => ({ token, busy, login, register, logout }),
    [token, busy]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
