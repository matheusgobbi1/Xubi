import { StyleSheet, View, TouchableOpacity, Animated, StatusBar, Platform, TextInput } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRef, useState } from 'react';
import colors from '../../constants/Colors';

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

export const Header = ({ 
  showBackButton = false, 
  isGridView = false,
  onToggleView,
  isSelectionMode = false,
  onToggleSelectionMode,
  onDeleteSelected,
  selectedCount = 0,
  onSearch
}: HeaderProps) => {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isSearching, setIsSearching] = useState(false);
  const [searchText, setSearchText] = useState('');

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    onSearch?.(text);
  };

  const handleToggleSearch = () => {
    setIsSearching(!isSearching);
    if (isSearching) {
      setSearchText('');
      onSearch?.('');
    }
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" />
      <BlurView intensity={30} tint="light" style={styles.blurContainer}>
        <View style={styles.content}>
          {showBackButton && (
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity 
                onPress={() => router.back()}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={styles.iconButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          )}
          
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
              <TouchableOpacity 
                onPress={handleToggleSearch}
                style={styles.searchCloseButton}
              >
                <MaterialCommunityIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.rightIcons}>
              {onToggleView && (
                <TouchableOpacity 
                  onPress={onToggleView}
                  style={styles.iconButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons 
                    name={isGridView ? "view-list" : "view-grid"} 
                    size={28} 
                    color="#fff" 
                  />
                </TouchableOpacity>
              )}
              
              {onToggleSelectionMode && (
                <TouchableOpacity 
                  onPress={onToggleSelectionMode}
                  style={[styles.iconButton, isSelectionMode && styles.activeButton]}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons 
                    name="checkbox-multiple-marked" 
                    size={28} 
                    color="#fff" 
                  />
                </TouchableOpacity>
              )}

              {isSelectionMode && selectedCount > 0 && onDeleteSelected && (
                <TouchableOpacity 
                  onPress={onDeleteSelected}
                  style={[styles.iconButton, styles.deleteButton]}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons 
                    name="delete-outline" 
                    size={28} 
                    color="#fff" 
                  />
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                onPress={handleToggleSearch}
                style={styles.iconButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="magnify" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  blurContainer: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight,
    paddingBottom: 24,
    backgroundColor: `${colors.primary.dark}CC`,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  iconButton: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeButton: {
    backgroundColor: `${colors.primary.dark}99`,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
  },
  rightIcons: {
    flexDirection: 'row',
    gap: 16,
    marginLeft: 'auto',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    marginRight: 16,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: '#fff',
    fontSize: 16,
  },
  searchCloseButton: {
    padding: 10,
  },
}); 