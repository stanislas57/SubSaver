import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

const inputClassName = "border-luxury-text/20 bg-luxury-bg placeholder:text-luxury-text-light focus-visible:border-luxury-sapphire/60 text-luxury-text";

const emailSchema = z.object({ email: z.string().email("Email invalide") });
type EmailValues = z.infer<typeof emailSchema>;

const resetSchema = z.object({
  code: z.string().length(6, "Le code contient 6 chiffres"),
  newPassword: z.string().min(8, "8 caractères minimum"),
});
type ResetValues = z.infer<typeof resetSchema>;

export function ForgotPasswordForm() {
  const navigate = useNavigate();
  const { forgotPassword, isSendingResetCode, forgotPasswordError, resetPassword, isResettingPassword, resetPasswordError } = useAuth();
  const [email, setEmail] = React.useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = React.useState(false);

  const emailForm = useForm<EmailValues>({ resolver: zodResolver(emailSchema) });
  const resetForm = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });

  async function onSubmitEmail(values: EmailValues) {
    await forgotPassword(values.email);
    setEmail(values.email);
    toast.success("Si un compte existe, un code a été envoyé.");
  }

  async function onSubmitReset(values: ResetValues) {
    if (!email) return;
    try {
      await resetPassword(email, values.code, values.newPassword);
      toast.success("Mot de passe mis à jour. Connecte-toi.");
      navigate("/login", { replace: true });
    } catch {
      // erreur déjà exposée via resetPasswordError
    }
  }

  if (email) {
    return (
      <form onSubmit={resetForm.handleSubmit(onSubmitReset)} className="space-y-4" noValidate>
        <h2 className="font-display text-xl font-bold text-luxury-text">Nouveau mot de passe</h2>
        <p className="text-sm text-luxury-text-light">
          Entre le code reçu à <span className="text-luxury-text font-semibold">{email}</span> et ton nouveau mot de passe.
        </p>
        {resetPasswordError && <ErrorAlert message={resetPasswordError} compact />}

        <div>
          <Label htmlFor="code" className="text-luxury-text">Code de réinitialisation</Label>
          <Input id="code" inputMode="numeric" maxLength={6} className={inputClassName} {...resetForm.register("code")} />
          {resetForm.formState.errors.code && (
            <p className="mt-1 text-xs text-red-500">{resetForm.formState.errors.code.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="newPassword" className="text-luxury-text">Nouveau mot de passe</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              autoComplete="new-password"
              className={`${inputClassName} pr-10`}
              {...resetForm.register("newPassword")}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-luxury-text-light hover:text-luxury-text transition-colors"
              aria-label={showNewPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {resetForm.formState.errors.newPassword && (
            <p className="mt-1 text-xs text-red-500">{resetForm.formState.errors.newPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" loading={isResettingPassword}>
          Réinitialiser mon mot de passe
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-4" noValidate>
      <h2 className="font-display text-xl font-bold text-luxury-text">Mot de passe oublié</h2>
      <p className="text-sm text-luxury-text-light">Entre ton email, on t'envoie un code de réinitialisation.</p>
      {forgotPasswordError && <ErrorAlert message={forgotPasswordError} compact />}

      <div>
        <Label htmlFor="email" className="text-luxury-text">Email</Label>
        <Input id="email" type="email" autoComplete="email" className={inputClassName} {...emailForm.register("email")} />
        {emailForm.formState.errors.email && (
          <p className="mt-1 text-xs text-red-500">{emailForm.formState.errors.email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" loading={isSendingResetCode}>
        Envoyer le code
      </Button>

      <p className="text-center text-sm text-luxury-text-light">
        <Link to="/login" className="font-medium text-luxury-sapphire hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}
