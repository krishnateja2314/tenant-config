import { useState } from "react";
import { useParams, useSearch } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { signupUser } from "../features/auth/services/centralAuthApi";
import { getAuthConfig } from "../features/auth-config/services/authConfigApi";
import { Input, Button, Alert, Spinner } from "../shared/components";
import { router } from "../config/routes";

type FormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const validate = (form: FormState, passwordPolicy?: any): FormErrors => {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = "Full name is required.";
  if (!form.email.trim()) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "Enter a valid email address.";
  if (!form.password) errors.password = "Password is required.";
  else {
    if (passwordPolicy) {
      if (form.password.length < passwordPolicy.minLength)
        errors.password = `Password must be at least ${passwordPolicy.minLength} characters.`;
      if (passwordPolicy.requireUppercase && !/[A-Z]/.test(form.password))
        errors.password =
          "Password must contain at least one uppercase letter.";
      if (passwordPolicy.requireNumbers && !/\d/.test(form.password))
        errors.password = "Password must contain at least one number.";
      if (
        passwordPolicy.requireSpecialChars &&
        !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password)
      )
        errors.password =
          "Password must contain at least one special character.";
    } else {
      if (form.password.length < 8)
        errors.password = "Password must be at least 8 characters.";
    }
  }
  if (!form.confirmPassword)
    errors.confirmPassword = "Please confirm your password.";
  else if (form.password !== form.confirmPassword)
    errors.confirmPassword = "Passwords do not match.";
  return errors;
};

export function TenantSignupPage() {
  const { tenantId } = useParams({ from: "/tenantconfig/signup/$tenantId" });
  const { callbackUrl } = useSearch({ from: "/tenantconfig/signup/$tenantId" });

  const { isLoading, data: authConfig } = useQuery({
    queryKey: ["auth-config", tenantId],
    queryFn: () => getAuthConfig(tenantId || ""),
    enabled: !!tenantId,
    select: (res) => res.data,
  });

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverMessage, setServerMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading || !authConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleChange =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors((err) => ({ ...err, [field]: undefined }));
      setServerMessage(null);
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validate(form, authConfig?.passwordPolicy);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setIsSubmitting(true);
    const response = await signupUser({
      tenantId: tenantId || "",
      name: form.name,
      email: form.email,
      password: form.password,
    });
    setIsSubmitting(false);

    if (response.success) {
      setServerMessage({
        type: "success",
        text: "Account created successfully. Redirecting to login...",
      });
      setTimeout(() => {
        const target = callbackUrl
          ? `/tenantconfig/auth/${tenantId}?callbackUrl=${encodeURIComponent(
              callbackUrl,
            )}`
          : `/tenantconfig/auth/${tenantId}`;
        router.navigate({ to: target });
      }, 1800);
    } else {
      setServerMessage({ type: "error", text: response.message });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold text-text-primary">Tenant Signup</h2>
        <p className="text-sm text-text-muted mt-2">
          Create a user account for tenant{" "}
          <span className="font-semibold">{tenantId || "unknown"}</span>.
        </p>
      </div>

      <AnimatePresence>
        {serverMessage && (
          <Alert type={serverMessage.type} message={serverMessage.text} />
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Full Name"
          type="text"
          placeholder="Jane Doe"
          value={form.name}
          onChange={handleChange("name")}
          error={errors.name}
          autoFocus
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="user@tenant.com"
          value={form.email}
          onChange={handleChange("email")}
          error={errors.email}
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          placeholder="Create a password"
          value={form.password}
          onChange={handleChange("password")}
          error={errors.password}
          autoComplete="new-password"
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm password"
          value={form.confirmPassword}
          onChange={handleChange("confirmPassword")}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />
        <Button loading={isSubmitting} type="submit" className="w-full">
          Create Tenant User
        </Button>
      </form>

      <p className="text-center text-sm text-text-muted">
        Already registered?{" "}
        <button
          type="button"
          onClick={() =>
            router.navigate({
              to: callbackUrl
                ? `/tenantconfig/auth/${tenantId}?callbackUrl=${encodeURIComponent(
                    callbackUrl,
                  )}`
                : `/tenantconfig/auth/${tenantId}`,
            })
          }
          className="text-accent hover:underline font-medium"
        >
          Sign in
        </button>
      </p>
    </motion.div>
  );
}
