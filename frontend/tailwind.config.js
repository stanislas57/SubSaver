/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "bg-app": "var(--bg-app)",
        "bg-sidebar": "var(--bg-sidebar)",
        surface: "var(--surface)",
        "surface-hover": "var(--surface-hover)",
        primary: "var(--primary)",
        "primary-hover": "var(--primary-hover)",
        "primary-light": "var(--primary-light)",
        accent: "var(--accent)",
        "text-main": "var(--text-main)",
        "text-muted": "var(--text-muted)",
        "text-sidebar": "var(--text-sidebar)",
        border: "var(--border)",
        "border-sidebar": "var(--border-sidebar)",
        danger: "#ef4444",
        success: "#10b981",
        warning: "#f59e0b",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Lexend", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
      },
      boxShadow: {
        sm: "0 2px 4px rgba(0,0,0,0.02)",
        md: "0 8px 16px -4px rgba(59,130,246,0.08)",
        lg: "0 20px 24px -4px rgba(0,0,0,0.1)",
      },
    },
  },
  plugins: [],
};
