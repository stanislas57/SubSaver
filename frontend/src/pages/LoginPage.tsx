import { LoginForm } from "@/components/auth/LoginForm";
import { GoldParticles } from "@/components/auth/GoldParticles";
import { HowItWorks } from "@/components/shared/HowItWorks";

/** Page de connexion immersive : contrairement au reste de l'app (thème clair),
 * elle plonge dans un fond Bleu Nuit avec un réseau de particules dorées animé.
 * Deux colonnes sur desktop : argumentaire marketing à gauche, carte de
 * connexion glassmorphism à droite. Empilé sur mobile. */
export function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center overflow-hidden bg-luxury-night px-6 py-12">
      <GoldParticles />

      {/* Halos lumineux d'ambiance */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-1/4 h-[420px] w-[420px] rounded-full bg-luxury-gold/10 blur-[140px]" />
        <div className="absolute -right-32 bottom-0 h-[380px] w-[380px] rounded-full bg-luxury-sapphire/30 blur-[140px]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
        {/* Colonne marketing */}
        <div className="hidden flex-col lg:flex">
          <div className="mb-6 flex items-center gap-3">
            <img src="/logo-dark-bg.svg" alt="SubServer" className="h-12 w-auto" />
            <span className="font-display text-2xl font-bold tracking-tight text-slate-50">SubServer</span>
          </div>
          <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-50">
            Vos abonnements,
            <br />
            <span className="text-luxury-gold">sous contrôle.</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-slate-300">
            SubServer détecte automatiquement tous vos abonnements. En 2 clics. Sans paperasse.
          </p>

          <HowItWorks variant="dark" className="mt-12 max-w-md sm:grid-cols-1" />
        </div>

        {/* Colonne connexion */}
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <img src="/logo-dark-bg.svg" alt="SubServer" className="h-14 w-auto" />
            <span className="font-display text-2xl font-bold tracking-tight text-slate-50">SubServer</span>
            <p className="text-sm text-slate-400">Vos abonnements, sous contrôle.</p>
          </div>

          <div className="rounded-3xl border border-luxury-gold/30 bg-white/10 p-8 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
