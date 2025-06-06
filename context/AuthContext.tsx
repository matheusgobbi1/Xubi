import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth, loadAuthState, isAuthenticated } from "../services/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

type AuthContextData = {
  user: User | null;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Verificar se o usuário está autenticado
        const isUserAuthenticated = await isAuthenticated();
        if (isUserAuthenticated) {
          // Carregar estado de autenticação do AsyncStorage
          const authState = await loadAuthState();
          if (authState?.user) {
            const userDoc = await getDoc(doc(db, "users", authState.user.uid));
            const userData = userDoc.data();
            setUser({
              id: authState.user.uid,
              email: authState.user.email,
              name: userData?.name || "Usuário",
              avatarUrl: userData?.avatarUrl,
            });
          }
        }
      } catch (error) {
        console.error("Erro ao inicializar autenticação:", error);
      } finally {
        setIsLoading(false);
        setIsInitializing(false);
      }
    };

    initializeAuth();

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const newUser = {
              id: firebaseUser.uid,
              email: userData.email,
              name: userData.name,
              avatarUrl: userData.avatarUrl,
            };
            setUser(newUser);
          } else {
            // Se o documento não existir, criar um novo
            const newUser = {
              email: firebaseUser.email,
              name: firebaseUser.displayName || "Usuário",
              createdAt: new Date().toISOString(),
            };
            await setDoc(doc(db, "users", firebaseUser.uid), newUser);
            const user = {
              id: firebaseUser.uid,
              email: newUser.email || "",
              name: newUser.name,
            };
            setUser(user);
          }
        } catch (err) {
          console.error("Erro ao buscar dados do usuário:", err);
          setError("Erro ao carregar dados do usuário. Tente novamente.");
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error("Erro no login:", err);
      setError(
        err.code === "auth/user-not-found" || err.code === "auth/wrong-password"
          ? "Email ou senha inválidos"
          : "Erro ao fazer login. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      const auth = getAuth();
      const { user: firebaseUser } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Criar documento do usuário no Firestore
      await setDoc(doc(db, "users", firebaseUser.uid), {
        email,
        name,
        createdAt: new Date().toISOString(),
      });

      // Atualizar o estado do usuário
      setUser({
        id: firebaseUser.uid,
        email,
        name,
      });
    } catch (err: any) {
      console.error("Erro no cadastro:", err);
      setError(
        err.code === "auth/email-already-in-use"
          ? "Este email já está em uso"
          : "Erro ao criar conta. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const auth = getAuth();
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
      setError("Erro ao fazer logout. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isInitializing,
        error,
        signIn,
        signUp,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
