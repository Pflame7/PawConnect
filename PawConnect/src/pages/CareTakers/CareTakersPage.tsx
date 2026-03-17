import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import SearchableSelect from "../../components/ui/SearchableSelect";
import { CaretakerCard } from "../../components/caretakers/CaretakerCard";
import type { Caretaker, CaretakerService } from "../../types/caretaker";
import { db } from "../../services/firebase";
import { useAuth } from "../../app/providers/useAuth";

type ReviewAggregate = {
  rating: number;
  reviewsCount: number;
};

type CaretakerReviewDoc = {
  caretakerId: string;
  rating: number;
  text: string;
};

type FirestoreDocData = Record<string, unknown>;

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, "bg"));
}

const PRICE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "Без ограничение" },
  { value: "15", label: "До 15 €/ден" },
  { value: "20", label: "До 20 €/ден" },
  { value: "30", label: "До 30 €/ден" },
  { value: "40", label: "До 40 €/ден" },
  { value: "50", label: "До 50 €/ден" },
];

function toStringSafe(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toNumberSafe(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function toBooleanSafe(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function toServicesSafe(value: unknown): CaretakerService[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is CaretakerService => typeof item === "string");
}

function toReviewDocSafe(data: FirestoreDocData): CaretakerReviewDoc | null {
  const caretakerId = toStringSafe(data.caretakerId);
  const text = toStringSafe(data.text);
  const ratingRaw = toNumberSafe(data.rating);

  if (!caretakerId || !text.trim()) return null;
  if (ratingRaw < 1 || ratingRaw > 5) return null;

  return {
    caretakerId,
    text,
    rating: ratingRaw,
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

function mapUserToCaretaker(
  userId: string,
  data: FirestoreDocData,
  aggregate?: ReviewAggregate,
): Caretaker {
  const name = toStringSafe(data.name) || "Без име";
  const city = toStringSafe(data.city) || toStringSafe(data.region) || "—";
  const area = toStringSafe(data.area) || undefined;

  const about = toStringSafe(data.about);
  const experience = toStringSafe(data.experience);

  return {
    id: userId,
    name,
    city,
    area,
    avatarUrl: toStringSafe(data.avatarUrl) || "https://via.placeholder.com/96",
    verified: toBooleanSafe(data.verified),
    pricePerDay: toNumberSafe(data.pricePerDay),
    rating: aggregate?.rating ?? 0,
    reviewsCount: aggregate?.reviewsCount ?? 0,
    shortBio:
      toStringSafe(data.shortBio) ||
      (about
        ? `${about.slice(0, 90)}${about.length > 90 ? "…" : ""}`
        : "Гледач за домашни любимци"),
    about,
    experience,
    services: toServicesSafe(data.services),
    reviews: undefined,
  };
}

export default function CareTakersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [qText, setQText] = useState("");
  const [city, setCity] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState("");

  const [caretakers, setCaretakers] = useState<Caretaker[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let userDocs: Array<{ id: string; data: FirestoreDocData }> = [];
    let reviewAggregates: Record<string, ReviewAggregate> = {};

    function syncCaretakers(): void {
      const nextCaretakers = userDocs.map((userDoc) =>
        mapUserToCaretaker(
          userDoc.id,
          userDoc.data,
          reviewAggregates[userDoc.id],
        ),
      );

      setCaretakers(nextCaretakers);
    }

    const usersQuery = query(
      collection(db, "users"),
      where("role", "==", "caretaker"),
    );

    const unsubscribeUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        userDocs = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          data: docItem.data() as FirestoreDocData,
        }));

        syncCaretakers();
        setLoadError(null);
        setLoadingUsers(false);
      },
      (error: unknown) => {
        console.error(error);
        setCaretakers([]);
        setLoadError("Не успях да заредя гледачите от базата.");
        setLoadingUsers(false);
      },
    );

    const unsubscribeReviews = onSnapshot(
      collection(db, "caretakerReviews"),
      (snapshot) => {
        const reviewDocs = snapshot.docs
          .map((docItem) => toReviewDocSafe(docItem.data() as FirestoreDocData))
          .filter((review): review is CaretakerReviewDoc => review !== null);

        reviewAggregates = buildReviewAggregates(reviewDocs);

        syncCaretakers();
        setLoadError(null);
        setLoadingReviews(false);
      },
      (error: unknown) => {
        console.error(error);
        reviewAggregates = {};
        syncCaretakers();
        setLoadingReviews(false);
      },
    );

    return () => {
      unsubscribeUsers();
      unsubscribeReviews();
    };
  }, []);

  const loading = loadingUsers || loadingReviews;

  const cities = useMemo(
    () =>
      uniqueSorted(
        caretakers.map((caretaker) => caretaker.city).filter(Boolean),
      ),
    [caretakers],
  );

  const filtered = useMemo(() => {
    const searchText = qText.trim().toLowerCase();
    const selectedMaxPrice = maxPrice ? Number(maxPrice) : null;
    const currentUid = user?.uid ?? "";

    return caretakers
      .filter((caretaker) => !currentUid || caretaker.id !== currentUid)
      .filter((caretaker) => {
        const caretakerName = caretaker.name.toLowerCase();
        const caretakerCity = caretaker.city.toLowerCase();
        const caretakerArea = (caretaker.area ?? "").toLowerCase();

        const matchesSearch =
          !searchText ||
          caretakerName.includes(searchText) ||
          caretakerCity.includes(searchText) ||
          caretakerArea.includes(searchText);

        const matchesCity = !city || caretaker.city === city;

        const price = caretaker.pricePerDay;
        const matchesPrice = selectedMaxPrice === null || price <= selectedMaxPrice;

        return matchesSearch && matchesCity && matchesPrice;
      });
  }, [caretakers, qText, city, maxPrice, user?.uid]);

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Намери гледач
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Доверени професионалисти за твоя домашен любимец
        </p>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
        <div className="relative">
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-orange-400">
            🔎
          </div>

          <input
            value={qText}
            onChange={(event) => setQText(event.target.value)}
            placeholder="Търси по име или град..."
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-start">
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <SearchableSelect
              placeholder="Град"
              value={city}
              options={cities}
              onChange={(selectedCity) => setCity(selectedCity)}
              emptyMessage="Няма намерени градове"
            />

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
        </div>

        {moreOpen ? (
          <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50/40 p-5 dark:border-orange-500/20 dark:bg-orange-500/5">
            <div>
              <div className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                Максимална цена
              </div>

              <SearchableSelect
                placeholder="Максимална цена"
                value={maxPrice}
                options={PRICE_OPTIONS}
                onChange={(value) => setMaxPrice(value)}
                emptyMessage="Няма намерени опции"
              />
            </div>
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
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {filtered.map((caretaker) => (
              <CaretakerCard
                key={caretaker.id}
                caretaker={caretaker}
                onOpen={() => navigate(`/caretakers/${caretaker.id}`)}
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