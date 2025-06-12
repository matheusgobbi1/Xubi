import { StyleSheet, View, Text, Dimensions, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "../../constants/Colors";
import { useMap } from "../../context/MapContext";

const { width } = Dimensions.get("window");

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

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
  const buttonColor = theme.primary.main;
  const shadowColor = adjustColor(buttonColor, -40);

  return (
    <View style={styles.statCardContainer}>
      <Pressable
        style={({ pressed }) => [
          styles.statCard,
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
      >
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={icon}
            size={28}
            color="white"
            style={styles.buttonIcon}
          />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </Pressable>
    </View>
  );
};

export const UserOptions = () => {
  const { markers, getFavoritesCount } = useMap();

  // Contador de xubis com imagens (memórias)
  const memoriesCount = markers.filter((marker) => marker.image).length;

  // Contador de favoritos (já existe no MapContext)
  const favoritesCount = getFavoritesCount();

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
    {
      icon: "image-multiple" as IconName,
      label: "Memórias",
      value: memoriesCount.toString(),
    },
    {
      icon: "heart" as IconName,
      label: "Favoritos",
      value: favoritesCount.toString(),
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
    paddingHorizontal: 16,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statCardContainer: {
    width: (width - 48) / 2,
    marginBottom: 16,
  },
  statCard: {
    borderRadius: 12,
    alignItems: "center",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 8,
  },
  buttonIcon: {
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 4,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
});
