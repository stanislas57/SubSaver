import * as React from "react";
import { Link } from "react-router-dom";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { OtpVerificationForm } from "@/components/auth/OtpVerificationForm";

/** Page d'inscription : design Luxe Lumineux (fond blanc clair, card
 * glassmorphism blanche sur bord fin or). Cohérente avec le reste de l'app
 * (contrairement à LoginPage qui plonge en immersion Bleu Nuit). */
export function RegisterPage() {
  const [pending, setPending] = React.useState<{ email: string; phone: string } | null>(null);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      {/* Halos subtils d'ambiance */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 top-1/4 h-[400px] w-[400px] rounded-full bg-luxury-gold/5 blur-[140px]" />
        <div className="absolute -left-32 bottom-1/4 h-[380px] w-[380px] rounded-full bg-luxury-sapphire/5 blur-[140px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo en haut mobile */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src="/logo.svg" alt="SubServer" className="h-12 w-auto" />
          <span className="font-display text-xl font-bold tracking-tight text-luxury-text">SubServer</span>
        </div>

        {/* Carte glassmorphism */}
        <div className="rounded-3xl border border-slate-900/10 border-t-2 border-t-luxury-gold bg-white/95 p-8 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] backdrop-blur-md">
          {pending ? (
            <OtpVerificationForm email={pending.email} phone={pending.phone} />
          ) : (
            <RegisterForm onRegistered={(email, phone) => setPending({ email, phone })} />
          )}
        </div>

        {/* Lien accueil (discret) */}
        <p className="mt-6 text-center text-xs text-luxury-text-light">
          <Link to="/" className="hover:underline">
            ← Retour à l'accueil
          </Link>
        </p>
      </div>
    </div>
  );
}
