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
import MapView, { Marker, Callout } from "react-native-maps";
import Svg, { Path } from "react-native-svg";
import { useState } from "react";
import { useMap } from "../../context/MapContext";
import { useRouter } from "expo-router";
import { SearchBar } from "../../components/common/SearchBar";
import { useColors } from "../../constants/Colors";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { useHaptics } from "../../hooks/useHaptics";
import * as Haptics from "expo-haptics";

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

const HeartPin = ({
  size = 40,
  color,
  image,
}: {
  size?: number;
  color?: string;
  image?: string | null;
}) => {
  const theme = useColors();
  return (
    <View style={styles.heartContainer}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={styles.heartSvg}
      >
        <Path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill={color || theme.primary.main}
        />
      </Svg>
      {image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.markerImage} />
        </View>
      )}
    </View>
  );
};

const CustomMarker = ({
  marker,
  onPress,
}: {
  marker: MarkerData;
  onPress: () => void;
}) => {
  const theme = useColors();
  return (
    <Marker coordinate={marker.coordinate} onPress={onPress}>
      <HeartPin image={marker.image} />
      <Callout tooltip>
        <View
          style={[
            styles.calloutContainer,
            { backgroundColor: theme.background.paper },
          ]}
        >
          <Text
            style={[styles.calloutTitle, { color: theme.text.primary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {marker.title}
          </Text>
          <Text
            style={[styles.calloutDescription, { color: theme.text.secondary }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {marker.description}
          </Text>
        </View>
      </Callout>
    </Marker>
  );
};

export default function TabOneScreen() {
  const theme = useColors();
  const [isMapReady, setIsMapReady] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const animatedHeight = React.useRef(new Animated.Value(0)).current;
  const animatedOpacity = React.useRef(new Animated.Value(0)).current;
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

  React.useEffect(() => {
    if (isMapReady) {
      loadMarkers();
    }
  }, [isMapReady, loadMarkers]);

  React.useEffect(() => {
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
  }, [isSearchExpanded, searchResults.length]);

  const handleMapPress = (event: any) => {
    if (event.nativeEvent.action === "marker-press") {
      return;
    }

    impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { coordinate } = event.nativeEvent;

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

  const handleMarkerPress = (marker: any) => {
    impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  return (
    <View
      style={[styles.container, { backgroundColor: theme.background.default }]}
    >
      {(!isMapReady || isLoading) && (
        <View
          style={[
            styles.loadingContainer,
            { backgroundColor: theme.background.default },
          ]}
        >
          <ActivityIndicator size="large" color={theme.primary.main} />
          <Text style={[styles.loadingText, { color: theme.text.primary }]}>
            {isLoading ? "Carregando marcadores..." : "Carregando mapa..."}
          </Text>
        </View>
      )}

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSearch={searchPlaces}
        onToggle={setIsSearchExpanded}
        searchResults={searchResults}
        onSelectResult={selectPlace}
      />

      <MapView
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
          return (
            <CustomMarker
              key={marker.id}
              marker={marker}
              onPress={() => handleMarkerPress(marker)}
            />
          );
        })}
      </MapView>
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
  calloutContainer: {
    padding: 10,
    width: 200,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
  },
});
