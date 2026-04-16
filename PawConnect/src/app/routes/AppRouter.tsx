import { Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "../../pages/Auth/AuthPage";
import VerifyEmailPage from "../../pages/Auth/VerifyEmailPage";
import SecurityCheckPage from "../../pages/Auth/SecurityCheckPage";
import { useAuth } from "../providers/useAuth";
import { AppShell } from "../layouts/AppShell";

import HomePage from "../../pages/Home/HomePage";
import PetsPage from "../../pages/Pets/PetsPage";
import ChatsPage from "../../pages/Chats/ChatsPage";
import ProfilePage from "../../pages/Profile/ProfilePage";
import CareTakersPage from "../../pages/CareTakers/CareTakersPage";
import PetDetailsPage from "../../pages/Pets/PetDetailsPage";
import CaretakerDetailsPage from "../../pages/CareTakers/CaretakerDetailsPage";
import SettingsPage from "../../pages/Settings/SettingsPage";

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading, isEmailVerified, needsSecurityCheck } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-600">
        Зареждане...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?mode=login" replace />;
  }

  if (!isEmailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (needsSecurityCheck) {
    return <Navigate to="/security-check" replace />;
  }

  return <>{children}</>;
}

function PublicAuthOnly({ children }: { children: React.ReactNode }) {
  const { user, loading, isEmailVerified, needsSecurityCheck } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-600">
        Зареждане...
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  if (!isEmailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (needsSecurityCheck) {
    return <Navigate to="/security-check" replace />;
  }

  return <Navigate to="/" replace />;
}

function VerifyEmailGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isEmailVerified, needsSecurityCheck } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-600">
        Зареждане...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?mode=login" replace />;
  }

  if (isEmailVerified && needsSecurityCheck) {
    return <Navigate to="/security-check" replace />;
  }

  if (isEmailVerified) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function SecurityCheckGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isEmailVerified, needsSecurityCheck } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-600">
        Зареждане...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?mode=login" replace />;
  }

  if (!isEmailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (!needsSecurityCheck) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/auth"
        element={
          <PublicAuthOnly>
            <AuthPage />
          </PublicAuthOnly>
        }
      />

      <Route
        path="/verify-email"
        element={
          <VerifyEmailGuard>
            <VerifyEmailPage />
          </VerifyEmailGuard>
        }
      />

      <Route
        path="/security-check"
        element={
          <SecurityCheckGuard>
            <SecurityCheckPage />
          </SecurityCheckGuard>
        }
      />

      <Route
        path="/"
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="pets" element={<PetsPage />} />
        <Route path="pets/:petId" element={<PetDetailsPage />} />
        <Route path="caretakers" element={<CareTakersPage />} />
        <Route path="caretakers/:caretakerId" element={<CaretakerDetailsPage />} />
        <Route path="chats" element={<ChatsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}