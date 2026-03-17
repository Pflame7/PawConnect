import { useEffect, useRef, useState, useMemo } from "react";
import SearchableSelect from "../../components/ui/SearchableSelect";
import {
  ANIMAL_TYPES,
  BREEDS_BY_ANIMAL,
  BULGARIAN_CITIES,
  type AnimalType,
} from "../../constants/formOptions";
import {
  GENDER_OPTIONS,
  SIZE_OPTIONS,
  PET_TRAITS,
  type PetGender,
  type PetSize,
} from "../../pages/Pets/pets.data";

const FIELD_LIMITS = {
  name: 25,
  area: 50,
  description: 400,
} as const;

export type NewPetDraft = {
  photoFile?: File | null;
  animalType: AnimalType | "";
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

function cn(...classes: Array<string | false | undefined | null>): string {
  return classes.filter(Boolean).join(" ");
}

function isAnimalType(value: string): value is AnimalType {
  return ANIMAL_TYPES.includes(value as AnimalType);
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

  const [animalType, setAnimalType] = useState<AnimalType | "">("");
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [gender, setGender] = useState<PetGender>("male");
  const [size, setSize] = useState<PetSize>("small");

  const [ageYears, setAgeYears] = useState(0);
  const [ageMonths, setAgeMonths] = useState(0);
  const [weightKg, setWeightKg] = useState(0);

  const [city, setCity] = useState("");
  const [area, setArea] = useState("");

  const [traits, setTraits] = useState<string[]>([]);
  const [friendlyWithDogs, setFriendlyWithDogs] = useState(false);
  const [goodWithKids, setGoodWithKids] = useState(false);

  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!photoUrl) return;

    return () => {
      URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  const breedOptions = useMemo(() => {
    if (!animalType) return [];
    return BREEDS_BY_ANIMAL[animalType];
  }, [animalType]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  function resetForm(): void {
    setPhotoFile(null);
    setAnimalType("");
    setName("");
    setBreed("");
    setGender("male");
    setSize("small");
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

  function toggleTrait(trait: string): void {
    setTraits((previous) =>
      previous.includes(trait)
        ? previous.filter((item) => item !== trait)
        : [...previous, trait],
    );
  }

  function handleClose(): void {
    onClose();
  }

  function handleSubmit(): void {
    setError("");

    const trimmedName = name.trim();
    const trimmedArea = area.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setError("Моля, въведи име.");
      return;
    }

    if (trimmedName.length > FIELD_LIMITS.name) {
      setError(`Името може да е най-много ${FIELD_LIMITS.name} символа.`);
      return;
    }

    if (!animalType) {
      setError("Моля, избери животно.");
      return;
    }

    if (!breed) {
      setError("Моля, избери порода.");
      return;
    }

    if (!city.trim()) {
      setError("Моля, избери град.");
      return;
    }

    if (trimmedArea.length > FIELD_LIMITS.area) {
      setError(`Кварталът може да е най-много ${FIELD_LIMITS.area} символа.`);
      return;
    }

    if (trimmedDescription.length > FIELD_LIMITS.description) {
      setError(
        `Описанието може да е най-много ${FIELD_LIMITS.description} символа.`,
      );
      return;
    }

    const draft: NewPetDraft = {
      photoFile,
      animalType,
      name: trimmedName,
      breed,
      gender,
      size,
      ageYears,
      ageMonths,
      weightKg,
      city,
      area: trimmedArea,
      traits,
      friendlyWithDogs,
      goodWithKids,
      description: trimmedDescription,
    };

    onCreate(draft);
    resetForm();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={handleClose} />

      <div className="absolute inset-0 overflow-y-auto">
        <div className="mx-auto flex min-h-full max-w-4xl items-start justify-center px-4 py-10">
          <div
            ref={dialogRef}
            className="w-full rounded-2xl bg-white shadow-xl ring-1 ring-black/10 dark:bg-neutral-900 dark:ring-white/10"
          >
            <div className="flex items-start justify-between gap-3 px-6 pt-6">
              <div className="flex items-start gap-3">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Добави любимец
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Разкажи ни за твоя домашен любимец
                  </div>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-full transition hover:bg-gray-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 dark:text-gray-200 dark:hover:bg-white/10"
                aria-label="Затвори"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 px-6 pb-6 pt-6">
              {error ? (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20">
                  {error}
                </div>
              ) : null}

              <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-neutral-950 dark:ring-white/10">
                <div className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Снимки
                </div>

                <div className="flex gap-4">
                  <label className="group relative flex h-28 w-28 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 transition hover:bg-gray-100 dark:border-white/10 dark:bg-neutral-900 dark:hover:bg-white/5">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="Preview"
                        className="h-full w-full rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <div className="text-2xl text-gray-500 dark:text-gray-400">
                          ＋
                        </div>
                        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                          Добави
                        </div>
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        setPhotoFile(file);
                      }}
                    />
                  </label>

                  <div className="flex-1 text-sm text-gray-600 dark:text-gray-300">
                    Качете снимка на вашия любимец. Това помага на потенциалните
                    гледачи да се запознаят с него и да се доверят на профила ви.
                    Снимката трябва да бъде в JPEG или PNG формат и не по-голяма
                    от 5MB. Задължително трябва снимка!
                  </div>
                </div>
              </section>

              <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-neutral-950 dark:ring-white/10">
                <div className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Основна информация
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Име <span className="text-orange-500">*</span>
                    </label>
                    <input
                      value={name}
                      maxLength={FIELD_LIMITS.name}
                      onChange={(event) =>
                        setName(event.target.value.slice(0, FIELD_LIMITS.name))
                      }
                      placeholder="Как се казва?"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-white/10 dark:bg-neutral-900 dark:text-gray-100 dark:placeholder:text-gray-500"
                    />
                    <div className="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">
                      {name.length}/{FIELD_LIMITS.name}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Животно <span className="text-orange-500">*</span>
                    </label>

                    <SearchableSelect
                      placeholder="Избери животно"
                      value={animalType}
                      options={ANIMAL_TYPES}
                      onChange={(selectedAnimalType) => {
                        if (!isAnimalType(selectedAnimalType)) return;

                        setAnimalType(selectedAnimalType);
                        setBreed("");
                      }}
                      emptyMessage="Няма намерени животни"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Порода <span className="text-orange-500">*</span>
                    </label>

                    <SearchableSelect
                      placeholder={
                        animalType ? "Избери порода" : "Първо избери животно"
                      }
                      value={breed}
                      options={breedOptions}
                      onChange={(selectedBreed) => setBreed(selectedBreed)}
                      disabled={!animalType}
                      emptyMessage="Няма намерени породи"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Пол
                      </label>

                      <div className="flex flex-wrap gap-2">
                        {GENDER_OPTIONS.map((option) => {
                          const active = gender === option.value;

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setGender(option.value as PetGender)}
                              className={cn(
                                "cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition",
                                active
                                  ? "bg-orange-500 text-white"
                                  : "bg-gray-50 text-gray-700 ring-1 ring-black/5 hover:bg-orange-50 dark:bg-neutral-800 dark:text-gray-200 dark:ring-white/10 dark:hover:bg-orange-500/10",
                              )}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Размер
                      </label>

                      <div className="flex flex-wrap gap-2">
                        {SIZE_OPTIONS.map((option) => {
                          const active = size === option.value;

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setSize(option.value as PetSize)}
                              className={cn(
                                "cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition",
                                active
                                  ? "bg-orange-500 text-white"
                                  : "bg-gray-50 text-gray-700 ring-1 ring-black/5 hover:bg-orange-50 dark:bg-neutral-800 dark:text-gray-200 dark:ring-white/10 dark:hover:bg-orange-500/10",
                              )}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Години
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={999}
                        value={ageYears}
                        onChange={(event) => {
                          const raw = Number(event.target.value);
                          const value = Number.isFinite(raw)
                            ? Math.min(Math.max(raw, 0), 999)
                            : 0;
                          setAgeYears(value);
                        }}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-white/10 dark:bg-neutral-900 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Месеци
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={11}
                        value={ageMonths}
                        onChange={(event) => {
                          const raw = Number(event.target.value);
                          const value = Number.isFinite(raw)
                            ? Math.min(Math.max(raw, 0), 11)
                            : 0;
                          setAgeMonths(value);
                        }}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-white/10 dark:bg-neutral-900 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Тегло (кг)
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={999}
                        value={weightKg}
                        onChange={(event) => {
                          const raw = Number(event.target.value);
                          const value = Number.isFinite(raw)
                            ? Math.min(Math.max(raw, 0), 999)
                            : 0;
                          setWeightKg(value);
                        }}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-white/10 dark:bg-neutral-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-neutral-950 dark:ring-white/10">
                <div className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Местоположение
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Град <span className="text-orange-500">*</span>
                    </label>

                    <SearchableSelect
                      placeholder="Избери град"
                      value={city}
                      options={BULGARIAN_CITIES}
                      onChange={(selectedCity) => setCity(selectedCity)}
                      emptyMessage="Няма намерени градове"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Квартал
                    </label>
                    <input
                      value={area}
                      maxLength={FIELD_LIMITS.area}
                      onChange={(event) =>
                        setArea(event.target.value.slice(0, FIELD_LIMITS.area))
                      }
                      placeholder="Квартал (по желание)"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-white/10 dark:bg-neutral-900 dark:text-gray-100 dark:placeholder:text-gray-500"
                    />
                    <div className="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">
                      {area.length}/{FIELD_LIMITS.area}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-neutral-950 dark:ring-white/10">
                <div className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Характер
                </div>

                <div className="flex flex-wrap gap-2">
                  {PET_TRAITS.map((trait) => {
                    const active = traits.includes(trait);

                    return (
                      <button
                        key={trait}
                        type="button"
                        onClick={() => toggleTrait(trait)}
                        className={cn(
                          "cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition",
                          active
                            ? "bg-orange-500 text-white"
                            : "bg-gray-50 text-gray-700 ring-1 ring-black/5 hover:bg-orange-50 dark:bg-neutral-800 dark:text-gray-200 dark:ring-white/10 dark:hover:bg-orange-500/10",
                        )}
                      >
                        {trait}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 space-y-3">
                  <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-800 dark:text-gray-200">
                    <input
                      type="checkbox"
                      checked={friendlyWithDogs}
                      onChange={(event) =>
                        setFriendlyWithDogs(event.target.checked)
                      }
                      className="h-4 w-4 accent-orange-500"
                    />
                    Дружелюбно с други любимци
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-800 dark:text-gray-200">
                    <input
                      type="checkbox"
                      checked={goodWithKids}
                      onChange={(event) => setGoodWithKids(event.target.checked)}
                      className="h-4 w-4 accent-orange-500"
                    />
                    Подходящо за деца
                  </label>
                </div>
              </section>

              <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-neutral-950 dark:ring-white/10">
                <div className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Описание
                </div>

                <textarea
                  value={description}
                  maxLength={FIELD_LIMITS.description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value.slice(0, FIELD_LIMITS.description),
                    )
                  }
                  placeholder="Разкажи повече за своя любимец..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-white/10 dark:bg-neutral-900 dark:text-gray-100 dark:placeholder:text-gray-500"
                />
                <div className="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">
                  {description.length}/{FIELD_LIMITS.description}
                </div>
              </section>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="cursor-pointer rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:hover:bg-white/5"
                >
                  Отказ
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  className="cursor-pointer rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-orange-600 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
                >
                  Добави любимеца
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}