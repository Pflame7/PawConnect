import type { Caretaker } from "../../types/caretaker";

function ratingPill(rating: number) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-100">
      ⭐ {rating.toFixed(1)}
    </span>
  );
}

export function CaretakerCard({
  caretaker,
  onOpen,
  onConnect,
}: {
  caretaker: Caretaker;
  onOpen: () => void;
  onConnect: () => void;
}) {
  return (
    <article
      onClick={onOpen}
      className="cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition
                 hover:shadow-md hover:-translate-y-[1px]
                 focus-within:ring-2 focus-within:ring-orange-200"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <img
              src={caretaker.avatarUrl}
              alt={caretaker.name}
              className="h-12 w-12 rounded-xl object-cover ring-1 ring-black/5"
            />

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="truncate text-sm font-semibold text-gray-900">
                  {caretaker.name}
                </div>
                {caretaker.verified && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
                    Верифициран
                  </span>
                )}
              </div>

              <div className="mt-1 text-xs text-gray-600">
                📍 {caretaker.city}
                {caretaker.area ? `, ${caretaker.area}` : ""}
              </div>

              <div className="mt-2 text-xs text-gray-700 line-clamp-2">
                {caretaker.shortBio}
              </div>
            </div>
          </div>

          <div className="shrink-0">
            {ratingPill(caretaker.rating)}{" "}
            <span className="text-xs text-gray-500">
              ({caretaker.reviewsCount})
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {caretaker.services.slice(0, 3).map((s) => (
            <span
              key={s}
              className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* ✅ по-мека линия + не е edge-to-edge */}
      <div className="px-5">
        <div className="h-px w-full bg-gray-200/70" />
      </div>

      <div className="flex items-center justify-between px-5 py-4">
        <div className="text-sm">
          <span className="text-2xl font-bold text-gray-900">
            {caretaker.pricePerDay}
          </span>{" "}
          <span className="text-gray-600">лв/ден</span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onConnect();
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm
                     transition hover:bg-orange-600 active:scale-[0.99]
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
        >
          💬 Свържи се
        </button>
      </div>
    </article>
  );
}
