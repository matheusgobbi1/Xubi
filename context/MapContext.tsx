import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Region } from 'react-native-maps';
import { router } from 'expo-router';

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
  addMarker: (marker: Omit<Marker, 'id'>) => void;
  removeMarker: (id: string) => void;
  setSearchQuery: (query: string) => void;
  searchPlaces: () => Promise<void>;
  selectPlace: (place: PlaceResult) => Promise<void>;
}

const STORAGE_KEY = '@xubi_markers';
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

const MapContext = createContext<MapContextData>({} as MapContextData);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Limpar resultados quando o texto da pesquisa for alterado
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Carregar marcadores do AsyncStorage ao iniciar
  useEffect(() => {
    const loadMarkers = async () => {
      try {
        const storedMarkers = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedMarkers) {
          setMarkers(JSON.parse(storedMarkers));
        }
      } catch (error) {
        console.error('Erro ao carregar marcadores:', error);
      }
    };

    loadMarkers();
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
        
        // Limpar a pesquisa e resultados
        setSearchQuery('');
        setSearchResults([]);
        
        // Navegar para o modal com as coordenadas e informações do lugar
        router.push({
          pathname: '/modal',
          params: {
            latitude: lat,
            longitude: lng,
            title: place.structured_formatting.main_text,
            description: '',
            address: place.description, // Endereço completo
          },
        });
      }
    } catch (error) {
      console.error('Erro ao obter detalhes do lugar:', error);
    }
  }, []);

  const addMarker = useCallback(async (marker: Omit<Marker, 'id'>) => {
    const newMarker: Marker = {
      id: Date.now().toString(),
      ...marker,
    };

    setMarkers((prev: Marker[]) => {
      const updatedMarkers = [...prev, newMarker];
      // Salvar no AsyncStorage
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMarkers))
        .catch(error => console.error('Erro ao salvar marcadores:', error));
      return updatedMarkers;
    });
  }, []);

  const removeMarker = useCallback(async (id: string) => {
    setMarkers((prev: Marker[]) => {
      const updatedMarkers = prev.filter((marker: Marker) => marker.id !== id);
      // Salvar no AsyncStorage
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMarkers))
        .catch(error => console.error('Erro ao salvar marcadores:', error));
      return updatedMarkers;
    });
  }, []);

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
        selectPlace
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