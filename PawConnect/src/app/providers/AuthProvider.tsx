import { onAuthStateChanged, reload, type User as FirebaseUser } from "firebase/auth";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { doc, onSnapshot } from "firebase/firestore";

import { auth, db } from "../../services/firebase";
import type { UserProfile } from "../../types/user";
import { AuthContext } from "./auth-context";

const SECURITY_CHECK_INTERVAL_MS = 5 * 24 * 60 * 60 * 1000;

function getTimestampMs(value: unknown): number | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  if ("toMillis" in value && typeof value.toMillis === "function") {
    return value.toMillis() as number;
  }

  if ("seconds" in value && typeof value.seconds === "number") {
    return value.seconds * 1000;
  }

  return null;
}

function shouldRequireSecurityCheck(profile: UserProfile | null): boolean {
  if (!profile) {
    return false;
  }

  const lastCheckMs = getTimestampMs(profile.lastSecurityCheckAt);

  if (lastCheckMs === null) {
    return true;
  }

  return Date.now() - lastCheckMs >= SECURITY_CHECK_INTERVAL_MS;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const refreshUser = useCallback(async (): Promise<void> => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setUser(null);
      setIsEmailVerified(false);
      return;
    }

    await reload(currentUser);
    setUser(auth.currentUser);
    setIsEmailVerified(auth.currentUser?.emailVerified ?? false);
  }, []);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsEmailVerified(nextUser?.emailVerified ?? false);

      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const ref = doc(db, "users", nextUser.uid);

      unsubProfile = onSnapshot(
        ref,
        (snap) => {
          setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
          setLoading(false);
        },
        (err) => {
          console.error(err);
          setProfile(null);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubAuth();
      if (unsubProfile) {
        unsubProfile();
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isEmailVerified,
      needsSecurityCheck: isEmailVerified && shouldRequireSecurityCheck(profile),
      refreshUser,
    }),
    [user, profile, loading, isEmailVerified, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}