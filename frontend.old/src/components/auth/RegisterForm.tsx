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

export function RegisterForm() {
  const { register: registerUser, isRegistering, registerError } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      await registerUser(values.email, values.password, values.firstName);
    } catch {
      // erreur déjà exposée via registerError
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <h2 className="font-display text-xl font-bold text-text-main">Créer un compte</h2>
      {registerError && <ErrorAlert message={registerError} compact />}

      <div>
        <Label htmlFor="firstName">Prénom</Label>
        <Input id="firstName" autoComplete="given-name" error={!!errors.firstName} {...register("firstName")} />
        {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" error={!!errors.email} {...register("email")} />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" type="password" autoComplete="new-password" error={!!errors.password} {...register("password")} />
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
      </div>

      <Button type="submit" className="w-full" loading={isRegistering}>
        Créer mon compte
      </Button>

      <p className="text-center text-sm text-text-muted">
        Déjà un compte ?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
