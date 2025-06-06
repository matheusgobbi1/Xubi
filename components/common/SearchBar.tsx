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
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../../constants/Colors";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: () => void;
  placeholder?: string;
  onToggle?: (isExpanded: boolean) => void;
  searchResults?: Array<any>;
  onSelectResult?: (result: any) => void;
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

  const handleClear = () => {
    onChangeText("");
    onSearch();
  };

  const toggleSearch = () => {
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
  }, [isExpanded, searchResults.length]);

  const handleChangeText = (text: string) => {
    onChangeText(text);
    if (!text.trim()) {
      onSearch();
    }
  };

  const renderSearchResult = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => {
        const address = `${item.structured_formatting.main_text}, ${item.structured_formatting.secondary_text}`;
        onSelectResult?.({ ...item, address });
      }}
    >
      <MaterialCommunityIcons
        name="map-marker"
        size={20}
        color={theme.primary.main}
        style={styles.searchResultIcon}
      />
      <View style={styles.searchResultTextContainer}>
        <Text
          style={[styles.searchResultMainText, { color: theme.text.primary }]}
        >
          {item.structured_formatting.main_text}
        </Text>
        <Text
          style={[
            styles.searchResultSecondaryText,
            { color: theme.text.secondary },
          ]}
        >
          {item.structured_formatting.secondary_text}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { top: topPadding }]}>
      <Animated.View
        style={[
          styles.searchContainer,
          { width: animatedWidth, backgroundColor: theme.primary.main },
        ]}
      >
        {isExpanded && (
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
              placeholderTextColor="white"
              returnKeyType="search"
              onSubmitEditing={onSearch}
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
          </>
        )}
        <TouchableOpacity
          onPress={toggleSearch}
          style={[
            styles.toggleButton,
            isExpanded && styles.toggleButtonExpanded,
            { backgroundColor: theme.primary.dark },
          ]}
        >
          <MaterialCommunityIcons
            name={isExpanded ? "close" : "magnify"}
            size={28}
            color="white"
          />
        </TouchableOpacity>
      </Animated.View>

      {isExpanded && searchResults.length > 0 && (
        <Animated.View
          style={[
            styles.searchResultsContainer,
            {
              height: animatedHeight,
              opacity: animatedOpacity,
              backgroundColor: theme.background.paper,
              borderColor: theme.background.default,
            },
          ]}
        >
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.place_id}
            style={styles.searchResultsList}
            showsVerticalScrollIndicator={false}
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
    zIndex: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    height: 50,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  searchIcon: {
    marginLeft: 15,
    marginRight: 10,
    color: "white",
  },
  input: {
    flex: 1,
    height: 40,
    color: "white",
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
    marginRight: 10,
  },
  toggleButton: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleButtonExpanded: {
    marginLeft: "auto",
  },
  searchResultsContainer: {
    position: "absolute",
    top: 60,
    right: 0,
    backgroundColor: "white",
    borderRadius: 15,
    width: 360,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    overflow: "hidden",
  },
  searchResultsList: {
    borderRadius: 15,
  },
  searchResultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    flexDirection: "row",
    alignItems: "center",
  },
  searchResultIcon: {
    marginRight: 12,
  },
  searchResultTextContainer: {
    flex: 1,
  },
  searchResultMainText: {
    fontSize: 15,
    fontWeight: "600",
  },
  searchResultSecondaryText: {
    fontSize: 13,
    marginTop: 4,
  },
});
