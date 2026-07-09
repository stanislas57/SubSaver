import { Link } from "react-router-dom";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { GoldParticles } from "@/components/auth/GoldParticles";

/** Page d'inscription : même immersion Bleu Nuit + réseau de particules
 * dorées animé que LoginPage (cohérence des deux écrans d'authentification),
 * avec une carte glassmorphism centrée sur une seule colonne (pas
 * d'argumentaire marketing, contrairement à /login). Inscription en une
 * étape : le compte est actif immédiatement, l'utilisateur est redirigé vers
 * /login pour se connecter. */
export function RegisterPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-luxury-night px-6 py-12">
      <GoldParticles />

      {/* Halos lumineux d'ambiance */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 top-1/4 h-[420px] w-[420px] rounded-full bg-luxury-gold/10 blur-[140px]" />
        <div className="absolute -left-32 bottom-0 h-[380px] w-[380px] rounded-full bg-luxury-sapphire/30 blur-[140px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src="/logo-dark-bg.svg" alt="SubSaver" className="h-12 w-auto" />
          <span className="font-display text-xl font-bold tracking-tight text-slate-50">SubSaver</span>
        </div>

        {/* Carte glassmorphism */}
        <div className="rounded-3xl border border-luxury-gold/30 bg-white/10 p-8 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <RegisterForm />
        </div>

        {/* Lien accueil (discret) */}
        <p className="mt-6 text-center text-xs text-slate-400">
          <Link to="/" className="hover:underline">
            ← Retour à l'accueil
          </Link>
        </p>
      </div>
    </div>
  );
}
