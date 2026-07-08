import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ChevronLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const schema = z.object({
  otpCode: z.string().length(6, "Le code doit contenir 6 chiffres").regex(/^\d+$/, "Uniquement des chiffres"),
});

type FormValues = z.infer<typeof schema>;

export function OtpVerification({ email, phone }: { email: string; phone: string }) {
  const { verifyOtp, isVerifyingOtp, otpError, otpPhoneMasked, otpAttemptsRemaining, clearOtpState } = useAuth();
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div>
        <button
          type="button"
          onClick={clearOtpState}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary-hover transition-colors mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour
        </button>

        <h2 className="font-display text-2xl font-bold text-text-main">Vérifier votre téléphone</h2>
        <p className="mt-2 text-sm text-text-muted">
          Entrez le code SMS reçu sur <span className="font-medium text-text-main">{otpPhoneMasked}</span>
        </p>
      </div>

      {otpError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">{otpError}</p>
            <p className="text-xs text-red-700 mt-1">
              Tentatives restantes: {otpAttemptsRemaining}
            </p>
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="otpCode" className="block mb-2 font-medium">
          Code à 6 chiffres
        </Label>
        <Input
          id="otpCode"
          type="text"
          inputMode="numeric"
          placeholder="000000"
          maxLength={6}
          error={!!errors.otpCode}
          {...register("otpCode")}
          className="text-center text-2xl tracking-widest font-mono"
        />
        {errors.otpCode && <p className="mt-1.5 text-xs text-red-600">{errors.otpCode.message}</p>}
      </div>

      <Button type="submit" className="w-full h-10 font-medium" loading={isVerifyingOtp}>
        Vérifier
      </Button>

      <p className="text-center text-xs text-text-muted">
        Vous n'avez pas reçu le code ?{" "}
        <button type="button" className="text-primary hover:text-primary-hover font-medium transition-colors">
          Renvoyer
        </button>
      </p>
    </form>
  );
}
