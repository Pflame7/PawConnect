import { useEffect, useMemo, useState } from "react";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/useAuth";
import {
  getResolvedUserSettings,
  updateUserSettings,
} from "../../services/users";
import type { UserSettings } from "../../types/user";

function clearDarkMode(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "light";
  document.body.classList.remove("dark");
}

function SettingsRow({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-gray-100 px-5 py-5 dark:border-white/10">
      <div className="min-w-0">
        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </div>
        {subtitle ? (
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {subtitle}
          </div>
        ) : null}
      </div>

      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="text-xl" aria-hidden="true">
          {icon}
        </span>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
      </div>

      {children}
    </section>
  );
}

function Switch({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      } ${checked ? "bg-gray-900 dark:bg-orange-500" : "bg-gray-200 dark:bg-neutral-700"}`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition ${
          checked ? "translate-x-7" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function InfoModal({
  open,
  title,
  content,
  onClose,
}: {
  open: boolean;
  title: string;
  content: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Затвори"
        onClick={onClose}
        className="absolute inset-0 bg-black/35"
      />

      <div className="absolute inset-0 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/10 dark:bg-neutral-900 dark:ring-white/10">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/10">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h3>

            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Затвори прозореца"
            >
              ✕
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
            <div className="whitespace-pre-line text-sm leading-7 text-gray-700 dark:text-gray-200">
              {content}
            </div>
          </div>

          <div className="border-t border-gray-100 px-6 py-4 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
            >
              Затвори
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const TERMS_OF_USE_TEXT = `Добре дошли в PawConnect.

1. Платформа, създадена с цел да свързва собственици на домашни любимци с хора, които могат да се грижат за тях.

2. PawConnect е онлайн платформа, която позволява на потребителите да създават профили на домашни любимци и да се свързват с други потребители. Платформата служи единствено като средство за комуникация между потребителите.

3. Всеки потребител носи отговорност за информацията, която публикува в своя профил. Това включва данни за домашните любимци, снимки, описания и друга информация, която потребителят избере да сподели.

4. Потребителите трябва да предоставят вярна и точна информация при използването на платформата.

5. Забранено е публикуването на обидно, подвеждащо, незаконно или неподходящо съдържание.

6. Потребителите трябва да използват платформата по отговорен начин и да се отнасят с уважение към останалите потребители.

7. PawConnect си запазва правото да ограничава или премахва профили на потребители, които нарушават тези условия.

8. Платформата може периодично да бъде обновявана или подобрявана с цел по-добро функциониране.

9. С използването на PawConnect потребителите потвърждават, че са прочели и приемат тези условия за ползване.`;

const PRIVACY_POLICY_TEXT = `PawConnect уважава вашата поверителност.

1. PawConnect се стреми да защитава личната информация на потребителите.

2. PawConnect може да събира основна информация за потребителите като име, имейл адрес, град и информация за домашни любимци.

3. Събраната информация се използва единствено за функционирането на платформата и за подобряване на потребителското изживяване.

4. Част от информацията, която потребителите публикуват в своите профили, може да бъде видима за други потребители на платформата.

5. PawConnect не продава и не предоставя лични данни на трети страни.

6. Платформата предприема разумни технически мерки за защита на информацията на потребителите.

7. Потребителите могат по всяко време да редактират информацията в своя профил или да премахнат съдържание, което са публикували.

8. PawConnect може да актуализира тази политика за поверителност при необходимост.

9. С използването на платформата потребителите се съгласяват с тази политика за поверителност.`;

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const resolvedSettings = useMemo(() => {
    return getResolvedUserSettings(profile);
  }, [profile]);

  const [settings, setSettings] = useState<UserSettings>(resolvedSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [openModal, setOpenModal] = useState<"terms" | "privacy" | null>(null);

  useEffect(() => {
    setSettings(resolvedSettings);
  }, [resolvedSettings]);

  const displayName = useMemo(() => {
    return profile?.name?.trim() || "Потребител";
  }, [profile?.name]);

  const displayEmail = useMemo(() => {
    return profile?.email?.trim() || user?.email?.trim() || "Няма имейл";
  }, [profile?.email, user?.email]);

  const modalTitle =
    openModal === "terms"
      ? "Условия за ползване"
      : openModal === "privacy"
        ? "Политика за поверителност"
        : "";

  const modalContent =
    openModal === "terms"
      ? TERMS_OF_USE_TEXT
      : openModal === "privacy"
        ? PRIVACY_POLICY_TEXT
        : "";

  async function saveSettings(nextSettings: UserSettings): Promise<void> {
    if (!user?.uid) {
      return;
    }

    const previousSettings = settings;

    setSettings(nextSettings);
    setIsSaving(true);

    try {
      await updateUserSettings(user.uid, nextSettings);
    } catch (error: unknown) {
      console.error(error);
      setSettings(previousSettings);
      alert("Не успях да запазя настройките.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout(): Promise<void> {
    try {
      clearDarkMode();
      await signOut(getAuth());
      navigate("/auth?mode=login", { replace: true });
    } catch (error: unknown) {
      console.error(error);
      alert("Не успях да изляза от профила.");
    }
  }

  return (
    <>
      <div className="space-y-8 pb-20">
        <section className="space-y-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 dark:border-white/10 dark:bg-neutral-900 dark:text-gray-100 dark:hover:bg-neutral-800"
          >
            ← Назад
          </button>

          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">
            Настройки
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Управлявай своя акаунт
          </p>
          {isSaving ? (
            <p className="text-sm font-medium text-orange-600">
              Запазване на настройките...
            </p>
          ) : null}
        </section>

        <SectionCard title="Акаунт" icon="👤">
          <SettingsRow title="Имейл" subtitle={displayEmail} />
          <SettingsRow title="Име" subtitle={displayName} />
        </SectionCard>

        <SectionCard title="Известия" icon="🔔">
          <SettingsRow
            title="Съобщения"
            subtitle="Получавай известия при нови съобщения"
            right={
              <Switch
                checked={settings.messageNotifications}
                disabled={isSaving}
                onChange={(value) => {
                  void saveSettings({
                    ...settings,
                    messageNotifications: value,
                  });
                }}
              />
            }
          />

          <SettingsRow
            title="Тъмен режим"
            subtitle="Превключи сайта в по-тъмен вид"
            right={
              <Switch
                checked={settings.darkMode}
                disabled={isSaving}
                onChange={(value) => {
                  void saveSettings({
                    ...settings,
                    darkMode: value,
                  });
                }}
              />
            }
          />
        </SectionCard>

        <SectionCard title="Поверителност" icon="🛡️">
          <button
            type="button"
            onClick={() => setOpenModal("terms")}
            className="flex w-full cursor-pointer items-center justify-between border-t border-gray-100 px-5 py-5 text-left transition hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
          >
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Условия за ползване
            </div>
            <span className="text-xl text-gray-400 dark:text-gray-500">›</span>
          </button>

          <button
            type="button"
            onClick={() => setOpenModal("privacy")}
            className="flex w-full cursor-pointer items-center justify-between border-t border-gray-100 px-5 py-5 text-left transition hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
          >
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Политика за поверителност
            </div>
            <span className="text-xl text-gray-400 dark:text-gray-500">›</span>
          </button>
        </SectionCard>

        <button
          type="button"
          onClick={() => {
            void handleLogout();
          }}
          className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border border-red-200 bg-white px-5 py-4 text-lg font-semibold text-red-600 shadow-sm transition hover:bg-red-50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 dark:border-red-500/30 dark:bg-neutral-900 dark:text-red-400 dark:hover:bg-red-500/10"
        >
          Изход от акаунта
        </button>

        <div className="pt-4 text-center text-sm text-gray-400 dark:text-gray-500">
          <div>PawConnect v1.0</div>
          <div className="mt-1">© 2024 PawConnect. Всички права запазени.</div>
        </div>
      </div>

      <InfoModal
        open={openModal !== null}
        title={modalTitle}
        content={modalContent}
        onClose={() => setOpenModal(null)}
      />
    </>
  );
}