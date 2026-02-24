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
  type DocumentData,
} from "firebase/firestore";

import { useAuth } from "../../app/providers/useAuth";
import { db } from "../../services/firebase";
import { uploadPetPhoto, uploadUserAvatar, deleteUserAvatar } from "../../services/uploads";

import EditProfileModal, { type EditableProfile } from "./EditProfileModal";
import AddPetModal, { type NewPetDraft } from "../../components/pets/AddPetModal";

type FirestoreTimestampLike = { toMillis?: () => number };

type PetDocRead = {
  ownerId?: string;

  name?: string;
  breed?: string;
  city?: string;
  area?: string;

  ageYears?: number;
  ageMonths?: number;
  weightKg?: number;

  traits?: string[];
  friendlyWithDogs?: boolean;
  goodWithKids?: boolean;
  description?: string;

  imageUrl?: string;
  imagePath?: string;

  createdAt?: FirestoreTimestampLike | null | undefined;
};

type PetDocWrite = {
  ownerId: string;

  name: string;
  breed: string;
  city: string;
  area?: string;

  ageYears: number;
  ageMonths: number;
  weightKg: number;

  traits: string[];
  friendlyWithDogs: boolean;
  goodWithKids: boolean;
  description?: string;

  imageUrl?: string;
  imagePath?: string;

  createdAt: FieldValue;
};

type PetView = {
  id: string;
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

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function sizeBadgeFromWeight(weightKg: number) {
  if (!weightKg) return { label: "—", tone: "bg-gray-100 text-gray-700" };
  if (weightKg <= 10)
    return { label: "Малко", tone: "bg-orange-50 text-orange-700" };
  if (weightKg <= 25)
    return { label: "Средно", tone: "bg-orange-50 text-orange-700" };
  if (weightKg <= 45)
    return { label: "Голямо", tone: "bg-orange-50 text-orange-700" };
  return { label: "Гигант", tone: "bg-orange-50 text-orange-700" };
}

function toMillisSafe(v: unknown): number {
  if (!v || typeof v !== "object") return 0;
  const maybe = v as FirestoreTimestampLike;
  if (typeof maybe.toMillis === "function") return maybe.toMillis();
  return 0;
}

function PetCard({ pet, onOpen }: { pet: PetView; onOpen: () => void }) {
  const ageText = useMemo(() => {
    if (!pet.ageYears && !pet.ageMonths) return "";
    if (pet.ageYears && pet.ageMonths)
      return `${pet.ageYears} години и ${pet.ageMonths} мес.`;
    if (pet.ageYears) return `${pet.ageYears} години`;
    return `${pet.ageMonths} мес.`;
  }, [pet.ageYears, pet.ageMonths]);

  const sizeBadge = sizeBadgeFromWeight(pet.weightKg);

  return (
    <article
      onClick={onOpen}
      className="cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition
                 hover:shadow-md hover:-translate-y-[1px] active:scale-[0.995]"
    >
      <div className="relative h-56 w-full bg-gray-100">
        {pet.photoUrl ? (
          <img src={pet.photoUrl} alt={pet.name} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-5xl">🐶</div>
        )}

        {(pet.friendlyWithDogs || pet.goodWithKids) && (
          <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-black/5 backdrop-blur">
            🐾 Дружелюбно
          </div>
        )}

        <div className="absolute bottom-3 left-3 text-white drop-shadow">
          <div className="text-xl font-extrabold">{pet.name}</div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">{pet.breed}</div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-600">
              {ageText && <span>{ageText}</span>}
              {!!pet.weightKg && <span>{pet.weightKg} кг</span>}
            </div>
            <div className="mt-2 text-xs text-gray-500">📍 {pet.city}</div>
          </div>

          <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-semibold", sizeBadge.tone)}>
            {sizeBadge.label}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {pet.traits.slice(0, 2).map((t) => (
            <span
              key={t}
              className="rounded-full bg-gray-50 px-3 py-1 text-[11px] font-semibold text-gray-700 ring-1 ring-black/5"
            >
              {t}
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
      services: Array.isArray(profile?.services) ? profile!.services! : [],
    }),
    [profile]
  );

  const [draftProfile, setDraftProfile] = useState<EditableProfile>(viewProfile);

  const openEdit = () => {
    setDraftProfile(viewProfile);
    setEditKey((k) => k + 1);
    setEditing(true);
  };

  const [pets, setPets] = useState<PetView[]>([]);
  const [petsLoaded, setPetsLoaded] = useState(false);
  const [petsError, setPetsError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const qRef = query(collection(db, "pets"), where("ownerId", "==", user.uid));

    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const list: PetView[] = snap.docs
          .map((d) => {
            const data = d.data() as PetDocRead;
            return {
              id: d.id,
              name: data.name ?? "",
              breed: data.breed ?? "",
              ageYears: Number(data.ageYears ?? 0),
              ageMonths: Number(data.ageMonths ?? 0),
              weightKg: Number(data.weightKg ?? 0),
              city: data.city ?? "",
              traits: Array.isArray(data.traits) ? data.traits : [],
              friendlyWithDogs: !!data.friendlyWithDogs,
              goodWithKids: !!data.goodWithKids,
              photoUrl: data.imageUrl,
              createdAtMs: toMillisSafe(data.createdAt),
            };
          })
          .sort((a, b) => b.createdAtMs - a.createdAtMs);

        setPets(list);
        setPetsError(null);
        setPetsLoaded(true);
      },
      (err) => {
        console.error(err);
        setPets([]);
        setPetsError("Не успях да заредя кучетата.");
        setPetsLoaded(true);
      }
    );

    return () => unsub();
  }, [user?.uid]);

  const displayRole = viewProfile.role === "owner" ? "Стопанин" : "Гледач";

  async function handleSaveProfile(next: EditableProfile, avatarFile: File | null) {
    if (!user?.uid) return;

    try {
      const ref = doc(db, "users", user.uid);

      // ✅ 1) ако има нов avatar -> upload в Supabase
      let avatarUrl = currentAvatarUrl;
      let avatarPath = currentAvatarPath;

      if (avatarFile) {
        // ✅ delete стария (ти искаш да го запазим)
        if (avatarPath) {
          try {
            await deleteUserAvatar(avatarPath);
          } catch (e) {
            // не е фатално, просто логваме
            console.warn("Avatar delete failed:", e);
          }
        }

        const up = await uploadUserAvatar(avatarFile, user.uid);
        avatarUrl = up.publicUrl;
        avatarPath = up.storagePath;
      }

      // ✅ 2) update Firestore
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
        { merge: true }
      );

      setEditing(false);
    } catch (e) {
      console.error(e);
      alert("Не успях да запазя профила. Провери конзолата.");
    }
  }

  async function handleCreatePet(pet: NewPetDraft) {
    if (!user?.uid) {
      setIsAddPetOpen(false);
      return;
    }

    try {
      let imageUrl: string | undefined;
      let imagePath: string | undefined;

      if (pet.photoFile) {
        const up = await uploadPetPhoto(pet.photoFile, user.uid);
        imageUrl = up.publicUrl;
        imagePath = up.storagePath;
      }

      const payload: PetDocWrite = {
        ownerId: user.uid,

        name: pet.name.trim(),
        breed: pet.breed,
        city: pet.city,
        area: pet.area.trim() || undefined,

        ageYears: Number(pet.ageYears ?? 0),
        ageMonths: Number(pet.ageMonths ?? 0),
        weightKg: Number(pet.weightKg ?? 0),

        traits: Array.isArray(pet.traits) ? pet.traits : [],
        friendlyWithDogs: !!pet.friendlyWithDogs,
        goodWithKids: !!pet.goodWithKids,
        description: pet.description.trim() || undefined,

        imageUrl,
        imagePath,

        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "pets"), payload as unknown as DocumentData);
      setIsAddPetOpen(false);
    } catch (e) {
      console.error(e);
      alert("Не успях да добавя кучето. Провери Supabase env/policies.");
    }
  }

  const showPetsLoading = !!user?.uid && !petsLoaded;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="h-24 bg-orange-100" />

        <div className="px-6 pb-6 pt-6">
          <div className="-mt-6 flex items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="h-20 w-20 overflow-hidden rounded-2xl bg-gray-200 ring-4 ring-white shadow-sm">
                  {currentAvatarUrl ? (
                    <img src={currentAvatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xl font-bold text-gray-700">
                      {initials(viewProfile.name || " ")}
                    </div>
                  )}
                </div>

                <div className="absolute -bottom-2 -right-2 grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white ring-4 ring-white">
                  ✓
                </div>
              </div>

              <div className="pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-2xl font-bold text-gray-900">
                    {viewProfile.name || "—"}
                  </div>

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                    Верифициран
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                  <span>📍 {viewProfile.city || "—"}</span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                    {displayRole}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={openEdit}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900
                         shadow-sm transition hover:bg-gray-50 active:scale-[0.99]
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
            >
              ✏️ Редактирай
            </button>
          </div>

          {viewProfile.about && (
            <div className="mt-5 text-sm text-gray-700">{viewProfile.about}</div>
          )}

          <div className="mt-5 h-px w-full bg-gray-100" />

          {viewProfile.role === "caretaker" && (
            <>
              <div className="mt-4 text-3xl font-extrabold text-gray-900">
                {viewProfile.pricePerDay}
                <span className="ml-2 text-base font-medium text-gray-600">лв/ден</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {viewProfile.services.map((s) => (
                  <span
                    key={s}
                    className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Моите кучета</h2>

          <button
            type="button"
            onClick={() => setIsAddPetOpen(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900
                       shadow-sm transition hover:bg-gray-50 active:scale-[0.99]
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
          >
            🐾 Добави куче
          </button>
        </div>

        {petsError && (
          <div className="rounded-2xl bg-white p-6 text-sm text-red-600 shadow-sm ring-1 ring-black/5">
            {petsError}
          </div>
        )}

        {showPetsLoading ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-gray-700 shadow-sm ring-1 ring-black/5">
            Зареждане...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pets.map((p) => (
              <PetCard key={p.id} pet={p} onOpen={() => navigate(`/pets/${p.id}`)} />
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