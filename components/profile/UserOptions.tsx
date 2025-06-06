import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  Pressable,
  Animated,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "../../constants/Colors";
import { useMap } from "../../context/MapContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRef } from "react";

const { width } = Dimensions.get("window");

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const StatCard = ({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) => {
  const theme = useColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.statCardContainer}
    >
      <Animated.View
        style={[
          styles.statCard,
          {
            transform: [{ scale: scaleAnim }],
            borderWidth: 1,
            borderColor: theme.border.light,
          },
        ]}
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
          style={styles.statGradient}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.background.paper },
            ]}
          >
            <MaterialCommunityIcons
              name={icon}
              size={32}
              color={theme.primary.main}
            />
          </View>
          <Text style={[styles.statValue, { color: theme.text.primary }]}>
            {value}
          </Text>
          <Text style={[styles.statLabel, { color: theme.text.secondary }]}>
            {label}
          </Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

export const UserOptions = () => {
  const { markers, getFavoritesCount } = useMap();

  const stats = [
    {
      icon: "map-marker" as IconName,
      label: "Xubis",
      value: markers.length.toString(),
    },
    {
      icon: "calendar-heart" as IconName,
      label: "Dias Juntos",
      value: "431",
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statCardContainer: {
    width: (width - 48) / 2,
  },
  statCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  statGradient: {
    padding: 16,
    alignItems: "center",
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
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 12,
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    fontSize: 16,
    marginTop: 6,
    fontWeight: "500",
  },
});
