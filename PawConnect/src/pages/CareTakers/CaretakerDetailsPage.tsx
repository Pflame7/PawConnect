import { useEffect, useMemo, useState } from "react";
import { getAuth, type User } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
} from "firebase/firestore";

import { db } from "../../services/firebase";
import { ConnectButton } from "../../components/chat/ConnectButton";
import type { AnimalType } from "../../constants/formOptions";

type CaretakerService =
  | "Гледане в дома"
  | "Разходки"
  | "Дневна грижа"
  | "Ветеринарни посещения"
  | "Хранене"
  | "Транспорт";

type CaretakerView = {
  id: string;
  name: string;
  city: string;
  area?: string;
  avatarUrl?: string;
  verified?: boolean;
  pricePerDay: number;
  rating: number;
  reviewsCount: number;
  about?: string;
  experience?: string;
  phone?: string;
  services: CaretakerService[];
};

type CaretakerPetView = {
  id: string;
  animalType: AnimalType;
  name: string;
  breed: string;
  city: string;
  area?: string;
  ageYears: number;
  ageMonths?: number;
  weightKg: number;
  imageUrl?: string;
};

type CaretakerReview = {
  id: string;
  caretakerId: string;
  authorId: string;
  authorName: string;
  rating: number;
  text: string;
  createdAtMillis: number;
};

function toStringSafe(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toNumberSafe(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function toServicesSafe(value: unknown): CaretakerService[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is CaretakerService => typeof item === "string");
}

function toAnimalTypeSafe(value: unknown): AnimalType {
  if (value === "Куче" || value === "Котка" || value === "Папагал") return value;
  return "Куче";
}

function toRatingSafe(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(1, Math.min(5, Math.round(value)));
}

function toCreatedAtMillisSafe(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function petEmojiFromAnimalType(animalType: AnimalType): string {
  if (animalType === "Котка") return "🐱";
  if (animalType === "Папагал") return "🦜";
  return "🐶";
}

function ageTextFromPet(ageYears: number, ageMonths?: number): string {
  const months = Number(ageMonths ?? 0);

  if (!ageYears && !months) return "Възраст не е посочена";
  if (ageYears && months) return `${ageYears} г. и ${months} мес.`;
  if (ageYears) return `${ageYears} г.`;
  return `${months} мес.`;
}

function formatDateTime(value: number): string {
  if (!value) return "Току-що";

  return new Intl.DateTimeFormat("bg-BG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function Stars({ value }: { value: number }) {
  const normalized = Math.max(0, Math.min(5, value));
  const full = Math.floor(normalized);
  const stars = Array.from({ length: 5 }, (_, index) =>
    index < full ? "★" : "☆",
  );

  return (
    <div className="text-lg leading-none text-orange-500">{stars.join("")}</div>
  );
}

function RatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        const active = starValue <= value;

        return (
          <button
            key={starValue}
            type="button"
            onClick={() => onChange(starValue)}
            className={`cursor-pointer text-3xl leading-none transition ${
              active ? "text-orange-500" : "text-gray-300 hover:text-orange-400 dark:text-gray-600"
            }`}
            aria-label={`Оцени с ${starValue} звезди`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

function InfoChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-orange-100 bg-orange-50/70 p-4 dark:border-orange-500/20 dark:bg-orange-500/10">
      <div className="text-xs font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-300">
        {label}
      </div>

      <div className="mt-1 max-h-[3.2rem] min-w-0 overflow-y-auto whitespace-normal break-all text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
        {value}
      </div>
    </div>
  );
}

function CaretakerPetCard({
  pet,
  onOpen,
}: {
  pet: CaretakerPetView;
  onOpen: () => void;
}) {
  const petEmoji = petEmojiFromAnimalType(pet.animalType);

  return (
    <article
      onClick={onOpen}
      className="cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-[1px] hover:shadow-md active:scale-[0.995] dark:bg-neutral-900 dark:ring-white/10"
    >
      <div className="relative h-44 w-full bg-gray-100 dark:bg-neutral-800">
        {pet.imageUrl ? (
          <img
            src={pet.imageUrl}
            alt={pet.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-5xl">
            {petEmoji}
          </div>
        )}

        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-black/5 backdrop-blur dark:bg-neutral-900/90 dark:text-orange-300 dark:ring-white/10">
          {pet.animalType}
        </div>
      </div>

      <div className="p-4">
        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {pet.name}
        </div>
        <div className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          {pet.breed}
        </div>

        <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
          <div>
            📍 {pet.city}
            {pet.area ? `, ${pet.area}` : ""}
          </div>
          <div>{ageTextFromPet(pet.ageYears, pet.ageMonths)}</div>
          <div>{pet.weightKg ? `${pet.weightKg} кг` : "Тегло не е посочено"}</div>
        </div>
      </div>
    </article>
  );
}

function CaretakerBottomBar({
  caretakerUid,
  caretakerName,
  pricePerDay,
}: {
  caretakerUid: string;
  caretakerName: string;
  pricePerDay: number;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur dark:bg-neutral-950/80">
      <div className="mx-auto max-w-6xl px-4 pb-4">
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-6 py-4 shadow-lg ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
              {caretakerName}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {pricePerDay} €/ден
            </div>
          </div>

          <ConnectButton
            otherUid={caretakerUid}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.99] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
            label="Свържи се"
          />
        </div>
      </div>
    </div>
  );
}

async function getAuthorName(user: User): Promise<string> {
  const displayName = user.displayName?.trim();
  if (displayName) return displayName;

  const userSnap = await getDoc(doc(db, "users", user.uid));
  if (!userSnap.exists()) return "Потребител";

  const data = userSnap.data() as DocumentData;
  return toStringSafe(data.name) || "Потребител";
}

async function fetchReviewsByCaretakerId(
  caretakerId: string,
): Promise<CaretakerReview[]> {
  const reviewsQuery = query(
    collection(db, "caretakerReviews"),
    where("caretakerId", "==", caretakerId),
  );

  const reviewsSnap = await getDocs(reviewsQuery);

  return reviewsSnap.docs
    .map((reviewDoc) => {
      const reviewData = reviewDoc.data() as DocumentData;

      return {
        id: reviewDoc.id,
        caretakerId: toStringSafe(reviewData.caretakerId),
        authorId: toStringSafe(reviewData.authorId),
        authorName: toStringSafe(reviewData.authorName) || "Потребител",
        rating: toRatingSafe(reviewData.rating),
        text: toStringSafe(reviewData.text),
        createdAtMillis: toCreatedAtMillisSafe(reviewData.createdAtMillis),
      };
    })
    .filter(
      (review) =>
        review.caretakerId &&
        review.authorId &&
        review.text.trim().length > 0 &&
        review.rating >= 1 &&
        review.rating <= 5,
    )
    .sort((a, b) => b.createdAtMillis - a.createdAtMillis);
}

export default function CaretakerDetailsPage() {
  const navigate = useNavigate();
  const { caretakerId } = useParams<{ caretakerId: string }>();

  const [caretaker, setCaretaker] = useState<CaretakerView | null>(null);
  const [pets, setPets] = useState<CaretakerPetView[]>([]);
  const [reviews, setReviews] = useState<CaretakerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [petsLoading, setPetsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [errText, setErrText] = useState<string | null>(null);

  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    let ignore = false;

    async function run(): Promise<void> {
      if (!caretakerId) {
        if (!ignore) {
          setErrText("Невалиден идентификатор.");
          setLoading(false);
          setPetsLoading(false);
          setReviewsLoading(false);
        }
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, "users", caretakerId));

        if (!userSnap.exists()) {
          if (!ignore) {
            setCaretaker(null);
            setErrText(null);
            setLoading(false);
            setPetsLoading(false);
            setReviewsLoading(false);
          }
          return;
        }

        const data = userSnap.data() as DocumentData;


        const mappedCaretaker: CaretakerView = {
          id: userSnap.id,
          name: toStringSafe(data.name) || "—",
          city: toStringSafe(data.city || data.region) || "—",
          area: toStringSafe(data.area) || undefined,
          avatarUrl: toStringSafe(data.avatarUrl) || undefined,
          verified: Boolean(data.verified),
          pricePerDay: toNumberSafe(data.pricePerDay),
          rating: toNumberSafe(data.rating),
          reviewsCount: toNumberSafe(data.reviewsCount),
          about: toStringSafe(data.about) || undefined,
          experience: toStringSafe(data.experience) || undefined,
          phone: toStringSafe(data.phone) || undefined,
          services: toServicesSafe(data.services),
        };

        const petsQuery = query(
          collection(db, "pets"),
          where("ownerId", "==", caretakerId),
        );

        const petsSnap = await getDocs(petsQuery);

        const mappedPets: CaretakerPetView[] = petsSnap.docs
          .map((petDoc) => {
            const petData = petDoc.data() as DocumentData;

            return {
              id: petDoc.id,
              animalType: toAnimalTypeSafe(petData.animalType),
              name: toStringSafe(petData.name) || "Любимец",
              breed: toStringSafe(petData.breed) || "Не е посочена порода",
              city: toStringSafe(petData.city) || "—",
              area: toStringSafe(petData.area) || undefined,
              ageYears: toNumberSafe(petData.ageYears),
              ageMonths:
                typeof petData.ageMonths === "number"
                  ? toNumberSafe(petData.ageMonths)
                  : undefined,
              weightKg: toNumberSafe(petData.weightKg),
              imageUrl: toStringSafe(petData.imageUrl) || undefined,
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name, "bg"));

        const mappedReviews = await fetchReviewsByCaretakerId(caretakerId);

        if (!ignore) {
          setCaretaker(mappedCaretaker);
          setPets(mappedPets);
          setReviews(mappedReviews);
          setErrText(null);
          setLoading(false);
          setPetsLoading(false);
          setReviewsLoading(false);
        }
      } catch (error: unknown) {
        console.error(error);

        if (!ignore) {
          setErrText("Не успях да заредя профила от базата.");
          setLoading(false);
          setPetsLoading(false);
          setReviewsLoading(false);
        }
      }
    }

    void run();

    return () => {
      ignore = true;
    };
  }, [caretakerId]);

  async function refreshReviews(): Promise<void> {
    if (!caretakerId) return;

    setReviewsLoading(true);

    try {
      const mappedReviews = await fetchReviewsByCaretakerId(caretakerId);
      setReviews(mappedReviews);
    } catch (error: unknown) {
      console.error(error);
    } finally {
      setReviewsLoading(false);
    }
  }

  async function handleSubmitReview(): Promise<void> {
    if (!caretakerId) return;

    if (!currentUser) {
      setReviewError("Трябва да си влязъл в профила си, за да оставиш отзив.");
      return;
    }

    if (currentUser.uid === caretakerId) {
      setReviewError("Не можеш да оставиш отзив на собствения си профил.");
      return;
    }

    const trimmedText = reviewText.trim();

    if (!trimmedText) {
      setReviewError("Моля, напиши текст за отзива.");
      return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError("Моля, избери оценка от 1 до 5 звезди.");
      return;
    }

    setReviewSubmitting(true);
    setReviewError(null);

    try {
      const authorName = await getAuthorName(currentUser);
      const reviewId = `${caretakerId}_${currentUser.uid}`;

      await setDoc(doc(db, "caretakerReviews", reviewId), {
        caretakerId,
        authorId: currentUser.uid,
        authorName,
        rating: reviewRating,
        text: trimmedText,
        createdAt: serverTimestamp(),
        createdAtMillis: Date.now(),
      });

      setReviewText("");
      setReviewRating(0);

      await refreshReviews();
    } catch (error: unknown) {
      console.error(error);
      setReviewError("Не успяхме да изпратим отзива. Опитай отново.");
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function handleDeleteReview(review: CaretakerReview): Promise<void> {
    if (!caretakerId || !currentUser) return;
    if (review.authorId !== currentUser.uid) return;

    setDeleteLoadingId(review.id);

    try {
      await deleteDoc(doc(db, "caretakerReviews", review.id));
      await refreshReviews();
    } catch (error: unknown) {
      console.error(error);
    } finally {
      setDeleteLoadingId(null);
    }
  }

  const subtitle = useMemo(() => {
    if (!caretaker) return "";
    return `📍 ${caretaker.city}${caretaker.area ? `, ${caretaker.area}` : ""}`;
  }, [caretaker]);

  const ownReview = useMemo(() => {
    if (!currentUser) return null;

    return (
      reviews.find((review) => review.authorId === currentUser.uid) ?? null
    );
  }, [reviews, currentUser]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return caretaker?.rating ?? 0;

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Number((total / reviews.length).toFixed(1));
  }, [reviews, caretaker]);

  const displayReviewsCount = useMemo(() => {
    if (reviews.length > 0) return reviews.length;
    return caretaker?.reviewsCount ?? 0;
  }, [reviews, caretaker]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:text-gray-100 dark:ring-white/10">
        Зареждане...
      </div>
    );
  }

  if (errText) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
        <div className="text-sm text-red-600 dark:text-red-400">{errText}</div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 cursor-pointer rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
          type="button"
        >
          Назад
        </button>
      </div>
    );
  }

  if (!caretaker) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Гледачът не е намерен.
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 cursor-pointer rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
          type="button"
        >
          Назад
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32">
      <section className="relative overflow-hidden rounded-2xl bg-orange-50 dark:bg-orange-500/10">
        <div className="h-56 w-full bg-gradient-to-b from-orange-100 to-orange-50 dark:from-orange-500/20 dark:to-orange-500/5" />

        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 ring-1 ring-black/5 backdrop-blur transition hover:bg-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 dark:bg-neutral-900/90 dark:ring-white/10 dark:hover:bg-neutral-900"
          aria-label="Назад"
          type="button"
        >
          ←
        </button>
      </section>

      <section className="relative z-10 mx-auto -mt-36 w-full max-w-5xl px-4">
        <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
          <div className="flex min-w-0 flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="relative">
                <div className="h-20 w-20 overflow-hidden rounded-2xl bg-gray-200 ring-1 ring-black/5 dark:bg-neutral-800 dark:ring-white/10">
                  {caretaker.avatarUrl ? (
                    <img
                      src={caretaker.avatarUrl}
                      alt={caretaker.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center break-all text-2xl font-bold leading-tight text-gray-700 dark:text-gray-200">
                      {caretaker.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                {caretaker.verified ? (
                  <span className="absolute -bottom-2 -right-2 grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-sm text-white ring-4 ring-white dark:ring-neutral-900">
                    ✓
                  </span>
                ) : null}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {caretaker.name}
                  </div>
                  {caretaker.verified ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20">
                      Верифициран
                    </span>
                  ) : null}
                </div>

                <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {subtitle}
                </div>

                <div className="mt-3 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                  {caretaker.pricePerDay}
                  <span className="ml-2 text-base font-medium text-gray-600 dark:text-gray-300">
                    €/ден
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full min-w-0 max-w-sm">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoChip label="Град" value={caretaker.city || "—"} />
                <InfoChip label="Квартал" value={caretaker.area || "Не е посочен"} />
                <InfoChip label="Телефон" value={caretaker.phone || "Не е посочен"} />

                <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4 dark:border-orange-500/20 dark:bg-orange-500/10">
                  <div className="text-xs font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-300">
                    Оценка
                  </div>

                  <div className="mt-2">
                    <Stars value={averageRating} />
                  </div>

                  <div className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {averageRating > 0 ? averageRating.toFixed(1) : "Няма оценка"}
                  </div>

                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    {displayReviewsCount} отзива
                  </div>
                </div>
              </div>
            </div>
          </div>

          {caretaker.services.length > 0 ? (
            <div className="mt-6">
              <div className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                Услуги
              </div>
              <div className="flex flex-wrap gap-2">
                {caretaker.services.map((service) => (
                  <span
                    key={service}
                    className="rounded-xl bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/20"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            <div className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
              За гледача
            </div>
            <div className="break-words whitespace-pre-wrap rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 text-sm leading-6 text-gray-700 dark:border-white/10 dark:bg-neutral-800 dark:text-gray-200">
              {caretaker.about || "Няма добавено описание."}
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Опит
            </div>
            <div className="max-h-40 overflow-y-auto break-words rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 text-sm leading-6 text-gray-700 dark:border-white/10 dark:bg-neutral-800 dark:text-gray-200">
              {caretaker.experience || "Няма добавен опит."}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Домашни любимци
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Любимците, за които се грижи {caretaker.name}
            </p>
          </div>

          {petsLoading ? (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-sm text-gray-700 dark:border-white/10 dark:bg-neutral-800 dark:text-gray-200">
              Зареждане на любимците...
            </div>
          ) : pets.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pets.map((pet) => (
                <CaretakerPetCard
                  key={pet.id}
                  pet={pet}
                  onOpen={() => navigate(`/pets/${pet.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-sm text-gray-700 dark:border-white/10 dark:bg-neutral-800 dark:text-gray-200">
              Този гледач все още няма добавени домашни любимци.
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Отзиви и оценка
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Сподели мнение за гледача и постави оценка със звезди.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-white/10 dark:bg-neutral-800">
            <div className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Твоята оценка
            </div>

            <RatingInput value={reviewRating} onChange={setReviewRating} />

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-semibold text-gray-900 dark:text-gray-100">
                Твоят отзив
              </span>
              <textarea
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                rows={4}
                placeholder="Напиши какво мислиш за гледача..."
                className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 dark:border-white/10 dark:bg-neutral-900 dark:text-gray-100 dark:placeholder:text-gray-500"
              />
            </label>

            {ownReview ? (
              <div className="mt-3 text-sm text-amber-700 dark:text-amber-300">
                Вече имаш изпратен отзив. При ново изпращане твоят стар отзив ще бъде заменен.
              </div>
            ) : null}

            {reviewError ? (
              <div className="mt-3 text-sm text-red-600 dark:text-red-400">
                {reviewError}
              </div>
            ) : null}

            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  void handleSubmitReview();
                }}
                disabled={reviewSubmitting}
                className="cursor-pointer rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
              >
                {reviewSubmitting ? "Изпращане..." : "Изпрати"}
              </button>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Всички отзиви
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {reviews.length} {reviews.length === 1 ? "отзив" : "отзива"}
              </div>
            </div>

            {reviewsLoading ? (
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-sm text-gray-700 dark:border-white/10 dark:bg-neutral-800 dark:text-gray-200">
                Зареждане на отзивите...
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => {
                  const isOwnReview = currentUser?.uid === review.authorId;
                  const isDeleting = deleteLoadingId === review.id;

                  return (
                    <article
                      key={review.id}
                      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-800"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                              {review.authorName}
                            </div>

                            {isOwnReview ? (
                              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/20">
                                Твоят отзив
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-1">
                            <Stars value={review.rating} />
                          </div>

                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {formatDateTime(review.createdAtMillis)}
                          </div>
                        </div>

                        {isOwnReview ? (
                          <button
                            type="button"
                            onClick={() => {
                              void handleDeleteReview(review);
                            }}
                            disabled={isDeleting}
                            className="cursor-pointer rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                          >
                            {isDeleting ? "Изтриване..." : "Изтрий"}
                          </button>
                        ) : null}
                      </div>

                      <div className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700 dark:text-gray-200">
                        {review.text}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-sm text-gray-700 dark:border-white/10 dark:bg-neutral-800 dark:text-gray-200">
                Все още няма отзиви за този гледач.
              </div>
            )}
          </div>
        </div>
      </section>

      <CaretakerBottomBar
        caretakerUid={caretaker.id}
        caretakerName={caretaker.name}
        pricePerDay={caretaker.pricePerDay}
      />
    </div>
  );
}