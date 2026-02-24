import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteDoc, doc, getDoc, type DocumentData } from "firebase/firestore";

import { db } from "../../services/firebase";
import { useAuth } from "../../app/providers/useAuth";
import { deletePetPhoto } from "../../services/uploads";
import { sizeGroupFromWeight } from "./pets.utils";

type PetGender = "Мъжко" | "Женско";

type PetDetails = {
  id: string;
  ownerId: string;

  name: string;
  breed: string;

  city: string;
  area?: string;

  ageYears: number;
  ageMonths?: number;

  weightKg: number;

  imageUrl: string;
  imagePath?: string;

  gender?: PetGender;

  friendlyWithDogs?: boolean;
  goodWithKids?: boolean;

  traits?: string[];
  about?: string;

  ownerName?: string;
  ownerCity?: string;
  ownerAvatarUrl?: string;
};

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

function toPetGender(v: unknown): PetGender | undefined {
  if (typeof v !== "string") return undefined;
  const normalized = v.trim().toLowerCase();
  if (normalized === "мъжко" || normalized === "male") return "Мъжко";
  if (normalized === "женско" || normalized === "female") return "Женско";
  return undefined;
}

function ConfirmDeleteModal({
  open,
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="absolute inset-0 grid place-items-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/10">
          <div className="text-lg font-bold text-gray-900">
            Изтриване на домашен любимец
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Наистина ли искаш да изтриеш твоя домашен любимец? Това действие не може да бъде върнато.
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900
                         shadow-sm transition hover:bg-gray-50 active:scale-[0.99]
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
              disabled={loading}
            >
              Отказ
            </button>

            <button
              type="button"
              onClick={onConfirm}
              className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm
                         transition hover:bg-red-700 active:scale-[0.99]
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
              disabled={loading}
            >
              {loading ? "Изтриване..." : "Изтрий"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PetDetailsPage() {
  const nav = useNavigate();
  const { petId } = useParams<{ petId: string }>();
  const { user } = useAuth();

  const [pet, setPet] = useState<PetDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [errText, setErrText] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function run() {
      if (!petId) {
        if (!ignore) {
          setErrText("Невалиден идентификатор.");
          setLoading(false);
        }
        return;
      }

      try {
        const snap = await getDoc(doc(db, "pets", petId));
        if (!snap.exists()) {
          if (!ignore) {
            setPet(null);
            setErrText(null);
            setLoading(false);
          }
          return;
        }

        const data = snap.data() as DocumentData;

        const mapped: PetDetails = {
          id: snap.id,
          ownerId: toStringSafe(data.ownerId),

          name: toStringSafe(data.name),
          breed: toStringSafe(data.breed),

          city: toStringSafe(data.city),
          area: toStringSafe(data.area) || undefined,

          ageYears: toNumberSafe(data.ageYears),
          ageMonths: typeof data.ageMonths === "number" ? toNumberSafe(data.ageMonths) : undefined,

          weightKg: toNumberSafe(data.weightKg),

          imageUrl: toStringSafe(data.imageUrl) || "",
          imagePath: typeof data.imagePath === "string" ? data.imagePath : undefined,

          gender: toPetGender(data.gender),

          friendlyWithDogs: Boolean(data.friendlyWithDogs),
          goodWithKids: Boolean(data.goodWithKids),

          traits: Array.isArray(data.traits) ? toStringArraySafe(data.traits) : undefined,
          about: toStringSafe(data.about) || undefined,

          ownerName: typeof data.ownerName === "string" ? data.ownerName : undefined,
          ownerCity: typeof data.ownerCity === "string" ? data.ownerCity : undefined,
          ownerAvatarUrl: typeof data.ownerAvatarUrl === "string" ? data.ownerAvatarUrl : undefined,
        };

        if (!ignore) {
          setPet(mapped);
          setErrText(null);
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (!ignore) {
          setErrText("Не успях да заредя кучето от базата.");
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      ignore = true;
    };
  }, [petId]);

  const isMyPet = useMemo(() => {
    if (!pet || !user?.uid) return false;
    return pet.ownerId === user.uid;
  }, [pet, user?.uid]);

  async function handleDelete() {
    if (!petId || !pet || !isMyPet) return;

    setDeleting(true);
    try {
      if (pet.imagePath) {
        await deletePetPhoto(pet.imagePath);
      }

      await deleteDoc(doc(db, "pets", petId));

      setConfirmOpen(false);
      nav("/profile");
    } catch (e) {
      console.error(e);
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  }

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
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
          type="button"
        >
          Назад
        </button>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="text-lg font-semibold">Кучето не е намерено.</div>
        <button
          onClick={() => nav(-1)}
          className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
          type="button"
        >
          Назад
        </button>
      </div>
    );
  }

  const group = sizeGroupFromWeight(pet.weightKg);
  const traits = pet.traits ?? [];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-gray-100">
        <div className="h-[360px] w-full md:h-[420px]">
          {pet.imageUrl ? (
            <img src={pet.imageUrl} alt={pet.name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-6xl">🐶</div>
          )}
        </div>

        <button
          onClick={() => nav(-1)}
          className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 ring-1 ring-black/5 backdrop-blur
                     cursor-pointer transition hover:bg-white active:scale-[0.98]
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
          aria-label="Назад"
          type="button"
        >
          ←
        </button>

        <div className="absolute inset-x-0 -bottom-10 px-4">
          <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-3xl font-bold text-gray-900">{pet.name}</div>
                <div className="mt-1 text-gray-700">{pet.breed}</div>
                <div className="mt-2 text-sm text-gray-600">
                  📍 {pet.city}
                  {pet.area ? `, ${pet.area}` : ""}
                </div>
              </div>

              {pet.gender && (
                <span className="rounded-lg bg-pink-50 px-3 py-1 text-sm font-semibold text-pink-700 ring-1 ring-pink-100">
                  {pet.gender}
                </span>
              )}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-gray-50 p-4 text-center ring-1 ring-black/5">
                <div className="text-sm font-semibold text-gray-900">
                  {pet.ageYears} год.
                  {typeof pet.ageMonths === "number" ? ` ${pet.ageMonths} мес.` : ""}
                </div>
                <div className="text-xs text-gray-500">Възраст</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 text-center ring-1 ring-black/5">
                <div className="text-sm font-semibold text-gray-900">{pet.weightKg} кг</div>
                <div className="text-xs text-gray-500">Тегло</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 text-center ring-1 ring-black/5">
                <div className="text-sm font-semibold text-gray-900">{group}</div>
                <div className="text-xs text-gray-500">Размер</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="h-10" />

      <section className="mx-auto max-w-4xl space-y-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        {traits.length > 0 && (
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-3">Характер</div>
            <div className="flex flex-wrap gap-2">
              {traits.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-100"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {pet.friendlyWithDogs && (
            <div className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100">
              ✅ Дружелюбно с други кучета
            </div>
          )}
          {pet.goodWithKids && (
            <div className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100">
              ✅ Подходящо за деца
            </div>
          )}
        </div>

        <div>
          <div className="text-sm font-semibold text-gray-900 mb-2">За {pet.name}</div>
          <p className="text-sm text-gray-700 leading-6">{pet.about ?? "Няма добавено описание."}</p>
        </div>

        <hr className="border-gray-100" />

        <div className="flex justify-end">
          {isMyPet ? (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm
                         cursor-pointer transition hover:bg-red-700 active:scale-[0.99]
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
            >
              🗑️ Изтрий
            </button>
          ) : (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm
                         cursor-pointer transition hover:bg-orange-600 active:scale-[0.99]
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
            >
              💬 Свържи се
            </button>
          )}
        </div>
      </section>

      <ConfirmDeleteModal
        open={confirmOpen}
        loading={deleting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}