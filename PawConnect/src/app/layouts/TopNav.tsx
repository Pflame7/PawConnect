import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase";
import { useAuth } from "../providers/useAuth";

function linkClass({ isActive }: { isActive: boolean }) {
  return `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
  }`;
}

export function TopNav() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  async function handleLogout() {
    await signOut(auth);
    navigate("/auth?mode=login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        {/* 1) Logo + name clickable to home */}
        <NavLink
          to="/"
          className="flex items-center gap-3 rounded-lg px-2 py-1 transition hover:bg-gray-100"
          aria-label="PawConnect - начало"
        >
          <span className="text-2xl">🐾</span>
          <span className="text-lg font-bold text-gray-900">PawConnect</span>
        </NavLink>

        {/* 2) Tabs in the wanted order */}
        <nav className="flex items-center gap-2">
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
            Чатове
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          {/* 3) Clickable profile block -> /profile (no visible borders) */}
          <NavLink
            to="/profile"
            className="hidden rounded-lg px-3 py-2 text-right transition hover:bg-gray-100 sm:block"
            aria-label="Към профил"
          >
            <div className="text-sm font-semibold text-gray-900">
              {profile?.name ?? "Профил"}
            </div>
            <div className="text-xs text-gray-600">
              {profile
                ? `${profile.role === "owner" ? "Стопанин" : "Гледач"} • ${
                    profile.region
                  }`
                : "Профилът не е зареден"}
            </div>
          </NavLink>

          <button
            onClick={handleLogout}
            className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
          >
            Изход
          </button>
        </div>
      </div>
    </header>
  );
}
