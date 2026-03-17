import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { buildChatId, ensureChatExists } from "./chats";
import type { ChatId, UserLite } from "../types/chat";

type UserDocShape = {
  name?: unknown;
  avatarUrl?: unknown;
};

function readString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/**
 * Опитваме да вземем "lite" профил за другия участник.
 * Ако rules не позволят read, връщаме fallback (пак работи).
 */
async function getUserLiteByUidSafe(uid: string): Promise<UserLite> {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return { uid, name: "Потребител", avatarUrl: "" };
    }

    const data = snap.data() as UserDocShape;
    return {
      uid,
      name: readString(data.name) || "Потребител",
      avatarUrl: readString(data.avatarUrl),
    };
  } catch {
    return { uid, name: "Потребител", avatarUrl: "" };
  }
}

export async function getOrCreateDirectChat(params: {
  current: UserLite;
  otherUid: string;
}): Promise<ChatId> {
  const chatId = buildChatId(params.current.uid, params.otherUid);
  const other = await getUserLiteByUidSafe(params.otherUid);

  // ✅ UPSERT чат документ (с участници и lastMessageAt, за да излезе в списъка)
  await ensureChatExists({
    chatId,
    participants: [params.current, other],
  });

  return chatId;
}