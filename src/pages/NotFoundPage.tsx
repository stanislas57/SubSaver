import { useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-app px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary">
        <Compass className="h-6 w-6" />
      </div>
      <h1 className="font-display text-2xl font-bold text-text-main">Page introuvable</h1>
      <p className="max-w-sm text-sm text-text-muted">Cette page n'existe pas ou a été déplacée.</p>
      <Button onClick={() => navigate("/dashboard")}>Retour au tableau de bord</Button>
    </div>
  );
}
