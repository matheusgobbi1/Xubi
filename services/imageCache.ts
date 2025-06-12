import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

const CACHE_DIRECTORY = FileSystem.cacheDirectory + "image-cache/";
// Cache em memória para acesso ultrarrápido às URIs mais recentes
const memoryCache = new Map<string, string>();

export const imageCache = {
  async initialize() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIRECTORY, {
          intermediates: true,
        });
      }
    } catch (error) {
      console.error("Erro ao inicializar cache de imagens:", error);
    }
  },

  // Função para limpar a URL e obter apenas o nome do arquivo sem parâmetros
  getFilenameFromUrl(url: string): string {
    try {
      // Se a URL for local, retorne apenas o nome do arquivo
      if (url.startsWith("file://")) {
        return url.split("/").pop() || `local-${Date.now()}.jpg`;
      }

      // Caso especial para URLs do Firebase Storage
      if (url.includes("firebasestorage.googleapis.com")) {
        // Extrair o nome do arquivo da URL do Firebase
        const matches = url.match(/\/o\/([^?]+)/);
        if (matches && matches[1]) {
          // Decodificar a URL codificada
          let decodedPath = decodeURIComponent(matches[1]);

          // Pegar apenas o nome do arquivo (última parte após a /)
          const filename = decodedPath.split("/").pop();

          return filename || `firebase-${Date.now()}.jpg`;
        }
      }

      // Remove parâmetros de URL (tudo após ? ou #)
      const baseUrl = url.split(/[?#]/)[0];
      // Pega apenas o nome do arquivo
      let filename = baseUrl.split("/").pop();

      // Se não conseguir extrair um nome válido, gera um nome aleatório
      if (!filename || filename.length < 3) {
        filename = `image-${Date.now()}.jpg`;
      }

      // Limita o tamanho do nome para evitar problemas no sistema de arquivos
      if (filename.length > 100) {
        const extension = filename.includes(".")
          ? filename.substring(filename.lastIndexOf("."))
          : ".jpg";
        filename = filename.substring(0, 90) + extension;
      }

      return filename;
    } catch (error) {
      console.error("Erro ao processar nome de arquivo:", error, "URL:", url);
      return `fallback-${Date.now()}.jpg`;
    }
  },

  async getCachedImageUri(imageUrl: string): Promise<string | null> {
    if (!imageUrl) return null;

    try {
      // Primeiro verifica no cache em memória para resposta imediata
      if (memoryCache.has(imageUrl)) {
        return memoryCache.get(imageUrl) || null;
      }

      // Verifica se já é uma URL local
      if (imageUrl.startsWith("file://")) {
        memoryCache.set(imageUrl, imageUrl);
        return imageUrl;
      }

      const filename = this.getFilenameFromUrl(imageUrl);
      const cacheKey = CACHE_DIRECTORY + filename;
      const fileInfo = await FileSystem.getInfoAsync(cacheKey);

      if (fileInfo.exists) {
        const uri = Platform.OS === "android" ? `file://${cacheKey}` : cacheKey;
        // Salva no cache em memória para futuras consultas
        memoryCache.set(imageUrl, uri);
        return uri;
      }

      return null;
    } catch (error) {
      console.error("Erro ao verificar cache:", error);
      return null;
    }
  },

  async cacheImage(imageUrl: string): Promise<string | null> {
    if (!imageUrl) return null;

    try {
      // Verifica primeiro no cache de memória
      if (memoryCache.has(imageUrl)) {
        return memoryCache.get(imageUrl) || null;
      }

      // Se já for uma URL local, retorne-a diretamente
      if (imageUrl.startsWith("file://")) {
        memoryCache.set(imageUrl, imageUrl);
        return imageUrl;
      }

      const filename = this.getFilenameFromUrl(imageUrl);
      const cacheKey = CACHE_DIRECTORY + filename;
      const fileInfo = await FileSystem.getInfoAsync(cacheKey);

      if (fileInfo.exists) {
        const uri = Platform.OS === "android" ? `file://${cacheKey}` : cacheKey;
        memoryCache.set(imageUrl, uri);
        return uri;
      }

      // Caso especial para URLs do Firebase Storage
      let downloadUrl = imageUrl;
      if (imageUrl.includes("firebasestorage.googleapis.com")) {
        // Garantir que a URL tenha o parâmetro alt=media para download
        if (!imageUrl.includes("alt=media")) {
          downloadUrl = imageUrl.includes("?")
            ? `${imageUrl}&alt=media`
            : `${imageUrl}?alt=media`;
        }

        // Remove tokens de autenticação, que podem expirar
        if (downloadUrl.includes("token=")) {
          downloadUrl = downloadUrl.replace(/&token=[^&]+/, "");
        }
      }

      const downloadResult = await FileSystem.downloadAsync(
        downloadUrl,
        cacheKey
      );

      if (downloadResult.status !== 200) {
        console.error("Erro ao baixar imagem:", downloadResult);
        return null;
      }

      const uri = Platform.OS === "android" ? `file://${cacheKey}` : cacheKey;
      memoryCache.set(imageUrl, uri);
      return uri;
    } catch (error) {
      console.error("Erro ao fazer cache da imagem:", error, "URL:", imageUrl);
      return imageUrl; // Retorna a URL original em caso de erro
    }
  },

  async clearCache() {
    try {
      memoryCache.clear();
      await FileSystem.deleteAsync(CACHE_DIRECTORY, { idempotent: true });
      await this.initialize();
    } catch (error) {
      console.error("Erro ao limpar cache:", error);
    }
  },

  // Método para limpar apenas o cache em memória
  clearMemoryCache() {
    memoryCache.clear();
  },
};
