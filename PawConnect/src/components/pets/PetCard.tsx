import type { Pet } from "../../types/pet";
import type { AnimalType } from "../../constants/formOptions";
import { sizeGroupFromWeight } from "../../pages/Pets/pets.utils";

function sizePillClass(group: ReturnType<typeof sizeGroupFromWeight>): string {
  switch (group) {
    case "Малко":
      return "bg-orange-50 text-orange-700 ring-orange-100 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/20";
    case "Средно":
      return "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20";
    case "Голямо":
      return "bg-yellow-50 text-yellow-700 ring-yellow-100 dark:bg-yellow-500/15 dark:text-yellow-300 dark:ring-yellow-500/20";
    case "Гигант":
      return "bg-red-50 text-red-700 ring-red-100 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/20";
    default:
      return "bg-gray-50 text-gray-700 ring-gray-100 dark:bg-neutral-800 dark:text-gray-300 dark:ring-white/10";
  }
}

function petEmojiFromAnimalType(animalType: AnimalType): string {
  if (animalType === "Котка") return "🐱";
  if (animalType === "Папагал") return "🦜";
  return "🐶";
}

function ageTextFromPet(ageYears: number, ageMonths?: number): string {
  const months = Number(ageMonths ?? 0);

  if (!ageYears && !months) return "Възраст не е посочена";
  if (ageYears && months) return `${ageYears} год. и ${months} мес.`;
  if (ageYears) return `${ageYears} години`;
  return `${months} мес.`;
}

export function PetCard({
  pet,
  onOpen,
}: {
  pet: Pet;
  onOpen: () => void;
}) {
  const group = sizeGroupFromWeight(Number(pet.weightKg ?? 0));
  const petEmoji = petEmojiFromAnimalType(pet.animalType);
  const traits = pet.traits ?? [];

  return (
    <article
      onClick={onOpen}
      className="cursor-pointer overflow-hidden rounded-3xl bg-white text-left shadow-sm ring-1 ring-black/5 transition hover:-translate-y-[1px] hover:shadow-md dark:bg-neutral-900 dark:ring-white/10"
    >
      <div className="relative h-56 w-full bg-gray-100 dark:bg-neutral-800">
        {pet.imageUrl ? (
          <img
            src={pet.imageUrl}
            alt={pet.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-6xl">
            {petEmoji}
          </div>
        )}

        {traits.length > 0 ? (
          <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-black/5 backdrop-blur dark:bg-neutral-900/90 dark:text-emerald-300 dark:ring-white/10">
            {traits[0]}
          </div>
        ) : pet.friendlyWithDogs ? (
          <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-black/5 backdrop-blur dark:bg-neutral-900/90 dark:text-emerald-300 dark:ring-white/10">
            Дружелюбно
          </div>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-4 pb-4 pt-10">
          <div className="line-clamp-2 break-words text-3xl font-extrabold text-white">
            {pet.name}
          </div>
        </div>
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="break-words text-lg font-bold text-gray-900 dark:text-gray-100">
              {pet.breed || "Не е посочена порода"}
            </div>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {ageTextFromPet(pet.ageYears, pet.ageMonths)} · {pet.weightKg} кг
            </div>
          </div>

          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${sizePillClass(
              group,
            )}`}
          >
            {group}
          </span>
        </div>

        <div className="truncate text-sm text-gray-600 dark:text-gray-300">
          📍 {pet.city}
          {pet.area ? `, ${pet.area}` : ""}
        </div>

        {pet.about ? (
          <div className="line-clamp-3 break-words pt-1 text-sm text-gray-700 dark:text-gray-200">
            {pet.about}
          </div>
        ) : null}
      </div>
    </article>
  );
}