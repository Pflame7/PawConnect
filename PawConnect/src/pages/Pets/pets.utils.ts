import type { Pet, PetSizeGroup } from "../../types/pet";

export function sizeGroupFromWeight(weightKg: number): PetSizeGroup {
  if (weightKg <= 10) return "Малко";
  if (weightKg <= 25) return "Средно";
  if (weightKg <= 45) return "Голямо";
  return "Гигант";
}

export function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, "bg"));
}

export function citiesFromPets(pets: Pet[]) {
  return uniqueSorted(pets.map((p) => p.city));
}

export function breedsFromPets(pets: Pet[]) {
  return uniqueSorted(pets.map((p) => p.breed));
}
