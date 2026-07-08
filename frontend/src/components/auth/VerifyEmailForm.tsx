import * as React from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

const inputClassName =
  "border-luxury-text/20 bg-luxury-bg text-center text-2xl tracking-[0.5em] text-luxury-text placeholder:text-luxury-text-light focus-visible:border-luxury-sapphire/60";

export interface VerifyEmailFormProps {
  email: string;
}

export function VerifyEmailForm({ email }: VerifyEmailFormProps) {
  const { verifyEmail, isVerifyingEmail, verifyEmailError, resendCode, isResendingCode } = useAuth();
  const [code, setCode] = React.useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await verifyEmail(email, code);
    } catch {
      // erreur déjà exposée via verifyEmailError
    }
  }

  async function handleResend() {
    await resendCode(email);
    toast.success("Un nouveau code a été envoyé.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <h2 className="font-display text-xl font-bold text-luxury-text">Vérifie ton email</h2>
      <p className="text-sm text-luxury-text-light">
        On a envoyé un code à 6 chiffres à <span className="text-luxury-text font-semibold">{email}</span>, valable 10 minutes.
      </p>
      {verifyEmailError && <ErrorAlert message={verifyEmailError} compact />}

      <div>
        <Label htmlFor="code" className="text-luxury-text">Code de vérification</Label>
        <Input
          id="code"
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          className={inputClassName}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        />
      </div>

      <Button type="submit" className="w-full" loading={isVerifyingEmail} disabled={code.length !== 6}>
        Valider mon compte
      </Button>

      <button
        type="button"
        onClick={handleResend}
        disabled={isResendingCode}
        className="w-full text-center text-sm font-medium text-luxury-sapphire hover:underline disabled:opacity-50"
      >
        Renvoyer le code
      </button>
    </form>
  );
}
