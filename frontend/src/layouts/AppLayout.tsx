import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { pageTransition } from "@/lib/motion";
import { usePremiumUpgradeListener } from "@/hooks/usePremiumUpgradeListener";

/** Thème clair et luxueux : structure plein-écran avec TopNavbar fixée,
 * contenu aéré et lumineux avec halos discrets en arrière-plan. */
export function AppLayout() {
  const { pathname } = useLocation();

  // Capte le retour de paiement Stripe quelle que soit la page authentifiée
  // sur laquelle il atterrit (cf. usePremiumUpgradeListener).
  usePremiumUpgradeListener();

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-luxury-bg">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-200/20 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-[450px] w-[450px] rounded-full bg-purple-200/15 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-amber-100/10 blur-[120px]" />
      </div>

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
    </div>
  );
}
