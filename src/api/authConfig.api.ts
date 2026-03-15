/**
 * Auth Configuration API Placeholders
 * Replace these with real fetch/axios calls to your Express backend.
 * JWT is sent automatically via the HttpOnly cookie set at login.
 */

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expiryDays: number; // 0 = never expires
}

export interface AuthConfigPayload {
  tenantId: string;
  passwordEnabled: boolean;
  ssoEnabled: boolean;
  otpEnabled: boolean;
  mfaEnabled: boolean;
  passwordPolicy: PasswordPolicy;
  allowedRoles: string[]; // roles that can use SSO
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

// ── GET auth config ───────────────────────────────────────────────────────────
export async function getAuthConfig(tenantId: string): Promise<ApiResponse<AuthConfigPayload>> {
  // TODO: GET /api/auth-config/:tenantId
  // Cookie-based JWT sent automatically by browser
  console.log("[API placeholder] getAuthConfig", tenantId);
  await delay(600);

  return {
    success: true,
    message: "Auth config fetched.",
    data: {
      tenantId,
      passwordEnabled: true,
      ssoEnabled: false,
      otpEnabled: true,
      mfaEnabled: true,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        expiryDays: 90,
      },
      allowedRoles: ["TENANT_ADMIN", "DOMAIN_ADMIN"],
      sessionTimeoutMinutes: 60,
      maxLoginAttempts: 5,
      lockoutDurationMinutes: 15,
    },
  };
}

// ── UPDATE auth config ────────────────────────────────────────────────────────
export async function updateAuthConfig(
  tenantId: string,
  payload: Partial<AuthConfigPayload>
): Promise<ApiResponse<AuthConfigPayload>> {
  // TODO: PUT /api/auth-config/:tenantId
  console.log("[API placeholder] updateAuthConfig", tenantId, payload);
  await delay(800);

  return {
    success: true,
    message: "Authentication configuration updated successfully.",
    data: { tenantId, ...payload } as AuthConfigPayload,
  };
}

// ── VALIDATE config ───────────────────────────────────────────────────────────
export async function validateAuthConfig(
  payload: Partial<AuthConfigPayload>
): Promise<ApiResponse<{ valid: boolean; errors?: string[] }>> {
  // TODO: POST /api/auth-config/validate
  console.log("[API placeholder] validateAuthConfig", payload);
  await delay(400);

  return {
    success: true,
    message: "Validation passed.",
    data: { valid: true },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
