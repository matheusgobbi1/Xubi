import React from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  StatusBar,
  FlatList,
  Text,
  Vibration,
  Pressable,
  Dimensions,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../../constants/Colors";
import * as Haptics from "expo-haptics";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: () => void;
  placeholder?: string;
  onToggle?: (isExpanded: boolean) => void;
  searchResults?: Array<any>;
  onSelectResult?: (result: any) => void;
}

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

export const SearchBar = ({
  value,
  onChangeText,
  onSearch,
  placeholder = "Pesquisar lugares...",
  onToggle,
  searchResults = [],
  onSelectResult,
}: SearchBarProps) => {
  const theme = useColors();
  const insets = useSafeAreaInsets();
  const topPadding =
    Platform.OS === "ios" ? 65 : (StatusBar.currentHeight || 0) + 31;
  const [isExpanded, setIsExpanded] = React.useState(false);
  const animatedWidth = React.useRef(new Animated.Value(50)).current;
  const animatedHeight = React.useRef(new Animated.Value(0)).current;
  const animatedOpacity = React.useRef(new Animated.Value(0)).current;
  const { height: screenHeight } = Dimensions.get("window");

  const buttonColor = theme.primary.main;
  const shadowColor = adjustColor(buttonColor, -40);
  const textColor = "#FFFFFF";

  // Calcular a altura necessária para mostrar até 8 resultados
  const calculateResultsHeight = () => {
    const itemHeight = 76; // Altura aproximada de cada item + espaçamento + margem de segurança
    const maxResults = 8; // Máximo de resultados a mostrar
    const resultsToShow = Math.min(searchResults.length, maxResults);
    // Adicionar padding extra para garantir que todos os resultados sejam visíveis
    const extraPadding = 20;
    const calculatedHeight = resultsToShow * itemHeight + extraPadding;

    // Limitar a altura máxima a 70% da altura da tela
    const maxHeight = screenHeight * 0.9;
    return Math.min(calculatedHeight, maxHeight);
  };

  const handleClear = () => {
    if (Platform.OS === "android") {
      Vibration.vibrate([0, 50, 30, 100]);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(
        () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
        100
      );
    }
    onChangeText("");
    onSearch();
  };

  const toggleSearch = () => {
    if (isExpanded) {
      if (Platform.OS === "android") {
        Vibration.vibrate([0, 30, 30, 120, 30, 30]);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setTimeout(
          () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
          150
        );
      }
    } else {
      if (Platform.OS === "android") {
        Vibration.vibrate([0, 30, 20, 60, 20, 150]);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(
          () =>
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
          100
        );
      }
    }

    const toValue = isExpanded ? 50 : 360;
    Animated.spring(animatedWidth, {
      toValue,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
    setIsExpanded(!isExpanded);
    if (isExpanded) {
      onChangeText("");
      onSearch();
    }
    onToggle?.(!isExpanded);
  };

  React.useEffect(() => {
    if (isExpanded && searchResults.length > 0) {
      Animated.parallel([
        Animated.spring(animatedHeight, {
          toValue: calculateResultsHeight(),
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
  }, [isExpanded, searchResults.length]);

  const handleChangeText = (text: string) => {
    onChangeText(text);
    if (!text.trim()) {
      onSearch();
    }
  };

  const handleSubmitEditing = () => {
    if (Platform.OS === "android") {
      Vibration.vibrate([0, 100, 50, 100, 50, 150]);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(
          () =>
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
          100
        );
      }, 150);
    }
    onSearch();
  };

  const handleResultSelect = (item: any) => {
    if (Platform.OS === "android") {
      Vibration.vibrate([0, 50, 30, 100, 40, 80]);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(
        () =>
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
        120
      );
    }
    const address = `${item.structured_formatting.main_text}, ${item.structured_formatting.secondary_text}`;
    onSelectResult?.({ ...item, address });
  };

  const renderSearchResult = ({ item }: { item: any }) => (
    <View style={styles.searchResultItemContainer}>
      <Pressable
        style={({ pressed }) => [
          styles.searchResultItem,
          {
            backgroundColor: pressed
              ? adjustColor(theme.background.paper, -10)
              : theme.background.paper,
            borderBottomWidth: pressed ? 3 : 6,
            borderRightWidth: pressed ? 3 : 6,
            borderLeftWidth: 0.2,
            borderBottomColor: adjustColor(theme.background.paper, -40),
            borderRightColor: adjustColor(theme.background.paper, -40),
            borderLeftColor: adjustColor(theme.background.paper, -40),
            transform: [{ translateY: pressed ? 2 : 0 }],
          },
        ]}
        onPress={() => handleResultSelect(item)}
      >
        <View style={styles.searchResultIconContainer}>
          <MaterialCommunityIcons
            name="map-marker"
            size={24}
            color={theme.primary.main}
            style={styles.searchResultIcon}
          />
        </View>
        <View style={styles.searchResultTextContainer}>
          <Text
            style={[styles.searchResultMainText, { color: theme.text.primary }]}
            numberOfLines={1}
          >
            {item.structured_formatting.main_text}
          </Text>
          <Text
            style={[
              styles.searchResultSecondaryText,
              { color: theme.text.secondary },
            ]}
            numberOfLines={1}
          >
            {item.structured_formatting.secondary_text}
          </Text>
        </View>
      </Pressable>
    </View>
  );

  // Limitar a 8 resultados para exibição
  const limitedResults = searchResults.slice(0, 8);

  return (
    <View style={[styles.container, { top: topPadding }]}>
      <Animated.View style={[styles.searchContainer, { width: animatedWidth }]}>
        <Pressable
          style={({ pressed }) => [
            styles.searchButton,
            {
              backgroundColor: pressed
                ? adjustColor(buttonColor, -10)
                : buttonColor,
              borderBottomWidth: pressed ? 3 : 6,
              borderRightWidth: pressed ? 3 : 6,
              borderLeftWidth: 0.2,
              borderBottomColor: shadowColor,
              borderRightColor: shadowColor,
              borderLeftColor: shadowColor,
              transform: [{ translateY: pressed ? 2 : 0 }],
            },
          ]}
          onPress={!isExpanded ? toggleSearch : undefined}
        >
          <View style={styles.searchContent}>
            {isExpanded ? (
              <>
                <MaterialCommunityIcons
                  name="magnify"
                  size={28}
                  color="white"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={handleChangeText}
                  placeholder={placeholder}
                  placeholderTextColor="rgba(255,255,255,0.8)"
                  returnKeyType="search"
                  onSubmitEditing={handleSubmitEditing}
                  autoFocus
                />
                {value.length > 0 && (
                  <TouchableOpacity
                    onPress={handleClear}
                    style={styles.clearButton}
                  >
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={20}
                      color="white"
                    />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={toggleSearch}
                  style={styles.closeButton}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color="white"
                    style={styles.buttonIcon}
                  />
                </TouchableOpacity>
              </>
            ) : (
              <MaterialCommunityIcons
                name="magnify"
                size={24}
                color={textColor}
                style={styles.buttonIcon}
              />
            )}
          </View>
        </Pressable>
      </Animated.View>

      {isExpanded && limitedResults.length > 0 && (
        <Animated.View
          style={[
            styles.searchResultsContainer,
            {
              height: animatedHeight,
              opacity: animatedOpacity,
              backgroundColor: "transparent",
            },
          ]}
        >
          <FlatList
            data={limitedResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.place_id}
            style={styles.searchResultsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.searchResultsContent}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 16,
    zIndex: 200,
  },
  searchContainer: {
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
    overflow: "hidden",
  },
  searchButton: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchContent: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
    width: "100%",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginLeft: 5,
    marginRight: 10,
    color: "white",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  input: {
    flex: 1,
    height: 40,
    color: "white",
    fontSize: 16,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  clearButton: {
    padding: 5,
    marginRight: 5,
  },
  closeButton: {
    padding: 5,
    marginLeft: 5,
  },
  buttonIcon: {
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  searchResultsContainer: {
    position: "absolute",
    top: 60,
    right: 0,
    width: 360,
    overflow: "visible", // Alterado para visible para evitar cortes
  },
  searchResultsList: {
    width: "100%",
  },
  searchResultsContent: {
    paddingVertical: 0,
    paddingBottom: 10, // Padding extra no final da lista
    gap: 10,
  },
  searchResultItemContainer: {
    width: "100%",
    paddingHorizontal: 5,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    minHeight: 60, // Altura mínima para garantir espaço suficiente
  },
  searchResultIconContainer: {
    marginRight: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  searchResultIcon: {
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  searchResultTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  searchResultMainText: {
    fontSize: 15,
    fontWeight: "700",
  },
  searchResultSecondaryText: {
    fontSize: 13,
    marginTop: 2,
  },
});
