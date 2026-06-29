/**
 * Search input component with debounce support.
 */

import { Search as SearchIcon, X } from "lucide-react";
import { useState, useCallback } from "react";
import { Input } from "./input";
import { cn } from "@/utils/cn";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  debounceMs?: number;
  className?: string;
  defaultValue?: string;
}

export function Search({
  placeholder = "Search...",
  onSearch,
  debounceMs = 300,
  className,
  defaultValue = "",
}: SearchProps) {
  const [value, setValue] = useState(defaultValue);
  const debouncedValue = useDebounce(value, debounceMs);

  // Fire onSearch when debounced value changes
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
    },
    []
  );

  // Propagate debounced changes
  useState(() => {
    onSearch(debouncedValue);
  });

  const handleClear = () => {
    setValue("");
    onSearch("");
  };

  return (
    <Input
      type="search"
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      className={cn("min-w-0", className)}
      leftAdornment={<SearchIcon className="h-4 w-4" aria-hidden="true" />}
      rightAdornment={
        value ? (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : null
      }
      aria-label={placeholder}
    />
  );
}
