import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../app/providers/useAuth";
import { getOrCreateDirectChat } from "../../services/directChat";
import type { UserLite } from "../../types/chat";

function safeString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function ConnectButton({
  otherUid,
  className,
  label = "Свържи се",
}: {
  otherUid: string;
  className?: string;
  label?: string;
}) {
  const nav = useNavigate();
  const { user, profile, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  const me = useMemo<UserLite | null>(() => {
    if (!user?.uid) return null;

    const nameFromProfile = safeString(profile?.name);
    const fallbackName = safeString(user.displayName) || safeString(user.email) || "Потребител";

    return {
      uid: user.uid,
      name: nameFromProfile || fallbackName,
      avatarUrl: safeString(profile?.avatarUrl) || safeString(user.photoURL) || "",
    };
  }, [profile?.avatarUrl, profile?.name, user?.displayName, user?.email, user?.photoURL, user?.uid]);

  const disabled = loading || busy || !me || !otherUid || otherUid === me.uid;

  async function handleClick() {
    if (disabled || !me) return;

    setBusy(true);
    try {
      const chatId = await getOrCreateDirectChat({
        current: me,
        otherUid,
      });

      nav(`/chats?chat=${encodeURIComponent(chatId)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={disabled}
      className={className}
      aria-busy={busy}
    >
      {busy ? "..." : label}
    </button>
  );
}