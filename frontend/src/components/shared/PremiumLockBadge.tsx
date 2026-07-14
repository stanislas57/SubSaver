import { AnimatePresence, motion } from "framer-motion";
import { Lock } from "lucide-react";

/** Badge cadenas superposé en coin haut-droit d'une BentoTile verrouillée --
 * extrait de PremiumPage.tsx où ce même bloc (AnimatePresence + motion.span)
 * était dupliqué à l'identique sur chaque tuile Premium/BtoB. */
export function PremiumLockBadge({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          initial={{ opacity: 0, scale: 0.5, rotate: 15 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.4, rotate: -20 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-luxury-night text-luxury-gold"
        >
          <Lock className="h-3.5 w-3.5" />
        </motion.span>
      )}
    </AnimatePresence>
  );
}
