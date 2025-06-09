import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  Dimensions,
  Alert,
  Linking,
} from "react-native";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { useColors } from "../../constants/Colors";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import { uploadImage } from "../../services/storage";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import * as ImagePicker from "expo-image-picker";
import { imageCache } from "../../services/imageCache";

interface HeaderProps {
  username: string;
  onEditProfile?: () => void;
}

export const Header = ({ username, onEditProfile }: HeaderProps) => {
  const theme = useColors();
  const { user } = useAuth();
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | undefined>(
    user?.avatarUrl
  );
  const [cachedAvatarUrl, setCachedAvatarUrl] = useState<string | null>(null);
  const [fontsLoaded] = useFonts({
    Anton: require("../../assets/fonts/Anton-Regular.ttf"),
    Italiano: require("../../assets/fonts/Italianno-Regular.ttf"),
  });

  useEffect(() => {
    setLocalAvatarUrl(user?.avatarUrl);
  }, [user?.avatarUrl]);

  useEffect(() => {
    const loadCachedAvatar = async () => {
      if (localAvatarUrl) {
        try {
          const cachedUri = await imageCache.getCachedImageUri(localAvatarUrl);
          if (cachedUri) {
            setCachedAvatarUrl(cachedUri);
          } else {
            const newCachedUri = await imageCache.cacheImage(localAvatarUrl);
            setCachedAvatarUrl(newCachedUri);
          }
        } catch (error) {
          console.error("Erro ao carregar avatar do cache:", error);
          setImageError(true);
        }
      }
    };

    loadCachedAvatar();
  }, [localAvatarUrl]);

  if (!fontsLoaded) {
    return null;
  }

  const handleImagePress = () => {
    if (localAvatarUrl) {
      setIsImageModalVisible(true);
    }
  };

  const handleEditProfile = async () => {
    try {
      // Solicitar permissão para acessar a galeria
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'Precisamos de permissão para acessar suas fotos. Por favor, permita o acesso nas configurações do seu dispositivo.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir Configurações', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const imageUri = result.assets[0].uri;
      if (!imageUri) {
        Alert.alert("Erro", "Não foi possível obter a imagem selecionada");
        return;
      }

      setIsUploading(true);
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      try {
        const downloadURL = await uploadImage(
          imageUri,
          "avatars",
          `${user.id}.jpg`
        );

        // Atualizar o documento do usuário no Firestore
        const userRef = doc(db, "users", user.id);
        await updateDoc(userRef, {
          avatarUrl: downloadURL,
        });

        // Atualizar o estado local imediatamente
        setLocalAvatarUrl(downloadURL);

        // Recarregar a página ou atualizar o estado
        if (onEditProfile) {
          onEditProfile();
        }
      } catch (uploadError) {
        console.error("Erro no upload:", uploadError);
        Alert.alert(
          "Erro no Upload",
          "Não foi possível fazer upload da imagem. Por favor, tente novamente."
        );
      }
    } catch (error) {
      console.error("Erro ao selecionar imagem:", error);
      Alert.alert(
        "Erro",
        "Não foi possível selecionar a imagem. Verifique as permissões do aplicativo."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" />
      <BlurView
        intensity={30}
        tint="dark"
        style={[
          styles.blurContainer,
          { backgroundColor: `${theme.primary.dark}dd` },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity
                onPress={handleImagePress}
                activeOpacity={0.8}
                style={styles.avatarTouchable}
              >
                {localAvatarUrl ? (
                  <Image
                    source={{ uri: cachedAvatarUrl || localAvatarUrl }}
                    style={styles.avatar}
                    resizeMode="cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: theme.primary.main },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="account"
                      size={32}
                      color="#fff"
                    />
                  </View>
                )}
              </TouchableOpacity>
              {onEditProfile && (
                <TouchableOpacity
                  onPress={handleEditProfile}
                  style={[
                    styles.editButton,
                    { backgroundColor: theme.primary.main },
                  ]}
                  disabled={isUploading}
                >
                  <MaterialCommunityIcons
                    name={isUploading ? "loading" : "camera"}
                    size={16}
                    color="#fff"
                  />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>Feliz Dia dos Namorados</Text>
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
          <View style={styles.modalContent}>
            {localAvatarUrl && (
              <Image
                source={{ uri: cachedAvatarUrl || localAvatarUrl }}
                style={styles.expandedImage}
                resizeMode="contain"
              />
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsImageModalVisible(false)}
            >
              <MaterialCommunityIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  blurContainer: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: "hidden",
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight,
    paddingBottom: 24,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 16,
    height: 48,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  editButton: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  textContainer: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginBottom: 2,
  },
  title: {
    marginTop: 10,
    fontFamily: "Italiano",
    fontSize: 38,
    color: "#fff",
    letterSpacing: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  expandedImage: {
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTouchable: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
  },
});
