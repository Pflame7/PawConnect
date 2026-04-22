import type { Caretaker } from "../../types/caretaker";
import { ConnectButton } from "../chat/ConnectButton";

function ratingPill(rating: number) {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20">
      ⭐ {rating.toFixed(1)}
    </span>
  );
}

export function CaretakerCard({
  caretaker,
  onOpen,
}: {
  caretaker: Caretaker;
  onOpen: () => void;
}) {
  return (
    <article
      onClick={onOpen}
      className="cursor-pointer overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-[1px] hover:shadow-md focus-within:ring-2 focus-within:ring-orange-200 dark:bg-neutral-900 dark:ring-white/10"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl ring-1 ring-black/5 dark:ring-white/10">
            {caretaker.avatarUrl ? (
              <img
                src={caretaker.avatarUrl}
                alt={caretaker.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="grid h-full w-full place-items-center bg-gray-100 text-lg font-bold text-gray-700 dark:bg-neutral-800 dark:text-gray-200">
                {caretaker.name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-xl font-bold text-gray-900 dark:text-gray-100">
                {caretaker.name}
              </div>

              {caretaker.verified ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20">
                  Верифициран
                </span>
              ) : null}
            </div>

            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              📍 {caretaker.city}
              {caretaker.area ? `, ${caretaker.area}` : ""}
            </div>

            <div className="mt-3 line-clamp-2 break-words text-sm text-gray-700 dark:text-gray-200">
              {caretaker.shortBio}
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          {ratingPill(caretaker.rating)}
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            ({caretaker.reviewsCount})
          </div>
        </div>
      </div>

      {caretaker.services.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {caretaker.services.slice(0, 3).map((service) => (
            <span
              key={service}
              className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/20"
            >
              {service}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
        <div className="min-w-0 text-sm">
          <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            {caretaker.pricePerDay}
          </span>{" "}
          <span className="text-gray-600 dark:text-gray-300">€/ден</span>
        </div>

        <div
          onClick={(event) => {
            event.stopPropagation();
          }}
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
        >
          <ConnectButton
            otherUid={caretaker.id}
            className="shrink-0 cursor-pointer rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
            label="Свържи се"
          />
        </div>
      </div>
    </article>
  );
}