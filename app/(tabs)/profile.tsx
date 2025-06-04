import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import colors from '../../constants/Colors';
import { Header } from '../../components/profile/Header';
import { UserOptions } from '../../components/profile/UserOptions';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export default function ProfileScreen() {
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

  const handleEditProfile = () => {
    // Implementar edição de perfil
    console.log('Editar perfil');
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
        username="usuario"
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
          onLogout={handleLogout}
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