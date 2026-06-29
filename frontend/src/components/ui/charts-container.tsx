/**
 * ChartsContainer component — responsive wrapper for Recharts charts.
 * Handles loading, empty, and error states for chart data.
 */

import { ResponsiveContainer } from "recharts";
import { BarChart2 } from "lucide-react";
import { Skeleton } from "./skeleton";
import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";
import { cn } from "@/utils/cn";

interface ChartsContainerProps {
  title?: string;
  subtitle?: string;
  height?: number;
  isLoading?: boolean;
  isEmpty?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

export function ChartsContainer({
  title,
  subtitle,
  height = 300,
  isLoading = false,
  isEmpty = false,
  error = null,
  onRetry,
  children,
  className,
  headerAction,
}: ChartsContainerProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-6 shadow-soft",
        className
      )}
    >
      {(title || headerAction) && (
        <div className="mb-4 flex items-start justify-between">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}

      <div style={{ height }}>
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : error ? (
          <ErrorState
            title="Chart data unavailable"
            message={error.message}
            onRetry={onRetry}
          />
        ) : isEmpty ? (
          <EmptyState
            icon={BarChart2}
            title="No data yet"
            description="Data will appear here once available."
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
