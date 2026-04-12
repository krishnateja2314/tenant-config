import { motion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { logoutAdmin } from "../../../features/auth/services/authApi";
import { useAuthStore } from "../../../stores/auth.store";
import {
  useAuthConfigStore,
  useAnyDirty,
  useIsDirty,
  type PageKey,
} from "../authConfig.store";
import { router } from "../../../config/routes";

const NAV_ITEMS: {
  label: string;
  path: string;
  icon: string;
  pageKey: PageKey | string;
}[] = [
  {
    label: "Domain Structure",
    path: "/auth-config/domains",
    icon: "🏢",
    pageKey: "domain-structure",
  },
  {
    label: "Domain Auth Config",
    path: "/auth-config/domain-auth",
    icon: "🛡",
    pageKey: "domain-auth-config",
  },
  {
    label: "Mailing Lists", // NEW ITEM
    path: "/auth-config/mailing-lists",
    icon: "✉️",
    pageKey: "mailing-lists",
  },
  {
    label: "Auth Settings",
    path: "/auth-config",
    icon: "⚙",
    pageKey: "auth-settings",
  },
  {
    label: "Password Policy",
    path: "/auth-config/password-policy",
    icon: "🔑",
    pageKey: "password-policy",
  },
  {
    label: "SSO & OTP",
    path: "/auth-config/sso-otp",
    icon: "🔗",
    pageKey: "sso-otp",
  },
  {
    label: "Session Rules",
    path: "/auth-config/session",
    icon: "⏱",
    pageKey: "session",
  },
];

function NavItem({
  item,
  isActive,
}: {
  item: (typeof NAV_ITEMS)[number];
  isActive: boolean;
}) {
  // @ts-ignore - bypassing strict PageKey check for the new routes
  const isDirty = useIsDirty(item.pageKey);

  return (
    <button
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
      <span className="relative z-10 flex-1">{item.label}</span>
      {isDirty && (
        <span
          className="relative z-10 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"
          title="Unsaved changes"
        />
      )}
    </button>
  );
}

export function Sidebar() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const admin = useAuthStore((s) => s.admin);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const clearConfig = useAuthConfigStore((s) => s.clearConfig);
  const anyDirty = useAnyDirty();

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
            <p className="text-[10px] text-text-muted uppercase tracking-wider">
              Control Panel
            </p>
          </div>
        </div>
      </div>

      {/* Tenant badge */}
      {admin && (
        <div className="mx-4 mt-4 px-3 py-2 bg-accent/10 border border-accent/20 rounded-lg">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-accent">
            Active Tenant
          </p>
          <p className="text-xs text-text-primary font-medium mt-0.5 truncate">
            {admin.tenantId}
          </p>
        </div>
      )}

      {/* Global unsaved changes banner */}
      {anyDirty && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 animate-pulse" />
          <p className="text-[10px] font-semibold text-amber-400">
            Unsaved changes
          </p>
        </motion.div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto mt-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted/60 px-3 mb-3">
          Configuration
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive =
            currentPath === item.path ||
            currentPath.startsWith(item.path + "/");
          return <NavItem key={item.path} item={item} isActive={isActive} />;
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
              <p className="text-xs font-semibold text-text-primary truncate">
                {admin.name}
              </p>
              <p className="text-[10px] text-text-muted truncate">
                {admin.role}
              </p>
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
