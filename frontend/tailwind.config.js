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
        warning: "#f59e0b",

        // Thème Lumineux & Luxueux : fond clair, accents riches
        "luxury-bg": "#fafaf7",           // Blanc cassé très doux
        "luxury-bg-soft": "#f5f3f0",      // Gris perle
        "luxury-card": "#ffffff",          // Blanc pur pour les cartes
        "luxury-sapphire": "#0c3c6e",     // Bleu saphir profond
        "luxury-champagne": "#d4af37",    // Or/champagne subtil
        "luxury-platinum": "#e8e8e8",     // Platine léger
        "luxury-text": "#1a1a1a",         // Texte très foncé
        "luxury-text-light": "#6b7280",   // Texte secondaire
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Lexend", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
      },
      boxShadow: {
        sm: "0 2px 4px rgba(0,0,0,0.02)",
        md: "0 8px 16px -4px rgba(59,130,246,0.08)",
        lg: "0 20px 24px -4px rgba(0,0,0,0.1)",
        luxury: "0 4px 12px rgba(0,0,0,0.08)",
        "luxury-lg": "0 12px 32px rgba(0,0,0,0.1)",
      },
    },
  },
  plugins: [],
};
