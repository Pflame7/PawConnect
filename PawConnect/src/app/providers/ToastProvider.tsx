import { useCallback, useMemo, useState } from "react";
import {
  ToastContext,
  type ToastItem,
  type ToastContextValue,
} from "./toast-context";

function makeId(): string {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = makeId();
    const next: ToastItem = { id, ...toast };

    setItems((previous) => [next, ...previous].slice(0, 3));

    window.setTimeout(() => {
      setItems((previous) => previous.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  const value: ToastContextValue = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="fixed right-4 top-4 z-[9999] space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="w-[340px] overflow-hidden rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur transition dark:border-white/10 dark:bg-neutral-900/95"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-orange-100 text-base dark:bg-orange-500/15">
                🔔
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {item.title}
                </div>

                {item.message ? (
                  <div className="mt-1 text-sm leading-5 text-gray-600 dark:text-gray-300 truncate">
                    {item.message}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}