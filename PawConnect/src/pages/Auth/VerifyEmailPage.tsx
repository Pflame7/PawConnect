import { useEffect, useState } from "react";
import { sendEmailVerification, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../../services/firebase";
import { useAuth } from "../../app/providers/useAuth";
import { markUserEmailVerified, updateUserSecurityCheck } from "../../services/users";

function forceLightMode(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "light";
  document.body.classList.remove("dark");
}

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const { user, isEmailVerified, refreshUser } = useAuth();

  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    forceLightMode();
  }, []);

  async function handleResend(): Promise<void> {
    if (!user) {
      return;
    }

    setSending(true);
    setMessage(null);
    setError(null);

    try {
      await sendEmailVerification(user);
      setMessage("Изпратихме нов имейл за потвърждение.");
    } catch (err) {
      console.error(err);
      setError("Не успяхме да изпратим нов имейл. Опитай отново след малко.");
    } finally {
      setSending(false);
    }
  }

  async function handleCheckVerification(): Promise<void> {
    if (!user) {
      return;
    }

    setChecking(true);
    setMessage(null);
    setError(null);

    try {
      await refreshUser();

      if (!auth.currentUser?.emailVerified) {
        setError("Имейлът все още не е потвърден. Провери пощата си и натисни линка.");
        return;
      }

      await markUserEmailVerified(user.uid);
      await updateUserSecurityCheck(user.uid);

      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      setError("Не успяхме да обновим статуса. Опитай отново.");
    } finally {
      setChecking(false);
    }
  }

  async function handleLogout(): Promise<void> {
    await signOut(auth);
    navigate("/auth?mode=login", { replace: true });
  }

  const email = user?.email ?? "вашия имейл";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-40 via-white to-orange-80 px-4">
      <div className="w-full max-w-xl rounded-3xl border border-orange-100 bg-white/95 p-8 shadow-[0_20px_60px_rgba(234,88,12,0.12)] backdrop-blur-sm">
        <div className="mb-6 text-center">
          <div className="mb-4 text-5xl">📧</div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Потвърди имейла си
          </h1>
          <p className="text-sm leading-6 text-gray-600">
            Изпратихме линк за потвърждение на{" "}
            <span className="font-semibold text-gray-800">{email}</span>.
            Отвори пощата си, натисни линка и след това се върни тук.
          </p>
        </div>

        {isEmailVerified && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Имейлът вече е потвърден. Натисни бутона по-долу, за да продължиш.
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleCheckVerification}
            disabled={checking}
            className={`w-full rounded-2xl py-3 font-medium transition ${
              checking
                ? "cursor-not-allowed bg-orange-300 text-white"
                : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            {checking ? "Проверяваме..." : "Проверих имейла си"}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={sending}
            className={`w-full rounded-2xl border py-3 font-medium transition ${
              sending
                ? "cursor-not-allowed border-orange-200 bg-orange-50 text-orange-300"
                : "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
            }`}
          >
            {sending ? "Изпращаме..." : "Изпрати отново имейла"}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Назад към вход
          </button>
        </div>
      </div>
    </div>
  );
}