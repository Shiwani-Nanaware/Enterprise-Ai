/**
 * Toast notification system — global toast provider and hooks.
 * Lightweight implementation without Radix UI Toast for full control.
 */

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { create } from "zustand";
import { cn } from "@/utils/cn";
import type { ToastType } from "@/types";

// ---------------------------------------------------------------------------
// Toast Store
// ---------------------------------------------------------------------------

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration: number;
}

interface ToastStore {
  toasts: ToastItem[];
  add: (toast: Omit<ToastItem, "id">) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
  },
  remove: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useToast() {
  const { add } = useToastStore();

  return {
    toast: (options: Omit<ToastItem, "id" | "duration"> & { duration?: number }) =>
      add({ duration: 4000, ...options }),
    success: (title: string, description?: string) =>
      add({ type: "success", title, description, duration: 4000 }),
    error: (title: string, description?: string) =>
      add({ type: "error", title, description, duration: 5000 }),
    warning: (title: string, description?: string) =>
      add({ type: "warning", title, description, duration: 4000 }),
    info: (title: string, description?: string) =>
      add({ type: "info", title, description, duration: 3500 }),
  };
}

// ---------------------------------------------------------------------------
// Toast Item Component
// ---------------------------------------------------------------------------

const toastConfig: Record<ToastType, { icon: React.ElementType; className: string }> = {
  success: {
    icon: CheckCircle2,
    className: "border-success/20 bg-success/5 dark:bg-success/10",
  },
  error: {
    icon: XCircle,
    className: "border-danger/20 bg-danger/5 dark:bg-danger/10",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-warning/20 bg-warning/5 dark:bg-warning/10",
  },
  info: {
    icon: Info,
    className: "border-primary/20 bg-primary/5 dark:bg-primary/10",
  },
};

const iconColors: Record<ToastType, string> = {
  success: "text-success",
  error: "text-danger",
  warning: "text-warning",
  info: "text-primary",
};

function ToastItem({ toast, onRemove }: { toast: ToastItem; onRemove: () => void }) {
  const { icon: Icon, className } = toastConfig[toast.type];

  React.useEffect(() => {
    const timer = setTimeout(onRemove, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.duration, onRemove]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 64, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 64, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-card",
        "bg-card text-card-foreground",
        className
      )}
    >
      <Icon className={cn("mt-0.5 h-4.5 w-4.5 shrink-0", iconColors[toast.type])} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{toast.description}</p>
        )}
      </div>
      <button
        onClick={onRemove}
        className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Toast Container (render at app root)
// ---------------------------------------------------------------------------

export function ToastContainer() {
  const { toasts, remove } = useToastStore();

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => remove(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}
