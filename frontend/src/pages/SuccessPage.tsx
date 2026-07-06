import * as React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import gsap from "gsap";
import { Lock, PartyPopper } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/api/axiosClient";

/** Page de retour post-paiement Stripe (à configurer comme URL de
 * redirection "après paiement" du Payment Link, cf. .env.example).
 * Confirme l'upgrade Premium côté backend, joue une courte animation de
 * déverrouillage (cadenas -> ouvert, fondu GSAP), puis renvoie vers /premium. */
export function SuccessPage() {
  const navigate = useNavigate();
  const { confirmPremiumUpgrade } = useAuth();
  const lockRef = React.useRef<HTMLDivElement>(null);
  const [unlocked, setUnlocked] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let redirectTimeout: ReturnType<typeof setTimeout>;

    confirmPremiumUpgrade()
      .then(() => {
        setUnlocked(true);
        toast.success("Bienvenue dans SubServer Pro");
        redirectTimeout = setTimeout(() => navigate("/premium", { replace: true }), 2200);
      })
      .catch((err) => {
        setError(getErrorMessage(err, "Impossible de confirmer ton upgrade Premium."));
      });

    return () => clearTimeout(redirectTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const el = lockRef.current;
    if (!el || !unlocked || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(
      el,
      { scale: 1, rotate: 0 },
      { scale: 1.15, rotate: -18, duration: 0.4, ease: "back.out(3)" }
    );
  }, [unlocked]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-luxury-bg px-6 text-center">
      <div
        ref={lockRef}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-luxury-gold-soft text-luxury-gold-deep"
      >
        {unlocked ? <PartyPopper className="h-9 w-9" /> : <Lock className="h-9 w-9" />}
      </div>

      {error ? (
        <>
          <h1 className="text-2xl font-bold text-luxury-text">Un problème est survenu</h1>
          <p className="mt-2 max-w-md text-luxury-text-light">{error}</p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-black tracking-tight text-luxury-text">
            {unlocked ? "Bienvenue dans SubServer Pro" : "Confirmation de ton paiement…"}
          </h1>
          <p className="mt-2 max-w-md text-luxury-text-light">
            {unlocked
              ? "Toutes les fonctionnalités Premium et BtoB sont désormais débloquées."
              : "Un instant, on active ton accès Premium."}
          </p>
        </>
      )}
    </div>
  );
}
