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

        // Thème "Luxe" — Bleu Nuit & Or sur fond clair
        "luxury-bg": "#f8fafc",            // Gris perle (fond app)
        "luxury-card": "#ffffff",           // Blanc pur (cartes Bento)
        "luxury-night": "#0A1128",          // Bleu Nuit profond (fond login, titres forts)
        "luxury-text": "#0F172A",           // Texte principal (bleu nuit lisible)
        "luxury-text-light": "#64748b",     // Texte secondaire
        "luxury-gold": "#D4AF37",           // Or élégant (accents vifs)
        "luxury-gold-deep": "#B08D3F",      // Or profond (texte doré lisible sur blanc)
        "luxury-gold-soft": "#FAF6EA",      // Fond doré très pâle (chips, badges)
        "luxury-sapphire": "#0c3c6e",       // Bleu saphir (accent secondaire, données)
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
        md: "0 8px 16px -4px rgba(10,17,40,0.08)",
        lg: "0 20px 24px -4px rgba(10,17,40,0.1)",
        luxury: "0 4px 16px rgba(10,17,40,0.07)",
        "luxury-lg": "0 12px 32px rgba(10,17,40,0.1)",
        gold: "0 0 24px -6px rgba(212,175,55,0.45)",
      },
    },
  },
  plugins: [],
};
