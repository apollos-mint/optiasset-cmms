import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario } from '../types';

export type ThemeMode = 'light' | 'dark' | 'system';

interface AuthContextType {
  token: string | null;
  user: Usuario | null;
  login: (username: string, pass: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  exchangeRate: number;
  syncExchangeRate: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfilePhoto: (photoUrl: string | null) => Promise<void>;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(709.69); // Default reference rate
  const [theme, setThemeState] = useState<ThemeMode>(
    () => (localStorage.getItem('theme') as ThemeMode) || 'system'
  );

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const applyTheme = () => {
      if (theme === 'system') {
        const matches = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', matches ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', theme);
      }
    };

    applyTheme();

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [theme]);

  const fetchRate = async (authToken: string) => {
    try {
      const res = await fetch('/api/profit/exchange-rate', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.rate) {
          setExchangeRate(data.rate);
        }
      }
    } catch (err) {
      console.error('Error fetching exchange rate:', err);
    }
  };

  const refreshUser = async () => {
    const currentToken = token || sessionStorage.getItem('token');
    if (!currentToken) return;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const freshUser = await res.json();
        setUser(freshUser);
        sessionStorage.setItem('user', JSON.stringify(freshUser));
        if (freshUser.id && freshUser.foto_perfil) {
          localStorage.setItem(`gactivos_avatar_${freshUser.id}`, freshUser.foto_perfil);
        }
      }
    } catch (err) {
      console.error('Error refreshing user profile:', err);
    }
  };

  useEffect(() => {
    // Restaurar sesión al iniciar
    const savedToken = sessionStorage.getItem('token');
    const savedUser = sessionStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      const parsedUser = JSON.parse(savedUser);
      const cachedAvatar = parsedUser.id ? localStorage.getItem(`gactivos_avatar_${parsedUser.id}`) : null;
      if (cachedAvatar && !parsedUser.foto_perfil) {
        parsedUser.foto_perfil = cachedAvatar;
      }
      setUser(parsedUser);
      fetchRate(savedToken);

      // Revalidar y sincronizar permisos frescos desde la base de datos
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
      .then(res => res.ok ? res.json() : null)
      .then(freshUser => {
        if (freshUser) {
          setUser(freshUser);
          sessionStorage.setItem('user', JSON.stringify(freshUser));
          if (freshUser.id && freshUser.foto_perfil) {
            localStorage.setItem(`gactivos_avatar_${freshUser.id}`, freshUser.foto_perfil);
          }
        }
      })
      .catch(console.error);
    }
    setLoading(false);

    const handleUserUpdated = () => {
      refreshUser();
    };

    window.addEventListener('gactivos_user_updated', handleUserUpdated);
    return () => {
      window.removeEventListener('gactivos_user_updated', handleUserUpdated);
    };
  }, []);

  const syncExchangeRate = async () => {
    if (!token) return;
    await fetchRate(token);
  };

  const login = async (username: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre_usuario: username, contrasena: pass }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fallo de autenticación.');
      }

      setToken(data.token);
      setUser(data.usuario);
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.usuario));
      fetchRate(data.token);
    } catch (err: any) {
      setError(err.message || 'Error de conexión al servidor backend.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  };

  const updateProfilePhoto = async (photoUrl: string | null) => {
    const currentToken = token || sessionStorage.getItem('token');
    if (!user) return;

    // Actualizar estado local inmediatamente para respuesta instantánea (Optimistic UI)
    const updatedUser = { ...user, foto_perfil: photoUrl };
    setUser(updatedUser);
    sessionStorage.setItem('user', JSON.stringify(updatedUser));
    if (user.id) {
      if (photoUrl) {
        localStorage.setItem(`gactivos_avatar_${user.id}`, photoUrl);
      } else {
        localStorage.removeItem(`gactivos_avatar_${user.id}`);
      }
    }
    window.dispatchEvent(new CustomEvent('gactivos_user_updated', { detail: updatedUser }));

    if (currentToken) {
      try {
        const res = await fetch('/api/auth/me/avatar', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentToken}`
          },
          body: JSON.stringify({ foto_perfil: photoUrl })
        });

        if (!res.ok) {
          const data = await res.json();
          console.warn('Advertencia al sincronizar foto con backend:', data.error);
        }
      } catch (err) {
        console.error('Error al persistir avatar en servidor:', err);
      }
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading, error, clearError, exchangeRate, syncExchangeRate, refreshUser, updateProfilePhoto, theme, setTheme }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
