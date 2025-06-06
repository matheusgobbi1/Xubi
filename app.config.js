import "dotenv/config";

export default {
  expo: {
    name: "Xubi",
    slug: "Xubi",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "xubi",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#D81B60",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.xubi.app",
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "Precisamos da sua localização para mostrar lugares especiais no mapa",
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryUsageDescription:
          "Precisamos acessar sua galeria para permitir que você escolha fotos para seu perfil",
        NSCameraUsageDescription:
          "Precisamos acessar sua câmera para permitir que você tire fotos para seu perfil",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      package: "com.xubi.app",
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "CAMERA",
      ],
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-font",
      [
        "expo-image-picker",
        {
          photosPermission:
            "O aplicativo precisa acessar suas fotos para permitir que você escolha uma imagem para seu perfil.",
          cameraPermission:
            "O aplicativo precisa acessar sua câmera para permitir que você tire uma foto para seu perfil.",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID:
        process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      FIREBASE_MEASUREMENT_ID: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
      GOOGLE_PLACES_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
      API_URL: process.env.EXPO_PUBLIC_API_URL,
      router: {},
      eas: {
        projectId: "44f75a8b-5023-47c8-be0c-6efcc55303c9",
      },
    },
  },
};
