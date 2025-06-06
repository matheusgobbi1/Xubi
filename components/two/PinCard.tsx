import {
  StyleSheet,
  TouchableOpacity,
  Image,
  Pressable,
  Text,
  View,
  Platform,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState, useRef, useEffect } from "react";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "../../constants/Colors";
import { useMap } from "../../context/MapContext";
import * as FileSystem from "expo-file-system";
import { imageCache } from "../../services/imageCache";

const { width } = Dimensions.get("window");
const GRID_SPACING = 12;

interface PinCardProps {
  id: string;
  title: string;
  description: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  image?: string | null;
  address: string;
  createdAt?: Date;
  visitedAt?: Date | null;
  isGridView?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
  isSelectionMode?: boolean;
}

export const PinCard = ({
  id,
  title,
  description,
  coordinate,
  image,
  address,
  createdAt = new Date(),
  visitedAt,
  isGridView = false,
  isSelected = false,
  onToggleSelection,
  isSelectionMode = false,
}: PinCardProps) => {
  const router = useRouter();
  const { markers, toggleFavorite } = useMap();
  const theme = useColors();
  const isFavorite = markers.find((m) => m.id === id)?.isFavorite || false;
  const [isPressed, setIsPressed] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [cachedImageUri, setCachedImageUri] = useState<string | null>(null);

  // Animações
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const favoriteAnim = useRef(new Animated.Value(isFavorite ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(favoriteAnim, {
      toValue: isFavorite ? 1 : 0,
      useNativeDriver: true,
      damping: 15,
      mass: 1,
    }).start();
  }, [isFavorite]);

  useEffect(() => {
    const loadCachedImage = async () => {
      if (image) {
        try {
          const cachedUri = await imageCache.getCachedImageUri(image);
          if (cachedUri) {
            setCachedImageUri(cachedUri);
          } else {
            const newCachedUri = await imageCache.cacheImage(image);
            setCachedImageUri(newCachedUri);
          }
        } catch (error) {
          console.error("Erro ao carregar imagem do cache:", error);
          setImageError(true);
        }
      }
    };

    loadCachedImage();
  }, [image]);

  const handlePressIn = () => {
    setIsPressed(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      damping: 15,
      mass: 1,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      mass: 1,
    }).start();
  };

  const handlePress = () => {
    if (isSelectionMode && onToggleSelection) {
      onToggleSelection();
      return;
    }

    router.push({
      pathname: "/modal",
      params: {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        title,
        description,
        image,
        address,
        isEditing: "true",
        markerId: id,
      },
    });
  };

  const handleFavorite = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await toggleFavorite(id);
    } catch (error) {
      console.error("Erro ao atualizar favorito:", error);
    }
  };

  const formattedDate = visitedAt
    ? format(visitedAt, "dd/MM/yyyy", { locale: ptBR })
    : format(createdAt, "dd/MM/yyyy", { locale: ptBR });

  const handleImageError = async () => {
    setImageError(true);
    console.log("Erro ao carregar imagem:", {
      id,
      title,
      imageUrl: image,
      platform: Platform.OS,
      version: Platform.Version,
    });

    if (image && FileSystem.cacheDirectory) {
      try {
        const cacheKey =
          FileSystem.cacheDirectory + image.split("/").pop() || "";
        await FileSystem.deleteAsync(cacheKey, { idempotent: true });
        console.log("Cache limpo para a imagem:", image);
      } catch (error) {
        console.error("Erro ao limpar cache da imagem:", error);
      }
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        isGridView && styles.gridContainer,
        isSelected && { borderColor: theme.primary.main },
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Pressable
        style={[
          styles.card,
          { backgroundColor: theme.background.paper },
          isPressed && { backgroundColor: theme.background.default },
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {image && !imageError ? (
          <View
            style={[
              styles.imageContainer,
              isGridView && styles.gridImageContainer,
            ]}
          >
            <Image
              source={{ uri: cachedImageUri || image }}
              style={styles.cardImage}
              resizeMode="cover"
              onError={handleImageError}
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)", "rgba(0,0,0,0.95)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.gradient}
            />
            <Animated.View
              style={[
                styles.favoriteButton,
                {
                  transform: [
                    {
                      scale: favoriteAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                onPress={handleFavorite}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={32}
                  color={isFavorite ? theme.primary.main : "#fff"}
                />
              </TouchableOpacity>
            </Animated.View>
            <View style={styles.imageOverlay}>
              <View style={styles.titleRow}>
                <Text
                  style={[
                    styles.cardTitle,
                    {
                      color: "#fff",
                      textShadowColor: "rgba(0, 0, 0, 0.75)",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 4,
                    },
                    isGridView && styles.gridCardTitle,
                  ]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              </View>
              <View style={styles.descriptionRow}>
                <Text
                  style={[
                    styles.cardDescription,
                    {
                      color: "#fff",
                      textShadowColor: "rgba(0, 0, 0, 0.75)",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 4,
                    },
                    isGridView && styles.gridCardDescription,
                  ]}
                  numberOfLines={2}
                >
                  {description}
                </Text>
                {!isGridView && (
                  <Text
                    style={[
                      styles.dateText,
                      {
                        color: "#fff",
                        textShadowColor: "rgba(0, 0, 0, 0.75)",
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 4,
                      },
                    ]}
                  >
                    {formattedDate}
                  </Text>
                )}
              </View>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.placeholderImage,
              isGridView && styles.gridPlaceholderImage,
              { backgroundColor: theme.background.paper },
            ]}
          >
            <LinearGradient
              colors={[theme.background.paper, theme.background.default]}
              style={StyleSheet.absoluteFill}
            />
            <TouchableOpacity
              onPress={handleFavorite}
              style={styles.favoriteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name={isFavorite ? "heart" : "heart-outline"}
                size={32}
                color={isFavorite ? theme.primary.main : theme.text.secondary}
              />
            </TouchableOpacity>
            <MaterialCommunityIcons
              name="image-off"
              size={40}
              color={theme.primary.main}
            />
            <View style={styles.placeholderTitleContainer}>
              <View style={styles.titleRow}>
                <Text
                  style={[
                    styles.cardTitle,
                    {
                      color: theme.text.primary,
                      textShadowColor: "transparent",
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 0,
                    },
                    isGridView && styles.gridCardTitle,
                  ]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              </View>
              <View style={styles.descriptionRow}>
                <Text
                  style={[
                    styles.cardDescription,
                    {
                      color: theme.text.secondary,
                      textShadowColor: "transparent",
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 0,
                    },
                    isGridView && styles.gridCardDescription,
                  ]}
                  numberOfLines={2}
                >
                  {description}
                </Text>
                {!isGridView && (
                  <Text
                    style={[
                      styles.dateText,
                      {
                        color: theme.text.secondary,
                        textShadowColor: "transparent",
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: 0,
                      },
                    ]}
                  >
                    {formattedDate}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}
      </Pressable>
      {isSelectionMode && (
        <View style={styles.selectionIndicator}>
          <BlurView intensity={40} tint="light" style={styles.selectionBlur}>
            <MaterialCommunityIcons
              name={
                isSelected
                  ? "checkbox-marked-circle"
                  : "checkbox-blank-circle-outline"
              }
              size={24}
              color={isSelected ? theme.primary.main : theme.text.secondary}
            />
          </BlurView>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 0,
  },
  selectedContainer: {
    borderWidth: 2,
    borderRadius: 0,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 0,
    overflow: "hidden",
    elevation: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  cardPressed: {
    backgroundColor: "#fafafa",
  },
  imageContainer: {
    height: 250,
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "60%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    letterSpacing: 0.3,
    flex: 1,
    marginRight: 8,
  },
  descriptionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 8,
  },
  cardDescription: {
    fontSize: 13,
    color: "#fff",
    lineHeight: 18,
    marginBottom: 4,
    letterSpacing: 0.2,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    flex: 1,
  },
  gridCardDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
  },
  gridFooter: {
    paddingTop: 2,
  },
  footerLeft: {
    flex: 1,
  },
  dateText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "500",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    padding: 6,
  },
  gridContainer: {
    width: (width - 2) / 2,
  },
  gridImageContainer: {
    height: 180,
  },
  gridPlaceholderImage: {
    height: 180,
  },
  gridCardTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  placeholderImage: {
    height: 180,
    backgroundColor: "#f8f8f8",
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 0,
    position: "relative",
  },
  placeholderTitleContainer: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
  },
  placeholderText: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  selectionIndicator: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 10,
  },
  selectionBlur: {
    borderRadius: 16,
    padding: 3,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
});
