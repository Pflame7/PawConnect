import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type FieldValue,
} from "firebase/firestore";

import { useAuth } from "../../app/providers/useAuth";
import { db } from "../../services/firebase";
import {
  uploadPetPhoto,
  uploadUserAvatar,
  deleteUserAvatar,
} from "../../services/uploads";

import type { AnimalType } from "../../constants/formOptions";
import EditProfileModal, { type EditableProfile } from "./EditProfileModal";
import AddPetModal, { type NewPetDraft } from "../../components/pets/AddPetModal";

type FirestoreTimestampLike = { toMillis?: () => number };

type PetDocRead = {
  ownerId?: string;
  animalType?: AnimalType;
  name?: string;
  breed?: string;
  city?: string;
  area?: string;
  ageYears?: number;
  ageMonths?: number;
  weightKg?: number;
  gender?: string;
  size?: string;
  traits?: string[];
  friendlyWithDogs?: boolean;
  goodWithKids?: boolean;
  about?: string;
  imageUrl?: string;
  imagePath?: string;
  createdAt?: FirestoreTimestampLike | null | undefined;
};

type PetView = {
  id: string;
  animalType?: AnimalType;
  name: string;
  breed: string;
  ageYears: number;
  ageMonths: number;
  weightKg: number;
  city: string;
  traits: string[];
  friendlyWithDogs: boolean;
  goodWithKids: boolean;
  photoUrl?: string;
  createdAtMs: number;
};

function cn(...classes: Array<string | false | undefined | null>): string {
  return classes.filter(Boolean).join(" ");
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function sizeBadgeFromWeight(weightKg: number): {
  label: string;
  tone: string;
} {
  if (!weightKg) {
    return {
      label: "—",
      tone: "bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-300",
    };
  }

  if (weightKg <= 10) {
    return {
      label: "Малко",
      tone:
        "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
    };
  }

  if (weightKg <= 25) {
    return {
      label: "Средно",
      tone:
        "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
    };
  }

  if (weightKg <= 45) {
    return {
      label: "Голямо",
      tone:
        "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
    };
  }

  return {
    label: "Гигант",
    tone:
      "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  };
}

function toMillisSafe(value: unknown): number {
  if (!value || typeof value !== "object") return 0;

  const maybe = value as FirestoreTimestampLike;
  if (typeof maybe.toMillis === "function") return maybe.toMillis();

  return 0;
}

function petEmojiFromAnimalType(animalType?: AnimalType): string {
  if (animalType === "Котка") return "🐱";
  if (animalType === "Папагал") return "🦜";
  return "🐶";
}

function PetCard({ pet, onOpen }: { pet: PetView; onOpen: () => void }) {
  const ageText = useMemo(() => {
    if (!pet.ageYears && !pet.ageMonths) return "";
    if (pet.ageYears && pet.ageMonths) {
      return `${pet.ageYears} години и ${pet.ageMonths} мес.`;
    }
    if (pet.ageYears) return `${pet.ageYears} години`;
    return `${pet.ageMonths} мес.`;
  }, [pet.ageYears, pet.ageMonths]);

  const sizeBadge = sizeBadgeFromWeight(pet.weightKg);
  const petEmoji = petEmojiFromAnimalType(pet.animalType);

  return (
    <article
      onClick={onOpen}
      className="cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-[1px] hover:shadow-md active:scale-[0.995] dark:bg-neutral-900 dark:ring-white/10"
    >
      <div className="relative h-56 w-full bg-gray-100 dark:bg-neutral-800">
        {pet.photoUrl ? (
          <img
            src={pet.photoUrl}
            alt={pet.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-5xl">
            {petEmoji}
          </div>
        )}

        {pet.friendlyWithDogs || pet.goodWithKids ? (
          <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-black/5 backdrop-blur dark:bg-neutral-900/90 dark:text-emerald-300 dark:ring-white/10">
            🐾 Дружелюбно
          </div>
        ) : null}

        <div className="absolute bottom-3 left-3 text-white drop-shadow">
          <div className="text-xl font-extrabold">{pet.name}</div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400">
              {pet.animalType || "Любимец"}
            </div>

            <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
              {pet.breed}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-300">
              {ageText ? <span>{ageText}</span> : null}
              {pet.weightKg > 0 ? <span>{pet.weightKg} кг</span> : null}
            </div>

            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              📍 {pet.city}
            </div>
          </div>

          <span
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
              sizeBadge.tone,
            )}
          >
            {sizeBadge.label}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {pet.traits.slice(0, 2).map((trait) => (
            <span
              key={trait}
              className="rounded-full bg-gray-50 px-3 py-1 text-[11px] font-semibold text-gray-700 ring-1 ring-black/5 dark:bg-neutral-800 dark:text-gray-300 dark:ring-white/10"
            >
              {trait}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();

  const { user, profile } = useAuth() as {
    user: { uid: string; email?: string | null } | null;
    profile:
      | {
          uid?: string;
          email?: string;
          name?: string;
          role?: string;
          city?: string;
          area?: string;
          about?: string;
          phone?: string;
          experience?: string;
          pricePerDay?: number;
          services?: string[];
          avatarUrl?: string;
          avatarPath?: string;
        }
      | null;
  };

  const currentAvatarUrl = profile?.avatarUrl ?? "";
  const currentAvatarPath = profile?.avatarPath ?? "";

  const [isAddPetOpen, setIsAddPetOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editKey, setEditKey] = useState(0);

  const viewProfile: EditableProfile = useMemo(
    () => ({
      name: profile?.name ?? "",
      city: profile?.city ?? "",
      area: profile?.area ?? "",
      role: (profile?.role as "owner" | "caretaker") ?? "caretaker",
      about: profile?.about ?? "",
      phone: profile?.phone ?? "",
      experience: profile?.experience ?? "",
      pricePerDay: Number(profile?.pricePerDay ?? 0),
      services: Array.isArray(profile?.services) ? profile.services : [],
    }),
    [profile],
  );

  const [draftProfile, setDraftProfile] = useState<EditableProfile>(viewProfile);

  const openEdit = (): void => {
    setDraftProfile(viewProfile);
    setEditKey((value) => value + 1);
    setEditing(true);
  };

  const openSettings = (): void => {
    navigate("/settings");
  };

  const [pets, setPets] = useState<PetView[]>([]);
  const [petsLoaded, setPetsLoaded] = useState(false);
  const [petsError, setPetsError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const qRef = query(collection(db, "pets"), where("ownerId", "==", user.uid));

    const unsubscribe = onSnapshot(
      qRef,
      (snapshot) => {
        const list: PetView[] = snapshot.docs
          .map((docItem) => {
            const data = docItem.data() as PetDocRead;

            return {
              id: docItem.id,
              animalType: data.animalType,
              name: data.name ?? "",
              breed: data.breed ?? "",
              ageYears: Number(data.ageYears ?? 0),
              ageMonths: Number(data.ageMonths ?? 0),
              weightKg: Number(data.weightKg ?? 0),
              city: data.city ?? "",
              traits: Array.isArray(data.traits) ? data.traits : [],
              friendlyWithDogs: Boolean(data.friendlyWithDogs),
              goodWithKids: Boolean(data.goodWithKids),
              photoUrl: data.imageUrl,
              createdAtMs: toMillisSafe(data.createdAt),
            };
          })
          .sort((a, b) => b.createdAtMs - a.createdAtMs);

        setPets(list);
        setPetsError(null);
        setPetsLoaded(true);
      },
      (error: unknown) => {
        console.error(error);
        setPets([]);
        setPetsError("Не успях да заредя любимците.");
        setPetsLoaded(true);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const displayRole = viewProfile.role === "owner" ? "Стопанин" : "Гледач";

  async function handleSaveProfile(
    next: EditableProfile,
    avatarFile: File | null,
  ): Promise<void> {
    if (!user?.uid) return;

    try {
      const ref = doc(db, "users", user.uid);

      let avatarUrl = currentAvatarUrl;
      let avatarPath = currentAvatarPath;

      if (avatarFile) {
        if (avatarPath) {
          try {
            await deleteUserAvatar(avatarPath);
          } catch (error: unknown) {
            console.warn("Avatar delete failed:", error);
          }
        }

        const uploadedAvatar = await uploadUserAvatar(avatarFile, user.uid);
        avatarUrl = uploadedAvatar.publicUrl;
        avatarPath = uploadedAvatar.storagePath;
      }

      await setDoc(
        ref,
        {
          uid: user.uid,
          email: profile?.email ?? user.email ?? "",
          name: next.name,
          city: next.city,
          area: next.area,
          role: next.role,
          about: next.about,
          phone: next.phone,
          experience: next.experience,
          pricePerDay: Number(next.pricePerDay ?? 0),
          services: Array.isArray(next.services) ? next.services : [],
          avatarUrl,
          avatarPath,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setEditing(false);
    } catch (error: unknown) {
      console.error(error);
      alert("Не успях да запазя профила. Провери конзолата.");
    }
  }

  async function handleCreatePet(pet: NewPetDraft): Promise<void> {
    if (!user?.uid) {
      setIsAddPetOpen(false);
      return;
    }

    try {
      let imageUrl = "";
      let imagePath = "";

      if (pet.photoFile) {
        const uploadedPetPhoto = await uploadPetPhoto(pet.photoFile, user.uid);
        imageUrl = uploadedPetPhoto.publicUrl;
        imagePath = uploadedPetPhoto.storagePath;
      }

      if (!pet.animalType) {
        alert("Моля, избери животно.");
        return;
      }

      const trimmedName = pet.name.trim();
      const trimmedArea = pet.area.trim();
      const trimmedDescription = pet.description.trim();

      const payload: Record<string, unknown> = {
        ownerId: user.uid,
        animalType: pet.animalType,
        name: trimmedName,
        breed: pet.breed,
        city: pet.city,
        ageYears: Number(pet.ageYears ?? 0),
        ageMonths: Number(pet.ageMonths ?? 0),
        weightKg: Number(pet.weightKg ?? 0),
        traits: Array.isArray(pet.traits) ? pet.traits : [],
        friendlyWithDogs: Boolean(pet.friendlyWithDogs),
        goodWithKids: Boolean(pet.goodWithKids),
        createdAt: serverTimestamp() as FieldValue,
      };

      if (trimmedArea) {
        payload.area = trimmedArea;
      }

      if (pet.gender) {
        payload.gender = pet.gender;
      }

      if (pet.size) {
        payload.size = pet.size;
      }

      if (trimmedDescription) {
        payload.about = trimmedDescription;
      }

      if (imageUrl) {
        payload.imageUrl = imageUrl;
      }

      if (imagePath) {
        payload.imagePath = imagePath;
      }

      await addDoc(collection(db, "pets"), payload);
      setIsAddPetOpen(false);
    } catch (error: unknown) {
      console.error(error);
      alert("Не успях да добавя любимеца. Провери конзолата.");
    }
  }

  const showPetsLoading = user?.uid != null && !petsLoaded;

  return (
    <div className="space-y-8 pb-16">
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
        <div className="h-24 bg-orange-100 dark:bg-orange-500/15" />

        <div className="px-4 pb-6 pt-6 sm:px-6">
          <div className="-mt-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="relative shrink-0">
                  <div className="h-20 w-20 overflow-hidden rounded-2xl bg-gray-200 ring-4 ring-white shadow-sm dark:bg-neutral-800 dark:ring-neutral-900">
                    {currentAvatarUrl ? (
                      <img
                        src={currentAvatarUrl}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-xl font-bold text-gray-700 dark:text-gray-200">
                        {initials(viewProfile.name || " ")}
                      </div>
                    )}
                  </div>

                  <div className="absolute -bottom-2 -right-2 grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white ring-4 ring-white dark:ring-neutral-900">
                    ✓
                  </div>
                </div>

                <div className="min-w-0 flex-1 pt-1 sm:pt-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="max-w-full whitespace-normal break-all text-2xl font-bold leading-tight text-gray-900 dark:text-gray-100">
                      {viewProfile.name || "—"}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <span>📍 {viewProfile.city || "—"}</span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20">
                      {displayRole}
                    </span>
                  </div>
                </div>
              </div>

              {viewProfile.about ? (
                <div className="mt-5 break-words whitespace-pre-line text-sm text-gray-700 dark:text-gray-200">
                  {viewProfile.about}
                </div>
              ) : null}

              <div className="mt-5 h-px w-full bg-gray-100 dark:bg-white/10" />

              {viewProfile.role === "caretaker" ? (
                <>
                  <div className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                    {viewProfile.pricePerDay}
                    <span className="ml-2 text-base font-medium text-gray-600 dark:text-gray-300">
                      €/ден
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {viewProfile.services.map((service) => (
                      <span
                        key={service}
                        className="rounded-lg bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/20"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:flex-col lg:items-end">
              <button
                type="button"
                onClick={openEdit}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 dark:border-white/10 dark:bg-neutral-900 dark:text-gray-100 dark:hover:bg-white/5 sm:w-auto"
              >
                <span aria-hidden="true">✏️</span>
                Редактирай
              </button>

              <button
                type="button"
                onClick={openSettings}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 dark:border-white/10 dark:bg-neutral-900 dark:text-gray-100 dark:hover:bg-white/5 sm:w-auto"
              >
                <span aria-hidden="true">⚙️</span>
                Настройки
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Моите любимци
          </h2>

          <button
            type="button"
            onClick={() => setIsAddPetOpen(true)}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 dark:border-white/10 dark:bg-neutral-900 dark:text-gray-100 dark:hover:bg-white/5 sm:w-auto"
          >
            🐾 Добави любимец
          </button>
        </div>

        {petsError ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-red-600 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:text-red-400 dark:ring-white/10">
            {petsError}
          </div>
        ) : null}

        {showPetsLoading ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-gray-700 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:text-gray-200 dark:ring-white/10">
            Зареждане...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                onOpen={() => navigate(`/pets/${pet.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      <EditProfileModal
        key={editKey}
        open={editing}
        initial={draftProfile}
        initialAvatarUrl={currentAvatarUrl}
        onClose={() => setEditing(false)}
        onSave={handleSaveProfile}
      />

      <AddPetModal
        open={isAddPetOpen}
        onClose={() => setIsAddPetOpen(false)}
        onCreate={handleCreatePet}
      />
    </div>
  );
}