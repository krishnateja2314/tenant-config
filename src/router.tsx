import {
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
  redirect,
} from "@tanstack/react-router";

import { useAuthStore } from "./store/auth.store"; // Import the store
import { AuthLayout } from "./adminSignUp/AuthLayout";
import { LoginForm } from "./adminSignUp/LoginForm";
import { MFAVerifyForm } from "./adminSignUp/MFAVerifyForm";
import { SignupForm } from "./adminSignUp/SignupForm";
import { DashboardLayout } from "./authConfig/DashboardLayout";
import { AuthSettingsPage } from "./authConfig/AuthSettingsPage";
import { PasswordPolicyPage } from "./authConfig/PasswordPolicyPage";
import { SSOOTPPage } from "./authConfig/SSOOTPPage";
import { SessionRulesPage } from "./authConfig/SessionRulesPage";

// ── Root ──────────────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// ── Auth routes (Redirect away if already logged in) ──────────────────────────

// Reusable guard for routes where authenticated users SHOULD NOT be (login, signup)
const preventAuthenticatedGuard = () => {
  const { isAuthenticated, admin } = useAuthStore.getState();
  // Verify proper significance: Must be marked authenticated AND have a valid admin payload
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

const mfaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/verify-mfa",
  beforeLoad: () => {
    const { isAuthenticated, admin, mfaPending } = useAuthStore.getState();
    // If fully authenticated, go to dashboard
    if (isAuthenticated && admin?.tenantId) {
      throw redirect({ to: "/auth-config" });
    }
    // If they arrived here but MFA isn't actually pending, kick them to login
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

// ── Dashboard routes (Protect against unauthorized access) ────────────────────

// Reusable guard for routes where unauthenticated users SHOULD NOT be
const requireAuthenticatedGuard = () => {
  const { isAuthenticated, admin } = useAuthStore.getState();
  // Strict check: if missing the flag OR the admin data is corrupt/missing
  if (!isAuthenticated || !admin?.tenantId) {
    throw redirect({ to: "/login" });
  }
};

const authConfigRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth-config",
  beforeLoad: requireAuthenticatedGuard, // Protects all child routes!
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
  mfaRoute,
  authConfigRoute.addChildren([
    authConfigIndexRoute,
    passwordPolicyRoute,
    ssoOtpRoute,
    sessionRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
