import * as React from "react";
import { Copy, Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/alert";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useAuth } from "@/contexts/AuthContext";
import { generateCancellationLetter } from "@/lib/cancellationLetter";
import { getErrorMessage } from "@/api/axiosClient";

export function LabCancellationPage() {
  const { user } = useAuth();
  const subscriptionsQuery = useSubscriptions();
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [copied, setCopied] = React.useState(false);

  const subscriptions = subscriptionsQuery.data ?? [];
  const selected = subscriptions.find((s) => s.id === selectedId) ?? subscriptions[0];

  React.useEffect(() => {
    if (!selectedId && subscriptions.length > 0) setSelectedId(subscriptions[0].id);
  }, [subscriptions, selectedId]);

  const letter = selected && user ? generateCancellationLetter(selected, user) : "";

  async function copyLetter() {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-full px-6 py-8">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Générer une lettre de résiliation</CardTitle>
          <CardDescription>Sélectionne un abonnement pour générer une lettre type, prête à envoyer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscriptionsQuery.isPending && <Skeleton className="h-10 w-full" />}
          {subscriptionsQuery.isError && (
            <ErrorAlert message={getErrorMessage(subscriptionsQuery.error)} onRetry={() => subscriptionsQuery.refetch()} />
          )}
          {!subscriptionsQuery.isPending && !subscriptionsQuery.isError && subscriptions.length === 0 && (
            <p className="text-sm text-text-muted">Ajoute d'abord un abonnement pour générer une lettre.</p>
          )}

          {selected && (
            <>
              <Select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} aria-label="Abonnement">
                {subscriptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>

              <Textarea readOnly value={letter} className="min-h-72 font-mono text-xs leading-relaxed" />

              <Button onClick={copyLetter} variant="outline">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copié !" : "Copier la lettre"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
