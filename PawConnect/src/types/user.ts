export type UserRole = "owner" | "caretaker";

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  region: string;
  role: UserRole;
  createdAt?: unknown; // serverTimestamp() е специален тип, не го типизираме строго
};
