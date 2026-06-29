/**
 * Landing page — premium enterprise SaaS marketing page.
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bot, ArrowRight, ShieldCheck, Zap, BarChart3, FileText,
  Lock, MessageSquare, Sparkles,
  Database, Globe, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

const FADE_UP = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] },
  }),
};

const features = [
  {
    icon: MessageSquare,
    title: "AI-Powered Document Chat",
    description: "Ask natural language questions and get instant, cited answers sourced directly from your company knowledge base.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise-Grade Security",
    description: "JWT authentication, RBAC, end-to-end encryption, and comprehensive audit logs protect every interaction.",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    icon: Zap,
    title: "Sub-2 Second Responses",
    description: "Optimized RAG pipeline with vector search delivers accurate, attributed answers in under 2 seconds.",
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    icon: BarChart3,
    title: "Usage Analytics",
    description: "Deep insights into how your team uses AI — query patterns, popular documents, and engagement metrics.",
    color: "text-accent-500",
    bg: "bg-accent/10",
  },
  {
    icon: FileText,
    title: "Universal Document Support",
    description: "Ingest PDFs, Word docs, spreadsheets, Markdown files, and more with automated chunking and indexing.",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: Lock,
    title: "Built-In Guardrails",
    description: "Content filtering, PII detection, prompt injection protection, and topic scoping keep AI responses safe.",
    color: "text-danger",
    bg: "bg-danger/10",
  },
];

const techStack = [
  { name: "React 19", category: "Frontend" },
  { name: "FastAPI", category: "Backend" },
  { name: "LangChain", category: "AI" },
  { name: "Qdrant", category: "Vector DB" },
  { name: "GPT-4o", category: "LLM" },
  { name: "PostgreSQL", category: "Database" },
  { name: "Redis", category: "Cache" },
  { name: "Docker", category: "Infra" },
];

const stats = [
  { value: "< 2s", label: "Avg response time" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "50+", label: "File formats" },
  { value: "SOC 2", label: "Compliance ready" },
];

const testimonials = [
  {
    quote: "Enterprise AI cut our legal team's document review time by 70%. The accuracy of responses is remarkable.",
    author: "Jordan Kim",
    title: "Head of Legal, Acme Corp",
    avatar: "JK",
  },
  {
    quote: "Finally, an AI tool that actually understands our internal documentation. The source citations are a game changer.",
    author: "Priya Patel",
    title: "Data Analyst, TechVentures",
    avatar: "PP",
  },
  {
    quote: "The guardrails and audit logs gave our security team the confidence to roll this out company-wide.",
    author: "Marcus Lee",
    title: "CISO, GlobalCo",
    avatar: "ML",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ------------------------------------------------------------------ */}
      {/* Navbar                                                               */}
      {/* ------------------------------------------------------------------ */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-accent-500">
              <Bot className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <span className="text-sm font-bold text-foreground">Enterprise AI</span>
          </div>

          <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
            {["Features", "Architecture", "Security", "Pricing"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/dashboard">
                Get started
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden py-24 lg:py-36">
        {/* Background decorations */}
        <div className="absolute inset-0 mesh-bg" aria-hidden="true" />
        <div className="absolute inset-0 grid-pattern opacity-60" aria-hidden="true" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/8 blur-3xl" aria-hidden="true" />

        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <motion.div
            custom={0}
            variants={FADE_UP}
            initial="hidden"
            animate="visible"
            className="mb-6 inline-flex"
          >
            <Badge variant="accent" className="gap-1.5 px-3 py-1 text-xs">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              Powered by GPT-4o + RAG
            </Badge>
          </motion.div>

          <motion.h1
            custom={1}
            variants={FADE_UP}
            initial="hidden"
            animate="visible"
            className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-foreground lg:text-6xl xl:text-7xl text-balance"
          >
            Your organization's knowledge,{" "}
            <span className="gradient-text-brand">intelligently accessible.</span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={FADE_UP}
            initial="hidden"
            animate="visible"
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed"
          >
            Enterprise AI Knowledge Assistant lets your entire team chat with company documents
            using advanced AI. Secure, fast, auditable, and built for organizations that take
            data seriously.
          </motion.p>

          <motion.div
            custom={3}
            variants={FADE_UP}
            initial="hidden"
            animate="visible"
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Button size="xl" asChild className="shadow-glow">
              <Link to="/dashboard">
                Try the demo
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link to="/login">Sign in to your workspace</Link>
            </Button>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            custom={4}
            variants={FADE_UP}
            initial="hidden"
            animate="visible"
            className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Dashboard mockup */}
          <motion.div
            custom={5}
            variants={FADE_UP}
            initial="hidden"
            animate="visible"
            className="mt-16 mx-auto max-w-5xl"
          >
            <div className="relative rounded-2xl border border-border bg-card shadow-modal overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/60 to-transparent" />
              {/* Browser chrome */}
              <div className="flex h-9 items-center gap-2 border-b border-border bg-muted/50 px-4">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-danger/50" />
                  <div className="h-3 w-3 rounded-full bg-warning/50" />
                  <div className="h-3 w-3 rounded-full bg-success/50" />
                </div>
                <div className="mx-auto flex h-5 w-56 items-center justify-center rounded bg-background px-3">
                  <span className="text-xs text-muted-foreground">app.enterpriseai.com/dashboard</span>
                </div>
              </div>

              {/* Mockup content */}
              <div className="bg-muted/20 p-6">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {["2,847 Conversations", "384 Documents", "142 Active Users", "1.8s Avg Response"].map((_s, i) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-soft">
                      <div className="h-2.5 w-16 bg-muted rounded mb-3" />
                      <div className="h-7 w-20 bg-primary/15 rounded" />
                      <div className="mt-2 h-2 w-24 bg-muted rounded" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 rounded-xl border border-border bg-card p-4 shadow-soft">
                    <div className="h-2.5 w-24 bg-muted rounded mb-4" />
                    <div className="flex items-end gap-2 h-24">
                      {[40, 65, 55, 80, 70, 90, 75, 95, 85, 100].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: "linear-gradient(to top, #4F46E5, #818CF8)" }} />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
                    <div className="h-2.5 w-20 bg-muted rounded mb-4" />
                    {[0.85, 0.62, 0.45, 0.3].map((w, i) => (
                      <div key={i} className="mb-2 flex items-center gap-2">
                        <div className="h-1.5 rounded-full bg-primary/30" style={{ width: `${w * 100}%` }}>
                          <div className="h-full rounded-full bg-primary" style={{ width: `${w * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Features                                                             */}
      {/* ------------------------------------------------------------------ */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <Badge variant="secondary" className="mb-4">Features</Badge>
            <h2 className="text-3xl font-bold text-foreground lg:text-4xl">
              Everything your enterprise needs
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              A complete platform for secure, intelligent document access — built for
              the compliance and security requirements of enterprise organizations.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                variants={FADE_UP}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                whileHover={{ y: -2 }}
                className="group rounded-xl border border-border bg-card p-6 shadow-soft hover:shadow-card transition-all duration-200"
              >
                <div className={cn("mb-4 flex h-10 w-10 items-center justify-center rounded-xl", feature.bg)}>
                  <feature.icon className={cn("h-5 w-5", feature.color)} aria-hidden="true" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Architecture                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section id="architecture" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <Badge variant="secondary" className="mb-4">Architecture</Badge>
            <h2 className="text-3xl font-bold text-foreground lg:text-4xl">Built for scale</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              A clean, layered architecture designed for production reliability,
              maintainability, and horizontal scaling.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            {[
              { icon: Globe, title: "API Layer", desc: "FastAPI + CORS, JWT, Rate limiting, Request tracing", color: "from-primary-600 to-primary-400" },
              { icon: Zap, title: "Service Layer", desc: "Business logic, LangChain RAG, Guardrails, Evaluation", color: "from-accent-600 to-accent-400" },
              { icon: Database, title: "Data Layer", desc: "PostgreSQL, Redis cache, Qdrant vector store", color: "from-success-600 to-success-400" },
              { icon: ShieldCheck, title: "Security Layer", desc: "RBAC, Audit logs, PII detection, Content filtering", color: "from-warning-600 to-warning-400" },
            ].map((layer, i) => (
              <motion.div
                key={layer.title}
                custom={i}
                variants={FADE_UP}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="relative rounded-xl border border-border bg-card p-6 shadow-soft"
              >
                <div className={cn("mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br", layer.color)}>
                  <layer.icon className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{layer.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{layer.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Technology Stack                                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-24 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <Badge variant="secondary" className="mb-4">Tech Stack</Badge>
            <h2 className="text-3xl font-bold text-foreground">Built with best-in-class tools</h2>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {techStack.map((tech) => (
              <div
                key={tech.name}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-soft"
              >
                <span className="text-sm font-medium text-foreground">{tech.name}</span>
                <span className="text-xs text-muted-foreground">{tech.category}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Testimonials                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <Badge variant="secondary" className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl font-bold text-foreground">Trusted by enterprise teams</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.author}
                custom={i}
                variants={FADE_UP}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="rounded-xl border border-border bg-card p-6 shadow-soft"
              >
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 text-xs font-bold text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{t.author}</p>
                    <p className="text-xs text-muted-foreground">{t.title}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA                                                                  */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600 px-8 py-16 text-center text-white shadow-modal">
            <div className="absolute inset-0 dot-pattern opacity-20" aria-hidden="true" />
            <div className="relative">
              <Badge className="mb-6 bg-white/20 text-white border-white/30">
                Get started today
              </Badge>
              <h2 className="text-3xl font-bold lg:text-4xl text-balance">
                Ready to unlock your organization's knowledge?
              </h2>
              <p className="mt-4 text-white/80 max-w-lg mx-auto">
                Join enterprise teams using AI to dramatically improve how employees
                find and understand company information.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button size="xl" className="bg-white text-primary hover:bg-white/90 shadow-lg" asChild>
                  <Link to="/dashboard">
                    View live demo
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button size="xl" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Footer                                                               */}
      {/* ------------------------------------------------------------------ */}
      <footer className="border-t border-border py-8 bg-card/50">
        <div className="mx-auto max-w-6xl px-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-primary-600 to-accent-500">
              <Bot className="h-3.5 w-3.5 text-white" aria-hidden="true" />
            </div>
            <span className="text-sm font-semibold text-foreground">Enterprise AI</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Enterprise AI Knowledge Assistant. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
