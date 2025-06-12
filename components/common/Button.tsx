import {
  TouchableOpacity,
  Text,
  StyleSheet,
  TouchableOpacityProps,
  ActivityIndicator,
  Pressable,
  View,
} from "react-native";
import { useColors } from "../../constants/Colors";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "error" | "success" | "warning" | "info";
  loading?: boolean;
}

export function Button({
  title,
  variant = "primary",
  loading = false,
  style,
  ...props
}: ButtonProps) {
  const theme = useColors();
  const buttonColor =
    variant === "primary" ? theme.primary.main : theme[variant].main;

  const backgroundColor = buttonColor;
  const textColor = "#FFFFFF";

  // Cores para o efeito 3D
  const shadowColor = adjustColor(buttonColor, -40); // Cor mais escura para sombra

  return (
    <View style={[styles.buttonContainer, style]}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: pressed
              ? adjustColor(backgroundColor, -10)
              : backgroundColor,
            borderBottomWidth: pressed ? 3 : 6,
            borderRightWidth: pressed ? 3 : 6,
            borderLeftWidth: pressed ? 0.2 : 0.2, // Borda esquerda mais fina
            borderBottomColor: shadowColor,
            borderRightColor: shadowColor,
            borderLeftColor: shadowColor, // Mesma cor da sombra
            transform: [
              {
                translateY: pressed ? 2 : 0,
              },
            ],
            opacity: props.disabled ? 0.6 : 1,
          },
        ]}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <Text
            style={[
              styles.buttonText,
              {
                color: textColor,
                opacity: props.disabled ? 0.6 : 1,
                textShadowColor: shadowColor,
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 1,
              },
            ]}
          >
            {title}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

// Função para ajustar a cor (escurecer ou clarear)
function adjustColor(color: string, amount: number): string {
  // Remove o # se existir
  let hex = color.replace("#", "");

  // Converte para RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Ajusta os valores
  r = Math.max(0, Math.min(255, r + amount));
  g = Math.max(0, Math.min(255, g + amount));
  b = Math.max(0, Math.min(255, b + amount));

  // Converte de volta para hex
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  buttonContainer: {
    marginHorizontal: 5,
  },
  button: {
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
