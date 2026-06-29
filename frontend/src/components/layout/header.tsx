/**
 * Application top header — search, theme, notifications, user menu.
 */

import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Moon, Sun, Monitor, Bell, ChevronDown, LogOut, User, Settings, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage, getInitials } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator } from "@/components/ui/dropdown";
import { useUIStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { useNotificationStore } from "@/store/notification-store";
import { useTheme } from "@/hooks/use-theme";
import { formatRelativeTime } from "@/utils/format";
import { cn } from "@/utils/cn";
import type { BreadcrumbItem } from "@/types";

// ---------------------------------------------------------------------------
// Breadcrumb
// ---------------------------------------------------------------------------

function HeaderBreadcrumb({ items }: { items?: BreadcrumbItem[] }) {
  const location = useLocation();

  const routeNames: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/chat": "AI Chat",
    "/documents": "Documents",
    "/analytics": "Analytics",
    "/monitoring": "Monitoring",
    "/evaluation": "Evaluation",
    "/cost": "Cost",
    "/guardrails": "Guardrails",
    "/settings": "Settings",
    "/profile": "Profile",
    "/admin": "Admin",
  };

  const currentName = items?.[0]?.label ?? routeNames[location.pathname] ?? "Page";

  return (
    <h1 className="text-sm font-semibold text-foreground truncate">{currentName}</h1>
  );
}

// ---------------------------------------------------------------------------
// Theme Toggle
// ---------------------------------------------------------------------------

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "light" as const, icon: Sun, label: "Light" },
    { value: "dark" as const, icon: Moon, label: "Dark" },
    { value: "system" as const, icon: Monitor, label: "System" },
  ];

  const CurrentIcon = options.find((o) => o.value === theme)?.icon ?? Monitor;

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change theme">
          <CurrentIcon className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-36">
        <DropdownLabel>Appearance</DropdownLabel>
        {options.map(({ value, icon: Icon, label }) => (
          <DropdownItem key={value} onClick={() => setTheme(value)} className="gap-2">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            {label}
            {theme === value && <Check className="ml-auto h-3.5 w-3.5 text-primary" aria-hidden="true" />}
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}

// ---------------------------------------------------------------------------
// Notification Panel
// ---------------------------------------------------------------------------

function NotificationPanel() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const [open, setOpen] = React.useState(false);

  const dotColors = {
    success: "bg-success",
    error: "bg-danger",
    warning: "bg-warning",
    info: "bg-primary",
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white" aria-hidden="true">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "absolute right-0 top-full z-40 mt-2 w-80 rounded-xl border border-border",
                "bg-popover shadow-modal overflow-hidden"
              )}
              role="dialog"
              aria-label="Notifications"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
                  {unreadCount > 0 && (
                    <Badge variant="default" className="text-2xs h-4 px-1.5">{unreadCount}</Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground">No notifications</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => { markAsRead(notif.id); }}
                      className={cn(
                        "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors",
                        "hover:bg-muted border-b border-border/50 last:border-0",
                        !notif.read && "bg-primary/3"
                      )}
                    >
                      <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dotColors[notif.type])} aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-medium text-foreground leading-snug", !notif.read && "font-semibold")}>
                          {notif.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground leading-snug line-clamp-2">
                          {notif.description}
                        </p>
                        <p className="mt-1 text-2xs text-muted-foreground/60">
                          {formatRelativeTime(notif.created_at)}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

export function Header({ breadcrumbs }: { breadcrumbs?: BreadcrumbItem[] }) {
  const { setMobileSidebarOpen } = useUIStore();
  const { user, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = React.useCallback(async () => {
    try {
      const { logout: apiLogout } = await import("@/services/auth-service");
      await apiLogout();
    } catch {
      // Best-effort — clear local state regardless
    } finally {
      // Clear all conversation data so the next user can't see this user's chats
      const { useChatStore } = await import("@/store/chat-store");
      useChatStore.setState({
        ownerId: null,
        conversations: [],
        activeConversationId: null,
        messages: {},
        isStreaming: false,
        error: null,
      });
      storeLogout();
      navigate("/login");
    }
  }, [storeLogout, navigate]);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 lg:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
        <HeaderBreadcrumb items={breadcrumbs} />
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <NotificationPanel />

        {user && (
          <Dropdown>
            <DropdownTrigger asChild>
              <button
                className="ml-1 flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
                aria-label="User menu"
                aria-haspopup="menu"
              >
                <Avatar size="sm">
                  {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.full_name} />}
                  <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                </Avatar>
                <span className="hidden text-xs font-medium text-foreground md:block max-w-24 truncate">
                  {user.full_name.split(" ")[0]}
                </span>
                <ChevronDown className="hidden h-3 w-3 text-muted-foreground md:block" aria-hidden="true" />
              </button>
            </DropdownTrigger>
            <DropdownContent align="end" className="w-56">
              <div className="px-3 py-2.5 border-b border-border mb-1">
                <p className="text-sm font-semibold text-foreground truncate">{user.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                <Badge variant="secondary" className="mt-1.5 text-2xs capitalize">{user.role}</Badge>
              </div>
              <DropdownItem asChild>
                <Link to="/profile" className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  Profile
                </Link>
              </DropdownItem>
              <DropdownItem asChild>
                <Link to="/settings" className="flex items-center gap-2">
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  Settings
                </Link>
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem destructive onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign out
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        )}
      </div>
    </header>
  );
}
