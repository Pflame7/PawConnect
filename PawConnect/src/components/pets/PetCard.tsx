import type { Pet } from "../../types/pet";
import { sizeGroupFromWeight } from "../../pages/Pets/pets.utils";

function sizePillClass(group: ReturnType<typeof sizeGroupFromWeight>): string {
  switch (group) {
    case "Малко":
      return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/15 dark:text-orange-300";
    case "Средно":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300";
    case "Голямо":
      return "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-500/20 dark:bg-yellow-500/15 dark:text-yellow-300";
    case "Гигант":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/15 dark:text-red-300";
    default:
      return "border-gray-200 bg-gray-50 text-gray-700 dark:border-white/10 dark:bg-neutral-800 dark:text-gray-300";
  }
}

export function PetCard({
  pet,
  onOpen,
}: {
  pet: Pet;
  onOpen: () => void;
}) {
  const group = sizeGroupFromWeight(pet.weightKg);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full cursor-pointer overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-black/5 transition hover:-translate-y-[1px] hover:shadow-md active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 dark:bg-neutral-900 dark:ring-white/10"
    >
      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-neutral-800">
        <img
          src={pet.imageUrl}
          alt={pet.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />

        {pet.friendlyWithDogs ? (
          <div className="absolute left-3 top-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-black/5 backdrop-blur dark:bg-neutral-900/90 dark:text-emerald-300 dark:ring-white/10">
              🐾 Дружелюбно
            </span>
          </div>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
          <div className="truncate text-lg font-bold text-white">
            {pet.name}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {pet.breed}
            </div>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              {pet.ageYears} год.
              {typeof pet.ageMonths === "number"
                ? ` и ${pet.ageMonths} мес.`
                : ""}{" "}
              • {pet.weightKg} кг
            </div>
          </div>

          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${sizePillClass(
              group,
            )}`}
          >
            {group}
          </span>
        </div>

        <div className="mt-3 truncate text-xs text-gray-600 dark:text-gray-300">
          📍 {pet.city}
          {pet.area ? `, ${pet.area}` : ""}
        </div>

        {pet.traits && pet.traits.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {pet.traits.slice(0, 3).map((trait) => (
              <span
                key={trait}
                className="rounded-full bg-gray-50 px-2.5 py-1 text-xs text-gray-700 ring-1 ring-black/5 dark:bg-neutral-800 dark:text-gray-300 dark:ring-white/10"
              >
                {trait}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </button>
  );
}