/**
 * Application entry point.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { router } from "./routes";
import "./styles/globals.css";

// ---------------------------------------------------------------------------
// Apply persisted theme before first render to avoid flash
// ---------------------------------------------------------------------------

(function applyTheme() {
  try {
    const stored = localStorage.getItem("enterprise-ai-ui");
    const theme = stored ? (JSON.parse(stored) as { state?: { theme?: string } }).state?.theme : null;
    const resolved =
      theme === "dark" || theme === "light"
        ? theme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    document.documentElement.classList.add(resolved);
  } catch {
    // fallback — no theme class applied, CSS defaults take over
  }
})();

// ---------------------------------------------------------------------------
// React Query client
// ---------------------------------------------------------------------------

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 1 },
  },
});

// ---------------------------------------------------------------------------
// Root mount
// ---------------------------------------------------------------------------

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Missing #root element in index.html");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </React.StrictMode>
);
