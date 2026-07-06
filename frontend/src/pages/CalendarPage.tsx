import { useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { RevealText } from "@/components/shared/RevealText";
import { Button } from "@/components/ui/button";

type DayEvent = {
  id: string;
  name: string;
  type: "billing" | "trial_end";
  color: string;
};

/** Génère les événements pour un mois spécifique. */
function getMonthlyEvents(subscriptions: any[], date: Date): Map<number, DayEvent[]> {
  const events = new Map<number, DayEvent[]>();

  for (const sub of subscriptions) {
    // Événement de prélèvement : billing_day de chaque mois
    if (sub.billing_day && sub.billing_day >= 1 && sub.billing_day <= 31) {
      const dayEvents = events.get(sub.billing_day) || [];
      dayEvents.push({
        id: sub.id,
        name: sub.name,
        type: "billing",
        color: "bg-blue-100 text-blue-900",
      });
      events.set(sub.billing_day, dayEvents);
    }

    // Événement de fin d'essai : trial_end_date
    if (sub.trial_end_date) {
      const trialDate = new Date(sub.trial_end_date);
      if (trialDate.getMonth() === date.getMonth() && trialDate.getFullYear() === date.getFullYear()) {
        const day = trialDate.getDate();
        const dayEvents = events.get(day) || [];
        dayEvents.push({
          id: `trial-${sub.id}`,
          name: `${sub.name} (essai expire)`,
          type: "trial_end",
          color: "bg-amber-100 text-amber-900",
        });
        events.set(day, dayEvents);
      }
    }
  }

  return events;
}

/** Génère un tableau du calendrier pour un mois donné. */
function getCalendarDays(date: Date): {
  weeks: (number | null)[][];
  monthName: string;
  year: number;
} {
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

export function CalendarPage() {
  const { user } = useAuth();
  const subscriptionsQuery = useSubscriptions();
  const subs = subscriptionsQuery.data ?? [];

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const today = new Date();

  const { weeks, monthName, year } = useMemo(() => getCalendarDays(currentDate), [currentDate]);
  const events = useMemo(() => getMonthlyEvents(subs, currentDate), [subs, currentDate]);

  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  const todayDate = isCurrentMonth ? today.getDate() : null;

  const goToPreviousMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  return (
    <div className="w-full px-6 py-8">
      <div className="mx-auto max-w-6xl">
        {/* En-tête */}
        <div className="mb-12">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-luxury-sapphire/10">
            <Calendar className="h-6 w-6 text-luxury-sapphire" />
          </div>
          <RevealText as="h1" className="text-5xl font-black tracking-tight text-luxury-text sm:text-6xl">
            Calendrier des abonnements
          </RevealText>
          <RevealText className="mt-4 max-w-xl text-lg text-luxury-text-light">
            Visualise tes dates de prélèvement et les fins de périodes d'essai.
          </RevealText>
        </div>

        {/* Grille du calendrier */}
        <div className="rounded-2xl border border-luxury-text/10 bg-luxury-card p-8 shadow-luxury">
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
          <div className="mb-6 grid grid-cols-7 gap-3">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-semibold text-luxury-text-light uppercase tracking-wide"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grille des jours */}
          <div className="space-y-3">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 gap-3">
                {week.map((day, dayIdx) => {
                  const dayEvents = day ? events.get(day) : [];
                  const isToday = day === todayDate;

                  return (
                    <div
                      key={`${weekIdx}-${dayIdx}`}
                      className={`min-h-[140px] rounded-xl border-2 p-4 transition-all ${
                        day === null
                          ? "border-transparent bg-transparent"
                          : isToday
                            ? "border-luxury-sapphire bg-luxury-sapphire/5 ring-2 ring-luxury-sapphire/30"
                            : "border-luxury-text/10 bg-white hover:bg-luxury-bg-soft"
                      }`}
                    >
                      {day && (
                        <>
                          <p
                            className={`mb-3 text-base font-bold ${
                              isToday ? "text-luxury-sapphire" : "text-luxury-text"
                            }`}
                          >
                            {day}
                          </p>
                          {dayEvents && dayEvents.length > 0 && (
                            <ul className="space-y-2">
                              {dayEvents.map((event) => (
                                <li
                                  key={event.id}
                                  className={`rounded-lg px-2.5 py-2 text-xs font-medium ${event.color} flex items-start gap-1.5 line-clamp-2`}
                                >
                                  {event.type === "trial_end" && <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />}
                                  <span className="block">{event.name}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Légende */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex items-start gap-4 rounded-xl border border-luxury-text/10 bg-white p-4">
            <div className="mt-1 h-4 w-4 rounded bg-blue-100" />
            <div>
              <p className="font-semibold text-luxury-text">Prélèvements</p>
              <p className="text-sm text-luxury-text-light">Dates de facturation de tes abonnements</p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-xl border border-luxury-text/10 bg-white p-4">
            <div className="mt-1 h-4 w-4 rounded bg-amber-100" />
            <div>
              <p className="font-semibold text-luxury-text">Essais gratuits</p>
              <p className="text-sm text-luxury-text-light">Dates d'expiration des périodes d'essai</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
