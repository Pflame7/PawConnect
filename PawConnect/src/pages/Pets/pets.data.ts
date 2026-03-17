export const CITIES = [
  "София",
  "Пловдив",
  "Варна",
  "Бургас",
  "Стара Загора",
  "Русе",
  "Плевен",
  "Шумен",
] as const;

export const BREEDS = [
  "Чихуахуа",
  "Пудел",
  "Хъски",
  "Немска овчарка",
  "Лабрадор",
  "Голдън ретривър",
  "Бийгъл",
  "Френски булдог",
  "Йоркширски териер",
  "Мелез",
] as const;

export const PET_TRAITS = [
  "Игриво",
  "Спокойно",
  "Енергично",
  "Послушно",
  "Любопитно",
  "Приятелско",
  "Защитно",
  "Независимо",
  "Привързано",
  "Срамежливо",
] as const;

export type PetGender = "male" | "female";
export type PetSize = "small" | "medium" | "large" | "giant";

export const SIZE_OPTIONS: { value: PetSize; label: string }[] = [
  { value: "small", label: "Малко (до 10кг)" },
  { value: "medium", label: "Средно (10–25кг)" },
  { value: "large", label: "Голямо (25–45кг)" },
  { value: "giant", label: "Гигант (над 45кг)" },
];

export const GENDER_OPTIONS: { value: PetGender; label: string }[] = [
  { value: "male", label: "Мъжко" },
  { value: "female", label: "Женско" },
];
