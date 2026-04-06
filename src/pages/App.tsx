import { useEffect } from "react";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "../config/routes";
import { verifySession } from "../features/auth/services/authApi";
import { useAuthStore } from "../stores/auth.store";

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
  const {
    isAuthenticated,
    sessionVerified,
    setAdmin,
    clearAuth,
    setSessionVerified,
  } = useAuthStore((s) => ({
    isAuthenticated: s.isAuthenticated,
    sessionVerified: s.sessionVerified,
    setAdmin: s.setAdmin,
    clearAuth: s.clearAuth,
    setSessionVerified: s.setSessionVerified,
  }));

  useEffect(() => {
    if (!isAuthenticated) {
      setSessionVerified(true);
      return;
    }

    verifySession()
      .then((res) => {
        if (res.success && res.data?.admin) {
          setAdmin(res.data.admin);
        } else {
          clearAuth();
          router.navigate({ to: "/login" });
        }
      })
      .catch(() => {
        clearAuth();
        router.navigate({ to: "/login" });
      });
  }, []);

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
