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

const phoneRegex = /^\+?[1-9]\d{1,14}$/;

const schema = z.object({
  firstName: z.string().min(1, "Prénom requis").max(50),
  email: z.string().email("Email invalide"),
  phone: z
    .string()
    .min(1, "Téléphone requis")
    .regex(phoneRegex, "Format international requis (ex: +33612345678)"),
  password: z.string().min(8, "8 caractères minimum"),
});

type FormValues = z.infer<typeof schema>;

// Styles "verre sur bleu nuit" : RegisterForm est désormais rendu sur le
// même fond immersif que LoginForm (cf. RegisterPage), d'où ces couleurs
// claires plutôt que le thème "Luxe Lumineux" clair utilisé ailleurs.
const inputClassName =
  "border-white/20 bg-white/10 text-slate-50 placeholder:text-slate-400 focus-visible:border-luxury-gold/70 focus-visible:ring-luxury-gold/30";

export interface RegisterFormProps {
  /** Appelé une fois le code de vérification envoyé, pour passer à l'étape suivante. */
  onRegistered: (email: string, phone: string) => void;
}

export function RegisterForm({ onRegistered }: RegisterFormProps) {
  const { register: registerUser, isRegistering, registerError } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      await registerUser(values.email, values.password, values.firstName, values.phone);
      onRegistered(values.email, values.phone);
    } catch {
      // erreur déjà exposée via registerError
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <h2 className="font-display text-xl font-bold text-slate-50">Créer un compte</h2>
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
        <Label htmlFor="phone" className="text-slate-200">Téléphone</Label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+33 6 12 34 56 78"
          error={!!errors.phone}
          className={inputClassName}
          {...register("phone")}
        />
        {errors.phone ? (
          <p className="mt-1 text-xs text-red-300">{errors.phone.message}</p>
        ) : (
          <p className="mt-1 text-xs text-slate-400">Format international, avec indicatif</p>
        )}
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
  );
}
