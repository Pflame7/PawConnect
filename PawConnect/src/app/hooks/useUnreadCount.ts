import { useEffect, useState } from "react";
import { watchUserChats } from "../../services/chats";
import { useAuth } from "../providers/useAuth";

export function useUnreadCount(): number {
  const { user } = useAuth();
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (!user?.uid) return;

    const unsub = watchUserChats({
      uid: user.uid,
      onChange: (items) => {
        const total = items.reduce((acc, it) => acc + (it.data.unreadCount?.[user.uid] ?? 0), 0);
        setCount(total);
      },
    });

    return () => unsub();
  }, [user?.uid]);

  return count;
}