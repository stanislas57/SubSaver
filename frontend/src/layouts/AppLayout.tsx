import * as React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { Footer } from "@/components/layout/Footer";
import { ContactModal } from "@/components/layout/ContactModal";
import { pageTransition } from "@/lib/motion";
import { PremiumWelcomeGate } from "@/components/shared/PremiumWelcomeGate";
import { GoalGate } from "@/components/shared/GoalGate";
import { BankConnectPromptGate } from "@/components/bank/BankConnectPromptGate";
import { useGateSequencer } from "@/hooks/useGateSequencer";
import { SubscriptionDetectionProvider } from "@/contexts/SubscriptionDetectionContext";

/** Ordre des pop-ups d'activation, un seul affiché à la fois (cf.
 * useGateSequencer) avec un court délai entre la fermeture de l'un et
 * l'ouverture du suivant -- avant, les trois pouvaient se déclencher
 * quasi simultanément et se superposer à la première connexion. */
const GATE_STEPS = ["premiumWelcome", "goal", "bankConnect"] as const;

/** Thème clair et luxueux : structure plein-écran avec TopNavbar fixée,
 * contenu aéré et lumineux avec halos discrets en arrière-plan. */
export function AppLayout() {
  const { pathname } = useLocation();
  const [showContact, setShowContact] = React.useState(false);
  const { current: activeGate, advance } = useGateSequencer(GATE_STEPS);

  return (
    // SubscriptionDetectionProvider isole le tunnel de détection
    // d'abonnements (cf. contexts/SubscriptionDetectionContext.tsx) : monté
    // ICI, au-dessus du <Outlet/> re-keyé par pathname ci-dessous, son état
    // survit à toute navigation dans l'app au lieu d'être remonté à chaque
    // fois que SubscriptionsPage l'est.
    <SubscriptionDetectionProvider>
      <div className="relative flex min-h-screen w-full flex-col bg-luxury-bg">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-200/20 blur-[120px]" />
          <div className="absolute right-0 top-1/3 h-[450px] w-[450px] rounded-full bg-purple-200/15 blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-amber-100/10 blur-[120px]" />
        </div>

        {/* File d'attente des pop-ups d'activation (cf. useGateSequencer) :
         * bienvenue Premium (retour Stripe) -> objectif -> connexion bancaire.
         * Un seul actif à la fois, jamais deux superposés. */}
        <PremiumWelcomeGate active={activeGate === "premiumWelcome"} onSettled={advance} />
        <GoalGate active={activeGate === "goal"} onSettled={advance} />
        <BankConnectPromptGate active={activeGate === "bankConnect"} onSettled={advance} />

        <TopNavbar />

        <main className="flex-1 pt-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={pageTransition.initial}
              animate={pageTransition.animate}
              exit={pageTransition.exit}
              transition={pageTransition.transition}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        <Footer onContactClick={() => setShowContact(true)} />

        <ContactModal open={showContact} onOpenChange={setShowContact} />
      </div>
    </SubscriptionDetectionProvider>
  );
}
