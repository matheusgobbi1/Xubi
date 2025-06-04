import React, { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redireciona para o login se não estiver autenticado
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // Redireciona para a home se estiver autenticado e tentar acessar rotas de auth
      router.replace('/');
    }
  }, [user, segments]);

  return <>{children}</>;
} 