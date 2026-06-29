/**
 * LoadingSpinner component — animated spinner for async operations.
 */

import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

interface LoadingSpinnerProps {
  /** Size in Tailwind units. Defaults to 6 (h-6 w-6). */
  size?: number;
  /** Additional class names */
  className?: string;
  /** Accessible label */
  label?: string;
}

export function LoadingSpinner({
  size = 6,
  className,
  label = "Loading...",
}: LoadingSpinnerProps) {
  return (
    <span role="status" aria-label={label} className="inline-flex">
      <Loader2
        className={cn(`h-${size} w-${size} animate-spin text-primary`, className)}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

interface PageLoadingProps {
  label?: string;
}

export function PageLoading({ label = "Loading..." }: PageLoadingProps) {
  return (
    <div
      className="flex h-full min-h-[400px] w-full items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size={8} />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
