import React from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { RomanticLoading } from "./common/RomanticLoading";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isInitializing } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (isInitializing) return;

    const inAuthGroup = segments[0] === "(auth)";
    const currentPath = segments.join("/");

    if (!user && !inAuthGroup && currentPath !== "/login") {
      router.replace("/login");
    } else if (user && inAuthGroup) {
      router.replace("/");
    }
  }, [user, segments, isInitializing]);

  if (isInitializing) {
    return <RomanticLoading />;
  }

  return <>{children}</>;
}
