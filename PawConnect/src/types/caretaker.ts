export type CaretakerService =
  | "Гледане в дома"
  | "Разходки"
  | "Дневна грижа"
  | "Ветеринарни посещения"
  | "Хранене";

export type CaretakerReview = {
  id: string;
  authorName: string;
  authorSubtitle?: string;
  authorAvatarUrl?: string;
  rating: number; // 1..5
  text: string;
  date: string; // "14.01.2026"
};

export type Caretaker = {
  id: string;
  name: string;
  city: string;
  area?: string;

  avatarUrl: string;

  verified?: boolean;

  pricePerDay: number;
  rating: number; // 0..5
  reviewsCount: number;

  shortBio: string;
  about: string;
  experience: string;

  services: CaretakerService[];

  reviews?: CaretakerReview[];
};
