import { motion } from "framer-motion";

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
