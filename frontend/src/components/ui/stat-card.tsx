/**
 * StatCard — KPI metric card with trend indicator.
 */

import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { formatCompactNumber } from "@/utils/format";

type Trend = "up" | "down" | "neutral";

interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  trend?: Trend;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  prefix?: string;
  suffix?: string;
  className?: string;
}

const trendConfig: Record<Trend, { icon: LucideIcon; className: string }> = {
  up: { icon: TrendingUp, className: "text-success" },
  down: { icon: TrendingDown, className: "text-danger" },
  neutral: { icon: Minus, className: "text-muted-foreground" },
};

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  trend = "neutral",
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  prefix,
  suffix,
  className,
}: StatCardProps) {
  const { icon: TrendIcon, className: trendClass } = trendConfig[trend];

  const displayValue =
    typeof value === "number" ? formatCompactNumber(value) : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-soft",
        "hover:shadow-card transition-shadow duration-200",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground leading-tight">{title}</p>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            iconBg
          )}
          aria-hidden="true"
        >
          <Icon className={cn("h-4.5 w-4.5", iconColor)} />
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
        {prefix}
        {displayValue}
        {suffix && (
          <span className="text-sm font-medium text-muted-foreground ml-0.5">
            {suffix}
          </span>
        )}
      </p>

      {change !== undefined && (
        <div className="mt-2 flex items-center gap-1.5">
          <TrendIcon
            className={cn("h-3 w-3 shrink-0", trendClass)}
            aria-hidden="true"
          />
          <span className={cn("text-xs font-medium", trendClass)}>
            {change > 0 ? "+" : ""}
            {change}%
          </span>
          {changeLabel && (
            <span className="text-xs text-muted-foreground truncate">{changeLabel}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
