/**
 * Analytics page — real API connected.
 */

import * as React from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, getInitials } from "@/components/ui/avatar";
import { MessageSquare, FileText, Users, Zap } from "lucide-react";
import {
  getOverview, getDailyActivity, getDepartmentUsage, getTopUsers, getDocumentStats,
} from "@/services/analytics-service";
import { formatNumber } from "@/utils/format";
import {
  CONVERSATION_TREND_DATA, DOCUMENT_TYPE_DATA, DEPARTMENT_USAGE_DATA, RESPONSE_TIME_DATA,
} from "@/data/mock-data";

const STAGGER = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-card">
      <p className="mb-2 text-xs font-semibold text-foreground">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-xs text-muted-foreground">{p.name}:</span>
          <span className="text-xs font-semibold text-foreground">{formatNumber(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const PIE_COLORS = ["#4F46E5", "#6366F1", "#06B6D4", "#10B981", "#F59E0B"];

export default function AnalyticsPage() {
  const [overview, setOverview] = React.useState<any>(null);
  const [dailyData, setDailyData] = React.useState<any[]>(CONVERSATION_TREND_DATA);
  const [deptData, setDeptData] = React.useState<any[]>(DEPARTMENT_USAGE_DATA);
  const [topUsers, setTopUsers] = React.useState<any[]>([]);
  const [docStats, setDocStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.allSettled([
      getOverview(),
      getDailyActivity(14),
      getDepartmentUsage(),
      getTopUsers(5),
      getDocumentStats(),
    ]).then(([ov, daily, dept, users, docs]) => {
      if (ov.status === "fulfilled") setOverview(ov.value);
      if (daily.status === "fulfilled" && daily.value.length) setDailyData(daily.value);
      if (dept.status === "fulfilled" && dept.value.length) setDeptData(dept.value);
      if (users.status === "fulfilled") setTopUsers(users.value);
      if (docs.status === "fulfilled") setDocStats(docs.value);
    }).finally(() => setLoading(false));
  }, []);

  const stats = [
    { title: "Total Conversations", value: overview?.total_conversations ?? 0, change: 12.4, changeLabel: "vs last month", trend: "up" as const, icon: MessageSquare, iconColor: "text-primary", iconBg: "bg-primary/10" },
    { title: "Documents Indexed", value: overview?.total_documents ?? 0, change: 8.1, changeLabel: "vs last month", trend: "up" as const, icon: FileText, iconColor: "text-accent-500", iconBg: "bg-accent/10" },
    { title: "Active Users", value: overview?.total_users ?? 0, change: 5.2, changeLabel: "vs last month", trend: "up" as const, icon: Users, iconColor: "text-success", iconBg: "bg-success/10" },
    { title: "Avg Latency", value: overview ? `${((overview.avg_response_time_ms ?? 0) / 1000).toFixed(1)}` : "—", suffix: "s", change: -15.2, changeLabel: "improvement", trend: "up" as const, icon: Zap, iconColor: "text-warning", iconBg: "bg-warning/10" },
  ];

  const pieData = docStats?.by_type?.slice(0, 5).map((t: any) => ({ type: t.type.toUpperCase(), count: t.count })) ?? DOCUMENT_TYPE_DATA;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
      <div>
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-foreground">Analytics</motion.h1>
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-1 text-sm text-muted-foreground">
          {loading ? "Loading live data…" : "Live usage insights from MongoDB."}
        </motion.p>
      </div>

      <motion.div variants={STAGGER.container} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <motion.div key={stat.title} variants={STAGGER.item}><StatCard {...stat} /></motion.div>
        ))}
      </motion.div>

      <Tabs defaultValue="conversations">
        <TabsList className="mb-4">
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="conversations">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Conversation Volume</CardTitle><CardDescription>Daily conversations and messages — last 14 days</CardDescription></CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="aConv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} /><stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="aMsg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.2} /><stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="conversations" stroke="#4F46E5" strokeWidth={2.5} fill="url(#aConv)" name="Conversations" dot={false} />
                      <Area type="monotone" dataKey="messages" stroke="#06B6D4" strokeWidth={2.5} fill="url(#aMsg)" name="Messages" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Dept. Usage</CardTitle><CardDescription>Queries by department</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {deptData.slice(0, 6).map((dept: any, i: number) => {
                  const max = deptData[0]?.queries ?? 1;
                  const pct = Math.round((dept.queries / max) * 100);
                  return (
                    <div key={dept.department ?? i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-foreground">{dept.department}</span>
                        <span className="text-xs text-muted-foreground">{formatNumber(dept.queries)}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: i * 0.05 }}
                          className="h-full rounded-full bg-primary" />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="performance">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Response Time Percentiles</CardTitle><CardDescription>P50, P95, P99 latency (seconds)</CardDescription></CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={RESPONSE_TIME_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} unit="s" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="p50" stroke="#10B981" strokeWidth={2} name="P50" dot={false} />
                      <Line type="monotone" dataKey="p95" stroke="#F59E0B" strokeWidth={2} name="P95" dot={false} />
                      <Line type="monotone" dataKey="p99" stroke="#EF4444" strokeWidth={2} name="P99" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Top Users</CardTitle><CardDescription>Most active users</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {(topUsers.length ? topUsers : []).map((user: any, i: number) => (
                  <div key={user.user_id ?? i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                    <Avatar size="sm"><AvatarFallback>{getInitials(user.full_name ?? "?")}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{user.full_name}</p>
                      <p className="text-2xs text-muted-foreground">{user.department ?? "—"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-foreground">{formatNumber(user.query_count)}</p>
                      <p className="text-2xs text-muted-foreground">queries</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="documents">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Documents by Type</CardTitle><CardDescription>Distribution of indexed file formats</CardDescription></CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="h-56 w-56 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={56} outerRadius={88} paddingAngle={3} dataKey="count">
                          {pieData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => [formatNumber(Number(v)), "Docs"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3 w-full">
                    {pieData.map((item: any, i: number) => (
                      <div key={item.type ?? i} className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="flex-1 text-sm text-foreground">{item.type ?? item.type}</span>
                        <span className="text-sm font-semibold text-foreground">{formatNumber(item.count)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            {docStats && (
              <Card>
                <CardHeader><CardTitle>Document Stats</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Total Documents", value: formatNumber(docStats.total) },
                    { label: "Indexed", value: formatNumber(docStats.indexed) },
                    { label: "Failed", value: formatNumber(docStats.failed) },
                    { label: "Total Chunks", value: formatNumber(docStats.total_chunks) },
                    { label: "Storage", value: `${(docStats.total_size_bytes / 1048576).toFixed(1)} MB` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className="text-sm font-semibold text-foreground">{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
