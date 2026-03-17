import type { FormEvent } from "react";
import type { UserRole } from "../../types/user";
import { RolePicker } from "./RolePicker";
import SearchableSelect from "../ui/SearchableSelect";
import { BULGARIAN_CITIES } from "../../constants/formOptions";

type AuthMode = "login" | "register";

type AuthCardProps = {
  mode: AuthMode;
  onModeChange: (m: AuthMode) => void;
  loading: boolean;
  error: string | null;

  name: string;
  email: string;
  region: string;
  password: string;
  role: UserRole;

  onChange: (
    patch: Partial<{
      name: string;
      email: string;
      region: string;
      password: string;
      role: UserRole;
    }>
  ) => void;

  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export function AuthCard(props: AuthCardProps) {
  const isLogin = props.mode === "login";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-40 via-white to-orange-80">
      <div className="w-full max-w-md rounded-3xl border border-orange-100 bg-white/95 p-8 shadow-[0_20px_60px_rgba(234,88,12,0.12)] backdrop-blur-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 text-5xl">🐾</div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">PawConnect</h1>
          <p className="text-gray-600">Свържете се с любители на кучета</p>
        </div>

        <div className="mb-6 flex gap-2 rounded-2xl bg-orange-50 p-1">
          <button
            type="button"
            onClick={() => props.onModeChange("login")}
            className={`flex-1 rounded-xl px-4 py-2.5 font-medium transition ${
              isLogin
                ? "bg-orange-500 text-white shadow-sm"
                : "text-gray-700 hover:bg-orange-100"
            }`}
          >
            Вход
          </button>

          <button
            type="button"
            onClick={() => props.onModeChange("register")}
            className={`flex-1 rounded-xl px-4 py-2.5 font-medium transition ${
              !isLogin
                ? "bg-orange-500 text-white shadow-sm"
                : "text-gray-700 hover:bg-orange-100"
            }`}
          >
            Регистрация
          </button>
        </div>

        {props.error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {props.error}
          </div>
        )}

        <form className="space-y-4" onSubmit={props.onSubmit}>
          {!isLogin && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Име
              </label>
              <input
                type="text"
                value={props.name}
                onChange={(e) => props.onChange({ name: e.target.value })}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                placeholder="Вашето име"
                autoComplete="name"
                required
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Имейл
            </label>
            <input
              type="email"
              value={props.email}
              onChange={(e) => props.onChange({ email: e.target.value })}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              placeholder="email@example.com"
              autoComplete="email"
              required
            />
          </div>

          {!isLogin && (
            <SearchableSelect
              label="Град"
              placeholder="Изберете град"
              value={props.region}
              options={BULGARIAN_CITIES}
              onChange={(selectedCity) =>
                props.onChange({ region: selectedCity })
              }
              emptyMessage="Няма намерени градове"
            />
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Парола
            </label>
            <input
              type="password"
              value={props.password}
              onChange={(e) => props.onChange({ password: e.target.value })}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              placeholder="••••••••"
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
              minLength={6}
            />
          </div>

          {!isLogin && (
            <RolePicker
              value={props.role}
              onChange={(role) => props.onChange({ role })}
            />
          )}

          <button
            type="submit"
            disabled={props.loading}
            className={`w-full rounded-xl py-3 font-medium transition ${
              props.loading
                ? "cursor-not-allowed bg-orange-300 text-white"
                : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            {props.loading
              ? "Моля, изчакай..."
              : isLogin
              ? "Вход"
              : "Регистрация"}
          </button>
        </form>
      </div>
    </div>
  );
}