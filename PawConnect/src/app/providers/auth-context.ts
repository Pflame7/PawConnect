import { createContext } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import type { UserProfile } from "../../types/user";

export type AuthContextValue = {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
