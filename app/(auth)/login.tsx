import {
  StyleSheet,
  View,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  Pressable,
} from "react-native";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { useAuth } from "../../context/AuthContext";
import { router } from "expo-router";
import { Button } from "../../components/common/Button";
import { useForm } from "react-hook-form";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useEffect, useState } from "react";
import { useColors } from "../../constants/Colors";
import ConfettiCannon from "react-native-confetti-cannon";

type LoginFormData = {
  data: string;
};

const NUMBERS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const SPECIAL_DATE = "100224"; // Data do primeiro encontro
const SPECIAL_EMAIL = "xubi@xubi.com"; // Email da conta criada

export default function LoginScreen() {
  const theme = useColors();
  const [fontsLoaded] = useFonts({
    Anton: require("../../assets/fonts/Anton-Regular.ttf"),
    Italiano: require("../../assets/fonts/Italianno-Regular.ttf"),
  });

  const { signIn, isLoading, error } = useAuth();
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const confettiRef = useRef(null);

  if (!fontsLoaded) {
    return null;
  }

  const triggerEpicAnimation = () => {
    setShowConfetti(true);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNumberPress = (number: string) => {
    if (currentIndex < 6) {
      const newCode = [...code];
      newCode[currentIndex] = number;
      setCode(newCode);
      setCurrentIndex(currentIndex + 1);

      const currentCode = newCode.join("");
      if (currentCode === SPECIAL_DATE) {
        setIsCorrect(true);
        triggerEpicAnimation();
      } else {
        setIsCorrect(false);
        setShowConfetti(false);
      }
    }
  };

  const handleDelete = () => {
    if (currentIndex > 0) {
      const newCode = [...code];
      newCode[currentIndex - 1] = "";
      setCode(newCode);
      setCurrentIndex(currentIndex - 1);
      setIsCorrect(false);
      setShowConfetti(false);
    }
  };

  const onSubmit = async () => {
    if (isCorrect) {
      await signIn(SPECIAL_EMAIL, "100224");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={[theme.primary.dark, theme.primary.main]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text.primary }]}>
                Insira a data
              </Text>
            </View>

            {error && (
              <View
                style={[
                  styles.errorContainer,
                  { backgroundColor: theme.error.main },
                ]}
              >
                <Text style={[styles.errorText, { color: theme.text.primary }]}>
                  {error}
                </Text>
              </View>
            )}

            <Animated.View
              style={[
                styles.formContainer,
                {
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  borderWidth: 1,
                  borderColor: theme.primary.main,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {showConfetti && (
                <ConfettiCannon
                  ref={confettiRef}
                  count={200}
                  origin={{ x: -10, y: 0 }}
                  autoStart={true}
                  fadeOut={true}
                  colors={[
                    "#FFD700",
                    "#FF69B4",
                    "#FF1493",
                    "#FF69B4",
                    "#FFB6C1",
                  ]}
                />
              )}
              <View style={styles.codeDisplay}>
                {code.map((digit, index) => (
                  <View
                    key={index}
                    style={[
                      styles.codeDigit,
                      { borderColor: theme.primary.main },
                      index === currentIndex && {
                        borderColor: theme.primary.light,
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                      },
                      isCorrect && {
                        borderColor: theme.success.main,
                        backgroundColor: "rgba(0, 255, 0, 0.1)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.codeDigitText,
                        { color: theme.text.primary },
                      ]}
                    >
                      {digit || "•"}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.numpad}>
                {NUMBERS.map((number) => (
                  <Pressable
                    key={number}
                    style={[
                      styles.numButton,
                      { borderColor: theme.primary.main },
                    ]}
                    onPress={() => handleNumberPress(number)}
                  >
                    <Text
                      style={[
                        styles.numButtonText,
                        { color: theme.text.primary },
                      ]}
                    >
                      {number}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  style={[
                    styles.deleteButton,
                    { borderColor: theme.error.main },
                  ]}
                  onPress={handleDelete}
                >
                  <Text
                    style={[
                      styles.deleteButtonText,
                      { color: theme.error.main },
                    ]}
                  >
                    ⌫
                  </Text>
                </Pressable>
              </View>

              <View style={styles.buttonContainer}>
                <Button
                  title="Desbloquear"
                  variant="primary"
                  loading={isLoading}
                  onPress={onSubmit}
                  style={[
                    styles.button,
                    { borderColor: theme.primary.light },
                    !isCorrect && {
                      opacity: 0.7,
                      borderColor: theme.primary.dark,
                    },
                  ]}
                  disabled={!isCorrect}
                />
              </View>
            </Animated.View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </TouchableWithoutFeedback>
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
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontFamily: "Italianno",
    fontSize: 48,
    letterSpacing: 2,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 24,
    padding: 24,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  codeDisplay: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
    gap: 10,
  },
  codeDigit: {
    width: 40,
    height: 50,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  codeDigitText: {
    fontSize: 24,
    fontFamily: "Anton",
  },
  numpad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 15,
    marginBottom: 30,
  },
  numButton: {
    width: 70,
    height: 70,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  numButtonText: {
    fontSize: 28,
    fontFamily: "Anton",
  },
  deleteButton: {
    width: 70,
    height: 70,
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  deleteButtonText: {
    fontSize: 28,
  },
  buttonContainer: {
    alignItems: "center",
    gap: 16,
    marginTop: 10,
  },
  button: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 2,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  errorContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
  },
});
