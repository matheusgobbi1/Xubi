import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Inicializar Firebase apenas se não houver uma instância existente
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Inicializar Firestore com configurações específicas para React Native
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// Inicializar Storage
const storage = getStorage(app);

// Inicializar Analytics apenas na web
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
// Função para salvar o estado de autenticação
const saveAuthState = async (user: any) => {
  try {
    if (user) {
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        lastSignInTime: new Date().toISOString(),
      };
      await AsyncStorage.setItem("userData", JSON.stringify(userData));
      // Salvar também o token de autenticação
      const token = await user.getIdToken();
      await AsyncStorage.setItem("authToken", token);
    } else {
      await AsyncStorage.removeItem("userData");
      await AsyncStorage.removeItem("authToken");
    }
  } catch (error) {
    console.error("Erro ao salvar estado de autenticação:", error);
  }
};

// Função para carregar o estado de autenticação
const loadAuthState = async () => {
  try {
    const userData = await AsyncStorage.getItem("userData");
    const token = await AsyncStorage.getItem("authToken");

    if (userData && token) {
      return {
        user: JSON.parse(userData),
        token,
      };
    }
    return null;
  } catch (error) {
    console.error("Erro ao carregar estado de autenticação:", error);
    return null;
  }
};

// Configurar listener para mudanças no estado de autenticação
auth.onAuthStateChanged(async (user) => {
  await saveAuthState(user);
});

// Função para verificar se o usuário está autenticado
const isAuthenticated = async () => {
  try {
    const authState = await loadAuthState();
    return !!authState;
  } catch (error) {
    console.error("Erro ao verificar autenticação:", error);
    return false;
  }
};

export {
  app,
  db,
  storage,
  analytics,
  auth,
  saveAuthState,
  loadAuthState,
  isAuthenticated,
};
