/**
 * Evaluation page — LLM quality metrics, test runs, and history table.
 */

import { motion } from "framer-motion";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress as _Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { CheckCircle2, ThumbsUp, AlertCircle,
  BarChart3, Play, Download,
} from "lucide-react";
import { EVALUATION_HISTORY_DATA } from "@/data/mock-data";
import { cn } from "@/utils/cn";

const stats = [
  { title: "Faithfulness", value: "94.2", suffix: "%", change: 1.8, trend: "up" as const, changeLabel: "vs last week", icon: CheckCircle2, iconColor: "text-success", iconBg: "bg-success/10" },
  { title: "Relevance", value: "91.5", suffix: "%", change: 0.4, trend: "up" as const, changeLabel: "vs last week", icon: ThumbsUp, iconColor: "text-primary", iconBg: "bg-primary/10" },
  { title: "Hallucination", value: "2.1", suffix: "%", change: -0.3, trend: "up" as const, changeLabel: "improvement", icon: AlertCircle, iconColor: "text-warning", iconBg: "bg-warning/10" },
  { title: "Test Cases", value: 248, change: 12, trend: "up" as const, changeLabel: "added this week", icon: BarChart3, iconColor: "text-accent-500", iconBg: "bg-accent/10" },
];

const radarData = [
  { metric: "Faithfulness", score: 94 },
  { metric: "Relevance", score: 91 },
  { metric: "Precision", score: 89 },
  { metric: "Recall", score: 87 },
  { metric: "F1 Score", score: 88 },
  { metric: "Coherence", score: 93 },
];

const trendData = [
  { week: "W1", faithfulness: 88, relevance: 85, precision: 83 },
  { week: "W2", faithfulness: 90, relevance: 87, precision: 85 },
  { week: "W3", faithfulness: 91, relevance: 88, precision: 86 },
  { week: "W4", faithfulness: 92, relevance: 90, precision: 88 },
  { week: "W5", faithfulness: 93, relevance: 91, precision: 90 },
  { week: "W6", faithfulness: 94, relevance: 91, precision: 89 },
];

const statusConfig = {
  passed: { variant: "success" as const, dot: "bg-success" },
  warning: { variant: "warning" as const, dot: "bg-warning" },
  failed: { variant: "destructive" as const, dot: "bg-danger" },
};

const STAGGER = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } },
};

export default function EvaluationPage() {
  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-foreground">
            Evaluation
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-1 text-sm text-muted-foreground">
            Measure and improve AI response quality with automated evaluation pipelines.
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex gap-2">
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}>Export</Button>
          <Button leftIcon={<Play className="h-4 w-4" aria-hidden="true" />}>Run Evaluation</Button>
        </motion.div>
      </div>

      {/* Stats */}
      <motion.div variants={STAGGER.container} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <motion.div key={stat.title} variants={STAGGER.item}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle>Quality Score Radar</CardTitle>
              <CardDescription>Multi-dimensional quality assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Radar name="Score" dataKey="score" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.15} strokeWidth={2} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                      formatter={(v) => [`${v}%`, "Score"]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader>
              <CardTitle>Quality Trends</CardTitle>
              <CardDescription>Weekly evaluation score trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                      formatter={(v) => [`${v}%`]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="faithfulness" stroke="#10B981" strokeWidth={2} name="Faithfulness" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="relevance" stroke="#4F46E5" strokeWidth={2} name="Relevance" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="precision" stroke="#06B6D4" strokeWidth={2} name="Precision" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Metric breakdowns */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Faithfulness", value: 94.2, color: "bg-success", desc: "Answer aligns with sources" },
          { label: "Answer Relevance", value: 91.5, color: "bg-primary", desc: "Response addresses the question" },
          { label: "Context Precision", value: 89.4, color: "bg-accent-500", desc: "Retrieved chunks are relevant" },
          { label: "Context Recall", value: 87.1, color: "bg-warning", desc: "All relevant docs retrieved" },
        ].map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
          >
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground">{metric.label}</span>
                  <span className="text-lg font-bold text-foreground">{metric.value}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.value}%` }}
                    transition={{ duration: 0.8, delay: 0.4 + i * 0.05, ease: "easeOut" }}
                    className={cn("h-full rounded-full", metric.color)}
                  />
                </div>
                <p className="mt-2 text-2xs text-muted-foreground">{metric.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* History table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader>
            <CardTitle>Evaluation History</CardTitle>
            <CardDescription>Past evaluation runs and results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table">
                <thead>
                  <tr className="border-b border-border">
                    {["Run ID", "Date", "Dataset", "Faithfulness", "Relevance", "Precision", "Status"].map((h) => (
                      <th key={h} className="pb-3 text-left text-xs font-semibold text-muted-foreground pr-4 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {EVALUATION_HISTORY_DATA.map((run) => {
                    const sc = statusConfig[run.status as keyof typeof statusConfig];
                    return (
                      <tr key={run.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4">
                          <code className="text-xs font-mono text-muted-foreground">{run.id}</code>
                        </td>
                        <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">{run.date}</td>
                        <td className="py-3 pr-4">
                          <span className="text-xs font-medium text-foreground">{run.dataset}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={cn("text-xs font-semibold", run.faithfulness >= 90 ? "text-success" : run.faithfulness >= 80 ? "text-warning" : "text-danger")}>
                            {run.faithfulness}%
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={cn("text-xs font-semibold", run.relevance >= 90 ? "text-success" : run.relevance >= 80 ? "text-warning" : "text-danger")}>
                            {run.relevance}%
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={cn("text-xs font-semibold", run.precision >= 90 ? "text-success" : run.precision >= 80 ? "text-warning" : "text-danger")}>
                            {run.precision}%
                          </span>
                        </td>
                        <td className="py-3">
                          <Badge variant={sc.variant} dot className="text-2xs capitalize">{run.status}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
