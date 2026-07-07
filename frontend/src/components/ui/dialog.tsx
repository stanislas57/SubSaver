import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

interface DialogContentProps extends React.ComponentProps<typeof DialogPrimitive.Content> {
  /** Masque la croix de fermeture -- utilisé pour les modales strictement
   * bloquantes (ex: CharterModal) qui ne doivent se fermer que via une
   * action métier explicite, jamais via un raccourci de fermeture générique. */
  hideCloseButton?: boolean;
}

/** Modale thème Luxe : carte blanche, fine bordure bleu nuit, filet doré en tête,
 * logo SubServer visible dans chaque pop-up. */
export function DialogContent({ className, children, hideCloseButton, ...props }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-luxury-night/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-900/10 border-t-2 border-t-luxury-gold bg-white p-8 shadow-luxury-lg focus:outline-none max-h-[85vh] overflow-y-auto",
          className
        )}
        {...props}
      >
        <img src="/logo.svg" alt="SubServer" className="mb-5 h-8 w-auto" />
        {children}
        {!hideCloseButton && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm text-luxury-text-light transition-colors hover:text-luxury-text">
            <X className="h-4 w-4" />
            <span className="sr-only">Fermer</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("font-display text-lg font-bold text-luxury-text", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-sm text-luxury-text-light mt-1", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-6 flex justify-end gap-3", className)} {...props} />;
}
