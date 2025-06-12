import {
  StyleSheet,
  View,
  ActivityIndicator,
  Image,
  Text,
  FlatList,
  TouchableOpacity,
  Animated,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import Svg, { Path } from "react-native-svg";
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useLayoutEffect,
} from "react";
import { useMap } from "../../context/MapContext";
import { useRouter } from "expo-router";
import { SearchBar } from "../../components/common/SearchBar";
import { useColors } from "../../constants/Colors";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useHaptics } from "../../hooks/useHaptics";
import * as Haptics from "expo-haptics";
import { imageCache } from "../../services/imageCache";
import { HeartPin, PinCarousel } from "../../components/home";
import { BlurGradient } from "../../components/common/BlurGradient";

// Cores padrão para fallback
const DEFAULT_COLORS = {
  background: { paper: "#ffffff", default: "#f5f5f5" },
  text: { primary: "#000000", secondary: "#757575", disabled: "#9e9e9e" },
  primary: { main: "#e91e63" },
};

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

const CustomMarker = ({
  marker,
  onLongPress,
  onPress,
  isSelected,
}: {
  marker: MarkerData;
  onLongPress: () => void;
  onPress: () => void;
  isSelected: boolean;
}) => {
  const theme = useColors() || DEFAULT_COLORS;
  const [longPressActive, setLongPressActive] = useState(false);
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const handlePressIn = () => {
    // Configurar temporizador para detectar long press
    longPressTimeoutRef.current = setTimeout(() => {
      setLongPressActive(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onLongPress();
    }, 500);
  };

  const handlePressOut = () => {
    // Limpar o temporizador se o usuário soltar antes do tempo
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    setLongPressActive(false);
  };

  const handlePress = () => {
    if (!longPressActive) {
      onPress();
    }
  };

  return (
    <Marker coordinate={marker.coordinate}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        delayLongPress={500}
      >
        <HeartPin image={marker.image} isSelected={isSelected} />
      </TouchableOpacity>
    </Marker>
  );
};

export default function TabOneScreen() {
  const theme = useColors() || DEFAULT_COLORS;
  const [isMapReady, setIsMapReady] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isCarouselVisible, setIsCarouselVisible] = useState(false);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;

  // Estado para controlar a animação do mapa
  const [mapZoomAnimation, setMapZoomAnimation] = useState<{
    region: Region;
    duration: number;
  } | null>(null);

  const {
    markers,
    searchQuery,
    searchResults,
    isLoading,
    setSearchQuery,
    searchPlaces,
    selectPlace,
    loadMarkers,
  } = useMap();
  const router = useRouter();
  const { impactAsync } = useHaptics();

  useEffect(() => {
    if (isMapReady) {
      loadMarkers();
    }
  }, [isMapReady, loadMarkers]);

  useEffect(() => {
    if (isSearchExpanded && searchResults.length > 0) {
      Animated.parallel([
        Animated.spring(animatedHeight, {
          toValue: 300,
          useNativeDriver: false,
          friction: 8,
          tension: 40,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(animatedHeight, {
          toValue: 0,
          useNativeDriver: false,
          friction: 8,
          tension: 40,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isSearchExpanded, searchResults.length, animatedHeight, animatedOpacity]);

  // Efeito para aplicar a animação do mapa
  useEffect(() => {
    if (mapZoomAnimation && mapRef.current) {
      mapRef.current.animateToRegion(
        mapZoomAnimation.region,
        mapZoomAnimation.duration
      );

      // Limpar a animação após aplicá-la
      const timeout = setTimeout(() => {
        setMapZoomAnimation(null);
      }, mapZoomAnimation.duration);

      return () => clearTimeout(timeout);
    }
  }, [mapZoomAnimation]);

  const handleMapPress = (event: any) => {
    if (event.nativeEvent.action === "marker-press") {
      return;
    }

    // Fechar o carrossel ao tocar no mapa
    if (isCarouselVisible) {
      setIsCarouselVisible(false);
      setSelectedMarkerId(null);
      return;
    }

    // Criar efeito visual de zoom no ponto tocado
    const { coordinate } = event.nativeEvent;

    // Apenas zoom in rápido e intenso
    setMapZoomAnimation({
      region: {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        latitudeDelta: 0.0015, // Zoom extremamente próximo
        longitudeDelta: 0.0015,
      },
      duration: 400,
    });

    impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    router.push({
      pathname: "/modal",
      params: {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        address: "",
        title: "",
        description: "",
        image: null,
      },
    });
  };

  const handleMarkerLongPress = (marker: MarkerData) => {
    // Toque longo no marcador abre o modal de edição
    navigateToEditModal(marker);
  };

  const handleMarkerPress = (marker: MarkerData) => {
    impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Centralizar o mapa já com o offset para que o pin fique visível acima do carrossel
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          // Aplicamos um deslocamento na latitude para posicionar o pin mais acima
          latitude: marker.coordinate.latitude - 0.0015, // Desloca para cima
          longitude: marker.coordinate.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
    }

    // Fechar a barra de pesquisa quando o carrossel é exibido
    if (isSearchExpanded) {
      setIsSearchExpanded(false);
    }

    setSelectedMarkerId(marker.id);
    setIsCarouselVisible(true);
  };

  const handleCarouselMarkerSelect = (marker: MarkerData) => {
    // Centralizar o mapa já com o offset para que o pin fique visível acima do carrossel
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          // Aplicamos um deslocamento na latitude para posicionar o pin mais acima
          latitude: marker.coordinate.latitude - 0.0015, // Desloca para cima
          longitude: marker.coordinate.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
    }

    // Fechar a barra de pesquisa quando um marcador é selecionado no carrossel
    if (isSearchExpanded) {
      setIsSearchExpanded(false);
    }

    setSelectedMarkerId(marker.id);
  };

  const navigateToEditModal = (marker: any) => {
    // Fechar carrossel antes de navegar
    setIsCarouselVisible(false);

    router.push({
      pathname: "/modal",
      params: {
        latitude: marker.coordinate.latitude,
        longitude: marker.coordinate.longitude,
        title: marker.title,
        description: marker.description,
        address: marker.address,
        image: marker.image,
        isEditing: "true",
        markerId: marker.id,
      },
    });
  };

  const closeCarousel = () => {
    setIsCarouselVisible(false);
    setSelectedMarkerId(null);

    // Se a barra de pesquisa estava expandida antes, podemos deixá-la fechada
    if (isSearchExpanded) {
      setIsSearchExpanded(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            theme.background?.default || DEFAULT_COLORS.background.default,
        },
      ]}
    >
      {(!isMapReady || isLoading) && (
        <View
          style={[
            styles.loadingContainer,
            {
              backgroundColor:
                theme.background?.default || DEFAULT_COLORS.background.default,
            },
          ]}
        >
          <ActivityIndicator
            size="large"
            color={theme.primary?.main || DEFAULT_COLORS.primary.main}
          />
          <Text
            style={[
              styles.loadingText,
              { color: theme.text?.primary || DEFAULT_COLORS.text.primary },
            ]}
          >
            {isLoading ? "Carregando marcadores..." : "Carregando mapa..."}
          </Text>
        </View>
      )}

      <MapView
        ref={mapRef}
        key={markers.length}
        style={styles.map}
        initialRegion={{
          latitude: -23.55052,
          longitude: -46.633308,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        onMapReady={() => setIsMapReady(true)}
        onPress={handleMapPress}
      >
        {markers.map((marker: MarkerData) => {
          const isSelected = marker.id === selectedMarkerId;
          return (
            <CustomMarker
              key={marker.id}
              marker={marker}
              onLongPress={() => handleMarkerLongPress(marker)}
              onPress={() => handleMarkerPress(marker)}
              isSelected={isSelected}
            />
          );
        })}
      </MapView>

      <PinCarousel
        visible={isCarouselVisible}
        markers={markers}
        selectedMarkerId={selectedMarkerId}
        onSelectMarker={handleCarouselMarkerSelect}
        onClose={closeCarousel}
      />

      {/* Gradientes com blur no topo e na base da tela */}
      <BlurGradient
        position="top"
        height={140}
        backgroundColor={
          theme.background?.default || DEFAULT_COLORS.background.default
        }
      />
      <BlurGradient
        position="bottom"
        height={120}
        backgroundColor={
          theme.background?.default || DEFAULT_COLORS.background.default
        }
      />

      {!isCarouselVisible && (
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSearch={searchPlaces}
          onToggle={setIsSearchExpanded}
          searchResults={searchResults}
          onSelectResult={selectPlace}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
  },
});
