import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Animated,
  Easing,
  Pressable,
} from "react-native";
import { useColors } from "../../constants/Colors";
import { HeartPin } from "./HeartPin";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useMap } from "../../context/MapContext";
import * as FileSystem from "expo-file-system";
import { imageCache } from "../../services/imageCache";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const { width, height } = Dimensions.get("window");

// Cálculo para proporção 3:4 (largura:altura)
const CARD_WIDTH = width * 0.65; // Um pouco menor para ter mais cards visíveis
const CARD_HEIGHT = (CARD_WIDTH * 4) / 3; // Proporção 3:4
const CARD_SPACING = 12;

// Cálculos para centralização
const ITEM_WIDTH = CARD_WIDTH + CARD_SPACING; // Largura total do item incluindo o espaçamento
const HORIZONTAL_PADDING = (width - CARD_WIDTH) / 2; // Padding horizontal para centralizar

// Valores da TabBar (os mesmos do _layout.tsx)
const TABBAR_HEIGHT = 70;
const BOTTOM_POSITION_INITIAL = 10;

// Ajuste para posicionar o carousel mais abaixo e liberar espaço para os pins
const PINS_VISIBILITY_OFFSET = 100; // Pixels extras para mover o carousel para baixo

// Cores padrão para fallback
const DEFAULT_COLORS = {
  background: { paper: "#ffffff", default: "#f5f5f5" },
  text: { primary: "#000000", secondary: "#757575", tertiary: "#9e9e9e" },
  primary: { main: "#e91e63" },
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

interface MarkerData {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  description: string;
  image?: string | null;
  address: string;
}

interface PinCarouselProps {
  visible: boolean;
  markers: MarkerData[];
  selectedMarkerId: string | null;
  onSelectMarker: (marker: MarkerData) => void;
  onClose: () => void;
}

export const PinCarousel = ({
  visible,
  markers,
  selectedMarkerId,
  onSelectMarker,
  onClose,
}: PinCarouselProps) => {
  const theme = useColors() || DEFAULT_COLORS;
  const carouselRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const { setTabBarVisible } = useMap();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isManuallyScrolling, setIsManuallyScrolling] = useState(false);
  const [isScrollToMarkerInProgress, setIsScrollToMarkerInProgress] =
    useState(false);
  const [cachedImageUris, setCachedImageUris] = useState<
    Record<string, string | null>
  >({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Valores de animação
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Calcula o espaço necessário para evitar sobreposição com a tab bar
  // Ajustando para dar mais espaço ao pin no mapa
  const bottomSpacing =
    insets.bottom > 0
      ? insets.bottom + 10 // Adiciona um pequeno offset
      : BOTTOM_POSITION_INITIAL + 10;

  // Limpa a URL para uso com o cache
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

  // Carrega imagens do cache quando os marcadores mudarem
  useEffect(() => {
    const loadCachedImages = async () => {
      const newCachedUris: Record<string, string | null> = {
        ...cachedImageUris,
      };
      let hasNewCachedImages = false;

      for (const marker of markers) {
        if (
          marker.image &&
          !cachedImageUris[marker.id] &&
          !imageErrors[marker.id]
        ) {
          try {
            const cleanedUrl = cleanImageUrl(marker.image);

            // Se já for uma URL local, use diretamente
            if (cleanedUrl && cleanedUrl.startsWith("file://")) {
              newCachedUris[marker.id] = cleanedUrl;
              hasNewCachedImages = true;
              continue;
            }

            if (cleanedUrl) {
              const cachedUri = await imageCache.getCachedImageUri(cleanedUrl);
              if (cachedUri) {
                newCachedUris[marker.id] = cachedUri;
                hasNewCachedImages = true;
              } else {
                const newCachedUri = await imageCache.cacheImage(cleanedUrl);
                if (newCachedUri) {
                  newCachedUris[marker.id] = newCachedUri;
                  hasNewCachedImages = true;
                } else {
                  // Se falhar ao fazer cache, use a URL original
                  newCachedUris[marker.id] = cleanedUrl;
                  hasNewCachedImages = true;
                }
              }
            }
          } catch (error) {
            console.error("Erro ao carregar imagem do cache:", error);
            setImageErrors((prev) => ({ ...prev, [marker.id]: true }));
          }
        }
      }

      if (hasNewCachedImages) {
        setCachedImageUris(newCachedUris);
      }
    };

    if (visible && markers.length > 0) {
      loadCachedImages();
    }
  }, [markers, visible]);

  // Calcula a posição e tamanho de cada item para o scrollToIndex
  const getItemLayout = (data: any, index: number) => {
    return {
      length: ITEM_WIDTH,
      offset: index * ITEM_WIDTH,
      index,
    };
  };

  // Centraliza um item pelo índice - função auxiliar para centralização consistente
  const centerItem = (index: number, animated = true) => {
    if (!carouselRef.current || index < 0 || index >= markers.length) return;

    // Cálculo preciso do offset para centralização
    const offset = index * ITEM_WIDTH;

    // Executa o scroll com animação se solicitado
    carouselRef.current.scrollToOffset({
      offset,
      animated,
    });
  };

  // Manipula falhas ao tentar rolar para um índice
  const handleScrollToIndexFailed = (info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => {
    const wait = new Promise((resolve) => setTimeout(resolve, 100));
    wait.then(() => {
      if (carouselRef.current) {
        centerItem(info.index);
      }
    });
  };

  // Handler para detectar o início da rolagem manual pelo usuário
  const handleScrollBeginDrag = () => {
    setIsManuallyScrolling(true);
  };

  // Handler para detectar mudança de index ao arrastar
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Ignorar eventos de rolagem automática
    if (isScrollToMarkerInProgress) return;

    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / ITEM_WIDTH);

    if (index !== activeIndex && index >= 0 && index < markers.length) {
      setActiveIndex(index);
    }
  };

  // Quando terminar de arrastar, centralize no card mais próximo
  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    // Se for uma rolagem programática, apenas marca que terminou
    if (isScrollToMarkerInProgress) {
      setIsScrollToMarkerInProgress(false);
      return;
    }

    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / ITEM_WIDTH);

    if (index >= 0 && index < markers.length && isManuallyScrolling) {
      setActiveIndex(index);

      // Se o índice mudou e foi um arrastar manual, atualize o marcador selecionado
      if (markers[index].id !== selectedMarkerId) {
        onSelectMarker(markers[index]);
      }

      // Centraliza o card usando a função centralizada
      // apenas se estiver fora do centro
      if (Math.abs(contentOffsetX - index * ITEM_WIDTH) > 2) {
        centerItem(index);
      }

      setIsManuallyScrolling(false);
    }
  };

  const scrollToMarker = (markerId: string) => {
    if (!carouselRef.current || isManuallyScrolling) return;

    const index = markers.findIndex((marker) => marker.id === markerId);
    if (index !== -1) {
      setIsScrollToMarkerInProgress(true);

      // Use a função centralizada para consistência
      centerItem(index);

      // Após a animação terminar, redefina o estado
      setTimeout(() => {
        setIsScrollToMarkerInProgress(false);
      }, 300);
    }
  };

  // Função que lida com o clique no card
  const handleCardPress = (marker: MarkerData, index: number) => {
    // Primeiro atualize o estado
    setActiveIndex(index);

    // Certifique-se de que não estamos em um arrasto manual
    setIsManuallyScrolling(false);

    // Defina que estamos em uma rolagem programática
    setIsScrollToMarkerInProgress(true);

    // Centralize o card usando a função centralizada
    centerItem(index);

    // Após a animação terminar, redefina o estado
    setTimeout(() => {
      setIsScrollToMarkerInProgress(false);
    }, 300);

    // Notifique sobre a seleção do marcador
    onSelectMarker(marker);
  };

  const handleImageError = (markerId: string) => {
    setImageErrors((prev) => ({ ...prev, [markerId]: true }));

    // Limpa o cache se houver erro
    if (markers) {
      const marker = markers.find((m) => m.id === markerId);
      if (marker?.image) {
        try {
          if (!marker.image.startsWith("file://")) {
            const filename = marker.image.split("/").pop() || "";
            const cacheKey =
              FileSystem.cacheDirectory + "image-cache/" + filename;
            FileSystem.getInfoAsync(cacheKey).then((fileInfo) => {
              if (fileInfo.exists) {
                FileSystem.deleteAsync(cacheKey, { idempotent: true }).then(
                  () =>
                    console.log("Cache limpo para a imagem com erro:", cacheKey)
                );
              }
            });
          }
        } catch (error) {
          console.error("Erro ao limpar cache da imagem:", error);
        }
      }
    }
  };

  // Atualiza o índice ativo quando o marcador selecionado muda externamente (do mapa)
  useEffect(() => {
    if (
      visible &&
      selectedMarkerId &&
      !isManuallyScrolling &&
      !isScrollToMarkerInProgress
    ) {
      const index = markers.findIndex(
        (marker) => marker.id === selectedMarkerId
      );
      if (index !== -1 && index !== activeIndex) {
        setActiveIndex(index);
        scrollToMarker(selectedMarkerId);
      }
    }
  }, [selectedMarkerId, visible, markers]);

  // Atualiza a visibilidade da tabbar com base na visibilidade do carrossel
  useEffect(() => {
    setTabBarVisible(!visible);

    // Inicia a animação quando o componente é exibido
    if (visible) {
      // Reset de animações
      slideAnim.setValue(100);
      opacityAnim.setValue(0);

      // Sequência de animações
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => {
      // Restaura a visibilidade da tabbar quando o componente for desmontado
      setTabBarVisible(true);
    };
  }, [visible, setTabBarVisible, slideAnim, opacityAnim]);

  // Modificar a função onClose para restaurar a tabbar
  const handleClose = () => {
    setTabBarVisible(true);
    onClose();
  };

  const renderCard = ({ item, index }: { item: MarkerData; index: number }) => {
    const isSelected = item.id === selectedMarkerId;
    const hasError = imageErrors[item.id];
    const cachedUri = cachedImageUris[item.id];

    const backgroundColor =
      theme.background?.paper || DEFAULT_COLORS.background.paper;
    const shadowColor = adjustColor(backgroundColor, -40); // Cor mais escura para sombra

    return (
      <View style={styles.cardContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor,
              borderBottomWidth: pressed ? 3 : 6,
              borderRightWidth: pressed ? 3 : 6,
              borderLeftWidth: pressed ? 0.2 : 0.2,
              borderTopWidth: pressed ? 0.2 : 0.2,
              borderBottomColor: shadowColor,
              borderRightColor: shadowColor,
              borderLeftColor: shadowColor,
              borderTopColor: shadowColor,
              transform: [{ translateY: pressed ? 2 : 0 }],
            },
            isSelected && {
              borderColor: theme.primary?.main || DEFAULT_COLORS.primary.main,
              borderTopWidth: 2,
              borderTopColor:
                theme.primary?.main || DEFAULT_COLORS.primary.main,
            },
          ]}
          onPress={() => handleCardPress(item, index)}
        >
          {item.image && !hasError ? (
            <View style={styles.cardImageContainer}>
              <Image
                source={{ uri: cachedUri || item.image }}
                style={styles.cardImage}
                resizeMode="cover"
                onError={() => handleImageError(item.id)}
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.6)", "rgba(0,0,0,0.8)"]}
                style={styles.imageGradient}
              />
              <View style={styles.cardOverlayContent}>
                <Text style={styles.cardOverlayTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.cardOverlayDescription} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={styles.cardOverlayAddress} numberOfLines={1}>
                  {item.address}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.innerCardContainer}>
              <View
                style={[
                  styles.cardImagePlaceholder,
                  {
                    backgroundColor:
                      theme.background?.default ||
                      DEFAULT_COLORS.background.default,
                  },
                ]}
              >
                <HeartPin size={36} />
              </View>
              <View style={styles.cardContent}>
                <Text
                  style={[
                    styles.cardTitle,
                    {
                      color: theme.text?.primary || DEFAULT_COLORS.text.primary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.cardDescription,
                    {
                      color:
                        theme.text?.secondary || DEFAULT_COLORS.text.secondary,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
                <Text
                  style={[
                    styles.cardAddress,
                    {
                      color:
                        theme.text?.secondary || DEFAULT_COLORS.text.tertiary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.address}
                </Text>
              </View>
            </View>
          )}
        </Pressable>
      </View>
    );
  };

  if (!visible) return null;

  // Encontre o índice inicial com base no selectedMarkerId
  const initialScrollIndex = selectedMarkerId
    ? markers.findIndex((marker) => marker.id === selectedMarkerId)
    : 0;

  return (
    <>
      <View style={[styles.closeButtonContainer, { top: 70 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.closeButton,
            {
              backgroundColor: pressed
                ? adjustColor(theme.primary.main, -10)
                : theme.primary.main,
              borderBottomWidth: pressed ? 3 : 6,
              borderRightWidth: pressed ? 3 : 6,
              borderLeftWidth: pressed ? 0.2 : 0.2,
              borderBottomColor: adjustColor(theme.primary.main, -40),
              borderRightColor: adjustColor(theme.primary.main, -40),
              borderLeftColor: adjustColor(theme.primary.main, -40),
              transform: [{ translateY: pressed ? 2 : 0 }],
            },
          ]}
          onPress={handleClose}
        >
          <MaterialCommunityIcons
            name="close"
            size={24}
            color="#FFFFFF"
            style={styles.closeButtonIcon}
          />
        </Pressable>
      </View>

      <Animated.View
        style={[
          styles.container,
          {
            bottom: bottomSpacing,
            opacity: opacityAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <FlatList
          ref={carouselRef}
          data={markers}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_WIDTH}
          snapToAlignment="center"
          decelerationRate={0.85}
          contentContainerStyle={[
            styles.carouselContent,
            { paddingHorizontal: HORIZONTAL_PADDING },
          ]}
          getItemLayout={getItemLayout}
          onScrollToIndexFailed={handleScrollToIndexFailed}
          initialNumToRender={5}
          windowSize={7}
          onScroll={handleScroll}
          onScrollBeginDrag={handleScrollBeginDrag}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}
          bounces={false}
          snapToOffsets={markers.map((_, index) => index * ITEM_WIDTH)}
          initialScrollIndex={
            initialScrollIndex >= 0 ? initialScrollIndex : undefined
          }
        />
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    height: CARD_HEIGHT + 40, // Ajuste para a nova altura
    paddingTop: 10,
    overflow: "visible",
  },
  closeButtonContainer: {
    position: "absolute",
    right: 15,
    zIndex: 999,
    width: 50,
    height: 50,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 10,
  },
  closeButton: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
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
  closeButtonIcon: {
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  carouselContent: {
    paddingVertical: 10,
  },
  cardContainer: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_SPACING / 2,
  },
  card: {
    width: "100%",
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.5,
    elevation: 8,
  },
  innerCardContainer: {
    flex: 1,
  },
  cardImageContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
    borderRadius: 20,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  cardOverlayContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  cardOverlayTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 6,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cardOverlayDescription: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 6,
    lineHeight: 18,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardOverlayAddress: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardImagePlaceholder: {
    width: "100%",
    height: "70%",
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cardContent: {
    padding: 16,
    flex: 1,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  cardAddress: {
    fontSize: 11,
  },
});
