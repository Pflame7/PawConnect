import { Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "../../pages/Auth/AuthPage";
import { useAuth } from "../providers/useAuth";
import { AppShell } from "../layouts/AppShell";

import HomePage from "../../pages/Home/HomePage";
import PetsPage from "../../pages/Pets/PetsPage";
import ChatsPage from "../../pages/Chats/ChatsPage";
import ProfilePage from "../../pages/Profile/ProfilePage";
import CareTakersPage from "../../pages/CareTakers/CareTakersPage";
import PetDetailsPage from "../../pages/Pets/PetDetailsPage";
import CaretakerDetailsPage from "../../pages/CareTakers/CaretakerDetailsPage";




function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Зареждане...
      </div>
    );
  }

  if (!user) return <Navigate to="/auth?mode=login" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />

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
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

