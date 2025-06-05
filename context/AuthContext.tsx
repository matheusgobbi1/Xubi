import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateAvatar: (avatarUrl: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const baseURL = process.env.EXPO_PUBLIC_API_URL;

  const api = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const loadStoredData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('@Xubi:user');
      const storedToken = await AsyncStorage.getItem('@Xubi:token');

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Erro ao carregar dados salvos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStoredData();
  }, []);

  api.interceptors.request.use(async (config) => {
    console.log('Fazendo requisição para:', config.url);
    const token = await AsyncStorage.getItem('@Xubi:token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('Erro na requisição:', error);
      if (error.code === 'ECONNABORTED') {
        throw new Error('Tempo de conexão esgotado. Verifique sua internet.');
      }
      if (!error.response) {
        throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      }
      throw error;
    }
  );

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;

      await AsyncStorage.setItem('@Xubi:token', token);
      await AsyncStorage.setItem('@Xubi:user', JSON.stringify(user));

      setUser(user);
    } catch (err: any) {
      console.error('Erro no login:', err);
      setError(err.message || 'Erro ao fazer login');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.post('/auth/register', { name, email, password });
      const { user, token } = response.data;

      await AsyncStorage.setItem('@Xubi:token', token);
      await AsyncStorage.setItem('@Xubi:user', JSON.stringify(user));

      setUser(user);
    } catch (err: any) {
      console.error('Erro no registro:', err);
      setError(err.message || 'Erro ao criar conta');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('@Xubi:token');
    await AsyncStorage.removeItem('@Xubi:user');
    setUser(null);
  };

  const updateAvatar = async (avatarUrl: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.patch('/users/avatar', { avatarUrl });
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const updatedUser: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: avatarUrl
      };

      await AsyncStorage.setItem('@Xubi:user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err: any) {
      console.error('Erro ao atualizar avatar:', err);
      setError(err.message || 'Erro ao atualizar avatar');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, signIn, signUp, signOut, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 