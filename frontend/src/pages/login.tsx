/**
 * Login page — enterprise login with animated background.
 */

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, Bot, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";
import { login as apiLogin } from "@/services/auth-service";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const floatingItems = [
  { text: "SOC 2 Compliant", x: "5%", y: "20%" },
  { text: "99.9% Uptime", x: "80%", y: "15%" },
  { text: "End-to-end encrypted", x: "72%", y: "75%" },
  { text: "GDPR Ready", x: "8%", y: "78%" },
];

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

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
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
      // Clear any conversations from the previous user BEFORE setting new auth
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
      {/* Left panel */}
      <div className="relative hidden lg:flex lg:w-1/2 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900" />
        <div className="absolute inset-0 dot-pattern opacity-10" />

        {/* Floating badges */}
        {floatingItems.map((item) => (
          <motion.div
            key={item.text}
            className="absolute hidden xl:flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white"
            style={{ left: item.x, top: item.y }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            {item.text}
          </motion.div>
        ))}

        {/* Glow effects */}
        <div className="absolute top-1/3 left-1/4 h-64 w-64 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 h-64 w-64 rounded-full bg-accent-500/15 blur-3xl" />

        <div className="relative flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
              <Bot className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold leading-none">Enterprise AI</p>
              <p className="text-xs text-white/60 mt-0.5">Knowledge Assistant</p>
            </div>
          </div>

          {/* Main copy */}
          <div>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Badge className="mb-6 bg-white/15 text-white border-white/20 gap-1.5">
                <Sparkles className="h-3 w-3" />
                AI-Powered Knowledge
              </Badge>
              <h1 className="text-4xl font-bold leading-tight text-balance">
                Your company's knowledge,{" "}
                <span className="text-accent-300">at your fingertips.</span>
              </h1>
              <p className="mt-4 text-base text-white/70 leading-relaxed max-w-sm">
                Ask questions. Get instant, cited answers from your organization's documents.
                Secure, fast, and built for enterprise scale.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-10 space-y-3"
            >
              {[
                "Role-based access control",
                "End-to-end audit logs",
                "Built-in AI guardrails",
                "50+ document formats",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/20">
                    <span className="h-2 w-2 rounded-full bg-success" />
                  </div>
                  <span className="text-sm text-white/80">{item}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <p className="text-xs text-white/30">© {new Date().getFullYear()} Enterprise AI Knowledge Assistant</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12 lg:px-16">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-accent-500">
            <Bot className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
          <span className="font-bold text-foreground">Enterprise AI</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to your Enterprise AI workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* API-level error */}
            {apiError && (
              <div role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
                {apiError}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                leftAdornment={<Mail className="h-4 w-4" aria-hidden="true" />}
                error={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="text-xs text-danger">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <a href="#" className="text-xs text-primary hover:underline">
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                leftAdornment={<Lock className="h-4 w-4" aria-hidden="true" />}
                rightAdornment={
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword
                      ? <EyeOff className="h-4 w-4" aria-hidden="true" />
                      : <Eye className="h-4 w-4" aria-hidden="true" />
                    }
                  </button>
                }
                error={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                {...register("password")}
              />
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

            <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
              {!isSubmitting && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Protected by enterprise-grade security.
          </p>

          <div className="mt-8 rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-xs font-medium text-foreground mb-2">Demo accounts</p>
            <p className="text-xs text-muted-foreground">admin@finsolve.com — Password123!</p>
            <p className="text-xs text-muted-foreground">finance@finsolve.com — Password123!</p>
            <p className="text-xs text-muted-foreground">hr@finsolve.com — Password123!</p>
            <Badge variant="success" className="mt-2 text-2xs">All roles available</Badge>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
