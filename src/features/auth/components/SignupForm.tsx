import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { signupAdmin } from "../services/authApi";
import { Input, Button, Alert } from "../../../shared/components";
import { router } from "../../../config/routes";

interface FormState {
  name: string;
  email: string;
  tenantId: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  tenantId?: string;
  password?: string;
  confirmPassword?: string;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = "Full name is required.";
  if (!form.email.trim()) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "Enter a valid email address.";
  if (!form.tenantId.trim()) errors.tenantId = "Tenant ID is required.";
  else if (!/^[a-z0-9-]+$/.test(form.tenantId))
    errors.tenantId = "Only lowercase letters, numbers, and hyphens allowed.";
  if (!form.password) errors.password = "Password is required.";
  else if (form.password.length < 8)
    errors.password = "Password must be at least 8 characters.";
  else if (!/[A-Z]/.test(form.password))
    errors.password = "Must contain at least one uppercase letter.";
  else if (!/[0-9]/.test(form.password))
    errors.password = "Must contain at least one number.";
  if (!form.confirmPassword)
    errors.confirmPassword = "Please confirm your password.";
  else if (form.password !== form.confirmPassword)
    errors.confirmPassword = "Passwords do not match.";
  return errors;
}

function passwordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-400",
    "bg-lime-400",
    "bg-emerald-500",
  ];
  return {
    score,
    label: labels[score - 1] ?? "",
    color: colors[score - 1] ?? "bg-border",
  };
}

export function SignupForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    tenantId: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverMessage, setServerMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const mutation = useMutation({
    mutationFn: signupAdmin,
    onSuccess: (res) => {
      if (res.success) {
        setServerMessage({
          type: "success",
          text: "Account created! Redirecting to login…",
        });
        setTimeout(() => router.navigate({ to: "/login" }), 2000);
      } else {
        setServerMessage({ type: "error", text: res.message });
      }
    },
    onError: () => {
      setServerMessage({
        type: "error",
        text: "Network error. Please try again.",
      });
    },
  });

  const strength = passwordStrength(form.password);

  const handleChange =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors((err) => ({ ...err, [field]: undefined }));
      setServerMessage(null);
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    mutation.mutate({
      name: form.name,
      email: form.email,
      tenantId: form.tenantId,
      password: form.password,
    });
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
          Create Admin Account
        </h2>
        <p className="text-sm text-text-muted mt-1.5">
          Set up your tenant administration access
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AnimatePresence>
          {serverMessage && (
            <Alert type={serverMessage.type} message={serverMessage.text} />
          )}
        </AnimatePresence>

        <Input
          label="Full Name"
          type="text"
          placeholder="John Doe"
          value={form.name}
          onChange={handleChange("name")}
          error={errors.name}
          autoFocus
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="admin@tenant.com"
          value={form.email}
          onChange={handleChange("email")}
          error={errors.email}
          autoComplete="email"
        />
        <Input
          label="Tenant ID"
          type="text"
          placeholder="my-organization"
          value={form.tenantId}
          onChange={handleChange("tenantId")}
          error={errors.tenantId}
          hint="Unique identifier for your organization (e.g. IIT-Hyderabad)"
        />

        <div>
          <Input
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={handleChange("password")}
            error={errors.password}
            autoComplete="new-password"
          />
          {form.password.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2"
            >
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < strength.score ? strength.color : "bg-border"}`}
                  />
                ))}
              </div>
              <p className="text-xs text-text-muted mt-1">{strength.label}</p>
            </motion.div>
          )}
        </div>

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Repeat password"
          value={form.confirmPassword}
          onChange={handleChange("confirmPassword")}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <Button
          type="submit"
          loading={mutation.isPending}
          className="w-full mt-2"
        >
          Create Account
        </Button>
      </form>

      <p className="text-center text-xs text-text-muted mt-6">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => navigate({ to: "/login" })}
          className="text-accent hover:underline font-medium"
        >
          Sign in
        </button>
      </p>
    </motion.div>
  );
}
