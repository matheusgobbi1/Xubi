import React, { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { RomanticLoading } from "./common/RomanticLoading";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isInitializing } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isInitializing) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      // Redireciona para o login se não estiver autenticado
      router.replace("/login");
    } else if (user && inAuthGroup) {
      // Redireciona para a home se estiver autenticado e tentar acessar rotas de auth
      router.replace("/");
    }
  }, [user, segments, isInitializing]);

  if (isInitializing) {
    return <RomanticLoading />;
  }

  return <>{children}</>;
}
