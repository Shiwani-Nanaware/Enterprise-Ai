/**
 * Application route configuration.
 */

import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { AuthLayout } from "@/layouts/auth-layout";
import { ProtectedRoute } from "./protected-route";
import { PageLoading } from "@/components/ui/loading-spinner";

const LandingPage = lazy(() => import("@/pages/landing"));
const LoginPage = lazy(() => import("@/pages/login"));
const DashboardPage = lazy(() => import("@/pages/dashboard"));
const ChatPage = lazy(() => import("@/pages/chat"));
const DocumentsPage = lazy(() => import("@/pages/documents"));
const AnalyticsPage = lazy(() => import("@/pages/analytics"));
const MonitoringPage = lazy(() => import("@/pages/monitoring"));
const EvaluationPage = lazy(() => import("@/pages/evaluation"));
const CostDashboardPage = lazy(() => import("@/pages/cost-dashboard"));
const GuardrailsPage = lazy(() => import("@/pages/guardrails"));
const SettingsPage = lazy(() => import("@/pages/settings"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const AdminPage = lazy(() => import("@/pages/admin"));
const NotFoundPage = lazy(() => import("@/pages/not-found"));

function Wrap({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoading />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Wrap><LandingPage /></Wrap>,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/login",
        element: <Wrap><LoginPage /></Wrap>,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: "/dashboard", element: <Wrap><DashboardPage /></Wrap> },
          { path: "/chat", element: <Wrap><ChatPage /></Wrap> },
          { path: "/documents", element: <Wrap><DocumentsPage /></Wrap> },
          { path: "/analytics", element: <Wrap><AnalyticsPage /></Wrap> },
          { path: "/monitoring", element: <Wrap><MonitoringPage /></Wrap> },
          { path: "/evaluation", element: <Wrap><EvaluationPage /></Wrap> },
          { path: "/cost", element: <Wrap><CostDashboardPage /></Wrap> },
          { path: "/guardrails", element: <Wrap><GuardrailsPage /></Wrap> },
          { path: "/settings", element: <Wrap><SettingsPage /></Wrap> },
          { path: "/profile", element: <Wrap><ProfilePage /></Wrap> },
          {
            element: <ProtectedRoute allowedRoles={["admin", "super_admin"]} />,
            children: [
              { path: "/admin", element: <Wrap><AdminPage /></Wrap> },
            ],
          },
        ],
      },
    ],
  },
  { path: "/app", element: <Navigate to="/dashboard" replace /> },
  { path: "*", element: <Wrap><NotFoundPage /></Wrap> },
]);
