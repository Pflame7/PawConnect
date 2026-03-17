import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase";
import { useAuth } from "../providers/useAuth";
import { useUnreadCount } from "../hooks/useUnreadCount";

function linkClass({ isActive }: { isActive: boolean }): string {
  return `cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200
    ${
      isActive
        ? "bg-orange-600 text-white"
        : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
    }`;
}

function mobileLinkClass({ isActive }: { isActive: boolean }): string {
  return `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200
    ${
      isActive
        ? "bg-orange-600 text-white"
        : "text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-white/10"
    }`;
}

function clearDarkMode(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "light";
  document.body.classList.remove("dark");
}

export function TopNav() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const unreadTotal = useUnreadCount();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  async function handleLogout(): Promise<void> {
    try {
      clearDarkMode();
      await signOut(auth);
      navigate("/auth?mode=login", { replace: true });
    } catch (error: unknown) {
      console.error(error);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-neutral-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <NavLink
            to="/"
            className="flex min-w-0 cursor-pointer items-center gap-3 rounded-lg px-2 py-1 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 dark:hover:bg-white/10"
            aria-label="PawConnect - начало"
            onClick={() => setMobileOpen(false)}
          >
            <span className="text-2xl">🐾</span>
            <span className="truncate text-lg font-bold text-gray-900 dark:text-gray-100">
              PawConnect
            </span>
          </NavLink>

          <nav className="hidden items-center gap-2 lg:flex">
            <NavLink to="/" className={linkClass} end>
              Начало
            </NavLink>

            <NavLink to="/pets" className={linkClass}>
              Домашни любимци
            </NavLink>

            <NavLink to="/caretakers" className={linkClass}>
              Гледачи
            </NavLink>

            <NavLink to="/chats" className={linkClass}>
              <span className="relative inline-flex items-center gap-2">
                Чатове
                {unreadTotal > 0 ? (
                  <span
                    className="absolute -right-4 -top-2 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white"
                    aria-label={`Непрочетени: ${unreadTotal}`}
                  >
                    {unreadTotal > 99 ? "99+" : unreadTotal}
                  </span>
                ) : null}
              </span>
            </NavLink>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <NavLink
              to="/profile"
              className="cursor-pointer rounded-lg px-3 py-2 text-right transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 dark:hover:bg-white/10"
              aria-label="Към профил"
            >
              <div className="max-w-[180px] truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                {profile?.name ?? "Профил"}
              </div>

              <div className="max-w-[180px] truncate text-xs text-gray-600 dark:text-gray-300">
                {profile
                  ? `${profile.role === "owner" ? "Стопанин" : "Гледач"} • ${profile.region}`
                  : "Профилът не е зареден"}
              </div>
            </NavLink>

            <button
              type="button"
              onClick={() => {
                void handleLogout();
              }}
              className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 dark:border-white/10 dark:bg-neutral-900 dark:text-gray-200 dark:hover:bg-white/10"
            >
              Изход
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-gray-200 bg-white text-gray-800 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 dark:border-white/10 dark:bg-neutral-900 dark:text-gray-100 dark:hover:bg-white/10 lg:hidden"
            aria-label={mobileOpen ? "Затвори меню" : "Отвори меню"}
            aria-expanded={mobileOpen}
          >
            <span className="text-lg">{mobileOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            aria-label="Затвори меню"
            onClick={() => setMobileOpen(false)}
          />

          <div className="absolute right-4 top-[72px] w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-neutral-900">
            <div className="mb-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-neutral-800">
              <div className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                {profile?.name ?? "Профил"}
              </div>
              <div className="mt-1 truncate text-xs text-gray-600 dark:text-gray-300">
                {profile
                  ? `${profile.role === "owner" ? "Стопанин" : "Гледач"} • ${profile.region}`
                  : "Профилът не е зареден"}
              </div>
            </div>

            <nav className="space-y-2">
              <NavLink
                to="/"
                className={mobileLinkClass}
                end
                onClick={() => setMobileOpen(false)}
              >
                <span>Начало</span>
              </NavLink>

              <NavLink
                to="/pets"
                className={mobileLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                <span>Домашни любимци</span>
              </NavLink>

              <NavLink
                to="/caretakers"
                className={mobileLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                <span>Гледачи</span>
              </NavLink>

              <NavLink
                to="/chats"
                className={mobileLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                <span>Чатове</span>
                {unreadTotal > 0 ? (
                  <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
                    {unreadTotal > 99 ? "99+" : unreadTotal}
                  </span>
                ) : null}
              </NavLink>

              <NavLink
                to="/profile"
                className={mobileLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                <span>Профил</span>
              </NavLink>
            </nav>

            <div className="mt-3 border-t border-gray-200 pt-3 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  void handleLogout();
                }}
                className="w-full cursor-pointer rounded-xl border border-red-200 bg-white px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 dark:border-red-500/30 dark:bg-neutral-900 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                Изход
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}