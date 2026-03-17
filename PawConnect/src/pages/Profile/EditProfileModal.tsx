import { useMemo, useState } from "react";
import SearchableSelect from "../../components/ui/SearchableSelect";
import { BULGARIAN_CITIES } from "../../constants/formOptions";

export type EditableProfile = {
  name: string;
  city: string;
  area: string;
  phone: string;
  about: string;
  role: "owner" | "caretaker";
  experience: string;
  pricePerDay: number;
  services: string[];
};

type Props = {
  open: boolean;
  initial: EditableProfile;
  initialAvatarUrl?: string;
  onClose: () => void;
  onSave: (next: EditableProfile, avatarFile: File | null) => void;
};

const ALL_SERVICES = [
  "Гледане в дома",
  "Разходки",
  "Дневна грижа",
  "Ветеринарни посещения",
  "Хранене",
  "Транспорт",
];

const FIELD_LIMITS = {
  name: 30,
  area: 50,
  phone: 20,
  about: 500,
  experience: 700,
  pricePerDayMax: 999,
} as const;

function cn(...classes: Array<string | false | undefined | null>): string {
  return classes.filter(Boolean).join(" ");
}

export default function EditProfileModal({
  open,
  initial,
  initialAvatarUrl,
  onClose,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<EditableProfile>(() => initial);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const avatarPreview = useMemo(() => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    return initialAvatarUrl || "";
  }, [avatarFile, initialAvatarUrl]);

  if (!open) return null;

  function toggleService(service: string): void {
    const current = draft.services ?? [];
    const next = current.includes(service)
      ? current.filter((currentService) => currentService !== service)
      : [...current, service];

    setDraft({ ...draft, services: next });
  }

  function handleClose(): void {
    onClose();
  }

  function handleSave(): void {
    onSave(draft, avatarFile);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/10 dark:bg-neutral-900 dark:ring-white/10">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-white/10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Редактиране на профил
          </h2>

          <button
            onClick={handleClose}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-full transition hover:bg-gray-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 dark:text-gray-200 dark:hover:bg-white/10"
            aria-label="Затвори"
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[75vh] space-y-6 overflow-y-auto px-6 py-6">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-neutral-950 dark:ring-white/10">
            <div className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Профилна снимка
            </div>

            <div className="flex gap-4">
              <label className="group relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 transition hover:bg-gray-100 dark:border-white/10 dark:bg-neutral-900 dark:hover:bg-white/5">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="h-full w-full object-cover"
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
                    const selectedFile = event.target.files?.[0] ?? null;
                    setAvatarFile(selectedFile);
                  }}
                />
              </label>

              <div className="flex-1 text-sm text-gray-600 dark:text-gray-300">
                Качете снимка, която показва лицето ви ясно. Това помага на
                другите потребители да ви разпознаят и да се доверят на профила
                ви. Снимката трябва да бъде в JPEG или PNG формат и не по-голяма
                от 5MB.
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Основна информация
            </h3>

            <div>
              <input
                value={draft.name}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    name: event.target.value.slice(0, FIELD_LIMITS.name),
                  })
                }
                maxLength={FIELD_LIMITS.name}
                placeholder="Име"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:placeholder:text-gray-500"
              />
              <div className="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">
                {draft.name.length}/{FIELD_LIMITS.name}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SearchableSelect
                placeholder="Град"
                value={draft.city}
                options={BULGARIAN_CITIES}
                onChange={(selectedCity) =>
                  setDraft({ ...draft, city: selectedCity })
                }
                emptyMessage="Няма намерени градове"
              />

              <div>
                <input
                  value={draft.area}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      area: event.target.value.slice(0, FIELD_LIMITS.area),
                    })
                  }
                  maxLength={FIELD_LIMITS.area}
                  placeholder="Квартал (по желание)"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:placeholder:text-gray-500"
                />
                <div className="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">
                  {draft.area.length}/{FIELD_LIMITS.area}
                </div>
              </div>
            </div>

            <div>
              <textarea
                value={draft.about}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    about: event.target.value.slice(0, FIELD_LIMITS.about),
                  })
                }
                maxLength={FIELD_LIMITS.about}
                placeholder="За мен"
                className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:placeholder:text-gray-500"
                rows={4}
              />
              <div className="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">
                {draft.about.length}/{FIELD_LIMITS.about}
              </div>
            </div>

            <div>
              <input
                value={draft.phone}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    phone: event.target.value.slice(0, FIELD_LIMITS.phone),
                  })
                }
                maxLength={FIELD_LIMITS.phone}
                placeholder="Телефон"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:placeholder:text-gray-500"
              />
              <div className="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">
                {draft.phone.length}/{FIELD_LIMITS.phone}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                Роля
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      role: "owner",
                    })
                  }
                  className={cn(
                    "cursor-pointer rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200",
                    draft.role === "owner"
                      ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300"
                      : "border-gray-200 bg-white text-gray-700 hover:border-orange-200 hover:bg-orange-50 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-200 dark:hover:border-orange-500/30 dark:hover:bg-orange-500/10",
                  )}
                >
                  <div>Собственик</div>
                  <div className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                    За хора, които имат домашен любимец
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      role: "caretaker",
                    })
                  }
                  className={cn(
                    "cursor-pointer rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200",
                    draft.role === "caretaker"
                      ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300"
                      : "border-gray-200 bg-white text-gray-700 hover:border-orange-200 hover:bg-orange-50 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-200 dark:hover:border-orange-500/30 dark:hover:bg-orange-500/10",
                  )}
                >
                  <div>Гледач</div>
                  <div className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                    За хора, които предлагат грижа за любимци
                  </div>
                </button>
              </div>
            </div>
          </section>

          {draft.role === "caretaker" ? (
            <section className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Информация за гледач
              </h3>

              <div>
                <textarea
                  value={draft.experience}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      experience: event.target.value.slice(
                        0,
                        FIELD_LIMITS.experience,
                      ),
                    })
                  }
                  maxLength={FIELD_LIMITS.experience}
                  placeholder="Опит"
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:placeholder:text-gray-500"
                  rows={3}
                />
                <div className="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">
                  {draft.experience.length}/{FIELD_LIMITS.experience}
                </div>
              </div>

              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={FIELD_LIMITS.pricePerDayMax}
                value={draft.pricePerDay}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  setDraft({
                    ...draft,
                    pricePerDay: Number.isFinite(nextValue)
                      ? Math.min(
                          Math.max(nextValue, 0),
                          FIELD_LIMITS.pricePerDayMax,
                        )
                      : 0,
                  });
                }}
                placeholder="Цена на ден"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:placeholder:text-gray-500"
              />

              <div>
                <div className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Услуги
                </div>
                <div className="flex flex-wrap gap-2">
                  {ALL_SERVICES.map((service) => {
                    const active = draft.services.includes(service);

                    return (
                      <button
                        key={service}
                        type="button"
                        onClick={() => toggleService(service)}
                        className={cn(
                          "rounded-xl px-4 py-2 text-sm font-semibold transition",
                          active
                            ? "bg-orange-500 text-white"
                            : "bg-gray-50 text-gray-700 ring-1 ring-black/5 hover:bg-orange-50 dark:bg-neutral-800 dark:text-gray-200 dark:ring-white/10 dark:hover:bg-orange-500/10",
                        )}
                      >
                        {service}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : null}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 dark:border-white/10">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:hover:bg-white/5"
            >
              Отказ
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
            >
              Запази
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}