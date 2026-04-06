import { AnimatePresence, motion } from "framer-motion";

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
