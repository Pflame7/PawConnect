import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, orderBy, query, type DocumentData } from "firebase/firestore";

import { PetCard } from "../../components/pets/PetCard";
import type { Pet, PetSizeGroup } from "../../types/pet";
import { db } from "../../services/firebase";
import { useAuth } from "../../app/providers/useAuth";
import { breedsFromPets, citiesFromPets, sizeGroupFromWeight } from "./pets.utils";

const SIZE_OPTIONS: Array<{ value: PetSizeGroup | ""; label: string }> = [
  { value: "", label: "Всички размери" },
  { value: "Малко", label: "Малко (до 10кг)" },
  { value: "Средно", label: "Средно (10-25кг)" },
  { value: "Голямо", label: "Голямо (25-45кг)" },
  { value: "Гигант", label: "Гигант (над 45кг)" },
];

function toStringSafe(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function toNumberSafe(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function toStringArraySafe(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function toGenderSafe(v: unknown): Pet["gender"] {
  if (v === "Мъжко" || v === "Женско") return v;
  if (typeof v === "string") {
    const n = v.trim().toLowerCase();
    if (n === "male" || n === "мъжко") return "Мъжко";
    if (n === "female" || n === "женско") return "Женско";
  }
  return undefined;
}

function mapPetDoc(id: string, data: DocumentData): Pet {
  return {
    id,
    ownerId: toStringSafe(data.ownerId), // ✅ винаги string (ако липсва -> "")

    name: toStringSafe(data.name),
    breed: toStringSafe(data.breed),

    city: toStringSafe(data.city),
    area: toStringSafe(data.area) || undefined,

    ageYears: toNumberSafe(data.ageYears),
    ageMonths: typeof data.ageMonths === "number" ? toNumberSafe(data.ageMonths) : undefined,

    weightKg: toNumberSafe(data.weightKg),

    imageUrl: toStringSafe(data.imageUrl),

    gender: toGenderSafe(data.gender),

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

    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const list = snap.docs.map((d) => mapPetDoc(d.id, d.data() as DocumentData));
        setPets(list);
        setLoadError(null);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setPets([]);
        setLoadError("Не успях да заредя кучетата от базата.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // ✅ Махаме моите кучета от списъка
  const publicPets = useMemo(() => {
    const uid = user?.uid;
    if (!uid) return pets;
    return pets.filter((p) => p.ownerId !== uid);
  }, [pets, user?.uid]);

  const cities = useMemo(() => citiesFromPets(publicPets), [publicPets]);
  const breeds = useMemo(() => breedsFromPets(publicPets), [publicPets]);

  const filtered = useMemo(() => {
    const t = qText.trim().toLowerCase();

    return publicPets.filter((p) => {
      const name = (p.name ?? "").toLowerCase();
      const pBreed = (p.breed ?? "").toLowerCase();

      const matchesQ = !t || name.includes(t) || pBreed.includes(t);
      const matchesCity = !city || p.city === city;
      const matchesBreed = !breed || p.breed === breed;

      const matchesSize = !size || sizeGroupFromWeight(Number(p.weightKg ?? 0)) === size;

      const matchesFriendly = !friendly || !!p.friendlyWithDogs;
      const matchesKids = !kids || !!p.goodWithKids;

      return matchesQ && matchesCity && matchesBreed && matchesSize && matchesFriendly && matchesKids;
    });
  }, [publicPets, qText, city, breed, size, friendly, kids]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="relative">
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            🔎
          </div>
          <input
            value={qText}
            onChange={(e) => setQText(e.target.value)}
            placeholder="Търси по име или порода..."
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm outline-none
                       focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none cursor-pointer
                         focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Град</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none cursor-pointer
                         focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Порода</option>
              {breeds.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <select
              value={size}
              onChange={(e) => setSize(e.target.value as PetSizeGroup | "")}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none cursor-pointer
                         focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            >
              {SIZE_OPTIONS.map((o) => (
                <option key={o.label} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200
              active:scale-[0.99]
              ${
                moreOpen
                  ? "border-gray-300 bg-gray-50 text-gray-900"
                  : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
              }`}
          >
            <span className="text-gray-700">🎚️</span>
            Още филтри
            <span className="ml-1">{moreOpen ? "˄" : "˅"}</span>
          </button>
        </div>

        {moreOpen && (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5">
            <div className="text-sm font-semibold text-gray-900 mb-3">Характеристики</div>

            <label className="flex items-center gap-3 py-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={friendly}
                onChange={(e) => setFriendly(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 cursor-pointer"
              />
              Дружелюбно с кучета
            </label>

            <label className="flex items-center gap-3 py-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={kids}
                onChange={(e) => setKids(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 cursor-pointer"
              />
              Подходящо за деца
            </label>
          </div>
        )}
      </section>

      {loadError && (
        <div className="rounded-2xl bg-white p-6 text-sm text-red-600 shadow-sm ring-1 ring-black/5">
          {loadError}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl bg-white p-6 text-sm text-gray-700 shadow-sm ring-1 ring-black/5">
          Зареждане...
        </div>
      )}

      {!loading && !loadError && (
        <>
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((pet) => (
              <PetCard key={pet.id} pet={pet} onOpen={() => navigate(`/pets/${pet.id}`)} />
            ))}
          </section>

          {filtered.length === 0 && (
            <div className="rounded-2xl bg-white p-6 text-sm text-gray-700 shadow-sm ring-1 ring-black/5">
              Няма резултати за избраните филтри.
            </div>
          )}
        </>
      )}
    </div>
  );
}