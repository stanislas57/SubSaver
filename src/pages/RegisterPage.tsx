import { useState } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { OtpVerification } from "@/components/auth/OtpVerification";
import { useAuth } from "@/contexts/AuthContext";

export function RegisterPage() {
  const { isOtpStep, otpPhoneMasked } = useAuth();
  const [registrationData, setRegistrationData] = useState<{ email: string; phone: string } | null>(null);

  // Capturer les données d'enregistrement temporairement
  if (isOtpStep && registrationData) {
    return <OtpVerification email={registrationData.email} phone={registrationData.phone} />;
  }

  return <RegisterForm onRegisterStart={(email, phone) => setRegistrationData({ email, phone })} />;
}
