/**
 * Application sidebar — premium collapsible navigation.
 */

import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, MessageSquare, FileText, BarChart3,
  Activity, FlaskConical, DollarSign, Shield, Settings,
  User, Users, ChevronLeft, ChevronRight, Bot,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useUIStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { Avatar, AvatarFallback, AvatarImage, getInitials } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { NavItem } from "@/types";

const primaryNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI Chat", href: "/chat", icon: MessageSquare, badge: "New" },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
];

const secondaryNavItems: NavItem[] = [
  { label: "Monitoring", href: "/monitoring", icon: Activity },
  { label: "Evaluation", href: "/evaluation", icon: FlaskConical },
  { label: "Cost", href: "/cost", icon: DollarSign },
  { label: "Guardrails", href: "/guardrails", icon: Shield },
];

const adminNavItems: NavItem[] = [
  { label: "Admin", href: "/admin", icon: Users, requiresRole: ["admin", "super_admin"] },
];

const accountNavItems: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Profile", href: "/profile", icon: User },
];

interface SidebarNavItemProps {
  item: NavItem;
  collapsed: boolean;
}

function SidebarNavItem({ item, collapsed }: SidebarNavItemProps) {
  const location = useLocation();
  const isActive =
    location.pathname === item.href ||
    (item.href !== "/" && location.pathname.startsWith(item.href));

  return (
    <Link
      to={item.href}
      aria-label={collapsed ? item.label : undefined}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
        "transition-all duration-150 select-none",
        isActive
          ? "bg-primary/10 text-primary dark:bg-primary/20"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-indicator"
          className="absolute left-0 h-full w-0.5 rounded-full bg-primary"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}

      <item.icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )}
        aria-hidden="true"
      />

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            key="label"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 truncate"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {item.badge !== undefined && !collapsed && (
        <Badge variant="accent" className="ml-auto text-2xs py-0 px-1.5 h-4">
          {item.badge}
        </Badge>
      )}

      {collapsed && (
        <div
          role="tooltip"
          className={cn(
            "pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap",
            "rounded-lg px-2.5 py-1.5 text-xs font-medium shadow-card",
            "bg-foreground text-background",
            "opacity-0 transition-opacity group-hover:opacity-100"
          )}
        >
          {item.label}
        </div>
      )}
    </Link>
  );
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 64 : 256 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex h-full flex-col border-r border-border bg-card overflow-hidden"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-3 border-b border-border px-4",
          sidebarCollapsed && "justify-center px-2"
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-accent-500 shadow-glow/20">
          <Bot className="h-4 w-4 text-white" aria-hidden="true" />
        </div>
        <AnimatePresence initial={false}>
          {!sidebarCollapsed && (
            <motion.div
              key="logo-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="min-w-0"
            >
              <p className="truncate text-sm font-bold text-foreground leading-none">
                Enterprise AI
              </p>
              <p className="truncate text-xs text-muted-foreground mt-0.5 leading-none">
                Knowledge Assistant
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav scroll area */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-0.5">
        {!sidebarCollapsed && (
          <p className="px-3 pb-1 text-2xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            Main
          </p>
        )}
        {primaryNavItems.map((item) => (
          <SidebarNavItem key={item.href} item={item} collapsed={sidebarCollapsed} />
        ))}

        <div className="my-2 border-t border-border/60" />

        {!sidebarCollapsed && (
          <p className="px-3 pb-1 text-2xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            Platform
          </p>
        )}
        {secondaryNavItems.map((item) => (
          <SidebarNavItem key={item.href} item={item} collapsed={sidebarCollapsed} />
        ))}

        {isAdmin && (
          <>
            <div className="my-2 border-t border-border/60" />
            {!sidebarCollapsed && (
              <p className="px-3 pb-1 text-2xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                Admin
              </p>
            )}
            {adminNavItems.map((item) => (
              <SidebarNavItem key={item.href} item={item} collapsed={sidebarCollapsed} />
            ))}
          </>
        )}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border px-2 py-3 space-y-0.5">
        {accountNavItems.map((item) => (
          <SidebarNavItem key={item.href} item={item} collapsed={sidebarCollapsed} />
        ))}

        {!sidebarCollapsed && user && (
          <div className="mt-2 flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-muted transition-colors cursor-pointer">
            <Avatar size="sm">
              {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.full_name} />}
              <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">{user.full_name}</p>
              <p className="truncate text-2xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "absolute -right-3 top-[76px] z-10 flex h-6 w-6 items-center justify-center",
          "rounded-full border border-border bg-card shadow-soft text-muted-foreground",
          "hover:text-foreground hover:bg-muted transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!sidebarCollapsed}
      >
        {sidebarCollapsed
          ? <ChevronRight className="h-3 w-3" aria-hidden="true" />
          : <ChevronLeft className="h-3 w-3" aria-hidden="true" />
        }
      </button>
    </motion.aside>
  );
}
