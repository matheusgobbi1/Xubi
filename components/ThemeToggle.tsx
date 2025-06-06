import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useColors } from "../constants/Colors";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const themeColors = useColors();

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: themeColors.background.paper }]}
      onPress={toggleTheme}
    >
      <MaterialCommunityIcons
        name={theme === "dark" ? "weather-sunny" : "weather-night"}
        size={24}
        color={themeColors.primary.main}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
});
 