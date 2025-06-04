import { View, Text, StyleSheet, TouchableOpacity, Image, Keyboard, TouchableWithoutFeedback, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useMap } from '../context/MapContext';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import colors from '../constants/Colors';

export default function ModalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addMarker, markers, removeMarker } = useMap();

  const [title, setTitle] = useState(params.title as string || '');
  const [description, setDescription] = useState(params.description as string || '');
  const [address, setAddress] = useState(params.address as string || '');
  const [image, setImage] = useState<string | null>(params.image as string || null);
  const [visitedAt, setVisitedAt] = useState<Date | null>(params.visitedAt ? new Date(params.visitedAt as string) : null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const isEditing = params.isEditing === 'true';

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleConfirm = () => {
    if (title.trim() && description.trim()) {
      const newMarker = {
        coordinate: {
          latitude: Number(params.latitude),
          longitude: Number(params.longitude),
        },
        title,
        description,
        address: address || params.address as string,
        image,
        visitedAt,
      };

      if (isEditing && params.markerId) {
        removeMarker(params.markerId as string);
      }
      
      addMarker(newMarker);
      router.back();
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setVisitedAt(selectedDate);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <LinearGradient
          colors={['#ffffff', '#f8f9fa']}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={28} color="#000" />
            </TouchableOpacity>
            <Text style={styles.title}>{isEditing ? 'Editar Xubi' : 'Novo Xubi'}</Text>
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
          >
            <View style={styles.content}>
              <TouchableOpacity 
                style={styles.imageContainer} 
                onPress={pickImage}
                activeOpacity={0.8}
              >
                {image ? (
                  <Image source={{ uri: image }} style={styles.image} />
                ) : (
                  <View style={styles.imagePlaceholderContainer}>
                    <Ionicons name="camera" size={40} color="#666" />
                    <Text style={styles.imagePlaceholder}>Adicionar Foto</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Input
                placeholder="Endereço"
                value={address}
                onChangeText={setAddress}
                icon="map-marker"
                blurOnSubmit={false}
              />

              <Input
                placeholder="Título"
                value={title}
                onChangeText={setTitle}
                icon="heart"
                blurOnSubmit={false}
              />

              <Input
                placeholder="Escreva uma mensagem especial..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                icon="message-text"
                blurOnSubmit={false}
              />

              <TouchableOpacity 
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
              >
                <Input
                  placeholder="Adicionar data especial (opcional)"
                  value={visitedAt ? visitedAt.toLocaleDateString('pt-BR') : ''}
                  editable={false}
                  icon="calendar"
                  onPressIn={() => setShowDatePicker(true)}
                />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={visitedAt || new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Button 
          title="Cancelar"
          variant="danger"
          outline
          onPress={() => router.back()}
          style={styles.footerButton}
        />

        <Button 
          title={isEditing ? 'Salvar' : 'Criar Xubi'}
          variant="primary"
          onPress={handleConfirm}
          style={styles.footerButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1a1a1a',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    paddingTop: 16,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primary.main,
    borderStyle: 'dashed',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    color: '#666',
    fontSize: 16,
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  dateButton: {
  },
  dateButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#666',
  },
  addressInput: {
    backgroundColor: '#f8f9fa',
  },
}); 