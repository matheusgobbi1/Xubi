import {
  TextInput,
  TextInputProps,
  StyleSheet,
  View,
  Platform,
  Animated,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "../../constants/Colors";
import { useState, useRef, useEffect } from "react";

interface InputProps extends TextInputProps {
  error?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  multiline?: boolean;
}

export function Input({ style, error, icon, multiline, ...props }: InputProps) {
  const theme = useColors();
  const [isFocused, setIsFocused] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Função para ajustar a cor (escurecer ou clarear)
  const adjustColor = (color: string, amount: number): string => {
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
  };

  // Cor principal para o input
  const inputColor = error ? theme.error.main : theme.primary.main;
  // Cor mais escura para o efeito 3D
  const shadowColor = adjustColor(inputColor, -40);
  // Cor de fundo igual ao Button
  const bgColor = inputColor;

  useEffect(() => {
    // Animação quando o input recebe ou perde o foco
    Animated.spring(scaleAnim, {
      toValue: isFocused ? 1.02 : 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [isFocused]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View
        style={[
          styles.wrapper,
          {
            backgroundColor: bgColor,
            borderBottomWidth: 6,
            borderRightWidth: 6,
            borderLeftWidth: 0.2,
            borderBottomColor: shadowColor,
            borderRightColor: shadowColor,
            borderLeftColor: shadowColor,
            borderRadius: 12,
            shadowColor: shadowColor,
          },
          error && styles.wrapperError,
          multiline && styles.wrapperMultiline,
          isFocused && styles.wrapperFocused,
        ]}
      >
        {icon && (
          <View
            style={[
              styles.iconWrapper,
              multiline && styles.iconWrapperMultiline,
            ]}
          >
            <MaterialCommunityIcons
              name={icon}
              size={22}
              color="#FFFFFF"
              style={{
                textShadowColor: shadowColor,
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 1,
              }}
            />
          </View>
        )}
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              {
                color: "#FFFFFF",
                backgroundColor: "transparent",
              },
              error && { color: theme.error.main },
              icon && styles.inputWithIcon,
              multiline && styles.inputMultiline,
              style,
            ]}
            placeholderTextColor="#FFFFFF99"
            multiline={multiline}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  wrapper: {
    marginBottom: 0,
    minHeight: 56,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: "hidden",
  },
  wrapperError: {
    borderWidth: 3,
  },
  wrapperFocused: {
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  wrapperMultiline: {
    minHeight: 120,
  },
  iconWrapper: {
    position: "absolute",
    left: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 1,
    width: 24,
    alignItems: "center",
  },
  iconWrapperMultiline: {
    top: 12,
    bottom: "auto",
  },
  inputContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    fontWeight: "500",
    minHeight: 56,
    ...Platform.select({
      ios: {
        paddingVertical: 16,
      },
      android: {
        paddingVertical: 12,
      },
    }),
  },
  inputWithIcon: {
    paddingLeft: 48,
  },
  inputMultiline: {
    height: "100%",
    textAlignVertical: "top",
    paddingTop: 16,
  },
});
