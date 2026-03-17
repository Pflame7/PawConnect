import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteDoc, doc, getDoc, type DocumentData } from "firebase/firestore";

import { db } from "../../services/firebase";
import { useAuth } from "../../app/providers/useAuth";
import { deletePetPhoto } from "../../services/uploads";
import { sizeGroupFromWeight } from "./pets.utils";
import { ConnectButton } from "../../components/chat/ConnectButton";

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

function toPetGender(value: unknown): PetGender | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
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
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/10 dark:bg-neutral-900 dark:ring-white/10">
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Изтриване на домашен любимец
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Наистина ли искаш да изтриеш твоя домашен любимец? Това действие не
            може да бъде върнато.
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:hover:bg-white/5"
              disabled={loading}
            >
              Отказ
            </button>

            <button
              type="button"
              onClick={onConfirm}
              className="cursor-pointer rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
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
  const navigate = useNavigate();
  const { petId } = useParams<{ petId: string }>();
  const { user } = useAuth();

  const [pet, setPet] = useState<PetDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [errText, setErrText] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function run(): Promise<void> {
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
          ageMonths:
            typeof data.ageMonths === "number"
              ? toNumberSafe(data.ageMonths)
              : undefined,
          weightKg: toNumberSafe(data.weightKg),
          imageUrl: toStringSafe(data.imageUrl) || "",
          imagePath:
            typeof data.imagePath === "string" ? data.imagePath : undefined,
          gender: toPetGender(data.gender),
          friendlyWithDogs: Boolean(data.friendlyWithDogs),
          goodWithKids: Boolean(data.goodWithKids),
          traits: Array.isArray(data.traits)
            ? toStringArraySafe(data.traits)
            : undefined,
          about: toStringSafe(data.about) || undefined,
          ownerName:
            typeof data.ownerName === "string" ? data.ownerName : undefined,
          ownerCity:
            typeof data.ownerCity === "string" ? data.ownerCity : undefined,
          ownerAvatarUrl:
            typeof data.ownerAvatarUrl === "string"
              ? data.ownerAvatarUrl
              : undefined,
        };

        if (!ignore) {
          setPet(mapped);
          setErrText(null);
          setLoading(false);
        }
      } catch (error: unknown) {
        console.error(error);
        if (!ignore) {
          setErrText("Не успях да заредя любимеца от базата.");
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      ignore = true;
    };
  }, [petId]);

  const isMyPet = useMemo(() => {
    if (!pet || !user?.uid) return false;
    return pet.ownerId === user.uid;
  }, [pet, user?.uid]);

  async function handleDelete(): Promise<void> {
    if (!petId || !pet || !isMyPet) return;

    setDeleting(true);
    try {
      if (pet.imagePath) {
        await deletePetPhoto(pet.imagePath);
      }

      await deleteDoc(doc(db, "pets", petId));

      setConfirmOpen(false);
      navigate("/profile");
    } catch (error: unknown) {
      console.error(error);
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  }

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
          className="mt-4 cursor-pointer rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 dark:bg-neutral-800 dark:text-gray-100"
          type="button"
        >
          Назад
        </button>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Любимеца не е намерен.
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 cursor-pointer rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 dark:bg-neutral-800 dark:text-gray-100"
          type="button"
        >
          Назад
        </button>
      </div>
    );
  }

  const group = sizeGroupFromWeight(pet.weightKg);
  const traits = pet.traits ?? [];
  const canConnect = Boolean(pet.ownerId) && pet.ownerId !== (user?.uid ?? "");

  return (
    <div className="space-y-6">
      <section className="relative bg-gray-100 dark:bg-neutral-800">
        <div className="h-[360px] w-full overflow-hidden rounded-2xl md:h-[420px]">
          {pet.imageUrl ? (
            <img
              src={pet.imageUrl}
              alt={pet.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-6xl">
              🐶
            </div>
          )}
        </div>

        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-white/90 ring-1 ring-black/5 backdrop-blur transition hover:bg-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 dark:bg-neutral-900/90 dark:ring-white/10 dark:hover:bg-neutral-900"
          aria-label="Назад"
          type="button"
        >
          ←
        </button>

        <div className="absolute inset-x-0 -bottom-10 px-4">
          <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {pet.name}
                </div>
                <div className="mt-1 text-gray-700 dark:text-gray-300">
                  {pet.breed}
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  📍 {pet.city}
                  {pet.area ? `, ${pet.area}` : ""}
                </div>
              </div>

              {pet.gender ? (
                <span className="rounded-lg bg-pink-50 px-3 py-1 text-sm font-semibold text-pink-700 ring-1 ring-pink-100 dark:bg-pink-500/15 dark:text-pink-300 dark:ring-pink-500/20">
                  {pet.gender}
                </span>
              ) : null}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-gray-50 p-4 text-center ring-1 ring-black/5 dark:bg-neutral-800 dark:ring-white/10">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {pet.ageYears} год.
                  {typeof pet.ageMonths === "number"
                    ? ` ${pet.ageMonths} мес.`
                    : ""}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Възраст
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-4 text-center ring-1 ring-black/5 dark:bg-neutral-800 dark:ring-white/10">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {pet.weightKg} кг
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Тегло
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-4 text-center ring-1 ring-black/5 dark:bg-neutral-800 dark:ring-white/10">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {group}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Размер
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="h-10" />

      <section className="mx-auto max-w-4xl space-y-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
        {traits.length > 0 ? (
          <div>
            <div className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Характер
            </div>
            <div className="flex flex-wrap gap-2">
              {traits.map((trait) => (
                <span
                  key={trait}
                  className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/20"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          {pet.friendlyWithDogs ? (
            <div className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20">
              ✅ Дружелюбно с други кучета
            </div>
          ) : null}

          {pet.goodWithKids ? (
            <div className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20">
              ✅ Подходящо за деца
            </div>
          ) : null}
        </div>

        <div>
          <div className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            За {pet.name}
          </div>
          <p className="break-words whitespace-pre-line text-sm leading-6 text-gray-700 dark:text-gray-200">
            {pet.about ?? "Няма добавено описание."}
          </p>
        </div>

        <hr className="border-gray-100 dark:border-white/10" />

        <div className="flex justify-end">
          {isMyPet ? (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
            >
              🗑️ Изтрий
            </button>
          ) : canConnect ? (
            <ConnectButton
              otherUid={pet.ownerId}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
              label="Свържи се"
            />
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 dark:bg-neutral-800 dark:text-gray-400"
              aria-label="Не можеш да се свържеш със себе си"
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
        onConfirm={() => {
          void handleDelete();
        }}
      />
    </div>
  );
}