import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, where, type DocumentData } from "firebase/firestore";

import { CaretakerCard } from "../../components/caretakers/CaretakerCard";
import type { Caretaker, CaretakerService } from "../../types/caretaker";
import { db } from "../../services/firebase";
import { useAuth } from "../../app/providers/useAuth";

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, "bg"));
}

const PRICE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "Без ограничение" },
  { value: "20", label: "До 20 лв/ден" },
  { value: "30", label: "До 30 лв/ден" },
  { value: "50", label: "До 50 лв/ден" },
];

function toStringSafe(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function toNumberSafe(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}
function toServicesSafe(v: unknown): CaretakerService[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is CaretakerService => typeof x === "string") as CaretakerService[];
}

function mapUserToCaretaker(userId: string, data: DocumentData): Caretaker {
  const name = toStringSafe(data.name) || "Без име";
  const city = toStringSafe(data.city || data.region) || "—";
  const area = toStringSafe(data.area) || undefined;

  const about = toStringSafe(data.about);
  const experience = toStringSafe(data.experience);

  return {
    id: userId,
    name,
    city,
    area,
    avatarUrl: toStringSafe(data.avatarUrl) || "https://via.placeholder.com/96",
    verified: Boolean(data.verified),
    pricePerDay: toNumberSafe(data.pricePerDay),
    rating: toNumberSafe(data.rating),
    reviewsCount: toNumberSafe(data.reviewsCount),
    shortBio:
      toStringSafe(data.shortBio) ||
      (about ? about.slice(0, 90) + (about.length > 90 ? "…" : "") : "Гледач за кучета"),
    about: about || "",
    experience: experience || "",
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
  const [onlyVerified, setOnlyVerified] = useState(false);

  const [caretakers, setCaretakers] = useState<Caretaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // ✅ без setState в началото (за да мине eslint rule-а)
    const qRef = query(collection(db, "users"), where("role", "==", "caretaker"));

    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const list = snap.docs.map((d) =>
          mapUserToCaretaker(d.id, d.data() as DocumentData)
        );
        setCaretakers(list);
        setLoadError(null);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setCaretakers([]);
        setLoadError("Не успях да заредя гледачите от базата.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const cities = useMemo(
    () => uniqueSorted(caretakers.map((c) => c.city).filter(Boolean)),
    [caretakers]
  );

  const filtered = useMemo(() => {
    const t = qText.trim().toLowerCase();
    const max = maxPrice ? Number(maxPrice) : null;
    const uid = user?.uid ?? "";

    return caretakers
      .filter((c) => !uid || c.id !== uid) // ✅ махаме собствения акаунт
      .filter((c) => {
        const name = (c.name ?? "").toLowerCase();
        const cCity = (c.city ?? "").toLowerCase();

        const matchesQ = !t || name.includes(t) || cCity.includes(t);
        const matchesCity = !city || c.city === city;

        const price = Number(c.pricePerDay ?? 0);
        const matchesPrice = !max || price <= max;

        const matchesVerified = !onlyVerified || !!c.verified;

        return matchesQ && matchesCity && matchesPrice && matchesVerified;
      });
  }, [caretakers, qText, city, maxPrice, onlyVerified, user?.uid]);

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Намери гледач</h1>
        <p className="text-gray-600">Доверени професионалисти за твоето куче</p>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="relative">
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            🔎
          </div>
          <input
            value={qText}
            onChange={(e) => setQText(e.target.value)}
            placeholder="Търси по име или град..."
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm outline-none
                       focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none cursor-pointer
                         focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            >
              <option value="">Град</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200
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
        </div>

        {moreOpen && (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <div className="text-sm font-semibold text-gray-900 mb-2">
                  Максимална цена
                </div>
                <select
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none cursor-pointer
                             focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                >
                  {PRICE_OPTIONS.map((o) => (
                    <option key={o.label} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-900 mb-2">Опции</div>
                <label className="flex items-center gap-3 py-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyVerified}
                    onChange={(e) => setOnlyVerified(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                  />
                  Само верифицирани
                </label>
              </div>
            </div>
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
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {filtered.map((c) => (
              <CaretakerCard
                key={c.id}
                caretaker={c}
                onOpen={() => navigate(`/caretakers/${c.id}`)}
                onConnect={() => navigate(`/caretakers/${c.id}`)}
              />
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