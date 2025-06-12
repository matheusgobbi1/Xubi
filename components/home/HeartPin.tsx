import { View, Image, StyleSheet, TouchableOpacity } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useState, useEffect, memo } from "react";
import { useColors } from "../../constants/Colors";
import { imageCache } from "../../services/imageCache";

interface HeartPinProps {
  size?: number;
  color?: string;
  image?: string | null;
  onPress?: () => void;
  isSelected?: boolean;
}

export const HeartPin = memo(
  ({ size = 40, color, image, onPress, isSelected = false }: HeartPinProps) => {
    const theme = useColors() || {
      primary: { main: "#e91e63" },
      secondary: { main: "#ff9800" },
    };
    const [cachedImageUri, setCachedImageUri] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);

    // Função para limpar a URL da imagem
    const cleanImageUrl = (url: string | null): string | null => {
      if (!url) return null;

      // Se já for uma URL local, retorne-a sem alterações
      if (url.startsWith("file://")) return url;

      // Para URLs do Firebase Storage, ajuste para o formato adequado
      if (url.includes("firebasestorage.googleapis.com")) {
        try {
          // Verifique se a URL contém o token
          if (url.includes("token=")) {
            // Se contiver token, remova-o mantendo apenas o alt=media
            const baseUrl = url.split("?")[0];
            return `${baseUrl}?alt=media`;
          }

          // Se não tiver alt=media, adicione-o
          if (!url.includes("alt=media")) {
            return url.includes("?") ? `${url}&alt=media` : `${url}?alt=media`;
          }
        } catch (error) {
          console.error("Erro ao limpar URL:", error);
        }
      }

      return url;
    };

    useEffect(() => {
      const loadCachedImage = async () => {
        if (image) {
          try {
            // Limpe a URL antes de usar
            const cleanedUrl = cleanImageUrl(image);

            if (!cleanedUrl) return;

            if (cleanedUrl.startsWith("file://")) {
              setCachedImageUri(cleanedUrl);
              return;
            }

            const cachedUri = await imageCache.getCachedImageUri(cleanedUrl);
            if (cachedUri) {
              setCachedImageUri(cachedUri);
            } else {
              const newCachedUri = await imageCache.cacheImage(cleanedUrl);
              setCachedImageUri(newCachedUri);
            }
          } catch (error) {
            console.error("Erro ao carregar imagem do marcador:", error);
            setImageError(true);
          }
        }
      };

      loadCachedImage();
    }, [image]);

    const content = (
      <View style={styles.heartContainer}>
        <Svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          style={[
            styles.heartSvg,
            isSelected && { transform: [{ scale: 1.1 }] },
          ]}
        >
          <Path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill={
              isSelected
                ? theme.secondary?.main || "#ff9800"
                : color || theme.primary?.main || "#e91e63"
            }
          />
        </Svg>
        {image && !imageError && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: cachedImageUri || image }}
              style={styles.markerImage}
              onError={() => setImageError(true)}
            />
          </View>
        )}
      </View>
    );

    if (onPress) {
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
          {content}
        </TouchableOpacity>
      );
    }

    return content;
  }
);

const styles = StyleSheet.create({
  heartContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  heartSvg: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  imageContainer: {
    position: "absolute",
    top: "25%",
    left: "25%",
    width: "50%",
    height: "50%",
    borderRadius: 10,
    overflow: "hidden",
  },
  markerImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
});
