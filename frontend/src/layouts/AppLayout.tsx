import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { pageTransition } from "@/lib/motion";

export function AppLayout() {
  const { pathname } = useLocation();

  return (
    <div className="relative flex h-screen gap-4 overflow-hidden bg-bg-app p-4">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto rounded-3xl border border-border/60 bg-surface/60 p-8 shadow-lg backdrop-blur-xl">
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
    </div>
  );
}
