import { StyleSheet, FlatList, Alert, Dimensions } from 'react-native';
import { Text, View } from 'react-native';
import { useMap } from '../../context/MapContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PinCard } from '../../components/two/PinCard';
import { Header } from '../../components/two/Header';
import { Platform, StatusBar } from 'react-native';
import { useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';

const { width } = Dimensions.get('window');
const TABBAR_HEIGHT = 70;
const TABBAR_BOTTOM_MARGIN = 10;
const GRID_SPACING = 12;
const GRID_COLUMNS = 2;
const VIEW_PREFERENCE_KEY = '@xubi_view_preference';

const EmptyState = ({ searchQuery }: { searchQuery: string }) => {
  const [fontsLoaded] = useFonts({
    'Anton': require('../../assets/fonts/Anton-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons 
        name="map-marker-off" 
        size={160} 
        color="#333" 
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>
        NENHUM XUBI ADICIONADO
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? 'Tente buscar por outro termo' 
          : 'Comece marcando seus lugares favoritos no mapa'}
      </Text>
    </View>
  );
};

export default function TabTwoScreen() {
  const { markers, removeMarker } = useMap();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isGridView, setIsGridView] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMarkers, setSelectedMarkers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Carregar preferência de visualização ao iniciar
  useMemo(() => {
    const loadViewPreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem(VIEW_PREFERENCE_KEY);
        if (savedPreference !== null) {
          setIsGridView(savedPreference === 'grid');
        }
      } catch (error) {
        console.error('Erro ao carregar preferência de visualização:', error);
      }
    };
    loadViewPreference();
  }, []);

  // Função para alternar a visualização e salvar a preferência
  const handleToggleView = useCallback(async () => {
    const newViewMode = !isGridView;
    setIsGridView(newViewMode);
    try {
      await AsyncStorage.setItem(VIEW_PREFERENCE_KEY, newViewMode ? 'grid' : 'list');
    } catch (error) {
      console.error('Erro ao salvar preferência de visualização:', error);
    }
  }, [isGridView]);

  const filteredAndSortedMarkers = useMemo(() => {
    let filtered = [...markers];
    
    // Aplica o filtro de busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(marker => 
        marker.title.toLowerCase().includes(query) ||
        marker.description.toLowerCase().includes(query)
      );
    }
    
    // Ordena por favoritos
    return filtered.sort((a, b) => {
      const aIsFavorite = favorites.has(a.id);
      const bIsFavorite = favorites.has(b.id);
      
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      
      return 0;
    });
  }, [markers, favorites, searchQuery]);

  const handleRemoveMarker = (id: string) => {
    Alert.alert(
      'Remover Marcador',
      'Tem certeza que deseja remover este marcador?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Remover',
          onPress: () => {
            removeMarker(id);
            setFavorites(prev => {
              const newFavorites = new Set(prev);
              newFavorites.delete(id);
              return newFavorites;
            });
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleToggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  }, []);

  const handleToggleSelection = useCallback((id: string) => {
    if (!isSelectionMode) return;
    
    setSelectedMarkers(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, [isSelectionMode]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedMarkers.size === 0) return;

    Alert.alert(
      'Remover Marcadores',
      `Tem certeza que deseja remover ${selectedMarkers.size} marcador(es)?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Remover',
          onPress: () => {
            selectedMarkers.forEach(id => {
              removeMarker(id);
              setFavorites(prev => {
                const newFavorites = new Set(prev);
                newFavorites.delete(id);
                return newFavorites;
              });
            });
            setSelectedMarkers(new Set());
            setIsSelectionMode(false);
          },
          style: 'destructive',
        },
      ]
    );
  }, [selectedMarkers, removeMarker]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <PinCard
      key={item.id}
      id={item.id}
      title={item.title}
      description={item.description}
      coordinate={item.coordinate}
      image={item.image}
      address={item.address}
      createdAt={item.createdAt}
      visitedAt={item.visitedAt}
      isGridView={isGridView}
      isSelected={selectedMarkers.has(item.id)}
      onToggleSelection={() => handleToggleSelection(item.id)}
      isSelectionMode={isSelectionMode}
    />
  );

  const headerHeight = Platform.OS === 'ios' ? 100 : (StatusBar.currentHeight || 0) + 50;
  const bottomPadding = TABBAR_HEIGHT + TABBAR_BOTTOM_MARGIN + 20;

  return (
    <View style={styles.safeArea}>
      <Header 
        isGridView={isGridView}
        onToggleView={handleToggleView}
        isSelectionMode={isSelectionMode}
        onToggleSelectionMode={() => {
          setIsSelectionMode(prev => !prev);
          if (isSelectionMode) {
            setSelectedMarkers(new Set());
          }
        }}
        onDeleteSelected={handleDeleteSelected}
        selectedCount={selectedMarkers.size}
        onSearch={handleSearch}
      />
      <FlatList
        key={isGridView ? 'grid' : 'list'}
        data={filteredAndSortedMarkers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { 
            paddingTop: headerHeight - 10,
            paddingBottom: bottomPadding
          }
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        bounces={true}
        overScrollMode="always"
        contentInsetAdjustmentBehavior="automatic"
        numColumns={isGridView ? GRID_COLUMNS : 1}
        columnWrapperStyle={isGridView ? styles.gridRow : undefined}
        ListEmptyComponent={
          <EmptyState searchQuery={searchQuery} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: GRID_SPACING,
  },
  gridRow: {
    justifyContent: 'space-between',
    gap: GRID_SPACING,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginTop: 32,
  },
  emptyIcon: {
    marginBottom: 24,
    opacity: 0.8,
  },
  emptyTitle: {
    fontFamily: 'Anton',
    fontSize: 64,
    color: '#333',
    textAlign: 'center',
    marginBottom: 0,
    letterSpacing: 0.5,
    lineHeight: 72,
    paddingVertical: 4,
  },
  emptySubtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: '90%',
    paddingHorizontal: 8,
  },
});
