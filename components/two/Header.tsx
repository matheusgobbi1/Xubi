import React from "react";
import {
  StyleSheet,
  View,
  Animated,
  StatusBar,
  Platform,
  TextInput,
  Pressable,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useColors } from "../../constants/Colors";

interface HeaderProps {
  showBackButton?: boolean;
  isGridView?: boolean;
  onToggleView?: () => void;
  isSelectionMode?: boolean;
  onToggleSelectionMode?: () => void;
  onDeleteSelected?: () => void;
  selectedCount?: number;
  onSearch?: (text: string) => void;
}

const BUTTON_RADIUS = 12;

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

export const Header = ({
  showBackButton = false,
  isGridView = false,
  onToggleView,
  isSelectionMode = false,
  onToggleSelectionMode,
  onDeleteSelected,
  selectedCount = 0,
  onSearch,
}: HeaderProps) => {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const [searchText, setSearchText] = useState("");
  const theme = useColors();

  const handleSearch = (text: string) => {
    setSearchText(text);
    onSearch?.(text);
  };

  const handleToggleSearch = () => {
    setIsSearching(!isSearching);
    if (isSearching) {
      setSearchText("");
      onSearch?.("");
    }
  };

  const renderButton = (
    icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"],
    onPress: () => void,
    isActive: boolean = false,
    isDelete: boolean = false
  ) => {
    const buttonColor = isDelete
      ? "#ff1744"
      : isActive
      ? adjustColor(theme.primary.main, 20)
      : theme.primary.main;
    const shadowColor = adjustColor(buttonColor, -40);

    // Define o ícone correto para o botão de seleção
    let iconToUse = icon;
    if (icon === "checkbox-multiple-marked" && isActive) {
      iconToUse = "checkbox-multiple-marked-outline";
    }

    return (
      <View style={styles.iconButtonContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.iconButton,
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
          onPress={onPress}
        >
          <MaterialCommunityIcons
            name={iconToUse}
            size={24}
            color="white"
            style={styles.buttonIcon}
          />
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        {showBackButton && renderButton("arrow-left", () => router.back())}

        {isSearching ? (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar xubis..."
              placeholderTextColor="rgba(255, 255, 255, 0.7)"
              value={searchText}
              onChangeText={handleSearch}
              autoFocus
            />
            {renderButton("close", handleToggleSearch)}
          </View>
        ) : (
          <View style={styles.rightIcons}>
            {onToggleView &&
              renderButton(
                isGridView ? "view-list" : "view-grid",
                onToggleView
              )}

            {onToggleSelectionMode &&
              renderButton(
                "checkbox-multiple-marked",
                onToggleSelectionMode,
                isSelectionMode
              )}

            {isSelectionMode &&
              selectedCount > 0 &&
              onDeleteSelected &&
              renderButton("delete-outline", onDeleteSelected, false, true)}

            {renderButton("magnify", handleToggleSearch)}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight,
    paddingBottom: 24,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  iconButtonContainer: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: BUTTON_RADIUS,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 10,
  },
  buttonIcon: {
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  rightIcons: {
    flexDirection: "row",
    gap: 16,
    marginLeft: "auto",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: BUTTON_RADIUS,
    marginRight: 16,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: "#fff",
    fontSize: 16,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  searchCloseButton: {
    padding: 10,
  },
});
