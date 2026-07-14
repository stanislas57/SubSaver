import { useMutation, useQuery } from "@tanstack/react-query";
import { proService } from "@/services/proService";

/** Rapport de Récupération de TVA (Espace Pro/BtoB). Monté uniquement dans
 * VatRecoveryPage, elle-même derrière PremiumOnlyRoute -- pas besoin d'un
 * flag `enabled`, la requête ne se déclenche jamais pour un compte non-Premium. */
export function useVatRecoveryReport() {
  return useQuery({ queryKey: ["pro", "vat-recovery"], queryFn: proService.getVatRecoveryReport });
}

/** Rapport de Détection des frais bancaires (Espace Pro/BtoB). Même remarque
 * que ci-dessus pour l'absence de flag `enabled`. */
export function useBankFeesReport() {
  return useQuery({ queryKey: ["pro", "bank-fees"], queryFn: proService.getBankFeesReport });
}

/** Extraction comptable (Espace Pro/BtoB) : télécharge le CSV et déclenche
 * l'enregistrement navigateur, même mécanique que useExportSubscriptionsExcel
 * (cf. useSubscriptions.ts) mais sans le dynamic import -- pas de librairie
 * lourde ici, juste un blob CSV déjà généré côté serveur. */
export function useExportAccounting() {
  return useMutation({
    mutationFn: async () => {
      const blob = await proService.downloadAccountingExport();
      const filename = `subsaver-extraction-comptable-${new Date().toISOString().slice(0, 10)}.csv`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}
