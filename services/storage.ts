import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";
import * as ImagePicker from "expo-image-picker";

// Função para converter URI para Blob
const uriToBlob = async (uri: string): Promise<Blob> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  } catch (error) {
    throw new Error("Falha ao converter URI para Blob");
  }
};

// Função para fazer upload de uma imagem para o Firebase Storage
export const uploadImage = async (
  uri: string,
  path: string,
  fileName?: string
): Promise<string> => {
  try {
    // Validar URI
    if (!uri || !uri.startsWith("file://")) {
      console.error("URI inválida para upload:", uri);
      throw new Error("URI inválida");
    }

    console.log("Iniciando upload da imagem:", uri);
    console.log("Caminho de destino:", path);

    const blob = await uriToBlob(uri);

    if (blob.size === 0) {
      console.error("Arquivo vazio detectado");
      throw new Error("Arquivo vazio");
    }

    console.log("Tamanho do arquivo:", (blob.size / 1024).toFixed(2), "KB");

    // Validar tamanho máximo (5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB em bytes
    if (blob.size > MAX_SIZE) {
      console.error(
        "Arquivo muito grande:",
        (blob.size / 1024 / 1024).toFixed(2),
        "MB"
      );
      throw new Error("Arquivo muito grande. Tamanho máximo permitido: 5MB");
    }

    const name =
      fileName ||
      `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const fileRef = ref(storage, `${path}/${name}`);
    console.log("Nome do arquivo:", name);

    // Upload do arquivo com metadata
    const metadata = {
      contentType: "image/jpeg",
      customMetadata: {
        uploadedBy: "mobile-app",
        originalName: fileName || "unknown",
      },
    };

    // Tentar upload com retry
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        console.log(`Tentativa de upload ${retryCount + 1}/${maxRetries}`);
        const uploadResult = await uploadBytes(fileRef, blob, metadata);
        console.log("Upload concluído:", uploadResult.ref.fullPath);

        // Obter URL de download
        const downloadURL = await getDownloadURL(fileRef);
        console.log("URL de download obtida:", downloadURL);

        return downloadURL;
      } catch (uploadError) {
        retryCount++;
        console.error(`Erro na tentativa ${retryCount}:`, uploadError);

        if (retryCount === maxRetries) {
          console.error("Todas as tentativas falharam");
          throw uploadError;
        }

        console.log(
          `Aguardando ${1000 * retryCount}ms antes da próxima tentativa`
        );
        // Esperar um tempo antes de tentar novamente
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
      }
    }

    throw new Error("Número máximo de tentativas excedido");
  } catch (error) {
    console.error("Falha no upload da imagem:", error);
    if (error instanceof Error) {
      throw new Error(`Falha ao fazer upload da imagem: ${error.message}`);
    }
    throw new Error("Falha ao fazer upload da imagem");
  }
};

// Função para selecionar imagem da galeria
export const pickImage = async (): Promise<string | null> => {
  try {
    // Solicitar permissão para acessar a galeria
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      throw new Error("É necessário permitir o acesso à galeria de fotos");
    }

    // Abrir seletor de imagem
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }

    return null;
  } catch (error) {
    throw error;
  }
};

// Função para tirar foto com a câmera
export const takePhoto = async (): Promise<string | null> => {
  try {
    // Solicitar permissão para acessar a câmera
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      throw new Error("É necessário permitir o acesso à câmera");
    }

    // Abrir câmera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }

    return null;
  } catch (error) {
    throw error;
  }
};
