import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ClothingItem,
  UserProfile,
  Conversation,
  ChatMessage,
  FilterState,
  ValueSnapshot,
  Review,
  Report,
} from '../types';
import {
  getClothingItems,
  saveClothingItem,
  deleteClothingItem,
  getUserProfile,
  saveUserProfile,
  getConversations,
  saveConversation,
  getMessages,
  sendMessage,
  getValueSnapshots,
  saveValueSnapshot,
  saveReview,
  saveReport,
  getUserFavorites,
  addFirestoreFavorite,
  removeFirestoreFavorite,
  signInWithGoogle,
  logOutFirebase,
} from '../lib/firebase';

export type MainTab = 'buy' | 'sell' | 'lens' | 'messages' | 'closet';

export type AppView =
  | 'onboarding'
  | 'auth'
  | 'main'
  | 'item_detail'
  | 'user_closet'
  | 'chat'
  | 'edit_item'
  | 'settings';

interface FripoStoreState {
  // Navigation
  currentView: AppView;
  activeTab: MainTab;
  selectedItemId: string | null;
  viewingUserId: string | null;
  activeConversationId: string | null;
  editingItemId: string | null;

  // Utilisateur connecté
  currentUser: UserProfile | null;
  onboardingSeen: boolean;

  // Données
  items: ClothingItem[];
  favorites: string[];
  follows: string[];
  conversations: Conversation[];
  currentMessages: ChatMessage[];
  valueSnapshots: ValueSnapshot[];
  isLoading: boolean;

  // Filtres Acheter
  searchQuery: string;
  isFilterSheetOpen: boolean;
  filters: FilterState;

  // Photo temporaire Lens
  lensDraftPhoto: string | null;

  // Actions
  initializeStore: () => Promise<void>;
  setCurrentView: (view: AppView) => void;
  setActiveTab: (tab: MainTab) => void;
  setSelectedItemId: (id: string | null) => void;
  setViewingUserId: (id: string | null) => void;
  setActiveConversationId: (id: string | null) => void;
  setEditingItemId: (id: string | null) => void;
  setOnboardingSeen: (seen: boolean) => void;
  setLensDraftPhoto: (photo: string | null) => void;

  // Recherche & Filtres
  setSearchQuery: (query: string) => void;
  setIsFilterSheetOpen: (open: boolean) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;

  // Utilisateur & Auth
  loginUser: (profile: UserProfile) => Promise<void>;
  loginWithGoogleAction: () => Promise<void>;
  logoutUser: () => void;
  updateUserBio: (bio: string, website?: string, photoUrl?: string) => Promise<void>;

  // Articles
  createItem: (item: ClothingItem) => Promise<void>;
  updateItem: (item: ClothingItem) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  markItemAsSold: (itemId: string) => Promise<void>;

  // Favoris & Abonnements
  toggleFavorite: (itemId: string) => Promise<void>;
  isFavorite: (itemId: string) => boolean;
  toggleFollow: (userId: string) => void;
  isFollowing: (userId: string) => boolean;

  // Messages & Achat
  startOrOpenConversation: (item: ClothingItem) => Promise<string>;
  sendChatText: (text: string, imageUrl?: string) => Promise<void>;
  refreshMessages: (conversationId: string) => Promise<void>;

  // Avis & Signalements
  postReview: (review: Review) => Promise<void>;
  reportEntity: (targetId: string, reason: string) => Promise<void>;
}

const DEFAULT_FILTERS: FilterState = {
  category: 'all',
  size: 'all',
  condition: 'all',
  brand: '',
  era: 'all',
  minPrice: '',
  maxPrice: '',
  sortBy: 'recent',
};

export const useStore = create<FripoStoreState>()(
  persist(
    (set, get) => ({
      currentView: 'onboarding',
      activeTab: 'buy',
      selectedItemId: null,
      viewingUserId: null,
      activeConversationId: null,
      editingItemId: null,

      currentUser: null,
      onboardingSeen: false,

      items: [],
      favorites: [],
      follows: [],
      conversations: [],
      currentMessages: [],
      valueSnapshots: [],
      isLoading: true,

      searchQuery: '',
      isFilterSheetOpen: false,
      filters: DEFAULT_FILTERS,

      lensDraftPhoto: null,

      initializeStore: async () => {
        set({ isLoading: true });
        try {
          const items = await getClothingItems();
          const currentUser = get().currentUser;
          let userConvos: Conversation[] = [];
          let userSnapshots: ValueSnapshot[] = [];
          let userFavs: string[] = get().favorites;

          if (currentUser) {
            userConvos = await getConversations(currentUser.id);
            userSnapshots = await getValueSnapshots(currentUser.id);
            const firestoreFavs = await getUserFavorites(currentUser.id);
            if (firestoreFavs.length > 0) {
              userFavs = firestoreFavs;
            }
          }

          set({
            items,
            conversations: userConvos,
            valueSnapshots: userSnapshots,
            favorites: userFavs,
            isLoading: false,
            // Si déjà vu l'onboarding et utilisateur connecté, aller sur le fil principal
            currentView: get().currentUser ? 'main' : get().onboardingSeen ? 'auth' : 'onboarding',
          });
        } catch (error) {
          console.error("Erreur d'initialisation du store Fripo:", error);
          set({ isLoading: false });
        }
      },

      setCurrentView: (view) => set({ currentView: view }),
      setActiveTab: (tab) => set({ activeTab: tab, currentView: 'main' }),
      setSelectedItemId: (id) => set({ selectedItemId: id }),
      setViewingUserId: (id) => set({ viewingUserId: id }),
      setActiveConversationId: (id) => set({ activeConversationId: id }),
      setEditingItemId: (id) => set({ editingItemId: id }),
      setOnboardingSeen: (seen) => set({ onboardingSeen: seen }),
      setLensDraftPhoto: (photo) => set({ lensDraftPhoto: photo }),

      setSearchQuery: (query) => set({ searchQuery: query }),
      setIsFilterSheetOpen: (open) => set({ isFilterSheetOpen: open }),
      setFilters: (newFilters) =>
        set((state) => ({ filters: { ...state.filters, ...newFilters } })),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),

      loginUser: async (profile) => {
        await saveUserProfile(profile);
        const convos = await getConversations(profile.id);
        const snapshots = await getValueSnapshots(profile.id);
        const favs = await getUserFavorites(profile.id);

        set({
          currentUser: profile,
          conversations: convos,
          valueSnapshots: snapshots,
          favorites: favs.length > 0 ? favs : get().favorites,
          currentView: 'main',
          activeTab: 'buy',
        });
      },

      loginWithGoogleAction: async () => {
        const user = await signInWithGoogle();
        let existing = await getUserProfile(user.uid);
        if (!existing) {
          const newUsername = (user.displayName || user.email?.split('@')[0] || 'fripo_user')
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '');
          existing = {
            id: user.uid,
            username: newUsername,
            email: user.email || '',
            photoUrl: user.photoURL || undefined,
            followersCount: 0,
            followingCount: 0,
            ratingAvg: 0,
            ratingCount: 0,
            createdAt: Date.now(),
          };
          await saveUserProfile(existing);
        }

        const convos = await getConversations(existing.id);
        const snapshots = await getValueSnapshots(existing.id);
        const favs = await getUserFavorites(existing.id);

        set({
          currentUser: existing,
          conversations: convos,
          valueSnapshots: snapshots,
          favorites: favs,
          currentView: 'main',
          activeTab: 'buy',
        });
      },

      logoutUser: async () => {
        await logOutFirebase();
        set({
          currentUser: null,
          currentView: 'auth',
          conversations: [],
          currentMessages: [],
        });
      },

      updateUserBio: async (bio, website, photoUrl) => {
        const current = get().currentUser;
        if (!current) return;
        const updated: UserProfile = {
          ...current,
          bio: bio !== undefined ? bio : current.bio,
          website: website !== undefined ? website : current.website,
          photoUrl: photoUrl !== undefined ? photoUrl : current.photoUrl,
        };
        await saveUserProfile(updated);
        set({ currentUser: updated });
      },

      createItem: async (item) => {
        await saveClothingItem(item);
        const allItems = await getClothingItems();
        set({ items: allItems });

        // Enregistrer automatiquement un instantané de valeur pour le vendeur
        const sellerItems = allItems.filter(
          (i) => i.sellerId === item.sellerId && i.status === 'active'
        );
        const totalValue = sellerItems.reduce((acc, i) => acc + i.price, 0);

        const snapshot: ValueSnapshot = {
          id: `SNAP-${Date.now()}`,
          userId: item.sellerId,
          date: Date.now(),
          value: totalValue,
        };
        await saveValueSnapshot(snapshot);
        const snapshots = await getValueSnapshots(item.sellerId);
        set({ valueSnapshots: snapshots });
      },

      updateItem: async (item) => {
        await saveClothingItem(item);
        const allItems = await getClothingItems();
        set({ items: allItems });

        const sellerItems = allItems.filter(
          (i) => i.sellerId === item.sellerId && i.status === 'active'
        );
        const totalValue = sellerItems.reduce((acc, i) => acc + i.price, 0);

        const snapshot: ValueSnapshot = {
          id: `SNAP-${Date.now()}`,
          userId: item.sellerId,
          date: Date.now(),
          value: totalValue,
        };
        await saveValueSnapshot(snapshot);
        const snapshots = await getValueSnapshots(item.sellerId);
        set({ valueSnapshots: snapshots });
      },

      removeItem: async (itemId) => {
        const item = get().items.find((i) => i.id === itemId);
        await deleteClothingItem(itemId);
        const allItems = await getClothingItems();
        set({ items: allItems });

        if (item) {
          const sellerItems = allItems.filter(
            (i) => i.sellerId === item.sellerId && i.status === 'active'
          );
          const totalValue = sellerItems.reduce((acc, i) => acc + i.price, 0);
          const snapshot: ValueSnapshot = {
            id: `SNAP-${Date.now()}`,
            userId: item.sellerId,
            date: Date.now(),
            value: totalValue,
          };
          await saveValueSnapshot(snapshot);
          const snapshots = await getValueSnapshots(item.sellerId);
          set({ valueSnapshots: snapshots });
        }
      },

      markItemAsSold: async (itemId) => {
        const item = get().items.find((i) => i.id === itemId);
        if (!item) return;
        const updated: ClothingItem = { ...item, status: 'sold', updatedAt: Date.now() };
        await saveClothingItem(updated);
        const allItems = await getClothingItems();
        set({ items: allItems });

        // Mise à jour de la courbe de valeur
        const sellerItems = allItems.filter(
          (i) => i.sellerId === item.sellerId && i.status === 'active'
        );
        const totalValue = sellerItems.reduce((acc, i) => acc + i.price, 0);
        const snapshot: ValueSnapshot = {
          id: `SNAP-${Date.now()}`,
          userId: item.sellerId,
          date: Date.now(),
          value: totalValue,
        };
        await saveValueSnapshot(snapshot);
        const snapshots = await getValueSnapshots(item.sellerId);
        set({ valueSnapshots: snapshots });
      },

      toggleFavorite: async (itemId) => {
        const favs = get().favorites;
        const currentUser = get().currentUser;
        if (favs.includes(itemId)) {
          const updated = favs.filter((id) => id !== itemId);
          set({ favorites: updated });
          if (currentUser) {
            await removeFirestoreFavorite(currentUser.id, itemId);
          }
        } else {
          const updated = [...favs, itemId];
          set({ favorites: updated });
          if (currentUser) {
            await addFirestoreFavorite(currentUser.id, itemId);
          }
        }
      },

      isFavorite: (itemId) => get().favorites.includes(itemId),

      toggleFollow: (userId) => {
        const follows = get().follows;
        if (follows.includes(userId)) {
          set({ follows: follows.filter((id) => id !== userId) });
        } else {
          set({ follows: [...follows, userId] });
        }
      },

      isFollowing: (userId) => get().follows.includes(userId),

      startOrOpenConversation: async (item) => {
        const currentUser = get().currentUser;
        if (!currentUser) {
          set({ currentView: 'auth' });
          return '';
        }

        const existingConvos = await getConversations(currentUser.id);
        const found = existingConvos.find(
          (c) => c.itemId === item.id && c.participants.includes(item.sellerId)
        );

        if (found) {
          const msgs = await getMessages(found.id);
          set({
            activeConversationId: found.id,
            currentMessages: msgs,
            currentView: 'chat',
          });
          return found.id;
        }

        // Créer nouvelle conversation
        const convoId = `CONV-${Date.now().toString(36)}`;
        const newConvo: Conversation = {
          id: convoId,
          participants: [currentUser.id, item.sellerId],
          participantUsernames: {
            [currentUser.id]: currentUser.username,
            [item.sellerId]: item.sellerUsername,
          },
          participantPhotos: {
            [currentUser.id]: currentUser.photoUrl || '',
            [item.sellerId]: item.sellerPhotoUrl || '',
          },
          itemId: item.id,
          itemTitle: item.title,
          itemPrice: item.price,
          itemCurrency: item.currency,
          itemImage: item.images[0] || '',
          itemStatus: item.status,
          lastMessage: `Bonjour, je suis intéressé par votre article "${item.title}".`,
          lastSenderId: currentUser.id,
          updatedAt: Date.now(),
        };

        await saveConversation(newConvo);

        // Premier message d'ouverture
        const initialMsg: ChatMessage = {
          id: `MSG-${Date.now()}`,
          conversationId: convoId,
          senderId: currentUser.id,
          senderUsername: currentUser.username,
          text: `Bonjour, je suis intéressé par votre article "${item.title}". Est-il toujours disponible pour remise ou Mobile Money ?`,
          createdAt: Date.now(),
        };

        await sendMessage(convoId, initialMsg);

        const convos = await getConversations(currentUser.id);
        set({
          conversations: convos,
          activeConversationId: convoId,
          currentMessages: [initialMsg],
          currentView: 'chat',
        });
        return convoId;
      },

      sendChatText: async (text, imageUrl) => {
        const convoId = get().activeConversationId;
        const currentUser = get().currentUser;
        if (!convoId || !currentUser) return;

        const msg: ChatMessage = {
          id: `MSG-${Date.now().toString(36)}`,
          conversationId: convoId,
          senderId: currentUser.id,
          senderUsername: currentUser.username,
          text: text.trim(),
          imageUrl,
          createdAt: Date.now(),
        };

        await sendMessage(convoId, msg);

        // Mettre à jour la conversation
        const convos = get().conversations;
        const convo = convos.find((c) => c.id === convoId);
        if (convo) {
          const updatedConvo: Conversation = {
            ...convo,
            lastMessage: text.trim() || (imageUrl ? '📷 Photo' : ''),
            lastSenderId: currentUser.id,
            updatedAt: Date.now(),
          };
          await saveConversation(updatedConvo);
          set({
            conversations: convos.map((c) => (c.id === convoId ? updatedConvo : c)),
          });
        }

        const msgs = await getMessages(convoId);
        set({ currentMessages: msgs });
      },

      refreshMessages: async (conversationId) => {
        const msgs = await getMessages(conversationId);
        set({ currentMessages: msgs });
      },

      postReview: async (review) => {
        await saveReview(review);
      },

      reportEntity: async (targetId, reason) => {
        const currentUser = get().currentUser;
        const report: Report = {
          id: `REP-${Date.now()}`,
          reporterId: currentUser?.id || 'anon',
          targetId,
          reason,
          createdAt: Date.now(),
        };
        await saveReport(report);
      },
    }),
    {
      name: 'fripo-app-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        onboardingSeen: state.onboardingSeen,
        favorites: state.favorites,
        follows: state.follows,
      }),
    }
  )
);
