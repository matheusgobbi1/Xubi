import { createContext, useContext, useCallback, useState } from 'react';
import { Region } from 'react-native-maps';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  addMarker: (marker: Omit<Marker, 'id'>) => Promise<void>;
  removeMarker: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  searchPlaces: () => Promise<void>;
  selectPlace: (place: PlaceResult) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  getFavoritesCount: () => number;
  loadMarkers: () => Promise<void>;
}

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

const MapContext = createContext<MapContextData>({} as MapContextData);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const api = axios.create({
    baseURL: 'http://192.168.0.230:3000/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('@Xubi:token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('Erro na requisição:', error.response?.data || error.message);
      if (error.code === 'ECONNABORTED') {
        throw new Error('Tempo de conexão esgotado. Verifique sua internet.');
      }
      if (!error.response) {
        throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      }
      throw error;
    }
  );

  const loadMarkers = useCallback(async () => {
    try {
      const response = await api.get('/markers');
      const markersData = response.data.map((marker: any) => ({
        id: marker.id,
        coordinate: {
          latitude: marker.latitude,
          longitude: marker.longitude,
        },
        title: marker.title,
        description: marker.description,
        address: marker.address,
        image: marker.image,
        visitedAt: marker.visitedAt,
        isFavorite: marker.isFavorite,
      }));
      setMarkers(markersData);
    } catch (error) {
      console.error('Erro ao carregar marcadores:', error);
    }
  }, []);

  const searchPlaces = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          searchQuery
        )}&key=${GOOGLE_PLACES_API_KEY}`
      );
      const data = await response.json();
      setSearchResults(data.predictions || []);
    } catch (error) {
      console.error('Erro ao buscar lugares:', error);
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
        
        setSearchQuery('');
        setSearchResults([]);
        
        router.push({
          pathname: '/modal',
          params: {
            latitude: lat,
            longitude: lng,
            title: '',
            description: '',
            address: place.description,
          },
        });
      }
    } catch (error) {
      console.error('Erro ao obter detalhes do lugar:', error);
    }
  }, []);

  const addMarker = useCallback(async (marker: Omit<Marker, 'id'>) => {
    try {
      const response = await api.post('/markers', {
        latitude: marker.coordinate.latitude,
        longitude: marker.coordinate.longitude,
        title: marker.title,
        description: marker.description,
        address: marker.address,
        image: marker.image,
      });

      const newMarker = {
        id: response.data.id,
        ...marker,
      };

      setMarkers(prev => [...prev, newMarker]);
    } catch (error) {
      console.error('Erro ao adicionar marcador:', error);
      throw error;
    }
  }, []);

  const removeMarker = useCallback(async (id: string) => {
    try {
      await api.delete(`/markers/${id}`);
      setMarkers(prev => prev.filter(marker => marker.id !== id));
    } catch (error) {
      console.error('Erro ao remover marcador:', error);
      throw error;
    }
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    try {
      const marker = markers.find(m => m.id === id);
      if (!marker) return;

      const response = await api.put(`/markers/${id}`, {
        isFavorite: !marker.isFavorite,
      });

      setMarkers(prev => prev.map(m => 
        m.id === id ? { ...m, isFavorite: response.data.isFavorite } : m
      ));
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
      throw error;
    }
  }, [markers]);

  const getFavoritesCount = useCallback(() => {
    return markers.filter(marker => marker.isFavorite).length;
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
        loadMarkers
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap deve ser usado dentro de um MapProvider');
  }
  return context;
}; 