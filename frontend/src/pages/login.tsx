/**
 * Login page — polished enterprise login.
 * Clean native inputs (no icon overlap), no demo accounts section.
 */

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Bot, ArrowRight, Sparkles, Shield, Brain, BarChart3, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";
import { login as apiLogin } from "@/services/auth-service";
import { cn } from "@/utils/cn";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Left panel decoration data
// ---------------------------------------------------------------------------

const floatingItems = [
  { text: "SOC 2 Compliant",       x: "5%",  y: "20%" },
  { text: "99.9% Uptime",          x: "78%", y: "14%" },
  { text: "End-to-end encrypted",  x: "70%", y: "76%" },
  { text: "GDPR Ready",            x: "6%",  y: "79%" },
];

const features = [
  { icon: Lock,     label: "JWT Authentication",    desc: "Secure token-based auth" },
  { icon: Shield,   label: "Role-Based Access",      desc: "Department-scoped data" },
  { icon: Brain,    label: "AI-Powered RAG",         desc: "Semantic document search" },
  { icon: BarChart3,label: "Analytics Dashboard",   desc: "Real-time usage insights" },
];

// ---------------------------------------------------------------------------
// Reusable clean input field
// ---------------------------------------------------------------------------

interface FieldInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  rightEl?: React.ReactNode;
}

const FieldInput = React.forwardRef<HTMLInputElement, FieldInputProps>(
  ({ label, error, rightEl, className, id, ...props }, ref) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-lg border bg-background px-4 py-2.5 text-sm text-foreground",
            "placeholder:text-muted-foreground",
            "outline-none transition-all duration-150",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            error
              ? "border-danger focus:border-danger focus:ring-danger/20"
              : "border-border",
            rightEl ? "pr-11" : "",
            className
          )}
          {...props}
        />
        {rightEl && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightEl}
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
);
FieldInput.displayName = "FieldInput";

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);

  const clearChatForUser = React.useCallback((userId: string) => {
    import("@/store/chat-store").then(({ useChatStore }) => {
      useChatStore.getState().clearForUser(userId);
    });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "admin@finsolve.com", password: "Password123!" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setApiError(null);
    try {
      const { user, tokens } = await apiLogin({
        email: data.email,
        password: data.password,
      });
      clearChatForUser(user.id);
      setAuth(user, tokens.access_token, tokens.refresh_token);
      navigate("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Login failed. Please check your credentials and try again.";
      setApiError(message);
    }
  };

  return (
    <div className="flex min-h-screen">

      {/* ── LEFT HERO PANEL ─────────────────────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-1/2 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900" />
        <div className="absolute inset-0 dot-pattern opacity-10" />

        {/* Glow orbs */}
        <div className="absolute top-1/3 left-1/4 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 h-64 w-64 rounded-full bg-accent-500/15 blur-3xl pointer-events-none" />

        {/* Floating status badges */}
        {floatingItems.map((item, i) => (
          <motion.div
            key={item.text}
            className="absolute hidden xl:flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white"
            style={{ left: item.x, top: item.y }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            {item.text}
          </motion.div>
        ))}

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between w-full p-12 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
              <Bot className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold leading-none tracking-tight">Enterprise AI</p>
              <p className="text-xs text-white/55 mt-0.5">Knowledge Assistant</p>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.55 }}
            >
              <Badge className="mb-5 bg-white/15 text-white border-white/20 gap-1.5 px-3 py-1">
                <Sparkles className="h-3 w-3" />
                AI-Powered Knowledge
              </Badge>

              <h1 className="text-4xl xl:text-5xl font-bold leading-[1.15] tracking-tight">
                Your company's knowledge,{" "}
                <span className="text-accent-300">at your fingertips.</span>
              </h1>

              <p className="mt-5 text-base text-white/65 leading-relaxed max-w-sm">
                Ask questions. Get instant, cited answers from your organisation's
                documents — secure, fast, and built for enterprise scale.
              </p>
            </motion.div>

            {/* Feature grid */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.5 }}
              className="grid grid-cols-2 gap-3"
            >
              {features.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-3"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <Icon className="h-3.5 w-3.5 text-white/80" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white leading-snug">{label}</p>
                    <p className="text-2xs text-white/45 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <p className="text-xs text-white/25">
            © {new Date().getFullYear()} Enterprise AI Knowledge Assistant
          </p>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ─────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12 lg:px-16">

        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent-500">
            <Bot className="h-4.5 w-4.5 text-white" aria-hidden="true" />
          </div>
          <span className="text-base font-bold text-foreground">Enterprise AI</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-sm"
        >
          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Welcome back</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to your Enterprise AI workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

            {/* API error banner */}
            <AnimatePresence>
              {apiError && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    role="alert"
                    className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger"
                  >
                    {apiError}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <FieldInput
              id="email"
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              error={errors.email?.message}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={cn(
                    "w-full rounded-lg border bg-background px-4 py-2.5 pr-11 text-sm text-foreground",
                    "placeholder:text-muted-foreground",
                    "outline-none transition-all duration-150",
                    "focus:border-primary focus:ring-2 focus:ring-primary/20",
                    errors.password
                      ? "border-danger focus:border-danger focus:ring-danger/20"
                      : "border-border"
                  )}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute inset-y-0 right-0 flex items-center justify-center w-11 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" aria-hidden="true" />
                    : <Eye className="h-4 w-4" aria-hidden="true" />
                  }
                </button>
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="text-xs text-danger">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border accent-primary"
                {...register("remember")}
              />
              <span className="text-sm text-muted-foreground">Remember me for 7 days</span>
            </label>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
              {!isSubmitting && <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden="true" />}
            </Button>
          </form>

          {/* Footer note */}
          <p className="mt-6 text-center text-xs text-muted-foreground/60">
            Protected by enterprise-grade security.
          </p>
        </motion.div>
      </div>

    </div>
  );
}
