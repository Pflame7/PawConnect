import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../../services/firebase";
import { createUserProfile } from "../../services/users";
import type { UserRole } from "../../types/user";
import { AuthCard } from "../../components/auth/AuthCard";

type AuthMode = "login" | "register";

const PASSWORD_RESET_COOLDOWN_SECONDS = 60;
const PASSWORD_RESET_COOLDOWN_STORAGE_KEY = "pawconnect-password-reset-cooldown-until";

function toMode(value: string | null): AuthMode {
  return value === "register" ? "register" : "login";
}

function humanizeAuthError(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
      return "Грешен имейл или парола.";
    case "auth/email-already-in-use":
      return "Този имейл вече е регистриран.";
    case "auth/weak-password":
      return "Паролата трябва да е поне 6 символа.";
    case "auth/invalid-email":
      return "Невалиден имейл адрес.";
    case "auth/user-not-found":
      return "Няма потребител с такъв имейл.";
    case "auth/too-many-requests":
      return "Има твърде много опити. Опитай отново малко по-късно.";
    default:
      return "Възникна грешка. Опитай отново.";
  }
}

function forceLightMode(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "light";
  document.body.classList.remove("dark");
}

function readStoredCooldownUntil(): number | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(PASSWORD_RESET_COOLDOWN_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue) || parsedValue <= Date.now()) {
    window.localStorage.removeItem(PASSWORD_RESET_COOLDOWN_STORAGE_KEY);
    return null;
  }

  return parsedValue;
}

function storeCooldownUntil(untilMs: number): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    PASSWORD_RESET_COOLDOWN_STORAGE_KEY,
    String(untilMs),
  );
}

function clearStoredCooldownUntil(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(PASSWORD_RESET_COOLDOWN_STORAGE_KEY);
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const mode = useMemo(() => toMode(params.get("mode")), [params]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetCooldownUntil, setResetCooldownUntil] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("owner");

  useEffect(() => {
    forceLightMode();
  }, []);

  useEffect(() => {
    const storedCooldownUntil = readStoredCooldownUntil();

    if (storedCooldownUntil !== null) {
      setResetCooldownUntil(storedCooldownUntil);
    }
  }, []);

  useEffect(() => {
    if (resetCooldownUntil === null) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (Date.now() >= resetCooldownUntil) {
        setResetCooldownUntil(null);
        clearStoredCooldownUntil();
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [resetCooldownUntil]);

  const resetCooldownSecondsLeft =
    resetCooldownUntil === null
      ? 0
      : Math.max(0, Math.ceil((resetCooldownUntil - Date.now()) / 1000));

  function setMode(next: AuthMode): void {
    setParams((prev) => {
      prev.set("mode", next);
      return prev;
    });

    setError(null);
    setResetError(null);
    setResetMessage(null);
    setShowForgotPassword(false);
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setResetError(null);
    setResetMessage(null);

    if (mode === "register" && password !== confirmPassword) {
      setError("Двете пароли не съвпадат.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/", { replace: true });
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await createUserProfile({
        uid: cred.user.uid,
        name,
        email,
        region,
        role,
      });

      navigate("/", { replace: true });
    } catch (err: unknown) {
      console.error(err);

      let code = "";

      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        typeof (err as { code: unknown }).code === "string"
      ) {
        code = (err as { code: string }).code;
      }

      setError(humanizeAuthError(code));

      if (mode === "login" && code === "auth/invalid-credential") {
        setShowForgotPassword(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset(): Promise<void> {
    setResetError(null);
    setResetMessage(null);

    if (resetCooldownSecondsLeft > 0) {
      setResetError(
        `Можеш да изпратиш нов имейл след ${resetCooldownSecondsLeft} сек.`,
      );
      return;
    }

    if (!email.trim()) {
      setResetError("Въведи имейла си, за да ти изпратим линк за нова парола.");
      return;
    }

    setResetLoading(true);

    try {
      await sendPasswordResetEmail(auth, email.trim());

      const nextCooldownUntil =
        Date.now() + PASSWORD_RESET_COOLDOWN_SECONDS * 1000;

      setResetCooldownUntil(nextCooldownUntil);
      storeCooldownUntil(nextCooldownUntil);

      setResetMessage(
        "Ако този имейл има акаунт, изпратихме писмо за смяна на паролата.",
      );
      setShowForgotPassword(false);
    } catch (err: unknown) {
      console.error(err);

      let code = "";

      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        typeof (err as { code: unknown }).code === "string"
      ) {
        code = (err as { code: string }).code;
      }

      setResetError(humanizeAuthError(code));
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <AuthCard
      mode={mode}
      onModeChange={setMode}
      loading={loading}
      error={error}
      resetLoading={resetLoading}
      resetMessage={resetMessage}
      resetError={resetError}
      resetCooldownSecondsLeft={resetCooldownSecondsLeft}
      showForgotPassword={showForgotPassword}
      name={name}
      email={email}
      region={region}
      password={password}
      confirmPassword={confirmPassword}
      role={role}
      onForgotPasswordClick={() => {
        setResetError(null);
        setResetMessage(null);
        setShowForgotPassword(true);
      }}
      onPasswordReset={handlePasswordReset}
      onChange={(patch) => {
        if (patch.name !== undefined) setName(patch.name);

        if (patch.email !== undefined) {
          setEmail(patch.email);

          if (resetMessage) {
            setResetMessage(null);
          }

          if (resetError) {
            setResetError(null);
          }
        }

        if (patch.region !== undefined) setRegion(patch.region);
        if (patch.password !== undefined) setPassword(patch.password);

        if (patch.confirmPassword !== undefined) {
          setConfirmPassword(patch.confirmPassword);
        }

        if (patch.role !== undefined) setRole(patch.role);
      }}
      onSubmit={handleSubmit}
    />
  );
}