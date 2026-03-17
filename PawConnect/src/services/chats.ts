import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
  where,
  limit as limitQ,
} from "firebase/firestore";
import { db } from "./firebase";
import type { ChatDoc, ChatId, MessageDoc, UserLite } from "../types/chat";

function safeNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function buildChatId(a: string, b: string): ChatId {
  return [a, b].sort().join("_");
}

/**
 * UPSERT без getDoc (за да не удряме permissions при несъществуващ документ).
 * Важно: задаваме lastMessageAt при създаване/отваряне, за да се вижда веднага в списъка
 * (и да работи orderBy("lastMessageAt")).
 */
export async function ensureChatExists(params: {
  chatId: ChatId;
  participants: UserLite[];
}): Promise<void> {
  const ref = doc(db, "chats", params.chatId);

  const participantIds = params.participants.map((participant) => participant.uid);

  const participantInfo: Record<string, UserLite> = {};
  for (const participant of params.participants) {
    participantInfo[participant.uid] = participant;
  }

  await setDoc(
    ref,
    {
      participantIds,
      participantInfo,
      createdAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
    } satisfies Partial<ChatDoc>,
    { merge: true },
  );
}

export function watchUserChats(params: {
  uid: string;
  onChange: (items: Array<{ id: string; data: ChatDoc }>) => void;
  onError?: (err: Error) => void;
}): Unsubscribe {
  const q = query(
    collection(db, "chats"),
    where("participantIds", "array-contains", params.uid),
    orderBy("lastMessageAt", "desc"),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((documentSnapshot) => ({
        id: documentSnapshot.id,
        data: documentSnapshot.data() as ChatDoc,
      }));
      params.onChange(items);
    },
    (error) => params.onError?.(error as Error),
  );
}

export function watchChatMessages(params: {
  chatId: ChatId;
  take?: number;
  onChange: (items: Array<{ id: string; data: MessageDoc }>) => void;
  onError?: (err: Error) => void;
}): Unsubscribe {
  const messagesRef = collection(db, "chats", params.chatId, "messages");
  const q = query(
    messagesRef,
    orderBy("createdAt", "asc"),
    limitQ(params.take ?? 200),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((documentSnapshot) => ({
        id: documentSnapshot.id,
        data: documentSnapshot.data() as MessageDoc,
      }));
      params.onChange(items);
    },
    (error) => params.onError?.(error as Error),
  );
}

export async function sendMessage(params: {
  chatId: ChatId;
  sender: UserLite;
  text: string;
}): Promise<void> {
  const trimmed = params.text.trim();
  if (!trimmed) return;

  const chatRef = doc(db, "chats", params.chatId);
  const messageCollectionRef = collection(db, "chats", params.chatId, "messages");

  await runTransaction(db, async (transaction) => {
    const chatSnapshot = await transaction.get(chatRef);

    if (!chatSnapshot.exists()) {
      transaction.set(
        chatRef,
        {
          participantIds: [params.sender.uid],
          participantInfo: { [params.sender.uid]: params.sender },
          unreadCount: { [params.sender.uid]: 0 },
          createdAt: serverTimestamp(),
          lastMessageAt: serverTimestamp(),
        } satisfies Partial<ChatDoc>,
        { merge: true },
      );
    }

    const newMessageRef = doc(messageCollectionRef);

    transaction.set(
      newMessageRef,
      {
        chatId: params.chatId,
        senderId: params.sender.uid,
        text: trimmed,
        createdAt: serverTimestamp(),
      } satisfies Partial<MessageDoc>,
    );

    const currentChat = chatSnapshot.exists()
      ? (chatSnapshot.data() as ChatDoc)
      : null;

    const participantIds = currentChat?.participantIds ?? [params.sender.uid];
    const nextUnreadCount: Record<string, number> = {
      ...(currentChat?.unreadCount ?? {}),
    };

    for (const participantId of participantIds) {
      if (participantId === params.sender.uid) continue;
      nextUnreadCount[participantId] =
        safeNumber(nextUnreadCount[participantId]) + 1;
    }

    if (nextUnreadCount[params.sender.uid] === undefined) {
      nextUnreadCount[params.sender.uid] = 0;
    }

    transaction.set(
      chatRef,
      {
        lastMessageText: trimmed,
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: params.sender.uid,
        unreadCount: nextUnreadCount,
      } satisfies Partial<ChatDoc>,
      { merge: true },
    );
  });
}

export async function markChatRead(params: {
  chatId: ChatId;
  uid: string;
}): Promise<void> {
  const chatRef = doc(db, "chats", params.chatId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(chatRef);
    if (!snapshot.exists()) return;

    const chat = snapshot.data() as ChatDoc;
    const nextUnreadCount = { ...(chat.unreadCount ?? {}) };
    nextUnreadCount[params.uid] = 0;

    transaction.set(
      chatRef,
      { unreadCount: nextUnreadCount } satisfies Partial<ChatDoc>,
      { merge: true },
    );
  });
}

export async function deleteMessageForEveryone(params: {
  chatId: ChatId;
  messageId: string;
  senderId: string;
}): Promise<void> {
  const chatRef = doc(db, "chats", params.chatId);
  const messageRef = doc(db, "chats", params.chatId, "messages", params.messageId);
  const messagesRef = collection(db, "chats", params.chatId, "messages");

  await deleteDoc(messageRef);

  const [chatSnapshot, latestMessageSnapshot] = await Promise.all([
    getDoc(chatRef),
    getDocs(query(messagesRef, orderBy("createdAt", "desc"), limitQ(1))),
  ]);

  if (!chatSnapshot.exists()) {
    return;
  }

  const chat = chatSnapshot.data() as ChatDoc;
  const nextUnreadCount: Record<string, number> = {
    ...(chat.unreadCount ?? {}),
  };

  for (const participantId of chat.participantIds ?? []) {
    if (participantId === params.senderId) {
      continue;
    }

    nextUnreadCount[participantId] = Math.max(
      0,
      safeNumber(nextUnreadCount[participantId]) - 1,
    );
  }

  const latestMessageDoc = latestMessageSnapshot.docs[0];

  if (!latestMessageDoc) {
    await updateDoc(chatRef, {
      lastMessageText: "",
      lastMessageSenderId: "",
      lastMessageAt: null,
      unreadCount: nextUnreadCount,
    } satisfies Partial<ChatDoc>);
    return;
  }

  const latestMessage = latestMessageDoc.data() as MessageDoc;

  await updateDoc(chatRef, {
    lastMessageText: latestMessage.text,
    lastMessageSenderId: latestMessage.senderId,
    lastMessageAt: latestMessage.createdAt,
    unreadCount: nextUnreadCount,
  } satisfies Partial<ChatDoc>);
}