import { useAuth } from "../../app/providers/useAuth";


export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-zinc-900">Home (Dashboard)</h1>
      <p className="text-sm text-zinc-600">
        Влязъл си като: <span className="font-medium">{user?.email}</span>
      </p>
    </div>
  );
}
