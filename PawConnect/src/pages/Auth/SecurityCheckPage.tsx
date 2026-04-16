import { useEffect, useState, type FormEvent } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../../services/firebase";
import { useAuth } from "../../app/providers/useAuth";
import { updateUserSecurityCheck } from "../../services/users";

function forceLightMode(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "light";
  document.body.classList.remove("dark");
}

export default function SecurityCheckPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    forceLightMode();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!user?.email) {
      setError("Липсва активен потребител.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      await updateUserSecurityCheck(user.uid);

      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      setError("Паролата е грешна или проверката не можа да бъде завършена.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout(): Promise<void> {
    await signOut(auth);
    navigate("/auth?mode=login", { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-40 via-white to-orange-80 px-4">
      <div className="w-full max-w-md rounded-3xl border border-orange-100 bg-white/95 p-8 shadow-[0_20px_60px_rgba(234,88,12,0.12)] backdrop-blur-sm">
        <div className="mb-6 text-center">
          <div className="mb-4 text-5xl">🔐</div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Допълнителна проверка
          </h1>
          <p className="text-sm leading-6 text-gray-600">
            За по-голяма сигурност въведи паролата си отново, за да продължиш.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Парола
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-xl py-3 font-medium transition ${
              loading
                ? "cursor-not-allowed bg-orange-300 text-white"
                : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            {loading ? "Проверяваме..." : "Потвърди"}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Изход
          </button>
        </form>
      </div>
    </div>
  );
}