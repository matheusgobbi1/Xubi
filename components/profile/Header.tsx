import { StyleSheet, View, Text, Image, TouchableOpacity, Platform, StatusBar, Modal, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

interface HeaderProps {
  username: string;
  avatarUrl?: string;
  onEditProfile?: () => void;
}

export const Header = ({ 
  username,
  avatarUrl,
  onEditProfile 
}: HeaderProps) => {
  const { user } = useAuth();
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [fontsLoaded] = useFonts({
    'Anton': require('../../assets/fonts/Anton-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleImagePress = () => {
    if (avatarUrl) {
      setIsImageModalVisible(true);
    }
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" />
      <BlurView intensity={30} tint="light" style={styles.blurContainer}>
        <View style={styles.content}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={handleImagePress} activeOpacity={0.8}>
                <Image 
                  source={{ 
                    uri: avatarUrl || 'https://ui-avatars.com/api/?name=' + username + '&background=random'
                  }}
                  style={styles.avatar}
                />
              </TouchableOpacity>
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
              <Text style={styles.username}>{username}</Text>
              <Text style={styles.title}>PERFIL</Text>
            </View>
          </View>
        </View>
      </BlurView>

      <Modal
        visible={isImageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsImageModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setIsImageModalVisible(false)}
        >
          <Image 
            source={{ uri: avatarUrl }}
            style={styles.expandedImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>
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
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#fff',
  },
  editButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.primary.main,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  textContainer: {
    flex: 1,
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedImage: {
    width: Dimensions.get('window').width * 0.9,
    height: Dimensions.get('window').width * 0.9,
    borderRadius: 8,
  },
}); 