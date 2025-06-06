import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { MapProvider } from "../context/MapContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <SafeAreaProvider>
          <MapProvider>
            <ProtectedRoute>
              <Stack
                screenOptions={{
                  animation: "fade",
                  animationDuration: 200,
                }}
              >
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="modal"
                  options={{
                    headerShown: false,
                    animation: "fade",
                    animationDuration: 200,
                    contentStyle: {
                      backgroundColor: "transparent",
                    },
                  }}
                />
              </Stack>
            </ProtectedRoute>
          </MapProvider>
        </SafeAreaProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
