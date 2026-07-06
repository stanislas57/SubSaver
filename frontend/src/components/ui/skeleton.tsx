import { cn } from "@/lib/utils";

/** Bloc de chargement thème Luxe : gris perle avec un léger reflet doré. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-gradient-to-r from-slate-100 via-luxury-gold-soft to-slate-100",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}
