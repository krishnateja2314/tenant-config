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

// Import the base URL from Vite environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// Helper for handling fetch errors consistently
const handleNetworkError = (error: unknown): AuthResponse => {
  console.error("[API Error]", error);
  return {
    success: false,
    message:
      error instanceof Error
        ? error.message
        : "An unexpected network error occurred.",
  };
};

// ── Step 1: Password login ────────────────────────────────────────────────────
export async function loginAdmin(
  payload: AdminLoginPayload,
): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
}

// ── Step 2: MFA / OTP verification ───────────────────────────────────────────
export async function verifyMFA(
  payload: MFAVerifyPayload,
): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/verify-mfa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
}

// ── Signup ────────────────────────────────────────────────────────────────────
export async function signupAdmin(
  payload: AdminSignupPayload,
): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
}

// ── Logout ────────────────────────────────────────────────────────────────────
export async function logoutAdmin(): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
}

// ── Resend OTP ────────────────────────────────────────────────────────────────
export async function resendOTP(sessionToken: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sessionToken }),
    });
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
}

// ── Verify existing session on app boot ──────────────────────────────────────
export async function verifySession(): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/me`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
}
