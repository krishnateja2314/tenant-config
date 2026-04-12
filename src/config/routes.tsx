import {
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
  redirect,
  Link,
} from "@tanstack/react-router";

import { useAuthStore } from "../stores/auth.store";
import { AuthLayout } from "../layouts/AuthLayout";
import { LoginForm } from "../features/auth/components/LoginForm";
import { MFAVerifyForm } from "../features/auth/components/MFAVerifyForm";
import { SignupForm } from "../features/auth/components/SignupForm";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { AuthSettingsPage } from "../pages/AuthSettingsPage";
import { PasswordPolicyPage } from "../pages/PasswordPolicyPage";
import { SSOOTPPage } from "../pages/SSOOTPPage";
import { SessionRulesPage } from "../pages/SessionRulesPage";
import { AuthConfigDoc } from "../pages/AuthConfigDoc";
import { DomainConfigurationPage } from "../pages/DomainConfigurationPage";
import { DomainAuthConfigPage } from "../pages/DomainAuthConfigPage";
import { MailingListsPage } from "../pages/MailingListsPage"; // NEW IMPORT
import { CentralAuthPage } from "../pages/CentralAuthPage";
import { TenantSignupPage } from "../pages/TenantSignupPage";
import { motion } from "framer-motion";

// ── 404 Component ─────────────────────────────────────────────────────────────
const NotFoundPage = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      fontFamily: "system-ui, sans-serif",
    }}
  >
    <h1 style={{ fontSize: "4rem", margin: "0 0 1rem 0", color: "#374151" }}>
      404
    </h1>
    <h2 style={{ fontSize: "1.5rem", margin: "0 0 2rem 0", color: "#6B7280" }}>
      Page Not Found
    </h2>
    <p style={{ marginBottom: "2rem", color: "#9CA3AF" }}>
      The page you are looking for doesn't exist or has been moved.
    </p>
    <Link
      to="/"
      style={{
        padding: "0.75rem 1.5rem",
        backgroundColor: "#2563EB",
        color: "white",
        borderRadius: "0.375rem",
        textDecoration: "none",
        fontWeight: 500,
      }}
    >
      Return to Home
    </Link>
  </div>
);

// ── Root ──────────────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// ── Auth routes (Redirect away if already logged in) ──────────────────────────
const preventAuthenticatedGuard = () => {
  const { isAuthenticated, admin } = useAuthStore.getState();
  if (isAuthenticated && admin?.tenantId) {
    throw redirect({ to: "/auth-config" });
  }
};

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  beforeLoad: preventAuthenticatedGuard,
  component: () => (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  ),
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  beforeLoad: preventAuthenticatedGuard,
  component: () => (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  ),
});

const centralAuthRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tenantconfig/auth/$tenantId",
  validateSearch: (search) => ({
    callbackUrl: search.callbackUrl as string | undefined,
  }),
  component: () => (
    <AuthLayout>
      <CentralAuthPage />
    </AuthLayout>
  ),
});

const tenantSignupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tenantconfig/signup/$tenantId",
  validateSearch: (search) => ({
    callbackUrl: search.callbackUrl as string | undefined,
  }),
  component: () => (
    <AuthLayout>
      <TenantSignupPage />
    </AuthLayout>
  ),
});

const mfaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/verify-mfa",
  beforeLoad: () => {
    const { isAuthenticated, admin, mfaPending } = useAuthStore.getState();
    if (isAuthenticated && admin?.tenantId) {
      throw redirect({ to: "/auth-config" });
    }
    if (!mfaPending) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <AuthLayout>
      <MFAVerifyForm />
    </AuthLayout>
  ),
});

const docRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth-config-doc",
  component: () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-8"
    >
      <AuthConfigDoc />
    </motion.div>
  ),
});

// ── Dashboard routes (Protect against unauthorized access) ────────────────────
const requireAuthenticatedGuard = () => {
  const { isAuthenticated, admin } = useAuthStore.getState();
  if (!isAuthenticated || !admin?.tenantId) {
    throw redirect({ to: "/login" });
  }
};

const authConfigRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth-config",
  beforeLoad: requireAuthenticatedGuard,
  component: () => (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  ),
});

const authConfigIndexRoute = createRoute({
  getParentRoute: () => authConfigRoute,
  path: "/",
  component: AuthSettingsPage,
});

const passwordPolicyRoute = createRoute({
  getParentRoute: () => authConfigRoute,
  path: "/password-policy",
  component: PasswordPolicyPage,
});

const ssoOtpRoute = createRoute({
  getParentRoute: () => authConfigRoute,
  path: "/sso-otp",
  component: SSOOTPPage,
});

const sessionRoute = createRoute({
  getParentRoute: () => authConfigRoute,
  path: "/session",
  component: SessionRulesPage,
});

// Domain Configuration Route (From previous step)
const domainsRoute = createRoute({
  getParentRoute: () => authConfigRoute,
  path: "/domains",
  component: DomainConfigurationPage,
});

const domainAuthConfigRoute = createRoute({
  getParentRoute: () => authConfigRoute,
  path: "/domain-auth",
  component: DomainAuthConfigPage,
});

// NEW: Mailing Lists Route
const mailingListsRoute = createRoute({
  getParentRoute: () => authConfigRoute,
  path: "/mailing-lists",
  component: MailingListsPage,
});

// ── Index redirect ────────────────────────────────────────────────────────────
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    const { isAuthenticated, admin } = useAuthStore.getState();
    if (isAuthenticated && admin?.tenantId) {
      throw redirect({ to: "/auth-config" });
    } else {
      throw redirect({ to: "/login" });
    }
  },
  component: () => null,
});

// ── Router ────────────────────────────────────────────────────────────────────
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  centralAuthRoute,
  tenantSignupRoute,
  mfaRoute,
  docRoute,
  authConfigRoute.addChildren([
    authConfigIndexRoute,
    passwordPolicyRoute,
    ssoOtpRoute,
    sessionRoute,
    domainsRoute,
    domainAuthConfigRoute,
    mailingListsRoute, // <--- Registered here
  ]),
]);

export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFoundPage,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
