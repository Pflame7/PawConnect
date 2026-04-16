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
 * Try to fetch the other participant's "lite" profile.
 * If rules do not allow the read, return a fallback so the flow still works.
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

  // UPSERT the chat document with participants and lastMessageAt so it appears in the list.
  await ensureChatExists({
    chatId,
    participants: [params.current, other],
  });

  return chatId;
}
