import * as React from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";

export function RegisterPage() {
  const [pendingEmail, setPendingEmail] = React.useState<string | null>(null);

  if (pendingEmail) {
    return <VerifyEmailForm email={pendingEmail} />;
  }

  return <RegisterForm onRegistered={setPendingEmail} />;
}
