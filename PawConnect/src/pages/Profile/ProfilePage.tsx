import { useAuth } from "../../app/providers/useAuth";

export default function ProfilePage() {
  const { profile } = useAuth();

  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Профил</h1>

      {!profile ? (
        <p className="text-gray-700">Няма зареден профил.</p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border p-4">
            <div className="text-sm text-gray-600">Име</div>
            <div className="font-semibold">{profile.name}</div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-sm text-gray-600">Имейл</div>
            <div className="font-semibold">{profile.email}</div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-sm text-gray-600">Роля</div>
            <div className="font-semibold">
              {profile.role === "owner" ? "Стопанин" : "Гледач"}
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-sm text-gray-600">Град</div>
            <div className="font-semibold">{profile.region}</div>
          </div>
        </div>
      )}
    </div>
  );
}
