/**
 * Admin page — user management, system configuration, and audit logs.
 */

import * as React from "react";
import { motion } from "framer-motion";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, getInitials } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import {
  Users, Shield, Database, Activity, Search, Plus,
  MoreHorizontal, UserX, UserCheck, Mail, Key,
} from "lucide-react";
import { MOCK_USERS } from "@/data/mock-data";
import { formatRelativeTime } from "@/utils/format";
import { cn as _cn } from "@/utils/cn";
import type { User } from "@/types";

const STAGGER = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } },
};

const stats = [
  { title: "Total Users", value: 142, change: 5, trend: "up" as const, changeLabel: "this month", icon: Users, iconColor: "text-primary", iconBg: "bg-primary/10" },
  { title: "Admin Users", value: 4, icon: Shield, iconColor: "text-warning", iconBg: "bg-warning/10" },
  { title: "Storage Used", value: "24.8", suffix: " GB", change: 8.1, trend: "up" as const, changeLabel: "this month", icon: Database, iconColor: "text-accent-500", iconBg: "bg-accent/10" },
  { title: "Audit Events", value: 8420, change: 14.2, trend: "up" as const, changeLabel: "this month", icon: Activity, iconColor: "text-success", iconBg: "bg-success/10" },
];

const roleVariants: Record<string, "default" | "warning" | "secondary" | "accent"> = {
  super_admin: "warning",
  admin: "warning",
  manager: "default",
  analyst: "accent",
  user: "secondary",
};

const auditEvents = [
  { id: "audit_001", user: "sarah.chen@acmecorp.com", action: "document.upload", resource: "Q2 Financial Report.pdf", status: "success", time: "2024-06-21T09:15:00Z" },
  { id: "audit_002", user: "marcus.lee@acmecorp.com", action: "chat.send", resource: "conv_01", status: "success", time: "2024-06-21T09:10:00Z" },
  { id: "audit_003", user: "system", action: "guardrail.blocked", resource: "prompt_injection", status: "blocked", time: "2024-06-21T09:05:00Z" },
  { id: "audit_004", user: "priya.patel@acmecorp.com", action: "document.view", resource: "Employee Handbook.docx", status: "success", time: "2024-06-21T08:55:00Z" },
  { id: "audit_005", user: "sarah.chen@acmecorp.com", action: "user.role_change", resource: "jordan.kim@acmecorp.com", status: "success", time: "2024-06-20T16:30:00Z" },
  { id: "audit_006", user: "unknown", action: "auth.failed", resource: "login_attempt", status: "failed", time: "2024-06-20T14:22:00Z" },
];

export default function AdminPage() {
  const [search, setSearch] = React.useState("");
  const [deactivateTarget, setDeactivateTarget] = React.useState<User | null>(null);
  const { success: toastSuccess, info: toastInfo } = useToast();

  const filtered = MOCK_USERS.filter(
    (u) =>
      search === "" ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.department ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
      <div>
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-foreground">
          Admin Panel
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-1 text-sm text-muted-foreground">
          User management, system configuration, and audit logs.
        </motion.p>
      </div>

      {/* Stats */}
      <motion.div variants={STAGGER.container} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <motion.div key={stat.title} variants={STAGGER.item}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-3.5 w-3.5" aria-hidden="true" /> Users
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <Activity className="h-3.5 w-3.5" aria-hidden="true" /> Audit Logs
          </TabsTrigger>
        </TabsList>

        {/* Users tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and role assignments.</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="w-56">
                  <Input
                    placeholder="Search users…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    leftAdornment={<Search className="h-4 w-4" aria-hidden="true" />}
                    aria-label="Search users"
                  />
                </div>
                <Button leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => toastInfo("User invite", "Invite flow will be implemented in Milestone 3.")}>
                  Invite user
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="border-b border-border">
                      {["User", "Role", "Department", "Status", "Joined", ""].map((h) => (
                        <th key={h} className="pb-3 text-left text-xs font-semibold text-muted-foreground pr-4 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((user) => (
                      <tr key={user.id} className="group hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <Avatar size="sm">
                              <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-xs font-semibold text-foreground">{user.full_name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={roleVariants[user.role] ?? "secondary"} className="text-2xs capitalize">
                            {user.role.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-xs text-muted-foreground">{user.department ?? "—"}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={user.is_active ? "success" : "secondary"} dot className="text-2xs">
                            {user.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                          {formatRelativeTime(user.created_at)}
                        </td>
                        <td className="py-3">
                          <Dropdown>
                            <DropdownTrigger asChild>
                              <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Actions for ${user.full_name}`}>
                                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            </DropdownTrigger>
                            <DropdownContent align="end" className="w-44">
                              <DropdownItem className="gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> Send email</DropdownItem>
                              <DropdownItem className="gap-2"><Key className="h-3.5 w-3.5 text-muted-foreground" /> Reset password</DropdownItem>
                              <DropdownSeparator />
                              {user.is_active ? (
                                <DropdownItem destructive className="gap-2" onClick={() => setDeactivateTarget(user)}>
                                  <UserX className="h-3.5 w-3.5" /> Deactivate
                                </DropdownItem>
                              ) : (
                                <DropdownItem className="gap-2 text-success" onClick={() => toastSuccess("User activated")}>
                                  <UserCheck className="h-3.5 w-3.5" /> Activate
                                </DropdownItem>
                              )}
                            </DropdownContent>
                          </Dropdown>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit log tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>Immutable record of all significant platform actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="border-b border-border">
                      {["Event ID", "User", "Action", "Resource", "Status", "Time"].map((h) => (
                        <th key={h} className="pb-3 text-left text-xs font-semibold text-muted-foreground pr-4 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {auditEvents.map((evt) => (
                      <tr key={evt.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4">
                          <code className="text-xs font-mono text-muted-foreground">{evt.id}</code>
                        </td>
                        <td className="py-3 pr-4 text-xs text-muted-foreground">{evt.user}</td>
                        <td className="py-3 pr-4">
                          <code className="text-xs font-mono text-foreground">{evt.action}</code>
                        </td>
                        <td className="py-3 pr-4 text-xs text-muted-foreground truncate max-w-[200px]">{evt.resource}</td>
                        <td className="py-3 pr-4">
                          <Badge
                            variant={evt.status === "success" ? "success" : evt.status === "blocked" ? "warning" : "destructive"}
                            dot
                            className="text-2xs"
                          >
                            {evt.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-xs text-muted-foreground whitespace-nowrap">{formatRelativeTime(evt.time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        title="Deactivate user account"
        description={`${deactivateTarget?.full_name} will lose access to the platform immediately. They can be reactivated at any time.`}
        confirmLabel="Deactivate"
        variant="warning"
        onConfirm={() => {
          toastSuccess("User deactivated", `${deactivateTarget?.full_name} has been deactivated.`);
          setDeactivateTarget(null);
        }}
      />
    </div>
  );
}
