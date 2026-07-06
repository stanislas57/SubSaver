import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

const schema = z.object({
  firstName: z.string().min(1, "Prénom requis").max(50),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
});

type FormValues = z.infer<typeof schema>;

const inputClassName = "border-luxury-text/20 bg-luxury-bg placeholder:text-luxury-text-light focus-visible:border-luxury-sapphire/60 text-luxury-text";

export interface RegisterFormProps {
  /** Appelé une fois le code de vérification envoyé, pour passer à l'étape suivante. */
  onRegistered: (email: string) => void;
}

export function RegisterForm({ onRegistered }: RegisterFormProps) {
  const { register: registerUser, isRegistering, registerError } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      await registerUser(values.email, values.password, values.firstName);
      onRegistered(values.email);
    } catch {
      // erreur déjà exposée via registerError
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <h2 className="font-display text-xl font-bold text-luxury-text">Créer un compte</h2>
      {registerError && <ErrorAlert message={registerError} compact />}

      <div>
        <Label htmlFor="firstName" className="text-luxury-text">Prénom</Label>
        <Input id="firstName" autoComplete="given-name" error={!!errors.firstName} className={inputClassName} {...register("firstName")} />
        {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
      </div>

      <div>
        <Label htmlFor="email" className="text-luxury-text">Email</Label>
        <Input id="email" type="email" autoComplete="email" error={!!errors.email} className={inputClassName} {...register("email")} />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="password" className="text-luxury-text">Mot de passe</Label>
        <Input id="password" type="password" autoComplete="new-password" error={!!errors.password} className={inputClassName} {...register("password")} />
        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
      </div>

      <Button type="submit" className="w-full" loading={isRegistering}>
        Créer mon compte
      </Button>

      <p className="text-center text-sm text-luxury-text-light">
        Déjà un compte ?{" "}
        <Link to="/login" className="font-medium text-luxury-sapphire hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
