import { useNavigate } from "react-router-dom";
import { ArrowLeft, Landmark, Link2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/alert";
import { RevealText } from "@/components/shared/RevealText";
import { useBankFeesReport } from "@/hooks/usePro";
import { getErrorMessage } from "@/api/axiosClient";

/** Espace Pro/BtoB Premium : détection des frais et commissions bancaires
 * cachés dans l'historique synchronisé, cf. GET /pro/bank-fees. Contrairement
 * au moteur de détection d'abonnements, aucune récurrence n'est exigée -- un
 * agio ou une commission d'intervention facturé une seule fois est déjà
 * signalé. Accès garanti Premium côté serveur (PremiumOnlyRoute + 402 backend). */
export function BankFeesPage() {
  const navigate = useNavigate();
  const report = useBankFeesReport();

  return (
    <div className="w-full px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => navigate("/premium")}
          className="mb-6 inline-flex items-center gap-2 text-sm text-luxury-text-light transition-colors hover:text-luxury-text"
        >
          <ArrowLeft className="h-4 w-4" /> Retour à l'Espace Pro
        </button>

        <div className="mb-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-luxury-gold-soft text-luxury-gold-deep">
            <Landmark className="h-6 w-6" />
          </div>
          <RevealText as="h1" className="text-4xl font-black tracking-tight text-luxury-text sm:text-5xl">
            Détection des frais bancaires
          </RevealText>
          <RevealText className="mt-3 max-w-xl text-lg text-luxury-text-light">
            Agios, commissions d'intervention, frais de rejet... repérés dans ton historique bancaire.
          </RevealText>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Frais détectés</CardTitle>
            <CardDescription>
              Scan de l'historique bancaire synchronisé -- un seul prélèvement suffit à être signalé.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.isPending && (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
            {report.isError && (
              <ErrorAlert message={getErrorMessage(report.error)} onRetry={() => report.refetch()} />
            )}

            {report.data && !report.data.bank_connected && (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-slate-900/10 bg-slate-50 px-6 py-10 text-center">
                <Link2 className="h-6 w-6 text-luxury-text-light" />
                <p className="max-w-sm text-sm text-luxury-text-light">
                  Connecte ta banque pour analyser ton historique et détecter les frais cachés.
                </p>
                <Button onClick={() => navigate("/bank-connect")}>Connecter ma banque</Button>
              </div>
            )}

            {report.data?.bank_connected && report.data.fees.length === 0 && (
              <p className="text-sm text-text-muted">
                Aucun frais suspect détecté dans ton historique synchronisé -- bon signe.
              </p>
            )}

            {report.data?.bank_connected && report.data.fees.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-900/10 text-left text-xs uppercase tracking-wide text-luxury-text-light">
                        <th className="py-2 pr-3 font-semibold">Libellé</th>
                        <th className="py-2 pr-3 font-semibold">Date</th>
                        <th className="py-2 text-right font-semibold">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.data.fees.map((fee) => (
                        <tr key={fee.transaction_id} className="border-b border-slate-900/5">
                          <td className="py-2.5 pr-3 font-medium text-luxury-text">{fee.label}</td>
                          <td className="py-2.5 pr-3 text-luxury-text-light">{fee.date}</td>
                          <td className="py-2.5 text-right font-semibold text-luxury-gold-deep">
                            {fee.amount.toFixed(2)} €
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td className="pt-3 font-bold text-luxury-text">Total ({report.data.count})</td>
                        <td className="pt-3" />
                        <td className="pt-3 text-right font-bold text-luxury-gold-deep">
                          {report.data.total_amount.toFixed(2)} €
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="rounded-lg border border-slate-900/10 bg-slate-50 p-4 text-xs text-luxury-text-light">
                  Détection basée sur les libellés bancaires connus -- certains frais spécifiques à ta banque peuvent
                  ne pas être reconnus. Vérifie le détail sur ton relevé avant toute réclamation.
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
