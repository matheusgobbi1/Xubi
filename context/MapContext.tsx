import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from "react";
import { Region } from "react-native-maps";
import { router } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { useAuth } from "./AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  DocumentData,
  DocumentReference,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../services/firebase";
import * as FileSystem from "expo-file-system";
import { uploadImage } from "../services/storage";
import { imageCache } from "../services/imageCache";
import Constants from "expo-constants";

interface Marker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  description: string;
  address: string;
  image?: string | null;
  visitedAt?: Date | null;
  isFavorite?: boolean;
  userId: string;
  createdAt:
    | Date
    | string
    | DocumentData
    | { seconds: number; nanoseconds: number };
}

interface PlaceResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface MapContextData {
  markers: Marker[];
  searchQuery: string;
  searchResults: PlaceResult[];
  isLoading: boolean;
  addMarker: (marker: Omit<Marker, "id" | "userId">) => Promise<void>;
  removeMarker: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  searchPlaces: () => Promise<void>;
  selectPlace: (place: PlaceResult) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  getFavoritesCount: () => number;
  loadMarkers: () => Promise<void>;
}

const GOOGLE_PLACES_API_KEY =
  Constants.expoConfig?.extra?.googlePlacesApiKey ||
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
const MARKERS_STORAGE_KEY = "@Xubi:markers";

const MapContext = createContext<MapContextData>({} as MapContextData);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    imageCache.initialize();
  }, []);

  useEffect(() => {
    const preloadImages = async () => {
      if (markers.length > 0) {
        for (const marker of markers) {
          if (marker.image) {
            try {
              await imageCache.cacheImage(marker.image);
            } catch (error) {
              console.error("Erro ao pré-carregar imagem:", error);
            }
          }
        }
      }
    };

    preloadImages();
  }, [markers]);

  const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL,
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem("@Xubi:token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (
        !originalRequest._retry &&
        (error.code === "ECONNABORTED" || !error.response)
      ) {
        originalRequest._retry = true;

        await new Promise((resolve) => setTimeout(resolve, 2000));

        return api(originalRequest);
      }

      if (error.code === "ECONNABORTED") {
        Alert.alert("Erro", "Tempo de conexão esgotado. Tentando novamente...");
      }

      if (!error.response) {
        Alert.alert(
          "Erro",
          "Não foi possível conectar ao servidor. Tentando novamente..."
        );
      }

      throw error;
    }
  );

  const loadMarkers = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const markersRef = collection(db, "markers");
      const q = query(markersRef, where("userId", "==", user.id));
      const querySnapshot = await getDocs(q);

      const markersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Marker[];

      setMarkers(markersData);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar os marcadores.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadMarkers();
    }
  }, [user, loadMarkers]);

  const searchPlaces = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      console.log("Iniciando busca com query:", searchQuery);
      console.log("Usando API Key:", GOOGLE_PLACES_API_KEY);

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          searchQuery
        )}&key=${GOOGLE_PLACES_API_KEY}`
      );
      const data = await response.json();
      console.log("Resposta da API:", data);

      if (data.error_message) {
        console.error("Erro da API:", data.error_message);
      }

      setSearchResults(data.predictions || []);
    } catch (error) {
      console.error("Erro na busca:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  const selectPlace = useCallback(async (place: PlaceResult) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${GOOGLE_PLACES_API_KEY}`
      );
      const data = await response.json();

      if (data.result && data.result.geometry) {
        const { lat, lng } = data.result.geometry.location;

        setSearchQuery("");
        setSearchResults([]);

        router.push({
          pathname: "/modal",
          params: {
            latitude: lat,
            longitude: lng,
            title: "",
            description: "",
            address: place.description,
          },
        });
      }
    } catch (error) {
      console.error("Erro ao obter detalhes do lugar:", error);
    }
  }, []);

  const addMarker = useCallback(
    async (marker: Omit<Marker, "id" | "userId">) => {
      if (!user) return;

      try {
        setIsLoading(true);

        let imageUrl = marker.image;

        if (marker.image?.startsWith("file://")) {
          try {
            const fileName = marker.image.split("/").pop() || "image.jpg";
            imageUrl = await uploadImage(
              marker.image,
              `markers/${user.id}`,
              fileName
            );
          } catch (error) {
            Alert.alert("Erro", "Não foi possível fazer upload da imagem.");
          }
        }

        const markersRef = collection(db, "markers");
        const newMarker = {
          ...marker,
          image: imageUrl,
          userId: user.id,
          createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(markersRef, newMarker);
        const addedMarker: Marker = {
          id: docRef.id,
          ...newMarker,
        };

        setMarkers((prev) => [...prev, addedMarker]);
      } catch (error) {
        Alert.alert("Erro", "Não foi possível adicionar o marcador.");
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const removeMarker = useCallback(
    async (id: string) => {
      if (!user) return;

      try {
        setIsLoading(true);
        const markerRef = doc(db, "markers", id);
        await deleteDoc(markerRef);
        setMarkers((prev) => prev.filter((marker) => marker.id !== id));
      } catch (error) {
        Alert.alert("Erro", "Não foi possível remover o marcador.");
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      if (!user) return;

      try {
        setIsLoading(true);
        const marker = markers.find((m) => m.id === id);
        if (!marker) return;

        const markerRef = doc(db, "markers", id);
        await updateDoc(markerRef, {
          isFavorite: !marker.isFavorite,
        });

        setMarkers((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, isFavorite: !m.isFavorite } : m
          )
        );
      } catch (error) {
        Alert.alert("Erro", "Não foi possível atualizar o favorito.");
      } finally {
        setIsLoading(false);
      }
    },
    [markers, user]
  );

  const getFavoritesCount = useCallback(() => {
    return markers.filter((marker) => marker.isFavorite).length;
  }, [markers]);

  return (
    <MapContext.Provider
      value={{
        markers,
        searchQuery,
        searchResults,
        isLoading,
        addMarker,
        removeMarker,
        setSearchQuery,
        searchPlaces,
        selectPlace,
        toggleFavorite,
        getFavoritesCount,
        loadMarkers,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMap deve ser usado dentro de um MapProvider");
  }
  return context;
};

export type { Marker };
