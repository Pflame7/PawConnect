import type { Pet } from "../../types/pet";
import { sizeGroupFromWeight } from "../../pages/Pets/pets.utils";

function sizePillClass(group: ReturnType<typeof sizeGroupFromWeight>) {
  switch (group) {
    case "Малко":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "Средно":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Голямо":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "Гигант":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

export function PetCard({ pet, onOpen }: { pet: Pet; onOpen: () => void }) {
  const group = sizeGroupFromWeight(pet.weightKg);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5
                 transition cursor-pointer
                 hover:shadow-md hover:-translate-y-[1px]
                 active:translate-y-0
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        <img
          src={pet.imageUrl}
          alt={pet.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />

        {pet.friendlyWithDogs && (
          <div className="absolute left-3 top-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-black/5 backdrop-blur">
              🐾 Дружелюбно
            </span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
          <div className="text-lg font-bold text-white">{pet.name}</div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">{pet.breed}</div>
            <div className="mt-1 text-xs text-gray-600">
              {pet.ageYears} год.
              {typeof pet.ageMonths === "number" ? ` и ${pet.ageMonths} мес.` : ""} •{" "}
              {pet.weightKg} кг
            </div>
          </div>

          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${sizePillClass(
              group
            )}`}
          >
            {group}
          </span>
        </div>

        <div className="mt-3 text-xs text-gray-600">
          📍 {pet.city}
          {pet.area ? `, ${pet.area}` : ""}
        </div>

        {pet.traits && pet.traits.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {pet.traits.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-full bg-gray-50 px-2.5 py-1 text-xs text-gray-700 ring-1 ring-black/5"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
