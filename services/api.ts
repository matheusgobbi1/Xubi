import { auth } from "./firebase";
import {
  addDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  getCollection,
  queryDocuments,
} from "./firestore";
import { uploadImage } from "./storage";

// Exportando as funções do Firestore para uso fácil
export {
  addDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  getCollection,
  queryDocuments,
  uploadImage,
};

// Função para obter o token de autenticação atual
export const getAuthToken = async (): Promise<string | null> => {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return null;
    }

    return await currentUser.getIdToken();
  } catch (error) {
    console.error("Erro ao obter token de autenticação:", error);
    return null;
  }
};

// Função para verificar se o usuário está autenticado
export const isAuthenticated = (): boolean => {
  return !!auth.currentUser;
};

// Função para obter o ID do usuário atual
export const getCurrentUserId = (): string | null => {
  return auth.currentUser?.uid || null;
};

export default {
  addDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  getCollection,
  queryDocuments,
  uploadImage,
  getAuthToken,
  isAuthenticated,
  getCurrentUserId,
};
