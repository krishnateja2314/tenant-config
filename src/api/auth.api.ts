/**
 * Auth API Placeholders
 * Replace these with real fetch/axios calls to your Express backend.
 * All functions return Promises to simulate async API behaviour.
 */

export interface AdminLoginPayload {
  email: string;
  password: string;
}

export interface MFAVerifyPayload {
  email: string;
  otp: string;
  sessionToken: string;
}

export interface AdminSignupPayload {
  name: string;
  email: string;
  password: string;
  tenantId: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    requiresMFA?: boolean;
    sessionToken?: string;
    admin?: {
      id: string;
      name: string;
      email: string;
      tenantId: string;
      role: string;
    };
  };
}

// ── Step 1: Password login ────────────────────────────────────────────────────
export async function loginAdmin(
  payload: AdminLoginPayload,
): Promise<AuthResponse> {
  // TODO: POST /api/admin/login
  console.log("[API placeholder] loginAdmin", payload);
  await delay(800);
  if (payload.email && payload.password) {
    return {
      success: true,
      message: "Password verified. OTP sent to registered email.",
      data: { requiresMFA: true, sessionToken: "mock-session-token-xyz" },
    };
  }
  return { success: false, message: "Invalid credentials." };
}

// ── Step 2: MFA / OTP verification ───────────────────────────────────────────
export async function verifyMFA(
  payload: MFAVerifyPayload,
): Promise<AuthResponse> {
  // TODO: POST /api/admin/verify-mfa
  console.log("[API placeholder] verifyMFA", payload);
  await delay(800);
  if (payload.otp === "123456") {
    return {
      success: true,
      message: "MFA verified. Welcome back.",
      data: {
        admin: {
          id: "admin-001",
          name: "Krishna Teja",
          email: payload.email,
          tenantId: "tenant-abc",
          role: "TENANT_ADMIN",
        },
      },
    };
  }
  return { success: false, message: "Invalid or expired OTP." };
}

// ── Signup ────────────────────────────────────────────────────────────────────
export async function signupAdmin(
  payload: AdminSignupPayload,
): Promise<AuthResponse> {
  // TODO: POST /api/admin/signup
  console.log("[API placeholder] signupAdmin", payload);
  await delay(900);
  return { success: true, message: "Admin account created. Please log in." };
}

// ── Logout ────────────────────────────────────────────────────────────────────
export async function logoutAdmin(): Promise<AuthResponse> {
  // TODO: POST /api/admin/logout
  console.log("[API placeholder] logoutAdmin");
  await delay(400);
  return { success: true, message: "Logged out." };
}

// ── Resend OTP ────────────────────────────────────────────────────────────────
export async function resendOTP(sessionToken: string): Promise<AuthResponse> {
  // TODO: POST /api/admin/resend-otp
  console.log("[API placeholder] resendOTP", sessionToken);
  await delay(600);
  return { success: true, message: "OTP resent to registered email." };
}

// ── Verify existing session on app boot ──────────────────────────────────────
export async function verifySession(): Promise<AuthResponse> {
  // TODO: GET /api/admin/me
  // Browser sends the HttpOnly JWT cookie automatically.
  // Backend verifies signature + expiry, returns admin profile or 401.
  // Replace mock with: fetch("/api/admin/me", { credentials: "include" })
  console.log("[API placeholder] verifySession");
  await delay(400);
  // Set success: false to simulate an expired session
  return {
    success: true,
    message: "Session valid.",
    data: {
      admin: {
        id: "admin-001",
        name: "Krishna Teja",
        email: "admin@tenant.com",
        tenantId: "tenant-abc",
        role: "TENANT_ADMIN",
      },
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
