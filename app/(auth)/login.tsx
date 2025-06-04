import { StyleSheet, View, Animated, Dimensions } from 'react-native';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useForm } from 'react-hook-form';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef } from 'react';
import colors from '../../constants/Colors';

type LoginFormData = {
  email: string;
  password: string;
};

export default function LoginScreen() {
  const [fontsLoaded] = useFonts({
    'Anton': require('../../assets/fonts/Anton-Regular.ttf'),
  });

  const { signIn, isLoading, error } = useAuth();
  const { register, setValue, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  if (!fontsLoaded) {
    return null;
  }

  const onSubmit = async (data: LoginFormData) => {
    await signIn(data.email, data.password);
  };

  return (
    <LinearGradient
      colors={[colors.primary.main, colors.primary.dark]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>XUBI</Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.formContainer}>
            <View style={styles.form}>
              <Input
                icon="email"
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email?.message}
                onChangeText={(text) => setValue('email', text)}
                style={styles.input}
                {...register('email', {
                  required: 'Email é obrigatório',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido'
                  }
                })}
              />

              <Input
                icon="lock"
                placeholder="Senha"
                secureTextEntry
                error={errors.password?.message}
                onChangeText={(text) => setValue('password', text)}
                style={styles.input}
                {...register('password', {
                  required: 'Senha é obrigatória',
                  minLength: {
                    value: 6,
                    message: 'A senha deve ter no mínimo 6 caracteres'
                  }
                })}
              />

              <View style={styles.buttonContainer}>
                <Button
                  title="Entrar"
                  variant="primary"
                  loading={isLoading}
                  onPress={handleSubmit(onSubmit)}
                  style={styles.button}
                />
                <Text style={styles.registerText}>
                  Não tem uma conta?{' '}
                  <Text 
                    style={styles.registerLink}
                    onPress={() => router.push('/register')}
                  >
                    Registre-se
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: 'Anton',
    fontSize: 72,
    color: colors.text.white,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  formContainer: {
    backgroundColor: colors.background.default,
    borderRadius: 24,
    padding: 24,
    shadowColor: colors.background.dark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  form: {
    gap: 20,
  },
  input: {
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  buttonContainer: {
    alignItems: 'center',
    gap: 16,
  },
  button: {
    width: '100%',
  },
  registerText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  registerLink: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: colors.danger.light,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    color: colors.text.white,
    textAlign: 'center',
    fontSize: 16,
  },
}); 