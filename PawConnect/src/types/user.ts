export type UserRole = "owner" | "caretaker";

export type UserProfile = {
  uid: string;

  name: string;
  email: string;

  // в твоя проект понякога е region, понякога city
  region?: string;
  city?: string;

  area?: string;
  phone?: string;
  about?: string;

  role: UserRole;

  // caretaker-only
  experience?: string;
  pricePerDay?: number;
  services?: string[];

  // ✅ профилна снимка (Supabase)
  avatarUrl?: string;
  avatarPath?: string;

  verified?: boolean;

  createdAt?: unknown;
  updatedAt?: unknown;
};