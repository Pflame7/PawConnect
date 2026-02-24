import { useMemo, useState } from "react";

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

  // ✅ за показване на текущата снимка
  initialAvatarUrl?: string;

  onClose: () => void;

  // ✅ връщаме и файла
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

function cn(...classes: Array<string | false | undefined | null>) {
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

  function toggleService(service: string) {
    const current = draft.services ?? [];
    const next = current.includes(service)
      ? current.filter((s) => s !== service)
      : [...current, service];

    setDraft({ ...draft, services: next });
  }

  function handleClose() {
    onClose();
  }

  function handleSave() {
    onSave(draft, avatarFile);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold">Редактиране на профил</h2>

          <button
            onClick={handleClose}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-gray-100 active:scale-[0.98] cursor-pointer
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
            aria-label="Затвори"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[75vh] overflow-y-auto px-6 py-6 space-y-6">
          {/* ✅ Профилна снимка */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="text-sm font-semibold text-gray-900 mb-4">Профилна снимка</div>

            <div className="flex gap-4">
              <label className="group relative flex h-28 w-28 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 transition hover:bg-gray-100 overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <div className="text-2xl text-gray-500">＋</div>
                    <div className="text-xs font-semibold text-gray-600">Добави</div>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setAvatarFile(f);
                  }}
                />
              </label>

              <div className="flex-1 text-sm text-gray-600">
                Избери снимка. При “Запази” ще я качим в Supabase и ще се показва навсякъде.
              </div>
            </div>
          </section>

          {/* Основна информация */}
          <section className="space-y-4">
            <h3 className="text-lg font-medium">Основна информация</h3>

            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Име"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                placeholder="Град"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
              />
              <input
                value={draft.area}
                onChange={(e) => setDraft({ ...draft, area: e.target.value })}
                placeholder="Район"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>

            <textarea
              value={draft.about}
              onChange={(e) => setDraft({ ...draft, about: e.target.value })}
              placeholder="За мен"
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
              rows={4}
            />

            <input
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              placeholder="Телефон"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
            />

            <div>
              <div className="mb-1 text-sm font-semibold text-gray-800">Роля</div>
              <select
                value={draft.role}
                onChange={(e) =>
                  setDraft({ ...draft, role: e.target.value as "owner" | "caretaker" })
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none cursor-pointer
                           focus:ring-2 focus:ring-orange-200"
              >
                <option value="owner">Собственик</option>
                <option value="caretaker">Гледач</option>
              </select>
            </div>
          </section>

          {draft.role === "caretaker" && (
            <section className="space-y-4">
              <h3 className="text-lg font-medium">Информация за гледач</h3>

              <textarea
                value={draft.experience}
                onChange={(e) => setDraft({ ...draft, experience: e.target.value })}
                placeholder="Опит"
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
                rows={3}
              />

              <input
                type="number"
                value={draft.pricePerDay}
                onChange={(e) => setDraft({ ...draft, pricePerDay: Number(e.target.value) })}
                placeholder="Цена на ден"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
              />

              <div>
                <div className="mb-2 text-sm font-semibold text-gray-800">Услуги</div>
                <div className="flex flex-wrap gap-2">
                  {ALL_SERVICES.map((s) => {
                    const active = draft.services.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleService(s)}
                        className={cn(
                          "rounded-xl px-4 py-2 text-sm font-semibold transition",
                          active
                            ? "bg-gray-900 text-white"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100 ring-1 ring-black/5"
                        )}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900
                         hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
            >
              Отказ
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white
                         hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
            >
              Запази
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}