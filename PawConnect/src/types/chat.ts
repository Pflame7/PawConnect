import type { FieldValue, Timestamp } from "firebase/firestore";

export type ChatId = string;
export type MessageId = string;

export interface UserLite {
  uid: string;
  name: string;
  avatarUrl: string; // може да е "" ако няма
}

/**
 * Firestore timestamp поля:
 * - при четене от базата идват като Timestamp
 * - при запис често ползваме serverTimestamp() -> FieldValue
 */
export type FireTime = Timestamp | FieldValue | null;

export interface ChatDoc {
  participantIds: string[]; // [uid1, uid2, ...]
  participantInfo: Record<string, UserLite>; // uid -> info
  lastMessageText: string;
  lastMessageAt: FireTime;
  lastMessageSenderId: string;
  unreadCount: Record<string, number>; // uid -> count
  createdAt: FireTime;
}

export interface MessageDoc {
  chatId: ChatId;
  senderId: string;
  text: string;
  createdAt: FireTime;
}