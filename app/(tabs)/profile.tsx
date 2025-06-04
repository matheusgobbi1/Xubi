import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';

export default function ProfileScreen() {
  const [fontsLoaded] = useFonts({
    'Anton': require('../../assets/fonts/Anton-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons 
          name="account-circle" 
          size={120} 
          color="#333" 
        />
        <Text style={styles.title}>PERFIL</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Em breve mais funcionalidades!
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  title: {
    fontFamily: 'Anton',
    fontSize: 48,
    color: '#333',
    marginTop: 16,
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 26,
  },
}); 