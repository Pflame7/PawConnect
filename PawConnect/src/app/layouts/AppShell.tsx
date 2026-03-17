import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { TopNav } from "./TopNav";
import { useMessageNotifications } from "../hooks/useMessageNotifications";
import { useAuth } from "../providers/useAuth";
import { getResolvedUserSettings } from "../../services/users";

function applyAppDarkMode(enabled: boolean): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.toggle("dark", enabled);
  document.documentElement.style.colorScheme = enabled ? "dark" : "light";
  document.body.classList.toggle("dark", enabled);
}

export function AppShell() {
  const { user, profile } = useAuth();

  useMessageNotifications();

  useEffect(() => {
    if (!user) {
      applyAppDarkMode(false);
      return;
    }

    const settings = getResolvedUserSettings(profile);
    applyAppDarkMode(settings.darkMode);
  }, [profile, user]);

  useEffect(() => {
    return () => {
      applyAppDarkMode(false);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 text-gray-900 transition-colors dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 dark:text-gray-100">
      <TopNav />

      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}