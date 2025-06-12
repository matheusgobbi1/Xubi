import { useColorScheme } from "react-native";

const lightTheme = {
  primary: {
    main: "#d1054b",
    light: "#d1054b",
    dark: "#d1054b",
  },
  background: {
    default: "#7e0c3d",
    paper: "#F5F5F5",
  },
  text: {
    primary: "#000000",
    secondary: "#666666",
  },
  error: {
    main: "#FF0000",
  },
  warning: {
    main: "#FFA500",
  },
  info: {
    main: "#0000FF",
  },
  success: {
    main: "#00C853",
  },
  border: {
    light: "rgba(0, 0, 0, 0.08)",
  },
};

const darkTheme = {
  primary: {
    main: "#d1054b",
    light: "#d1054b",
    dark: "#d1054b",
  },
  background: {
    default: "#7e0c3d",
    paper: "#1E1E1E",
  },
  text: {
    primary: "#FFFFFF",
    secondary: "#AAAAAA",
  },
  error: {
    main: "#FF0000",
  },
  warning: {
    main: "#FFA500",
  },
  info: {
    main: "#0000FF",
  },
  success: {
    main: "#00C853",
  },
  border: {
    light: "rgba(255, 255, 255, 0.08)",
  },
};

export const useColors = () => {
  const colorScheme = useColorScheme();
  return colorScheme === "dark" ? darkTheme : lightTheme;
};

// Exportando um objeto de cores padrão para uso em componentes que não podem usar hooks
export const defaultColors = lightTheme;

export default lightTheme;
