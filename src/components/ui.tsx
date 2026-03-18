import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import type { SaveStatus } from "../authConfig/useSaveConfig";

// ── Toggle Switch ─────────────────────────────────────────────────────────────
interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export function Toggle({
  checked,
  onChange,
  disabled,
  label,
  description,
}: ToggleProps) {
  return (
    <label
      className={`flex items-start gap-4 cursor-pointer group ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative mt-0.5 w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
          checked ? "bg-accent" : "bg-border"
        }`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
          style={{ x: checked ? 24 : 0 }}
        />
      </button>
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && (
            <p className="text-sm font-medium text-text-primary">{label}</p>
          )}
          {description && (
            <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}
    </label>
  );
}

// ── Input Field ───────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({
  label,
  error,
  hint,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`w-full bg-surface-2 border rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 outline-none transition-all duration-200 focus:ring-2 focus:ring-accent/50 focus:border-accent ${
          error ? "border-red-500 focus:ring-red-500/30" : "border-border"
        } ${className}`}
      />
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs text-red-400"
          >
            {error}
          </motion.p>
        )}
        {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      </AnimatePresence>
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  loading,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "relative inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-glow",
    secondary:
      "bg-surface-2 text-text-primary border border-border hover:border-accent/50 active:scale-[0.98]",
    ghost:
      "text-text-muted hover:text-text-primary hover:bg-surface-2 active:scale-[0.98]",
    danger:
      "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 active:scale-[0.98]",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      {...(props as any)}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </motion.button>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export function Card({ children, className = "", title, subtitle }: CardProps) {
  return (
    <div
      className={`bg-surface border border-border rounded-2xl p-6 ${className}`}
    >
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h3 className="text-base font-semibold text-text-primary">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-text-muted mt-1">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
interface BadgeProps {
  children: ReactNode;
  variant?: "success" | "warning" | "error" | "default";
}

export function Badge({ children, variant = "default" }: BadgeProps) {
  const variants = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
    default: "bg-accent/10 text-accent border-accent/20",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]}`}
    >
      {children}
    </span>
  );
}

// ── Toast-like notification ───────────────────────────────────────────────────
interface AlertProps {
  type: "success" | "error" | "info";
  message: string;
}

export function Alert({ type, message }: AlertProps) {
  const styles = {
    success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
    error: "bg-red-500/10 border-red-500/30 text-red-300",
    info: "bg-accent/10 border-accent/30 text-accent",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`rounded-lg border px-4 py-3 text-sm font-medium ${styles[type]}`}
    >
      {message}
    </motion.div>
  );
}

// ── Save status alert (success / error / validation with error list) ──────────
export function SaveStatusAlert({ status }: { status: SaveStatus }) {
  if (status.type === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="rounded-lg border px-4 py-3 bg-emerald-500/10 border-emerald-500/30 text-emerald-300 text-sm font-medium"
      >
        {status.text}
      </motion.div>
    );
  }

  if (status.type === "validation") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="rounded-lg border px-4 py-3 bg-amber-500/10 border-amber-500/30"
      >
        <p className="text-sm font-semibold text-amber-300">{status.text}</p>
        {status.errors && status.errors.length > 0 && (
          <ul className="mt-2 space-y-1">
            {status.errors.map((e, i) => (
              <li
                key={i}
                className="text-xs text-amber-300/80 flex items-start gap-2"
              >
                <span className="mt-0.5 flex-shrink-0">•</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    );
  }


  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-lg border px-4 py-3 bg-red-500/10 border-red-500/30 text-red-300 text-sm font-medium"
    >
      {status.text}
    </motion.div>
  );
}

// ── Section Divider ───────────────────────────────────────────────────────────
export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs font-semibold uppercase tracking-widest text-text-muted/60">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };
  return (
    <div
      className={`${sizes[size]} border-2 border-accent border-t-transparent rounded-full animate-spin`}
    />
  );
}
