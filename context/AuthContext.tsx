import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const baseURL = 'http://192.168.0.230:3000/api';

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

  return (
    <AuthContext.Provider value={{ user, isLoading, error, signIn, signUp, signOut }}>
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