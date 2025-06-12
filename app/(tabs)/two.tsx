import {
  StyleSheet,
  FlatList,
  Alert,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Text, View } from "react-native";
import { useMap, Marker } from "../../context/MapContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { PinCard } from "../../components/two/PinCard";
import { Header } from "../../components/two/Header";
import { Platform, StatusBar } from "react-native";
import { useState, useCallback, useMemo, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { useColors } from "../../constants/Colors";
import { BlurGradient } from "../../components/common/BlurGradient";

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

const { width } = Dimensions.get("window");
const TABBAR_HEIGHT = 70;
const TABBAR_BOTTOM_MARGIN = 10;
const GRID_SPACING = 0;
const GRID_COLUMNS = 2;
const VIEW_PREFERENCE_KEY = "@xubi_view_preference";

const EmptyState = ({ searchQuery }: { searchQuery: string }) => {
  const [fontsLoaded] = useFonts({
    Anton: require("../../assets/fonts/Anton-Regular.ttf"),
  });
  const theme = useColors();

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="map-marker-off"
        size={160}
        color={theme.text.primary}
        style={styles.emptyIcon}
      />
      <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>
        NENHUM XUBI ADICIONADO
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
        {searchQuery
          ? "Tente buscar por outro termo"
          : "Comece marcando seus lugares favoritos no mapa"}
      </Text>
    </View>
  );
};

export default function TabTwoScreen() {
  const { markers, removeMarker, loadMarkers } = useMap();
  const theme = useColors();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isGridView, setIsGridView] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMarkers, setSelectedMarkers] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const ITEMS_PER_PAGE = 10;
  const [isLoading, setIsLoading] = useState(false);

  // Carregar preferência de visualização ao iniciar
  useEffect(() => {
    const loadViewPreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem(VIEW_PREFERENCE_KEY);
        if (savedPreference !== null) {
          setIsGridView(savedPreference === "grid");
        }
      } catch (error) {
        console.error("Erro ao carregar preferência de visualização:", error);
      }
    };
    loadViewPreference();
  }, []);

  // Carregar marcadores ao iniciar
  useEffect(() => {
    loadMarkers();
  }, [loadMarkers]);

  const filteredAndSortedMarkers = useMemo(() => {
    let filtered = [...markers];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (marker) =>
          marker.title.toLowerCase().includes(query) ||
          marker.description.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => {
      // Primeiro ordena por favorito
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;

      // Se ambos são favoritos ou não são favoritos, ordena por data de criação
      const getDate = (date: any) => {
        if (date instanceof Date) return date;
        if (typeof date === "string") return new Date(date);
        if (date && typeof date.seconds === "number")
          return new Date(date.seconds * 1000);
        return new Date();
      };

      const dateA = getDate(a.createdAt);
      const dateB = getDate(b.createdAt);

      return dateB.getTime() - dateA.getTime();
    });
  }, [markers, searchQuery]);

  const paginatedMarkers = useMemo(() => {
    // Se tiver poucos itens, retorna todos sem paginação
    if (filteredAndSortedMarkers.length <= ITEMS_PER_PAGE) {
      return filteredAndSortedMarkers;
    }
    return filteredAndSortedMarkers.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredAndSortedMarkers, page]);

  const handleLoadMore = useCallback(() => {
    // Não carrega mais se:
    // 1. Já estiver carregando
    // 2. Não houver mais dados
    // 3. Estiver em uma busca
    // 4. Tiver poucos itens
    if (
      loadingMore ||
      !hasMoreData ||
      searchQuery ||
      filteredAndSortedMarkers.length <= ITEMS_PER_PAGE
    ) {
      return;
    }

    setLoadingMore(true);

    // Simular carregamento
    setTimeout(() => {
      const nextPage = page + 1;
      const hasMore =
        nextPage * ITEMS_PER_PAGE < filteredAndSortedMarkers.length;

      setPage(nextPage);
      setHasMoreData(hasMore);
      setLoadingMore(false);
    }, 500);
  }, [
    page,
    loadingMore,
    hasMoreData,
    searchQuery,
    filteredAndSortedMarkers.length,
  ]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    setHasMoreData(true);

    try {
      await loadMarkers();
    } catch (error) {
      console.error("Erro ao atualizar marcadores:", error);
    } finally {
      setRefreshing(false);
    }
  }, [loadMarkers]);

  const handleRemoveMarker = (id: string) => {
    Alert.alert(
      "Remover Marcador",
      "Tem certeza que deseja remover este marcador?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Remover",
          onPress: () => {
            removeMarker(id);
            setFavorites((prev) => {
              const newFavorites = new Set(prev);
              newFavorites.delete(id);
              return newFavorites;
            });
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleToggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  }, []);

  const handleToggleSelection = useCallback(
    (id: string) => {
      if (!isSelectionMode) return;

      setSelectedMarkers((prev) => {
        const newSelected = new Set(prev);
        if (newSelected.has(id)) {
          newSelected.delete(id);
        } else {
          newSelected.add(id);
        }
        return newSelected;
      });
    },
    [isSelectionMode]
  );

  const handleDeleteSelected = useCallback(() => {
    if (selectedMarkers.size === 0) return;

    Alert.alert(
      "Remover Marcadores",
      `Tem certeza que deseja remover ${selectedMarkers.size} marcador(es)?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Remover",
          onPress: () => {
            selectedMarkers.forEach((id) => {
              removeMarker(id);
              setFavorites((prev) => {
                const newFavorites = new Set(prev);
                newFavorites.delete(id);
                return newFavorites;
              });
            });
            setSelectedMarkers(new Set());
            setIsSelectionMode(false);
          },
          style: "destructive",
        },
      ]
    );
  }, [selectedMarkers, removeMarker]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleToggleView = useCallback(async () => {
    const newIsGridView = !isGridView;
    setIsGridView(newIsGridView);
    try {
      await AsyncStorage.setItem(
        VIEW_PREFERENCE_KEY,
        newIsGridView ? "grid" : "list"
      );
    } catch (error) {
      console.error("Erro ao salvar preferência de visualização:", error);
    }
  }, [isGridView]);

  const renderItem = useCallback(
    ({ item, index }: { item: Marker; index: number }) => {
      const createdAt = (() => {
        if (item.createdAt instanceof Date) return item.createdAt;
        if (typeof item.createdAt === "string") return new Date(item.createdAt);
        const timestamp = item.createdAt as FirestoreTimestamp;
        if (timestamp && typeof timestamp.seconds === "number") {
          return new Date(timestamp.seconds * 1000);
        }
        return new Date();
      })();

      const visitedAt = item.visitedAt
        ? (() => {
            if (item.visitedAt instanceof Date) return item.visitedAt;
            if (typeof item.visitedAt === "string")
              return new Date(item.visitedAt);
            const timestamp = item.visitedAt as FirestoreTimestamp;
            if (timestamp && typeof timestamp.seconds === "number") {
              return new Date(timestamp.seconds * 1000);
            }
            return null;
          })()
        : null;

      return (
        <View style={isGridView ? styles.gridItem : styles.listItem}>
          <PinCard
            id={item.id}
            title={item.title}
            description={item.description}
            coordinate={item.coordinate}
            image={item.image}
            address={item.address}
            createdAt={createdAt}
            visitedAt={visitedAt}
            isGridView={isGridView}
            isSelected={selectedMarkers.has(item.id)}
            onToggleSelection={() => handleToggleSelection(item.id)}
            isSelectionMode={isSelectionMode}
            allMarkers={filteredAndSortedMarkers}
          />
        </View>
      );
    },
    [
      isGridView,
      selectedMarkers,
      isSelectionMode,
      handleToggleSelection,
      filteredAndSortedMarkers,
    ]
  );

  const headerHeight =
    Platform.OS === "ios" ? 100 : (StatusBar.currentHeight || 0) + 50;
  const bottomPadding = TABBAR_HEIGHT + TABBAR_BOTTOM_MARGIN + 20;

  return (
    <View
      style={[styles.safeArea, { backgroundColor: theme.background.default }]}
    >
      <Header
        isGridView={isGridView}
        onToggleView={handleToggleView}
        isSelectionMode={isSelectionMode}
        onToggleSelectionMode={() => {
          setIsSelectionMode((prev) => !prev);
          if (isSelectionMode) {
            setSelectedMarkers(new Set());
          }
        }}
        onDeleteSelected={handleDeleteSelected}
        selectedCount={selectedMarkers.size}
        onSearch={handleSearch}
      />
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary.main} />
          <Text style={[styles.loadingText, { color: theme.text.primary }]}>
            Carregando marcadores...
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            key={isGridView ? "grid" : "list"}
            data={paginatedMarkers}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={[
              styles.listContent,
              {
                paddingTop: headerHeight - 19,
                paddingBottom: bottomPadding,
              },
            ]}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            bounces={true}
            overScrollMode="always"
            contentInsetAdjustmentBehavior="automatic"
            numColumns={isGridView ? GRID_COLUMNS : 1}
            columnWrapperStyle={isGridView ? styles.gridRow : undefined}
            ListEmptyComponent={
              <View>
                <EmptyState searchQuery={searchQuery} />
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.primary.main]}
                tintColor={theme.primary.main}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.1}
            ListFooterComponent={
              loadingMore &&
              hasMoreData &&
              !searchQuery &&
              filteredAndSortedMarkers.length > ITEMS_PER_PAGE ? (
                <ActivityIndicator
                  size="small"
                  color={theme.primary.main}
                  style={styles.loadingIndicator}
                />
              ) : null
            }
          />

          {/* Gradientes com blur no topo e na base da tela */}
          <BlurGradient position="top" height={140} />
          <BlurGradient position="bottom" height={120} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 0,
    gap: 0,
  },
  gridRow: {
    justifyContent: "space-between",
    gap: 0,
    flexWrap: "wrap",
    marginHorizontal: 0,
  },
  gridItem: {
    width: width / 2,
    margin: 0,
    padding: 0,
  },
  listItem: {
    width: "100%",
    margin: 0,
    padding: 0,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    marginTop: 32,
  },
  emptyIcon: {
    marginBottom: 24,
    opacity: 0.8,
  },
  emptyTitle: {
    fontFamily: "Anton",
    fontSize: 64,
    textAlign: "center",
    marginBottom: 0,
    letterSpacing: 0.5,
    lineHeight: 72,
    paddingVertical: 4,
  },
  emptySubtitle: {
    fontSize: 18,
    textAlign: "center",
    lineHeight: 26,
    maxWidth: "90%",
    paddingHorizontal: 8,
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
  },
});
