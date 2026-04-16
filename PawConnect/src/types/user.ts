export type UserRole = "owner" | "caretaker";

export type UserSettings = {
  messageNotifications: boolean;
  darkMode: boolean;
};

export type UserProfile = {
  uid: string;

  name: string;
  email: string;

  region?: string;
  city?: string;

  area?: string;
  phone?: string;
  about?: string;

  role: UserRole;

  experience?: string;
  pricePerDay?: number;
  services?: string[];

  avatarUrl?: string;
  avatarPath?: string;

  verified?: boolean;
  emailVerifiedAt?: unknown;
  lastSecurityCheckAt?: unknown;

  settings?: UserSettings;

  createdAt?: unknown;
  updatedAt?: unknown;
};