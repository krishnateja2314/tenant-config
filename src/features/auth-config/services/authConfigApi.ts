export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expiryDays: number; // 0 = never expires
}

export interface AuthConfigPayload {
  tenantId: string;
  domainId?: string | null;
  requestedDomainId?: string | null;
  sourceType?: "domain" | "tenant" | null;
  sourceDomainId?: string | null;
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


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// Helper for handling fetch errors consistently
const handleNetworkError = <T>(error: unknown): ApiResponse<T> => {
  console.error("[API Error]", error);
  return {
    success: false,
    message:
      error instanceof Error
        ? error.message
        : "An unexpected network error occurred.",
  };
};

// ── GET auth config ───────────────────────────────────────────────────────────
export async function getAuthConfig(
  tenantId: string,
  domainId?: string | null,
): Promise<ApiResponse<AuthConfigPayload>> {
  try {
    const query =
      domainId && domainId.length > 0
        ? `?domainId=${encodeURIComponent(domainId)}`
        : "";
    const response = await fetch(
      `${API_BASE_URL}/api/auth-config/${tenantId}${query}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );
    return await response.json();
  } catch (error) {
    return handleNetworkError<AuthConfigPayload>(error);
  }
}

// ── UPDATE auth config ────────────────────────────────────────────────────────
export async function updateAuthConfig(
  tenantId: string,
  payload: Partial<AuthConfigPayload>,
  domainId?: string | null,
): Promise<ApiResponse<AuthConfigPayload>> {
  try {
    const query =
      domainId && domainId.length > 0
        ? `?domainId=${encodeURIComponent(domainId)}`
        : "";
    const response = await fetch(
      `${API_BASE_URL}/api/auth-config/${tenantId}${query}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      },
    );
    return await response.json();
  } catch (error) {
    return handleNetworkError<AuthConfigPayload>(error);
  }
}

// ── VALIDATE config ───────────────────────────────────────────────────────────
export async function validateAuthConfig(
  payload: Partial<AuthConfigPayload>,
): Promise<ApiResponse<{ valid: boolean; errors?: string[] }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth-config/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    return handleNetworkError<{ valid: boolean; errors?: string[] }>(error);
  }
}

export async function cascadeDomainAuthConfig(
  tenantId: string,
  domainId: string,
): Promise<
  ApiResponse<{
    sourceDomainId: string;
    scannedChildren: number;
    skippedExisting: number;
    cascaded: number;
  }>
> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth-config/${tenantId}/cascade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ domainId }),
    });

    return await response.json();
  } catch (error) {
    return handleNetworkError<{
      sourceDomainId: string;
      scannedChildren: number;
      skippedExisting: number;
      cascaded: number;
    }>(error);
  }
}
