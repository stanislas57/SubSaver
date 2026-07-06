import { LoginForm } from "@/components/auth/LoginForm";
import { GoldParticles } from "@/components/auth/GoldParticles";

/** Page de connexion immersive : contrairement au reste de l'app (thème clair),
 * elle plonge dans un fond Bleu Nuit avec un réseau de particules dorées animé,
 * et la carte de connexion flotte au-dessus en glassmorphism. */
export function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-luxury-night px-6 py-12">
      <GoldParticles />

      {/* Halos lumineux d'ambiance */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-1/4 h-[420px] w-[420px] rounded-full bg-luxury-gold/10 blur-[140px]" />
        <div className="absolute -right-32 bottom-0 h-[380px] w-[380px] rounded-full bg-luxury-sapphire/30 blur-[140px]" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src="/logo-dark-bg.svg" alt="SubServer" className="h-14 w-auto" />
          <span className="font-display text-2xl font-bold tracking-tight text-slate-50">SubServer</span>
          <p className="text-sm text-slate-400">Vos abonnements, sous contrôle.</p>
        </div>

        <div className="rounded-3xl border border-luxury-gold/30 bg-white/10 p-8 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
