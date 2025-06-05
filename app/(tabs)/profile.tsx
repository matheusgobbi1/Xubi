import { StyleSheet, View, ScrollView, Alert, Text, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import colors from '../../constants/Colors';
import { Header } from '../../components/profile/Header';
import { UserOptions } from '../../components/profile/UserOptions';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withTiming,
  useSharedValue,
  withRepeat,
  Easing
} from 'react-native-reanimated';
import { useEffect } from 'react';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export default function ProfileScreen() {
  const { user, updateAvatar, signOut } = useAuth();
  const [fontsLoaded] = useFonts({
    'Anton': require('../../assets/fonts/Anton-Regular.ttf'),
  });

  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 1000 });
    rotation.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(5, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const heartStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` }
      ],
      opacity: opacity.value
    };
  });

  const handleHeartPress = () => {
    scale.value = withSequence(
      withSpring(1.2),
      withSpring(1)
    );
  };

  if (!fontsLoaded) {
    return null;
  }

  const menuItems: { icon: IconName; label: string; color: string }[] = [
    { icon: 'cog', label: 'Configurações', color: '#666' },
    { icon: 'bell', label: 'Notificações', color: '#666' },
    { icon: 'help-circle', label: 'Ajuda', color: '#666' },
    { icon: 'information', label: 'Sobre', color: '#666' },
  ];

  const handleEditProfile = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      
      if (!result.canceled && result.assets[0].uri) {
        const imageUri = result.assets[0].uri;
        
        // Criar um FormData para enviar a imagem
        const formData = new FormData();
        formData.append('image', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as any);

        // Obter o token de autenticação
        const token = await AsyncStorage.getItem('@Xubi:token');
        
        if (!token) {
          Alert.alert('Erro', 'Sessão expirada. Por favor, faça login novamente.');
          return;
        }

        // Fazer o upload da imagem
        const uploadResponse = await axios.post(`${API_URL}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
          transformRequest: (data, headers) => {
            return data;
          },
        });

        if (!uploadResponse.data.url) {
          throw new Error('URL da imagem não retornada pelo servidor');
        }

        // Atualizar o avatar com a URL retornada pelo servidor
        const imageUrl = uploadResponse.data.url;
        await updateAvatar(imageUrl);
        
        Alert.alert('Sucesso', 'Foto de perfil atualizada com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar foto:', error);
      let errorMessage = 'Não foi possível atualizar sua foto de perfil.';
      
      if (error.response) {
        console.error('Resposta do servidor:', error.response.data);
        errorMessage = error.response.data.error || errorMessage;
      } else if (error.request) {
        console.error('Erro na requisição:', error.request);
        errorMessage = 'Não foi possível conectar ao servidor.';
      }
      
      Alert.alert('Erro', errorMessage);
    }
  };

  const handleMenuItemPress = (label: string) => {
    // Implementar ações do menu
    console.log('Menu item pressed:', label);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        username={user?.name || ''}
        avatarUrl={user?.avatar}
        onEditProfile={handleEditProfile}
      />
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <UserOptions />

        <Pressable onPress={handleHeartPress}>
          <View style={styles.loveMessageContainer}>
            <BlurView intensity={30} tint="light" style={styles.loveMessageBlur}>
              <LinearGradient
                colors={['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.5)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.loveMessageGradient}
              >
                <View style={styles.messageHeader}>
                  <Animated.View style={[styles.heartContainer, heartStyle]}>
                    <MaterialCommunityIcons name="heart" size={48} color={colors.primary.main} />
                  </Animated.View>
                  <Text style={styles.loveMessageTitle}>Nosso Amor em Números</Text>
                </View>
                <View style={styles.messageContent}>
                  <Text style={styles.loveMessageText}>
                    Cada lugar visitado é uma nova memória que construímos juntos. 
                    Continue explorando e criando momentos especiais!
                  </Text>
                </View>
                <View style={styles.messageFooter}>
                  <MaterialCommunityIcons name="star" size={20} color={colors.primary.main} />
                  <Text style={styles.messageFooterText}>Cada momento é especial</Text>
                  <MaterialCommunityIcons name="star" size={20} color={colors.primary.main} />
                </View>
              </LinearGradient>
            </BlurView>
          </View>
        </Pressable>

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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 120,
    paddingBottom: 40,
  },
  loveMessageContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  loveMessageBlur: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  loveMessageGradient: {
    padding: 24,
    borderRadius: 24,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heartContainer: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loveMessageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16,
    flex: 1,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  messageContent: {
    marginTop: 8,
    marginBottom: 16,
  },
  loveMessageText: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  messageFooterText: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
    fontStyle: 'italic',
  },
  logoutCard: {
    marginHorizontal: 20,
    marginTop: 20,
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