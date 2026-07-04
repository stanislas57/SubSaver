import { Landmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import type { BankProvider } from "@/types";

export interface BankGridProps {
  providers: BankProvider[] | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  onSelect: (provider: BankProvider) => void;
  syncingProviderId?: string;
}

export function BankGrid({ providers, isLoading, isError, errorMessage, onRetry, onSelect, syncingProviderId }: BankGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-md" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorAlert message={errorMessage ?? "Impossible de charger les banques."} onRetry={onRetry} />;
  }

  if (!providers || providers.length === 0) {
    return <p className="text-sm text-text-muted">Aucune banque disponible pour le moment.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {providers.map((provider) => (
        <BankButton
          key={provider.id}
          provider={provider}
          onSelect={onSelect}
          syncing={syncingProviderId === provider.id}
        />
      ))}
    </div>
  );
}

function BankButton({
  provider,
  onSelect,
  syncing,
}: {
  provider: BankProvider;
  onSelect: (provider: BankProvider) => void;
  syncing: boolean;
}) {
  return (
    <Card
      className="cursor-pointer hover:border-primary"
      onClick={() => !syncing && onSelect(provider)}
    >
      <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
        {syncing ? (
          <Spinner />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-light text-primary">
            <Landmark className="h-4 w-4" />
          </div>
        )}
        <span className="text-xs font-medium text-text-main">{provider.name}</span>
      </CardContent>
    </Card>
  );
}
