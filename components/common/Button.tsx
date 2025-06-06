import {
  TouchableOpacity,
  Text,
  StyleSheet,
  TouchableOpacityProps,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useColors } from "../../constants/Colors";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "error" | "success" | "warning" | "info";
  outline?: boolean;
  loading?: boolean;
}

export function Button({
  title,
  variant = "primary",
  outline = false,
  loading = false,
  style,
  ...props
}: ButtonProps) {
  const theme = useColors();
  const buttonColor =
    variant === "primary" ? theme.primary.main : theme[variant].main;

  // Ajustando as cores para melhor visibilidade no modo outlined
  const backgroundColor = outline ? "transparent" : buttonColor;

  const textColor = outline ? buttonColor : "#FFFFFF";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed
            ? outline
              ? buttonColor + "15" // Adiciona uma leve opacidade ao pressionar no modo outlined
              : buttonColor + "E6" // Adiciona uma leve opacidade ao pressionar no modo normal
            : backgroundColor,
          borderColor: buttonColor,
          borderWidth: outline ? 1.5 : 0, // Aumentando a espessura da borda
          opacity: props.disabled ? 0.6 : 1,
        },
        style,
      ]}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            {
              color: textColor,
              opacity: props.disabled ? 0.6 : 1,
            },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
