import { useEffect, useRef, useState } from "react";
import { toCanvas } from "qrcode";
import { Link } from "@tanstack/react-router";
import { Input, Button, Alert } from "../shared/components";
import {
  getAuthConfig,
  identifyUser,
  loginUser,
  verifyOtp,
  verifyTotp,
} from "../features/auth/services/centralAuthApi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

type Step = "identify" | "challenge" | "verifyOtp" | "verifyTotp" | "success";

export function CentralAuthPage() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [routeDomainId, setRouteDomainId] = useState<string | null>(null);
  const [callbackUrl, setCallbackUrl] = useState<string | undefined>(undefined);

  const [step, setStep] = useState<Step>("identify");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [authConfig, setAuthConfig] = useState<any>(null);
  const [domainId, setDomainId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [finalToken, setFinalToken] = useState<string | null>(null);
  const [isTotpSetup, setIsTotpSetup] = useState(false);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [qrLoadError, setQrLoadError] = useState(false);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  const passwordEnabled = authConfig?.passwordEnabled ?? false;
  const ssoEnabled = authConfig?.ssoEnabled ?? false;
  const otpEnabled = authConfig?.otpEnabled ?? false;
  const canRequestOtp = authConfig != null && !passwordEnabled && otpEnabled;
  const canUseSso = authConfig != null && ssoEnabled;

  useEffect(() => {
    if (!otpauthUrl) {
      setQrLoadError(false);
      setIsGeneratingQr(false);
      if (qrCanvasRef.current) {
        const canvas = qrCanvasRef.current;
        const context = canvas.getContext("2d");
        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      return;
    }

    let canceled = false;
    setQrLoadError(false);
    setIsGeneratingQr(true);

    const canvas = qrCanvasRef.current;
    if (!canvas) {
      setQrLoadError(true);
      setIsGeneratingQr(false);
      return;
    }

    toCanvas(canvas, otpauthUrl, { width: 250, margin: 1 })
      .then(() => {
        if (canceled) return;
        setQrLoadError(false);
        setIsGeneratingQr(false);
      })
      .catch((err) => {
        console.error("QR generation failed", err);
        if (canceled) return;
        setQrLoadError(true);
        setIsGeneratingQr(false);
      });

    return () => {
      canceled = true;
    };
  }, [otpauthUrl]);

  useEffect(() => {
    const loadRouteParams = () => {
      const { pathname, search } = window.location;
      const match = pathname.match(
        /^\/tenantconfig\/auth\/([^/]+)(?:\/([^/]+))?$/,
      );
      if (match) {
        setTenantId(match[1]);
        setRouteDomainId(match[2] ?? null);
      }
      const query = new URLSearchParams(search);
      setCallbackUrl(query.get("callbackUrl") ?? undefined);
    };

    loadRouteParams();
  }, []);

  useEffect(() => {
    const loadAuthConfig = async () => {
      if (!tenantId) return;
      setError(null);
      setIsLoading(true);
      const response = await getAuthConfig({
        tenantId,
        domainId: routeDomainId,
      });
      setIsLoading(false);

      if (!response.success) {
        setError(response.message);
        return;
      }

      setAuthConfig(response.data?.authConfig ?? null);
      setDomainId(routeDomainId ?? null);
    };

    loadAuthConfig();
  }, [tenantId, routeDomainId]);

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!tenantId) {
      setError("Tenant ID is required in the URL.");
      return;
    }

    if (!email.trim()) {
      setError("Enter a valid email address.");
      return;
    }

    setIsLoading(true);
    const response = await identifyUser({
      tenantId,
      email,
      domainId: routeDomainId,
    });
    setIsLoading(false);

    if (!response.success) {
      setError(response.message);
      return;
    }

    setAuthConfig(response.data?.authConfig ?? null);
    setDomainId(response.data?.domainId ?? routeDomainId ?? null);
    setIsTotpSetup(false);
    setTotpSecret(null);
    setOtpauthUrl(null);

    const passwordEnabled = response.data?.authConfig?.passwordEnabled;
    const ssoEnabled = response.data?.authConfig?.ssoEnabled;
    const otpEnabled = response.data?.authConfig?.otpEnabled;

    if (!passwordEnabled && !ssoEnabled && otpEnabled) {
      setInfo("OTP is enabled for this tenant. Sending a code to your email.");
      const otpResponse = await loginUser({
        tenantId,
        email,
        domainId: routeDomainId,
      });
      if (!otpResponse.success) {
        setError(otpResponse.message);
        return;
      }
      if (otpResponse.data?.requiresMFA && otpResponse.data?.sessionToken) {
        setSessionToken(otpResponse.data.sessionToken);
        setStep("verifyOtp");
        return;
      }
      if (otpResponse.data?.token) {
        setFinalToken(otpResponse.data.token);
        setStep("success");
        redirectCallback(otpResponse.data.token);
        return;
      }
      setStep("verifyOtp");
      return;
    }

    if (!passwordEnabled && ssoEnabled) {
      if (otpEnabled) {
        setInfo(
          "SSO and OTP are enabled for this tenant. Choose your identity provider or request an OTP.",
        );
      } else {
        setInfo(
          "SSO is enabled for this tenant. Use your identity provider to continue.",
        );
      }
      setStep("identify");
      return;
    }

    if (passwordEnabled) {
      setInfo("Password is required by your tenant configuration.");
      setStep("challenge");
      return;
    }

    if (otpEnabled) {
      setInfo(
        "OTP is enabled for this tenant. Use the button below to request a code.",
      );
      setStep("identify");
      return;
    }

    setStep("success");
  };

  const redirectCallback = (token: string) => {
    if (callbackUrl) {
      const separator = callbackUrl.includes("?") ? "&" : "?";
      window.location.href = `${callbackUrl}${separator}token=${encodeURIComponent(
        token,
      )}`;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!tenantId || !email.trim()) {
      setError("Tenant and email are required.");
      return;
    }

    setIsLoading(true);
    const response = await loginUser({
      tenantId,
      email,
      password,
      domainId: routeDomainId,
    });
    setIsLoading(false);

    if (!response.success) {
      setError(response.message);
      return;
    }

    if (response.data?.requiresMFA && response.data?.sessionToken) {
      const receivedOtpauthUrl = response.data.otpauthUrl ?? null;
      setSessionToken(response.data.sessionToken);
      setOtpauthUrl(receivedOtpauthUrl);
      setTotpSecret(response.data.totpSecret ?? null);
      if (response.data.requiresTotpSetup) {
        setIsTotpSetup(true);
        setInfo(
          "MFA setup is required. Scan the QR code or enter the secret in your authenticator app.",
        );
        setStep("verifyTotp");
        return;
      }
      if (response.data.requiresTotp) {
        setInfo("Enter the authenticator code from your app.");
        setStep("verifyTotp");
        return;
      }

      setInfo("Enter the OTP sent to your email.");
      setStep("verifyOtp");
      return;
    }

    if (response.data?.token) {
      setFinalToken(response.data.token);
      setStep("success");
      redirectCallback(response.data.token);
      return;
    }

    setInfo("Login step completed. Continue with the next challenge.");
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email.trim() || !sessionToken || !otp.trim()) {
      setError("Email, OTP and session must all be provided.");
      return;
    }

    setIsLoading(true);
    const response = await verifyOtp({ email, sessionToken, otp });
    setIsLoading(false);

    if (!response.success) {
      setError(response.message);
      return;
    }

    if (response.data?.token) {
      setFinalToken(response.data.token);
      setStep("success");
      redirectCallback(response.data.token);
      return;
    }

    setError("Unable to complete OTP verification.");
  };

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email.trim() || !sessionToken || !otp.trim()) {
      setError("Email, authenticator code and session must all be provided.");
      return;
    }

    setIsLoading(true);
    const response = await verifyTotp({
      email,
      sessionToken,
      totp: otp,
    });
    setIsLoading(false);

    if (!response.success) {
      setError(response.message);
      return;
    }

    if (response.data?.token) {
      setFinalToken(response.data.token);
      setStep("success");
      redirectCallback(response.data.token);
      return;
    }

    setError("Unable to complete authenticator verification.");
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryRequiresTotp = urlParams.get("requiresTotp");
    const queryRequiresTotpSetup = urlParams.get("requiresTotpSetup");
    const queryEmail = urlParams.get("email");
    const querySessionToken = urlParams.get("sessionToken");
    const queryOtpauthUrl = urlParams.get("otpauthUrl");
    const queryTotpSecret = urlParams.get("totpSecret");

    if (
      queryEmail &&
      querySessionToken &&
      (queryRequiresTotp || queryRequiresTotpSetup)
    ) {
      setEmail(queryEmail);
      setSessionToken(querySessionToken);
      setIsTotpSetup(
        !!(queryRequiresTotpSetup || queryOtpauthUrl || queryTotpSecret),
      );
      setOtpauthUrl(queryOtpauthUrl || null);
      setTotpSecret(queryTotpSecret || null);
      setStep("verifyTotp");
      setInfo(
        queryRequiresTotpSetup || queryOtpauthUrl || queryTotpSecret
          ? "MFA setup is required. Scan the QR code or enter the secret in your authenticator app."
          : "Enter the authenticator code from your app.",
      );
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-text-primary">
          Central Tenant Auth
        </h2>
        <p className="text-sm text-text-muted mt-2">
          Tenant: <span className="font-semibold">{tenantId || "unknown"}</span>
          {domainId ? ` · Domain: ${domainId}` : ""}
        </p>
      </div>

      {error && <Alert type="error" message={error} />}
      {info && <Alert type="info" message={info} />}

      {authConfig && step !== "identify" && (
        <div className="rounded-2xl border border-border bg-surface-2 p-4 text-sm text-text-muted">
          <h4 className="text-sm font-semibold text-text-primary mb-3">
            Policy Preview
          </h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div>
              <p className="font-medium">Session Timeout</p>
              <p>{authConfig.sessionTimeoutMinutes} min</p>
            </div>
            <div>
              <p className="font-medium">Max Login Attempts</p>
              <p>
                {authConfig.maxLoginAttempts} attempt
                {authConfig.maxLoginAttempts === 1 ? "" : "s"}
              </p>
            </div>
            <div>
              <p className="font-medium">Lockout Duration</p>
              <p>{authConfig.lockoutDurationMinutes} min</p>
            </div>
          </div>
        </div>
      )}

      {step === "identify" && (
        <form onSubmit={handleIdentify} className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            placeholder="user@tenant.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            error={undefined}
          />
          {(!authConfig || authConfig.passwordEnabled) && (
            <Button loading={isLoading} type="submit" className="w-full">
              Continue
            </Button>
          )}

          {canRequestOtp && (
            <Button
              loading={isLoading}
              type="button"
              onClick={handleLogin}
              className="w-full"
            >
              Send OTP
            </Button>
          )}

          <p className="text-sm text-center text-text-muted">
            Need an account?{" "}
            <Link
              to="/tenantconfig/signup/$tenantId"
              params={{ tenantId: tenantId || "" }}
              search={{ callbackUrl }}
              className="text-accent hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>

          {authConfig?.ssoEnabled && (
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-text-muted mb-3">
                If your tenant has SSO enabled, you can use your identity
                provider instead of password login.
              </p>
              <Button
                type="button"
                onClick={() => {
                  window.location.href = `${API_BASE_URL}/api/central-auth/oauth/google?tenantId=${encodeURIComponent(
                    tenantId || "",
                  )}&callbackUrl=${encodeURIComponent(
                    callbackUrl ||
                      window.location.origin + `/tenantconfig/auth/${tenantId}`,
                  )}`;
                }}
                className="w-full"
                variant="secondary"
              >
                Continue with Google SSO
              </Button>
            </div>
          )}
        </form>
      )}

      {step === "challenge" && (
        <form onSubmit={handleLogin} className="space-y-5">
          <Input label="Email Address" type="email" value={email} readOnly />
          {authConfig?.passwordEnabled && (
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          )}
          {authConfig?.passwordEnabled && (
            <Button loading={isLoading} type="submit" className="w-full">
              Continue
            </Button>
          )}
          {authConfig?.ssoEnabled && (
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-text-muted mb-3">
                You can also log in through your identity provider.
              </p>
              <Button
                type="button"
                onClick={() => {
                  window.location.href = `${API_BASE_URL}/api/central-auth/oauth/google?tenantId=${encodeURIComponent(
                    tenantId || "",
                  )}&callbackUrl=${encodeURIComponent(
                    callbackUrl ||
                      window.location.origin + `/tenantconfig/auth/${tenantId}`,
                  )}`;
                }}
                className="w-full"
                variant="secondary"
              >
                Continue with Google SSO
              </Button>
            </div>
          )}
        </form>
      )}

      {step === "verifyOtp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <Input label="Email Address" type="email" value={email} readOnly />
          <Input
            label="OTP Code"
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <Button loading={isLoading} type="submit" className="w-full">
            Verify OTP
          </Button>
        </form>
      )}

      {step === "verifyTotp" && (
        <form onSubmit={handleVerifyTotp} className="space-y-5">
          <Input label="Email Address" type="email" value={email} readOnly />
          {otpauthUrl && (
            <div className="rounded-2xl border border-border bg-surface-2 p-4">
              <p className="text-sm font-semibold text-text-primary mb-3">
                Set up your authenticator app
              </p>
              <p className="text-xs text-text-muted mb-3">
                Scan the QR code below or enter the secret manually into Google
                Authenticator / Microsoft Authenticator.
              </p>
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-3xl border border-border bg-white p-3 shadow-sm flex items-center justify-center">
                  {isGeneratingQr ? (
                    <div className="text-sm text-text-muted">
                      Generating QR code…
                    </div>
                  ) : qrLoadError ? (
                    <div className="text-sm text-red-400 text-center">
                      Unable to generate the QR image. Please copy the secret
                      into your authenticator app manually.
                    </div>
                  ) : otpauthUrl ? (
                    <canvas
                      ref={qrCanvasRef}
                      width={250}
                      height={250}
                      className="rounded-xl"
                    />
                  ) : (
                    <div className="text-sm text-text-muted text-center">
                      QR code will appear here once MFA setup begins.
                    </div>
                  )}
                </div>
                {totpSecret && (
                  <div className="text-xs text-text-muted break-all text-center bg-surface-2 rounded-xl px-3 py-2">
                    {totpSecret}
                  </div>
                )}
              </div>
            </div>
          )}
          <Input
            label={
              otpauthUrl
                ? "Enter the code from your authenticator app"
                : "Authenticator code"
            }
            type="text"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <Button loading={isLoading} type="submit" className="w-full">
            Verify Authenticator Code
          </Button>
        </form>
      )}

      {step === "success" && (
        <div className="rounded-2xl border border-border bg-surface-2 p-6">
          <h3 className="text-xl font-semibold text-text-primary">
            Authentication Ready
          </h3>
          <p className="mt-3 text-sm text-text-muted leading-relaxed">
            {finalToken
              ? "Your session token is ready. Downstream apps should use this as proof of authentication."
              : authConfig?.ssoEnabled
                ? "SSO is enabled for this tenant. Continue using your identity provider."
                : "Authentication completed successfully."}
          </p>
          {finalToken && (
            <div className="mt-4 rounded-lg bg-surface p-4 border border-border text-xs text-text-muted overflow-x-auto">
              <strong className="block text-text-primary mb-2">Token</strong>
              <code className="break-all">{finalToken}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
