/**
 * Cost Dashboard page — LLM token usage, cost per model, and budget tracking.
 */

import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Zap, CreditCard } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { ChartsContainer } from "@/components/ui/charts-container";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const costData = [
  { date: "Jun 1", cost: 12.40 },
  { date: "Jun 8", cost: 18.20 },
  { date: "Jun 15", cost: 24.80 },
  { date: "Jun 22", cost: 31.50 },
  { date: "Jun 29", cost: 28.90 },
];

export default function CostDashboardPage() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-foreground">
          Cost Dashboard
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-1 text-sm text-muted-foreground">
          Track AI token usage and associated costs across your organization.
        </motion.p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="This Month" value="$115.80" change={12.4} trend="down" changeLabel="vs last month" icon={DollarSign} iconColor="text-success-600" iconBg="bg-success/10" />
        <StatCard title="Total Tokens Used" value={4820000} change={18.2} trend="up" changeLabel="vs last month" icon={Zap} iconColor="text-primary" iconBg="bg-primary/10" />
        <StatCard title="Cost Per Conversation" value="$0.041" change={-5.1} trend="up" changeLabel="improvement" icon={TrendingUp} iconColor="text-accent-500" iconBg="bg-accent/10" />
        <StatCard title="Budget Used" value="57.9" suffix="%" change={8.3} trend="neutral" changeLabel="of $200 budget" icon={CreditCard} iconColor="text-warning-600" iconBg="bg-warning/10" />
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <ChartsContainer title="Daily API Cost" subtitle="Cumulative LLM API spend this month" height={280}>
          <AreaChart data={costData}>
            <defs>
              <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
              formatter={(v) => [`$${v}`, "Cost"]}
            />
            <Area type="monotone" dataKey="cost" stroke="#4F46E5" strokeWidth={2} fill="url(#costGradient)" name="Cost ($)" />
          </AreaChart>
        </ChartsContainer>
      </motion.div>
    </div>
  );
}
