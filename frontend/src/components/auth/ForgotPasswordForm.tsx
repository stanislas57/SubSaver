import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

const inputClassName = "border-white/10 bg-white/5 text-slate-50 placeholder:text-slate-500 focus-visible:border-primary/60";

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
        <h2 className="font-display text-xl font-bold text-slate-50">Nouveau mot de passe</h2>
        <p className="text-sm text-slate-400">
          Entre le code reçu à <span className="text-slate-200">{email}</span> et ton nouveau mot de passe.
        </p>
        {resetPasswordError && <ErrorAlert message={resetPasswordError} compact />}

        <div>
          <Label htmlFor="code" className="text-slate-300">Code de réinitialisation</Label>
          <Input id="code" inputMode="numeric" maxLength={6} className={inputClassName} {...resetForm.register("code")} />
          {resetForm.formState.errors.code && (
            <p className="mt-1 text-xs text-red-400">{resetForm.formState.errors.code.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="newPassword" className="text-slate-300">Nouveau mot de passe</Label>
          <Input id="newPassword" type="password" autoComplete="new-password" className={inputClassName} {...resetForm.register("newPassword")} />
          {resetForm.formState.errors.newPassword && (
            <p className="mt-1 text-xs text-red-400">{resetForm.formState.errors.newPassword.message}</p>
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
      <h2 className="font-display text-xl font-bold text-slate-50">Mot de passe oublié</h2>
      <p className="text-sm text-slate-400">Entre ton email, on t'envoie un code de réinitialisation.</p>
      {forgotPasswordError && <ErrorAlert message={forgotPasswordError} compact />}

      <div>
        <Label htmlFor="email" className="text-slate-300">Email</Label>
        <Input id="email" type="email" autoComplete="email" className={inputClassName} {...emailForm.register("email")} />
        {emailForm.formState.errors.email && (
          <p className="mt-1 text-xs text-red-400">{emailForm.formState.errors.email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" loading={isSendingResetCode}>
        Envoyer le code
      </Button>

      <p className="text-center text-sm text-slate-400">
        <Link to="/login" className="font-medium text-primary hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}
