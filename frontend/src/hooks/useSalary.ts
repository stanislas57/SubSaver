import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { bankService } from "@/services/bankService";
import { useAuth } from "@/contexts/AuthContext";
import {
  detectSalaryFromTransactions,
  type SalaryDetectionResult,
} from "@/lib/detectSalary";

/** Clé localStorage de l'override manuel de revenu, scellée par utilisateur :
 * un revenu saisi à la main ne doit jamais fuiter d'un compte à l'autre sur un
 * poste partagé. Le montant reste volontairement côté client (pas d'endpoint
 * dédié) -- c'est une préférence d'affichage, pas une donnée bancaire. */
function manualIncomeKey(userId: string): string {
  return `subsaver.manualIncome.${userId}`;
}

function readManualIncome(userId: string | undefined): number | null {
  if (!userId || typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(manualIncomeKey(userId));
  if (raw == null) return null;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export interface UseSalaryResult {
  /** Résultat prêt à afficher : override manuel appliqué s'il existe. */
  salary: SalaryDetectionResult;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  /** Enregistre (ou remplace) le revenu manuel de l'utilisateur. */
  setManualIncome: (amount: number) => void;
  /** Supprime l'override manuel et rebascule sur la détection automatique. */
  clearManualIncome: () => void;
  /** true si la valeur affichée provient d'une saisie manuelle. */
  isManual: boolean;
}

const EMPTY_SALARY: SalaryDetectionResult = {
  monthlyIncome: 0,
  confidence: 0,
  source: "none",
  employerLabel: null,
  monthsAnalyzed: 0,
  occurrences: 0,
  frequency: null,
  monthlyBreakdown: [],
  needsReview: true,
};

/**
 * Détecte le revenu mensuel de l'utilisateur à partir de ses transactions
 * Powens, avec priorité à un éventuel montant saisi manuellement. La détection
 * elle-même est déléguée à la fonction pure `detectSalaryFromTransactions`
 * (cf. lib/detectSalary.ts) -- ce hook n'ajoute que le chargement des données
 * et la persistance de l'override manuel.
 */
export function useSalary(): UseSalaryResult {
  const { user } = useAuth();
  const userId = user?.id;

  const query = useQuery({
    queryKey: ["bank", "transactions"],
    queryFn: bankService.listTransactions,
    enabled: !!userId,
  });

  const [manualIncome, setManualIncomeState] = React.useState<number | null>(() =>
    readManualIncome(userId),
  );

  // L'utilisateur peut changer de compte sans démontage du hook (rare mais
  // possible) : on resynchronise l'override sur l'identité courante.
  React.useEffect(() => {
    setManualIncomeState(readManualIncome(userId));
  }, [userId]);

  const detected = React.useMemo<SalaryDetectionResult>(() => {
    if (!query.data) return EMPTY_SALARY;
    return detectSalaryFromTransactions(query.data);
  }, [query.data]);

  const setManualIncome = React.useCallback(
    (amount: number) => {
      if (!userId || !Number.isFinite(amount) || amount <= 0) return;
      window.localStorage.setItem(manualIncomeKey(userId), String(amount));
      setManualIncomeState(amount);
    },
    [userId],
  );

  const clearManualIncome = React.useCallback(() => {
    if (!userId) return;
    window.localStorage.removeItem(manualIncomeKey(userId));
    setManualIncomeState(null);
  }, [userId]);

  const salary: SalaryDetectionResult =
    manualIncome != null
      ? {
          ...detected,
          monthlyIncome: manualIncome,
          source: "manual",
          confidence: 1,
          needsReview: false,
        }
      : detected;

  return {
    salary,
    isLoading: query.isPending && !!userId,
    isError: query.isError,
    refetch: query.refetch,
    setManualIncome,
    clearManualIncome,
    isManual: manualIncome != null,
  };
}
