/**
 * Badge component — compact status label.
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary dark:bg-primary/20",
        secondary: "bg-muted text-muted-foreground",
        destructive: "bg-danger/10 text-danger dark:bg-danger/20",
        outline: "border border-border text-foreground bg-transparent",
        success: "bg-success/10 text-success dark:bg-success/20",
        warning: "bg-warning/10 text-warning-600 dark:bg-warning/20 dark:text-warning",
        accent: "bg-accent/10 text-accent-600 dark:bg-accent/20 dark:text-accent-400",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" aria-hidden="true" />
      )}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
