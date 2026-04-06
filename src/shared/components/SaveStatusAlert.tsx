import { motion } from "framer-motion";
import type { SaveStatus } from "../../features/auth-config/hooks/useSaveConfig";

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
            {status.errors.map((e: string, i: number) => (
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
