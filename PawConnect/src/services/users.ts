import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { UserProfile, UserRole, UserSettings } from "../types/user";

const DEFAULT_USER_SETTINGS: UserSettings = {
  messageNotifications: true,
  darkMode: false,
};

export async function createUserProfile(params: {
  uid: string;
  name: string;
  email: string;
  region: string;
  role: UserRole;
}): Promise<void> {
  const ref = doc(db, "users", params.uid);

  const payload: UserProfile = {
    uid: params.uid,
    name: params.name.trim(),
    email: params.email.trim().toLowerCase(),

    region: params.region,
    city: params.region,

    role: params.role,

    avatarUrl: "",
    avatarPath: "",

    verified: false,

    settings: DEFAULT_USER_SETTINGS,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, payload, { merge: true });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return null;
  }

  return snap.data() as UserProfile;
}

export async function updateUserSettings(
  uid: string,
  settings: UserSettings,
): Promise<void> {
  const ref = doc(db, "users", uid);

  await updateDoc(ref, {
    settings,
    updatedAt: serverTimestamp(),
  });
}

export async function markUserEmailVerified(uid: string): Promise<void> {
  const ref = doc(db, "users", uid);

  await updateDoc(ref, {
    verified: true,
    emailVerifiedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserSecurityCheck(uid: string): Promise<void> {
  const ref = doc(db, "users", uid);

  await updateDoc(ref, {
    lastSecurityCheckAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function getResolvedUserSettings(
  profile: UserProfile | null,
): UserSettings {
  return {
    messageNotifications: profile?.settings?.messageNotifications ?? true,
    darkMode: profile?.settings?.darkMode ?? false,
  };
}