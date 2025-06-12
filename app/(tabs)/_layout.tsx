import { Tabs } from "expo-router";
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  TouchableOpacity,
  Animated,
  Pressable,
  Text,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../../constants/Colors";
import { useMap } from "../../context/MapContext";
import React from "react";

const { width } = Dimensions.get("window");
const BUTTON_SIZE = 52;
const BUTTON_RADIUS = 12;
const BOTTOM_POSITION_INITIAL = 20;

// Função para reduzir uso do Haptics em alguns dispositivos
const safeHaptics = {
  impactAsync: (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS === "ios") {
      setTimeout(() => Haptics.impactAsync(style), 0);
    }
  },
  selectionAsync: () => {
    if (Platform.OS === "ios") {
      setTimeout(() => Haptics.selectionAsync(), 0);
    } else {
      Haptics.selectionAsync();
    }
  },
};

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

function TabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
  isActive: boolean;
  onPress: () => void;
}) {
  const theme = useColors();
  const buttonColor = props.isActive ? theme.primary.main : "#e0e0e0";
  const shadowColor = adjustColor(buttonColor, -40);
  const textColor = props.isActive ? "#FFFFFF" : "#757575";

  return (
    <View style={styles.iconButtonContainer}>
      <Pressable
        style={({ pressed }) => [
          styles.iconButton,
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
        onPress={() => {
          props.onPress();
          safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
      >
        <MaterialCommunityIcons
          size={28}
          name={props.name}
          color={textColor}
          style={styles.buttonIcon}
        />
      </Pressable>
    </View>
  );
}

export default function TabLayout() {
  const theme = useColors();
  const insets = useSafeAreaInsets();
  const { isTabBarVisible } = useMap();
  const dynamicBottom =
    insets.bottom > 0 ? insets.bottom + 5 : BOTTOM_POSITION_INITIAL;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          bottom: dynamicBottom,
          left: 0,
          right: 0,
          height: BUTTON_SIZE,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          display: isTabBarVisible ? "flex" : "none",
          opacity: isTabBarVisible ? 1 : 0,
          zIndex: isTabBarVisible ? 1 : -1,
          pointerEvents: isTabBarVisible ? "auto" : "none",
        },
        tabBarBackground: () => <View style={{ flex: 1 }} />,
        tabBarShowLabel: false,
      }}
      tabBar={({ state, navigation }) => (
        <View
          style={[
            styles.customTabBar,
            {
              bottom: dynamicBottom,
              display: isTabBarVisible ? "flex" : "none",
              opacity: isTabBarVisible ? 1 : 0,
              zIndex: isTabBarVisible ? 1 : -1,
              pointerEvents: isTabBarVisible ? "auto" : "none",
            },
          ]}
        >
          <TabBarIcon
            name="map"
            color="white"
            isActive={state.index === 0}
            onPress={() => navigation.navigate("index")}
          />
          <TabBarIcon
            name="image"
            color="white"
            isActive={state.index === 1}
            onPress={() => navigation.navigate("two")}
          />
          <TabBarIcon
            name="account"
            color="white"
            isActive={state.index === 2}
            onPress={() => navigation.navigate("profile")}
          />
        </View>
      )}
    >
      <Tabs.Screen name="index" options={{ title: "Mapa" }} />
      <Tabs.Screen name="two" options={{ title: "Pins" }} />
      <Tabs.Screen name="profile" options={{ title: "Perfil" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  customTabBar: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    paddingHorizontal: 20,
  },
  iconButtonContainer: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  iconButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_RADIUS,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonIcon: {
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
});
