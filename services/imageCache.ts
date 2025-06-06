import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

const CACHE_DIRECTORY = FileSystem.cacheDirectory + "image-cache/";

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

  async getCachedImageUri(imageUrl: string): Promise<string | null> {
    if (!imageUrl) return null;

    try {
      const filename = imageUrl.split("/").pop() || "";
      const cacheKey = CACHE_DIRECTORY + filename;
      const fileInfo = await FileSystem.getInfoAsync(cacheKey);

      if (fileInfo.exists) {
        return Platform.OS === "android" ? `file://${cacheKey}` : cacheKey;
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
      const filename = imageUrl.split("/").pop() || "";
      const cacheKey = CACHE_DIRECTORY + filename;
      const fileInfo = await FileSystem.getInfoAsync(cacheKey);

      if (fileInfo.exists) {
        return Platform.OS === "android" ? `file://${cacheKey}` : cacheKey;
      }

      await FileSystem.downloadAsync(imageUrl, cacheKey);
      return Platform.OS === "android" ? `file://${cacheKey}` : cacheKey;
    } catch (error) {
      console.error("Erro ao fazer cache da imagem:", error);
      return null;
    }
  },

  async clearCache() {
    try {
      await FileSystem.deleteAsync(CACHE_DIRECTORY, { idempotent: true });
      await this.initialize();
    } catch (error) {
      console.error("Erro ao limpar cache:", error);
    }
  },
};
