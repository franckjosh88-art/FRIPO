export type Currency = 'USD' | 'CDF';

export type ItemCondition = 'neuf' | 'très bon' | 'bon' | 'usé';

export type ItemStatus = 'draft' | 'active' | 'sold';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  photoUrl?: string;
  bio?: string;
  website?: string;
  followersCount: number;
  followingCount: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt: number;
}

export interface ClothingItem {
  id: string;
  sellerId: string;
  sellerUsername: string;
  sellerPhotoUrl?: string;
  sellerRatingAvg?: number;
  sellerRatingCount?: number;
  title: string;
  description: string;
  category: string;
  size: string;
  condition: ItemCondition;
  brand: string;
  era: string;
  price: number;
  currency: Currency;
  negotiable: boolean;
  images: string[];
  status: ItemStatus;
  createdAt: number;
  updatedAt?: number;
}

export interface ValueSnapshot {
  id: string;
  userId: string;
  date: number;
  value: number;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantUsernames: Record<string, string>;
  participantPhotos?: Record<string, string>;
  itemId: string;
  itemTitle: string;
  itemPrice: number;
  itemCurrency: Currency;
  itemImage?: string;
  itemStatus?: ItemStatus;
  lastMessage: string;
  lastSenderId: string;
  updatedAt: number;
  unreadCount?: Record<string, number>;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  text: string;
  imageUrl?: string;
  createdAt: number;
}

export interface Review {
  id: string;
  sellerId: string;
  buyerId: string;
  buyerUsername: string;
  itemId: string;
  stars: number;
  comment: string;
  createdAt: number;
}

export interface Report {
  id: string;
  reporterId: string;
  targetId: string;
  reason: string;
  createdAt: number;
}

export interface FilterState {
  category: string;
  size: string;
  condition: string;
  brand: string;
  era: string;
  minPrice: string;
  maxPrice: string;
  sortBy: 'recent' | 'price_asc' | 'price_desc';
}
