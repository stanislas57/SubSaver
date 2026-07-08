import * as React from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

const inputClassName =
  "border-luxury-text/20 bg-luxury-bg text-center text-2xl tracking-[0.5em] text-luxury-text placeholder:text-luxury-text-light focus-visible:border-luxury-sapphire/60";

export interface OtpVerificationFormProps {
  email: string;
  phone: string;
}

export function OtpVerificationForm({ email, phone }: OtpVerificationFormProps) {
  const { verifyOtp, isVerifyingOtp, verifyOtpError, resendOtp, isResendingOtp } = useAuth();
  const [code, setCode] = React.useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await verifyOtp(email, phone, code);
    } catch {
      // erreur déjà exposée via verifyOtpError
    }
  }

  async function handleResend() {
    await resendOtp(email);
    toast.success("Un nouveau code a été envoyé.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <h2 className="font-display text-xl font-bold text-luxury-text">Vérifie ton téléphone</h2>
      <p className="text-sm text-luxury-text-light">
        On a envoyé un code à 6 chiffres par SMS au <span className="text-luxury-text font-semibold">{phone}</span>, valable 10 minutes.
      </p>
      {verifyOtpError && <ErrorAlert message={verifyOtpError} compact />}

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

      <Button type="submit" className="w-full" loading={isVerifyingOtp} disabled={code.length !== 6}>
        Valider mon compte
      </Button>

      <button
        type="button"
        onClick={handleResend}
        disabled={isResendingOtp}
        className="w-full text-center text-sm font-medium text-luxury-sapphire hover:underline disabled:opacity-50"
      >
        Renvoyer le code
      </button>
    </form>
  );
}
