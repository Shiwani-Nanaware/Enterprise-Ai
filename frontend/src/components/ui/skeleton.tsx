/**
 * Skeleton loader component — content placeholder for async loading states.
 */

import { cn } from "@/utils/cn";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("shimmer rounded-md bg-muted", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

/** Skeleton card matching the StatCard dimensions */
function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <Skeleton className="mt-4 h-8 w-28" />
      <Skeleton className="mt-2 h-3 w-32" />
    </div>
  );
}

/** Skeleton row for table/list loading states */
function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}

export { Skeleton, StatCardSkeleton, TableRowSkeleton };
