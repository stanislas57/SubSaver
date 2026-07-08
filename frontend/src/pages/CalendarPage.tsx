import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, ChevronLeft, ChevronRight, AlertTriangle, Wallet, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { RevealText } from "@/components/shared/RevealText";
import { BentoTile } from "@/components/shared/BentoTile";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatPrice, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Currency, Subscription } from "@/types";

/** Palette étendue partagée avec l'Analytique (mêmes teintes Luxe), assignée
 * dynamiquement par ordre d'apparition des catégories réellement présentes --
 * jamais une table statique par nom, qui devient incomplète dès qu'une
 * nouvelle catégorie apparaît (cf. AnalyticsPage.tsx pour l'historique complet
 * du bug que ce choix évite). */
const CATEGORY_COLOR_PALETTE = [
  "#0c3c6e", "#C5A059", "#2563eb", "#8b5cf6", "#0891b2", "#dc2626", "#059669",
  "#ea580c", "#7c3aed", "#0d9488", "#b45309", "#4338ca", "#be185d", "#65a30d",
  "#0369a1", "#92400e", "#6d28d9", "#0f766e", "#a16207", "#1e3a8a",
];
const FALLBACK_CATEGORY_COLOR = "#94a3b8";

type DayEvent = {
  id: string;
  subscriptionId: string;
  name: string;
  category: string;
  price: number;
  type: "billing" | "trial_end";
  date: string | null;
};

/** Déduplique par nom normalisé (display_name, déjà nettoyé côté serveur via
 * le moteur Clé Marchand) -- deux lignes bancaires brutes du même marchand
 * (ex: deux entrées "Prixtel" issues d'un historique pré-nettoyage) ne
 * doivent jamais apparaître deux fois dans le calendrier ni gonfler le total. */
function dedupeSubscriptions(subs: Subscription[]): Subscription[] {
  const seen = new Set<string>();
  const result: Subscription[] = [];
  for (const sub of subs) {
    const key = sub.display_name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(sub);
  }
  return result;
}

/** Génère les événements du mois affiché à partir des abonnements dédupliqués. */
function getMonthlyEvents(subscriptions: Subscription[], date: Date): Map<number, DayEvent[]> {
  const events = new Map<number, DayEvent[]>();

  for (const sub of subscriptions) {
    if (sub.billing_day && sub.billing_day >= 1 && sub.billing_day <= 31) {
      const dayEvents = events.get(sub.billing_day) || [];
      dayEvents.push({
        id: `${sub.id}-billing`,
        subscriptionId: sub.id,
        name: sub.display_name,
        category: sub.category,
        price: sub.price,
        type: "billing",
        date: null,
      });
      events.set(sub.billing_day, dayEvents);
    }

    if (sub.trial_end_date) {
      const trialDate = new Date(sub.trial_end_date);
      if (trialDate.getMonth() === date.getMonth() && trialDate.getFullYear() === date.getFullYear()) {
        const day = trialDate.getDate();
        const dayEvents = events.get(day) || [];
        dayEvents.push({
          id: `${sub.id}-trial`,
          subscriptionId: sub.id,
          name: sub.display_name,
          category: sub.category,
          price: sub.price,
          type: "trial_end",
          date: sub.trial_end_date,
        });
        events.set(day, dayEvents);
      }
    }
  }

  return events;
}

/** Génère un tableau du calendrier pour un mois donné. */
function getCalendarDays(date: Date): { weeks: (number | null)[][]; monthName: string; year: number } {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const monthName = firstDay.toLocaleDateString("fr-FR", { month: "long" });
  const startDate = firstDay.getDay();
  const dayOfWeek = startDate === 0 ? 6 : startDate - 1; // Ajuste pour lundi=0

  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(dayOfWeek).fill(null);

  for (let day = 1; day <= lastDay.getDate(); day++) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  while (week.length > 0 && week.length < 7) {
    week.push(null);
  }

  if (week.length > 0) {
    weeks.push(week);
  }

  return { weeks, monthName, year };
}

/** Fond pastel dérivé d'une couleur de catégorie (hex + alpha), cohérent avec
 * la teinte pleine utilisée par la légende et le détail au clic. */
function tint(hex: string, alpha: string): string {
  return `${hex}${alpha}`;
}

export function CalendarPage() {
  const { user } = useAuth();
  const currency: Currency = user?.currency ?? "EUR";
  const navigate = useNavigate();
  const subscriptionsQuery = useSubscriptions();
  const rawSubs = subscriptionsQuery.data ?? [];
  const subs = useMemo(() => dedupeSubscriptions(rawSubs), [rawSubs]);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const today = new Date();

  const { weeks, monthName, year } = useMemo(() => getCalendarDays(currentDate), [currentDate]);
  const events = useMemo(() => getMonthlyEvents(subs, currentDate), [subs, currentDate]);

  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  const todayDate = isCurrentMonth ? today.getDate() : null;

  // Une couleur distincte par catégorie réellement présente ce mois-ci,
  // assignée par ordre d'apparition -- jamais de collision entre 2 catégories.
  const categoryColorMap = useMemo(() => {
    const map = new Map<string, string>();
    let index = 0;
    for (const sub of subs) {
      const cat = sub.category || "Autre";
      if (!map.has(cat)) {
        map.set(cat, CATEGORY_COLOR_PALETTE[index % CATEGORY_COLOR_PALETTE.length]);
        index += 1;
      }
    }
    return map;
  }, [subs]);

  // Total à prélever ce mois-ci : uniquement les prélèvements (jamais les
  // fins d'essai, qui ne débitent rien), abonnements dédupliqués.
  const monthlyBillingTotal = useMemo(() => {
    return subs.filter((s) => s.billing_day >= 1 && s.billing_day <= 31).reduce((sum, s) => sum + s.price, 0);
  }, [subs]);
  const monthlyBillingCount = useMemo(
    () => subs.filter((s) => s.billing_day >= 1 && s.billing_day <= 31).length,
    [subs]
  );

  const goToPreviousMonth = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const selectedDayEvents = selectedDay ? events.get(selectedDay) ?? [] : [];

  // Vue liste (mobile) : tous les jours du mois qui ont un événement, triés.
  const upcomingDays = useMemo(
    () => Array.from(events.keys()).sort((a, b) => a - b),
    [events]
  );

  return (
    <div className="w-full px-6 py-8">
      <div className="mx-auto max-w-6xl">
        {/* En-tête */}
        <div className="mb-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-luxury-sapphire/10">
            <Calendar className="h-6 w-6 text-luxury-sapphire" />
          </div>
          <RevealText as="h1" className="break-words text-3xl font-black tracking-tight text-luxury-text sm:text-5xl lg:text-6xl">
            Calendrier des abonnements
          </RevealText>
          <RevealText className="mt-4 max-w-xl text-lg text-luxury-text-light">
            Visualise tes dates de prélèvement et les fins de périodes d'essai.
          </RevealText>
        </div>

        {/* Légende -- remontée en haut de page, avant la grille */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-xl border border-luxury-text/10 bg-white p-4">
            <div className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full bg-luxury-sapphire" />
            <div>
              <p className="font-semibold text-luxury-text">Prélèvements</p>
              <p className="text-sm text-luxury-text-light">Une couleur par catégorie de dépense</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-luxury-text/10 bg-white p-4">
            <div className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full bg-amber-500" />
            <div>
              <p className="font-semibold text-luxury-text">Essais gratuits</p>
              <p className="text-sm text-luxury-text-light">Dates d'expiration des périodes d'essai</p>
            </div>
          </div>
        </div>

        {/* Total à prélever ce mois-ci */}
        <BentoTile className="mb-6 flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-luxury-gold-soft text-luxury-gold-deep">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-luxury-text-light">Total à prélever ce mois-ci</p>
              <p className="text-xs text-luxury-text-light">{monthlyBillingCount} abonnement(s) actif(s)</p>
            </div>
          </div>
          <p className="text-3xl font-black text-luxury-text">{formatPrice(monthlyBillingTotal, currency)}</p>
        </BentoTile>

        {/* Grille du calendrier (desktop / tablette) */}
        <div className="hidden rounded-2xl border border-luxury-text/10 bg-luxury-card p-8 shadow-luxury sm:block">
          {/* Contrôles de mois */}
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold capitalize text-luxury-text">
              {monthName} {year}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="text-luxury-text-light hover:text-luxury-text"
              >
                Aujourd'hui
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Jours de la semaine */}
          <div className="mb-4 grid grid-cols-7 gap-3">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-luxury-text-light uppercase tracking-wide">
                {day}
              </div>
            ))}
          </div>

          {/* Grille des jours */}
          <div className="space-y-3">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 gap-3">
                {week.map((day, dayIdx) => {
                  const dayEvents = day ? events.get(day) : undefined;
                  const hasEvents = !!dayEvents && dayEvents.length > 0;
                  const isToday = day === todayDate;

                  return (
                    <button
                      type="button"
                      key={`${weekIdx}-${dayIdx}`}
                      disabled={!day || !hasEvents}
                      onClick={() => day && hasEvents && setSelectedDay(day)}
                      className={cn(
                        "min-h-[130px] rounded-xl p-3 text-left transition-all",
                        day === null && "bg-transparent",
                        day !== null && !hasEvents && !isToday && "border border-transparent bg-transparent",
                        day !== null && hasEvents && !isToday && "border border-luxury-text/10 bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md",
                        isToday && "border-2 border-luxury-sapphire bg-luxury-sapphire/5 ring-2 ring-luxury-sapphire/20"
                      )}
                    >
                      {day && (
                        <>
                          <div className="mb-2 flex items-center justify-between">
                            <p className={cn("text-base font-bold", isToday ? "text-luxury-sapphire" : "text-luxury-text")}>
                              {day}
                            </p>
                            {isToday && (
                              <span className="rounded-full bg-luxury-sapphire px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                                Auj.
                              </span>
                            )}
                          </div>
                          {hasEvents && (
                            <ul className="space-y-1.5">
                              {dayEvents!.slice(0, 3).map((event) => {
                                const color = event.type === "trial_end" ? "#d97706" : categoryColorMap.get(event.category) ?? FALLBACK_CATEGORY_COLOR;
                                return (
                                  <li
                                    key={event.id}
                                    className="flex items-center gap-1.5 truncate rounded-md px-1.5 py-1 text-xs font-medium"
                                    style={{ backgroundColor: tint(color, "1a"), color }}
                                  >
                                    {event.type === "trial_end" ? (
                                      <AlertTriangle className="h-3 w-3 shrink-0" />
                                    ) : (
                                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                                    )}
                                    <span className="truncate">{event.name}</span>
                                  </li>
                                );
                              })}
                              {dayEvents!.length > 3 && (
                                <li className="px-1.5 text-[11px] font-medium text-luxury-text-light">
                                  +{dayEvents!.length - 3} autre(s)
                                </li>
                              )}
                            </ul>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Vue liste (mobile) : évite l'écrasement des colonnes sur petit écran */}
        <div className="rounded-2xl border border-luxury-text/10 bg-luxury-card p-6 shadow-luxury sm:hidden">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold capitalize text-luxury-text">
              {monthName} {year}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {upcomingDays.length === 0 ? (
            <p className="py-8 text-center text-sm text-luxury-text-light">Aucun événement ce mois-ci.</p>
          ) : (
            <ul className="space-y-2">
              {upcomingDays.map((day) => {
                const dayEvents = events.get(day) ?? [];
                const isToday = day === todayDate;
                return (
                  <li key={day}>
                    <button
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                        isToday ? "border-luxury-sapphire bg-luxury-sapphire/5" : "border-luxury-text/10 bg-white"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg text-sm font-bold",
                          isToday ? "bg-luxury-sapphire text-white" : "bg-luxury-bg-soft text-luxury-text"
                        )}
                      >
                        {day}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-luxury-text">
                          {dayEvents.map((e) => e.name).join(", ")}
                        </p>
                        <p className="text-xs text-luxury-text-light">
                          {dayEvents.length} événement(s) {isToday && "· Aujourd'hui"}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-luxury-text-light" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Détail du jour sélectionné : montant exact, catégorie, lien vers l'abonnement */}
      <Dialog open={selectedDay !== null} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDay && `${selectedDay} ${monthName} ${year}`}
            </DialogTitle>
            <DialogDescription>
              {selectedDayEvents.length} événement(s) ce jour-là.
            </DialogDescription>
          </DialogHeader>

          <ul className="space-y-3">
            {selectedDayEvents.map((event) => {
              const color = event.type === "trial_end" ? "#d97706" : categoryColorMap.get(event.category) ?? FALLBACK_CATEGORY_COLOR;
              return (
                <li key={event.id} className="rounded-xl border border-slate-900/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      {event.type === "trial_end" ? (
                        <AlertTriangle className="h-4 w-4 shrink-0" style={{ color }} />
                      ) : (
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                      )}
                      <p className="truncate font-semibold text-luxury-text">{event.name}</p>
                    </div>
                    <p className="shrink-0 font-display text-base font-bold text-luxury-text">
                      {formatPrice(event.price, currency)}
                    </p>
                  </div>
                  <p className="mt-1.5 text-xs text-luxury-text-light">
                    {event.type === "trial_end"
                      ? `Fin d'essai le ${formatDate(event.date)} · ${event.category}`
                      : `Prélèvement mensuel · ${event.category}`}
                  </p>
                </li>
              );
            })}
          </ul>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDay(null)}>
              Fermer
            </Button>
            <Button onClick={() => navigate("/subscriptions")}>
              Voir mes abonnements <ArrowRight className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
