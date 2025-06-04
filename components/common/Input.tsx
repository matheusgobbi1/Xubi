import { TextInput, TextInputProps, StyleSheet, View, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  error?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  multiline?: boolean;
}

export function Input({ style, error, icon, multiline, ...props }: InputProps) {
  return (
    <View style={[
      styles.wrapper,
      error && styles.wrapperError,
      multiline && styles.wrapperMultiline
    ]}>
      {icon && (
        <View style={[
          styles.iconWrapper,
          multiline && styles.iconWrapperMultiline
        ]}>
          <MaterialCommunityIcons 
            name={icon} 
            size={22} 
            color={error ? '#ff4444' : '#666'} 
          />
        </View>
      )}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          icon && styles.inputWithIcon,
          multiline && styles.inputMultiline,
          style
        ]}
        placeholderTextColor="#999"
        multiline={multiline}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  wrapperError: {
    borderColor: '#ff4444',
  },
  wrapperMultiline: {
    minHeight: 120,
  },
  iconWrapper: {
    position: 'absolute',
    left: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
    width: 24,
    alignItems: 'center',
  },
  iconWrapperMultiline: {
    top: 12,
    bottom: 'auto',
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#333',
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
    height: '100%',
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  inputError: {
    color: '#ff4444',
  },
}); 