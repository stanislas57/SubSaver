import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

const schema = z.object({
  otpCode: z.string().length(6, "Le code doit contenir 6 chiffres").regex(/^\d+$/, "Uniquement des chiffres"),
});

type FormValues = z.infer<typeof schema>;

export function OtpVerification({ email, phone }: { email: string; phone: string }) {
  const {
    verifyOtp,
    isVerifyingOtp,
    otpError,
    otpPhoneMasked,
    clearOtpState,
    resendOtp,
    isResendingOtp,
    otpResent,
  } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (!otpPhoneMasked) return null;

  async function onSubmit(values: FormValues) {
    try {
      await verifyOtp(email, phone, values.otpCode);
    } catch {
      // erreur déjà exposée via otpError
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <button
        type="button"
        onClick={clearOtpState}
        className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        <ChevronLeft className="h-4 w-4" />
        Retour
      </button>

      <div>
        <h2 className="font-display text-xl font-bold text-text-main">Vérifier votre téléphone</h2>
        <p className="mt-1 text-sm text-text-muted">
          Entrez le code reçu par SMS au <span className="font-medium text-text-main">{otpPhoneMasked}</span>
        </p>
      </div>

      {otpError && <ErrorAlert message={otpError} compact />}

      <div>
        <Label htmlFor="otpCode">Code à 6 chiffres</Label>
        <Input
          id="otpCode"
          type="text"
          inputMode="numeric"
          placeholder="000000"
          maxLength={6}
          error={!!errors.otpCode}
          className="text-center text-lg tracking-[0.5em] font-mono"
          {...register("otpCode")}
        />
        {errors.otpCode && <p className="mt-1 text-xs text-red-600">{errors.otpCode.message}</p>}
      </div>

      <Button type="submit" className="w-full" loading={isVerifyingOtp}>
        Vérifier
      </Button>

      <p className="text-center text-sm text-text-muted">
        Vous n'avez pas reçu le code ?{" "}
        <button
          type="button"
          onClick={() => resendOtp(email)}
          disabled={isResendingOtp}
          className="font-medium text-primary hover:underline disabled:opacity-50"
        >
          {isResendingOtp ? "Envoi..." : "Renvoyer"}
        </button>
      </p>
      {otpResent && <p className="text-center text-xs text-accent">Un nouveau code vient d'être envoyé.</p>}
    </form>
  );
}
