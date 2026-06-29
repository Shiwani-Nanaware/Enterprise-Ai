/**
 * Input component — text input field with optional leading/trailing adornments.
 */

import * as React from "react";
import { cn } from "@/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Icon or element rendered at the start of the input */
  leftAdornment?: React.ReactNode;
  /** Icon or element rendered at the end of the input */
  rightAdornment?: React.ReactNode;
  /** Display the input in an error state */
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftAdornment, rightAdornment, error, ...props }, ref) => {
    if (leftAdornment || rightAdornment) {
      return (
        <div className="relative flex items-center">
          {leftAdornment && (
            <div className="pointer-events-none absolute left-3 flex items-center text-muted-foreground">
              {leftAdornment}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-10 w-full rounded-lg border border-input bg-background text-sm",
              "placeholder:text-muted-foreground",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "read-only:bg-muted",
              leftAdornment ? "pl-10" : "px-3",
              rightAdornment ? "pr-10" : "px-3",
              "py-2",
              error && "border-danger focus-visible:ring-danger",
              className
            )}
            ref={ref}
            aria-invalid={error ? "true" : undefined}
            {...props}
          />
          {rightAdornment && (
            <div className="absolute right-3 flex items-center text-muted-foreground">
              {rightAdornment}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm",
          "placeholder:text-muted-foreground",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "read-only:bg-muted",
          error && "border-danger focus-visible:ring-danger",
          className
        )}
        ref={ref}
        aria-invalid={error ? "true" : undefined}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
