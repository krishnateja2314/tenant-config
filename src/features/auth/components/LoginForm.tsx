import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { loginAdmin } from "../services/authApi";
import { useAuthStore } from "../../../stores/auth.store";
import { Input, Button, Alert } from "../../../shared/components";
import { router } from "../../../config/routes";
import { isValidEmailAddress } from "../../../utils/email";

interface FormState {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.email.trim()) errors.email = "Email is required.";
  else if (!isValidEmailAddress(form.email))
    errors.email = "Enter a valid email address.";
  if (!form.password) errors.password = "Password is required.";
  else if (form.password.length < 6)
    errors.password = "Password must be at least 6 characters.";
  return errors;
}

export function LoginForm() {
  const navigate = useNavigate();
  const setMFAPending = useAuthStore((s) => s.setMFAPending);

  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: loginAdmin,
    onSuccess: (res) => {
      if (res.success && res.data?.requiresMFA && res.data.sessionToken) {
        setMFAPending(res.data.sessionToken, form.email);
        router.navigate({ to: "/verify-mfa" });
      } else {
        setServerError(res.message || "Login failed. Please try again.");
      }
    },
    onError: () => {
      setServerError(
        "Network error. Please check your connection and try again.",
      );
    },
  });

  const handleChange =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors((err) => ({ ...err, [field]: undefined }));
      setServerError(null);
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    mutation.mutate(form);
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
          Tenant Configuration
        </h2>
        <p className="text-sm text-text-muted mt-1.5">
          Sign in to your tenant configuration dashboard
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AnimatePresence>
          {serverError && <Alert type="error" message={serverError} />}
        </AnimatePresence>

        <Input
          label="Email Address"
          type="email"
          placeholder="admin@yourtenant.com"
          value={form.email}
          onChange={handleChange("email")}
          error={errors.email}
          autoComplete="email"
          autoFocus
        />

        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={form.password}
          onChange={handleChange("password")}
          error={errors.password}
          autoComplete="current-password"
        />

        <Button
          type="submit"
          loading={mutation.isPending}
          className="w-full mt-2"
        >
          Continue with MFA
        </Button>
      </form>

      <p className="text-center text-xs text-text-muted mt-6">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={() => navigate({ to: "/signup" })}
          className="text-accent hover:underline font-medium"
        >
          Create admin account
        </button>
      </p>

      <div className="mt-6 flex items-center gap-2 bg-surface-2 rounded-lg px-4 py-3 border border-border">
        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse flex-shrink-0" />
        <p className="text-xs text-text-muted leading-relaxed">
          A one-time password will be sent to your registered email after
          password verification.
        </p>
      </div>
    </motion.div>
  );
}
