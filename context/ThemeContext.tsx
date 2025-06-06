import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeType = "light" | "dark" | "system";

interface ThemeContextData {
  theme: ThemeType;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

const THEME_STORAGE_KEY = "@xubi_theme";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>("system");

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        setTheme(savedTheme as ThemeType);
      }
    } catch (error) {
      console.error("Erro ao carregar tema:", error);
    }
  };

  const isDark =
    theme === "system" ? systemColorScheme === "dark" : theme === "dark";

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    setTheme(newTheme);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  const handleSetTheme = (newTheme: ThemeType) => {
    setTheme(newTheme);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, isDark, toggleTheme, setTheme: handleSetTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme deve ser usado dentro de um ThemeProvider");
  }
  return context;
};
