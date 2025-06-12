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
  Modal,
  StatusBar,
  GestureResponderEvent,
  ImageSourcePropType,
  NativeSyntheticEvent,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState, useRef, useEffect, useCallback } from "react";
import React from "react";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "../../constants/Colors";
import { useMap } from "../../context/MapContext";
import * as FileSystem from "expo-file-system";
import { imageCache } from "../../services/imageCache";

const { width, height } = Dimensions.get("window");
const GRID_SPACING = 12;
const THUMBNAIL_SIZE = 60;
const THUMBNAIL_SPACING = 8;

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
  allMarkers?: Array<any>; // Todos os marcadores para o carrossel
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
  allMarkers = [],
}: PinCardProps) => {
  const router = useRouter();
  const { markers, toggleFavorite } = useMap();
  const theme = useColors();
  const isFavorite = markers.find((m) => m.id === id)?.isFavorite || false;
  const [isPressed, setIsPressed] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [cachedImageUri, setCachedImageUri] = useState<string | null>(null);
  const [imageExpanded, setImageExpanded] = useState(false);
  const [longPressActive, setLongPressActive] = useState(false);
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Estado para o carrossel
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<FlatList>(null);
  const [carouselMarkers, setCarouselMarkers] = useState<any[]>([]);

  // Estado para armazenar URIs em cache do carrossel
  const [carouselImageUris, setCarouselImageUris] = useState<
    Record<string, string>
  >({});
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>(
    {}
  );

  // Encontrar o índice do marcador atual no array de todos os marcadores
  useEffect(() => {
    if (allMarkers.length > 0) {
      const markersWithImages = allMarkers.filter((marker) => marker.image);
      setCarouselMarkers(markersWithImages);
      const index = markersWithImages.findIndex((marker) => marker.id === id);
      setCurrentIndex(index >= 0 ? index : 0);

      // Pré-carregar as primeiras imagens imediatamente
      const loadInitialImages = async () => {
        // Inicializar estado de carregamento
        const initialLoadingState: Record<string, boolean> = {};
        const initialImageUris: Record<string, string> = {};

        // Definir todas como carregando inicialmente
        markersWithImages.forEach((marker) => {
          if (marker.image) {
            initialLoadingState[marker.id] = true;
          }
        });

        setLoadingImages(initialLoadingState);

        // Carregar primeiro a imagem atual
        if (markersWithImages.length > 0 && index >= 0) {
          try {
            const currentMarker = markersWithImages[index];
            if (currentMarker && currentMarker.image) {
              const cachedUri = await imageCache.getCachedImageUri(
                currentMarker.image
              );
              if (cachedUri) {
                initialImageUris[currentMarker.id] = cachedUri;
              } else {
                const newCachedUri = await imageCache.cacheImage(
                  currentMarker.image
                );
                if (newCachedUri) {
                  initialImageUris[currentMarker.id] = newCachedUri;
                }
              }

              // Atualizar os estados com a primeira imagem carregada
              setCarouselImageUris(initialImageUris);
              setLoadingImages((prev) => ({
                ...prev,
                [currentMarker.id]: false,
              }));

              // Depois carregar as outras em segundo plano
              setTimeout(() => {
                // Carregar outras imagens em segundo plano
                markersWithImages.slice(0, 5).forEach(async (marker) => {
                  if (marker.id !== currentMarker.id && marker.image) {
                    try {
                      const cachedUri = await imageCache.getCachedImageUri(
                        marker.image
                      );
                      if (cachedUri) {
                        setCarouselImageUris((prev) => ({
                          ...prev,
                          [marker.id]: cachedUri,
                        }));
                      } else {
                        const newCachedUri = await imageCache.cacheImage(
                          marker.image
                        );
                        if (newCachedUri) {
                          setCarouselImageUris((prev) => ({
                            ...prev,
                            [marker.id]: newCachedUri,
                          }));
                        }
                      }
                    } catch (error) {
                      console.error("Erro ao carregar imagem:", error);
                    } finally {
                      setLoadingImages((prev) => ({
                        ...prev,
                        [marker.id]: false,
                      }));
                    }
                  }
                });
              }, 100);
            }
          } catch (error) {
            console.error("Erro ao carregar imagem inicial:", error);
          }
        }
      };

      loadInitialImages();
    }
  }, [allMarkers, id]);

  // Animações
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const favoriteAnim = useRef(new Animated.Value(isFavorite ? 1 : 0)).current;

  // Animações para o modal de imagem expandida
  const expandAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleImageAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.spring(favoriteAnim, {
      toValue: isFavorite ? 1 : 0,
      useNativeDriver: true,
      damping: 15,
      mass: 1,
    }).start();
  }, [isFavorite]);

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
          // Limpe a URL antes de trabalhar com ela
          const cleanedUrl = cleanImageUrl(image);

          // Se já for uma URL local, use diretamente
          if (cleanedUrl && cleanedUrl.startsWith("file://")) {
            setCachedImageUri(cleanedUrl);
            return;
          }

          if (cleanedUrl) {
            const cachedUri = await imageCache.getCachedImageUri(cleanedUrl);
            if (cachedUri) {
              setCachedImageUri(cachedUri);
            } else {
              const newCachedUri = await imageCache.cacheImage(cleanedUrl);
              if (newCachedUri) {
                setCachedImageUri(newCachedUri);
              } else {
                // Se falhar ao fazer cache, use a URL original
                setCachedImageUri(cleanedUrl);
              }
            }
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

    // Configurar temporizador para detectar long press
    longPressTimeoutRef.current = setTimeout(() => {
      setLongPressActive(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      openEditModal();
    }, 500); // 500ms é um tempo típico para long press
  };

  const handlePressOut = () => {
    setIsPressed(false);
    // Limpar o temporizador de long press se o usuário soltar antes do tempo
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      mass: 1,
    }).start();

    setLongPressActive(false);
  };

  const handlePress = () => {
    // Se o long press foi ativado, não faça nada no toque normal
    if (longPressActive) {
      return;
    }

    // Se estiver em modo de seleção, apenas alterne a seleção
    if (isSelectionMode && onToggleSelection) {
      onToggleSelection();
      return;
    }

    // Abra a imagem expandida em vez de navegar para o modal
    openExpandedImage();
  };

  const openEditModal = () => {
    // Se o modal de visualização estiver aberto, feche-o primeiro
    if (imageExpanded) {
      closeExpandedAndRun(() => {
        navigateToEditModal();
      });
    } else {
      navigateToEditModal();
    }
  };

  const navigateToEditModal = () => {
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

  const handleFavorite = async (e?: GestureResponderEvent) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await toggleFavorite(id);
    } catch (error) {
      console.error("Erro ao atualizar favorito:", error);
    }
  };

  const openExpandedImage = () => {
    if (!imageError) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Mostrar o modal imediatamente
      setImageExpanded(true);

      // Animar a abertura da imagem
      Animated.parallel([
        Animated.timing(expandAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.bezier(0.2, 0, 0.2, 1),
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleImageAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
        }),
      ]).start();

      // Após abrir o modal, verificar se todas as imagens próximas estão carregadas
      setTimeout(() => {
        if (carouselMarkers.length > 0) {
          // Garantir que a imagem atual está carregada
          const currentMarker = carouselMarkers[currentIndex];
          if (
            currentMarker &&
            currentMarker.image &&
            !carouselImageUris[currentMarker.id]
          ) {
            // Carregar a imagem atual se ainda não estiver em cache
            imageCache
              .cacheImage(currentMarker.image)
              .then((cachedUri) => {
                if (cachedUri) {
                  setCarouselImageUris((prev) => ({
                    ...prev,
                    [currentMarker.id]: cachedUri,
                  }));
                }
                setLoadingImages((prev) => ({
                  ...prev,
                  [currentMarker.id]: false,
                }));
              })
              .catch(() => {
                setLoadingImages((prev) => ({
                  ...prev,
                  [currentMarker.id]: false,
                }));
              });
          }

          // Carregar as próximas imagens em segundo plano
          const start = Math.max(0, currentIndex - 1);
          const end = Math.min(carouselMarkers.length, currentIndex + 3);

          for (let i = start; i < end; i++) {
            if (i !== currentIndex) {
              const marker = carouselMarkers[i];
              if (marker && marker.image && !carouselImageUris[marker.id]) {
                // Carregar em segundo plano sem await
                imageCache
                  .getCachedImageUri(marker.image)
                  .then((cachedUri) => {
                    if (cachedUri) {
                      setCarouselImageUris((prev) => ({
                        ...prev,
                        [marker.id]: cachedUri,
                      }));
                      setLoadingImages((prev) => ({
                        ...prev,
                        [marker.id]: false,
                      }));
                    } else {
                      return imageCache.cacheImage(marker.image);
                    }
                  })
                  .then((cachedUri) => {
                    if (cachedUri) {
                      setCarouselImageUris((prev) => ({
                        ...prev,
                        [marker.id]: cachedUri,
                      }));
                    }
                    setLoadingImages((prev) => ({
                      ...prev,
                      [marker.id]: false,
                    }));
                  })
                  .catch(() => {
                    setLoadingImages((prev) => ({
                      ...prev,
                      [marker.id]: false,
                    }));
                  });
              }
            }
          }
        }
      }, 300);
    }
  };

  // Função para lidar com o fechamento do modal - sem parâmetros para usar com eventos
  const handleCloseExpanded = () => {
    closeExpandedAndRun();
  };

  // Função para fechar e executar uma ação depois
  const closeExpandedAndRun = (callback?: () => void) => {
    // Alterar estado imediatamente para feedback visual mais rápido
    setImageExpanded(false);

    // Executar animações para uma saída suave
    Animated.parallel([
      Animated.timing(expandAnim, {
        toValue: 0,
        duration: 150, // Reduzido de 250ms para 150ms
        useNativeDriver: true,
        easing: Easing.bezier(0.2, 0, 0.2, 1),
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 100, // Reduzido de 200ms para 100ms
        useNativeDriver: true,
      }),
      Animated.timing(scaleImageAnim, {
        toValue: 0.9,
        duration: 150, // Reduzido de 250ms para 150ms
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (callback) callback();
    });
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
      cachedUrl: cachedImageUri,
      platform: Platform.OS,
      version: Platform.Version,
    });

    if (image) {
      try {
        if (image.startsWith("file://")) {
          console.log("Arquivo local com erro:", image);
        } else {
          const filename = image.split("/").pop() || "";
          const cacheKey =
            FileSystem.cacheDirectory + "image-cache/" + filename;
          const fileInfo = await FileSystem.getInfoAsync(cacheKey);

          if (fileInfo.exists) {
            await FileSystem.deleteAsync(cacheKey, { idempotent: true });
            console.log("Cache limpo para a imagem:", cacheKey);
          }
        }
      } catch (error) {
        console.error("Erro ao limpar cache da imagem:", error);
      }
    }
  };

  // Preparar source da imagem garantindo que não seja null
  const getImageSource = (): ImageSourcePropType => {
    const uri = cachedImageUri || image;
    return uri ? { uri } : { uri: "" };
  };

  const handleThumbnailPress = (index: number) => {
    setCurrentIndex(index);
    carouselRef.current?.scrollToIndex({ index, animated: true });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderCarouselItem = useCallback(
    ({ item }: { item: any; index: number }) => {
      const isLoading = loadingImages[item.id];
      const cachedUri = carouselImageUris[item.id] || item.image;

      return (
        <View style={styles.carouselItemContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : (
            <Image
              source={{ uri: cachedUri }}
              style={styles.carouselImage}
              resizeMode="contain"
              onError={() => {
                console.log("Erro ao carregar imagem no carrossel", item.id);
                setLoadingImages((prev) => ({ ...prev, [item.id]: false }));
              }}
            />
          )}
        </View>
      );
    },
    [carouselImageUris, loadingImages]
  );

  // Substituir para um componente mais simples e estável
  const GestureArea = ({ children }: { children: React.ReactNode }) => (
    <View style={{ flex: 1, width: "100%", height: "100%" }}>{children}</View>
  );

  return (
    <>
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
          delayLongPress={500}
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

      {/* Modal de imagem expandida com carrossel */}
      <Modal
        visible={imageExpanded}
        transparent={false}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleCloseExpanded}
      >
        <View style={{ flex: 1, backgroundColor: "#000000" }}>
          <StatusBar translucent backgroundColor="#000000" />

          {/* Carrossel de imagens */}
          <View style={{ flex: 1, backgroundColor: "#000000" }}>
            <FlatList
              ref={carouselRef}
              data={carouselMarkers}
              renderItem={renderCarouselItem}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={currentIndex}
              getItemLayout={(data, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              onMomentumScrollEnd={(e) => {
                const newIndex = Math.floor(
                  e.nativeEvent.contentOffset.x / width
                );
                setCurrentIndex(newIndex);
              }}
              style={{ flex: 1, backgroundColor: "#000000" }}
              bounces={false}
              overScrollMode="never"
              scrollEventThrottle={16}
            />
          </View>

          {/* Informações do pin atual */}
          {carouselMarkers.length > 0 &&
            currentIndex >= 0 &&
            currentIndex < carouselMarkers.length && (
              <View style={styles.expandedInfoContainer}>
                <LinearGradient
                  colors={["transparent", "#000000", "#000000"]}
                  style={styles.expandedGradient}
                >
                  <Text style={styles.expandedTitle}>
                    {carouselMarkers[currentIndex].title}
                  </Text>
                  <Text style={styles.expandedDescription}>
                    {carouselMarkers[currentIndex].description}
                  </Text>
                </LinearGradient>
              </View>
            )}

          {/* Miniaturas na parte inferior */}
          {carouselMarkers.length > 1 && (
            <View
              style={[
                styles.thumbnailContainer,
                { backgroundColor: "#000000" },
              ]}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnailContent}
                decelerationRate="fast"
                style={{ backgroundColor: "#000000" }}
              >
                {carouselMarkers.map((marker, index) => (
                  <TouchableOpacity
                    key={marker.id}
                    onPress={() => handleThumbnailPress(index)}
                    style={[
                      styles.thumbnailButton,
                      currentIndex === index && styles.thumbnailActive,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{
                        uri: carouselImageUris[marker.id] || marker.image,
                      }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                    {currentIndex === index && (
                      <View style={styles.thumbnailActiveOverlay} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Botões de ações */}
          <View style={styles.expandedButtonsContainer}>
            <TouchableOpacity
              style={styles.expandedButton}
              onPress={openEditModal}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <MaterialCommunityIcons name="pencil" size={30} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.expandedButton}
              onPress={handleCloseExpanded}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <MaterialCommunityIcons name="close" size={30} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Botão de favorito */}
          <TouchableOpacity
            style={styles.expandedFavoriteButton}
            onPress={handleFavorite}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <MaterialCommunityIcons
              name={isFavorite ? "heart" : "heart-outline"}
              size={32}
              color={isFavorite ? theme.primary.main : "#fff"}
            />
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 0,
    marginHorizontal: 0,
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
    width: width / 2,
    marginVertical: 0,
    marginHorizontal: 0,
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
  // Estilos para a imagem expandida
  expandedImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black", // Garantir fundo preto sólido
  },
  expandedImagePressable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  expandedImageWrapper: {
    width: width,
    height: height,
    justifyContent: "center",
    alignItems: "center",
  },
  expandedImage: {
    width: width,
    height: height * 0.8,
  },
  expandedButtonsContainer: {
    position: "absolute",
    top: 50,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
  },
  expandedButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  expandedFavoriteButton: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  expandedInfoContainer: {
    position: "absolute",
    bottom: 110,
    left: 0,
    right: 0,
    padding: 0,
    zIndex: 100,
  },
  expandedGradient: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  expandedTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  expandedDescription: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  gestureRoot: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  carouselContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: width,
    height: height,
    overflow: "hidden",
    backgroundColor: "black", // Garantir fundo preto sólido
  },
  carouselContent: {
    width: width,
    height: height,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "black", // Garantir fundo preto sólido
  },
  carouselItemContainer: {
    width: width,
    height: height,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "black", // Garantir fundo preto sólido
  },
  carouselImage: {
    width: width * 0.9, // Reduzir um pouco a largura para garantir que não apareça nas bordas
    height: height * 0.7,
    alignSelf: "center",
  },
  // Estilos de navegação removidos - usando apenas gestos
  thumbnailContainer: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    height: THUMBNAIL_SIZE + 32,
    zIndex: 110,
    backgroundColor: "transparent",
  },
  thumbnailContent: {
    paddingHorizontal: 16,
    gap: THUMBNAIL_SPACING + 4,
    alignItems: "center",
  },
  thumbnailButton: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  thumbnailActive: {
    borderColor: "#fff",
    transform: [{ scale: 1.1 }],
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  thumbnailActiveOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 7,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  flatListStyle: {
    flex: 1,
    width: width,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "black",
    zIndex: -1,
  },
});
