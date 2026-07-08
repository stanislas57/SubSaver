import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const AdminDrawer = DialogPrimitive.Root;
export const AdminDrawerTrigger = DialogPrimitive.Trigger;

/** Panneau latéral (Drawer) pour le Back-Office : glisse depuis la droite,
 * thème sombre technique (cohérent avec AdminLayout), distinct du composant
 * Dialog du site public. */
export function AdminDrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 transition-opacity duration-200 data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
      <DialogPrimitive.Content
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-900 text-slate-200 shadow-2xl transition-transform duration-300 ease-out focus:outline-none",
          "data-[state=closed]:translate-x-full data-[state=open]:translate-x-0",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm text-slate-500 transition-colors hover:text-slate-100">
          <X className="h-4 w-4" />
          <span className="sr-only">Fermer</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function AdminDrawerHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-slate-800 px-6 py-5", className)} {...props} />;
}

export function AdminDrawerTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title className={cn("text-base font-bold text-slate-100", className)} {...props} />
  );
}

export function AdminDrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("mt-1 text-xs text-slate-500", className)} {...props} />;
}

export function AdminDrawerBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 space-y-6 overflow-y-auto px-6 py-5", className)} {...props} />;
}

export function AdminDrawerFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex justify-end gap-2 border-t border-slate-800 px-6 py-4", className)} {...props} />
  );
}
