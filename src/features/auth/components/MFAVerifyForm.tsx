import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { verifyMFA, resendOTP } from "../services/authApi";
import { useAuthStore } from "../../../stores/auth.store";
import { Button, Alert } from "../../../shared/components";

const OTP_LENGTH = 6;

export function MFAVerifyForm() {
  const navigate = useNavigate();
  const { mfaSessionToken, pendingEmail, setAdmin, clearAuth, admin } =
    useAuthStore((s) => ({
      mfaSessionToken: s.mfaSessionToken,
      pendingEmail: s.pendingEmail,
      setAdmin: s.setAdmin,
      clearAuth: s.clearAuth,
      admin: s.admin,
    }));

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [serverError, setServerError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if there's no pending MFA session
  useEffect(() => {
    if (admin) return;

    if (!mfaSessionToken || !pendingEmail) {
      navigate({ to: "/login" });
    }
  }, [mfaSessionToken, pendingEmail, admin, navigate]);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  const verifyMutation = useMutation({
    mutationFn: verifyMFA,
    onSuccess: (res) => {
      if (res.success && res.data?.admin) {
        setAdmin(res.data.admin);
        navigate({ to: "/auth-config" });
      } else {
        setServerError(res.message || "Verification failed.");
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      }
    },
    onError: () => {
      setServerError("Network error. Please try again.");
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => resendOTP(mfaSessionToken!),
    onSuccess: (res) => {
      setResendSuccess(res.success);
      setResendCooldown(30);
      setTimeout(() => setResendSuccess(false), 3000);
    },
  });

  const handleOtpChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = char;
    setOtp(next);
    setServerError(null);

    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (char && index === OTP_LENGTH - 1 && next.every((d) => d !== "")) {
      submitOTP(next.join(""));
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    const next = [...otp];
    pasted.split("").forEach((char, i) => {
      next[i] = char;
    });
    setOtp(next);
    if (pasted.length === OTP_LENGTH) submitOTP(pasted);
    else inputRefs.current[pasted.length]?.focus();
  };

  const submitOTP = (code: string) => {
    if (!mfaSessionToken || !pendingEmail) return;
    verifyMutation.mutate({
      email: pendingEmail,
      otp: code,
      sessionToken: mfaSessionToken,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      setServerError("Please enter the complete 6-digit OTP.");
      return;
    }
    submitOTP(code);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">
          Two-Factor Verification
        </h2>
        <p className="text-sm text-text-muted mt-1.5">
          We sent a 6-digit code to{" "}
          <span className="text-accent font-medium">
            {pendingEmail ? maskEmail(pendingEmail) : "your email"}
          </span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <AnimatePresence>
          {serverError && <Alert type="error" message={serverError} />}
          {resendSuccess && (
            <Alert type="success" message="OTP resent successfully." />
          )}
        </AnimatePresence>

        {/* OTP Boxes */}
        <div className="flex gap-3 justify-center" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <motion.input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              autoFocus={i === 0}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className={`w-12 h-14 text-center text-xl font-bold rounded-xl border bg-surface-2 text-text-primary outline-none transition-all duration-200 focus:ring-2 focus:ring-accent/50 focus:border-accent caret-transparent ${
                digit ? "border-accent/60 bg-accent/5" : "border-border"
              }`}
            />
          ))}
        </div>

        <Button
          type="submit"
          loading={verifyMutation.isPending}
          className="w-full"
        >
          Verify and Sign In
        </Button>
      </form>

      <div className="flex items-center justify-between mt-6 text-xs text-text-muted">
        <button
          type="button"
          onClick={() => {
            clearAuth();
            navigate({ to: "/login" });
          }}
          className="hover:text-text-primary transition-colors"
        >
          Back to Login
        </button>

        <button
          type="button"
          disabled={resendCooldown > 0 || resendMutation.isPending}
          onClick={() => resendMutation.mutate()}
          className="hover:text-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
        </button>
      </div>
    </motion.div>
  );
}

function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  return `${user.slice(0, 2)}${"*".repeat(Math.max(user.length - 4, 2))}${user.slice(-2)}@${domain}`;
}
