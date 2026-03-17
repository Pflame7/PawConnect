import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../services/firebase";
import { useAuth } from "../../app/providers/useAuth";
import type { Pet } from "../../types/pet";
import type { Caretaker, CaretakerService } from "../../types/caretaker";
import type { AnimalType } from "../../constants/formOptions";

type FirestoreDocData = Record<string, unknown>;

type ReviewAggregate = {
  rating: number;
  reviewsCount: number;
};

type CaretakerReviewDoc = {
  caretakerId: string;
  rating: number;
};

type CurrentUserProfile = {
  name: string;
  city: string;
};

function toStringSafe(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toNumberSafe(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function toBooleanSafe(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function toStringArraySafe(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function toServicesSafe(value: unknown): CaretakerService[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is CaretakerService => typeof item === "string");
}

function toAnimalTypeSafe(value: unknown): AnimalType {
  if (value === "Куче" || value === "Котка" || value === "Папагал") {
    return value;
  }

  return "Куче";
}

function petEmojiFromAnimalType(animalType: AnimalType): string {
  if (animalType === "Котка") return "🐱";
  if (animalType === "Папагал") return "🦜";
  return "🐶";
}

function ageTextFromPet(ageYears: number, ageMonths?: number): string {
  const months = Number(ageMonths ?? 0);

  if (!ageYears && !months) return "Възраст не е посочена";
  if (ageYears && months) return `${ageYears} години и ${months} мес.`;
  if (ageYears) return `${ageYears} години`;
  return `${months} мес.`;
}

function shuffleArray<T>(items: T[]): T[] {
  const next = [...items];

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = next[i];
    next[i] = next[j];
    next[j] = temp;
  }

  return next;
}

function takePreferredByCity<T extends { city: string }>(
  items: T[],
  city: string,
  limit: number,
): T[] {
  const normalizedCity = city.trim().toLowerCase();

  if (!normalizedCity) {
    return shuffleArray(items).slice(0, limit);
  }

  const sameCity = items.filter(
    (item) => item.city.trim().toLowerCase() === normalizedCity,
  );

  if (sameCity.length >= limit) {
    return shuffleArray(sameCity).slice(0, limit);
  }

  const rest = items.filter(
    (item) => item.city.trim().toLowerCase() !== normalizedCity,
  );

  return [...shuffleArray(sameCity), ...shuffleArray(rest)].slice(0, limit);
}

function mapPetDoc(petId: string, data: FirestoreDocData): Pet {
  return {
    id: petId,
    ownerId: toStringSafe(data.ownerId),
    animalType: toAnimalTypeSafe(data.animalType),
    name: toStringSafe(data.name) || "Любимец",
    breed: toStringSafe(data.breed) || "Не е посочена порода",
    city: toStringSafe(data.city) || "—",
    area: toStringSafe(data.area) || undefined,
    ageYears: toNumberSafe(data.ageYears),
    ageMonths:
      data.ageMonths !== undefined ? toNumberSafe(data.ageMonths) : undefined,
    weightKg: toNumberSafe(data.weightKg),
    imageUrl: toStringSafe(data.imageUrl) || undefined,
    imagePath: toStringSafe(data.imagePath) || undefined,
    gender: (() => {
      const gender = toStringSafe(data.gender);
      return gender === "Мъжко" || gender === "Женско" ? gender : undefined;
    })(),
    size: toStringSafe(data.size) || undefined,
    friendlyWithDogs: toBooleanSafe(data.friendlyWithDogs),
    goodWithKids: toBooleanSafe(data.goodWithKids),
    traits: toStringArraySafe(data.traits),
    about: toStringSafe(data.about) || undefined,
  };
}

function toReviewDocSafe(data: FirestoreDocData): CaretakerReviewDoc | null {
  const caretakerId = toStringSafe(data.caretakerId);
  const rating = toNumberSafe(data.rating);

  if (!caretakerId) return null;
  if (rating < 1 || rating > 5) return null;

  return {
    caretakerId,
    rating,
  };
}

function buildReviewAggregates(
  reviewDocs: CaretakerReviewDoc[],
): Record<string, ReviewAggregate> {
  const totals: Record<string, { sum: number; count: number }> = {};

  for (const review of reviewDocs) {
    const current = totals[review.caretakerId] ?? { sum: 0, count: 0 };

    totals[review.caretakerId] = {
      sum: current.sum + review.rating,
      count: current.count + 1,
    };
  }

  const result: Record<string, ReviewAggregate> = {};

  for (const [caretakerId, value] of Object.entries(totals)) {
    result[caretakerId] = {
      rating: Number((value.sum / value.count).toFixed(1)),
      reviewsCount: value.count,
    };
  }

  return result;
}

function mapCaretakerDoc(
  userId: string,
  data: FirestoreDocData,
  aggregate?: ReviewAggregate,
): Caretaker {
  const about = toStringSafe(data.about);
  const shortBio =
    toStringSafe(data.shortBio) ||
    (about
      ? `${about.slice(0, 90)}${about.length > 90 ? "…" : ""}`
      : "Гледач за домашни любимци");

  return {
    id: userId,
    name: toStringSafe(data.name) || "Без име",
    city: toStringSafe(data.city) || toStringSafe(data.region) || "—",
    area: toStringSafe(data.area) || undefined,
    avatarUrl: toStringSafe(data.avatarUrl) || "https://via.placeholder.com/96",
    verified: toBooleanSafe(data.verified),
    pricePerDay: toNumberSafe(data.pricePerDay),
    rating: aggregate?.rating ?? 0,
    reviewsCount: aggregate?.reviewsCount ?? 0,
    shortBio,
    about,
    experience: toStringSafe(data.experience),
    services: toServicesSafe(data.services),
    reviews: undefined,
  };
}

function ActionCard({
  title,
  icon,
  gradientClassName,
  onClick,
}: {
  title: string;
  icon: string;
  gradientClassName: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        ${gradientClassName}
        flex min-h-28 w-full min-w-0 cursor-pointer flex-col items-start justify-between rounded-3xl p-5 text-left text-white shadow-lg transition hover:-translate-y-[1px] hover:shadow-xl active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200
      `}
    >
      <span className="text-3xl">{icon}</span>
      <span className="break-words text-lg font-bold">{title}</span>
    </button>
  );
}

function PetSuggestionCard({
  pet,
  onOpen,
}: {
  pet: Pet;
  onOpen: () => void;
}) {
  const petEmoji = petEmojiFromAnimalType(pet.animalType);

  return (
    <article
      onClick={onOpen}
      className="cursor-pointer overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-[1px] hover:shadow-md dark:bg-neutral-900 dark:ring-white/10"
    >
      <div className="relative h-56 w-full bg-gray-100 dark:bg-neutral-800">
        {pet.imageUrl ? (
          <img
            src={pet.imageUrl}
            alt={pet.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-6xl">
            {petEmoji}
          </div>
        )}

        {pet.traits && pet.traits.length > 0 ? (
          <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-black/5 backdrop-blur dark:bg-neutral-900/90 dark:text-emerald-300 dark:ring-white/10">
            {pet.traits[0]}
          </div>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-4 pb-4 pt-10">
          <div className="break-words text-3xl font-extrabold text-white">
            {pet.name}
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="break-words text-lg font-bold text-gray-900 dark:text-gray-100">
              {pet.breed}
            </div>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {ageTextFromPet(pet.ageYears, pet.ageMonths)} · {pet.weightKg} кг
            </div>
          </div>

          {pet.size ? (
            <span className="shrink-0 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/20">
              {pet.size}
            </span>
          ) : null}
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-300">
          📍 {pet.city}
          {pet.area ? `, ${pet.area}` : ""}
        </div>

        {pet.about ? (
          <div className="line-clamp-2 break-words text-sm text-gray-700 dark:text-gray-200">
            {pet.about}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function CaretakerSuggestionCard({
  caretaker,
  onOpen,
  onConnect,
}: {
  caretaker: Caretaker;
  onOpen: () => void;
  onConnect: () => void;
}) {
  return (
    <article
      onClick={onOpen}
      className="cursor-pointer overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-[1px] hover:shadow-md dark:bg-neutral-900 dark:ring-white/10"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <img
            src={caretaker.avatarUrl}
            alt={caretaker.name}
            className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-1 ring-black/5 dark:ring-white/10"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-xl font-bold text-gray-900 dark:text-gray-100">
                {caretaker.name}
              </div>

              {caretaker.verified ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20">
                  Верифициран
                </span>
              ) : null}
            </div>

            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              📍 {caretaker.city}
              {caretaker.area ? `, ${caretaker.area}` : ""}
            </div>

            <div className="mt-3 line-clamp-2 break-words text-sm text-gray-700 dark:text-gray-200">
              {caretaker.shortBio}
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20">
            ⭐ {caretaker.rating.toFixed(1)}
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            ({caretaker.reviewsCount})
          </div>
        </div>
      </div>

      {caretaker.services.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {caretaker.services.slice(0, 3).map((service) => (
            <span
              key={service}
              className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-100 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/20"
            >
              {service}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
        <div className="min-w-0 text-sm">
          <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            {caretaker.pricePerDay}
          </span>{" "}
          <span className="text-gray-600 dark:text-gray-300">лв/ден</span>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onConnect();
          }}
          className="shrink-0 cursor-pointer rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
        >
          Свържи се
        </button>
      </div>
    </article>
  );
}

function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="break-words text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
          {title}
        </h2>
        <p className="mt-1 break-words text-gray-600 dark:text-gray-300">
          {subtitle}
        </p>
      </div>

      <button
        type="button"
        onClick={onAction}
        className="inline-flex shrink-0 cursor-pointer items-center gap-2 self-start text-sm font-semibold text-orange-600 transition hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
      >
        {actionLabel}
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState<CurrentUserProfile>({
    name: "",
    city: "",
  });
  const [pets, setPets] = useState<Pet[]>([]);
  const [caretakers, setCaretakers] = useState<Caretaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadHomeData(): Promise<void> {
      if (!user?.uid) {
        if (!ignore) {
          setLoading(false);
        }
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const userData = userSnap.exists()
          ? (userSnap.data() as FirestoreDocData)
          : {};

        const currentProfile: CurrentUserProfile = {
          name: toStringSafe(userData.name) || user.displayName || "Потребител",
          city: toStringSafe(userData.city) || toStringSafe(userData.region),
        };

        const petsSnap = await getDocs(collection(db, "pets"));
        const allPets = petsSnap.docs
          .map((petDoc) =>
            mapPetDoc(petDoc.id, petDoc.data() as FirestoreDocData),
          )
          .filter((pet) => pet.ownerId !== user.uid);

        const caretakersQuery = query(
          collection(db, "users"),
          where("role", "==", "caretaker"),
        );
        const caretakersSnap = await getDocs(caretakersQuery);

        const reviewsSnap = await getDocs(collection(db, "caretakerReviews"));
        const reviewDocs = reviewsSnap.docs
          .map((reviewDoc) =>
            toReviewDocSafe(reviewDoc.data() as FirestoreDocData),
          )
          .filter((review): review is CaretakerReviewDoc => review !== null);

        const aggregates = buildReviewAggregates(reviewDocs);

        const allCaretakers = caretakersSnap.docs
          .map((caretakerDoc) =>
            mapCaretakerDoc(
              caretakerDoc.id,
              caretakerDoc.data() as FirestoreDocData,
              aggregates[caretakerDoc.id],
            ),
          )
          .filter((caretaker) => caretaker.id !== user.uid);

        if (!ignore) {
          setProfile(currentProfile);
          setPets(allPets);
          setCaretakers(allCaretakers);
          setLoadError(null);
          setLoading(false);
        }
      } catch (error: unknown) {
        console.error(error);

        if (!ignore) {
          setLoadError("Не успях да заредя началната страница.");
          setLoading(false);
        }
      }
    }

    void loadHomeData();

    return () => {
      ignore = true;
    };
  }, [user]);

  const suggestedPets = useMemo(() => {
    return takePreferredByCity(pets, profile.city, 6);
  }, [pets, profile.city]);

  const suggestedCaretakers = useMemo(() => {
    return takePreferredByCity(caretakers, profile.city, 6);
  }, [caretakers, profile.city]);

  if (loading) {
    return (
      <div className="overflow-x-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:text-gray-100 dark:ring-white/10">
        Зареждане...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="overflow-x-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
        <div className="text-sm text-red-600 dark:text-red-400">
          {loadError}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 overflow-x-hidden px-4 pb-24 pt-6">
      <section className="min-w-0 space-y-3">
        <h1 className="break-words text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
          Здравей, {profile.name}! <span className="ml-1">👋</span>
        </h1>

        <div className="break-words text-base text-gray-600 dark:text-gray-300 sm:text-lg">
          📍 {profile.city || "Локацията не е посочена"}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ActionCard
          title="Моят профил"
          icon="🐾"
          gradientClassName="bg-gradient-to-br from-orange-500 to-amber-500"
          onClick={() => navigate("/profile")}
        />

        <ActionCard
          title="Намери гледач"
          icon="🧑‍🤝‍🧑"
          gradientClassName="bg-gradient-to-br from-emerald-500 to-teal-500"
          onClick={() => navigate("/caretakers")}
        />

        <ActionCard
          title="Разгледай любимци"
          icon="✨"
          gradientClassName="bg-gradient-to-br from-blue-500 to-indigo-500"
          onClick={() => navigate("/pets")}
        />

        <ActionCard
          title="Съобщения"
          icon="💬"
          gradientClassName="bg-gradient-to-br from-pink-500 to-rose-500"
          onClick={() => navigate("/chats")}
        />
      </section>

      <section>
        <SectionHeader
          title="Предложения за домашни любимци"
          subtitle="Сладки любимци, които може да харесаш."
          actionLabel="Виж всички"
          onAction={() => navigate("/pets")}
        />

        {suggestedPets.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {suggestedPets.map((pet) => (
              <PetSuggestionCard
                key={pet.id}
                pet={pet}
                onOpen={() => navigate(`/pets/${pet.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-6 text-sm text-gray-700 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:text-gray-200 dark:ring-white/10">
            Все още няма налични предложения за домашни любимци.
          </div>
        )}
      </section>

      <section>
        <SectionHeader
          title="Предложения за гледачи"
          subtitle="Предложения за гледачи, които могат да ти допаднат."
          actionLabel="Виж всички"
          onAction={() => navigate("/caretakers")}
        />

        {suggestedCaretakers.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {suggestedCaretakers.map((caretaker) => (
              <CaretakerSuggestionCard
                key={caretaker.id}
                caretaker={caretaker}
                onOpen={() => navigate(`/caretakers/${caretaker.id}`)}
                onConnect={() => navigate("/chats")}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-6 text-sm text-gray-700 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:text-gray-200 dark:ring-white/10">
            Все още няма налични предложения за гледачи.
          </div>
        )}
      </section>
    </div>
  );
}