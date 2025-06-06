import {
  TextInput,
  TextInputProps,
  StyleSheet,
  View,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "../../constants/Colors";

interface InputProps extends TextInputProps {
  error?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  multiline?: boolean;
}

export function Input({ style, error, icon, multiline, ...props }: InputProps) {
  const theme = useColors();

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: theme.background.paper,
          borderColor: error ? theme.error.main : theme.border.light,
          shadowColor: theme.text.primary,
        },
        error && styles.wrapperError,
        multiline && styles.wrapperMultiline,
      ]}
    >
      {icon && (
        <View
          style={[styles.iconWrapper, multiline && styles.iconWrapperMultiline]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={22}
            color={error ? theme.error.main : theme.text.secondary}
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
