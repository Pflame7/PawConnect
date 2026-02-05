import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../app/providers/useAuth";

export default function RequireAuth() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-sm text-zinc-600">
        Зареждане…
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  return <Outlet />;
}
