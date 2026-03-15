import { motion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { logoutAdmin } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";
import { useAuthConfigStore } from "../store/authConfig.store";
import { router } from "../router";

const NAV_ITEMS = [
  { label: "Auth Settings", path: "/auth-config", icon: "⚙" },
  { label: "Password Policy", path: "/auth-config/password-policy", icon: "🔑" },
  { label: "SSO & OTP", path: "/auth-config/sso-otp", icon: "🔗" },
  { label: "Session Rules", path: "/auth-config/session", icon: "⏱" },
];

export function Sidebar() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const admin = useAuthStore((s) => s.admin);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const clearConfig = useAuthConfigStore((s) => s.clearConfig);
  const isDirty = useAuthConfigStore((s) => s.isDirty);

  const logoutMutation = useMutation({
    mutationFn: logoutAdmin,
    onSettled: () => {
      clearAuth();
      clearConfig();
      router.navigate({ to: "/login" });
    },
  });

  return (
    <aside className="w-64 flex-shrink-0 bg-surface border-r border-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-black text-sm">TC</span>
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">TenantConfig</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Control Panel</p>
          </div>
        </div>
      </div>

      {/* Tenant badge */}
      {admin && (
        <div className="mx-4 mt-4 px-3 py-2 bg-accent/10 border border-accent/20 rounded-lg">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-accent">Active Tenant</p>
          <p className="text-xs text-text-primary font-medium mt-0.5 truncate">{admin.tenantId}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto mt-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted/60 px-3 mb-3">
          Configuration
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath === item.path || currentPath.startsWith(item.path + "/");
          return (
            <button
              key={item.path}
              onClick={() => router.navigate({ to: item.path })}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left relative ${
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-text-muted hover:text-text-primary hover:bg-surface-2"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-accent/10 rounded-lg"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <span className="relative z-10 text-base">{item.icon}</span>
              <span className="relative z-10">{item.label}</span>
              {isActive && isDirty && (
                <span className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" title="Unsaved changes" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User & logout */}
      <div className="p-4 border-t border-border">
        {admin && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-accent">
                {admin.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate">{admin.name}</p>
              <p className="text-[10px] text-text-muted truncate">{admin.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-150 disabled:opacity-50"
        >
          <span>→</span>
          <span>{logoutMutation.isPending ? "Signing out…" : "Sign Out"}</span>
        </button>
      </div>
    </aside>
  );
}
