import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
} from "firebase/firestore";

import SearchableSelect from "../../components/ui/SearchableSelect";
import { PetCard } from "../../components/pets/PetCard";
import type { Pet, PetSizeGroup } from "../../types/pet";
import { db } from "../../services/firebase";
import { useAuth } from "../../app/providers/useAuth";
import {
  ANIMAL_TYPES,
  BREEDS_BY_ANIMAL,
  type AnimalType,
} from "../../constants/formOptions";
import {
  breedsFromPets,
  citiesFromPets,
  sizeGroupFromWeight,
} from "./pets.utils";

const SIZE_OPTIONS: Array<{ value: PetSizeGroup | ""; label: string }> = [
  { value: "", label: "Всички размери" },
  { value: "Малко", label: "Малко (до 10кг)" },
  { value: "Средно", label: "Средно (10-25кг)" },
  { value: "Голямо", label: "Голямо (25-45кг)" },
  { value: "Гигант", label: "Гигант (над 45кг)" },
];

function toStringSafe(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toNumberSafe(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function toStringArraySafe(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function toGenderSafe(value: unknown): Pet["gender"] {
  if (value === "Мъжко" || value === "Женско") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "male" || normalized === "мъжко") return "Мъжко";
    if (normalized === "female" || normalized === "женско") return "Женско";
  }
  return undefined;
}

function normalizePetSizeLabel(size: string): string {
  const normalized = size.trim().toLowerCase();

  switch (normalized) {
    case "small":
      return "Малко";
    case "medium":
      return "Средно";
    case "large":
      return "Голямо";
    case "giant":
      return "Гигантско";
    default:
      return size;
  }
}

function isAnimalType(value: string): value is AnimalType {
  return ANIMAL_TYPES.includes(value as AnimalType);
}

function isPetSizeGroup(value: string): value is PetSizeGroup {
  return (
    value === "Малко" ||
    value === "Средно" ||
    value === "Голямо" ||
    value === "Гигант"
  );
}

function mapPetDoc(id: string, data: DocumentData): Pet {
  const rawAnimalType = toStringSafe(data.animalType);
  const animalType: AnimalType = isAnimalType(rawAnimalType)
    ? rawAnimalType
    : "Куче";

  return {
    id,
    ownerId: toStringSafe(data.ownerId),
    animalType,
    name: toStringSafe(data.name),
    breed: toStringSafe(data.breed),
    city: toStringSafe(data.city),
    area: toStringSafe(data.area) || undefined,
    ageYears: toNumberSafe(data.ageYears),
    ageMonths:
      typeof data.ageMonths === "number"
        ? toNumberSafe(data.ageMonths)
        : undefined,
    weightKg: toNumberSafe(data.weightKg),
    imageUrl: toStringSafe(data.imageUrl),
    imagePath: toStringSafe(data.imagePath) || undefined,
    gender: toGenderSafe(data.gender),
    size: (() => {
      const rawSize = toStringSafe(data.size);
      return rawSize ? normalizePetSizeLabel(rawSize) : undefined;
    })(),
    friendlyWithDogs: Boolean(data.friendlyWithDogs),
    goodWithKids: Boolean(data.goodWithKids),
    traits: toStringArraySafe(data.traits),
    about: toStringSafe(data.about) || undefined,
  };
}

export default function PetsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [qText, setQText] = useState("");
  const [animalType, setAnimalType] = useState<AnimalType | "">("");
  const [city, setCity] = useState("");
  const [breed, setBreed] = useState("");
  const [size, setSize] = useState<PetSizeGroup | "">("");

  const [moreOpen, setMoreOpen] = useState(false);
  const [friendly, setFriendly] = useState(false);
  const [kids, setKids] = useState(false);

  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const qRef = query(collection(db, "pets"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      qRef,
      (snapshot) => {
        const list = snapshot.docs.map((docItem) =>
          mapPetDoc(docItem.id, docItem.data() as DocumentData),
        );
        setPets(list);
        setLoadError(null);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setPets([]);
        setLoadError("Не успях да заредя любимците от базата.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const publicPets = useMemo(() => {
    const uid = user?.uid;
    if (!uid) return pets;
    return pets.filter((pet) => pet.ownerId !== uid);
  }, [pets, user?.uid]);

  const animalFilteredPets = useMemo(() => {
    if (!animalType) return publicPets;
    return publicPets.filter((pet) => pet.animalType === animalType);
  }, [publicPets, animalType]);

  const cities = useMemo(
    () => citiesFromPets(animalFilteredPets),
    [animalFilteredPets],
  );

  const breeds = useMemo(() => {
    if (animalType) {
      return [...BREEDS_BY_ANIMAL[animalType]].sort((a, b) =>
        a.localeCompare(b, "bg"),
      );
    }
    return breedsFromPets(publicPets);
  }, [animalType, publicPets]);

  const filtered = useMemo(() => {
    const normalizedQuery = qText.trim().toLowerCase();

    return publicPets.filter((pet) => {
      const name = (pet.name ?? "").toLowerCase();
      const petBreed = (pet.breed ?? "").toLowerCase();

      const matchesQuery =
        !normalizedQuery ||
        name.includes(normalizedQuery) ||
        petBreed.includes(normalizedQuery);

      const matchesAnimalType = !animalType || pet.animalType === animalType;
      const matchesCity = !city || pet.city === city;
      const matchesBreed = !breed || pet.breed === breed;
      const matchesSize =
        !size || sizeGroupFromWeight(Number(pet.weightKg ?? 0)) === size;
      const matchesFriendly = !friendly || Boolean(pet.friendlyWithDogs);
      const matchesKids = !kids || Boolean(pet.goodWithKids);

      return (
        matchesQuery &&
        matchesAnimalType &&
        matchesCity &&
        matchesBreed &&
        matchesSize &&
        matchesFriendly &&
        matchesKids
      );
    });
  }, [publicPets, qText, animalType, city, breed, size, friendly, kids]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
        <div className="relative">
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-orange-400">
            🔎
          </div>
          <input
            value={qText}
            onChange={(event) => setQText(event.target.value)}
            placeholder="Търси по име или порода..."
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-start">
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SearchableSelect
              placeholder="Животно"
              value={animalType}
              options={ANIMAL_TYPES}
              onChange={(selectedAnimalType) => {
                if (!selectedAnimalType) {
                  setAnimalType("");
                  setBreed("");
                  return;
                }

                if (!isAnimalType(selectedAnimalType)) return;

                setAnimalType(selectedAnimalType);
                setBreed("");
              }}
              emptyMessage="Няма намерени животни"
            />

            <SearchableSelect
              placeholder="Град"
              value={city}
              options={cities}
              onChange={(selectedCity) => setCity(selectedCity)}
              emptyMessage="Няма намерени градове"
            />

            <SearchableSelect
              placeholder="Порода"
              value={breed}
              options={breeds}
              onChange={(selectedBreed) => setBreed(selectedBreed)}
              emptyMessage="Няма намерени породи"
            />

            <SearchableSelect
              placeholder="Размер"
              value={size}
              options={SIZE_OPTIONS}
              searchable={false}
              onChange={(selectedSize) => {
                if (!selectedSize) {
                  setSize("");
                  return;
                }

                if (!isPetSizeGroup(selectedSize)) return;

                setSize(selectedSize);
              }}
              emptyMessage="Няма намерени размери"
            />
          </div>

          <button
            type="button"
            onClick={() => setMoreOpen((value) => !value)}
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 active:scale-[0.99] ${
              moreOpen
                ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300"
                : "border-gray-200 bg-white text-gray-900 hover:border-orange-200 hover:bg-orange-50 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:hover:border-orange-500/20 dark:hover:bg-orange-500/10"
            }`}
          >
            Още филтри
            <span className="ml-1">{moreOpen ? "˄" : "˅"}</span>
          </button>
        </div>

        {moreOpen ? (
          <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50/40 p-5 dark:border-orange-500/20 dark:bg-orange-500/5">
            <div className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Характеристики
            </div>

            <label className="flex cursor-pointer items-center gap-3 py-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={friendly}
                onChange={(event) => setFriendly(event.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-orange-500"
              />
              Дружелюбно с други любимици
            </label>

            <label className="flex cursor-pointer items-center gap-3 py-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={kids}
                onChange={(event) => setKids(event.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-orange-500"
              />
              Подходящо за деца
            </label>
          </div>
        ) : null}
      </section>

      {loadError ? (
        <div className="rounded-2xl bg-white p-6 text-sm text-red-600 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:text-red-400 dark:ring-white/10">
          {loadError}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl bg-white p-6 text-sm text-gray-700 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:text-gray-200 dark:ring-white/10">
          Зареждане...
        </div>
      ) : null}

      {!loading && !loadError ? (
        <>
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                onOpen={() => navigate(`/pets/${pet.id}`)}
              />
            ))}
          </section>

          {filtered.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-sm text-gray-700 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:text-gray-200 dark:ring-white/10">
              Няма резултати за избраните филтри.
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}