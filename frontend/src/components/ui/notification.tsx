/**
 * Notification bell component with badge for unread count.
 */

import { Bell } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/utils/cn";

interface NotificationBellProps {
  unreadCount?: number;
  onClick?: () => void;
  className?: string;
}

export function NotificationBell({
  unreadCount = 0,
  onClick,
  className,
}: NotificationBellProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("relative", className)}
      onClick={onClick}
      aria-label={
        unreadCount > 0
          ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
          : "Notifications"
      }
    >
      <Bell className="h-5 w-5" aria-hidden="true" />
      {unreadCount > 0 && (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white"
          aria-hidden="true"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Button>
  );
}
