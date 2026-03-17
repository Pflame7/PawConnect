import { useMemo, useRef, useState } from "react";

type SelectOption = {
  value: string;
  label: string;
};

type SearchableSelectProps = {
  label?: string;
  placeholder?: string;
  value: string;
  options: readonly string[] | readonly SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  emptyMessage?: string;
  searchable?: boolean;
};

function isOptionObject(option: string | SelectOption): option is SelectOption {
  return typeof option === "object" && option !== null;
}

export default function SearchableSelect({
  label,
  placeholder = "Изберете...",
  value,
  options,
  onChange,
  disabled = false,
  emptyMessage = "Няма резултати",
  searchable = true,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const normalizedOptions = useMemo<SelectOption[]>(() => {
    return options.map((option) =>
      isOptionObject(option) ? option : { value: option, label: option },
    );
  }, [options]);

  const selectedOption = useMemo(() => {
    return normalizedOptions.find((option) => option.value === value) ?? null;
  }, [normalizedOptions, value]);

  const displayValue =
    isOpen && searchable ? query : (selectedOption?.label ?? value);

  const filteredOptions = useMemo(() => {
    if (!searchable) {
      return normalizedOptions;
    }

    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return normalizedOptions;
    }

    return normalizedOptions.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery),
    );
  }, [normalizedOptions, query, searchable]);

  function handleSelect(option: SelectOption): void {
    onChange(option.value);
    setQuery("");
    setIsOpen(false);
  }

  function handleOpen(): void {
    if (disabled) return;

    setIsOpen(true);

    if (searchable) {
      setQuery("");
    }
  }

  function handleToggle(): void {
    if (disabled) return;

    setIsOpen((previous) => {
      const next = !previous;

      if (next && searchable) {
        setQuery("");
      }

      return next;
    });
  }

  function handleBlur(event: React.FocusEvent<HTMLDivElement>): void {
    const nextFocused = event.relatedTarget;

    if (
      wrapperRef.current &&
      nextFocused instanceof Node &&
      wrapperRef.current.contains(nextFocused)
    ) {
      return;
    }

    setIsOpen(false);
    setQuery("");
  }

  return (
    <div className="w-full" ref={wrapperRef} onBlur={handleBlur}>
      {label ? (
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      ) : null}

      <div className="relative">
        <input
          type="text"
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={!searchable}
          onFocus={handleOpen}
          onClick={handleOpen}
          onChange={(event) => {
            if (!searchable) {
              return;
            }

            setQuery(event.target.value);
            setIsOpen(true);
          }}
          className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-white/10 dark:bg-neutral-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:disabled:bg-neutral-800"
        />

        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className="absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400"
          aria-label="Отвори меню"
        >
          ▼
        </button>

        {isOpen && !disabled ? (
          <div className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-white/10 dark:bg-neutral-900">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(option)}
                  className={`block w-full px-4 py-3 text-left text-sm transition hover:bg-orange-50 dark:hover:bg-orange-500/10 ${
                    option.value === value
                      ? "bg-orange-100 font-medium dark:bg-orange-500/15"
                      : "text-gray-700 dark:text-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                {emptyMessage}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}