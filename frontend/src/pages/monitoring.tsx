/**
 * Monitoring page — real-time system health, latency, and service status.
 */

import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity, Zap, AlertCircle, Clock, Server,
  Database, Brain, HardDrive,
} from "lucide-react";
import { SYSTEM_HEALTH_DATA } from "@/data/mock-data";
import { cn } from "@/utils/cn";

const STAGGER = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } },
};

const stats = [
  { title: "API Uptime", value: "99.97", suffix: "%", change: 0.02, trend: "up" as const, changeLabel: "vs last week", icon: Activity, iconColor: "text-success", iconBg: "bg-success/10" },
  { title: "Avg Latency", value: 38, suffix: "ms", change: -8.4, trend: "up" as const, changeLabel: "improvement", icon: Zap, iconColor: "text-primary", iconBg: "bg-primary/10" },
  { title: "Error Rate", value: "0.12", suffix: "%", change: -0.05, trend: "up" as const, changeLabel: "improvement", icon: AlertCircle, iconColor: "text-warning", iconBg: "bg-warning/10" },
  { title: "Req / min", value: 1842, change: 5.2, trend: "up" as const, changeLabel: "vs yesterday", icon: Clock, iconColor: "text-accent-500", iconBg: "bg-accent/10" },
];

const services = [
  { name: "Backend API", icon: Server, status: "operational", latency: "12ms", uptime: "99.98%", responseTime: [12, 11, 14, 10, 13, 11, 9] },
  { name: "PostgreSQL", icon: Database, status: "operational", latency: "3ms", uptime: "99.99%", responseTime: [3, 3, 4, 3, 3, 2, 3] },
  { name: "Qdrant", icon: Database, status: "operational", latency: "8ms", uptime: "99.95%", responseTime: [8, 7, 9, 8, 8, 7, 8] },
  { name: "Redis Cache", icon: HardDrive, status: "operational", latency: "1ms", uptime: "100%", responseTime: [1, 1, 1, 1, 1, 1, 1] },
  { name: "OpenAI API", icon: Brain, status: "degraded", latency: "480ms", uptime: "99.80%", responseTime: [280, 310, 480, 440, 520, 480, 460] },
];

type ServiceStatus = "operational" | "degraded" | "outage";

const statusConfig: Record<ServiceStatus, { color: string; bg: string; badge: "success" | "warning" | "destructive"; dotColor: string }> = {
  operational: { color: "text-success", bg: "bg-success", badge: "success", dotColor: "bg-success" },
  degraded: { color: "text-warning", bg: "bg-warning", badge: "warning", dotColor: "bg-warning" },
  outage: { color: "text-danger", bg: "bg-danger", badge: "destructive", dotColor: "bg-danger" },
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-card">
      <p className="mb-1.5 text-xs font-medium text-foreground">{label}</p>
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

export default function MonitoringPage() {
  const allOperational = services.every((s) => s.status === "operational");

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-foreground">
            Monitoring
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-1 text-sm text-muted-foreground">
            Real-time infrastructure health and performance metrics.
          </motion.p>
        </div>
        <Badge
          variant={allOperational ? "success" : "warning"}
          dot
          className="text-xs"
        >
          {allOperational ? "All systems operational" : "Degraded performance"}
        </Badge>
      </div>

      {/* Stats */}
      <motion.div variants={STAGGER.container} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <motion.div key={stat.title} variants={STAGGER.item}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* System resources + health graph */}
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>System Resources</CardTitle>
              <CardDescription>CPU, memory usage and API latency — last hour</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={SYSTEM_HEALTH_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="cpu" stroke="#4F46E5" strokeWidth={2} name="CPU %" dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="memory" stroke="#06B6D4" strokeWidth={2} name="Memory %" dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="latency" stroke="#F59E0B" strokeWidth={2} name="Latency ms" dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader>
              <CardTitle>Resource Usage</CardTitle>
              <CardDescription>Current utilization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { label: "CPU", value: 42, color: "bg-primary" },
                { label: "Memory", value: 68, color: "bg-accent-500" },
                { label: "Disk", value: 31, color: "bg-success" },
                { label: "Network I/O", value: 55, color: "bg-warning" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-foreground">{item.label}</span>
                    <span className="text-xs font-semibold text-foreground">{item.value}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={cn("h-full rounded-full", item.color)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Service health table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle>Service Health</CardTitle>
            <CardDescription>Individual service status and response times</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" role="list">
              {services.map((service) => {
                const sc = statusConfig[service.status as ServiceStatus];
                const ServiceIcon = service.icon;
                return (
                  <div
                    key={service.name}
                    className="flex items-center gap-4 rounded-xl border border-border p-4 hover:bg-muted/30 transition-colors"
                    role="listitem"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <ServiceIcon className="h-4.5 w-4.5 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full shrink-0", sc.dotColor)} aria-hidden="true" />
                        <p className="text-sm font-medium text-foreground">{service.name}</p>
                      </div>
                      <div className="mt-0.5 flex items-center gap-4">
                        {/* Mini latency sparkline */}
                        <div className="flex items-end gap-0.5 h-4">
                          {service.responseTime.map((t, i) => {
                            const max = Math.max(...service.responseTime);
                            const h = Math.round((t / max) * 100);
                            return (
                              <div
                                key={i}
                                className={cn("w-1 rounded-sm", service.status === "degraded" ? "bg-warning/60" : "bg-primary/40")}
                                style={{ height: `${h}%` }}
                                aria-hidden="true"
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-6 text-xs text-muted-foreground">
                      <div className="text-right">
                        <p className="font-mono font-semibold text-foreground">{service.latency}</p>
                        <p>latency</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{service.uptime}</p>
                        <p>uptime</p>
                      </div>
                    </div>
                    <Badge variant={sc.badge} className="text-xs capitalize shrink-0">
                      {service.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
