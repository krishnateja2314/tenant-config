/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas:    "var(--color-canvas)",
        surface:   "var(--color-surface)",
        "surface-2": "var(--color-surface-2)",
        border:    "var(--color-border)",
        accent:    "var(--color-accent)",
        "accent-hover": "var(--color-accent-hover)",
        text: {
          primary: "var(--color-text-primary)",
          muted:   "var(--color-text-muted)",
        },
      },
      fontFamily: {
        display: ["Syne", "system-ui", "sans-serif"],
        body:    ["DM Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "var(--shadow-glow)",
      },
      borderRadius: {
        xl:  "0.75rem",
        "2xl": "1rem",
      },
      animation: {
        "spin-slow": "spin 2s linear infinite",
      },
    },
  },
  plugins: [],
};
