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
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const { login, isLoggingIn, loginError } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      await login(values.email, values.password);
    } catch {
      // erreur déjà exposée via loginError
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <h2 className="font-display text-xl font-bold text-text-main">Connexion</h2>
      {loginError && <ErrorAlert message={loginError} compact />}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" error={!!errors.email} {...register("email")} />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" type="password" autoComplete="current-password" error={!!errors.password} {...register("password")} />
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
      </div>

      <Button type="submit" className="w-full" loading={isLoggingIn}>
        Se connecter
      </Button>

      <p className="text-center text-sm text-text-muted">
        Pas encore de compte ?{" "}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}
