import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  Text,
  TouchableOpacity,
  Dimensions,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { useColors } from "../../constants/Colors";
import { UserOptions } from "../../components/profile/UserOptions";
import { LoveMessage } from "../../components/profile/LoveMessage";
import { useAuth } from "../../context/AuthContext";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { BlurGradient } from "../../components/common/BlurGradient";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const { width } = Dimensions.get("window");
const TABBAR_HEIGHT = 70;
const TABBAR_BOTTOM_MARGIN = 10;

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

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const theme = useColors();
  const [fontsLoaded] = useFonts({
    Anton: require("../../assets/fonts/Anton-Regular.ttf"),
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const buttonColor = theme.error.main;
  const shadowColor = adjustColor(buttonColor, -40);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.background.default }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
        overScrollMode="always"
        contentInsetAdjustmentBehavior="automatic"
      >
        <UserOptions />
        <LoveMessage />

        <View style={styles.logoutButtonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              {
                backgroundColor: pressed
                  ? adjustColor(buttonColor, -10)
                  : buttonColor,
                borderBottomWidth: pressed ? 3 : 6,
                borderRightWidth: pressed ? 3 : 6,
                borderLeftWidth: 0.2,
                borderBottomColor: shadowColor,
                borderRightColor: shadowColor,
                borderLeftColor: shadowColor,
                transform: [{ translateY: pressed ? 2 : 0 }],
              },
            ]}
            onPress={handleLogout}
          >
            <MaterialCommunityIcons
              name="logout"
              size={24}
              color="white"
              style={styles.buttonIcon}
            />
            <Text style={styles.logoutText}>Sair</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Gradientes com blur no topo e na base da tela */}
      <BlurGradient position="top" height={120} />
      <BlurGradient position="bottom" height={120} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: TABBAR_HEIGHT + TABBAR_BOTTOM_MARGIN + 20,
    paddingHorizontal: 0,
  },
  logoutButtonContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 10,
  },
  buttonIcon: {
    marginRight: 8,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  logoutText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
});
