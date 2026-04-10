import { useMemo, useState } from "react";
import { Link, useParams, useSearch } from "@tanstack/react-router";
import { Input, Button, Alert } from "../shared/components";
import {
  identifyUser,
  loginUser,
  verifyOtp,
} from "../features/auth/services/centralAuthApi";

type Step = "identify" | "challenge" | "verifyOtp" | "success";

export function CentralAuthPage() {
  const { tenantId } = useParams({ from: "/tenantconfig/auth/$tenantId" });
  const { callbackUrl } = useSearch({ from: "/tenantconfig/auth/$tenantId" });

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

  const modeLabel = useMemo(() => {
    if (step === "identify") return "Identify";
    if (step === "challenge") return "Authenticate";
    if (step === "verifyOtp") return "Verify OTP";
    return "Success";
  }, [step]);

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
    const response = await identifyUser({ tenantId, email });
    setIsLoading(false);

    if (!response.success) {
      setError(response.message);
      return;
    }

    setAuthConfig(response.data?.authConfig ?? null);
    setDomainId(response.data?.domainId ?? null);
    setInfo(
      response.data?.authConfig?.passwordEnabled
        ? "Password is required by your tenant configuration."
        : response.data?.authConfig?.ssoEnabled
          ? "SSO is enabled for this tenant."
          : "Continue to complete authentication.",
    );

    if (response.data?.authConfig?.passwordEnabled) {
      setStep("challenge");
    } else if (response.data?.authConfig?.ssoEnabled) {
      setStep("success");
      setInfo("SSO login is enabled. Use your identity provider to continue.");
    } else if (response.data?.authConfig?.otpEnabled) {
      setStep("challenge");
    } else {
      setStep("success");
    }
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
    const response = await loginUser({ tenantId, email, password });
    setIsLoading(false);

    if (!response.success) {
      setError(response.message);
      return;
    }

    if (response.data?.requiresMFA && response.data?.sessionToken) {
      setSessionToken(response.data.sessionToken);
      setStep("verifyOtp");
      setInfo("Enter the OTP sent to your email.");
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
          <Button loading={isLoading} type="submit" className="w-full">
            Continue
          </Button>
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
          <Button loading={isLoading} type="submit" className="w-full">
            Continue
          </Button>
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
