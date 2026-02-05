import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { UserProfile, UserRole } from "../types/user";

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
    role: params.role,
    createdAt: serverTimestamp(),
  };

  await setDoc(ref, payload, { merge: true });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}
