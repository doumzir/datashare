import { useState, useCallback } from 'react';
import { getToken, saveToken, removeToken } from '../lib/api';

interface User {
  id: string;
  email: string;
}

function parseJwt(token: string): User | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => getToken());

  const user: User | null = token ? parseJwt(token) : null;

  const login = useCallback((newToken: string) => {
    saveToken(newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setToken(null);
  }, []);

  return { user, token, login, logout, isAuthenticated: !!token };
}
