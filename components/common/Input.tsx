import {
  TextInput,
  TextInputProps,
  StyleSheet,
  View,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "../../constants/Colors";
import { useState } from "react";

interface InputProps extends TextInputProps {
  error?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  multiline?: boolean;
}

export function Input({ style, error, icon, multiline, ...props }: InputProps) {
  const theme = useColors();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: theme.background.paper,
          borderColor: error
            ? theme.error.main
            : isFocused
            ? theme.primary.main
            : theme.border.light,
          shadowColor: theme.text.primary,
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
            isFocused && { opacity: 0.8 },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={22}
            color={
              error
                ? theme.error.main
                : isFocused
                ? theme.primary.main
                : theme.text.secondary
            }
          />
        </View>
      )}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              color: theme.text.primary,
            },
            error && { color: theme.error.main },
            icon && styles.inputWithIcon,
            multiline && styles.inputMultiline,
            style,
          ]}
          placeholderTextColor={theme.text.secondary}
          multiline={multiline}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    minHeight: 56,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  wrapperError: {
    borderWidth: 1,
  },
  wrapperFocused: {
    borderWidth: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
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
