/**
 * Application footer.
 */

import { cn } from "@/utils/cn";

export function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "flex shrink-0 items-center justify-between px-6 py-2.5",
        "border-t border-border bg-card/50 text-xs text-muted-foreground",
        className
      )}
      role="contentinfo"
    >
      <span>© {new Date().getFullYear()} Enterprise AI Knowledge Assistant</span>
      <div className="flex items-center gap-4">
        <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
        <a href="#" className="hover:text-foreground transition-colors">Terms</a>
        <span className="text-muted-foreground/40">v1.0.0</span>
      </div>
    </footer>
  );
}
