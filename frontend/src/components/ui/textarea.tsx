/**
 * Textarea component — auto-resize textarea with character count support.
 */

import * as React from "react";
import { cn } from "@/utils/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  maxLength?: number;
  showCount?: boolean;
  autoResize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, maxLength, showCount, autoResize, onChange, value, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    const combinedRef = (ref as React.RefObject<HTMLTextAreaElement>) ?? internalRef;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize && combinedRef.current) {
        combinedRef.current.style.height = "auto";
        combinedRef.current.style.height = `${combinedRef.current.scrollHeight}px`;
      }
      onChange?.(e);
    };

    const charCount = typeof value === "string" ? value.length : 0;

    return (
      <div className="relative w-full">
        <textarea
          ref={combinedRef}
          value={value}
          onChange={handleChange}
          maxLength={maxLength}
          className={cn(
            "flex w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm",
            "placeholder:text-muted-foreground leading-relaxed",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50 resize-none",
            "read-only:bg-muted",
            error && "border-danger focus-visible:ring-danger",
            className
          )}
          aria-invalid={error ? "true" : undefined}
          {...props}
        />
        {showCount && maxLength && (
          <p
            className={cn(
              "absolute bottom-2 right-3 text-xs text-muted-foreground",
              charCount >= maxLength && "text-danger"
            )}
            aria-live="polite"
          >
            {charCount}/{maxLength}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
