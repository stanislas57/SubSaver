import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { pageTransition } from "@/lib/motion";

/** Structure plein-écran sans sidebar : navigation unique via TopNavbar (fixed),
 * contenu en pleine largeur organisé en sections par chaque page. */
export function AppLayout() {
  const { pathname } = useLocation();

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-canvas">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-[450px] w-[450px] rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[120px]" />
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
