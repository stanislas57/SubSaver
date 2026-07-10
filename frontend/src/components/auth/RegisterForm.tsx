import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, Smartphone } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

const SOCIAL_PROVIDERS = [
  { id: "google", label: "Google", initial: "G" },
  { id: "apple", label: "Apple", initial: "A" },
  { id: "microsoft", label: "Microsoft", initial: "M" },
] as const;

/** Boutons de connexion sociale -- désactivés : aucun fournisseur OAuth n'est
 * encore branché côté backend. Affichés pour matérialiser la cible produit et
 * recueillir de la demande, mais explicitement non-cliquables (curseur
 * "not-allowed" + badge "Bientôt") pour ne jamais laisser croire que l'option
 * fonctionne déjà. */
function SocialLoginRow() {
  function handleClick(label: string) {
    toast.info(`Connexion avec ${label} — bientôt disponible.`);
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {SOCIAL_PROVIDERS.map((provider) => (
        <button
          key={provider.id}
          type="button"
          onClick={() => handleClick(provider.label)}
          aria-disabled
          title={`Connexion avec ${provider.label} — bientôt disponible`}
          className="group relative flex cursor-not-allowed flex-col items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 py-3 text-slate-300 opacity-60 transition-colors hover:opacity-80"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
            {provider.initial}
          </span>
          <span className="text-[11px] font-medium">{provider.label}</span>
        </button>
      ))}
    </div>
  );
}

const schema = z.object({
  firstName: z.string().min(1, "Prénom requis").max(50),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
});

type FormValues = z.infer<typeof schema>;

// Styles "verre sur bleu nuit" : RegisterForm est désormais rendu sur le
// même fond immersif que LoginForm (cf. RegisterPage), d'où ces couleurs
// claires plutôt que le thème "Luxe Lumineux" clair utilisé ailleurs.
const inputClassName =
  "border-white/20 bg-white/10 text-slate-50 placeholder:text-slate-400 focus-visible:border-luxury-gold/70 focus-visible:ring-luxury-gold/30";

export function RegisterForm() {
  const navigate = useNavigate();
  const { register: registerUser, isRegistering, registerError } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      await registerUser(values.email, values.password, values.firstName);
      // Le backend renvoie un token dès l'inscription (comme pour le login) :
      // registerUser() applique déjà la session via applyAuthResponse, donc
      // l'utilisateur est connecté ici sans étape de reconnexion intermédiaire.
      toast.success("Compte créé ! Bienvenue sur SubSaver.");
      navigate("/overview");
    } catch {
      // erreur déjà exposée via registerError
    }
  }

  function handlePhoneTabClick() {
    toast.info("Inscription par téléphone (vérification SMS) — bientôt disponible. Utilise ton email pour l'instant.");
  }

  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl font-bold text-slate-50">Créer un compte</h2>

      <SocialLoginRow />

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-white/10" />
        ou
        <span className="h-px flex-1 bg-white/10" />
      </div>

      {/* Sélecteur email / téléphone : l'onglet téléphone matérialise la cible
       * (vérification par SMS) mais reste désactivé tant que le backend ne
       * gère ni champ téléphone ni envoi d'OTP -- l'onglet email, seul
       * fonctionnel, reste la voie active par défaut. */}
      <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        <span className="flex-1 rounded-lg bg-white/10 py-1.5 text-center text-xs font-semibold text-slate-50">
          Email
        </span>
        <button
          type="button"
          onClick={handlePhoneTabClick}
          className="flex flex-1 cursor-not-allowed items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-slate-400 opacity-70"
        >
          <Smartphone className="h-3.5 w-3.5" /> Téléphone
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {registerError && <ErrorAlert message={registerError} compact />}

      <div>
        <Label htmlFor="firstName" className="text-slate-200">Prénom</Label>
        <Input id="firstName" autoComplete="given-name" error={!!errors.firstName} className={inputClassName} {...register("firstName")} />
        {errors.firstName && <p className="mt-1 text-xs text-red-300">{errors.firstName.message}</p>}
      </div>

      <div>
        <Label htmlFor="email" className="text-slate-200">Email</Label>
        <Input id="email" type="email" autoComplete="email" error={!!errors.email} className={inputClassName} {...register("email")} />
        {errors.email && <p className="mt-1 text-xs text-red-300">{errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="password" className="text-slate-200">Mot de passe</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            error={!!errors.password}
            className={`${inputClassName} pr-10`}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-50 transition-colors"
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-red-300">{errors.password.message}</p>}
      </div>

      <Button type="submit" className="w-full" loading={isRegistering}>
        Créer mon compte
      </Button>

      <p className="text-center text-sm text-slate-300">
        Déjà un compte ?{" "}
        <Link to="/login" className="font-medium text-luxury-gold hover:underline">
          Se connecter
        </Link>
      </p>
      </form>
    </div>
  );
}
