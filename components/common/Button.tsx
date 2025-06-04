import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import colors from '../../constants/Colors';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  outline?: boolean;
  loading?: boolean;
}

export function Button({ 
  title, 
  variant = 'primary', 
  outline = false,
  loading = false,
  style, 
  ...props 
}: ButtonProps) {
  const buttonColor = colors[variant].main;
  const backgroundColor = outline ? 'transparent' : buttonColor;
  const textColor = outline ? buttonColor : colors.text.white;

  return (
    <TouchableOpacity 
      style={[
        styles.button,
        {
          backgroundColor,
          borderColor: buttonColor,
          borderWidth: outline ? 1 : 0,
        },
        style
      ]} 
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 