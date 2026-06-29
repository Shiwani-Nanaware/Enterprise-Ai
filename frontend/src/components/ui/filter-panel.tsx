/**
 * FilterPanel component — collapsible filter tray for data views.
 */

import * as React from "react";
import { Filter } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./button";
import { Badge } from "./badge";
import { cn } from "@/utils/cn";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  multiple?: boolean;
}

interface FilterPanelProps {
  groups: FilterGroup[];
  value: Record<string, string | string[]>;
  onChange: (filters: Record<string, string | string[]>) => void;
  className?: string;
}

export function FilterPanel({ groups, value, onChange, className }: FilterPanelProps) {
  const [open, setOpen] = React.useState(false);

  const activeCount = Object.values(value).filter((v) =>
    Array.isArray(v) ? v.length > 0 : v !== ""
  ).length;

  const handleSelect = (groupId: string, optionValue: string, multiple?: boolean) => {
    const current = value[groupId];
    if (multiple) {
      const arr = Array.isArray(current) ? current : [];
      const next = arr.includes(optionValue)
        ? arr.filter((v) => v !== optionValue)
        : [...arr, optionValue];
      onChange({ ...value, [groupId]: next });
    } else {
      onChange({
        ...value,
        [groupId]: current === optionValue ? "" : optionValue,
      });
    }
  };

  const clearAll = () => {
    const cleared: Record<string, string | string[]> = {};
    groups.forEach((g) => {
      cleared[g.id] = g.multiple ? [] : "";
    });
    onChange(cleared);
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className={cn(activeCount > 0 && "border-primary text-primary")}
        leftIcon={<Filter className="h-3.5 w-3.5" aria-hidden="true" />}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        Filters
        {activeCount > 0 && (
          <Badge variant="default" className="ml-1 h-4 min-w-4 px-1 text-2xs">
            {activeCount}
          </Badge>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute right-0 top-full z-30 mt-2 min-w-[280px] rounded-xl border border-border",
              "bg-popover p-4 shadow-card"
            )}
            role="dialog"
            aria-label="Filter options"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Filters</p>
              {activeCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs">
                  Clear all
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.id}>
                  <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.options.map((opt) => {
                      const current = value[group.id];
                      const isSelected = Array.isArray(current)
                        ? current.includes(opt.value)
                        : current === opt.value;

                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleSelect(group.id, opt.value, group.multiple)}
                          className={cn(
                            "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                            "border",
                            isSelected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                          )}
                          aria-pressed={isSelected}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex justify-end">
              <Button size="sm" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
