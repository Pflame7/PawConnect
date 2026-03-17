import { useEffect, useRef } from "react";
import { watchUserChats } from "../../services/chats";
import { useAuth } from "../providers/useAuth";
import { useToast } from "../providers/useToast";
import { getResolvedUserSettings } from "../../services/users";
import type { ChatDoc } from "../../types/chat";

export function useMessageNotifications(): void {
  const { user, profile } = useAuth();
  const { push } = useToast();

  const prevUnreadRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!user?.uid) {
      prevUnreadRef.current = {};
      return;
    }

    const unsubscribe = watchUserChats({
      uid: user.uid,
      onChange: (items) => {
        const settings = getResolvedUserSettings(profile);

        for (const item of items) {
          const chatId = item.id;
          const chat: ChatDoc = item.data;

          const nowUnread = chat.unreadCount?.[user.uid] ?? 0;
          const prevUnread = prevUnreadRef.current[chatId] ?? 0;

          const hasNewIncomingMessage =
            nowUnread > prevUnread &&
            Boolean(chat.lastMessageSenderId) &&
            chat.lastMessageSenderId !== user.uid;

          if (hasNewIncomingMessage && settings.messageNotifications) {
            const otherParticipantName =
              Object.values(chat.participantInfo ?? {}).find(
                (participant) => participant.uid !== user.uid,
              )?.name ?? "Ново съобщение";

            push({
              title: otherParticipantName,
              message: chat.lastMessageText || "Имате ново съобщение.",
            });
          }

          prevUnreadRef.current[chatId] = nowUnread;
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [profile, push, user?.uid]);
}