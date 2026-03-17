import { useEffect } from "react";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "./router";
import { verifySession } from "./api/auth.api";
import { useAuthStore } from "./store/auth.store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Inner component so it can use the Zustand hook
function AppBootstrap() {
  const { isAuthenticated, sessionVerified, setAdmin, clearAuth, setSessionVerified } =
    useAuthStore((s) => ({
      isAuthenticated: s.isAuthenticated,
      sessionVerified: s.sessionVerified,
      setAdmin: s.setAdmin,
      clearAuth: s.clearAuth,
      setSessionVerified: s.setSessionVerified,
    }));

  useEffect(() => {
    // Only verify if sessionStorage says we're logged in.
    // If sessionStorage has no auth state, skip the call — user is definitely logged out.
    if (!isAuthenticated) {
      setSessionVerified(true);
      return;
    }

    // sessionStorage claims authenticated — verify the JWT cookie with the backend
    verifySession().then((res) => {
      if (res.success && res.data?.admin) {
        // Token valid — update admin profile in case anything changed
        setAdmin(res.data.admin);
      } else {
        // Token expired or invalid — clear everything and send to login
        clearAuth();
        router.navigate({ to: "/login" });
      }
    }).catch(() => {
      // Network error — clear auth to be safe
      clearAuth();
      router.navigate({ to: "/login" });
    });
  }, []); // runs once on mount

  // Block rendering until the session check completes.
  // This prevents a flash of the dashboard before a redirect to login.
  if (!sessionVerified) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-text-muted">Verifying session…</p>
        </div>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppBootstrap />
    </QueryClientProvider>
  );
}