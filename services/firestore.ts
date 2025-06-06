import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  addDoc,
  serverTimestamp,
  Timestamp,
  DocumentData,
  DocumentReference,
  QueryDocumentSnapshot,
  DocumentSnapshot,
  WhereFilterOp,
  Query,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Adiciona um documento a uma coleção
 * @param collectionName Nome da coleção
 * @param data Dados a serem adicionados
 * @returns Referência do documento criado
 */
export const addDocument = async <T extends DocumentData>(
  collectionName: string,
  data: T
): Promise<DocumentReference<T>> => {
  try {
    // Adiciona um timestamp de criação
    const docData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    return (await addDoc(
      collection(db, collectionName),
      docData
    )) as DocumentReference<T>;
  } catch (error) {
    console.error(
      `Erro ao adicionar documento à coleção ${collectionName}:`,
      error
    );
    throw error;
  }
};

/**
 * Atualiza um documento existente
 * @param collectionName Nome da coleção
 * @param docId ID do documento
 * @param data Dados a serem atualizados
 */
export const updateDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, docId);

    // Adiciona um timestamp de atualização
    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error(
      `Erro ao atualizar documento ${docId} na coleção ${collectionName}:`,
      error
    );
    throw error;
  }
};

/**
 * Cria ou atualiza um documento com ID específico
 * @param collectionName Nome da coleção
 * @param docId ID do documento
 * @param data Dados a serem definidos
 */
export const setDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, docId);

    // Adiciona timestamps
    const docData = {
      ...data,
      createdAt: data.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, docData);
  } catch (error) {
    console.error(
      `Erro ao definir documento ${docId} na coleção ${collectionName}:`,
      error
    );
    throw error;
  }
};

/**
 * Obtém um documento pelo ID
 * @param collectionName Nome da coleção
 * @param docId ID do documento
 * @returns Dados do documento ou null se não existir
 */
export const getDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string
): Promise<T | null> => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return formatDocumentData(docSnap) as T;
    } else {
      return null;
    }
  } catch (error) {
    console.error(
      `Erro ao obter documento ${docId} da coleção ${collectionName}:`,
      error
    );
    throw error;
  }
};

/**
 * Obtém todos os documentos de uma coleção
 * @param collectionName Nome da coleção
 * @returns Array com os documentos
 */
export const getCollection = async <T extends DocumentData>(
  collectionName: string
): Promise<T[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map((doc) => formatDocumentData(doc) as T);
  } catch (error) {
    console.error(
      `Erro ao obter documentos da coleção ${collectionName}:`,
      error
    );
    throw error;
  }
};

/**
 * Exclui um documento
 * @param collectionName Nome da coleção
 * @param docId ID do documento
 */
export const deleteDocument = async (
  collectionName: string,
  docId: string
): Promise<void> => {
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (error) {
    console.error(
      `Erro ao excluir documento ${docId} da coleção ${collectionName}:`,
      error
    );
    throw error;
  }
};

/**
 * Consulta documentos com condições específicas
 * @param collectionName Nome da coleção
 * @param conditions Array de condições where
 * @param sortField Campo para ordenação
 * @param sortDirection Direção da ordenação ('asc' ou 'desc')
 * @param limitCount Limite de documentos
 * @param startAfterDoc Documento para iniciar após (paginação)
 * @returns Array com os documentos que correspondem à consulta
 */
export const queryDocuments = async <T extends DocumentData>(
  collectionName: string,
  conditions: { field: string; operator: WhereFilterOp; value: unknown }[] = [],
  sortField?: string,
  sortDirection: "asc" | "desc" = "desc",
  limitCount?: number,
  startAfterDoc?: DocumentSnapshot
): Promise<T[]> => {
  try {
    let q: Query<DocumentData> = collection(db, collectionName);

    // Aplicar condições
    if (conditions.length > 0) {
      conditions.forEach((condition) => {
        q = query(
          q,
          where(condition.field, condition.operator, condition.value)
        );
      });
    }

    // Aplicar ordenação
    if (sortField) {
      q = query(q, orderBy(sortField, sortDirection));
    }

    // Aplicar paginação
    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    // Aplicar limite
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => formatDocumentData(doc) as T);
  } catch (error) {
    console.error(
      `Erro ao consultar documentos da coleção ${collectionName}:`,
      error
    );
    throw error;
  }
};

/**
 * Formata os dados do documento do Firestore para um formato mais amigável
 * @param doc Documento do Firestore
 * @returns Dados formatados com ID e conversão de timestamps
 */
const formatDocumentData = <T extends DocumentData>(
  doc: DocumentSnapshot | QueryDocumentSnapshot
): T & { id: string } => {
  const data = doc.data() || {};

  // Converter timestamps do Firestore para objetos Date
  const formattedData: Record<string, unknown> = {};

  Object.keys(data).forEach((key) => {
    const value = data[key];

    if (value instanceof Timestamp) {
      formattedData[key] = value.toDate();
    } else {
      formattedData[key] = value;
    }
  });

  // Adicionar o ID do documento
  return {
    id: doc.id,
    ...formattedData,
  } as T & { id: string };
};
