import { StyleSheet, View, ScrollView, Alert } from 'react-native';
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

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export default function ProfileScreen() {
  const { user, updateAvatar } = useAuth();
  const [fontsLoaded] = useFonts({
    'Anton': require('../../assets/fonts/Anton-Regular.ttf'),
  });

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

  const handleLogout = () => {
    // Implementar logout
    console.log('Logout');
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
        <UserOptions 
          menuItems={menuItems}
          onMenuItemPress={handleMenuItemPress}
        />
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
  },
}); 