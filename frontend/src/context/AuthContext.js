import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ssn_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ssn_token');
    if (token) {
      api.get('/auth/me')
        .then(res => { setUser(res.data); localStorage.setItem('ssn_user', JSON.stringify(res.data)); })
        .catch(() => { localStorage.removeItem('ssn_token'); localStorage.removeItem('ssn_user'); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('ssn_token', res.data.token);
    localStorage.setItem('ssn_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password, adminCode) => {
    const res = await api.post('/auth/register', { name, email, password, adminCode });
    localStorage.setItem('ssn_token', res.data.token);
    localStorage.setItem('ssn_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('ssn_token');
    localStorage.removeItem('ssn_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
