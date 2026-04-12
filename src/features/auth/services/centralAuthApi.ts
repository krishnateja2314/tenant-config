const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

interface AuthConfigPayload {
  tenantId: string;
  email: string;
  domainId?: string | null;
}

interface LoginPayload {
  tenantId: string;
  email: string;
  password?: string;
  domainId?: string | null;
}

interface GetAuthConfigPayload {
  tenantId: string;
  domainId?: string | null;
}

interface VerifyOtpPayload {
  email: string;
  sessionToken: string;
  otp: string;
}

interface AuthConfigResponse {
  tenantId: string;
  domainId: string | null;
  passwordEnabled: boolean;
  ssoEnabled: boolean;
  otpEnabled: boolean;
  mfaEnabled: boolean;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    expiryDays: number;
  };
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
}

export interface IdentifyResponse {
  success: boolean;
  message: string;
  data?: {
    email: string;
    tenantId: string;
    domainId: string | null;
    role: string;
    authConfig: AuthConfigResponse;
  };
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    requiresMFA?: boolean;
    requiresTotp?: boolean;
    requiresTotpSetup?: boolean;
    sessionToken?: string;
    token?: string;
    requiresSSO?: boolean;
    otpauthUrl?: string;
    totpSecret?: string;
  };
}

const handleNetworkError = (error: unknown) => {
  console.error("[CentralAuth API Error]", error);
  return {
    success: false,
    message:
      error instanceof Error
        ? error.message
        : "An unexpected network error occurred.",
  } as IdentifyResponse & LoginResponse;
};

export async function identifyUser(
  payload: AuthConfigPayload,
): Promise<IdentifyResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/central-auth/identify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return (await response.json()) as IdentifyResponse;
  } catch (error) {
    return handleNetworkError(error);
  }
}

export async function getAuthConfig(
  payload: GetAuthConfigPayload,
): Promise<IdentifyResponse> {
  try {
    const query = new URLSearchParams();
    query.set("tenantId", payload.tenantId);
    if (payload.domainId) {
      query.set("domainId", payload.domainId);
    }

    const response = await fetch(
      `${API_BASE_URL}/api/central-auth/config?${query.toString()}`,
    );
    return (await response.json()) as IdentifyResponse;
  } catch (error) {
    return handleNetworkError(error);
  }
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/central-auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return (await response.json()) as LoginResponse;
  } catch (error) {
    return handleNetworkError(error);
  }
}

export async function verifyOtp(
  payload: VerifyOtpPayload,
): Promise<LoginResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/central-auth/verify-otp`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    return (await response.json()) as LoginResponse;
  } catch (error) {
    return handleNetworkError(error);
  }
}

interface VerifyTotpPayload {
  email: string;
  sessionToken: string;
  totp: string;
}

export async function verifyTotp(
  payload: VerifyTotpPayload,
): Promise<LoginResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/central-auth/verify-totp`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    return (await response.json()) as LoginResponse;
  } catch (error) {
    return handleNetworkError(error);
  }
}

interface SignupPayload {
  tenantId: string;
  name: string;
  email: string;
  password: string;
}

export async function signupUser(
  payload: SignupPayload,
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/central-auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    return handleNetworkError(error) as { success: boolean; message: string };
  }
}
