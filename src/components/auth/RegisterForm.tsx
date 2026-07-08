import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

export function RegisterForm({ onRegisterStart }: { onRegisterStart?: (email: string, phone: string) => void }) {
  const { register: registerUser, isRegistering, registerError } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      onRegisterStart?.(values.email, values.phone);
      await registerUser(values.email, values.password, values.firstName, values.phone);
    } catch {
      // erreur déjà exposée via registerError
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div>
        <h2 className="font-display text-2xl font-bold text-text-main">Créer un compte</h2>
        <p className="mt-1 text-sm text-text-muted">Rejoignez SubServer et maîtrisez vos abonnements</p>
      </div>

      {registerError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{registerError}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="firstName" className="block mb-2 font-medium">
            Prénom
          </Label>
          <Input
            id="firstName"
            autoComplete="given-name"
            placeholder="Jean"
            error={!!errors.firstName}
            {...register("firstName")}
          />
          {errors.firstName && <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">{errors.firstName.message}</p>}
        </div>

        <div>
          <Label htmlFor="email" className="block mb-2 font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="vous@example.com"
            error={!!errors.email}
            {...register("email")}
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <Label htmlFor="phone" className="block mb-2 font-medium">
            Téléphone
            <span className="text-xs text-text-muted ml-1">(format international)</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+33 6 12 34 56 78"
            error={!!errors.phone}
            {...register("phone")}
          />
          {errors.phone ? (
            <p className="mt-1.5 text-xs text-red-600">{errors.phone.message}</p>
          ) : (
            <p className="mt-1.5 text-xs text-text-muted">Vous recevrez un code SMS pour vérifier votre numéro</p>
          )}
        </div>

        <div>
          <Label htmlFor="password" className="block mb-2 font-medium">
            Mot de passe
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={!!errors.password}
            {...register("password")}
          />
          {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full h-10 font-medium" loading={isRegistering}>
        Continuer
      </Button>

      <p className="text-center text-sm text-text-muted">
        Déjà un compte ?{" "}
        <Link to="/login" className="font-medium text-primary hover:text-primary-hover transition-colors">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
