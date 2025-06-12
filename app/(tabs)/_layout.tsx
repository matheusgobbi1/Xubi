import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { View, StyleSheet, Dimensions, Platform } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../../constants/Colors";
import { useMap } from "../../context/MapContext";

const { width } = Dimensions.get("window");
const TABBAR_WIDTH = width * 0.8;
const TABBAR_HEIGHT = 70;
const TABBAR_BORDER_RADIUS = 40;
const TABBAR_HORIZONTAL_MARGIN = width * 0.1;
const BOTTOM_POSITION_INITIAL = 10;

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

function TabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
}) {
  return (
    <MaterialCommunityIcons size={28} style={{ marginBottom: -3 }} {...props} />
  );
}

export default function TabLayout() {
  const theme = useColors();
  const insets = useSafeAreaInsets();
  const { isTabBarVisible } = useMap();
  const dynamicBottom =
    insets.bottom > 0 ? insets.bottom : BOTTOM_POSITION_INITIAL;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary.main,
        tabBarInactiveTintColor:
          theme.background.default === "#FFFFFF"
            ? "#666666"
            : theme.text.primary,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          bottom: dynamicBottom,
          marginHorizontal: TABBAR_HORIZONTAL_MARGIN,
          width: TABBAR_WIDTH,
          alignSelf: "center",
          borderRadius: TABBAR_BORDER_RADIUS,
          height: TABBAR_HEIGHT,
          paddingBottom: 0,
          paddingTop: 14,
          borderTopWidth: 0,
          backgroundColor:
            theme.background.default === "#FFFFFF"
              ? "rgba(255, 255, 255, 0.42)"
              : "rgba(30, 30, 30, 0.42)",
          overflow: "hidden",
          display: isTabBarVisible ? "flex" : "none",
        },
        tabBarShowLabel: false,
        tabBarBackground: () => (
          <BlurView
            tint={theme.background.default === "#FFFFFF" ? "light" : "dark"}
            intensity={25}
            style={StyleSheet.absoluteFill}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Mapa",
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
              <TabBarIcon name="map" color={color} />
            </View>
          ),
        }}
        listeners={{
          tabPress: () =>
            safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: "Pins",
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
              <TabBarIcon name="image" color={color} />
            </View>
          ),
        }}
        listeners={{
          tabPress: () =>
            safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
              <TabBarIcon name="account" color={color} />
            </View>
          ),
        }}
        listeners={{
          tabPress: () =>
            safeHaptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});
