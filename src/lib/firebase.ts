import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocFromServer,
  type Firestore,
} from 'firebase/firestore';
import type {
  ClothingItem,
  UserProfile,
  Conversation,
  ChatMessage,
  Review,
  ValueSnapshot,
  Report,
} from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initialisation Firebase
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// CRITICAL: Base de données Firestore avec l'ID provisionné
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const isFirebaseConfigured = true;

// Test initial de connectivité Firestore
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Vérifiez votre configuration Firebase ou connexion réseau.');
    }
  }
}
testConnection();

// Inscription / Connexion avec Google
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Erreur Google Sign-In:', error);
    throw error;
  }
}

// Déconnexion
export async function logOutFirebase(): Promise<void> {
  await signOut(auth);
}

// --- ARTICLES (CLOTHING ITEMS) ---
export async function getClothingItems(): Promise<ClothingItem[]> {
  const path = 'items';
  try {
    const snap = await getDocs(collection(db, path));
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ClothingItem, 'id'>) }));
    }
    return [];
  } catch (error) {
    // Si déconnecté ou erreur, repli local temporaire
    console.warn('Lecture Firestore items en mode fallback:', error);
    const stored = localStorage.getItem('fripo_items_collection');
    return stored ? JSON.parse(stored) : [];
  }
}

export async function saveClothingItem(item: ClothingItem): Promise<void> {
  const path = `items/${item.id}`;
  try {
    await setDoc(doc(db, 'items', item.id), item);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }

  // Synchronisation miroir locale pour instantanéité
  const stored = localStorage.getItem('fripo_items_collection');
  const list: ClothingItem[] = stored ? JSON.parse(stored) : [];
  const idx = list.findIndex((i) => i.id === item.id);
  const updated = idx >= 0 ? list.map((i) => (i.id === item.id ? item : i)) : [item, ...list];
  localStorage.setItem('fripo_items_collection', JSON.stringify(updated));
}

export async function deleteClothingItem(itemId: string): Promise<void> {
  const path = `items/${itemId}`;
  try {
    await deleteDoc(doc(db, 'items', itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }

  const stored = localStorage.getItem('fripo_items_collection');
  if (stored) {
    const list: ClothingItem[] = JSON.parse(stored);
    localStorage.setItem(
      'fripo_items_collection',
      JSON.stringify(list.filter((i) => i.id !== itemId))
    );
  }
}

// --- UTILISATEURS (USERS) ---
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return { id: snap.id, ...(snap.data() as Omit<UserProfile, 'id'>) };
    }
  } catch (error) {
    console.warn('Lecture Firestore user en mode fallback:', error);
  }

  const stored = localStorage.getItem('fripo_users_collection');
  const users: UserProfile[] = stored ? JSON.parse(stored) : [];
  return users.find((u) => u.id === userId) || null;
}

export async function saveUserProfile(user: UserProfile): Promise<void> {
  const path = `users/${user.id}`;
  try {
    await setDoc(doc(db, 'users', user.id), user, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }

  const stored = localStorage.getItem('fripo_users_collection');
  const users: UserProfile[] = stored ? JSON.parse(stored) : [];
  const idx = users.findIndex((u) => u.id === user.id);
  const updated = idx >= 0 ? users.map((u) => (u.id === user.id ? user : u)) : [user, ...users];
  localStorage.setItem('fripo_users_collection', JSON.stringify(updated));
}

// --- FAVORIS (/users/{userId}/favorites/{itemId}) ---
export async function getUserFavorites(userId: string): Promise<string[]> {
  const path = `users/${userId}/favorites`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'favorites'));
    if (!snap.empty) {
      return snap.docs.map((d) => d.id);
    }
  } catch (error) {
    console.warn('Lecture Firestore favoris fallback:', error);
  }

  const stored = localStorage.getItem(`fripo_favs_${userId}`);
  return stored ? JSON.parse(stored) : [];
}

export async function addFirestoreFavorite(userId: string, itemId: string): Promise<void> {
  const path = `users/${userId}/favorites/${itemId}`;
  try {
    await setDoc(doc(db, 'users', userId, 'favorites', itemId), {
      itemId,
      createdAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  const key = `fripo_favs_${userId}`;
  const stored = localStorage.getItem(key);
  const list: string[] = stored ? JSON.parse(stored) : [];
  if (!list.includes(itemId)) {
    localStorage.setItem(key, JSON.stringify([...list, itemId]));
  }
}

export async function removeFirestoreFavorite(userId: string, itemId: string): Promise<void> {
  const path = `users/${userId}/favorites/${itemId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'favorites', itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }

  const key = `fripo_favs_${userId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    const list: string[] = JSON.parse(stored);
    localStorage.setItem(key, JSON.stringify(list.filter((id) => id !== itemId)));
  }
}

// --- CONVERSATIONS & CHAT ---
export async function getConversations(userId: string): Promise<Conversation[]> {
  const path = 'conversations';
  try {
    const q = query(
      collection(db, path),
      where('participants', 'array-contains', userId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Conversation, 'id'>) }));
    }
  } catch (error) {
    console.warn('Lecture Firestore convos fallback:', error);
  }

  const stored = localStorage.getItem('fripo_conversations');
  const all: Conversation[] = stored ? JSON.parse(stored) : [];
  return all.filter((c) => c.participants.includes(userId));
}

export async function saveConversation(conversation: Conversation): Promise<void> {
  const path = `conversations/${conversation.id}`;
  try {
    await setDoc(doc(db, 'conversations', conversation.id), conversation, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }

  const stored = localStorage.getItem('fripo_conversations');
  const all: Conversation[] = stored ? JSON.parse(stored) : [];
  const idx = all.findIndex((c) => c.id === conversation.id);
  const updated = idx >= 0 ? all.map((c) => (c.id === conversation.id ? conversation : c)) : [conversation, ...all];
  localStorage.setItem('fripo_conversations', JSON.stringify(updated));
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const path = `conversations/${conversationId}/messages`;
  try {
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, 'id'>) }));
    }
  } catch (error) {
    console.warn('Lecture Firestore messages fallback:', error);
  }

  const stored = localStorage.getItem(`fripo_messages_${conversationId}`);
  return stored ? JSON.parse(stored) : [];
}

export async function sendMessage(conversationId: string, message: ChatMessage): Promise<void> {
  const path = `conversations/${conversationId}/messages/${message.id}`;
  try {
    await setDoc(doc(db, 'conversations', conversationId, 'messages', message.id), message);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  const key = `fripo_messages_${conversationId}`;
  const stored = localStorage.getItem(key);
  const list: ChatMessage[] = stored ? JSON.parse(stored) : [];
  localStorage.setItem(key, JSON.stringify([...list, message]));
}

// --- SNAPSHOTS DE VALEUR DU CLOSET (/users/{userId}/valueSnapshots/{snapshotId}) ---
export async function getValueSnapshots(userId: string): Promise<ValueSnapshot[]> {
  const path = `users/${userId}/valueSnapshots`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'valueSnapshots'));
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ValueSnapshot, 'id'>) }));
    }
  } catch (error) {
    console.warn('Lecture snapshots fallback:', error);
  }

  const stored = localStorage.getItem(`fripo_snapshots_${userId}`);
  return stored ? JSON.parse(stored) : [];
}

export async function saveValueSnapshot(snapshot: ValueSnapshot): Promise<void> {
  const path = `users/${snapshot.userId}/valueSnapshots/${snapshot.id}`;
  try {
    await setDoc(
      doc(db, 'users', snapshot.userId, 'valueSnapshots', snapshot.id),
      snapshot
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }

  const key = `fripo_snapshots_${snapshot.userId}`;
  const stored = localStorage.getItem(key);
  const list: ValueSnapshot[] = stored ? JSON.parse(stored) : [];
  localStorage.setItem(key, JSON.stringify([...list, snapshot]));
}

// --- AVIS (REVIEWS) ---
export async function getReviewsForUser(userId: string): Promise<Review[]> {
  const path = 'reviews';
  try {
    const q = query(collection(db, path), where('sellerId', '==', userId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, 'id'>) }));
    }
  } catch (error) {
    console.warn('Lecture reviews fallback:', error);
  }

  const stored = localStorage.getItem('fripo_reviews');
  const all: Review[] = stored ? JSON.parse(stored) : [];
  return all.filter((r) => r.sellerId === userId);
}

export async function saveReview(review: Review): Promise<void> {
  const path = `reviews/${review.id}`;
  try {
    await setDoc(doc(db, 'reviews', review.id), review);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  const stored = localStorage.getItem('fripo_reviews');
  const all: Review[] = stored ? JSON.parse(stored) : [];
  localStorage.setItem('fripo_reviews', JSON.stringify([review, ...all]));
}

// --- SIGNALEMENTS (REPORTS) ---
export async function saveReport(report: Report): Promise<void> {
  const path = `reports/${report.id}`;
  try {
    await setDoc(doc(db, 'reports', report.id), report);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  const stored = localStorage.getItem('fripo_reports');
  const all: Report[] = stored ? JSON.parse(stored) : [];
  localStorage.setItem('fripo_reports', JSON.stringify([report, ...all]));
}
