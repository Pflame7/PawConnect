import { useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../../services/firebase";
import { createUserProfile } from "../../services/users";
import type { UserRole } from "../../types/user";
import { AuthCard } from "../../components/auth/AuthCard";

type AuthMode = "login" | "register";

function toMode(value: string | null): AuthMode {
  return value === "register" ? "register" : "login";
}

function humanizeAuthError(code: string) {
  switch (code) {
    case "auth/invalid-credential":
      return "Грешен имейл или парола.";
    case "auth/email-already-in-use":
      return "Този имейл вече е регистриран.";
    case "auth/weak-password":
      return "Паролата трябва да е поне 6 символа.";
    case "auth/invalid-email":
      return "Невалиден имейл адрес.";
    default:
      return "Възникна грешка. Опитай отново.";
  }
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const mode = useMemo(() => toMode(params.get("mode")), [params]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("owner");

  function setMode(next: AuthMode) {
    setParams((prev) => {
      prev.set("mode", next);
      return prev;
    });
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/", { replace: true });
        return;
      }

      // register
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await createUserProfile({
        uid: cred.user.uid,
        name,
        email,
        region,
        role,
      });

      navigate("/", { replace: true });
    }
     catch (err: unknown) {
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
    }

     finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      mode={mode}
      onModeChange={setMode}
      loading={loading}
      error={error}
      name={name}
      email={email}
      region={region}
      password={password}
      role={role}
      onChange={(patch) => {
        if (patch.name !== undefined) setName(patch.name);
        if (patch.email !== undefined) setEmail(patch.email);
        if (patch.region !== undefined) setRegion(patch.region);
        if (patch.password !== undefined) setPassword(patch.password);
        if (patch.role !== undefined) setRole(patch.role);
      }}
      onSubmit={handleSubmit}
    />
  );
}
