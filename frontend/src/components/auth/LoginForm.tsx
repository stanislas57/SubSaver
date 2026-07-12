import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type FormValues = z.infer<typeof schema>;

// Styles "verre sur bleu nuit" : le LoginForm n'est rendu que sur la page
// de connexion immersive (fond luxury-night), d'où ces couleurs claires.
const inputClassName =
  "border-white/20 bg-white/10 text-slate-50 placeholder:text-slate-400 focus-visible:border-luxury-gold/70 focus-visible:ring-luxury-gold/30";

/** Messages affichés selon le temps écoulé depuis le clic sur "Se connecter"
 * -- un login normal ne dépasse jamais la 1ère étape, les suivantes ne sont
 * vues que si le serveur met vraiment du temps à répondre (ex: cold start
 * d'un hébergeur après une période d'inactivité). Sans ça, l'utilisateur ne
 * voit qu'un spinner muet pendant un temps anormalement long, sans savoir si
 * l'app a planté ou si ça va aboutir. */
const LOADING_STAGES = [
  { afterMs: 0, label: "Authentification..." },
  { afterMs: 3_000, label: "Vérification de tes identifiants..." },
  { afterMs: 8_000, label: "Le serveur met plus de temps que prévu (ça peut arriver après une période d'inactivité)..." },
] as const;

function useLoadingStageLabel(active: boolean): string | null {
  const [stageIndex, setStageIndex] = React.useState(0);

  React.useEffect(() => {
    if (!active) {
      setStageIndex(0);
      return;
    }
    const timers = LOADING_STAGES.slice(1).map((stage, i) =>
      setTimeout(() => setStageIndex(i + 1), stage.afterMs)
    );
    return () => timers.forEach(clearTimeout);
  }, [active]);

  return active ? LOADING_STAGES[stageIndex].label : null;
}

export function LoginForm() {
  const { login, isLoggingIn, loginError } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const loadingStageLabel = useLoadingStageLabel(isLoggingIn);

  async function onSubmit(values: FormValues) {
    try {
      await login(values.email, values.password);
    } catch {
      // erreur déjà exposée via loginError
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <h2 className="font-display text-xl font-bold text-slate-50">Connexion</h2>

      <GoogleLoginButton />

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-white/10" />
        ou
        <span className="h-px flex-1 bg-white/10" />
      </div>

      {loginError && <ErrorAlert message={loginError} compact />}

      <div>
        <Label htmlFor="email" className="text-slate-200">Email</Label>
        <Input id="email" type="email" autoComplete="email" error={!!errors.email} className={inputClassName} {...register("email")} />
        {errors.email && <p className="mt-1 text-xs text-red-300">{errors.email.message}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-slate-200">Mot de passe</Label>
          <Link to="/forgot-password" className="mb-1.5 text-xs font-medium text-luxury-gold hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
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

      <Button type="submit" className="w-full" loading={isLoggingIn}>
        Se connecter
      </Button>
      {loadingStageLabel && (
        <p className="text-center text-xs text-slate-400" role="status">
          {loadingStageLabel}
        </p>
      )}

      <p className="text-center text-sm text-slate-300">
        Pas encore de compte ?{" "}
        <Link to="/register" className="font-medium text-luxury-gold hover:underline">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}
