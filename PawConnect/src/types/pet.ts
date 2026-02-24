export type PetSizeGroup = "Малко" | "Средно" | "Голямо" | "Гигант";

export type Pet = {
  id: string;

  ownerId: string;

  name: string;
  breed: string;
  city: string;
  area?: string;

  ageYears: number;
  ageMonths?: number;

  weightKg: number;

  // снимка от Supabase
  imageUrl?: string;
  imagePath?: string;

  gender?: "Мъжко" | "Женско";
  size?: string;

  friendlyWithDogs?: boolean;
  goodWithKids?: boolean;

  traits?: string[];
  about?: string;
};