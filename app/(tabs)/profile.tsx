import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  Text,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { useColors } from "../../constants/Colors";
import { Header } from "../../components/profile/Header";
import { UserOptions } from "../../components/profile/UserOptions";
import { LoveMessage } from "../../components/profile/LoveMessage";
import { useAuth } from "../../context/AuthContext";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const { width } = Dimensions.get("window");
const TABBAR_HEIGHT = 70;
const TABBAR_BOTTOM_MARGIN = 10;

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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background.default }]}
    >
      <Header username={user?.name || ""} onEditProfile={() => {}} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <UserOptions />
        <LoveMessage />

        <TouchableOpacity
          style={[
            styles.logoutCard,
            { borderWidth: 1, borderColor: theme.border.light },
          ]}
          onPress={handleLogout}
        >
          <LinearGradient
            colors={[
              theme.background.default === "#FFFFFF"
                ? "rgba(255,255,255,0.95)"
                : "rgba(30,30,30,0.95)",
              theme.background.default === "#FFFFFF"
                ? "rgba(255,255,255,0.85)"
                : "rgba(30,30,30,0.85)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoutGradient}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.background.paper },
              ]}
            >
              <MaterialCommunityIcons
                name="logout"
                size={28}
                color={theme.error.main}
              />
            </View>
            <Text style={[styles.logoutText, { color: theme.error.main }]}>
              Sair
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
    paddingTop: 90,
    paddingBottom: TABBAR_HEIGHT + TABBAR_BOTTOM_MARGIN + 20,
    paddingHorizontal: 16,
  },
  logoutCard: {
    marginHorizontal: 0,
    marginTop: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    fontSize: 18,
    marginLeft: 12,
    fontWeight: "600",
  },
});
