import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { auth } from "../../services/firebase";
import { getUserProfile } from "../../services/users";
import type { UserProfile } from "../../types/user";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (!u) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const p = await getUserProfile(u.uid);
        setProfile(p);
      } catch (e) {
        console.error(e);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const value = useMemo(
    () => ({ user, profile, loading }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
