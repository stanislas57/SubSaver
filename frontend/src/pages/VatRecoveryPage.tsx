import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Receipt } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/alert";
import { RevealText } from "@/components/shared/RevealText";
import { useVatRecoveryReport, useExportAccounting } from "@/hooks/usePro";
import { getErrorMessage } from "@/api/axiosClient";

/** Espace Pro/BtoB Premium : estimation de la TVA récupérable sur les
 * abonnements (taux standard FR 20%), cf. GET /pro/vat-recovery. Accès
 * garanti Premium côté serveur (PremiumOnlyRoute + 402 backend si contourné). */
export function VatRecoveryPage() {
  const navigate = useNavigate();
  const report = useVatRecoveryReport();
  const exportAccounting = useExportAccounting();

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
            <Receipt className="h-6 w-6" />
          </div>
          <RevealText as="h1" className="text-4xl font-black tracking-tight text-luxury-text sm:text-5xl">
            Récupération de TVA
          </RevealText>
          <RevealText className="mt-3 max-w-xl text-lg text-luxury-text-light">
            Estimation de la TVA récupérable sur tes abonnements professionnels.
          </RevealText>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ventilation TTC / HT / TVA</CardTitle>
            <CardDescription>
              Calcul au taux standard français (20%), en supposant les prix affichés TTC.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.isPending && (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
            {report.isError && (
              <ErrorAlert message={getErrorMessage(report.error)} onRetry={() => report.refetch()} />
            )}
            {report.data && report.data.lines.length === 0 && (
              <p className="text-sm text-text-muted">
                Aucun abonnement enregistré pour l'instant -- ajoute tes dépenses professionnelles pour voir la TVA récupérable.
              </p>
            )}

            {report.data && report.data.lines.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-900/10 text-left text-xs uppercase tracking-wide text-luxury-text-light">
                        <th className="py-2 pr-3 font-semibold">Fournisseur</th>
                        <th className="py-2 pr-3 font-semibold">Catégorie</th>
                        <th className="py-2 pr-3 text-right font-semibold">TTC</th>
                        <th className="py-2 pr-3 text-right font-semibold">HT</th>
                        <th className="py-2 text-right font-semibold">TVA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.data.lines.map((line) => (
                        <tr key={line.subscription_id} className="border-b border-slate-900/5">
                          <td className="py-2.5 pr-3 font-medium text-luxury-text">{line.display_name}</td>
                          <td className="py-2.5 pr-3 text-luxury-text-light">{line.category}</td>
                          <td className="py-2.5 pr-3 text-right text-luxury-text">{line.price_ttc.toFixed(2)} €</td>
                          <td className="py-2.5 pr-3 text-right text-luxury-text-light">{line.price_ht.toFixed(2)} €</td>
                          <td className="py-2.5 text-right font-semibold text-luxury-gold-deep">
                            {line.vat_amount.toFixed(2)} €
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2} className="pt-3 font-bold text-luxury-text">
                          Total
                        </td>
                        <td className="pt-3 text-right font-bold text-luxury-text">
                          {report.data.total_price_ttc.toFixed(2)} €
                        </td>
                        <td className="pt-3" />
                        <td className="pt-3 text-right font-bold text-luxury-gold-deep">
                          {report.data.total_vat_amount.toFixed(2)} €
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="rounded-lg border border-slate-900/10 bg-slate-50 p-4 text-xs text-luxury-text-light">
                  Estimation indicative, pas un conseil fiscal personnalisé : vérifie l'éligibilité réelle de chaque
                  dépense (facture conforme, usage professionnel avéré) avec ton comptable avant toute déduction.
                </div>

                <Button onClick={() => exportAccounting.mutate()} loading={exportAccounting.isPending} variant="outline">
                  <Download className="h-4 w-4" /> Télécharger l'extraction comptable (CSV)
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
