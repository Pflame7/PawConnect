import type { FieldValue, Timestamp } from "firebase/firestore";

export type ChatId = string;
export type MessageId = string;

export interface UserLite {
  uid: string;
  name: string;
  avatarUrl: string; // can be "" when missing
}

/**
 * Firestore timestamp fields:
 * - reads from the database return Timestamp
 * - writes often use serverTimestamp() -> FieldValue
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
