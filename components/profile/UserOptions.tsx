import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../constants/Colors';
import { useMap } from '../../context/MapContext';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface UserOptionsProps {
  menuItems: {
    icon: IconName;
    label: string;
    color: string;
  }[];
  onMenuItemPress?: (label: string) => void;
}

export const UserOptions = ({
  menuItems,
  onMenuItemPress,
}: UserOptionsProps) => {
  const { markers, getFavoritesCount } = useMap();
  const { signOut } = useAuth();

  // Calcular estatísticas
  const stats = [
    { 
      icon: 'map-marker' as IconName, 
      label: 'Xubis', 
      value: markers.length.toString() 
    },
    { 
      icon: 'heart' as IconName, 
      label: 'Favoritos', 
      value: getFavoritesCount().toString() 
    },
    { 
      icon: 'map' as IconName, 
      label: 'Visitados', 
      value: markers.filter(m => m.visitedAt).length.toString() 
    },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.8)']}
              style={styles.statGradient}
            >
              <MaterialCommunityIcons name={stat.icon} size={32} color={colors.primary.main} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </LinearGradient>
          </View>
        ))}
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.menuCard}
            onPress={() => onMenuItemPress?.(item.label)}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.8)']}
              style={styles.menuGradient}
            >
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons name={item.icon} size={28} color={item.color} />
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={28} color="#666" />
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.logoutCard}
        onPress={handleLogout}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.8)']}
          style={styles.logoutGradient}
        >
          <MaterialCommunityIcons name="logout" size={28} color="#ff4444" />
          <Text style={styles.logoutText}>Sair</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statCard: {
    width: (width - 60) / 3,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  statLabel: {
    fontSize: 15,
    color: '#666',
    marginTop: 6,
  },
  menuContainer: {
    marginHorizontal: 20,
    gap: 12,
  },
  menuCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemLabel: {
    fontSize: 17,
    color: '#333',
    marginLeft: 20,
  },
  logoutCard: {
    marginTop: 30,
    marginBottom: 40,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  logoutText: {
    fontSize: 17,
    color: '#ff4444',
    marginLeft: 12,
    fontWeight: '600',
  },
}); 