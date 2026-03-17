import { Dog, Heart } from "lucide-react";
import type { UserRole } from "../../types/user";

export function RolePicker({
  value,
  onChange,
}: {
  value: UserRole;
  onChange: (next: UserRole) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Роля
      </label>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => onChange("owner")}
          className="flex-1"
        >
          <div
            className={`p-4 border-2 rounded-lg text-center transition ${
              value === "owner"
                ? "border-orange-500 bg-orange-50"
                : "border-gray-200 hover:border-orange-300 hover:bg-orange-50"
            }`}
          >
            <Dog className="w-8 h-8 mx-auto mb-2" />
            <div className="font-medium">Стопанин</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChange("caretaker")}
          className="flex-1"
        >
          <div
            className={`p-4 border-2 rounded-lg text-center transition ${
              value === "caretaker"
                ? "border-orange-500 bg-orange-50"
                : "border-gray-200 hover:border-orange-300 hover:bg-orange-50"
            }`}
          >
            <Heart className="w-8 h-8 mx-auto mb-2" />
            <div className="font-medium">Гледач</div>
          </div>
        </button>
      </div>
    </div>
  );
}
