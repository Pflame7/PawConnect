import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
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
  resetLoading: boolean;
  resetMessage: string | null;
  resetError: string | null;
  resetCooldownSecondsLeft: number;
  showForgotPassword: boolean;

  name: string;
  email: string;
  region: string;
  password: string;
  confirmPassword: string;
  role: UserRole;

  onForgotPasswordClick: () => void;
  onPasswordReset: () => void;

  onChange: (
    patch: Partial<{
      name: string;
      email: string;
      region: string;
      password: string;
      confirmPassword: string;
      role: UserRole;
    }>,
  ) => void;

  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

function PasswordInput(props: {
  label: string;
  value: string;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {props.label}
      </label>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          placeholder={props.placeholder ?? "••••••••"}
          autoComplete={props.autoComplete}
          required={props.required}
          minLength={props.minLength}
        />

        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-3 flex items-center text-gray-500 transition hover:text-orange-500"
          aria-label={visible ? "Скрий паролата" : "Покажи паролата"}
        >
          {visible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  );
}

export function AuthCard(props: AuthCardProps) {
  const isLogin = props.mode === "login";
  const isResetCooldownActive = props.resetCooldownSecondsLeft > 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-40 via-white to-orange-80">
      <div className="w-full max-w-md rounded-3xl border border-orange-100 bg-white/95 p-8 shadow-[0_20px_60px_rgba(234,88,12,0.12)] backdrop-blur-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 text-5xl">🐾</div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            PawConnect
          </h1>
          <p className="text-gray-600">Свържете се с любители на домашни любимци</p>
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

        {props.resetMessage && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {props.resetMessage}
          </div>
        )}

        {props.resetError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {props.resetError}
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
              required
            />
          </div>

          {!isLogin && (
            <SearchableSelect
              label="Град"
              placeholder="Изберете град"
              value={props.region}
              options={BULGARIAN_CITIES}
              onChange={(value) => props.onChange({ region: value })}
            />
          )}

          <PasswordInput
            label="Парола"
            value={props.password}
            onChange={(value) => props.onChange({ password: value })}
            required
            minLength={6}
          />

          {isLogin && props.showForgotPassword && (
            <div className="rounded-2xl border border-orange-100 bg-orange-50/80 p-4">
              <div className="mb-2 text-sm font-medium text-gray-800">
                Забравена парола?
              </div>
              <p className="mb-3 text-sm leading-6 text-gray-600">
                Натисни бутона и ще ти изпратим имейл за смяна на паролата на
                въведения адрес.
              </p>

              <button
                type="button"
                onClick={props.onPasswordReset}
                disabled={props.resetLoading || isResetCooldownActive}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  props.resetLoading || isResetCooldownActive
                    ? "cursor-not-allowed bg-orange-300 text-white"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
              >
                {props.resetLoading
                  ? "Изпращаме..."
                  : isResetCooldownActive
                    ? `Изчакай ${props.resetCooldownSecondsLeft} сек.`
                    : "Изпрати имейл"}
              </button>
            </div>
          )}

          {isLogin && !props.showForgotPassword && props.error && (
            <button
              type="button"
              onClick={props.onForgotPasswordClick}
              className="text-sm font-medium text-orange-600 transition hover:text-orange-700 hover:underline"
            >
              Забравена парола?
            </button>
          )}

          {!isLogin && (
            <PasswordInput
              label="Повтори паролата"
              value={props.confirmPassword}
              onChange={(value) => props.onChange({ confirmPassword: value })}
              required
              minLength={6}
            />
          )}

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