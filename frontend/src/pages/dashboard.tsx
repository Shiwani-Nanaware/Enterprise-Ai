/**
 * Dashboard page — enterprise KPI overview with charts, activity feed, and announcements.
 */

import { motion } from "framer-motion";
import {
  MessageSquare, FileText, Users, Zap, ArrowRight,
  BarChart3, Bot, Sparkles, DollarSign,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";
import {
  CONVERSATION_TREND_DATA,
  MOCK_DOCUMENTS,
  MOCK_NOTIFICATIONS,
} from "@/data/mock-data";
import { formatRelativeTime, formatFileSize } from "@/utils/format";
import { cn } from "@/utils/cn";

const STAGGER = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } },
};

const stats = [
  { title: "Total Conversations", value: 2847, change: 12.4, changeLabel: "vs last month", trend: "up" as const, icon: MessageSquare, iconColor: "text-primary", iconBg: "bg-primary/10" },
  { title: "Documents Indexed", value: 384, change: 8.1, changeLabel: "vs last month", trend: "up" as const, icon: FileText, iconColor: "text-accent-500", iconBg: "bg-accent/10" },
  { title: "Active Users", value: 142, change: 5.2, changeLabel: "vs last month", trend: "up" as const, icon: Users, iconColor: "text-success", iconBg: "bg-success/10" },
  { title: "Avg Response", value: "1.8", suffix: "s", change: -15.2, changeLabel: "improvement", trend: "up" as const, icon: Zap, iconColor: "text-warning", iconBg: "bg-warning/10" },
];

const quickActions = [
  { label: "New Conversation", href: "/chat", icon: MessageSquare, description: "Ask about your documents", color: "text-primary", bg: "bg-primary/10" },
  { label: "Upload Document", href: "/documents", icon: FileText, description: "Index a new file", color: "text-accent-500", bg: "bg-accent/10" },
  { label: "View Analytics", href: "/analytics", icon: BarChart3, description: "Usage and insights", color: "text-success", bg: "bg-success/10" },
  { label: "Cost Overview", href: "/cost", icon: DollarSign, description: "Token usage & spend", color: "text-warning", bg: "bg-warning/10" },
];

const systemServices = [
  { name: "Backend API", status: "operational", latency: "12ms" },
  { name: "Vector DB", status: "operational", latency: "8ms" },
  { name: "LLM Provider", status: "degraded", latency: "480ms" },
  { name: "Redis Cache", status: "operational", latency: "1ms" },
];

function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        status === "operational" ? "bg-success" : status === "degraded" ? "bg-warning" : "bg-danger"
      )}
      aria-hidden="true"
    />
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-card">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-xs text-muted-foreground">{p.name}:</span>
          <span className="text-xs font-semibold text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const firstName = user?.full_name.split(" ")[0] ?? "there";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const recentDocs = MOCK_DOCUMENTS.slice(0, 4);
  const recentActivity = MOCK_NOTIFICATIONS.slice(0, 5);

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-foreground"
          >
            {greeting}, {firstName} 👋
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-1 text-sm text-muted-foreground"
          >
            Here's what's happening with your knowledge base today.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button asChild>
            <Link to="/chat">
              <Bot className="h-4 w-4" aria-hidden="true" />
              Ask AI
            </Link>
          </Button>
        </motion.div>
      </div>

      {/* Stats */}
      <motion.div
        variants={STAGGER.container}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((stat) => (
          <motion.div key={stat.title} variants={STAGGER.item}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* Main grid */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Conversation trend chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-2"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle>Conversation Activity</CardTitle>
                <CardDescription>Daily conversations and messages — last 14 days</CardDescription>
              </div>
              <Badge variant="success" dot>Live</Badge>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={CONVERSATION_TREND_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="conversations" stroke="#4F46E5" strokeWidth={2} fill="url(#convGrad)" name="Conversations" dot={false} />
                    <Area type="monotone" dataKey="messages" stroke="#06B6D4" strokeWidth={2} fill="url(#msgGrad)" name="Messages" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Jump to frequently used features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  to={action.href}
                  className="group flex items-center gap-3 rounded-xl border border-border p-3 hover:border-primary/30 hover:bg-muted/50 transition-all duration-150"
                >
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", action.bg)}>
                    <action.icon className={cn("h-4.5 w-4.5", action.color)} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors shrink-0" aria-hidden="true" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent documents */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>Recent Documents</CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-xs">
                <Link to="/documents">View all <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentDocs.map((doc) => (
                <div key={doc.id} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground uppercase">
                    {doc.file_type}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(doc.file_size_bytes)} · {doc.chunk_count} chunks</p>
                  </div>
                  <Badge
                    variant={doc.status === "indexed" ? "success" : doc.status === "processing" ? "warning" : "destructive"}
                    className="text-2xs shrink-0"
                  >
                    {doc.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent activity */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      item.type === "success" ? "bg-success" :
                      item.type === "error" ? "bg-danger" :
                      item.type === "warning" ? "bg-warning" : "bg-primary"
                    )}
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground leading-snug">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{item.description}</p>
                    <p className="text-2xs text-muted-foreground/60 mt-1">{formatRelativeTime(item.created_at)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* System status */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>System Status</CardTitle>
              <Badge variant="success" dot>All systems</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {systemServices.map((svc) => (
                <div key={svc.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <StatusDot status={svc.status} />
                    <span className="text-sm text-foreground">{svc.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">{svc.latency}</span>
                    <Badge
                      variant={svc.status === "operational" ? "success" : "warning"}
                      className="text-2xs capitalize"
                    >
                      {svc.status}
                    </Badge>
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Last checked</span>
                  <span className="font-medium text-foreground">Just now</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Announcement banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 p-4">
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">New: Evaluation Suite available</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Automatically measure faithfulness, relevance, and hallucination rate for all AI responses.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <Link to="/evaluation">
                Try it <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
