import { useEffect, useMemo, useRef, useState } from "react";
import {
  BREEDS,
  CITIES,
  GENDER_OPTIONS,
  SIZE_OPTIONS,
  PET_TRAITS,
  type PetGender,
  type PetSize,
} from "../../pages/Pets/pets.data";

export type NewPetDraft = {
  // снимка (засега само локално preview)
  photoFile?: File | null;

  name: string;
  breed: string;
  gender: PetGender;
  size: PetSize;

  ageYears: number;
  ageMonths: number;
  weightKg: number;

  city: string;
  area: string;

  traits: string[];
  friendlyWithDogs: boolean;
  goodWithKids: boolean;

  description: string;
};

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export default function AddPetModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (pet: NewPetDraft) => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const photoUrl = useMemo(() => {
    if (!photoFile) return "";
    return URL.createObjectURL(photoFile);
  }, [photoFile]);

  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [gender, setGender] = useState<PetGender>("");
  const [size, setSize] = useState<PetSize>("");

  const [ageYears, setAgeYears] = useState(0);
  const [ageMonths, setAgeMonths] = useState(0);
  const [weightKg, setWeightKg] = useState(0);

  const [city, setCity] = useState("");
  const [area, setArea] = useState("");

  const [traits, setTraits] = useState<string[]>([]);
  const [friendlyWithDogs, setFriendlyWithDogs] = useState(false);
  const [goodWithKids, setGoodWithKids] = useState(false);

  const [description, setDescription] = useState("");

  const [error, setError] = useState<string>("");

  // ESC + lock scroll
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
      // revoke blob url
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [open, onClose, photoUrl]);

  function resetForm() {
    setPhotoFile(null);
    setName("");
    setBreed("");
    setGender("");
    setSize("");
    setAgeYears(0);
    setAgeMonths(0);
    setWeightKg(0);
    setCity("");
    setArea("");
    setTraits([]);
    setFriendlyWithDogs(false);
    setGoodWithKids(false);
    setDescription("");
    setError("");
  }

  function toggleTrait(t: string) {
    setTraits((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function handleClose() {
    onClose();
  }

  function handleSubmit() {
    setError("");

    if (!name.trim()) {
      setError("Моля, въведи име.");
      return;
    }
    if (!breed) {
      setError("Моля, избери порода.");
      return;
    }

    const draft: NewPetDraft = {
      photoFile,
      name: name.trim(),
      breed,
      gender,
      size,
      ageYears,
      ageMonths,
      weightKg,
      city,
      area: area.trim(),
      traits,
      friendlyWithDogs,
      goodWithKids,
      description: description.trim(),
    };

    onCreate(draft);
    resetForm();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={handleClose}
      />

      {/* dialog wrapper */}
      <div className="absolute inset-0 overflow-y-auto">
        <div className="mx-auto flex min-h-full max-w-4xl items-start justify-center px-4 py-10">
          <div
            ref={dialogRef}
            className="w-full rounded-2xl bg-white shadow-xl ring-1 ring-black/10"
          >
            {/* header */}
            <div className="flex items-start justify-between gap-3 px-6 pt-6">
              <div className="flex items-start gap-3">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    Добави куче
                  </div>
                  <div className="text-sm text-gray-600">
                    Разкажи ни за твоя любимец
                  </div>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-gray-100 active:scale-[0.98] cursor-pointer
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
                aria-label="Затвори"
              >
                ✕
              </button>
            </div>

            <div className="px-6 pb-6 pt-6 space-y-6">
              {/* error */}
              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
                  {error}
                </div>
              )}

              {/* Снимки */}
              <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                <div className="text-sm font-semibold text-gray-900 mb-4">
                  Снимки
                </div>

                <div className="flex gap-4">
                  <label className="group relative flex h-28 w-28 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 transition hover:bg-gray-100">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="Preview"
                        className="h-full w-full rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <div className="text-2xl text-gray-500">＋</div>
                        <div className="text-xs font-semibold text-gray-600">
                          Добави
                        </div>
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setPhotoFile(f);
                      }}
                    />
                  </label>

                  <div className="flex-1 text-sm text-gray-600">
                    Можеш да добавиш снимка (засега ще я показваме като preview).
                    По-късно ще я качим във Firebase Storage.
                  </div>
                </div>
              </section>

              {/* Основна информация */}
              <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                <div className="text-sm font-semibold text-gray-900 mb-4">
                  Основна информация
                </div>

                <div className="space-y-4">
                  {/* Име */}
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-800">
                      Име <span className="text-orange-500">*</span>
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Как се казва?"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none
                                 focus:ring-2 focus:ring-orange-200"
                    />
                  </div>

                  {/* Порода */}
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-800">
                      Порода <span className="text-orange-500">*</span>
                    </label>
                    <select
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none
                                 focus:ring-2 focus:ring-orange-200"
                    >
                      <option value="">Избери порода</option>
                      {BREEDS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Пол + Размер */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-800">
                        Пол
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as PetGender)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none
                                   focus:ring-2 focus:ring-orange-200"
                      >
                        {GENDER_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-800">
                        Размер
                      </label>
                      <select
                        value={size}
                        onChange={(e) => setSize(e.target.value as PetSize)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none
                                   focus:ring-2 focus:ring-orange-200"
                      >
                        {SIZE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Години / Месеци / Тегло */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-800">
                        Години
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={ageYears}
                        onChange={(e) => setAgeYears(Number(e.target.value))}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none
                                   focus:ring-2 focus:ring-orange-200"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-800">
                        Месеци
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={11}
                        value={ageMonths}
                        onChange={(e) => setAgeMonths(Number(e.target.value))}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none
                                   focus:ring-2 focus:ring-orange-200"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-800">
                        Тегло (кг)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={weightKg}
                        onChange={(e) => setWeightKg(Number(e.target.value))}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none
                                   focus:ring-2 focus:ring-orange-200"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Местоположение */}
              <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                <div className="text-sm font-semibold text-gray-900 mb-4">
                  Местоположение
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-800">
                      Град
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none
                                 focus:ring-2 focus:ring-orange-200"
                    >
                      <option value="">Избери град</option>
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-800">
                      Район
                    </label>
                    <input
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="Квартал"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none
                                 focus:ring-2 focus:ring-orange-200"
                    />
                  </div>
                </div>
              </section>

              {/* Характер */}
              <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                <div className="text-sm font-semibold text-gray-900 mb-4">
                  Характер
                </div>

                <div className="flex flex-wrap gap-2">
                  {PET_TRAITS.map((t) => {
                    const active = traits.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTrait(t)}
                        className={cn(
                          "cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition",
                          active
                            ? "bg-gray-900 text-white"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100 ring-1 ring-black/5"
                        )}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 space-y-3">
                  <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-800">
                    <input
                      type="checkbox"
                      checked={friendlyWithDogs}
                      onChange={(e) => setFriendlyWithDogs(e.target.checked)}
                      className="h-4 w-4 accent-orange-500"
                    />
                    Дружелюбно с други кучета
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-800">
                    <input
                      type="checkbox"
                      checked={goodWithKids}
                      onChange={(e) => setGoodWithKids(e.target.checked)}
                      className="h-4 w-4 accent-orange-500"
                    />
                    Подходящо за деца
                  </label>
                </div>
              </section>

              {/* Описание */}
              <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                <div className="text-sm font-semibold text-gray-900 mb-4">
                  Описание
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Разкажи повече за своя любимец..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none
                             focus:ring-2 focus:ring-orange-200"
                />
              </section>

              {/* footer buttons */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="cursor-pointer rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-900
                             shadow-sm transition hover:bg-gray-50 active:scale-[0.99]
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
                >
                  Отказ
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  className="cursor-pointer rounded-xl bg-gradient-to-r from-orange-400 to-orange-300 px-5 py-3 text-sm font-semibold text-white
                             shadow-md transition hover:from-orange-500 hover:to-orange-400 active:scale-[0.99]
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
                >
                  Добави кучето
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
