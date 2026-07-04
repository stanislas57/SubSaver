import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
  compact?: boolean;
}

/** Bloc d'erreur homogène affiché sous chaque appel API en échec. */
export function ErrorAlert({ message, onRetry, compact }: ErrorAlertProps) {
  return (
    <div
      className={
        compact
          ? "flex items-center gap-2 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          : "flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-6 py-10 text-center"
      }
    >
      <div className="flex items-center gap-2 text-red-700">
        <AlertTriangle className={compact ? "h-4 w-4 shrink-0" : "h-6 w-6"} />
        <span className={compact ? "" : "font-medium"}>{message}</span>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw className="h-3.5 w-3.5" /> Réessayer
        </Button>
      )}
    </div>
  );
}
