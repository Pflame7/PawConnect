import type { FormEvent } from "react";
import type { UserRole } from "../../types/user";
import { RolePicker } from "./RolePicker";

type AuthMode = "login" | "register";

export function AuthCard(props: {
  mode: AuthMode;
  onModeChange: (m: AuthMode) => void;
  loading: boolean;
  error: string | null;

  name: string;
  email: string;
  region: string;
  password: string;
  role: UserRole;

  onChange: (patch: Partial<{
    name: string;
    email: string;
    region: string;
    password: string;
    role: UserRole;
  }>) => void;

  onSubmit: (e: FormEvent) => void;
}) {
  const isLogin = props.mode === "login";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🐾</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">PawConnect</h1>
          <p className="text-gray-600">Свържете се с любители на кучета</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => props.onModeChange("login")}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              isLogin ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            Вход
          </button>
          <button
            type="button"
            onClick={() => props.onModeChange("register")}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              !isLogin ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            Регистрация
          </button>
        </div>

        {props.error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {props.error}
          </div>
        )}

        <form className="space-y-4" onSubmit={props.onSubmit}>
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Име
              </label>
              <input
                type="text"
                value={props.name}
                onChange={(e) => props.onChange({ name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Вашето име"
                autoComplete="name"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Имейл
            </label>
            <input
              type="email"
              value={props.email}
              onChange={(e) => props.onChange({ email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="email@example.com"
              autoComplete="email"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Област
              </label>
              <select
                value={props.region}
                onChange={(e) => props.onChange({ region: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Изберете област</option>
                <option value="София">София</option>
                <option value="Пловдив">Пловдив</option>
                <option value="Варна">Варна</option>
                <option value="Бургас">Бургас</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Парола
            </label>
            <input
              type="password"
              value={props.password}
              onChange={(e) => props.onChange({ password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
              minLength={6}
            />
          </div>

          {!isLogin && (
            <RolePicker value={props.role} onChange={(role) => props.onChange({ role })} />
          )}

          <button
            type="submit"
            disabled={props.loading}
            className={`w-full py-3 rounded-lg font-medium transition ${
              props.loading
                ? "bg-blue-400 text-white cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {props.loading ? "Моля, изчакай..." : isLogin ? "Вход" : "Регистрация"}
          </button>
        </form>
      </div>
    </div>
  );
}
