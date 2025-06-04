import { StyleSheet, TouchableOpacity, Image, Pressable, Text, View, Animated, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../constants/Colors';
import { useMap } from '../../context/MapContext';

const { width } = Dimensions.get('window');
const GRID_SPACING = 12;

interface PinCardProps {
  id: string;
  title: string;
  description: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  image?: string | null;
  address: string;
  createdAt?: Date;
  visitedAt?: Date | null;
  isGridView?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
  isSelectionMode?: boolean;
}

export const PinCard = ({ 
  id, 
  title, 
  description, 
  coordinate, 
  image,
  address,
  createdAt = new Date(),
  visitedAt,
  isGridView = false,
  isSelected = false,
  onToggleSelection,
  isSelectionMode = false
}: PinCardProps) => {
  const router = useRouter();
  const { markers, toggleFavorite } = useMap();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = useState(false);

  const isFavorite = markers.find(m => m.id === id)?.isFavorite || false;

  const handlePressIn = () => {
    setIsPressed(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (isSelectionMode && onToggleSelection) {
      onToggleSelection();
      return;
    }
    
    router.push({
      pathname: '/modal',
      params: {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        title,
        description,
        image,
        address,
        isEditing: 'true',
        markerId: id
      },
    });
  };

  const handleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFavorite(id);
  };

  const formattedDate = visitedAt 
    ? format(visitedAt, "dd/MM/yyyy", { locale: ptBR })
    : format(createdAt, "dd/MM/yyyy", { locale: ptBR });

  const dateLabel = visitedAt ? 'Visitado em:' : 'Criado em:';

  return (
    <Animated.View style={[
      styles.container, 
      { transform: [{ scale: scaleAnim }] },
      isGridView && styles.gridContainer,
      isSelected && styles.selectedContainer
    ]}>
      <Pressable 
        style={[styles.card, isPressed && styles.cardPressed]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {image ? (
          <View style={[styles.imageContainer, isGridView && styles.gridImageContainer]}>
            <Image 
              source={{ uri: image }} 
              style={styles.cardImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.9)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.gradient}
            />
            <TouchableOpacity 
              onPress={handleFavorite}
              style={styles.favoriteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <BlurView intensity={20} style={styles.favoriteButtonBlur}>
                <MaterialCommunityIcons 
                  name={isFavorite ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isFavorite ? colors.primary.main : "#fff"} 
                />
              </BlurView>
            </TouchableOpacity>
            <View style={styles.imageOverlay}>
              <Text style={[
                styles.cardTitle, 
                !isGridView && { color: '#1a1a1a' },
                isGridView && styles.gridCardTitle
              ]} numberOfLines={1}>{title}</Text>
              {!isGridView && (
                <Text style={styles.dateText}>{formattedDate}</Text>
              )}
            </View>
          </View>
        ) : (
          <View style={[styles.placeholderImage, isGridView && styles.gridPlaceholderImage]}>
            <TouchableOpacity 
              onPress={handleFavorite}
              style={styles.favoriteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <BlurView intensity={20} style={styles.favoriteButtonBlur}>
                <MaterialCommunityIcons 
                  name={isFavorite ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isFavorite ? colors.primary.main : "#666"} 
                />
              </BlurView>
            </TouchableOpacity>
            <MaterialCommunityIcons 
              name="image-off" 
              size={40} 
              color={colors.primary.main} 
            />
            {!isGridView && (
              <Text style={styles.dateText}>{formattedDate}</Text>
            )}
          </View>
        )}
        
        <View style={[styles.cardContent, isGridView && styles.gridCardContent]}>
          {!image && (
            <View style={styles.cardHeader}>
              <Text style={[
                styles.cardTitle, 
                !isGridView && { color: '#1a1a1a' },
                isGridView && styles.gridCardTitle
              ]} numberOfLines={1}>{title}</Text>
            </View>
          )}
          
          <Text style={[styles.cardDescription, isGridView && styles.gridCardDescription]} numberOfLines={2}>
            {description}
          </Text>
          
          <View style={[styles.footer, isGridView && styles.gridFooter]}>
            <View style={styles.footerLeft}>
              {!image && (
                <Text style={styles.dateText}>{formattedDate}</Text>
              )}
            </View>
          </View>
        </View>
      </Pressable>
      {isSelectionMode && (
        <View style={styles.selectionIndicator}>
          <MaterialCommunityIcons 
            name={isSelected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} 
            size={24} 
            color={isSelected ? colors.primary.main : "#666"} 
          />
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  selectedContainer: {
    borderWidth: 2,
    borderColor: colors.primary.main,
    borderRadius: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  cardPressed: {
    backgroundColor: '#fafafa',
  },
  imageContainer: {
    height: 180,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  placeholderImage: {
    height: 140,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    letterSpacing: 0.3,
  },
  cardDescription: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  gridCardDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  gridFooter: {
    paddingTop: 4,
  },
  footerLeft: {
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  favoriteButtonBlur: {
    padding: 8,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  gridContainer: {
    width: (width - 32 - GRID_SPACING) / 2,
  },
  gridImageContainer: {
    height: 140,
  },
  gridPlaceholderImage: {
    height: 100,
  },
  gridCardContent: {
    padding: 12,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 4,
  },
  gridCardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 