/**
 * Guardrails page — live status from backend + interactive policy tester.
 */

import * as React from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield, ShieldCheck, ShieldAlert, ShieldX, ToggleLeft, ToggleRight,
  AlertTriangle, Eye, Ban, Fingerprint, Type, CheckCircle2, Play,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { apiClient } from "@/services/api-client";
import { GUARDRAIL_EVENTS_DATA } from "@/data/mock-data";

const STAGGER = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } },
};

const POLICIES = [
  { id: "prompt_injection", name: "Prompt Injection", desc: "Blocks attempts to override AI instructions.", icon: ShieldX, violations: 47, severity: "high" as const, enabled: true },
  { id: "pii_detection", name: "PII Redaction", desc: "Auto-masks phone, email, PAN, Aadhaar, card numbers.", icon: Fingerprint, violations: 23, severity: "high" as const, enabled: true },
  { id: "topic_scope", name: "Topic Scope", desc: "Limits responses to FinSolve business topics.", icon: Eye, violations: 89, severity: "medium" as const, enabled: true },
  { id: "harmful_content", name: "Harmful Content", desc: "Blocks generation of offensive or dangerous content.", icon: Ban, violations: 12, severity: "high" as const, enabled: true },
  { id: "sql_injection", name: "SQL/Code Injection", desc: "Detects SQL injection and script injection patterns.", icon: ShieldAlert, violations: 8, severity: "high" as const, enabled: true },
  { id: "token_limit", name: "Token Limit", desc: "Enforces max input/output token limits.", icon: Type, violations: 34, severity: "low" as const, enabled: true },
];

const severityConfig = {
  high: { variant: "destructive" as const, label: "High" },
  medium: { variant: "warning" as const, label: "Medium" },
  low: { variant: "secondary" as const, label: "Low" },
};

const stats = [
  { title: "Active Policies", value: 6, icon: ShieldCheck, iconColor: "text-success", iconBg: "bg-success/10" },
  { title: "Events Today", value: 62, change: -18, trend: "up" as const, changeLabel: "improvement", icon: ShieldAlert, iconColor: "text-warning", iconBg: "bg-warning/10" },
  { title: "Block Rate", value: "0.8", suffix: "%", change: -0.2, trend: "up" as const, changeLabel: "of all requests", icon: Shield, iconColor: "text-primary", iconBg: "bg-primary/10" },
  { title: "PII Events", value: 23, change: -5, trend: "up" as const, changeLabel: "vs yesterday", icon: Fingerprint, iconColor: "text-danger", iconBg: "bg-danger/10" },
];

interface TestResult { passed: boolean; violation_type: string | null; violation_detail: string | null; sanitized_text: string | null; pii_detected: string[]; }

function GuardrailTester() {
  const [text, setText] = React.useState("");
  const [result, setResult] = React.useState<TestResult | null>(null);
  const [loading, setLoading] = React.useState(false);

  const runTest = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const resp = await apiClient.post<{ success: true; data: TestResult }>("/guardrails/check", { text, mask_pii: true, check_scope: true });
      setResult(resp.data.data);
    } catch (err: any) {
      setResult({ passed: false, violation_type: "API_ERROR", violation_detail: err?.response?.data?.error?.message ?? "Failed to test", sanitized_text: null, pii_detected: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guardrail Tester</CardTitle>
        <CardDescription>Test a message against all guardrail policies in real time.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter a test message…" rows={4} className="resize-none" />
        <Button onClick={runTest} isLoading={loading} leftIcon={<Play className="h-4 w-4" />} disabled={!text.trim()}>Run Test</Button>
        {result && (
          <div className={cn("rounded-xl border p-4 space-y-3", result.passed ? "border-success/30 bg-success/5" : "border-danger/30 bg-danger/5")}>
            <div className="flex items-center gap-2">
              {result.passed ? <CheckCircle2 className="h-5 w-5 text-success" /> : <AlertTriangle className="h-5 w-5 text-danger" />}
              <span className={cn("text-sm font-semibold", result.passed ? "text-success" : "text-danger")}>{result.passed ? "PASSED — No violations detected" : `BLOCKED — ${result.violation_type}`}</span>
            </div>
            {result.violation_detail && <p className="text-sm text-foreground">{result.violation_detail}</p>}
            {result.pii_detected.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">PII Detected & Masked:</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.pii_detected.map((t) => <Badge key={t} variant="warning" className="text-2xs">{t.replace(/_/g, " ")}</Badge>)}
                </div>
              </div>
            )}
            {result.sanitized_text && result.sanitized_text !== text && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Sanitized Output:</p>
                <p className="text-xs text-foreground font-mono bg-muted rounded p-2">{result.sanitized_text}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function GuardrailsPage() {
  const [policies, setPolicies] = React.useState(POLICIES);
  const activePolicies = policies.filter((p) => p.enabled).length;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-foreground">Guardrails</motion.h1>
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-1 text-sm text-muted-foreground">AI safety policies, PII masking, and violation tracking.</motion.p>
        </div>
        <Badge variant="success" dot className="text-xs self-start sm:self-auto">{activePolicies} policies active</Badge>
      </div>

      <motion.div variants={STAGGER.container} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => <motion.div key={stat.title} variants={STAGGER.item}><StatCard {...stat} /></motion.div>)}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Events by Category</CardTitle><CardDescription>Detected vs blocked today</CardDescription></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={GUARDRAIL_EVENTS_DATA} layout="vertical" margin={{ top: 4, right: 4, left: 80, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="category" type="category" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip />
                    <Bar dataKey="detected" fill="#E0E7FF" radius={[0, 4, 4, 0]} name="Detected" maxBarSize={16} />
                    <Bar dataKey="blocked" fill="#4F46E5" radius={[0, 4, 4, 0]} name="Blocked" maxBarSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="lg:col-span-3">
          <Card>
            <CardHeader><CardTitle>Safety Policies</CardTitle><CardDescription>Toggle guardrail policies for all AI interactions.</CardDescription></CardHeader>
            <CardContent>
              <ul className="divide-y divide-border" role="list">
                {policies.map((policy) => {
                  const sc = severityConfig[policy.severity];
                  const PolicyIcon = policy.icon;
                  return (
                    <li key={policy.id} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                      <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", policy.enabled ? "bg-primary/10" : "bg-muted")}>
                        <PolicyIcon className={cn("h-4.5 w-4.5", policy.enabled ? "text-primary" : "text-muted-foreground")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground">{policy.name}</p>
                          <Badge variant={sc.variant} className="text-2xs">{sc.label} risk</Badge>
                          {policy.violations > 0 && <span className="text-2xs text-warning flex items-center gap-1"><AlertTriangle className="h-2.5 w-2.5" />{policy.violations} events</span>}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{policy.desc}</p>
                      </div>
                      <button onClick={() => setPolicies((prev) => prev.map((p) => p.id === policy.id ? { ...p, enabled: !p.enabled } : p))}
                        className="mt-0.5 shrink-0" aria-label={`Toggle ${policy.name}`} role="switch" aria-checked={policy.enabled}>
                        {policy.enabled ? <ToggleRight className="h-7 w-7 text-primary" /> : <ToggleLeft className="h-7 w-7 text-muted-foreground" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <GuardrailTester />
      </motion.div>
    </div>
  );
}
