import * as React from "react";
import { Copy, Check, Mail, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/alert";
import { RevealText } from "@/components/shared/RevealText";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useAuth } from "@/contexts/AuthContext";
import { buildCancellationMailto, generateCancellationLetter } from "@/lib/cancellationLetter";
import { getErrorMessage } from "@/api/axiosClient";

/** Espace Particulier Premium : génère une lettre de résiliation type puis
 * l'envoie via un lien mailto: (ouvre le client mail par défaut de
 * l'utilisateur, déjà configuré avec sa propre adresse -- pas besoin de
 * backend d'envoi pour ça). Accès garanti Premium (PremiumOnlyRoute). */
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

  function sendByEmail() {
    if (!selected) return;
    window.location.href = buildCancellationMailto(selected, letter);
  }

  return (
    <div className="w-full px-6 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-luxury-gold-soft text-luxury-gold-deep">
            <FileText className="h-6 w-6" />
          </div>
          <RevealText as="h1" className="text-4xl font-black tracking-tight text-luxury-text sm:text-5xl">
            Lettre de résiliation
          </RevealText>
          <RevealText className="mt-3 max-w-xl text-lg text-luxury-text-light">
            Sélectionne un abonnement, on génère la lettre, tu l'envoies en un clic.
          </RevealText>
        </div>

        <Card>
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

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button onClick={sendByEmail} className="sm:flex-1">
                    <Mail className="h-4 w-4" /> Envoyer par email
                  </Button>
                  <Button onClick={copyLetter} variant="outline">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copié !" : "Copier"}
                  </Button>
                </div>
                <p className="text-xs text-text-muted">
                  Ouvre ton client de messagerie par défaut, lettre pré-remplie, prête à envoyer depuis ta propre adresse.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
