import type { Caretaker } from "../../types/caretaker";
import { ConnectButton } from "../chat/ConnectButton";

function ratingPill(rating: number) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20">
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
      className="cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-[1px] hover:shadow-md focus-within:ring-2 focus-within:ring-orange-200 dark:bg-neutral-900 dark:ring-white/10"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <img
              src={caretaker.avatarUrl}
              alt={caretaker.name}
              className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-black/5 dark:ring-white/10"
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {caretaker.name}
                </div>

                {caretaker.verified ? (
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20">
                    Верифициран
                  </span>
                ) : null}
              </div>

              <div className="mt-1 truncate text-xs text-gray-600 dark:text-gray-300">
                📍 {caretaker.city}
                {caretaker.area ? `, ${caretaker.area}` : ""}
              </div>

              <div className="mt-2 max-h-20 overflow-y-auto break-words pr-1 text-xs text-gray-700 dark:text-gray-200">
                {caretaker.shortBio}
              </div>
            </div>
          </div>

          <div className="shrink-0 self-start text-right">
            {ratingPill(caretaker.rating)}
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              ({caretaker.reviewsCount})
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {caretaker.services.slice(0, 3).map((service) => (
            <span
              key={service}
              className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/20"
            >
              {service}
            </span>
          ))}
        </div>
      </div>

      <div className="px-5">
        <div className="h-px w-full bg-gray-200/70 dark:bg-white/10" />
      </div>

      <div className="flex items-center justify-between px-5 py-4">
        <div className="text-sm">
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
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
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
            label="Свържи се"
          />
        </div>
      </div>
    </article>
  );
}