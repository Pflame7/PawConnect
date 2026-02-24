import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, type DocumentData } from "firebase/firestore";

import { db } from "../../services/firebase";

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
  services: CaretakerService[];
};

function Stars({ value }: { value: number }) {
  const full = Math.floor(value);
  const stars = Array.from({ length: 5 }, (_, i) => (i < full ? "★" : "☆"));
  return <div className="text-amber-500 text-lg leading-none">{stars.join("")}</div>;
}

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

export default function CaretakerDetailsPage() {
  const nav = useNavigate();
  const { caretakerId } = useParams<{ caretakerId: string }>();

  const [c, setC] = useState<CaretakerView | null>(null);
  const [loading, setLoading] = useState(true);
  const [errText, setErrText] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function run() {
      if (!caretakerId) {
        if (!ignore) {
          setErrText("Невалиден идентификатор.");
          setLoading(false);
        }
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", caretakerId));
        if (!snap.exists()) {
          if (!ignore) {
            setC(null);
            setErrText(null);
            setLoading(false);
          }
          return;
        }

        const data = snap.data() as DocumentData;

        // safety: само caretaker профил трябва да е тук
        const role = toStringSafe(data.role);
        if (role !== "caretaker") {
          if (!ignore) {
            setC(null);
            setErrText("Този потребител не е гледач.");
            setLoading(false);
          }
          return;
        }

        const mapped: CaretakerView = {
          id: snap.id,
          name: toStringSafe(data.name) || "—",
          city: toStringSafe(data.city || data.region) || "—",
          area: toStringSafe(data.area) || undefined,

          avatarUrl: toStringSafe(data.avatarUrl) || undefined,

          verified: Boolean(data.verified),

          pricePerDay: toNumberSafe(data.pricePerDay),
          rating: toNumberSafe(data.rating),
          reviewsCount: toNumberSafe(data.reviewsCount),

          about: toStringSafe(data.about) || undefined,
          services: toServicesSafe(data.services),
        };

        if (!ignore) {
          setC(mapped);
          setErrText(null);
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (!ignore) {
          setErrText("Не успях да заредя профила от базата.");
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      ignore = true;
    };
  }, [caretakerId]);

  const subtitle = useMemo(() => {
    if (!c) return "";
    return `📍 ${c.city}${c.area ? `, ${c.area}` : ""}`;
  }, [c]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        Зареждане...
      </div>
    );
  }

  if (errText) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="text-sm text-red-600">{errText}</div>
        <button
          onClick={() => nav(-1)}
          className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
          type="button"
        >
          Назад
        </button>
      </div>
    );
  }

  if (!c) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="text-lg font-semibold">Гледачът не е намерен.</div>
        <button
          onClick={() => nav(-1)}
          className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
          type="button"
        >
          Назад
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-orange-50">
        <div className="h-56 w-full bg-gradient-to-b from-orange-100 to-orange-50" />

        <button
          onClick={() => nav(-1)}
          className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 ring-1 ring-black/5 backdrop-blur
                     cursor-pointer transition hover:bg-white active:scale-[0.98]
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
          aria-label="Назад"
          type="button"
        >
          ←
        </button>
      </section>

      {/* Card */}
      <section className="mx-auto -mt-36 w-full max-w-4xl px-4 relative z-10">
        <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="h-16 w-16 overflow-hidden rounded-2xl bg-gray-200 ring-1 ring-black/5">
                  {c.avatarUrl ? (
                    <img src={c.avatarUrl} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xl font-bold text-gray-700">
                      {c.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                {c.verified && (
                  <span className="absolute -bottom-2 -right-2 grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white text-sm ring-4 ring-white">
                    ✓
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-gray-900">{c.name}</div>
                  {c.verified && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
                      Верифициран
                    </span>
                  )}
                </div>

                <div className="mt-1 text-sm text-gray-600">{subtitle}</div>

                <div className="mt-2 flex items-center gap-3">
                  <Stars value={c.rating} />
                  <div className="text-sm text-gray-700">
                    <span className="font-semibold">{c.rating.toFixed(1)}</span>{" "}
                    ({c.reviewsCount} отзива)
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-extrabold text-gray-900">
                {c.pricePerDay}
                <span className="ml-2 text-base font-medium text-gray-600">лв/ден</span>
              </div>
            </div>
          </div>

          {c.services.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {c.services.map((s) => (
                <span
                  key={s}
                  className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5 text-sm text-gray-700 leading-6">
            {c.about || "Няма добавено описание."}
          </div>
        </div>
      </section>
    </div>
  );
}