import { StyleSheet, View, Text, Image, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  username: string;
  avatarUrl?: string;
  onEditProfile?: () => void;
}

export const Header = ({ 
  username = 'Usuário',
  avatarUrl,
  onEditProfile 
}: HeaderProps) => {
  const { user } = useAuth();
  const [fontsLoaded] = useFonts({
    'Anton': require('../../assets/fonts/Anton-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" />
      <BlurView intensity={30} tint="light" style={styles.blurContainer}>
        <View style={styles.content}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ 
                  uri: avatarUrl || 'https://ui-avatars.com/api/?name=' + username + '&background=random'
                }}
                style={styles.avatar}
              />
              {onEditProfile && (
                <TouchableOpacity 
                  onPress={onEditProfile}
                  style={styles.editButton}
                >
                  <MaterialCommunityIcons name="camera" size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.textContainer}>
              {user?.name && (
                <Text style={styles.realName}>{user.name}</Text>
              )}
              <Text style={styles.username}>{username}</Text>
              <Text style={styles.title}>PERFIL</Text>
            </View>
          </View>
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
    paddingHorizontal: 16,
    marginTop: 16,
    height: 48,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#fff',
  },
  editButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.primary.main,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  textContainer: {
    flex: 1,
  },
  realName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 2,
  },
  title: {
    fontFamily: 'Anton',
    fontSize: 24,
    color: '#fff',
    letterSpacing: 0.5,
  },
}); 